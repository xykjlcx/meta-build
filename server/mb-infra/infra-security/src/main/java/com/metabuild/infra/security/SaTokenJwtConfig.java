package com.metabuild.infra.security;

import cn.dev33.satoken.jwt.StpLogicJwtForSimple;
import cn.dev33.satoken.stp.StpLogic;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Sa-Token JWT 模式配置。
 * 使用 Simple JWT 模式：token 采用 JWT 格式（含签名），同时在 Redis 中保留 Session。
 * StpUtil.getSession() 可用，踢人下线等有状态操作正常工作。
 *
 * <p>application.yml 中需配置 sa-token.jwt-secret-key。
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class SaTokenJwtConfig {

    /**
     * 启用 Sa-Token JWT Simple 模式（JWT 格式 token + Redis Session 管理）。
     */
    @Bean
    public StpLogic getStpLogicJwt() {
        log.info("启用 Sa-Token JWT Simple 模式（JWT + Redis Session）");
        return new StpLogicJwtForSimple();
    }
}
