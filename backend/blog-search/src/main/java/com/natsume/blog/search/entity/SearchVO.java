package com.natsume.blog.search.entity;

import lombok.Data;

import java.util.List;

@Data
public class SearchVO {
    private Long id;
    private String title;
    private String summary;
    private String cover;
    private String categoryName;
    private String authorName;
    private List<String> tags;
    private Long viewCount;
    private String createTime;
    /** 向量相似度得分 (0~1, 越大越相关) */
    private Double score;
    /** 命中内容片段 */
    private String snippet;
}
