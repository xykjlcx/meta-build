package com.metabuild.platform.iam.api.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 角色已分配的菜单 ID 列表（纯 ID，前端用于编辑态回显）。
 */
public record RoleMenusVo(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED)
    List<Long> menuIds
) {}
