package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.dto.FollowStatsVO;
import com.natsume.blog.content.dto.FollowUserVO;
import com.natsume.blog.content.dto.PostVO;
import com.natsume.blog.content.entity.Follow;
import com.natsume.blog.content.entity.Post;
import com.natsume.blog.content.mapper.FollowMapper;
import com.natsume.blog.content.mapper.PostMapper;
import com.natsume.blog.content.mq.NotificationEvent;
import com.natsume.blog.content.mq.NotificationProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowMapper followMapper;
    private final PostMapper postMapper;
    private final UserResolver userResolver;
    private final NotificationProducer notificationProducer;
    private final PostService postService;

    /** 关注/取消关注，返回当前是否已关注 */
    @Transactional(rollbackFor = Exception.class)
    public boolean toggle(Long followeeId, LoginUser user) {
        requireLogin(user);
        if (Objects.equals(followeeId, user.getUserId())) {
            throw new BusinessException("不能关注自己哦");
        }
        Follow existing = followMapper.selectOne(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, user.getUserId())
                .eq(Follow::getFolloweeId, followeeId));
        if (existing != null) {
            followMapper.deleteById(existing.getId());
            return false;
        }
        Follow follow = new Follow();
        follow.setFollowerId(user.getUserId());
        follow.setFolloweeId(followeeId);
        followMapper.insert(follow);
        // 关注通知
        notificationProducer.publish(NotificationEvent.builder()
                .recipientId(followeeId)
                .actorId(user.getUserId())
                .actorName(user.getUsername())
                .type("FOLLOW")
                .targetType("USER")
                .targetId(user.getUserId())
                .excerpt(null)
                .build());
        return true;
    }

    public FollowStatsVO stats(Long userId, LoginUser current) {
        FollowStatsVO vo = new FollowStatsVO();
        vo.setFollowers(followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFolloweeId, userId)));
        vo.setFollowing(followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, userId)));
        if (current != null && current.getUserId() != null) {
            vo.setFollowed(followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                    .eq(Follow::getFollowerId, current.getUserId())
                    .eq(Follow::getFolloweeId, userId)) > 0);
        }
        return vo;
    }

    /** 粉丝列表 */
    public List<FollowUserVO> followers(Long userId, LoginUser current) {
        List<Long> ids = followMapper.selectList(new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFolloweeId, userId).orderByDesc(Follow::getCreateTime))
                .stream().map(Follow::getFollowerId).collect(Collectors.toList());
        return toUserVOs(ids, current);
    }

    /** 关注列表 */
    public List<FollowUserVO> following(Long userId, LoginUser current) {
        List<Long> ids = followMapper.selectList(new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, userId).orderByDesc(Follow::getCreateTime))
                .stream().map(Follow::getFolloweeId).collect(Collectors.toList());
        return toUserVOs(ids, current);
    }

    /** 关注流：我关注的人的最新文章 */
    public PageResult<PostVO> feed(LoginUser user, long current, long size) {
        requireLogin(user);
        List<Long> followeeIds = followMapper.selectList(new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, user.getUserId()))
                .stream().map(Follow::getFolloweeId).collect(Collectors.toList());
        if (followeeIds.isEmpty()) {
            return PageResult.of(Collections.emptyList(), 0, current, size);
        }
        Page<Post> page = new Page<>(com.natsume.blog.common.utils.PageUtil.clampCurrent(current),
                com.natsume.blog.common.utils.PageUtil.clampSize(size));
        Page<Post> result = postMapper.selectPage(page, new LambdaQueryWrapper<Post>()
                .in(Post::getAuthorId, followeeIds)
                .eq(Post::getStatus, 1)
                .orderByDesc(Post::getCreateTime));
        List<PostVO> vos = postService.toListVOs(result.getRecords());
        return PageResult.of(vos, result.getTotal(), result.getCurrent(), result.getSize());
    }

    private List<FollowUserVO> toUserVOs(List<Long> ids, LoginUser current) {
        if (ids.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, UserBrief> users = userResolver.resolve(ids);
        // 当前用户关注了哪些人
        Set<Long> myFollowing = current == null ? Collections.emptySet()
                : followMapper.selectList(new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, current.getUserId())
                        .in(Follow::getFolloweeId, ids))
                .stream().map(Follow::getFolloweeId).collect(Collectors.toSet());
        return ids.stream().map(id -> {
            FollowUserVO vo = new FollowUserVO();
            vo.setUserId(id);
            UserBrief b = users.get(id);
            vo.setUserName(b == null ? "用户" + id : b.getNickname());
            vo.setAvatar(b == null ? null : b.getAvatar());
            vo.setFollowed(myFollowing.contains(id));
            return vo;
        }).collect(Collectors.toList());
    }

    private void requireLogin(LoginUser user) {
        if (user == null || user.getUserId() == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
    }
}
