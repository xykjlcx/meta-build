package com.metabuild.platform.iam.api.cmd;

import jakarta.validation.constraints.NotBlank;

/**
 * Token 刷新命令。
 */
public record RefreshCmd(
        @NotBlank String refreshToken
) {}
