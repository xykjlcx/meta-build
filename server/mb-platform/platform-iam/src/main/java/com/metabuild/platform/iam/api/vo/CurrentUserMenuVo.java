package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Set;

/**
 * 当前用户菜单 + 权限视图 DTO（GET /menus/current-user 响应）。
 * 前端 useMenu 依赖此结构。
 */
public record CurrentUserMenuVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    List<MenuVo> tree,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Set<String> permissions
) {}
