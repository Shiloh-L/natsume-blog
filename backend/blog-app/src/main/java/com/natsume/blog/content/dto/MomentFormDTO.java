package com.natsume.blog.content.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class MomentFormDTO {
    @Size(max = 2000, message = "内容过长")
    private String content;
    @Size(max = 9, message = "最多上传9张图片")
    private List<String> images;
    private String location;
}
