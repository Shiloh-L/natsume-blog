package com.natsume.blog.gateway.filter;

import com.natsume.blog.common.constant.SecurityConstants;
import com.natsume.blog.common.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 全局鉴权过滤器：解析 JWT，将用户信息透传给下游服务；保护写操作。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    private static final List<String> WHITELIST = List.of(
            "/api/auth/login",
            "/api/auth/register"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // 防伪造：剥离客户端伪造的用户头
        ServerHttpRequest cleaned = request.mutate()
                .headers(h -> {
                    h.remove(SecurityConstants.USER_ID_HEADER);
                    h.remove(SecurityConstants.USER_NAME_HEADER);
                    h.remove(SecurityConstants.USER_ROLE_HEADER);
                })
                .build();
        ServerWebExchange cleanedExchange = exchange.mutate().request(cleaned).build();

        String token = resolveToken(cleaned);
        if (token != null) {
            try {
                Claims claims = jwtUtil.parse(token);
                String userId = String.valueOf(claims.get(JwtUtil.CLAIM_USER_ID));
                String username = String.valueOf(claims.get(JwtUtil.CLAIM_USERNAME));
                String role = String.valueOf(claims.get(JwtUtil.CLAIM_ROLE));
                ServerHttpRequest mutated = cleaned.mutate()
                        .header(SecurityConstants.USER_ID_HEADER, userId)
                        .header(SecurityConstants.USER_NAME_HEADER,
                                URLEncoder.encode(username, StandardCharsets.UTF_8))
                        .header(SecurityConstants.USER_ROLE_HEADER, role)
                        .build();
                return chain.filter(cleanedExchange.mutate().request(mutated).build());
            } catch (Exception e) {
                log.debug("JWT 解析失败: {}", e.getMessage());
                if (isPublic(path, method)) {
                    return chain.filter(cleanedExchange);
                }
                return unauthorized(cleanedExchange, "登录已过期，请重新登录");
            }
        }

        if (isPublic(path, method)) {
            return chain.filter(cleanedExchange);
        }
        return unauthorized(cleanedExchange, "请先登录");
    }

    private boolean isPublic(String path, HttpMethod method) {
        if (WHITELIST.contains(path)) {
            return true;
        }
        if (path.startsWith("/api/search") || path.startsWith("/api/ai")) {
            return true;
        }
        if (path.contains("/doc.html") || path.contains("/swagger")
                || path.contains("/v3/api-docs") || path.contains("/webjars")) {
            return true;
        }
        return HttpMethod.GET.equals(method);
    }

    private String resolveToken(ServerHttpRequest request) {
        String header = request.getHeaders().getFirst(SecurityConstants.TOKEN_HEADER);
        if (header != null && header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            return header.substring(SecurityConstants.TOKEN_PREFIX.length());
        }
        return null;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"code\":401,\"message\":\"" + message + "\",\"data\":null}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
