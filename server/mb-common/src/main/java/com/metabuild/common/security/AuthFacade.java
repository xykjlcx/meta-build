package com.metabuild.common.security;

/**
 * 认证操作门面——业务层执行登录/登出的唯一入口。
 * 实现由 infra-security 提供，业务层零感知 Sa-Token。
 */
public interface AuthFacade {
    LoginResult doLogin(Long userId, SessionData sessionData);

    /**
     * 验证 refresh token 有效性并轮转（旧 token 失效），返回关联的 userId。
     * 由 AuthService.refresh() 调用，将 refresh token 验证逻辑封装在门面内部，
     * 避免业务层 instanceof 判断具体实现。
     */
    Long validateAndRotateRefreshToken(String refreshToken);

    void logout();
    void kickoutAll(Long userId);

    /** 踢出指定用户（与 kickoutAll 等效，语义更明确）。 */
    default void kickout(Long userId) {
        kickoutAll(userId);
    }

    /** 检查当前请求是否已登录。 */
    boolean isAuthenticated();

    /** 获取当前 session 中的标志值。 */
    Object getSessionFlag(String key);

    /** 向当前 session 写入标志值。 */
    void setSessionFlag(String key, Object value);

    /** 获取在线用户数量。 */
    long onlineUserCount();

    /** 检查指定用户是否在线。 */
    boolean isUserOnline(Long userId);
}
