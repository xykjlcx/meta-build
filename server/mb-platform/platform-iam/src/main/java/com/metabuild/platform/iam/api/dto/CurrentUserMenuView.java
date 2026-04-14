package com.metabuild.platform.iam.api.dto;

import java.util.List;
import java.util.Set;

/**
 * 当前用户菜单 + 权限视图 DTO（GET /menus/current-user 响应）。
 * 前端 useMenu 依赖此结构。
 */
public record CurrentUserMenuView(
    List<MenuView> tree,
    Set<String> permissions
) {}
