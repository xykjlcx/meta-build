package com.metabuild.admin.iam;

import com.metabuild.common.exception.ForbiddenException;
import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.platform.iam.domain.auth.MustChangePasswordInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * MustChangePasswordInterceptor 单元测试：
 * 重点覆盖白名单匹配语义，确保从 startsWith 切到 AntPathMatcher 后不存在前缀绕过。
 */
class MustChangePasswordInterceptorTest {

    private CurrentUser currentUser;
    private AuthFacade authFacade;
    private MustChangePasswordInterceptor interceptor;

    @BeforeEach
    void setUp() {
        currentUser = Mockito.mock(CurrentUser.class);
        authFacade = Mockito.mock(AuthFacade.class);
        interceptor = new MustChangePasswordInterceptor(currentUser, authFacade);

        // 默认：已登录且需要强制改密
        Mockito.when(currentUser.isAuthenticated()).thenReturn(true);
        Mockito.when(authFacade.getSessionFlag(
            MustChangePasswordInterceptor.SESSION_KEY_MUST_CHANGE_PASSWORD))
            .thenReturn(Boolean.TRUE);
    }

    // ───────── 白名单：精确路径命中 ─────────

    @Test
    void should_allow_exact_login_path() {
        assertThat(handle("/api/v1/auth/login")).isTrue();
    }

    @Test
    void should_allow_exact_password_change_path() {
        assertThat(handle("/api/v1/users/me/password")).isTrue();
    }

    // ───────── 白名单：Ant 通配命中 ─────────

    @Test
    void should_allow_captcha_subpath_via_wildcard() {
        assertThat(handle("/api/v1/captcha/generate")).isTrue();
    }

    @Test
    void should_allow_actuator_root_and_subpath() {
        assertThat(handle("/actuator")).isTrue();
        assertThat(handle("/actuator/health")).isTrue();
    }

    // ───────── 前缀绕过：原 startsWith 会放行的恶意路径，现在必须拦截 ─────────

    @Test
    void should_block_prefix_bypass_on_password_endpoint() {
        // startsWith("/api/v1/users/me/password") 会放行 /api/v1/users/me/password/any/evil
        assertThatThrownBy(() -> handle("/api/v1/users/me/password/evil"))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void should_block_prefix_bypass_on_login_endpoint() {
        assertThatThrownBy(() -> handle("/api/v1/auth/login-exploit"))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void should_block_prefix_bypass_on_actuator() {
        assertThatThrownBy(() -> handle("/actuator-admin/secret"))
            .isInstanceOf(ForbiddenException.class);
    }

    // ───────── 非白名单：拦截 ─────────

    @Test
    void should_block_business_api_when_must_change_password() {
        assertThatThrownBy(() -> handle("/api/v1/users"))
            .isInstanceOf(ForbiddenException.class);
    }

    // ───────── 未登录放行（由 Sa-Token 接手） ─────────

    @Test
    void should_pass_through_when_not_authenticated() {
        Mockito.when(currentUser.isAuthenticated()).thenReturn(false);
        assertThat(handle("/api/v1/users")).isTrue();
    }

    // ───────── 已登录但不需要改密：放行 ─────────

    @Test
    void should_allow_when_must_change_password_flag_false() {
        Mockito.when(authFacade.getSessionFlag(
            MustChangePasswordInterceptor.SESSION_KEY_MUST_CHANGE_PASSWORD))
            .thenReturn(Boolean.FALSE);
        assertThat(handle("/api/v1/users")).isTrue();
    }

    private boolean handle(String uri) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRequestURI(uri);
        MockHttpServletResponse resp = new MockHttpServletResponse();
        return interceptor.preHandle(req, resp, new Object());
    }
}
