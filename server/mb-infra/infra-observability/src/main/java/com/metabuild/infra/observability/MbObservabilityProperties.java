package com.metabuild.infra.observability;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 可观测性配置项。
 *
 * <p>支持的配置：
 * <pre>{@code
 * mb:
 *   observability:
 *     slow-query-threshold-ms: 200
 * }</pre>
 */
@ConfigurationProperties(prefix = "mb.observability")
@Validated
public record MbObservabilityProperties(
        long slowQueryThresholdMs
) {
    /** 默认慢查询阈值（毫秒） */
    private static final long DEFAULT_SLOW_QUERY_THRESHOLD_MS = 200L;

    public MbObservabilityProperties {
        if (slowQueryThresholdMs <= 0) {
            slowQueryThresholdMs = DEFAULT_SLOW_QUERY_THRESHOLD_MS;
        }
    }

    /**
     * 无参构造便捷入口，使用默认值。
     */
    public MbObservabilityProperties() {
        this(DEFAULT_SLOW_QUERY_THRESHOLD_MS);
    }
}
