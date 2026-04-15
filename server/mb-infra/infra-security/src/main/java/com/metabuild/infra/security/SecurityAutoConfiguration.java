package com.metabuild.infra.security;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * infra-security 自动配置入口。
 * 注册认证/授权/CORS/密码编码器/force-logout 兜底全部组件。
 */
@AutoConfiguration
@EnableConfigurationProperties({MbAuthProperties.class, MbCorsProperties.class})
@EnableAspectJAutoProxy
@Import({
        SaTokenJwtConfig.class,
        CorsConfig.class,
        PasswordEncoderConfig.class,
        SaTokenCurrentUser.class,
        SaPermissionImpl.class,
        RequirePermissionAspect.class,
        SaTokenAuthFacade.class,
        RefreshTokenService.class
})
public class SecurityAutoConfiguration implements WebMvcConfigurer {

    private final StringRedisTemplate redisTemplate;

    public SecurityAutoConfiguration(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Bean
    public ForceLogoutCheckInterceptor forceLogoutCheckInterceptor() {
        return new ForceLogoutCheckInterceptor(redisTemplate);
    }

    /**
     * 全局认证拦截器 + force-logout 兜底拦截器。
     * opt-out 模式（默认拦截），而非 opt-in（默认放行）。
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 1. 全局认证拦截器
        registry.addInterceptor(new SaInterceptor(handle -> StpUtil.checkLogin()))
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/public/**",
                        "/api-docs",
                        "/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                );

        // 2. force-logout Redis 兜底拦截器（在认证拦截器之后执行）
        registry.addInterceptor(forceLogoutCheckInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/v1/auth/login",
                        "/api/v1/auth/refresh",
                        "/api/v1/public/**"
                );
    }
}
