package com.natsume.blog.content.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI contentOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("夏目博客 · 内容服务 API")
                .description("文章 / 分类 / 标签 / 评论 / 文件上传")
                .version("1.0.0"));
    }
}
