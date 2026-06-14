package com.natsume.blog.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SummaryRequest {
    @NotBlank(message = "内容不能为空")
    private String content;
}
