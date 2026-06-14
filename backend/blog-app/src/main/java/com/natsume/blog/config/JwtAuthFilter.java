package com.natsume.blog.config;

import com.natsume.blog.common.constant.SecurityConstants;
import com.natsume.blog.common.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 鉴权过滤器（替代原 API 网关全局过滤器）。
 * 解析 JWT，将用户信息以 X-User-* 请求头透传给下游 @CurrentUser 解析器；
 * 写操作未登录则返回 401。读操作（GET）、登录注册、搜索、AI、文档接口放行。
 */
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private static final List<String> WHITELIST = List.of(
            "/api/auth/login",
            "/api/auth/register"
    );

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String token = resolveToken(request);

        if (token != null) {
            try {
                Claims claims = jwtUtil.parse(token);
                Map<String, String> headers = new HashMap<>();
                headers.put(SecurityConstants.USER_ID_HEADER,
                        String.valueOf(claims.get(JwtUtil.CLAIM_USER_ID)));
                headers.put(SecurityConstants.USER_NAME_HEADER,
                        URLEncoder.encode(String.valueOf(claims.get(JwtUtil.CLAIM_USERNAME)),
                                StandardCharsets.UTF_8));
                headers.put(SecurityConstants.USER_ROLE_HEADER,
                        String.valueOf(claims.get(JwtUtil.CLAIM_ROLE)));
                chain.doFilter(new UserHeaderRequestWrapper(request, headers), response);
                return;
            } catch (Exception e) {
                log.debug("JWT 解析失败: {}", e.getMessage());
                if (isPublic(path, request.getMethod())) {
                    chain.doFilter(stripped(request), response);
                    return;
                }
                unauthorized(response, "登录已过期，请重新登录");
                return;
            }
        }

        if (isPublic(path, request.getMethod())) {
            chain.doFilter(stripped(request), response);
            return;
        }
        unauthorized(response, "请先登录");
    }

    private boolean isPublic(String path, String method) {
        if (WHITELIST.contains(path)) {
            return true;
        }
        if (path.startsWith("/api/search") || path.startsWith("/api/ai")) {
            return true;
        }
        if (path.contains("/doc.html") || path.contains("/swagger")
                || path.contains("/v3/api-docs") || path.contains("/webjars")
                || path.startsWith("/actuator")) {
            return true;
        }
        return HttpMethod.GET.matches(method);
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(SecurityConstants.TOKEN_HEADER);
        if (header != null && header.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            return header.substring(SecurityConstants.TOKEN_PREFIX.length());
        }
        return null;
    }

    /** 剥离客户端伪造的用户头（未登录场景） */
    private HttpServletRequest stripped(HttpServletRequest request) {
        Map<String, String> blanks = new HashMap<>();
        blanks.put(SecurityConstants.USER_ID_HEADER, null);
        blanks.put(SecurityConstants.USER_NAME_HEADER, null);
        blanks.put(SecurityConstants.USER_ROLE_HEADER, null);
        return new UserHeaderRequestWrapper(request, blanks);
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"code\":401,\"message\":\"" + message + "\",\"data\":null}");
    }

    /**
     * 请求包装器：覆盖 X-User-* 头。value 为 null 表示屏蔽客户端伪造的同名头。
     */
    private static class UserHeaderRequestWrapper extends HttpServletRequestWrapper {
        private final Map<String, String> overrides;

        UserHeaderRequestWrapper(HttpServletRequest request, Map<String, String> overrides) {
            super(request);
            this.overrides = overrides;
        }

        @Override
        public String getHeader(String name) {
            if (overrides.containsKey(name)) {
                return overrides.get(name);
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (overrides.containsKey(name)) {
                String v = overrides.get(name);
                return v == null ? Collections.emptyEnumeration()
                        : Collections.enumeration(List.of(v));
            }
            return super.getHeaders(name);
        }
    }
}
