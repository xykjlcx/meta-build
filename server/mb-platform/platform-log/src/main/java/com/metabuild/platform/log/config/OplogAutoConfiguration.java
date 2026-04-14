package com.metabuild.platform.log.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * 操作日志模块自动配置入口。
 * 通过 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 自动加载。
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.metabuild.platform.log")
public class OplogAutoConfiguration {
}
