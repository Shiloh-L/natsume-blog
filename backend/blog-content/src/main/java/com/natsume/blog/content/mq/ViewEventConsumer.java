package com.natsume.blog.content.mq;

import com.natsume.blog.common.constant.MqConst;
import com.natsume.blog.content.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * 浏览事件消费者：聚合后异步落库（此处简化为逐条自增，演示 Kafka 事件流）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViewEventConsumer {

    private final PostMapper postMapper;

    @KafkaListener(topics = MqConst.KAFKA_POST_VIEWED, groupId = "blog-content-view")
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
