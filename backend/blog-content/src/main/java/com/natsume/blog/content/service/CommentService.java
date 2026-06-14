package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.exception.BusinessException;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.dto.CommentFormDTO;
import com.natsume.blog.content.dto.CommentVO;
import com.natsume.blog.content.entity.Comment;
import com.natsume.blog.content.entity.Post;
import com.natsume.blog.content.mapper.CommentMapper;
import com.natsume.blog.content.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;
    private final UserResolver userResolver;
    private final com.natsume.blog.content.mq.NotificationProducer notificationProducer;

    /** 返回二级评论树（作者昵称/头像在读取时实时解析） */
    public List<CommentVO> listByPost(Long postId) {
        List<Comment> all = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getPostId, postId)
                .orderByAsc(Comment::getCreateTime));

        Map<Long, UserBrief> users = userResolver.resolve(
                all.stream().map(Comment::getUserId).collect(Collectors.toList()));

        List<CommentVO> roots = new ArrayList<>();
        Map<Long, CommentVO> map = all.stream().map(c -> {
            CommentVO vo = new CommentVO();
            BeanUtils.copyProperties(c, vo);
            UserBrief b = users.get(c.getUserId());
            if (b != null) {
                if (b.getNickname() != null) vo.setUserName(b.getNickname());
                if (b.getAvatar() != null) vo.setUserAvatar(b.getAvatar());
            }
            return vo;
        }).collect(Collectors.toMap(CommentVO::getId, v -> v, (a, b) -> a, java.util.LinkedHashMap::new));

        for (CommentVO vo : map.values()) {
            if (vo.getParentId() == null || vo.getParentId() == 0L) {
                roots.add(vo);
            } else {
                CommentVO parent = map.get(vo.getParentId());
                if (parent != null) {
                    parent.getReplies().add(vo);
                } else {
                    roots.add(vo);
                }
            }
        }
        return roots;
    }

    @Transactional(rollbackFor = Exception.class)
    public Long create(CommentFormDTO form, LoginUser user) {
        if (user == null || user.getUserId() == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        Comment comment = new Comment();
        comment.setPostId(form.getPostId());
        comment.setParentId(form.getParentId() == null ? 0L : form.getParentId());
        comment.setUserId(user.getUserId());
        comment.setUserName(user.getUsername());
        comment.setContent(form.getContent());
        commentMapper.insert(comment);
        postMapper.incrComment(form.getPostId(), 1);
        sendNotifications(comment, user);
        return comment.getId();
    }

    private void sendNotifications(Comment comment, LoginUser actor) {
        String excerpt = comment.getContent();
        // 回复评论 -> 通知被回复者
        if (comment.getParentId() != null && comment.getParentId() > 0) {
            Comment parent = commentMapper.selectById(comment.getParentId());
            if (parent != null) {
                notificationProducer.publish(com.natsume.blog.content.mq.NotificationEvent.builder()
                        .recipientId(parent.getUserId())
                        .actorId(actor.getUserId())
                        .actorName(actor.getUsername())
                        .type("POST_REPLY")
                        .targetType("POST")
                        .targetId(comment.getPostId())
                        .excerpt(excerpt)
                        .build());
            }
        }
        // 评论文章 -> 通知文章作者（若作者不是被回复者本人，避免重复）
        Post post = postMapper.selectById(comment.getPostId());
        if (post != null) {
            boolean alreadyNotifiedAuthor = false;
            if (comment.getParentId() != null && comment.getParentId() > 0) {
                Comment parent = commentMapper.selectById(comment.getParentId());
                alreadyNotifiedAuthor = parent != null
                        && Objects.equals(parent.getUserId(), post.getAuthorId());
            }
            if (!alreadyNotifiedAuthor) {
                notificationProducer.publish(com.natsume.blog.content.mq.NotificationEvent.builder()
                        .recipientId(post.getAuthorId())
                        .actorId(actor.getUserId())
                        .actorName(actor.getUsername())
                        .type("POST_COMMENT")
                        .targetType("POST")
                        .targetId(comment.getPostId())
                        .excerpt(excerpt)
                        .build());
            }
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, LoginUser user) {
        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            return;
        }
        boolean admin = user != null && "ROLE_ADMIN".equals(user.getRole());
        if (!admin && (user == null || !Objects.equals(comment.getUserId(), user.getUserId()))) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        commentMapper.deleteById(id);
        postMapper.incrComment(comment.getPostId(), -1);
    }
}
