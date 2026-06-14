package com.natsume.blog.search.service;

import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "blog-content")
public interface ContentClient {

    @GetMapping("/api/posts/internal/index-data")
    Result<List<PostIndexEvent>> indexData();
}
