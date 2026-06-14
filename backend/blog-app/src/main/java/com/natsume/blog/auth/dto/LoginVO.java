package com.natsume.blog.auth.dto;

import lombok.Data;

@Data
public class LoginVO {
    private String token;
    private Long userId;
    private String username;
    private String nickname;
    private String avatar;
    private String role;
}
