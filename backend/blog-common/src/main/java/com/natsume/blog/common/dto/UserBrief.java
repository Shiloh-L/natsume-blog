package com.natsume.blog.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 用户公开展示信息（跨服务：内容服务读取时用于展示作者昵称/头像）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBrief implements Serializable {
    private Long userId;
    private String nickname;
    private String avatar;
}
