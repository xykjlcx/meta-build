package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建部门请求。
 */
public record DeptCreateRequest(
    Long parentId,
    @NotBlank @Size(max = 128) String name,
    Long leaderUserId,
    Integer sortOrder
) {}
