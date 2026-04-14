package com.metabuild.infra.security;

import cn.dev33.satoken.stp.SaTokenInfo;
import cn.dev33.satoken.stp.StpUtil;
import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.CurrentUserInfo;
import com.metabuild.common.security.DataScopeType;
import com.metabuild.common.security.LoginResult;
import com.metabuild.common.security.SessionData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * AuthFacade 的 Sa-Token 实现。
 * 业务层通过此门面执行登录/登出，零感知 Sa-Token API。
 *
 * <p>双 token 模式：access token 由 Sa-Token JWT 生成（短期，1800s），
 * refresh token 由 {@link RefreshTokenService} 管理（长期，Redis 存储，one-time use rotation）。
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class SaTokenAuthFacade implements AuthFacade {

    private final MbAuthProperties authProperties;
    private final RefreshTokenService refreshTokenService;

    @Override
    public LoginResult doLogin(Long userId, SessionData sessionData) {
        // 执行 Sa-Token 登录
        StpUtil.login(userId);

        // 写入 session extras
        var session = StpUtil.getSession();
        session.set(SaTokenCurrentUser.KEY_USERNAME, sessionData.username());
        session.set(SaTokenCurrentUser.KEY_DEPT_ID, sessionData.deptId());
        session.set(SaTokenCurrentUser.KEY_TENANT_ID, sessionData.tenantId());

        if (sessionData.dataScope() != null) {
            session.set(SaTokenCurrentUser.KEY_DATA_SCOPE_TYPE, sessionData.dataScope().type());
            session.set(SaTokenCurrentUser.KEY_DATA_SCOPE_DEPT_IDS,
                    sessionData.dataScope().deptIds() != null
                            ? new HashSet<>(sessionData.dataScope().deptIds())
                            : Set.of());
        } else {
            session.set(SaTokenCurrentUser.KEY_DATA_SCOPE_TYPE, DataScopeType.SELF);
            session.set(SaTokenCurrentUser.KEY_DATA_SCOPE_DEPT_IDS, Set.of());
        }

        // 写入权限码和角色码（SessionData 由 platform-iam 在登录时填充）
        session.set(SaTokenCurrentUser.KEY_PERMISSIONS,
                sessionData.permissions() != null ? new HashSet<>(sessionData.permissions()) : Set.of());
        session.set(SaTokenCurrentUser.KEY_ROLES,
                sessionData.roles() != null ? new HashSet<>(sessionData.roles()) : Set.of());
        // isAdmin 由登录服务按角色判断后写入
        session.set(SaTokenCurrentUser.KEY_IS_ADMIN, sessionData.admin());

        // 写入强制修改密码标志（SessionData 携带，统一在此处写入）
        // 键名与 MustChangePasswordInterceptor.SESSION_KEY_MUST_CHANGE_PASSWORD 保持一致
        if (sessionData.mustChangePassword()) {
            session.set("mustChangePassword", true);
        }

        // 构建返回值
        SaTokenInfo tokenInfo = StpUtil.getTokenInfo();
        CurrentUserInfo userInfo = new CurrentUserInfo(
                userId,
                sessionData.username(),
                sessionData.deptId(),
                sessionData.tenantId(),
                Set.of(),
                sessionData.dataScope() != null ? sessionData.dataScope().type() : DataScopeType.SELF,
                sessionData.dataScope() != null && sessionData.dataScope().deptIds() != null
                        ? new HashSet<>(sessionData.dataScope().deptIds())
                        : Set.of()
        );

        // 生成独立 refresh token（Redis 存储，7 天有效）
        String newRefreshToken = refreshTokenService.createRefreshToken(userId);

        log.info("用户登录成功: userId={}", userId);
        return new LoginResult(
                tokenInfo.tokenValue,
                newRefreshToken,
                authProperties.tokenTimeout(),
                userInfo
        );
    }

    /**
     * 仅验证并轮换 refresh token，返回 userId 供上层重建 SessionData。
     * 完整刷新流程由 platform-iam AuthService 编排（需要重建权限/角色等 session 数据）。
     */
    @Override
    public LoginResult refresh(String refreshToken) {
        // 验证并轮换（one-time use），返回 userId
        Long userId = refreshTokenService.validateAndRotate(refreshToken);
        // access token 由调用方（AuthService）重新调用 doLogin 生成
        // 此处仅返回 userId 的空壳，供内部使用，正常情况下 AuthController 不直接调用此方法
        log.info("Refresh token 验证通过: userId={}", userId);
        return new LoginResult(null, null, 0L, null);
    }

    /**
     * 内部接口：验证 refresh token 并返回 userId，供 platform-iam 编排完整刷新流程。
     *
     * @param refreshToken 客户端传入的 refresh token
     * @return 对应的 userId
     * @throws com.metabuild.common.exception.UnauthorizedException token 无效
     */
    public Long validateRefreshTokenAndGetUserId(String refreshToken) {
        return refreshTokenService.validateAndRotate(refreshToken);
    }

    @Override
    public void logout() {
        Object loginId = StpUtil.getLoginIdDefaultNull();
        StpUtil.logout();
        log.info("用户登出: userId={}", loginId);
    }

    @Override
    public void kickoutAll(Long userId) {
        StpUtil.kickout(userId);
        log.info("踢出用户所有会话: userId={}", userId);
    }

    @Override
    public boolean isAuthenticated() {
        return StpUtil.isLogin();
    }

    @Override
    public Object getSessionFlag(String key) {
        if (!StpUtil.isLogin()) {
            return null;
        }
        return StpUtil.getSession().get(key);
    }

    @Override
    public void setSessionFlag(String key, Object value) {
        StpUtil.getSession().set(key, value);
    }

    @Override
    public long onlineUserCount() {
        List<String> sessionIds = StpUtil.searchSessionId("", 0, -1, false);
        return sessionIds != null ? sessionIds.size() : 0L;
    }

    @Override
    public boolean isUserOnline(Long userId) {
        return StpUtil.isLogin(userId);
    }
}
