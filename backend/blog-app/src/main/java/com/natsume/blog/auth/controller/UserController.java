package com.natsume.blog.auth.controller;

import com.natsume.blog.auth.dto.UserVO;
import com.natsume.blog.auth.service.UserService;
import com.natsume.blog.common.dto.UserBrief;
import com.natsume.blog.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "用户")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "查询用户公开信息")
    @GetMapping("/{id}")
    public Result<UserVO> getById(@PathVariable Long id) {
        return Result.success(userService.getById(id));
    }

    @Operation(summary = "（内部）批量查询用户展示信息")
    @GetMapping("/batch")
    public Result<List<UserBrief>> batch(@RequestParam("ids") List<Long> ids) {
        return Result.success(userService.batchBrief(ids));
    }
}
