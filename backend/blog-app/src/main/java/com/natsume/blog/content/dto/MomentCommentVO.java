package com.natsume.blog.content.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MomentCommentVO {
    private Long id;
    private Long momentId;
    private Long rootId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Long replyToId;
    private String replyToName;
    private String content;
    private LocalDateTime createTime;
}
