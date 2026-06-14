package com.natsume.blog.auth.dto;

import lombok.Data;

@Data
public class UserVO {
    private Long userId;
    private String username;
    private String nickname;
    private String email;
    private String avatar;
    private String bio;
    private String role;
}
