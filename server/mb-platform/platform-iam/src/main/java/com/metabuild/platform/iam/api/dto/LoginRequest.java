package com.metabuild.platform.iam.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 登录请求。
 */
public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password,
    /** 验证码 token（当失败次数达到阈值时必填） */
    String captchaToken,
    /** 验证码（当失败次数达到阈值时必填） */
    String captchaCode
) {}
