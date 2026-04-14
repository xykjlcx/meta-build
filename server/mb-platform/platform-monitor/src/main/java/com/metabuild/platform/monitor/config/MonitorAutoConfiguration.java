package com.metabuild.platform.monitor.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * 服务监控模块自动配置入口。
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.metabuild.platform.monitor")
public class MonitorAutoConfiguration {
}
