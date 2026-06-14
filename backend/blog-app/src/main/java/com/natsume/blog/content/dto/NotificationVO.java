package com.natsume.blog.content.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationVO {
    private Long id;
    private Long actorId;
    private String actorName;
    private String actorAvatar;
    private String type;
    private String targetType;
    private Long targetId;
    private String targetTitle;
    private String excerpt;
    private Boolean read;
    private LocalDateTime createTime;
}
