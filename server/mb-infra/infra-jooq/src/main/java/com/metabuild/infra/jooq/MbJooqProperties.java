package com.metabuild.infra.jooq;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * jOOQ 相关配置属性。
 */
@ConfigurationProperties(prefix = "mb.jooq")
public record MbJooqProperties(
    long slowQueryThresholdMs
) {
    public MbJooqProperties {
        if (slowQueryThresholdMs <= 0) {
            slowQueryThresholdMs = 500;
        }
    }
}
