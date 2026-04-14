package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 分配角色命令。
 */
public record AssignRolesCommand(
    @NotNull List<Long> roleIds
) {}
