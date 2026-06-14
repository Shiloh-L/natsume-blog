package com.natsume.blog.ai.dto;

import lombok.Data;

/** AI 配置对外视图：密钥脱敏，仅返回是否已设置 + 末尾片段 */
@Data
public class AiConfigVO {
    private String provider;
    private String baseUrl;
    private String model;
    private Double temperature;
    /** 当前是否配置了密钥（DB 或环境变量任一） */
    private boolean apiKeySet;
    /** 脱敏后的密钥提示，如 sk-…b61e */
    private String apiKeyMasked;
    private String updateTime;
}
