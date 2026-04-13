package com.metabuild.common.security;

/**
 * 登录成功返回值。
 */
public record LoginResult(
    String accessToken,
    String refreshToken,
    Long expiresInSeconds,
    CurrentUserInfo user
) {}
