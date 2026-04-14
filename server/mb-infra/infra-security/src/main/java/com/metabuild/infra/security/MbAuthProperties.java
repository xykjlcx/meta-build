package com.metabuild.infra.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Sa-Token 认证相关配置属性（mb.auth.*）。
 */
@ConfigurationProperties(prefix = "mb.auth")
@Validated
public record MbAuthProperties(
        long tokenTimeout,
        long refreshTimeout,
        String tokenName
) {
    public MbAuthProperties {
        // 默认值兜底
        if (tokenTimeout <= 0) tokenTimeout = 7200L;
        if (refreshTimeout <= 0) refreshTimeout = 604800L;
        if (tokenName == null || tokenName.isBlank()) tokenName = "Authorization";
    }
}
