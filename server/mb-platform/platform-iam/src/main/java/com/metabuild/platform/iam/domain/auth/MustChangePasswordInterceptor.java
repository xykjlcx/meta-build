package com.metabuild.platform.iam.domain.auth;

import cn.dev33.satoken.stp.StpUtil;
import com.metabuild.common.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 强制修改密码拦截器。
 * 用户 mustChangePassword=true 时，只允许访问密码修改接口，其他接口返回 403。
 */
@Slf4j
public class MustChangePasswordInterceptor implements HandlerInterceptor {

    /** Session 中存储"强制修改密码"标志的键名 */
    public static final String SESSION_KEY_MUST_CHANGE_PASSWORD = "mustChangePassword";

    /** 允许访问的路径白名单（不需要登录或允许未改密码用户访问） */
    private static final String[] ALLOWED_PATHS = {
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/auth/refresh",
        "/api/v1/users/me/password",
        "/api/v1/captcha",
        "/actuator",
    };

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 未登录放行（由 Sa-Token 自身拦截）
        if (!StpUtil.isLogin()) {
            return true;
        }

        String path = request.getRequestURI();

        // 白名单放行
        for (String allowed : ALLOWED_PATHS) {
            if (path.startsWith(allowed)) {
                return true;
            }
        }

        // 检查是否需要强制修改密码
        Object mustChange = StpUtil.getSession().get(SESSION_KEY_MUST_CHANGE_PASSWORD);
        if (Boolean.TRUE.equals(mustChange)) {
            log.warn("用户需要修改密码，拒绝访问: path={}", path);
            throw new ForbiddenException("iam.auth.mustChangePassword");
        }

        return true;
    }
}
