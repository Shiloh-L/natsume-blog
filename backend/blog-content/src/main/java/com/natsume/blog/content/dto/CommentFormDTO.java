package com.natsume.blog.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentFormDTO {
    @NotNull(message = "文章ID不能为空")
    private Long postId;
    private Long parentId = 0L;
    @NotBlank(message = "评论内容不能为空")
    @Size(max = 1000, message = "评论不能超过 1000 字")
    private String content;
}
