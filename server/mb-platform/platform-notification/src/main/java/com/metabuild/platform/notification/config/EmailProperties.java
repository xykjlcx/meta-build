package com.metabuild.platform.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * 邮件渠道配置属性。
 *
 * <p>配置前缀：mb.email
 * <p>host 为空时邮件渠道自动跳过。
 */
@ConfigurationProperties(prefix = "mb.email")
@Validated
public record EmailProperties(
    String host,
    String from,
    String baseUrl
) {
    public EmailProperties {
        if (host == null) host = "";
        if (from == null) from = "";
        if (baseUrl == null) baseUrl = "http://localhost:5173";
    }

    /** SMTP 是否已配置 */
    public boolean isConfigured() {
        return !host.isBlank();
    }
}
