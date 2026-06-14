package com.natsume.blog.ai.controller;

import com.natsume.blog.ai.config.CurrentUser;
import com.natsume.blog.ai.dto.AiConfigDTO;
import com.natsume.blog.ai.dto.AiConfigVO;
import com.natsume.blog.ai.service.AiConfigService;
import com.natsume.blog.ai.service.AiService;
import com.natsume.blog.common.dto.LoginUser;
import com.natsume.blog.common.result.Result;
import com.natsume.blog.common.result.ResultCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "AI 配置（管理员）")
@RestController
@RequestMapping("/api/ai/config")
@RequiredArgsConstructor
public class AiConfigController {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final AiConfigService aiConfigService;
    private final AiService aiService;

    @Operation(summary = "读取 AI 配置（密钥脱敏，管理员）")
    @GetMapping
    public Result<AiConfigVO> get(@CurrentUser LoginUser user) {
        requireAdmin(user);
        return Result.success(aiConfigService.getView());
    }

    @Operation(summary = "更新 AI 配置并热生效（管理员）")
    @PutMapping
    public Result<AiConfigVO> update(@RequestBody AiConfigDTO dto, @CurrentUser LoginUser user) {
        requireAdmin(user);
        return Result.success("已保存，AI 已切换", aiConfigService.update(dto));
    }

    @Operation(summary = "测试当前 AI 连通性（管理员）")
    @PostMapping("/test")
    public Result<Map<String, Object>> test(@CurrentUser LoginUser user) {
        requireAdmin(user);
        long start = System.currentTimeMillis();
        try {
            String reply = aiService.chat("用一句话向我打个招呼");
            long cost = System.currentTimeMillis() - start;
            return Result.success(Map.of("ok", true, "reply", reply, "costMs", cost));
        } catch (Exception e) {
            long cost = System.currentTimeMillis() - start;
            return Result.success(Map.of("ok", false, "error", e.getMessage(), "costMs", cost));
        }
    }

    private void requireAdmin(LoginUser user) {
        if (user == null || !ROLE_ADMIN.equals(user.getRole())) {
            throw new com.natsume.blog.common.exception.BusinessException(ResultCode.FORBIDDEN);
        }
    }
}
