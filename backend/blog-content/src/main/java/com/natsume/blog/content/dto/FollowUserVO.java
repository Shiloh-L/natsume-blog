package com.natsume.blog.content.dto;

import lombok.Data;

@Data
public class FollowUserVO {
    private Long userId;
    private String userName;
    private String avatar;
    /** 当前登录用户是否已关注此人 */
    private boolean followed;
}
