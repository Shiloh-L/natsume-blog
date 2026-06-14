package com.natsume.blog.search.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI searchOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("夏目博客 · 搜索服务 API")
                .description("Elasticsearch 全文检索")
                .version("1.0.0"));
    }
}
