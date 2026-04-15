package com.metabuild.platform.dict.api.vo;

import java.time.OffsetDateTime;

/**
 * 字典类型视图 DTO（只读，供响应使用）。
 */
public record DictTypeVo(
    Long id,
    String name,
    String code,
    Short status,
    String remark,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
