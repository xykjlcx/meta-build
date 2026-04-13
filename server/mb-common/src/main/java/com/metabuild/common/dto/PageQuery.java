package com.metabuild.common.dto;

import java.util.List;
import org.jetbrains.annotations.Nullable;

/**
 * 分页查询参数。page 从 1 开始。
 */
public record PageQuery(
    int page,
    int size,
    @Nullable List<String> sort
) {
    public int offset() {
        return (page - 1) * size;
    }
}
