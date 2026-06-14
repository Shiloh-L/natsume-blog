package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.dto.MomentCommentFormDTO;
import com.natsume.blog.content.dto.MomentCommentVO;
import com.natsume.blog.content.dto.MomentFormDTO;
import com.natsume.blog.content.dto.MomentVO;
import com.natsume.blog.content.entity.Moment;
import com.natsume.blog.content.entity.MomentComment;
import com.natsume.blog.content.entity.MomentLike;
import com.natsume.blog.content.mapper.MomentCommentMapper;
import com.natsume.blog.content.mapper.MomentLikeMapper;
import com.natsume.blog.content.mapper.MomentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MomentService {

    private final MomentMapper momentMapper;
    private final MomentLikeMapper likeMapper;
    private final MomentCommentMapper commentMapper;
    private final UserResolver userResolver;
    private final com.natsume.blog.content.mq.NotificationProducer notificationProducer;

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    public PageResult<MomentVO> page(long current, long size, LoginUser user) {
        Page<Moment> page = new Page<>(com.natsume.blog.common.utils.PageUtil.clampCurrent(current),
                com.natsume.blog.common.utils.PageUtil.clampSize(size));
        Page<Moment> result = momentMapper.selectPage(page,
                new LambdaQueryWrapper<Moment>().orderByDesc(Moment::getCreateTime));
        List<Moment> moments = result.getRecords();
        if (moments.isEmpty()) {
            return PageResult.of(Collections.emptyList(), result.getTotal(), current, size);
        }
        List<Long> ids = moments.stream().map(Moment::getId).collect(Collectors.toList());

        // 批量取点赞
        List<MomentLike> likes = likeMapper.selectList(
                new LambdaQueryWrapper<MomentLike>().in(MomentLike::getMomentId, ids));
        Map<Long, List<MomentLike>> likeMap = likes.stream()
                .collect(Collectors.groupingBy(MomentLike::getMomentId));

        // 批量取评论
        List<MomentComment> comments = commentMapper.selectList(
                new LambdaQueryWrapper<MomentComment>().in(MomentComment::getMomentId, ids)
                        .orderByAsc(MomentComment::getCreateTime));
        Map<Long, List<MomentComment>> commentMap = comments.stream()
                .collect(Collectors.groupingBy(MomentComment::getMomentId));

        // 实时解析所有涉及用户的昵称/头像（动态作者 + 评论者 + 点赞者）
        Set<Long> allUserIds = new java.util.HashSet<>();
        moments.forEach(m -> allUserIds.add(m.getUserId()));
        comments.forEach(c -> { allUserIds.add(c.getUserId()); allUserIds.add(c.getReplyToId()); });
        likes.forEach(l -> allUserIds.add(l.getUserId()));
        Map<Long, UserBrief> userMap = userResolver.resolve(allUserIds);

        Long uid = user == null ? null : user.getUserId();
        List<MomentVO> vos = moments.stream().map(m -> {
            MomentVO vo = new MomentVO();
            BeanUtils.copyProperties(m, vo);
            applyUser(vo, userMap.get(m.getUserId()));
            List<MomentLike> ml = likeMap.getOrDefault(m.getId(), Collections.emptyList());
            vo.setLikeUsers(ml.stream()
                    .map(l -> nameOf(userMap.get(l.getUserId()), l.getUserName()))
                    .collect(Collectors.toList()));
            vo.setLiked(uid != null && ml.stream().anyMatch(l -> Objects.equals(l.getUserId(), uid)));
            vo.setComments(commentMap.getOrDefault(m.getId(), Collections.emptyList()).stream()
                    .map(c -> toCommentVO(c, userMap)).collect(Collectors.toList()));
            return vo;
        }).collect(Collectors.toList());

        return PageResult.of(vos, result.getTotal(), current, size);
    }

    private void applyUser(MomentVO vo, UserBrief b) {
        if (b != null) {
            if (b.getNickname() != null) vo.setUserName(b.getNickname());
            if (b.getAvatar() != null) vo.setUserAvatar(b.getAvatar());
        }
    }

    private String nameOf(UserBrief b, String fallback) {
        return b != null && b.getNickname() != null ? b.getNickname() : fallback;
    }

    public Long create(MomentFormDTO form, LoginUser user) {
        requireLogin(user);
        boolean noText = !StringUtils.hasText(form.getContent());
        boolean noImg = form.getImages() == null || form.getImages().isEmpty();
        if (noText && noImg) {
            throw new BusinessException("说点什么或配几张图吧～");
        }
        Moment moment = new Moment();
        moment.setUserId(user.getUserId());
        moment.setUserName(user.getUsername());
        moment.setUserAvatar("https://picsum.photos/seed/" + user.getUserId() + "/100/100");
        moment.setContent(form.getContent());
        moment.setImages(form.getImages());
        moment.setLocation(form.getLocation());
        moment.setLikeCount(0);
        moment.setCommentCount(0);
        momentMapper.insert(moment);
        return moment.getId();
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, LoginUser user) {
        Moment moment = momentMapper.selectById(id);
        if (moment == null) {
            return;
        }
        requireLogin(user);
        boolean admin = ROLE_ADMIN.equals(user.getRole());
        if (!admin && !Objects.equals(moment.getUserId(), user.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        momentMapper.deleteById(id);
        likeMapper.delete(new LambdaQueryWrapper<MomentLike>().eq(MomentLike::getMomentId, id));
        commentMapper.delete(new LambdaQueryWrapper<MomentComment>().eq(MomentComment::getMomentId, id));
    }

    /** 点赞/取消点赞，返回当前是否已赞 */
    @Transactional(rollbackFor = Exception.class)
    public boolean toggleLike(Long momentId, LoginUser user) {
        requireLogin(user);
        if (momentMapper.selectById(momentId) == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        MomentLike existing = likeMapper.selectOne(new LambdaQueryWrapper<MomentLike>()
                .eq(MomentLike::getMomentId, momentId)
                .eq(MomentLike::getUserId, user.getUserId()));
        if (existing != null) {
            likeMapper.deleteById(existing.getId());
            momentMapper.incrLike(momentId, -1);
            return false;
        }
        MomentLike like = new MomentLike();
        like.setMomentId(momentId);
        like.setUserId(user.getUserId());
        like.setUserName(user.getUsername());
        likeMapper.insert(like);
        momentMapper.incrLike(momentId, 1);
        // 通知动态作者
        Moment moment = momentMapper.selectById(momentId);
        if (moment != null) {
            notificationProducer.publish(com.natsume.blog.content.mq.NotificationEvent.builder()
                    .recipientId(moment.getUserId())
                    .actorId(user.getUserId())
                    .actorName(user.getUsername())
                    .type("MOMENT_LIKE")
                    .targetType("MOMENT")
                    .targetId(momentId)
                    .excerpt(null)
                    .build());
        }
        return true;
    }

    @Transactional(rollbackFor = Exception.class)
    public MomentCommentVO comment(MomentCommentFormDTO form, LoginUser user) {
        requireLogin(user);
        if (momentMapper.selectById(form.getMomentId()) == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }
        MomentComment c = new MomentComment();
        c.setMomentId(form.getMomentId());
        c.setUserId(user.getUserId());
        c.setUserName(user.getUsername());
        c.setUserAvatar("https://picsum.photos/seed/" + user.getUserId() + "/100/100");

        // 两级嵌套：回复某条评论时，归入其主楼(rootId)，并记录被回复者
        if (form.getReplyCommentId() != null && form.getReplyCommentId() > 0) {
            MomentComment target = commentMapper.selectById(form.getReplyCommentId());
            if (target == null || !Objects.equals(target.getMomentId(), form.getMomentId())) {
                throw new BusinessException(ResultCode.NOT_FOUND);
            }
            Long root = (target.getRootId() == null || target.getRootId() == 0)
                    ? target.getId() : target.getRootId();
            c.setRootId(root);
            c.setReplyToId(target.getUserId());
            c.setReplyToName(target.getUserName());
        } else {
            c.setRootId(0L);
            c.setReplyToId(0L);
        }
        c.setContent(form.getContent());
        commentMapper.insert(c);
        momentMapper.incrComment(form.getMomentId(), 1);

        Moment moment = momentMapper.selectById(form.getMomentId());
        // 回复评论 -> 通知被回复者
        if (c.getReplyToId() != null && c.getReplyToId() > 0) {
            notificationProducer.publish(com.natsume.blog.content.mq.NotificationEvent.builder()
                    .recipientId(c.getReplyToId())
                    .actorId(user.getUserId())
                    .actorName(user.getUsername())
                    .type("MOMENT_REPLY")
                    .targetType("MOMENT")
                    .targetId(form.getMomentId())
                    .excerpt(c.getContent())
                    .build());
        }
        // 评论动态 -> 通知动态作者（避免与被回复者重复）
        if (moment != null && !Objects.equals(moment.getUserId(), c.getReplyToId())) {
            notificationProducer.publish(com.natsume.blog.content.mq.NotificationEvent.builder()
                    .recipientId(moment.getUserId())
                    .actorId(user.getUserId())
                    .actorName(user.getUsername())
                    .type("MOMENT_COMMENT")
                    .targetType("MOMENT")
                    .targetId(form.getMomentId())
                    .excerpt(c.getContent())
                    .build());
        }

        Map<Long, UserBrief> um = userResolver.resolve(
                java.util.Arrays.asList(c.getUserId(), c.getReplyToId()));
        return toCommentVO(c, um);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteComment(Long id, LoginUser user) {
        MomentComment c = commentMapper.selectById(id);
        if (c == null) {
            return;
        }
        requireLogin(user);
        boolean admin = ROLE_ADMIN.equals(user.getRole());
        if (!admin && !Objects.equals(c.getUserId(), user.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        commentMapper.deleteById(id);
        momentMapper.incrComment(c.getMomentId(), -1);
    }

    private MomentCommentVO toCommentVO(MomentComment c, Map<Long, UserBrief> userMap) {
        MomentCommentVO vo = new MomentCommentVO();
        BeanUtils.copyProperties(c, vo);
        UserBrief author = userMap.get(c.getUserId());
        if (author != null) {
            if (author.getNickname() != null) vo.setUserName(author.getNickname());
            if (author.getAvatar() != null) vo.setUserAvatar(author.getAvatar());
        }
        if (c.getReplyToId() != null && c.getReplyToId() > 0) {
            UserBrief target = userMap.get(c.getReplyToId());
            if (target != null && target.getNickname() != null) {
                vo.setReplyToName(target.getNickname());
            }
        }
        return vo;
    }

    private void requireLogin(LoginUser user) {
        if (user == null || user.getUserId() == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
    }
}
