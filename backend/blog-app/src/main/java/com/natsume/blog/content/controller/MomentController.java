package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.common.web.CurrentUser;
import com.natsume.blog.content.dto.MomentCommentFormDTO;
import com.natsume.blog.content.dto.MomentCommentVO;
import com.natsume.blog.content.dto.MomentFormDTO;
import com.natsume.blog.content.dto.MomentVO;
import com.natsume.blog.content.service.MomentService;
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

import java.util.Map;

@Tag(name = "朋友圈")
@RestController
@RequestMapping("/api/moments")
@RequiredArgsConstructor
public class MomentController {

    private final MomentService momentService;

    @Operation(summary = "动态信息流")
    @GetMapping
    public Result<PageResult<MomentVO>> page(@RequestParam(defaultValue = "1") long current,
                                             @RequestParam(defaultValue = "10") long size,
                                             @CurrentUser LoginUser user) {
        return Result.success(momentService.page(current, size, user));
    }

    @Operation(summary = "发布动态")
    @PostMapping
    public Result<Long> create(@Valid @RequestBody MomentFormDTO form, @CurrentUser LoginUser user) {
        return Result.success("发布成功", momentService.create(form, user));
    }

    @Operation(summary = "删除动态")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, @CurrentUser LoginUser user) {
        momentService.delete(id, user);
        return Result.success();
    }

    @Operation(summary = "点赞/取消点赞")
    @PostMapping("/{id}/like")
    public Result<Map<String, Boolean>> toggleLike(@PathVariable Long id, @CurrentUser LoginUser user) {
        boolean liked = momentService.toggleLike(id, user);
        return Result.success(Map.of("liked", liked));
    }

    @Operation(summary = "评论动态")
    @PostMapping("/comments")
    public Result<MomentCommentVO> comment(@Valid @RequestBody MomentCommentFormDTO form,
                                           @CurrentUser LoginUser user) {
        return Result.success("评论成功", momentService.comment(form, user));
    }

    @Operation(summary = "删除评论")
    @DeleteMapping("/comments/{id}")
    public Result<Void> deleteComment(@PathVariable Long id, @CurrentUser LoginUser user) {
        momentService.deleteComment(id, user);
        return Result.success();
    }
}
