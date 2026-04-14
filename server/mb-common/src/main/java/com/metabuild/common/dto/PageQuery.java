package com.metabuild.common.dto;

import java.util.List;

/**
 * 分页查询参数。page 从 1 开始。
 */
public record PageQuery(
    int page,
    int size,
    List<String> sort  // 可为 null，表示不指定排序
) {
    public int offset() {
        return (page - 1) * size;
    }
}
