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
import java.util.Set;

/**
 * AuthFacade 的 Sa-Token 实现。
 * 业务层通过此门面执行登录/登出，零感知 Sa-Token API。
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class SaTokenAuthFacade implements AuthFacade {

    private final MbAuthProperties authProperties;

    @Override
    public LoginResult doLogin(Long userId, SessionData sessionData) {
        // 执行 Sa-Token 登录
        StpUtil.login(userId);

        // 写入 session extras
        var session = StpUtil.getSession();
        session.set(SaTokenCurrentUser.KEY_USERNAME, sessionData.username());
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

        // 权限和角色由 platform-iam 通过 SaPermissionImpl 回调提供，此处不重复写入
        // isAdmin 由 platform-iam 在登录时按需写入（可扩展）
        session.set(SaTokenCurrentUser.KEY_IS_ADMIN, false);

        // 构建返回值
        SaTokenInfo tokenInfo = StpUtil.getTokenInfo();
        CurrentUserInfo userInfo = new CurrentUserInfo(
                userId,
                sessionData.username(),
                null, // deptId 由上层按需注入
                sessionData.tenantId(),
                Set.of(),
                sessionData.dataScope() != null ? sessionData.dataScope().type() : DataScopeType.SELF,
                sessionData.dataScope() != null && sessionData.dataScope().deptIds() != null
                        ? new HashSet<>(sessionData.dataScope().deptIds())
                        : Set.of()
        );

        log.info("用户登录成功: userId={}", userId);
        return new LoginResult(
                tokenInfo.tokenValue,
                tokenInfo.tokenValue, // Sa-Token 单 token 模式，refresh token 与 access token 相同
                authProperties.tokenTimeout(),
                userInfo
        );
    }

    @Override
    public LoginResult refresh(String refreshToken) {
        // Sa-Token 单 token 模式：验证 token 有效性，续期并返回原 token
        Object loginId = StpUtil.getLoginIdByToken(refreshToken);
        if (loginId == null) {
            throw new com.metabuild.common.exception.ForbiddenException("errors.auth.invalidToken");
        }
        // 续期（重置 token 超时时间）
        StpUtil.renewTimeout(refreshToken, authProperties.tokenTimeout());
        log.info("Token 续期成功: loginId={}", loginId);
        return new LoginResult(
                refreshToken,
                refreshToken,
                authProperties.tokenTimeout(),
                null // 上层按需重建 userInfo
        );
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
}
