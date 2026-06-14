package com.natsume.blog.ai.dto;

import lombok.Data;

@Data
public class RetrievedDoc {
    private Long postId;
    private String title;
    private String content;
    private Double score;
}
