package com.metabuild.platform.iam.api.vo;

import java.time.OffsetDateTime;

/**
 * 角色视图 DTO（只读，供响应使用）。
 */
public record RoleVo(
    Long id,
    String name,
    String code,
    String dataScope,
    String remark,
    Short status,
    Integer sortOrder,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
