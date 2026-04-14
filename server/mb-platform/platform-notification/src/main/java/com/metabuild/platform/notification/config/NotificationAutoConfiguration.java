package com.metabuild.platform.notification.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * 通知公告模块自动配置入口。
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.metabuild.platform.notification")
public class NotificationAutoConfiguration {
}
