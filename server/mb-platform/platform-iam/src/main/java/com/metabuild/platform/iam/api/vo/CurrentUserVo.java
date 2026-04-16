package com.metabuild.platform.iam.api.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Set;

/**
 * 当前登录用户视图 DTO（GET /auth/me 响应）。
 * 前端 useCurrentUser 依赖此结构。
 */
public record CurrentUserVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Long userId,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String username,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Long deptId,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Set<String> permissions,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Set<String> roles,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    @JsonProperty("isAdmin") boolean isAdmin
) {}
