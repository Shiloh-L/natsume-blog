package com.natsume.blog.content.mq;

import com.natsume.blog.common.constant.MqConst;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * 浏览事件生产者：详情页访问时异步投递到 Kafka，避免高频写库。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ViewEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishViewed(Long postId, Long userId) {
        try {
            PostViewedEvent event = new PostViewedEvent(postId, userId, System.currentTimeMillis());
            kafkaTemplate.send(MqConst.KAFKA_POST_VIEWED, String.valueOf(postId), event);
        } catch (Exception e) {
            log.debug("投递浏览事件失败(忽略) postId={} : {}", postId, e.getMessage());
        }
    }
}
