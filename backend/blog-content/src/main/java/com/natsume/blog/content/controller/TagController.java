package com.natsume.blog.content.controller;

import com.natsume.blog.common.result.Result;
import com.natsume.blog.content.entity.Tag;
import com.natsume.blog.content.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@io.swagger.v3.oas.annotations.tags.Tag(name = "标签")
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @Operation(summary = "标签列表")
    @GetMapping
    public Result<List<Tag>> list() {
        return Result.success(tagService.list());
    }

    @Operation(summary = "新增标签")
    @PostMapping
    public Result<Long> create(@RequestBody Tag tag) {
        return Result.success(tagService.create(tag));
    }

    @Operation(summary = "删除标签")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tagService.delete(id);
        return Result.success();
    }
}
