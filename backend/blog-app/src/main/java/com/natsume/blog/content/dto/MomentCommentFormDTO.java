package com.natsume.blog.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MomentCommentFormDTO {
    @NotNull(message = "动态ID不能为空")
    private Long momentId;
    /** 回复的目标评论ID（主楼或楼中楼的某条），不传则为主楼评论 */
    private Long replyCommentId;
    @NotBlank(message = "评论内容不能为空")
    @Size(max = 1000, message = "评论不能超过 1000 字")
    private String content;
}
