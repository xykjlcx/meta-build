package com.metabuild.infra.security;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;

/**
 * infra-security 自动配置入口。
 * 注册认证/授权/CORS/密码编码器全部组件，作为 Spring Boot AutoConfiguration 被自动加载。
 *
 * <p>显式 @Import 代替 @ComponentScan，避免自动装配扫描范围过宽（与其他模块的 AutoConfiguration 风格一致）。
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
        SaTokenAuthFacade.class
})
public class SecurityAutoConfiguration {
}
