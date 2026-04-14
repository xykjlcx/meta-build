package com.metabuild.admin;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * 集成测试基类：Testcontainers PostgreSQL + Redis + test profile。
 *
 * <p>默认开启 {@code @Transactional}，每个测试方法结束后自动回滚，保证测试间数据隔离。
 *
 * <p><strong>注意</strong>：{@code @TransactionalEventListener(AFTER_COMMIT)} 事件在事务回滚的测试中
 * 不会触发。需要验证此类事件行为时，在具体测试方法上加 {@code @Commit} 或调用
 * {@code TestTransaction.flagForCommit()}。
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Transactional
public abstract class BaseIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = SharedPostgresContainer.INSTANCE;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        SharedRedisContainer.applyProperties(registry);
    }
}
