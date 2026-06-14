package com.natsume.blog;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 夏目博客 · 模块化单体启动类。
 * 内部按限界上下文分包：auth / content / social(在 content 内) / search / ai，
 * 模块间通过普通方法调用与 Spring 进程内事件通信。
 */
@SpringBootApplication
@EnableAsync
@MapperScan("com.natsume.blog.**.mapper")
public class BlogApplication {
    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
    }
}
