package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * 更新用户请求。
 */
public record UserUpdateRequest(
    @Email @Size(max = 255) String email,
    @Size(max = 32) String phone,
    @Size(max = 64) String nickname,
    @Size(max = 512) String avatar,
    Long deptId,
    Short status
) {}
