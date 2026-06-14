package com.natsume.blog.ai.dto;

import lombok.Data;

import java.util.List;

@Data
public class AskResponse {
    private String answer;
    private List<Citation> citations;

    @Data
    public static class Citation {
        private Long postId;
        private String title;
        private Double score;
    }
}
