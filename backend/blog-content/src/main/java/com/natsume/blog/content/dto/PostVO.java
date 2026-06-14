package com.natsume.blog.content.dto;

import com.natsume.blog.content.entity.Tag;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostVO {
    private Long id;
    private String title;
    private String summary;
    private String content;
    private String cover;
    private Long categoryId;
    private String categoryName;
    private Long authorId;
    private String authorName;
    private Integer status;
    private Integer isTop;
    private Long viewCount;
    private Long likeCount;
    private Long commentCount;
    private List<Tag> tags;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
