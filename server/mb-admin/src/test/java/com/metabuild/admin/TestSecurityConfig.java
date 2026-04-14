package com.metabuild.admin;

import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.LoginResult;
import com.metabuild.common.security.SessionData;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * 测试专用 Security 配置——用 MockCurrentUser 替换 SaTokenCurrentUser，
 * 避免测试层依赖 Sa-Token Session（测试环境无 HTTP 请求上下文）。
 */
@TestConfiguration
public class TestSecurityConfig {

    /** 测试默认使用超管身份 */
    @Bean
    @Primary
    public CurrentUser testCurrentUser() {
        return MockCurrentUser.admin();
    }

    /** AuthFacade Stub——登录返回固定 token，其他操作无副作用 */
    @Bean
    @Primary
    public AuthFacade testAuthFacade() {
        return new AuthFacade() {
            @Override
            public LoginResult doLogin(Long userId, SessionData sessionData) {
                // 返回固定 token，满足 AuthService 的返回值要求
                return new LoginResult(
                    "test-access-token",
                    "test-refresh-token",
                    3600L,
                    null
                );
            }

            @Override
            public LoginResult refresh(String refreshToken) {
                return new LoginResult("test-access-token-refreshed", "test-refresh-token", 3600L, null);
            }

            @Override
            public void logout() {
                // no-op
            }

            @Override
            public void kickoutAll(Long userId) {
                // no-op
            }

            @Override
            public boolean isAuthenticated() {
                return true;
            }

            @Override
            public Object getSessionFlag(String key) {
                return null;
            }

            @Override
            public void setSessionFlag(String key, Object value) {
                // no-op
            }

            @Override
            public long onlineUserCount() {
                return 1L;
            }

            @Override
            public boolean isUserOnline(Long userId) {
                return true;
            }
        };
    }
}
