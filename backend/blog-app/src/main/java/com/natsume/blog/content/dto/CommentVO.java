package com.natsume.blog.content.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class CommentVO {
    private Long id;
    private Long postId;
    private Long parentId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String content;
    private LocalDateTime createTime;
    private List<CommentVO> replies = new ArrayList<>();
}
