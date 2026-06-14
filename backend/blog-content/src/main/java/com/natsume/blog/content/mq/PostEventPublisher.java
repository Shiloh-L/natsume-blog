package com.natsume.blog.content.mq;

import com.natsume.blog.common.constant.MqConst;
import com.natsume.blog.common.dto.PostIndexEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * 文章事件发布者 —— 异步同步到 Elasticsearch
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishSave(PostIndexEvent event) {
        event.setAction("save");
        rabbitTemplate.convertAndSend(MqConst.POST_EXCHANGE, MqConst.POST_SAVE_KEY, event);
        log.info("发布文章保存事件 postId={}", event.getId());
    }

    public void publishDelete(Long postId) {
        PostIndexEvent event = new PostIndexEvent();
        event.setAction("delete");
        event.setId(postId);
        rabbitTemplate.convertAndSend(MqConst.POST_EXCHANGE, MqConst.POST_DELETE_KEY, event);
        log.info("发布文章删除事件 postId={}", postId);
    }
}
