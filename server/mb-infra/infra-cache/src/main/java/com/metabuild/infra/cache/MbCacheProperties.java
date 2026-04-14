package com.metabuild.infra.cache;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 缓存配置属性
 * <p>
 * 配置前缀：mb.cache
 * 默认 TTL：3600 秒（1 小时）
 * 默认 jitter 比例：10%，防止缓存雪崩
 */
@ConfigurationProperties(prefix = "mb.cache")
@Validated
public record MbCacheProperties(
        long defaultTtlSeconds,
        int jitterPercent
) {
    public MbCacheProperties {
        if (defaultTtlSeconds <= 0) defaultTtlSeconds = 3600;
        if (jitterPercent <= 0) jitterPercent = 10;
    }
}
