package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.Size;

/**
 * 更新角色命令。
 */
public record RoleUpdateCommand(
    @Size(max = 64) String name,
    @Size(max = 32) String dataScope,
    @Size(max = 512) String remark,
    Short status,
    Integer sortOrder
) {}
