package com.natsume.blog.common.result;

import lombok.Data;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * 分页返回结构
 */
@Data
public class PageResult<T> implements Serializable {

    private List<T> records;
    private long total;
    private long current;
    private long size;
    private long pages;

    public static <T> PageResult<T> of(List<T> records, long total, long current, long size) {
        PageResult<T> result = new PageResult<>();
        result.setRecords(records == null ? Collections.emptyList() : records);
        result.setTotal(total);
        result.setCurrent(current);
        result.setSize(size);
        result.setPages(size == 0 ? 0 : (total + size - 1) / size);
        return result;
    }

    public static <T> PageResult<T> empty(long current, long size) {
        return of(Collections.emptyList(), 0, current, size);
    }
}
