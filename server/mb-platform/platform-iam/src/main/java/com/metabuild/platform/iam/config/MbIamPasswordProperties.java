package com.metabuild.platform.iam.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * IAM 密码策略配置属性。
 * 所有参数均有默认值，开箱即用。
 */
@ConfigurationProperties(prefix = "mb.iam.password")
@Validated
public record MbIamPasswordProperties(
    Integer minLength,
    Integer maxLength,
    Boolean requireDigit,
    Boolean requireLetter,
    Boolean requireUppercase,
    Boolean requireSpecial,
    Integer historyCount,
    Integer maxAgeDays,
    Integer captchaThreshold,
    Integer delayThreshold,
    Integer shortDelaySeconds,
    Integer longDelaySeconds,
    Integer failCountTtlMinutes,
    Integer resetTokenTtlMinutes
) {
    /** 紧凑构造器：为 null 的字段设置默认值 */
    public MbIamPasswordProperties {
        if (minLength == null) minLength = 8;
        if (maxLength == null) maxLength = 128;
        if (requireDigit == null) requireDigit = true;
        if (requireLetter == null) requireLetter = true;
        if (requireUppercase == null) requireUppercase = false;
        if (requireSpecial == null) requireSpecial = false;
        if (historyCount == null) historyCount = 5;
        if (maxAgeDays == null) maxAgeDays = 0;
        if (captchaThreshold == null) captchaThreshold = 3;
        if (delayThreshold == null) delayThreshold = 5;
        if (shortDelaySeconds == null) shortDelaySeconds = 30;
        if (longDelaySeconds == null) longDelaySeconds = 300;
        if (failCountTtlMinutes == null) failCountTtlMinutes = 30;
        if (resetTokenTtlMinutes == null) resetTokenTtlMinutes = 15;
    }
}
