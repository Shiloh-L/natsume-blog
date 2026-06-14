package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.dto.BookmarkStatusVO;
import com.natsume.blog.content.dto.PostVO;
import com.natsume.blog.content.entity.Bookmark;
import com.natsume.blog.content.entity.Post;
import com.natsume.blog.content.mapper.BookmarkMapper;
import com.natsume.blog.content.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 文章收藏（藏书阁）。
 * 为演示中间件深度，用户的收藏文章ID集合以 Redis Set 做缓存（Cache-Aside）：
 *  - 读取收藏态走 Redis Set 的 O(1) 成员判断；缓存未命中时回源 DB 重建。
 *  - 空集合用占位成员避免缓存穿透。
 */
@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkMapper bookmarkMapper;
    private final PostMapper postMapper;
    private final PostService postService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String BM_USER_PREFIX = "blog:bookmark:user:";
    private static final String EMPTY_PLACEHOLDER = "__init__";
    private static final Duration BM_TTL = Duration.ofHours(6);

    private String key(Long userId) {
        return BM_USER_PREFIX + userId;
    }

    /** 缓存未命中时从 DB 重建用户收藏集合 */
    private void warmCache(Long userId) {
        String k = key(userId);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(k))) {
            return;
        }
        List<Bookmark> rows = bookmarkMapper.selectList(new LambdaQueryWrapper<Bookmark>()
                .eq(Bookmark::getUserId, userId));
        // 占位成员保证空集合也能被缓存，避免缓存穿透
        redisTemplate.opsForSet().add(k, EMPTY_PLACEHOLDER);
        for (Bookmark b : rows) {
            redisTemplate.opsForSet().add(k, String.valueOf(b.getPostId()));
        }
        redisTemplate.expire(k, BM_TTL);
    }

    public boolean isBookmarked(Long userId, Long postId) {
        if (userId == null) {
            return false;
        }
        warmCache(userId);
        return Boolean.TRUE.equals(redisTemplate.opsForSet()
                .isMember(key(userId), String.valueOf(postId)));
    }

    /** 收藏/取消收藏，返回当前是否已收藏 */
    @Transactional(rollbackFor = Exception.class)
    public boolean toggle(Long postId, LoginUser user) {
        requireLogin(user);
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException("文章不存在");
        }
        Bookmark existing = bookmarkMapper.selectOne(new LambdaQueryWrapper<Bookmark>()
                .eq(Bookmark::getUserId, user.getUserId())
                .eq(Bookmark::getPostId, postId));
        String k = key(user.getUserId());
        if (existing != null) {
            bookmarkMapper.deleteById(existing.getId());
            if (Boolean.TRUE.equals(redisTemplate.hasKey(k))) {
                redisTemplate.opsForSet().remove(k, String.valueOf(postId));
            }
            return false;
        }
        Bookmark bm = new Bookmark();
        bm.setUserId(user.getUserId());
        bm.setPostId(postId);
        bookmarkMapper.insert(bm);
        warmCache(user.getUserId());
        redisTemplate.opsForSet().add(k, String.valueOf(postId));
        return true;
    }

    public BookmarkStatusVO status(Long postId, LoginUser user) {
        BookmarkStatusVO vo = new BookmarkStatusVO();
        vo.setCount(bookmarkMapper.selectCount(new LambdaQueryWrapper<Bookmark>()
                .eq(Bookmark::getPostId, postId)));
        vo.setBookmarked(user != null && isBookmarked(user.getUserId(), postId));
        return vo;
    }

    /** 我的藏书阁：分页返回收藏的文章（按收藏时间倒序） */
    public PageResult<PostVO> myBookmarks(LoginUser user, long current, long size) {
        requireLogin(user);
        Page<Bookmark> page = new Page<>(current, size);
        Page<Bookmark> result = bookmarkMapper.selectPage(page, new LambdaQueryWrapper<Bookmark>()
                .eq(Bookmark::getUserId, user.getUserId())
                .orderByDesc(Bookmark::getCreateTime));
        List<Long> postIds = result.getRecords().stream()
                .map(Bookmark::getPostId).collect(Collectors.toList());
        if (postIds.isEmpty()) {
            return PageResult.of(Collections.emptyList(), result.getTotal(), current, size);
        }
        Map<Long, Post> posts = postMapper.selectBatchIds(postIds).stream()
                .collect(Collectors.toMap(Post::getId, p -> p));
        List<PostVO> vos = postIds.stream()
                .map(posts::get)
                .filter(Objects::nonNull)
                .map(postService::toListVO)
                .collect(Collectors.toList());
        return PageResult.of(vos, result.getTotal(), result.getCurrent(), result.getSize());
    }

    private void requireLogin(LoginUser user) {
        if (user == null || user.getUserId() == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
    }
}
