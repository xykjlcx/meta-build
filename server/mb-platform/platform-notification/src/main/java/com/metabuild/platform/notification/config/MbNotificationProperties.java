package com.metabuild.platform.notification.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.hibernate.validator.constraints.time.DurationMin;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * 通知模块总配置。
 *
 * <p>配置前缀：mb.notification
 * <p>包含 enabled 开关（配合 ConditionalOnProperty）以及各渠道超时时间。
 */
@ConfigurationProperties(prefix = "mb.notification")
@Validated
public record MbNotificationProperties(
        boolean enabled,
        @NotNull @Valid Timeout timeout
) {
    public MbNotificationProperties {
        if (timeout == null) {
            timeout = new Timeout(
                    Duration.ofSeconds(2),
                    Duration.ofSeconds(15),
                    Duration.ofSeconds(10),
                    Duration.ofSeconds(10)
            );
        }
    }

    /**
     * 各渠道投递超时时间。
     */
    public record Timeout(
            @NotNull @DurationMin(seconds = 1) Duration inApp,
            @NotNull @DurationMin(seconds = 1) Duration email,
            @NotNull @DurationMin(seconds = 1) Duration wechatMp,
            @NotNull @DurationMin(seconds = 1) Duration wechatMini
    ) {
        public Timeout {
            if (inApp == null) inApp = Duration.ofSeconds(2);
            if (email == null) email = Duration.ofSeconds(15);
            if (wechatMp == null) wechatMp = Duration.ofSeconds(10);
            if (wechatMini == null) wechatMini = Duration.ofSeconds(10);
        }
    }
}
