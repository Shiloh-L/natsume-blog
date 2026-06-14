package com.natsume.blog.search.controller;

import com.natsume.blog.common.dto.PostIndexEvent;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.content.service.PostService;
import com.natsume.blog.search.entity.RetrievedDoc;
import com.natsume.blog.search.entity.SearchVO;
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
    private final PostService postService;

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

    @Operation(summary = "重建向量索引（从内容模块拉取全量数据）")
    @PostMapping("/reindex")
    public Result<Integer> reindex() {
        List<PostIndexEvent> events = postService.allIndexEvents();
        if (events == null) {
            return Result.failed("拉取文章数据失败");
        }
        events.forEach(vectorSearchService::index);
        return Result.success("重建向量索引完成", events.size());
    }
}
