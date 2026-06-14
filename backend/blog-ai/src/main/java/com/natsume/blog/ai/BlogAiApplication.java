package com.natsume.blog.ai;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@MapperScan("com.natsume.blog.ai.mapper")
public class BlogAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlogAiApplication.class, args);
    }
}
