package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.Size;

/**
 * 更新角色请求。
 */
public record RoleUpdateRequest(
    @Size(max = 64) String name,
    @Size(max = 32) String dataScope,
    @Size(max = 512) String remark,
    Short status,
    Integer sortOrder
) {}
