package com.natsume.blog.search.mq;

import com.natsume.blog.common.constant.MqConst;
import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.search.service.VectorSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * 消费文章事件，实时同步向量索引 (Qdrant)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostIndexConsumer {

    private final VectorSearchService vectorSearchService;

    @RabbitListener(queues = MqConst.ES_SYNC_QUEUE)
    public void onMessage(PostIndexEvent event) {
        log.info("收到文章事件 action={} id={}", event.getAction(), event.getId());
        try {
            if ("delete".equals(event.getAction())) {
                vectorSearchService.delete(event.getId());
            } else {
                vectorSearchService.index(event);
            }
        } catch (Exception e) {
            log.error("同步向量索引失败 id={}", event.getId(), e);
        }
    }
}
