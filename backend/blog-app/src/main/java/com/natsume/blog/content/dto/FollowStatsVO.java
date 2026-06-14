package com.natsume.blog.content.dto;

import lombok.Data;

@Data
public class FollowStatsVO {
    /** 粉丝数 */
    private long followers;
    /** 关注数 */
    private long following;
    /** 当前登录用户是否已关注此人 */
    private boolean followed;
}
