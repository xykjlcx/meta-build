package com.metabuild.infra.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 限流配置属性
 * <p>
 * 配置前缀：mb.rate-limit
 * 支持全局 QPS、按 IP QPS、按用户 QPS 三个维度的独立限流阈值。
 *
 * <p>使用 {@code Boolean}（包装类型）而非 {@code boolean}，
 * 以便在 compact constructor 中将 null（未配置）默认为 true。
 */
@ConfigurationProperties(prefix = "mb.rate-limit")
@Validated
public record MbRateLimitProperties(
        Boolean enabled,
        int globalQps,
        int perIpQps,
        int perUserQps,
        int burstCapacity
) {
    public MbRateLimitProperties {
        if (enabled == null) enabled = true;
        if (globalQps <= 0) globalQps = 1000;
        if (perIpQps <= 0) perIpQps = 100;
        if (perUserQps <= 0) perUserQps = 200;
        if (burstCapacity <= 0) burstCapacity = 50;
    }

    /**
     * 提供合理默认值的工厂方法（用于配置未声明时的兜底）
     */
    public static MbRateLimitProperties defaults() {
        return new MbRateLimitProperties(true, 1000, 100, 200, 50);
    }
}
