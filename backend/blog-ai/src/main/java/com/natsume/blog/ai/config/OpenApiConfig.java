package com.natsume.blog.ai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aiOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("夏目博客 · AI 服务 API")
                .description("Spring AI · 猫咪老师助手")
                .version("1.0.0"));
    }
}
