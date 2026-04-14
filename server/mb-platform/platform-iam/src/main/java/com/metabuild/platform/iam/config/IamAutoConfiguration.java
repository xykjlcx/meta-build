package com.metabuild.platform.iam.config;

import com.metabuild.platform.iam.domain.auth.MustChangePasswordInterceptor;
import com.metabuild.platform.iam.domain.auth.PasswordPolicy;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

/**
 * IAM 自动配置入口。
 * 通过 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 自动加载。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbIamPasswordProperties.class)
@ComponentScan(basePackages = "com.metabuild.platform.iam")
public class IamAutoConfiguration {

    @Bean
    public PasswordPolicy passwordPolicy(MbIamPasswordProperties props) {
        return new PasswordPolicy(props);
    }

    @Bean
    public MustChangePasswordInterceptor mustChangePasswordInterceptor() {
        return new MustChangePasswordInterceptor();
    }
}
