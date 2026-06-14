package com.natsume.blog.ai.dto;

import lombok.Data;

/** AI 配置更新请求。apiKey 为空表示不修改现有密钥（留空回退环境变量）。 */
@Data
public class AiConfigDTO {
    private String provider;
    private String baseUrl;
    private String model;
    private Double temperature;
    /** 新密钥；留空则保持现状（不覆盖） */
    private String apiKey;
}
