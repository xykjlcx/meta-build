package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 管理员重置用户密码请求。
 */
public record ResetPasswordCommand(
    @NotBlank String newPassword
) {}
