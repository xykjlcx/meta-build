package com.metabuild.infra.security;

import cn.dev33.satoken.jwt.StpLogicJwtForStateless;
import cn.dev33.satoken.stp.StpLogic;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Sa-Token JWT 模式配置。
 * 使用无状态 JWT 模式（Stateless），token 中嵌入用户 ID，无需 Redis 存储 token 本身。
 * 但 Session 数据（权限等）仍由 Redis 支撑（sa-token-redis-jackson）。
 *
 * <p>注意：如需切换到有状态 JWT（Simple 模式），替换为 {@code StpLogicJwtForSimple}。
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class SaTokenJwtConfig {

    /**
     * 启用 Sa-Token JWT 无状态模式。
     * application.yml 中需配置 sa-token.jwt-secret-key。
     */
    @Bean
    public StpLogic getStpLogicJwt() {
        log.info("启用 Sa-Token JWT 无状态模式");
        return new StpLogicJwtForStateless();
    }
}
