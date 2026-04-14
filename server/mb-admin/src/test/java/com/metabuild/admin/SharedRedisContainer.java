package com.metabuild.admin;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.GenericContainer;

/**
 * 共享 Redis 容器——所有集成测试复用同一个容器实例。
 *
 * <p>M4 引入 Sa-Token Redis + infra-cache，测试层需要对应的 Redis 容器。
 * 属性通过 {@link #applyProperties(DynamicPropertyRegistry)} 注入到 Spring 上下文。
 */
public class SharedRedisContainer {

    @SuppressWarnings("resource")
    private static final GenericContainer<?> REDIS =
            new GenericContainer<>("redis:7-alpine")
                    .withExposedPorts(6379)
                    .withReuse(true);

    static {
        REDIS.start();
    }

    /**
     * 将 Redis 连接属性注册到 Spring 动态属性源。
     * 由 {@link BaseIntegrationTest#registerProperties} 调用。
     */
    public static void applyProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }
}
