package com.natsume.blog.content.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PostFormDTO {
    @NotBlank(message = "标题不能为空")
    private String title;
    private String summary;
    @NotBlank(message = "正文不能为空")
    private String content;
    private String cover;
    private Long categoryId;
    private Integer status = 1;
    private Integer isTop = 0;
    private List<Long> tagIds;
}
