package com.natsume.blog.search.mq;

import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.search.service.VectorSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 消费文章变更事件（Spring 进程内事件），在事务提交后异步同步向量索引（Qdrant）。
 * fallbackExecution=true 保证即使发布点不在事务中也能执行。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostIndexConsumer {

    private final VectorSearchService vectorSearchService;

    @Async("eventExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
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
