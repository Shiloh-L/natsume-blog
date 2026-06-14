package com.natsume.blog.content.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.natsume.blog.content.dto.PostVO;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * 本地一级缓存 (Caffeine)。与 Redis 二级缓存组成多级缓存：
 * 读：Caffeine(L1) -> Redis(L2) -> MySQL；写：失效 L1 + L2。
 */
@Configuration
public class CacheConfig {

    @Bean
    public Cache<Long, PostVO> postLocalCache() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(Duration.ofMinutes(5))
                .recordStats()
                .build();
    }
}
