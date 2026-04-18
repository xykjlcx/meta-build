package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 更新菜单命令。
 * parentId=null 表示顶级菜单。
 * menuType 允许在 DIRECTORY/MENU/BUTTON 之间切换，受以下约束：
 * - 有 children 的节点不能改为 BUTTON（iam.menu.childrenExist）
 * - BUTTON 类型必须有 permissionCode（iam.menu.buttonPermissionRequired）
 */
public record MenuUpdateCmd(
    Long parentId,
    @NotBlank @Size(max = 128) String name,
    @Size(max = 128) String permissionCode,
    @NotBlank @Size(max = 32) String menuType,
    @Size(max = 128) String icon,
    Integer sortOrder,
    Boolean visible
) {}
