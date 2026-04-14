package com.metabuild.platform.dict.api.dto;

import java.time.OffsetDateTime;

/**
 * 字典数据响应 DTO。
 */
public record DictDataResponse(
    Long id,
    Long dictTypeId,
    String label,
    String value,
    Short status,
    Integer sortOrder,
    String remark,
    OffsetDateTime createdAt
) {}
