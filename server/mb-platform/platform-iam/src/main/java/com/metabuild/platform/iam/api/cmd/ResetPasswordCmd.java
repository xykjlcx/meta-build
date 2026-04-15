package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotBlank;

/**
 * 管理员重置用户密码请求。
 */
public record ResetPasswordCmd(
    @NotBlank String newPassword
) {}
