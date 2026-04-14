package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 分配角色请求。
 */
public record AssignRolesRequest(
    @NotNull List<Long> roleIds
) {}
