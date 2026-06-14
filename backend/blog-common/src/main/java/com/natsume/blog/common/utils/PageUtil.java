package com.natsume.blog.common.utils;

/**
 * 分页参数防御工具：避免超大 size 拖垮数据库 / OOM。
 */
public final class PageUtil {

    public static final long MAX_SIZE = 100L;
    public static final long DEFAULT_SIZE = 10L;

    private PageUtil() {
    }

    /** 限制每页大小在 [1, MAX_SIZE]，非法值回退默认 */
    public static long clampSize(long size) {
        if (size < 1) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    /** 页码至少为 1 */
    public static long clampCurrent(long current) {
        return current < 1 ? 1L : current;
    }
}
