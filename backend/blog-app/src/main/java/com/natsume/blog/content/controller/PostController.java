package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.common.web.CurrentUser;
import com.natsume.blog.content.dto.PostFormDTO;
import com.natsume.blog.content.dto.PostQueryDTO;
import com.natsume.blog.content.dto.PostVO;
import com.natsume.blog.content.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "文章")
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @Operation(summary = "分页查询文章")
    @GetMapping
    public Result<PageResult<PostVO>> page(PostQueryDTO query) {
        return Result.success(postService.pagePosts(query));
    }

    @Operation(summary = "文章详情")
    @GetMapping("/{id}")
    public Result<PostVO> detail(@PathVariable Long id) {
        return Result.success(postService.getDetail(id));
    }

    @Operation(summary = "发布文章")
    @PostMapping
    public Result<Long> create(@Valid @RequestBody PostFormDTO form, @CurrentUser LoginUser user) {
        return Result.success("发布成功", postService.create(form, user));
    }

    @Operation(summary = "编辑文章")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody PostFormDTO form, @CurrentUser LoginUser user) {
        postService.update(id, form, user);
        return Result.success();
    }

    @Operation(summary = "删除文章")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, @CurrentUser LoginUser user) {
        postService.delete(id, user);
        return Result.success();
    }

    @Operation(summary = "点赞文章")
    @PostMapping("/{id}/like")
    public Result<Void> like(@PathVariable Long id) {
        postService.like(id);
        return Result.success();
    }

    @Operation(summary = "我的文章（含草稿）")
    @GetMapping("/mine")
    public Result<PageResult<PostVO>> mine(@CurrentUser LoginUser user,
                                           @RequestParam(defaultValue = "1") long current,
                                           @RequestParam(defaultValue = "20") long size) {
        if (user == null) {
            return Result.failed(com.natsume.blog.common.result.ResultCode.UNAUTHORIZED);
        }
        return Result.success(postService.pageMyPosts(user.getUserId(), current, size));
    }

    @Operation(summary = "文章归档（按时间倒序的轻量列表）")
    @GetMapping("/archive")
    public Result<java.util.List<com.natsume.blog.content.dto.ArchiveItemVO>> archive() {
        return Result.success(postService.archive());
    }
}
