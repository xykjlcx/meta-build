package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 用户已分配的角色 ID 列表（纯 ID，前端已有 roles 缓存可解析名称）。
 */
public record UserRolesVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    List<Long> roleIds
) {}
