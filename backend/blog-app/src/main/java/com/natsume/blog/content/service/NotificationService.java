package com.natsume.blog.content.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.content.dto.NotificationVO;
import com.natsume.blog.content.entity.Moment;
import com.natsume.blog.content.entity.Notification;
import com.natsume.blog.content.entity.Post;
import com.natsume.blog.content.mapper.MomentMapper;
import com.natsume.blog.content.mapper.NotificationMapper;
import com.natsume.blog.content.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final PostMapper postMapper;
    private final MomentMapper momentMapper;
    private final UserResolver userResolver;

    public PageResult<NotificationVO> page(Long recipientId, long current, long size) {
        Page<Notification> page = new Page<>(com.natsume.blog.common.utils.PageUtil.clampCurrent(current),
                com.natsume.blog.common.utils.PageUtil.clampSize(size));
        Page<Notification> result = notificationMapper.selectPage(page,
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getRecipientId, recipientId)
                        .orderByDesc(Notification::getCreateTime));
        List<Notification> list = result.getRecords();
        if (list.isEmpty()) {
            return PageResult.of(List.of(), result.getTotal(), current, size);
        }

        Map<Long, UserBrief> actors = userResolver.resolve(
                list.stream().map(Notification::getActorId).collect(Collectors.toList()));

        // 批量取目标标题
        List<Long> postIds = list.stream().filter(n -> "POST".equals(n.getTargetType()))
                .map(Notification::getTargetId).distinct().collect(Collectors.toList());
        List<Long> momentIds = list.stream().filter(n -> "MOMENT".equals(n.getTargetType()))
                .map(Notification::getTargetId).distinct().collect(Collectors.toList());
        Map<Long, String> postTitles = new HashMap<>();
        if (!postIds.isEmpty()) {
            postMapper.selectBatchIds(postIds).forEach(p -> postTitles.put(p.getId(), p.getTitle()));
        }
        Map<Long, String> momentTitles = new HashMap<>();
        if (!momentIds.isEmpty()) {
            momentMapper.selectBatchIds(momentIds).forEach(m ->
                    momentTitles.put(m.getId(), clip(m.getContent())));
        }

        List<NotificationVO> vos = list.stream().map(n -> {
            NotificationVO vo = new NotificationVO();
            vo.setId(n.getId());
            vo.setActorId(n.getActorId());
            UserBrief b = actors.get(n.getActorId());
            vo.setActorName(b != null && b.getNickname() != null ? b.getNickname() : n.getActorName());
            vo.setActorAvatar(b == null ? null : b.getAvatar());
            vo.setType(n.getType());
            vo.setTargetType(n.getTargetType());
            vo.setTargetId(n.getTargetId());
            String title;
            if ("POST".equals(n.getTargetType())) {
                title = postTitles.getOrDefault(n.getTargetId(), "文章");
            } else if ("MOMENT".equals(n.getTargetType())) {
                title = momentTitles.getOrDefault(n.getTargetId(), "动态");
            } else {
                title = ""; // USER（关注）无标题
            }
            vo.setTargetTitle(title);
            vo.setExcerpt(n.getExcerpt());
            vo.setRead(n.getIsRead() != null && n.getIsRead() == 1);
            vo.setCreateTime(n.getCreateTime());
            return vo;
        }).collect(Collectors.toList());

        return PageResult.of(vos, result.getTotal(), result.getCurrent(), result.getSize());
    }

    public long unreadCount(Long recipientId) {
        return notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getRecipientId, recipientId)
                .eq(Notification::getIsRead, 0));
    }

    public void markRead(Long recipientId, Long id) {
        notificationMapper.update(null, new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getRecipientId, recipientId)
                .eq(Notification::getId, id)
                .set(Notification::getIsRead, 1));
    }

    public void markAllRead(Long recipientId) {
        notificationMapper.update(null, new LambdaUpdateWrapper<Notification>()
                .eq(Notification::getRecipientId, recipientId)
                .eq(Notification::getIsRead, 0)
                .set(Notification::getIsRead, 1));
    }

    public void clearAll(Long recipientId) {
        notificationMapper.delete(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getRecipientId, recipientId));
    }

    private String clip(String s) {
        if (s == null) return "";
        String t = s.replaceAll("\\s+", " ").trim();
        return t.length() > 30 ? t.substring(0, 30) + "…" : t;
    }
}
