package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建部门命令。
 */
public record DeptCreateCmd(
    Long parentId,
    @NotBlank @Size(max = 128) String name,
    Long leaderUserId,
    Integer sortOrder
) {}
