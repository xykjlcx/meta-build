package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建菜单命令。
 */
public record MenuCreateCmd(
    Long parentId,
    @NotBlank @Size(max = 128) String name,
    @Size(max = 128) String permissionCode,
    @NotBlank @Size(max = 32) String menuType,
    @Size(max = 128) String icon,
    Integer sortOrder,
    Boolean visible
) {}
