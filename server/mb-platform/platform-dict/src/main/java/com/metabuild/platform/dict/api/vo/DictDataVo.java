package com.metabuild.platform.dict.api.vo;

import java.time.OffsetDateTime;

/**
 * 字典数据视图 DTO（只读，供响应使用）。
 */
public record DictDataVo(
    Long id,
    Long dictTypeId,
    String label,
    String value,
    Short status,
    Integer sortOrder,
    String remark,
    OffsetDateTime createdAt
) {}
