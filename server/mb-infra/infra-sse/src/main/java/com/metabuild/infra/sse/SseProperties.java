package com.metabuild.infra.sse;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * SSE 配置属性。
 *
 * <p>配置前缀：mb.sse
 */
@ConfigurationProperties(prefix = "mb.sse")
@Validated
public record SseProperties(
    int maxConnections,
    long emitterTimeoutMs
) {
    public SseProperties {
        if (maxConnections <= 0) maxConnections = 5000;
        if (emitterTimeoutMs <= 0) emitterTimeoutMs = 1_800_000L;
    }
}
