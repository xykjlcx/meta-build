package com.metabuild.infra.jooq.datascope;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;

/**
 * 数据权限绕过切面：拦截标注了 @BypassDataScope 的方法，
 * 通过 ThreadLocal 标记当前线程跳过数据权限过滤。
 *
 * <p>DataScopeVisitListener 在构建 SQL 时通过 isBypassed() 检查此标记。
 */
@Aspect
@Slf4j
public class BypassDataScopeAspect {

    /** 当前线程是否跳过数据权限过滤 */
    private static final ThreadLocal<Boolean> BYPASS = ThreadLocal.withInitial(() -> false);

    /**
     * 环绕通知：设置跳过标记 → 执行目标方法 → 清除标记。
     */
    @Around("@annotation(com.metabuild.common.security.BypassDataScope)")
    public Object bypass(ProceedingJoinPoint pjp) throws Throwable {
        BYPASS.set(true);
        log.debug("数据权限绕过：{}", pjp.getSignature());
        try {
            return pjp.proceed();
        } finally {
            BYPASS.remove();
        }
    }

    /**
     * 判断当前线程是否处于数据权限绕过状态。
     * 供 DataScopeVisitListener 调用。
     *
     * @return 绕过返回 true
     */
    public static boolean isBypassed() {
        return Boolean.TRUE.equals(BYPASS.get());
    }
}
