package com.metabuild.infra.jooq;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * ID 生成器配置属性。worker/datacenter 范围 0~31，由 SnowflakeIdGenerator 构造函数校验。
 */
@Validated
@ConfigurationProperties(prefix = "mb.id")
public record MbIdProperties(
    @Min(0) @Max(31) long worker,
    @Min(0) @Max(31) long datacenter
) {}
