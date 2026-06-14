package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.config.CurrentUser;
import com.natsume.blog.content.dto.NotificationVO;
import com.natsume.blog.content.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "消息通知")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "通知列表")
    @GetMapping
    public Result<PageResult<NotificationVO>> page(@CurrentUser LoginUser user,
                                                   @RequestParam(defaultValue = "1") long current,
                                                   @RequestParam(defaultValue = "20") long size) {
        if (user == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        return Result.success(notificationService.page(user.getUserId(), current, size));
    }

    @Operation(summary = "未读数量")
    @GetMapping("/unread-count")
    public Result<Map<String, Long>> unreadCount(@CurrentUser LoginUser user) {
        if (user == null) {
            return Result.success(Map.of("count", 0L));
        }
        return Result.success(Map.of("count", notificationService.unreadCount(user.getUserId())));
    }

    @Operation(summary = "标记单条已读")
    @PutMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable Long id, @CurrentUser LoginUser user) {
        if (user == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        notificationService.markRead(user.getUserId(), id);
        return Result.success();
    }

    @Operation(summary = "全部标记已读")
    @PutMapping("/read-all")
    public Result<Void> markAllRead(@CurrentUser LoginUser user) {
        if (user == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        notificationService.markAllRead(user.getUserId());
        return Result.success();
    }

    @Operation(summary = "清空通知")
    @DeleteMapping
    public Result<Void> clear(@CurrentUser LoginUser user) {
        if (user == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        notificationService.clearAll(user.getUserId());
        return Result.success();
    }
}
