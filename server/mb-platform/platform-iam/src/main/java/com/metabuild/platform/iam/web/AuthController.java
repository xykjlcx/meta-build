package com.metabuild.platform.iam.web;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.CurrentUserInfo;
import com.metabuild.common.security.LoginResult;
import com.metabuild.platform.iam.api.dto.CurrentUserView;
import com.metabuild.platform.iam.api.dto.LoginCommand;
import com.metabuild.platform.iam.api.dto.LoginView;
import com.metabuild.platform.iam.api.dto.RefreshCommand;
import com.metabuild.platform.iam.domain.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证 Controller（登录/登出/刷新）。
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;

    /**
     * 获取当前登录用户信息（前端 useCurrentUser 依赖）。
     * 需要认证，未登录返回 401。不需要额外权限，登录即可访问。
     */
    @GetMapping("/me")
    public CurrentUserView me() {
        return new CurrentUserView(
            currentUser.userId(),
            currentUser.username(),
            currentUser.deptId(),
            currentUser.permissions(),
            currentUser.roles(),
            currentUser.isAdmin()
        );
    }

    @PostMapping("/login")
    public LoginView login(@Valid @RequestBody LoginCommand request) {
        return toLoginView(authService.login(request));
    }

    @PostMapping("/logout")
    public void logout() {
        authService.logout();
    }

    /**
     * 刷新 access token。
     * 公开端点（已在全局认证拦截器中排除），使用 refresh token 换取新的 access token + refresh token。
     */
    @PostMapping("/refresh")
    public LoginView refresh(@Valid @RequestBody RefreshCommand request) {
        return toLoginView(authService.refresh(request.refreshToken()));
    }

    /**
     * 将内部 LoginResult 转换为 API 视图（移除数据权限字段）。
     */
    private LoginView toLoginView(LoginResult result) {
        CurrentUserInfo userInfo = result.user();
        LoginView.UserSummary summary = userInfo != null
            ? new LoginView.UserSummary(
                userInfo.userId(),
                userInfo.username(),
                userInfo.deptId(),
                userInfo.permissions())
            : null;
        return new LoginView(result.accessToken(), result.refreshToken(), result.expiresInSeconds(), summary);
    }
}
