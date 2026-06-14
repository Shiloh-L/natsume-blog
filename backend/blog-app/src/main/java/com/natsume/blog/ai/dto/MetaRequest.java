package com.natsume.blog.ai.dto;

import lombok.Data;

import java.util.List;

/** 一键成文：根据正文生成元信息的请求 */
@Data
public class MetaRequest {
    private String content;
    /** 可选分类名列表，供 AI 从中挑选 */
    private List<String> categories;
}
