package com.natsume.blog.search.controller;

import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.search.entity.RetrievedDoc;
import com.natsume.blog.search.entity.SearchVO;
import com.natsume.blog.search.service.ContentClient;
import com.natsume.blog.search.service.VectorSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "搜索 · 向量语义检索")
@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final VectorSearchService vectorSearchService;
    private final ContentClient contentClient;

    @Operation(summary = "语义搜索文章（向量召回）")
    @GetMapping
    public Result<PageResult<SearchVO>> search(@RequestParam String keyword,
                                               @RequestParam(defaultValue = "1") int current,
                                               @RequestParam(defaultValue = "10") int size) {
        return Result.success(vectorSearchService.search(keyword, current, size));
    }

    @Operation(summary = "（内部）RAG 召回最相关文章")
    @GetMapping("/retrieve")
    public Result<List<RetrievedDoc>> retrieve(@RequestParam String query,
                                               @RequestParam(defaultValue = "4") int topK) {
        return Result.success(vectorSearchService.retrieve(query, topK));
    }

    @Operation(summary = "重建向量索引（从内容服务拉取全量数据）")
    @PostMapping("/reindex")
    public Result<Integer> reindex() {
        Result<List<PostIndexEvent>> remote = contentClient.indexData();
        if (remote == null || remote.getData() == null) {
            return Result.failed("拉取内容服务数据失败");
        }
        List<PostIndexEvent> events = remote.getData();
        events.forEach(vectorSearchService::index);
        return Result.success("重建向量索引完成", events.size());
    }
}
