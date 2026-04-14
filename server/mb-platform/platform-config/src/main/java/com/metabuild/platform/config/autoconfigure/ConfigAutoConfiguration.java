package com.metabuild.platform.config.autoconfigure;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * 系统配置模块自动配置入口。
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.metabuild.platform.config")
public class ConfigAutoConfiguration {
}
