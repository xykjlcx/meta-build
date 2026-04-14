package com.metabuild.platform.dict.api.dto;

import java.time.OffsetDateTime;

/**
 * 字典类型响应 DTO。
 */
public record DictTypeResponse(
    Long id,
    String name,
    String code,
    Short status,
    String remark,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
