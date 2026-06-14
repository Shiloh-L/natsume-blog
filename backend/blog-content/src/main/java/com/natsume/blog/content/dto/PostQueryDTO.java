package com.natsume.blog.content.dto;

import lombok.Data;

@Data
public class PostQueryDTO {
    private Long current = 1L;
    private Long size = 10L;
    private Long categoryId;
    private Long tagId;
    private String keyword;
    private Integer status;
}
