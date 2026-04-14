package com.metabuild.platform.iam.web;

import com.metabuild.common.security.LoginResult;
import com.metabuild.platform.iam.api.dto.LoginRequest;
import com.metabuild.platform.iam.api.dto.RefreshRequest;
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

    @PostMapping("/login")
    public LoginResult login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
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
    public LoginResult refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }
}
