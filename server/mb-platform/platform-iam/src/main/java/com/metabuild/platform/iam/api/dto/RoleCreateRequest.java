package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 创建角色请求。
 */
public record RoleCreateRequest(
    @NotBlank @Size(max = 64) String name,
    @NotBlank @Size(max = 64) @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9_]*$", message = "角色码只能包含字母、数字、下划线，且以字母开头") String code,
    @Size(max = 32) String dataScope,
    @Size(max = 512) String remark,
    Integer sortOrder
) {}
