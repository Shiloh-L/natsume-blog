package com.natsume.blog.auth;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.natsume.blog.auth.mapper")
public class BlogAuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlogAuthApplication.class, args);
    }
}
