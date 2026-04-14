package com.metabuild.infra.ratelimit;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 限流自动配置
 * <p>
 * 注册 {@link RateLimitInterceptor} 并将其加入 Spring MVC 拦截器链。
 * 通过 {@code mb.rate-limit.enabled=false} 可全局关闭限流（开发/测试环境使用）。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbRateLimitProperties.class)
public class RateLimitAutoConfiguration implements WebMvcConfigurer {

    private final MbRateLimitProperties props;

    public RateLimitAutoConfiguration(MbRateLimitProperties props) {
        this.props = props;
    }

    /**
     * 注册限流拦截器 Bean
     */
    @Bean
    public RateLimitInterceptor rateLimitInterceptor() {
        return new RateLimitInterceptor(props);
    }

    /**
     * 将限流拦截器加入 MVC 拦截器链，覆盖所有路径
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor())
                .addPathPatterns("/**");
    }
}
