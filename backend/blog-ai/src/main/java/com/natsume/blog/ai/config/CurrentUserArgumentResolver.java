package com.natsume.blog.ai.config;

import com.natsume.blog.common.constant.SecurityConstants;
import com.natsume.blog.common.dto.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * 解析 @CurrentUser 参数：从网关透传的请求头还原登录用户
 */
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(LoginUser.class);
    }

    @Override
    public Object resolveArgument(@NonNull MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            return null;
        }
        String userId = request.getHeader(SecurityConstants.USER_ID_HEADER);
        if (userId == null || userId.isBlank()) {
            return null;
        }
        String name = request.getHeader(SecurityConstants.USER_NAME_HEADER);
        String role = request.getHeader(SecurityConstants.USER_ROLE_HEADER);
        if (name != null) {
            name = URLDecoder.decode(name, StandardCharsets.UTF_8);
        }
        return new LoginUser(Long.valueOf(userId), name, role);
    }
}
