package com.natsume.blog.content.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.content.feign.AuthClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 用户展示信息（昵称/头像）解析服务。
 * 读取评论/动态/文章时，按 userId 实时解析当前昵称与头像，
 * 这样：① 老数据里存的登录名(admin)会被正确替换为昵称；② 用户改资料后立即生效。
 * 通过 OpenFeign 调用 blog-auth，并用 Caffeine 短期缓存以降低调用量。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserResolver {

    private final AuthClient authClient;
    private Cache<Long, UserBrief> cache;

    @PostConstruct
    public void init() {
        this.cache = Caffeine.newBuilder()
                .maximumSize(2000)
                .expireAfterWrite(Duration.ofSeconds(30))
                .build();
    }

    /** 批量解析；返回 userId -> UserBrief */
    public Map<Long, UserBrief> resolve(Collection<Long> userIds) {
        Map<Long, UserBrief> result = new HashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            return result;
        }
        List<Long> missing = new ArrayList<>();
        for (Long id : userIds.stream().distinct().collect(Collectors.toList())) {
            if (id == null) {
                continue;
            }
            UserBrief cached = cache.getIfPresent(id);
            if (cached != null) {
                result.put(id, cached);
            } else {
                missing.add(id);
            }
        }
        if (!missing.isEmpty()) {
            try {
                Result<List<UserBrief>> resp = authClient.batch(missing);
                if (resp != null && resp.getData() != null) {
                    for (UserBrief b : resp.getData()) {
                        cache.put(b.getUserId(), b);
                        result.put(b.getUserId(), b);
                    }
                }
            } catch (Exception e) {
                log.warn("解析用户信息失败（降级使用已存名称）: {}", e.getMessage());
            }
        }
        return result;
    }
}
