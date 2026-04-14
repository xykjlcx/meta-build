package com.metabuild.infra.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * CORS 配置属性（mb.cors.*）。
 */
@ConfigurationProperties(prefix = "mb.cors")
@Validated
public record MbCorsProperties(
        List<String> allowedOrigins,
        List<String> allowedMethods,
        List<String> allowedHeaders,
        boolean allowCredentials,
        long maxAgeSeconds
) {
    public MbCorsProperties {
        // 默认值兜底
        // allowedOrigins 默认为空列表（不允许任何跨域），必须在配置文件中显式指定
        // 避免通配符 "*" 成为安全默认值（反面教材：opt-in 安全模式）
        if (allowedOrigins == null) {
            allowedOrigins = List.of();
        }
        if (allowedMethods == null || allowedMethods.isEmpty()) {
            allowedMethods = List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS");
        }
        if (allowedHeaders == null || allowedHeaders.isEmpty()) {
            allowedHeaders = List.of("*");
        }
        if (maxAgeSeconds <= 0) maxAgeSeconds = 3600L;
    }
}
