package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

/**
 * 角色视图 DTO（只读，供响应使用）。
 */
public record RoleVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String name,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String code,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String dataScope,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String remark,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Short status,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Integer sortOrder,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime createdAt,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime updatedAt
) {}
