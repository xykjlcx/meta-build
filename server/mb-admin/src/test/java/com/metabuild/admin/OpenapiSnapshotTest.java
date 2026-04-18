package com.metabuild.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * OpenAPI 契约快照测试（方案 D，替代 springdoc-openapi-maven-plugin）。
 *
 * <p>机制：复用 integration test 的 Spring Boot 启动，拉 /v3/api-docs 写到
 * {@code server/api-contract/openapi-v1.json}。CI 随后 {@code git diff --exit-code}
 * 判定 drift（后端代码改了但 openapi 基线没刷）。
 *
 * <p>开发者本地运行 {@code ./mvnw -pl mb-admin test -Dtest=OpenapiSnapshotTest} 即可刷新基线。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
@DisplayName("OpenAPI 契约快照")
class OpenapiSnapshotTest {

    @Container
    static final PostgreSQLContainer<?> postgres = SharedPostgresContainer.INSTANCE;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        SharedRedisContainer.applyProperties(registry);
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ObjectMapper mapper;

    @Test
    @DisplayName("刷新 openapi-v1.json 契约基线")
    void refresh_openapi_snapshot() throws Exception {
        String raw = rest.getForObject("/v3/api-docs", String.class);
        assertThat(raw).isNotBlank();

        // 走 Jackson 一圈保证格式稳定（单行压缩，匹配既有基线风格）
        String normalized = mapper.writeValueAsString(mapper.readTree(raw));

        // 测试 cwd = server/mb-admin，目标 = server/api-contract/openapi-v1.json
        Path target = Path.of("..").resolve("api-contract").resolve("openapi-v1.json");
        Files.writeString(target, normalized);
    }
}
