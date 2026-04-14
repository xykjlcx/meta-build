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

@AutoConfiguration
@EnableConfigurationProperties(MbObservabilityProperties.class)
public class ObservabilityAutoConfiguration {

    /**
     * 请求链路追踪过滤器：注入 traceId + userId 到 MDC。
     */
    @Bean
    public FilterRegistrationBean<TraceIdFilter> traceIdFilter(
            ObjectProvider<CurrentUser> currentUserProvider) {
        var registration = new FilterRegistrationBean<>(new TraceIdFilter(currentUserProvider));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.addUrlPatterns("/*");
        return registration;
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
