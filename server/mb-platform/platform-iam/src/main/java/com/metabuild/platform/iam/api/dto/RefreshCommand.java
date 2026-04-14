package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Token 刷新命令。
 */
public record RefreshCommand(
        @NotBlank String refreshToken
) {}
