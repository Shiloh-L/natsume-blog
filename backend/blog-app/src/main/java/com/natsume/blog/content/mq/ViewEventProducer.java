package com.natsume.blog.content.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * 浏览事件生产者：详情页访问时通过 Spring 进程内事件异步投递，避免高频写库阻塞主流程。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViewEventProducer {

    private final ApplicationEventPublisher publisher;

    public void publishViewed(Long postId, Long userId) {
        if (postId == null) {
            return;
        }
        publisher.publishEvent(new PostViewedEvent(postId, userId, System.currentTimeMillis()));
    }
}
