package com.metabuild.platform.iam.api.dto;

import java.time.OffsetDateTime;

/**
 * 角色响应 DTO。
 */
public record RoleResponse(
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
