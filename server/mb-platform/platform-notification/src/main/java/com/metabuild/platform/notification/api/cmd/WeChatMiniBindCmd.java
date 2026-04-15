package com.metabuild.platform.notification.api.cmd;

import jakarta.validation.constraints.NotBlank;

/**
 * 小程序绑定命令。
 *
 * @param code wx.login() 返回的临时登录凭证
 */
public record WeChatMiniBindCmd(
    @NotBlank String code
) {}
