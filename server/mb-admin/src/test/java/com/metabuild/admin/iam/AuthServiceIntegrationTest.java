package com.metabuild.admin.iam;

import com.metabuild.admin.BaseIntegrationTest;
import com.metabuild.admin.TestSecurityConfig;
import com.metabuild.common.exception.UnauthorizedException;
import com.metabuild.common.security.LoginResult;
import com.metabuild.platform.iam.api.cmd.LoginCmd;
import com.metabuild.platform.iam.api.cmd.UserCreateCmd;
import com.metabuild.platform.iam.domain.auth.AuthService;
import com.metabuild.platform.iam.domain.session.LoginLogService;
import com.metabuild.platform.iam.domain.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * AuthService 集成测试：覆盖登录成功、密码错误两条关键路径。
 *
 * <p>LoginLogService 使用 @MockitoBean 屏蔽异步写入（@Async + REQUIRES_NEW 在
 * 测试事务回滚场景下行为不稳定）。</p>
 */
@Import(TestSecurityConfig.class)
class AuthServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    /** 屏蔽异步登录日志，避免 @Transactional 回滚与 REQUIRES_NEW 的冲突 */
    @MockitoBean
    private LoginLogService loginLogService;

    private static final String TEST_USERNAME = "authtest";
    private static final String TEST_PASSWORD = "Auth@12345";
    /** v1 默认租户 ID，与 AuthService 中常量保持一致 */
    private static final long DEFAULT_TENANT_ID = 0L;
    private static final String FAIL_KEY = "mb:iam:login:fail:" + DEFAULT_TENANT_ID + ":" + TEST_USERNAME;

    @BeforeEach
    void setUp() {
        // 清理可能残留的失败计数
        redisTemplate.delete(FAIL_KEY);
        // 每个测试方法前创建测试用户（@Transactional 保证测试结束后回滚）
        userService.createUser(new UserCreateCmd(
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
        LoginCmd request = new LoginCmd(TEST_USERNAME, TEST_PASSWORD, null, null);

        LoginResult result = authService.login(request);

        assertThat(result).isNotNull();
        assertThat(result.accessToken()).isNotBlank();
        assertThat(result.refreshToken()).isNotBlank();
        assertThat(result.expiresInSeconds()).isPositive();
    }

    // ───────── 密码错误 ─────────

    @Test
    void login_should_throw_unauthorized_on_wrong_password() {
        LoginCmd request = new LoginCmd(TEST_USERNAME, "WrongPassword@999", null, null);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class);
    }

    // ───────── 用户不存在 ─────────

    @Test
    void login_should_throw_unauthorized_on_nonexistent_user() {
        LoginCmd request = new LoginCmd("nobody", "Test@12345", null, null);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class);
    }

    // ───────── 失败计数 key 格式：包含 tenantId 段 ─────────

    @Test
    void failed_login_should_write_redis_key_with_tenant_prefix() {
        LoginCmd request = new LoginCmd(TEST_USERNAME, "WrongPassword@999", null, null);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UnauthorizedException.class);

        String value = redisTemplate.opsForValue().get(FAIL_KEY);
        assertThat(value).as("登录失败计数必须写入 tenant 前缀的 key").isEqualTo("1");

        // 旧 key（不含 tenantId）必须不存在，防退化
        String legacyKey = "mb:iam:login:fail:" + TEST_USERNAME;
        assertThat(redisTemplate.opsForValue().get(legacyKey)).isNull();

        redisTemplate.delete(FAIL_KEY);
    }

    @Test
    void successful_login_should_clear_fail_counter_with_tenant_prefix() {
        // 先失败一次，写入计数
        assertThatThrownBy(() -> authService.login(
            new LoginCmd(TEST_USERNAME, "WrongPassword@999", null, null)))
            .isInstanceOf(UnauthorizedException.class);
        assertThat(redisTemplate.opsForValue().get(FAIL_KEY)).isEqualTo("1");

        // 成功登录应清除计数
        authService.login(new LoginCmd(TEST_USERNAME, TEST_PASSWORD, null, null));
        assertThat(redisTemplate.opsForValue().get(FAIL_KEY)).isNull();
    }
}
