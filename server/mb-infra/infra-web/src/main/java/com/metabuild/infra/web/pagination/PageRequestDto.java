package com.metabuild.infra.web.pagination;

import java.util.List;

/**
 * HTTP 边界层分页请求 DTO。
 *
 * <p>仅表达原始 query string 输入，不承载默认值、上限和非法值语义。</p>
 */
public class PageRequestDto {

    private Integer page;
    private Integer size;
    private List<String> sort;

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public List<String> getSort() {
        return sort;
    }

    public void setSort(List<String> sort) {
        this.sort = sort;
    }
}
