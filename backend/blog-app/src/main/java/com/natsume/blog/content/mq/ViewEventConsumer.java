package com.natsume.blog.content.mq;

import com.natsume.blog.content.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 浏览事件消费者：异步聚合落库（Spring 进程内事件）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViewEventConsumer {

    private final PostMapper postMapper;

    @Async("eventExecutor")
    @EventListener
    public void onViewed(PostViewedEvent event) {
        if (event == null || event.getPostId() == null) {
            return;
        }
        try {
            postMapper.incrView(event.getPostId(), 1);
        } catch (Exception e) {
            log.warn("聚合浏览量落库失败 postId={}", event.getPostId(), e);
        }
    }
}
