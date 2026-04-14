package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 创建用户命令。
 */
public record UserCreateCommand(
    @NotBlank @Size(min = 3, max = 64) String username,
    @NotBlank @Size(min = 8, max = 128) String password,
    @Email @Size(max = 255) String email,
    @Size(max = 32) String phone,
    @Size(max = 64) String nickname,
    Long deptId
) {}
