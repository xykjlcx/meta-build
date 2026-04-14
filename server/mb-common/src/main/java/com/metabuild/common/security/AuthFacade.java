package com.metabuild.common.security;

/**
 * 认证操作门面——业务层执行登录/登出的唯一入口。
 * 实现由 infra-security 提供，业务层零感知 Sa-Token。
 */
public interface AuthFacade {
    LoginResult doLogin(Long userId, SessionData sessionData);
    LoginResult refresh(String refreshToken);
    void logout();
    void kickoutAll(Long userId);
}
