package com.natsume.blog.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class PostFormDTO {
    @NotBlank(message = "标题不能为空")
    @Size(max = 120, message = "标题不能超过 120 字")
    private String title;
    @Size(max = 500, message = "摘要不能超过 500 字")
    private String summary;
    @NotBlank(message = "正文不能为空")
    @Size(max = 50000, message = "正文过长")
    private String content;
    @Size(max = 500, message = "封面地址过长")
    private String cover;
    private Long categoryId;
    private Integer status = 1;
    private Integer isTop = 0;
    private List<Long> tagIds;
}
