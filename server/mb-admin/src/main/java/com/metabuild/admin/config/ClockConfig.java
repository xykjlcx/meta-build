package com.metabuild.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * 全局时间策略（ADR-0012）：生产用 UTC Clock，测试可替换为 fixed Clock。
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
