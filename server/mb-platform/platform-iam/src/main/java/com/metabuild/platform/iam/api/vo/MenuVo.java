package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 菜单视图 DTO（含子菜单，用于树形展示）。
 */
public record MenuVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Long parentId,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String name,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String permissionCode,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    String menuType,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    String icon,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Integer sortOrder,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true)
    Boolean visible,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    List<MenuVo> children
) {}
