package com.metabuild.infra.security;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;

/**
 * infra-security 自动配置入口。
 * 注册认证/授权/CORS/密码编码器全部组件，作为 Spring Boot AutoConfiguration 被自动加载。
 */
@AutoConfiguration
@EnableConfigurationProperties({MbAuthProperties.class, MbCorsProperties.class})
@EnableAspectJAutoProxy
@Import({
        SaTokenJwtConfig.class,
        CorsConfig.class,
        PasswordEncoderConfig.class
})
@ComponentScan(basePackageClasses = SecurityAutoConfiguration.class)
public class SecurityAutoConfiguration {
}
