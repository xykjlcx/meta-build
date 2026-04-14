package com.metabuild.infra.observability;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;

/**
 * 数据库就绪健康检查：通过执行 SELECT 1 验证数据库连接是否正常。
 * 暴露在 Actuator {@code /actuator/health} 端点，key 为 "database"。
 */
@Slf4j
@RequiredArgsConstructor
public class DatabaseReadinessIndicator implements HealthIndicator {

    private final DSLContext dsl;

    @Override
    public Health health() {
        try {
            dsl.selectOne().fetch();
            return Health.up().build();
        } catch (Exception e) {
            log.warn("数据库健康检查失败: {}", e.getMessage());
            return Health.down(e).build();
        }
    }
}
