package com.natsume.blog.content.mq;

import com.natsume.blog.common.constant.MqConst;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * 通知事件生产者。各社交互动(评论/回复/点赞)发生时异步投递。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(NotificationEvent event) {
        // 不给自己发通知
        if (event.getRecipientId() == null
                || Objects.equals(event.getRecipientId(), event.getActorId())) {
            return;
        }
        try {
            kafkaTemplate.send(MqConst.KAFKA_NOTIFICATION,
                    String.valueOf(event.getRecipientId()), event);
        } catch (Exception e) {
            log.warn("投递通知事件失败(忽略): {}", e.getMessage());
        }
    }
}
