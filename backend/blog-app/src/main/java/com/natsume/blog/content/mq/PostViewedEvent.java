package com.natsume.blog.content.mq;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 文章浏览事件（高频，经 Kafka 异步聚合落库）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostViewedEvent implements Serializable {
    private Long postId;
    private Long userId;
    private long timestamp;
}
