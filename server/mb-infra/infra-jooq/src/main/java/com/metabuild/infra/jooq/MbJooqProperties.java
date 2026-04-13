package com.metabuild.infra.jooq;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * jOOQ 相关配置属性。
 */
@Validated
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
