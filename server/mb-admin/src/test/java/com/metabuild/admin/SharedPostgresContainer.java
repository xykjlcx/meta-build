package com.metabuild.admin;

import org.testcontainers.containers.PostgreSQLContainer;

/**
 * 共享 PostgreSQL 容器——所有集成测试复用同一个容器实例。
 */
public class SharedPostgresContainer extends PostgreSQLContainer<SharedPostgresContainer> {

    public static final SharedPostgresContainer INSTANCE = new SharedPostgresContainer();

    private SharedPostgresContainer() {
        super("postgres:16-alpine");
        withDatabaseName("metabuild_test");
        withUsername("test");
        withPassword("test");
        withReuse(true);
    }

    @Override
    public void start() {
        if (!isRunning()) {
            super.start();
        }
    }

    @Override
    public void stop() {
        // 不停止，整个测试套件复用
    }
}
