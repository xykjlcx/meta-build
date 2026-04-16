package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 部门视图 DTO（含子部门，用于树形展示）。
 */
public record DeptVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Long parentId,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String name,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Long leaderUserId,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Short status,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Integer sortOrder,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime createdAt,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    List<DeptVo> children
) {}
