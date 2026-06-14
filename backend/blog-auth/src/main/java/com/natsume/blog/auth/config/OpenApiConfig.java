package com.natsume.blog.auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI authOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("夏目博客 · 认证服务 API")
                .description("注册 / 登录 / 用户信息")
                .version("1.0.0"));
    }
}
