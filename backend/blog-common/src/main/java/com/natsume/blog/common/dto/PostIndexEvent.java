package com.natsume.blog.common.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章索引同步事件（内容服务 -> 搜索服务）
 */
@Data
public class PostIndexEvent implements Serializable {

    private String action; // save / delete
    private Long id;
    private String title;
    private String summary;
    private String content;
    private String cover;
    private Long categoryId;
    private String categoryName;
    private String authorName;
    private List<String> tags;
    private Long viewCount;
    private LocalDateTime createTime;
}
