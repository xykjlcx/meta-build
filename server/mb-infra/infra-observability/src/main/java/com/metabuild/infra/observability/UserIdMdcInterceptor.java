package com.metabuild.infra.observability;

import com.metabuild.common.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 在 Spring MVC 处理请求之前将 userId 注入 MDC，确保日志中带有用户身份信息。
 *
 * <p>HandlerInterceptor 运行在认证过滤器之后、Controller 之前，
 * 此时 Sa-Token 已完成身份识别，可以安全读取 CurrentUser。
 */
@RequiredArgsConstructor
public class UserIdMdcInterceptor implements HandlerInterceptor {

    private static final String MDC_USER_ID = "userId";

    private final ObjectProvider<CurrentUser> currentUserProvider;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            CurrentUser user = currentUserProvider.getIfAvailable();
            if (user != null && user.isAuthenticated()) {
                MDC.put(MDC_USER_ID, String.valueOf(user.userId()));
            }
        } catch (Exception e) {
            // 获取用户信息失败不影响正常流程，静默跳过
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        MDC.remove(MDC_USER_ID);
    }
}
