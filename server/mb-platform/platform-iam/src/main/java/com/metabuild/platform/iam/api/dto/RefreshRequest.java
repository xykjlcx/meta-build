package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Token 刷新请求。
 */
public record RefreshRequest(
        @NotBlank String refreshToken
) {}
