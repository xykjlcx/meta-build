package com.metabuild.admin;

import org.junit.jupiter.api.Test;

/**
 * 验证 Spring Context 能成功启动 + Flyway 迁移能成功执行。
 */
class MetaBuildApplicationTest extends BaseIntegrationTest {

    @Test
    void contextLoads() {
        // Spring Context 启动成功 = Flyway 执行成功 + 所有 Bean 注册成功
    }
}
