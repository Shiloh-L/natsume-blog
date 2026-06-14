package com.natsume.blog.ai.dto;

import lombok.Data;

import java.util.List;

/** AI 一键成文返回的文章元信息 */
@Data
public class ArticleMetaVO {
    private String title;
    private String summary;
    /** 从给定分类中选中的最合适分类名（可能为空） */
    private String category;
    /** 推荐标签名列表 */
    private List<String> tags;
}
