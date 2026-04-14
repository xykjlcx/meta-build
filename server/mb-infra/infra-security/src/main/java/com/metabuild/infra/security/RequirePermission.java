package com.metabuild.infra.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 权限校验注解，标注在 Controller 方法上。
 * 由 {@link RequirePermissionAspect} 拦截处理。
 * <p>
 * 示例：
 * <pre>
 * {@literal @}RequirePermission("iam:user:list")
 * {@literal @}RequirePermission(value = {"iam:user:create", "iam:user:update"}, logic = LogicType.OR)
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {

    /**
     * 必须拥有的权限码列表。
     */
    String[] value();

    /**
     * 多权限的逻辑关系，默认 AND（必须全部拥有）。
     */
    LogicType logic() default LogicType.AND;

    enum LogicType {
        /** 必须同时拥有所有权限 */
        AND,
        /** 拥有任意一个权限即可 */
        OR
    }
}
