package com.natsume.blog.content.controller;

import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.PageResult;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.common.result.ResultCode;
import com.natsume.blog.content.config.CurrentUser;
import com.natsume.blog.content.dto.BookmarkStatusVO;
import com.natsume.blog.content.dto.PostVO;
import com.natsume.blog.content.service.BookmarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "收藏（藏书阁）")
@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @Operation(summary = "收藏/取消收藏")
    @PostMapping("/{postId}")
    public Result<Map<String, Boolean>> toggle(@PathVariable Long postId, @CurrentUser LoginUser user) {
        boolean bookmarked = bookmarkService.toggle(postId, user);
        return Result.success(Map.of("bookmarked", bookmarked));
    }

    @Operation(summary = "收藏状态（是否已收藏 + 收藏数）")
    @GetMapping("/status/{postId}")
    public Result<BookmarkStatusVO> status(@PathVariable Long postId, @CurrentUser LoginUser user) {
        return Result.success(bookmarkService.status(postId, user));
    }

    @Operation(summary = "我的藏书阁（收藏的文章）")
    @GetMapping("/mine")
    public Result<PageResult<PostVO>> mine(@CurrentUser LoginUser user,
                                           @RequestParam(defaultValue = "1") long current,
                                           @RequestParam(defaultValue = "12") long size) {
        if (user == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        return Result.success(bookmarkService.myBookmarks(user, current, size));
    }
}
