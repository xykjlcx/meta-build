package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建菜单请求。
 */
public record MenuCreateRequest(
    Long parentId,
    @NotBlank @Size(max = 128) String name,
    @Size(max = 128) String permissionCode,
    @NotBlank @Size(max = 32) String menuType,
    @Size(max = 128) String icon,
    Integer sortOrder,
    Boolean visible
) {}
