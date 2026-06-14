package com.natsume.blog.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 全局 OpenAPI / Knife4j 文档信息（单体统一一份）。
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI blogOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("夏目博客 API")
                .description("模块化单体：认证 / 文章 / 社交 / 搜索 / AI")
                .version("2.0.0"));
    }
}
