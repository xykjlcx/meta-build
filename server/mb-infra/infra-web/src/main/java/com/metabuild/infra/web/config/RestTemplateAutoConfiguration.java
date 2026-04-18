package com.metabuild.infra.web.config;

import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.Timeout;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * 共享 RestTemplate 自动配置。
 *
 * <p>装配 Apache HttpClient 5 连接池 + 超时，应用全局共享同一实例，避免高并发场景 socket 耗尽。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbRestTemplateProperties.class)
public class RestTemplateAutoConfiguration {

    @Bean
    public RestTemplate mbRestTemplate(MbRestTemplateProperties properties) {
        PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(properties.maxTotalConnections())
                .setMaxConnPerRoute(properties.maxConnectionsPerRoute())
                .build();

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(properties.connectTimeout().toMillis()))
                .setResponseTimeout(Timeout.ofMilliseconds(properties.readTimeout().toMillis()))
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(properties.connectTimeout().toMillis()))
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .evictExpiredConnections()
                .build();

        return new RestTemplate(new HttpComponentsClientHttpRequestFactory(httpClient));
    }
}
