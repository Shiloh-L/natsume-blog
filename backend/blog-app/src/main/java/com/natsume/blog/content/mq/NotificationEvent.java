package com.natsume.blog.content.mq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 通知事件（Kafka 异步投递，消费者落库）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {
    private Long recipientId;
    private Long actorId;
    private String actorName;
    private String type;
    private String targetType;
    private Long targetId;
    private String excerpt;
}
