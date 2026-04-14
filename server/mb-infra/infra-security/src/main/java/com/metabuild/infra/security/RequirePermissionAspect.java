package com.metabuild.infra.security;

import com.metabuild.common.exception.ForbiddenException;
import com.metabuild.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * @RequirePermission 切面：拦截带注解的 Controller 方法，校验当前用户权限。
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
            throw new ForbiddenException("errors.auth.forbidden");
        }

        return joinPoint.proceed();
    }
}
