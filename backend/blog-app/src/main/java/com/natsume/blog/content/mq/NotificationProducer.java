package com.natsume.blog.content.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * 通知事件发布者。各社交互动(评论/回复/点赞)发生时通过 Spring 进程内事件异步投递，
 * 由 {@link NotificationConsumer} 异步落库为站内信。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationProducer {

    private final ApplicationEventPublisher publisher;

    public void publish(NotificationEvent event) {
        // 不给自己发通知
        if (event.getRecipientId() == null
                || Objects.equals(event.getRecipientId(), event.getActorId())) {
            return;
        }
        publisher.publishEvent(event);
    }
}
