package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.config.CurrentUser;
import com.natsume.blog.content.dto.FollowStatsVO;
import com.natsume.blog.content.dto.FollowUserVO;
import com.natsume.blog.content.dto.PostVO;
import com.natsume.blog.content.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "关注")
@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @Operation(summary = "关注/取消关注")
    @PostMapping("/{userId}")
    public Result<Map<String, Boolean>> toggle(@PathVariable Long userId, @CurrentUser LoginUser user) {
        boolean followed = followService.toggle(userId, user);
        return Result.success(Map.of("followed", followed));
    }

    @Operation(summary = "关注统计")
    @GetMapping("/stats/{userId}")
    public Result<FollowStatsVO> stats(@PathVariable Long userId, @CurrentUser LoginUser user) {
        return Result.success(followService.stats(userId, user));
    }

    @Operation(summary = "粉丝列表")
    @GetMapping("/{userId}/followers")
    public Result<List<FollowUserVO>> followers(@PathVariable Long userId, @CurrentUser LoginUser user) {
        return Result.success(followService.followers(userId, user));
    }

    @Operation(summary = "关注列表")
    @GetMapping("/{userId}/following")
    public Result<List<FollowUserVO>> following(@PathVariable Long userId, @CurrentUser LoginUser user) {
        return Result.success(followService.following(userId, user));
    }

    @Operation(summary = "关注流（我关注的人的最新文章）")
    @GetMapping("/feed")
    public Result<PageResult<PostVO>> feed(@CurrentUser LoginUser user,
                                           @RequestParam(defaultValue = "1") long current,
                                           @RequestParam(defaultValue = "10") long size) {
        if (user == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        return Result.success(followService.feed(user, current, size));
    }
}
