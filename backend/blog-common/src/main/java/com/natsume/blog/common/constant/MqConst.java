package com.natsume.blog.common.constant;

/**
 * 消息队列常量（内容服务发布 / 搜索服务消费）
 */
public interface MqConst {

    /** 文章事件交换机（topic） */
    String POST_EXCHANGE = "blog.post.exchange";

    /** 文章新增/更新路由键 */
    String POST_SAVE_KEY = "post.save";

    /** 文章删除路由键 */
    String POST_DELETE_KEY = "post.delete";

    /** 通配所有文章事件 */
    String POST_PATTERN = "post.#";

    /** 搜索服务的 ES 同步队列 */
    String ES_SYNC_QUEUE = "blog.es.sync.queue";

    /** Kafka: 文章浏览/行为事件主题 */
    String KAFKA_POST_VIEWED = "blog.post.viewed";

    /** Kafka: 消息通知事件主题 */
    String KAFKA_NOTIFICATION = "blog.notification";
}
