package com.natsume.blog.ai.service;

import com.natsume.blog.ai.dto.RetrievedDoc;
import com.natsume.blog.common.result.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "blog-search")
public interface SearchClient {

    @GetMapping("/api/search/retrieve")
    Result<List<RetrievedDoc>> retrieve(@RequestParam("query") String query,
                                        @RequestParam("topK") int topK);
}
