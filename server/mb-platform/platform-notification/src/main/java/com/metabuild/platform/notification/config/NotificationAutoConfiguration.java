package com.metabuild.platform.notification.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * 通知公告模块自动配置入口。
 *
 * <p>通过 mb.notification.enabled=false 可整体关闭本模块（默认开启）。
 */
@AutoConfiguration
@ConditionalOnProperty(name = "mb.notification.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties({MbNotificationProperties.class, WeChatProperties.class, EmailProperties.class})
@ComponentScan(basePackages = "com.metabuild.platform.notification")
public class NotificationAutoConfiguration {

    /**
     * 邮件渠道健康检查：
     * SMTP 未配置时不拖垮整体 health，已配置时再做真实连通性检查。
     */
    @Bean
    @ConditionalOnClass(HealthIndicator.class)
    public HealthIndicator notificationMailHealthIndicator(
            ObjectProvider<JavaMailSenderImpl> mailSenderProvider,
            EmailProperties emailProperties) {
        return new OptionalMailHealthIndicator(mailSenderProvider, emailProperties);
    }
}
