package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.Size;

/**
 * 更新角色命令。
 */
public record RoleUpdateCmd(
    @Size(max = 64) String name,
    @Size(max = 32) String dataScope,
    @Size(max = 512) String remark,
    Short status,
    Integer sortOrder
) {}
