package com.natsume.blog.content.dto;

import lombok.Data;

@Data
public class BookmarkStatusVO {
    /** 当前登录用户是否已收藏 */
    private boolean bookmarked;
    /** 该文章被收藏总数 */
    private long count;
}
