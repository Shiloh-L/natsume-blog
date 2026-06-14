package com.natsume.blog.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileDTO {
    @Size(max = 50, message = "昵称过长")
    private String nickname;
    @Size(max = 255, message = "头像地址过长")
    private String avatar;
    @Size(max = 255, message = "签名过长")
    private String bio;
    @Size(max = 100, message = "邮箱过长")
    private String email;
}
