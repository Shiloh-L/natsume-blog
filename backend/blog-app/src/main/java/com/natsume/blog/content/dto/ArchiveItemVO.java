package com.natsume.blog.content.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** 归档列表项 — 轻量，仅含时间线展示所需字段 */
@Data
public class ArchiveItemVO {
    private Long id;
    private String title;
    private String categoryName;
    private LocalDateTime createTime;
}
