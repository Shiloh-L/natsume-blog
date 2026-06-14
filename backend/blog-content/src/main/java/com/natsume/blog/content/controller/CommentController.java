package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.content.config.CurrentUser;
import com.natsume.blog.content.dto.CommentFormDTO;
import com.natsume.blog.content.dto.CommentVO;
import com.natsume.blog.content.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "评论")
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "文章评论列表")
    @GetMapping
    public Result<List<CommentVO>> list(@RequestParam Long postId) {
        return Result.success(commentService.listByPost(postId));
    }

    @Operation(summary = "发表评论")
    @PostMapping
    public Result<Long> create(@Valid @RequestBody CommentFormDTO form, @CurrentUser LoginUser user) {
        return Result.success("评论成功", commentService.create(form, user));
    }

    @Operation(summary = "删除评论")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, @CurrentUser LoginUser user) {
        commentService.delete(id, user);
        return Result.success();
    }
}
