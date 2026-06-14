package com.natsume.blog.content.dto;

import lombok.Data;

@Data
public class PostQueryDTO {
    private Long current = 1L;
    private Long size = 10L;
    private Long categoryId;
    private Long tagId;
    private String keyword;
    private Integer status;

    /** 防御性分页：页码至少为 1 */
    public Long getCurrent() {
        return current == null || current < 1 ? 1L : current;
    }

    /** 防御性分页：每页 1~100，避免超大 size 拖垮数据库 */
    public Long getSize() {
        if (size == null || size < 1) {
            return 10L;
        }
        return size > 100 ? 100L : size;
    }
}
