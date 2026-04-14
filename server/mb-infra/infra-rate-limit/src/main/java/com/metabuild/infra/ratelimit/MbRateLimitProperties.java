package com.metabuild.infra.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 限流配置属性
 * <p>
 * 配置前缀：mb.rate-limit
 * 支持全局 QPS、按 IP QPS、按用户 QPS 三个维度的独立限流阈值。
 */
@ConfigurationProperties(prefix = "mb.rate-limit")
@Validated
public record MbRateLimitProperties(
        boolean enabled,
        int globalQps,
        int perIpQps,
        int perUserQps,
        int burstCapacity
) {
    public MbRateLimitProperties {
        if (globalQps <= 0) globalQps = 1000;
        if (perIpQps <= 0) perIpQps = 100;
        if (perUserQps <= 0) perUserQps = 200;
        if (burstCapacity <= 0) burstCapacity = 50;
        // enabled 默认 true（boolean 原始类型，false 是 JVM 默认值，这里通过构造器外部设置）
    }

    /**
     * 提供合理默认值的工厂方法（用于配置未声明时的兜底）
     */
    public static MbRateLimitProperties defaults() {
        return new MbRateLimitProperties(true, 1000, 100, 200, 50);
    }
}
