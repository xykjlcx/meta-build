package com.metabuild.platform.notification.config;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * 可选邮件渠道健康检查。
 *
 * <p>SMTP 未配置时，邮件渠道按产品语义应当被视为"禁用但不影响服务整体可用性"；
 * 只有在显式配置 SMTP 后，才执行真实连通性检查。
 */
final class OptionalMailHealthIndicator extends AbstractHealthIndicator {

    private final ObjectProvider<JavaMailSenderImpl> mailSenderProvider;
    private final EmailProperties emailProperties;

    OptionalMailHealthIndicator(
            ObjectProvider<JavaMailSenderImpl> mailSenderProvider,
            EmailProperties emailProperties) {
        this.mailSenderProvider = mailSenderProvider;
        this.emailProperties = emailProperties;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        if (!emailProperties.isConfigured()) {
            builder.up()
                    .withDetail("enabled", false)
                    .withDetail("reason", "SMTP not configured");
            return;
        }

        JavaMailSenderImpl mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            builder.down()
                    .withDetail("enabled", true)
                    .withDetail("reason", "JavaMailSender not available");
            return;
        }

        mailSender.testConnection();
        builder.up()
                .withDetail("enabled", true)
                .withDetail("host", emailProperties.host());
    }
}
