package com.natsume.blog.common.config;

import com.natsume.blog.common.exception.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Import;

/**
 * 公共 Web 自动配置：仅在 Servlet 类型应用中装配全局异常处理，
 * 避免在响应式网关(WebFlux)中加载 Servlet 相关类。
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@Import(GlobalExceptionHandler.class)
public class CommonWebAutoConfiguration {
}
