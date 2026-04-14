package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.UnauthorizedException;
import com.metabuild.common.security.LoginResult;
import com.metabuild.platform.iam.api.dto.LoginCommand;
import com.metabuild.platform.iam.api.dto.UserCreateCommand;
import com.metabuild.platform.iam.domain.auth.AuthService;
import com.metabuild.platform.iam.domain.session.LoginLogService;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AuthService 集成测试：覆盖登录成功、密码错误两条关键路径。
 *
 * <p>LoginLogService 使用 @MockBean 屏蔽异步写入（@Async + REQUIRES_NEW 在
 * 测试事务回滚场景下行为不稳定）。</p>
 */
@Import(TestSecurityConfig.class)
class AuthServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    /** 屏蔽异步登录日志，避免 @Transactional 回滚与 REQUIRES_NEW 的冲突 */
    @MockBean
    private LoginLogService loginLogService;

    private static final String TEST_USERNAME = "authtest";
    private static final String TEST_PASSWORD = "Auth@12345";

    @BeforeEach
    void setUp() {
        // 每个测试方法前创建测试用户（@Transactional 保证测试结束后回滚）
        userService.createUser(new UserCreateCommand(
            TEST_USERNAME,
            TEST_PASSWORD,
            "authtest@example.com",
            null,
            "认证测试用户",
            null
        ));
    }

    // ───────── 登录成功 ─────────

    @Test
    void login_should_succeed_with_correct_credentials() {
        LoginCommand request = new LoginCommand(TEST_USERNAME, TEST_PASSWORD, null, null);

        LoginResult result = authService.login(request);

        assertThat(result).isNotNull();
        assertThat(result.accessToken()).isNotBlank();
        assertThat(result.refreshToken()).isNotBlank();
        assertThat(result.expiresInSeconds()).isPositive();
    }

    // ───────── 密码错误 ─────────

    @Test
    void login_should_throw_unauthorized_on_wrong_password() {
        LoginCommand request = new LoginCommand(TEST_USERNAME, "WrongPassword@999", null, null);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class);
    }

    // ───────── 用户不存在 ─────────

    @Test
    void login_should_throw_unauthorized_on_nonexistent_user() {
        LoginCommand request = new LoginCommand("nobody", "Test@12345", null, null);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class);
    }
}
