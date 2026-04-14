package com.metabuild.platform.iam.api.dto;

import java.util.List;

/**
 * 菜单响应 DTO（含子菜单，用于树形展示）。
 */
public record MenuResponse(
    Long id,
    Long parentId,
    String name,
    String permissionCode,
    String menuType,
    String icon,
    Integer sortOrder,
    Boolean visible,
    List<MenuResponse> children
) {}
