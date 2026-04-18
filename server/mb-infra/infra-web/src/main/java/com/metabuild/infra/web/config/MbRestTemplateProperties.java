package com.metabuild.infra.web.config;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * 共享 RestTemplate 配置属性。
 *
 * <p>配置前缀：mb.rest-template
 * <p>装配 Apache HttpClient 5 连接池 + 超时，所有微服务共享同一实例。
 */
@ConfigurationProperties(prefix = "mb.rest-template")
@Validated
public record MbRestTemplateProperties(
        @NotNull Duration connectTimeout,
        @NotNull Duration readTimeout,
        @NotNull Duration connectionRequestTimeout,
        @NotNull Duration validateAfterInactivity,
        @NotNull Duration evictIdleConnectionsAfter,
        @Positive int maxTotalConnections,
        @Positive int maxConnectionsPerRoute
) {
    public MbRestTemplateProperties {
        if (connectTimeout == null) connectTimeout = Duration.ofSeconds(5);
        if (readTimeout == null) readTimeout = Duration.ofSeconds(30);
        if (connectionRequestTimeout == null) connectionRequestTimeout = Duration.ofSeconds(2);
        if (validateAfterInactivity == null) validateAfterInactivity = Duration.ofSeconds(10);
        if (evictIdleConnectionsAfter == null) evictIdleConnectionsAfter = Duration.ofSeconds(30);
        if (maxTotalConnections <= 0) maxTotalConnections = 200;
        if (maxConnectionsPerRoute <= 0) maxConnectionsPerRoute = 100;
    }
}
