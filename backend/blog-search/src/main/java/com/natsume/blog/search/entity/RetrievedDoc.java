package com.natsume.blog.search.entity;

import lombok.Data;

import java.util.List;

@Data
public class RetrievedDoc {
    private Long postId;
    private String title;
    private String content;
    private Double score;
}
