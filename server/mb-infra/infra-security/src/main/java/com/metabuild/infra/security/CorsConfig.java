package com.metabuild.infra.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS 全局配置，从 {@link MbCorsProperties} 读取，覆盖所有路径。
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    private final MbCorsProperties corsProperties;

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        corsProperties.allowedOrigins().forEach(config::addAllowedOriginPattern);
        corsProperties.allowedMethods().forEach(config::addAllowedMethod);
        corsProperties.allowedHeaders().forEach(config::addAllowedHeader);
        config.setAllowCredentials(corsProperties.allowCredentials());
        config.setMaxAge(corsProperties.maxAgeSeconds());

        // 允许前端读取的响应头
        config.addExposedHeader("Authorization");
        config.addExposedHeader("X-Trace-Id");

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        log.info("CORS 配置加载完成: allowedOrigins={}", corsProperties.allowedOrigins());
        return new CorsFilter(source);
    }
}
