package com.natsume.blog.content.mq;

import com.natsume.blog.content.entity.Notification;
import com.natsume.blog.content.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 通知事件消费者：异步落库为站内信（Spring 进程内事件）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationMapper notificationMapper;

    @Async("eventExecutor")
    @EventListener
    public void onMessage(NotificationEvent event) {
        if (event == null || event.getRecipientId() == null) {
            return;
        }
        try {
            Notification n = new Notification();
            BeanUtils.copyProperties(event, n);
            n.setIsRead(0);
            notificationMapper.insert(n);
        } catch (Exception e) {
            log.error("通知落库失败 recipient={}", event.getRecipientId(), e);
        }
    }
}
