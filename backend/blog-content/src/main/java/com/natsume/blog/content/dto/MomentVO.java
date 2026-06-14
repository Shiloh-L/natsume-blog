package com.natsume.blog.content.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class MomentVO {
    private Long id;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String content;
    private List<String> images;
    private String location;
    private Integer likeCount;
    private Integer commentCount;
    private LocalDateTime createTime;
    /** 当前登录用户是否已点赞 */
    private Boolean liked;
    /** 点赞用户名列表 */
    private List<String> likeUsers;
    private List<MomentCommentVO> comments;
}
