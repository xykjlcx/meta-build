package com.metabuild.platform.notification.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;

/**
 * 通知公告模块自动配置入口。
 */
@AutoConfiguration
@EnableConfigurationProperties({WeChatProperties.class, EmailProperties.class})
@ComponentScan(basePackages = "com.metabuild.platform.notification")
public class NotificationAutoConfiguration {
}
