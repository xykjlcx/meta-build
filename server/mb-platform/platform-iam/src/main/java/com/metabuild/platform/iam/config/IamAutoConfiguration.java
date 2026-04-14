package com.metabuild.platform.iam.config;

import com.metabuild.platform.iam.domain.auth.MustChangePasswordInterceptor;
import com.metabuild.platform.iam.domain.auth.PasswordPolicy;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * IAM 自动配置入口。
 * 通过 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 自动加载。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbIamPasswordProperties.class)
@ComponentScan(basePackages = "com.metabuild.platform.iam")
public class IamAutoConfiguration implements WebMvcConfigurer {

    @Bean
    public PasswordPolicy passwordPolicy(MbIamPasswordProperties props) {
        return new PasswordPolicy(props);
    }

    @Bean
    public MustChangePasswordInterceptor mustChangePasswordInterceptor() {
        return new MustChangePasswordInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(mustChangePasswordInterceptor())
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/v1/auth/**", "/api/v1/public/**");
    }
}
