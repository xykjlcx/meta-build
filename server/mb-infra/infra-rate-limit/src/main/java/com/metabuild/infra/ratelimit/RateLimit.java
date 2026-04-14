package com.metabuild.infra.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 限流注解
 * <p>
 * 标注在 Controller 方法上，指定该接口的 QPS 限制。
 * 未指定 qps 时（qps=0）使用全局默认值 {@code mb.rate-limit.globalQps}。
 * 未指定 key 时使用方法签名（类名 + 方法名）作为限流 key。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * 每秒最大请求数，0 表示使用全局默认值
     */
    int qps() default 0;

    /**
     * 自定义限流 key，默认为空（使用方法签名）
     */
    String key() default "";
}
