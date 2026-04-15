package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 分配角色命令。
 */
public record AssignRolesCmd(
    @NotNull List<Long> roleIds
) {}
