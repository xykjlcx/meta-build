package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

/**
 * 用户列表视图 DTO（分页列表场景专用）。
 *
 * <p>相比 {@link UserVo} 额外带 {@code lastLoginAt}（聚合自 mb_iam_login_log）。
 * 仅在 {@code GET /users}（分页列表）场景返回，其他场景（getById / create / update）仍用 UserVo。
 * 详见 ADR backend-0026。
 */
public record UserListVo(
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
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    OffsetDateTime lastLoginAt,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime createdAt,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    OffsetDateTime updatedAt
) {}
