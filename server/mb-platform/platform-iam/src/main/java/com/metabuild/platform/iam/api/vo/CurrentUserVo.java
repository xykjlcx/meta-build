package com.metabuild.platform.iam.api.vo;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Set;

/**
 * 当前登录用户视图 DTO（GET /auth/me 响应）。
 * 前端 useCurrentUser 依赖此结构。
 */
public record CurrentUserVo(
    Long userId,
    String username,
    Long deptId,
    Set<String> permissions,
    Set<String> roles,
    @JsonProperty("isAdmin") boolean isAdmin
) {}
