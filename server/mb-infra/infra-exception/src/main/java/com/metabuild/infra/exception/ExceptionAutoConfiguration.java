package com.metabuild.infra.exception;

import com.metabuild.infra.exception.web.MbPaginationProperties;
import com.metabuild.infra.exception.web.SecurityHeaderFilter;
import com.metabuild.infra.exception.web.WebMvcConfig;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;

/**
 * infra-exception 自动配置：注册 GlobalExceptionHandler、WebMvc 扩展（分页参数解析）、安全响应头过滤器。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbPaginationProperties.class)
public class ExceptionAutoConfiguration {

    @Bean
    public GlobalExceptionHandler globalExceptionHandler(MessageSource messageSource) {
        return new GlobalExceptionHandler(messageSource);
    }

    @Bean
    public WebMvcConfig exceptionWebMvcConfig(MbPaginationProperties paginationProperties) {
        return new WebMvcConfig(paginationProperties);
    }

    @Bean
    public FilterRegistrationBean<SecurityHeaderFilter> securityHeaderFilter() {
        var registration = new FilterRegistrationBean<>(new SecurityHeaderFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        registration.addUrlPatterns("/*");
        return registration;
    }
}
