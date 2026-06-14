package com.natsume.blog.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentFormDTO {
    @NotNull(message = "文章ID不能为空")
    private Long postId;
    private Long parentId = 0L;
    @NotBlank(message = "评论内容不能为空")
    private String content;
}
