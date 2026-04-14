package com.metabuild.infra.security;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * infra-security 自动配置入口。
 * 注册认证/授权/CORS/密码编码器全部组件，作为 Spring Boot AutoConfiguration 被自动加载。
 *
 * <p>显式 @Import 代替 @ComponentScan，避免自动装配扫描范围过宽（与其他模块的 AutoConfiguration 风格一致）。
 *
 * <p>实现 WebMvcConfigurer 以注册全局认证拦截器，避免 opt-in 安全模式（反面教材 #2）。
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

    /**
     * 全局认证拦截器：所有 /api/** 必须登录，公开端点显式排除。
     * opt-out 模式（默认拦截），而非 opt-in（默认放行）。
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
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
    }
}
