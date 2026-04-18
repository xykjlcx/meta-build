package com.metabuild.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * OpenAPI 契约快照测试（方案 D，替代 springdoc-openapi-maven-plugin）。
 *
 * <p>机制：复用 integration test 的 Spring Boot 启动，拉 /api-docs 写到
 * {@code server/api-contract/openapi-v1.json}。CI 随后 {@code git diff --exit-code}
 * 判定 drift（后端代码改了但 openapi 基线没刷）。
 *
 * <p>开发者本地运行 {@code ./mvnw -pl mb-admin test -Dtest=OpenapiSnapshotTest} 即可刷新基线。
 *
 * <p>注意：test profile 默认 {@code springdoc.api-docs.enabled=false}（省启动时间），
 * 本测试必须显式 @TestPropertySource 强开，否则 /api-docs 返回 500 错报被吞到 snapshot。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = "springdoc.api-docs.enabled=true")
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
        ResponseEntity<String> response = rest.getForEntity("/api-docs", String.class);

        // 严格守门：HTTP 200 + JSON Content-Type + openapi 字段存在，防止 500 错报被吞到 snapshot
        assertThat(response.getStatusCode()).as("springdoc /api-docs 必须返回 200").isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType())
                .as("响应必须是 JSON 类型").isNotNull();
        assertThat(response.getHeaders().getContentType().toString())
                .startsWith(MediaType.APPLICATION_JSON_VALUE);

        String raw = response.getBody();
        assertThat(raw).isNotBlank();

        JsonNode tree = mapper.readTree(raw);
        assertThat(tree.path("openapi").asText())
                .as("响应必须包含 openapi 版本字段").startsWith("3.");
        assertThat(tree.path("paths").isObject() && !tree.path("paths").isEmpty())
                .as("响应必须包含非空的 paths").isTrue();

        // 走 Jackson 一圈保证格式稳定（单行压缩，匹配既有基线风格）
        String normalized = mapper.writeValueAsString(tree);

        // 测试 cwd = server/mb-admin，目标 = server/api-contract/openapi-v1.json
        Path target = Path.of("..").resolve("api-contract").resolve("openapi-v1.json");
        Files.writeString(target, normalized);
    }
}
