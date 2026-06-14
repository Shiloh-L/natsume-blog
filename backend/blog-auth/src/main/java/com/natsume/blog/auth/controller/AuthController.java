package com.natsume.blog.auth.controller;

import com.natsume.blog.auth.dto.LoginDTO;
import com.natsume.blog.auth.dto.LoginVO;
import com.natsume.blog.auth.dto.RegisterDTO;
import com.natsume.blog.auth.dto.UserVO;
import com.natsume.blog.auth.service.AuthService;
import com.natsume.blog.auth.service.UserService;
import com.natsume.blog.common.constant.SecurityConstants;
import com.natsume.blog.common.result.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "认证")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @Operation(summary = "注册")
    @PostMapping("/register")
    public Result<LoginVO> register(@Valid @RequestBody RegisterDTO dto) {
        return Result.success("注册成功", authService.register(dto));
    }

    @Operation(summary = "登录")
    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return Result.success("登录成功", authService.login(dto));
    }

    @Operation(summary = "退出登录")
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(value = SecurityConstants.USER_ID_HEADER, required = false) Long userId) {
        authService.logout(userId);
        return Result.success();
    }

    @Operation(summary = "当前登录用户")
    @GetMapping("/me")
    public Result<UserVO> me(@RequestHeader(value = SecurityConstants.USER_ID_HEADER, required = false) Long userId) {
        if (userId == null) {
            return Result.failed(com.natsume.blog.common.result.ResultCode.UNAUTHORIZED);
        }
        return Result.success(userService.getById(userId));
    }

    @Operation(summary = "修改个人资料")
    @PutMapping("/me")
    public Result<UserVO> updateProfile(
            @RequestHeader(value = SecurityConstants.USER_ID_HEADER, required = false) Long userId,
            @Valid @RequestBody com.natsume.blog.auth.dto.UpdateProfileDTO dto) {
        if (userId == null) {
            return Result.failed(com.natsume.blog.common.result.ResultCode.UNAUTHORIZED);
        }
        return Result.success("资料已更新", userService.updateProfile(userId, dto));
    }
}
