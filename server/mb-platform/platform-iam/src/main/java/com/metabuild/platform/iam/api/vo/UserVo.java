package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

/**
 * 用户视图 DTO（只读，供响应使用）。
 */
public record UserVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String username,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String email,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String phone,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String nickname,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String avatar,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Long deptId,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Short status,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    boolean mustChangePassword,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    OffsetDateTime passwordUpdatedAt,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime createdAt,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime updatedAt
) {}
