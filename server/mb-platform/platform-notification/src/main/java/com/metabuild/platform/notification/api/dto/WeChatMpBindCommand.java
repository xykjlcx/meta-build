package com.metabuild.platform.notification.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 公众号绑定命令。
 *
 * @param code  微信 OAuth 授权码
 * @param state CSRF state（后端校验后删除）
 */
public record WeChatMpBindCommand(
    @NotBlank String code,
    @NotBlank String state
) {}
