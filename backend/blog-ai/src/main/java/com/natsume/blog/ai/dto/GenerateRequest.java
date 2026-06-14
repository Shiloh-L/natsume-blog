package com.natsume.blog.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateRequest {
    /** 文章主题 / 标题 */
    @NotBlank(message = "主题不能为空")
    private String topic;
    /** 可选风格，如「治愈温柔」「技术干货」 */
    private String style;
    /** 可选分类 */
    private String category;
}
