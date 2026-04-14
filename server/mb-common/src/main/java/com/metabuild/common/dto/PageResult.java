package com.metabuild.common.dto;

import java.util.List;
import java.util.function.Function;

/**
 * 分页结果。
 */
public record PageResult<T>(
    List<T> content,
    long totalElements,
    int totalPages,
    int page,
    int size
) {
    public boolean hasNext() { return page < totalPages; }
    public boolean hasPrevious() { return page > 1; }

    /** 将 PageResult<T> 映射为 PageResult<R>，保留分页元信息不变。 */
    public <R> PageResult<R> map(Function<T, R> mapper) {
        List<R> mapped = content.stream().map(mapper).toList();
        return new PageResult<>(mapped, totalElements, totalPages, page, size);
    }

    public static <T> PageResult<T> of(List<T> content, long total, PageQuery query) {
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / query.size());
        return new PageResult<>(content, total, totalPages, query.page(), query.size());
    }
}
