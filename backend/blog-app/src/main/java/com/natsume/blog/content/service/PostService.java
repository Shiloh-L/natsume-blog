package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.dto.PostFormDTO;
import com.natsume.blog.content.dto.PostQueryDTO;
import com.natsume.blog.content.dto.PostVO;
import com.natsume.blog.content.entity.Category;
import com.natsume.blog.content.entity.Post;
import com.natsume.blog.content.entity.Tag;
import com.natsume.blog.content.mapper.CategoryMapper;
import com.natsume.blog.content.mapper.PostMapper;
import com.natsume.blog.content.mapper.PostTagMapper;
import com.natsume.blog.content.mapper.TagMapper;
import com.natsume.blog.content.mq.PostEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import com.natsume.blog.common.constant.SecurityConstants;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;
    private final PostTagMapper postTagMapper;
    private final PostEventPublisher eventPublisher;
    private final RedisTemplate<String, Object> redisTemplate;
    private final com.github.benmanes.caffeine.cache.Cache<Long, PostVO> postLocalCache;
    private final com.natsume.blog.content.mq.ViewEventProducer viewEventProducer;
    private final UserResolver userResolver;

    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    public PageResult<PostVO> pagePosts(PostQueryDTO query) {
        Page<Post> page = new Page<>(query.getCurrent(), query.getSize());
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();

        if (query.getTagId() != null) {
            List<Long> ids = postTagPostIds(query.getTagId());
            if (ids.isEmpty()) {
                return PageResult.empty(query.getCurrent(), query.getSize());
            }
            wrapper.in(Post::getId, ids);
        }
        wrapper.eq(query.getCategoryId() != null, Post::getCategoryId, query.getCategoryId());
        wrapper.eq(Post::getStatus, query.getStatus() == null ? 1 : query.getStatus());
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w.like(Post::getTitle, query.getKeyword())
                    .or().like(Post::getSummary, query.getKeyword()));
        }
        wrapper.orderByDesc(Post::getIsTop).orderByDesc(Post::getCreateTime);

        Page<Post> result = postMapper.selectPage(page, wrapper);
        List<PostVO> vos = toListVOs(result.getRecords());
        return PageResult.of(vos, result.getTotal(), result.getCurrent(), result.getSize());
    }

    public PageResult<PostVO> pageMyPosts(Long authorId, long current, long size) {
        Page<Post> page = new Page<>(com.natsume.blog.common.utils.PageUtil.clampCurrent(current),
                com.natsume.blog.common.utils.PageUtil.clampSize(size));
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Post::getAuthorId, authorId).orderByDesc(Post::getCreateTime);
        Page<Post> result = postMapper.selectPage(page, wrapper);
        List<PostVO> vos = toListVOs(result.getRecords());
        return PageResult.of(vos, result.getTotal(), result.getCurrent(), result.getSize());
    }

    private List<Long> postTagPostIds(Long tagId) {
        return postMapper.selectObjs(new LambdaQueryWrapper<Post>()
                        .apply("id IN (SELECT post_id FROM t_post_tag WHERE tag_id = {0})", tagId)
                        .select(Post::getId))
                .stream().map(o -> Long.valueOf(o.toString())).collect(Collectors.toList());
    }

    public PostVO getDetail(Long id) {
        // L1: Caffeine 本地缓存
        PostVO local = postLocalCache.getIfPresent(id);
        if (local != null) {
            return recordView(local);
        }
        // L2: Redis 分布式缓存
        String cacheKey = SecurityConstants.POST_CACHE_PREFIX + id;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof PostVO vo) {
            postLocalCache.put(id, vo);
            return recordView(vo);
        }
        // DB
        Post post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        PostVO vo = toVO(post, true);
        redisTemplate.opsForValue().set(cacheKey, vo, CACHE_TTL);
        postLocalCache.put(id, vo);
        return recordView(vo);
    }

    private PostVO recordView(PostVO vo) {
        // 高频浏览量经 Kafka 异步聚合落库；同时在内存中自增，保证展示实时性
        vo.setViewCount((vo.getViewCount() == null ? 0L : vo.getViewCount()) + 1);
        viewEventProducer.publishViewed(vo.getId(), null);
        return vo;
    }

    @Transactional(rollbackFor = Exception.class)
    public Long create(PostFormDTO form, LoginUser user) {
        requireLogin(user);
        Post post = new Post();
        BeanUtils.copyProperties(form, post);
        post.setAuthorId(user.getUserId());
        post.setAuthorName(user.getUsername());
        post.setViewCount(0L);
        post.setLikeCount(0L);
        post.setCommentCount(0L);
        postMapper.insert(post);
        saveTags(post.getId(), form.getTagIds());
        publishIndex(post);
        return post.getId();
    }

    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, PostFormDTO form, LoginUser user) {
        Post post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        checkOwner(post, user);
        BeanUtils.copyProperties(form, post, "id", "authorId", "authorName");
        postMapper.updateById(post);
        postTagMapper.deleteByPostId(id);
        saveTags(id, form.getTagIds());
        evictCache(id);
        publishIndex(post);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, LoginUser user) {
        Post post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        checkOwner(post, user);
        postMapper.deleteById(id);
        postTagMapper.deleteByPostId(id);
        evictCache(id);
        eventPublisher.publishDelete(id);
    }

    public void like(Long id) {
        postMapper.incrLike(id);
        evictCache(id);
    }

    public List<PostIndexEvent> allIndexEvents() {
        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<Post>().eq(Post::getStatus, 1));
        if (posts.isEmpty()) {
            return new ArrayList<>();
        }
        // 批量分类
        List<Long> categoryIds = posts.stream().map(Post::getCategoryId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        Map<Long, String> categoryNames = categoryIds.isEmpty() ? Map.of()
                : categoryMapper.selectBatchIds(categoryIds).stream()
                        .collect(Collectors.toMap(Category::getId, Category::getName));
        // 批量标签名（按 postId 分组）
        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Long, List<String>> tagNamesByPost = new java.util.HashMap<>();
        List<Map<String, Object>> pairs = postTagMapper.selectPairs(postIds);
        if (!pairs.isEmpty()) {
            List<Long> tagIds = pairs.stream()
                    .map(p -> ((Number) p.get("tagId")).longValue()).distinct().collect(Collectors.toList());
            Map<Long, String> tagNameMap = tagMapper.selectBatchIds(tagIds).stream()
                    .collect(Collectors.toMap(Tag::getId, Tag::getName));
            for (Map<String, Object> pair : pairs) {
                Long pid = ((Number) pair.get("postId")).longValue();
                String tn = tagNameMap.get(((Number) pair.get("tagId")).longValue());
                if (tn != null) {
                    tagNamesByPost.computeIfAbsent(pid, k -> new ArrayList<>()).add(tn);
                }
            }
        }
        List<PostIndexEvent> events = new ArrayList<>();
        for (Post post : posts) {
            PostIndexEvent event = new PostIndexEvent();
            BeanUtils.copyProperties(post, event);
            event.setCategoryName(post.getCategoryId() == null ? null : categoryNames.get(post.getCategoryId()));
            event.setTags(tagNamesByPost.getOrDefault(post.getId(), List.of()));
            events.add(event);
        }
        return events;
    }

    /** 文章归档：所有已发布文章，按发布时间倒序，轻量字段（供时间线展示，前端按年月分组） */
    public List<com.natsume.blog.content.dto.ArchiveItemVO> archive() {
        List<Post> posts = postMapper.selectList(new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, 1)
                .orderByDesc(Post::getCreateTime));
        if (posts.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        Map<Long, String> categoryNames = categoryMapper.selectList(null).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
        return posts.stream().map(post -> {
            com.natsume.blog.content.dto.ArchiveItemVO vo = new com.natsume.blog.content.dto.ArchiveItemVO();
            vo.setId(post.getId());
            vo.setTitle(post.getTitle());
            vo.setCreateTime(post.getCreateTime());
            vo.setCategoryName(post.getCategoryId() == null ? null : categoryNames.get(post.getCategoryId()));
            return vo;
        }).collect(Collectors.toList());
    }

    private void saveTags(Long postId, List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }
        tagIds.stream().distinct().forEach(tid -> postTagMapper.insert(postId, tid));
    }

    private void publishIndex(Post post) {
        PostIndexEvent event = new PostIndexEvent();
        BeanUtils.copyProperties(post, event);
        Category category = post.getCategoryId() == null ? null : categoryMapper.selectById(post.getCategoryId());
        event.setCategoryName(category == null ? null : category.getName());
        event.setTags(tagMapper.selectByPostId(post.getId()).stream().map(Tag::getName).collect(Collectors.toList()));
        eventPublisher.publishSave(event);
    }

    private void evictCache(Long id) {
        postLocalCache.invalidate(id);
        redisTemplate.delete(SecurityConstants.POST_CACHE_PREFIX + id);
    }

    /** 供其他服务（如关注流）复用的列表VO转换 */
    public PostVO toListVO(Post post) {
        return toVO(post, false);
    }

    /** 列表场景批量转换 VO：一次性预加载分类、标签、作者，避免逐条 N+1 */
    public List<PostVO> toListVOs(List<Post> posts) {
        if (posts.isEmpty()) {
            return new ArrayList<>();
        }
        // 1) 批量分类
        List<Long> categoryIds = posts.stream().map(Post::getCategoryId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        Map<Long, String> categoryNames = categoryIds.isEmpty() ? Map.of()
                : categoryMapper.selectBatchIds(categoryIds).stream()
                        .collect(Collectors.toMap(Category::getId, Category::getName));
        // 2) 批量作者（UserResolver 本身支持批量 + 缓存）
        List<Long> authorIds = posts.stream().map(Post::getAuthorId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
        Map<Long, com.natsume.blog.common.dto.UserBrief> authors = userResolver.resolve(authorIds);
        // 3) 批量标签：先取关系对，再批量取标签，按 postId 分组
        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        Map<Long, List<Tag>> tagsByPost = new java.util.HashMap<>();
        List<Map<String, Object>> pairs = postTagMapper.selectPairs(postIds);
        if (!pairs.isEmpty()) {
            List<Long> tagIds = pairs.stream()
                    .map(p -> ((Number) p.get("tagId")).longValue()).distinct().collect(Collectors.toList());
            Map<Long, Tag> tagMap = tagMapper.selectBatchIds(tagIds).stream()
                    .collect(Collectors.toMap(Tag::getId, t -> t));
            for (Map<String, Object> pair : pairs) {
                Long pid = ((Number) pair.get("postId")).longValue();
                Long tid = ((Number) pair.get("tagId")).longValue();
                Tag tag = tagMap.get(tid);
                if (tag != null) {
                    tagsByPost.computeIfAbsent(pid, k -> new ArrayList<>()).add(tag);
                }
            }
        }
        return posts.stream().map(post -> {
            PostVO vo = new PostVO();
            BeanUtils.copyProperties(post, vo);
            vo.setContent(null);
            if (post.getCategoryId() != null) {
                vo.setCategoryName(categoryNames.get(post.getCategoryId()));
            }
            com.natsume.blog.common.dto.UserBrief author = authors.get(post.getAuthorId());
            if (author != null && author.getNickname() != null) {
                vo.setAuthorName(author.getNickname());
            }
            vo.setTags(tagsByPost.getOrDefault(post.getId(), List.of()));
            return vo;
        }).collect(Collectors.toList());
    }

    private PostVO toVO(Post post, boolean withContent) {
        PostVO vo = new PostVO();
        BeanUtils.copyProperties(post, vo);
        if (!withContent) {
            vo.setContent(null);
        }
        if (post.getCategoryId() != null) {
            Category category = categoryMapper.selectById(post.getCategoryId());
            vo.setCategoryName(category == null ? null : category.getName());
        }
        // 作者昵称/头像读取时实时解析（修正历史数据里存的登录名，并随用户改资料更新）
        com.natsume.blog.common.dto.UserBrief author =
                userResolver.resolve(java.util.List.of(post.getAuthorId())).get(post.getAuthorId());
        if (author != null && author.getNickname() != null) {
            vo.setAuthorName(author.getNickname());
        }
        vo.setTags(tagMapper.selectByPostId(post.getId()));
        return vo;
    }

    private void requireLogin(LoginUser user) {
        if (user == null || user.getUserId() == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
    }

    private void checkOwner(Post post, LoginUser user) {
        requireLogin(user);
        boolean admin = ROLE_ADMIN.equals(user.getRole());
        if (!admin && !Objects.equals(post.getAuthorId(), user.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
    }
}
