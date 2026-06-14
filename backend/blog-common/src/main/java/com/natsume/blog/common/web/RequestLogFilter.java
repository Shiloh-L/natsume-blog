package com.natsume.blog.common.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * 统一请求日志过滤器（仅 Servlet 应用装配）。
 * - 为每个请求生成/透传 traceId 写入 MDC，配合 logback 的 [%X{traceId}] 输出全链路标识
 * - 记录方法、路径、状态码、耗时
 * - 慢请求（默认 >1000ms）以 WARN 级别单独告警，便于在 *-error/日志中快速定位性能问题
 */
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RequestLogFilter extends OncePerRequestFilter {

    private static final String TRACE_ID = "traceId";
    private static final String TRACE_HEADER = "X-Trace-Id";
    private static final long SLOW_THRESHOLD_MS = 1000;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        // 健康检查/监控/文档等噪声端点不记录
        return uri.startsWith("/actuator")
                || uri.startsWith("/doc.html")
                || uri.startsWith("/swagger")
                || uri.startsWith("/v3/api-docs")
                || uri.startsWith("/webjars")
                || uri.startsWith("/favicon");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put(TRACE_ID, traceId);
        response.setHeader(TRACE_HEADER, traceId);

        long start = System.currentTimeMillis();
        int status = 200;
        try {
            chain.doFilter(request, response);
            status = response.getStatus();
        } finally {
            long cost = System.currentTimeMillis() - start;
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String query = request.getQueryString();
            String path = query == null ? uri : uri + "?" + query;
            if (cost >= SLOW_THRESHOLD_MS) {
                log.warn("慢请求 {} {} -> {} ({}ms)", method, path, status, cost);
            } else {
                log.info("{} {} -> {} ({}ms)", method, path, status, cost);
            }
            MDC.remove(TRACE_ID);
        }
    }
}
