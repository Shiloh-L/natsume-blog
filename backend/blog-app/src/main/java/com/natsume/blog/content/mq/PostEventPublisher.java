package com.natsume.blog.content.mq;

import com.natsume.blog.common.dto.PostIndexEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * 文章事件发布者 —— 通过 Spring 进程内事件异步同步到向量索引（Qdrant）。
 * 由 search 模块的监听器在事务提交后消费。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostEventPublisher {

    private final ApplicationEventPublisher publisher;

    public void publishSave(PostIndexEvent event) {
        event.setAction("save");
        publisher.publishEvent(event);
        log.info("发布文章保存事件 postId={}", event.getId());
    }

    public void publishDelete(Long postId) {
        PostIndexEvent event = new PostIndexEvent();
        event.setAction("delete");
        event.setId(postId);
        publisher.publishEvent(event);
        log.info("发布文章删除事件 postId={}", postId);
    }
}
