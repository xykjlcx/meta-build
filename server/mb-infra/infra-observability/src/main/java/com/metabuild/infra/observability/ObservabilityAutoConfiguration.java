package com.metabuild.infra.observability;

import com.metabuild.common.security.CurrentUser;
import io.micrometer.core.instrument.MeterRegistry;
import org.jooq.DSLContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@AutoConfiguration
@EnableConfigurationProperties(MbObservabilityProperties.class)
public class ObservabilityAutoConfiguration implements WebMvcConfigurer {

    private final ObjectProvider<CurrentUser> currentUserProvider;

    public ObservabilityAutoConfiguration(ObjectProvider<CurrentUser> currentUserProvider) {
        this.currentUserProvider = currentUserProvider;
    }

    /**
     * 请求链路追踪过滤器：注入 traceId 到 MDC（最高优先级，全部请求）。
     * userId 由 {@link UserIdMdcInterceptor} 在认证后注入，时序正确。
     */
    @Bean
    public FilterRegistrationBean<TraceIdFilter> traceIdFilter() {
        var registration = new FilterRegistrationBean<>(new TraceIdFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/*");
        return registration;
    }

    /**
     * userId MDC 拦截器 Bean。
     */
    @Bean
    public UserIdMdcInterceptor userIdMdcInterceptor() {
        return new UserIdMdcInterceptor(currentUserProvider);
    }

    /**
     * 将 userId MDC 拦截器加入 MVC 拦截器链。
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(userIdMdcInterceptor()).addPathPatterns("/**");
    }

    /**
     * 数据库就绪健康检查（需要 DSLContext 存在）。
     */
    @Bean
    @ConditionalOnClass(name = "org.jooq.DSLContext")
    @ConditionalOnBean(DSLContext.class)
    public DatabaseReadinessIndicator databaseReadinessIndicator(DSLContext dsl) {
        return new DatabaseReadinessIndicator(dsl);
    }

    /**
     * 认证业务指标（需要 MeterRegistry 存在）。
     */
    @Bean
    @ConditionalOnBean(MeterRegistry.class)
    public AuthMetrics authMetrics(MeterRegistry registry) {
        return new AuthMetrics(registry);
    }
}
