package com.metabuild.platform.file.config;

import com.metabuild.platform.file.api.FileStorage;
import com.metabuild.platform.file.domain.LocalFileStorage;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

/**
 * 文件模块自动配置入口。
 * 默认注册 LocalFileStorage 实现。
 */
@AutoConfiguration
@EnableConfigurationProperties(MbFileProperties.class)
@ComponentScan(basePackages = "com.metabuild.platform.file")
public class FileAutoConfiguration {

    @Bean
    public FileStorage fileStorage(MbFileProperties properties) {
        return new LocalFileStorage(properties);
    }
}
