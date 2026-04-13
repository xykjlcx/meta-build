package com.metabuild.infra.jooq;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ID 生成器配置属性。worker/datacenter 范围 0~31，由 SnowflakeIdGenerator 构造函数校验。
 */
@ConfigurationProperties(prefix = "mb.id")
public record MbIdProperties(
    long worker,
    long datacenter
) {}
