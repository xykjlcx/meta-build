package com.metabuild.common.dto;

import java.util.List;
import java.util.Objects;

/**
 * 内部可信分页对象。
 *
 * <p>只表示已经过统一归一化后的分页语义，不承载 HTTP 绑定职责。</p>
 */
public final class PageQuery {

    private final int page;
    private final int size;
    private final List<String> sort;

    private PageQuery(int page, int size, List<String> sort) {
        this.page = page;
        this.size = size;
        this.sort = sort == null ? null : List.copyOf(sort);
    }

    /**
     * 创建已归一化的分页对象。
     *
     * <p>生产代码只允许通过 PaginationPolicy 调用，调用路径由 ArchUnit 守护。</p>
     */
    public static PageQuery normalized(int page, int size, List<String> sort) {
        return new PageQuery(page, size, sort);
    }

    public int page() {
        return page;
    }

    public int size() {
        return size;
    }

    public List<String> sort() {
        return sort;
    }

    public int offset() {
        return (page - 1) * size;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (!(obj instanceof PageQuery other)) {
            return false;
        }
        return page == other.page
            && size == other.size
            && Objects.equals(sort, other.sort);
    }

    @Override
    public int hashCode() {
        return Objects.hash(page, size, sort);
    }

    @Override
    public String toString() {
        return "PageQuery{"
            + "page=" + page
            + ", size=" + size
            + ", sort=" + sort
            + '}';
    }
}
