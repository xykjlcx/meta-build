package com.metabuild.infra.security;

import com.metabuild.common.exception.CommonErrorCodes;
import cn.dev33.satoken.stp.StpUtil;
import com.metabuild.common.exception.ForbiddenException;
import com.metabuild.common.exception.UnauthorizedException;
import com.metabuild.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * @RequirePermission 切面：拦截带注解的 Controller 方法，先校验已登录，再校验权限。
 *
 * <p>即使全局拦截器已覆盖 /api/**，此处仍保留双重校验——防御纵深（defense in depth）。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RequirePermissionAspect {

    private final CurrentUser currentUser;

    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint,
                                  RequirePermission requirePermission) throws Throwable {
        // 第一步：确认已登录（防御纵深，全局拦截器未覆盖的场景）
        if (!StpUtil.isLogin()) {
            throw new UnauthorizedException(CommonErrorCodes.AUTH_UNAUTHORIZED);
        }

        String[] codes = requirePermission.value();
        RequirePermission.LogicType logic = requirePermission.logic();

        boolean granted;
        if (logic == RequirePermission.LogicType.AND) {
            granted = currentUser.hasAllPermissions(codes);
        } else {
            granted = currentUser.hasAnyPermission(codes);
        }

        if (!granted) {
            log.warn("权限不足: userId={}, required={}, logic={}, actual={}",
                    currentUser.userId(), codes, logic, currentUser.permissions());
            throw new ForbiddenException(CommonErrorCodes.AUTH_FORBIDDEN);
        }

        return joinPoint.proceed();
    }
}
