package com.metabuild.infra.web;

import com.metabuild.infra.web.pagination.MbPaginationProperties;
import com.metabuild.infra.web.pagination.PaginationPolicy;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * infra-web 自动配置：注册共享 Web 边界能力。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbPaginationProperties.class)
public class WebAutoConfiguration {

    @Bean
    public PaginationPolicy paginationPolicy(MbPaginationProperties paginationProperties) {
        return new PaginationPolicy(paginationProperties);
    }
}
