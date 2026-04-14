package com.metabuild.platform.dict.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * 字典模块自动配置入口。
 */
@AutoConfiguration
@ComponentScan(basePackages = "com.metabuild.platform.dict")
public class DictAutoConfiguration {
}
