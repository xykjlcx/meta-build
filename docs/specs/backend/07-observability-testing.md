# 07 - 可观测性与测试

> **关注点**：Actuator 端点、Micrometer 指标、Logback JSON、TraceId、健康检查、多实例兼容性、Testcontainers 集成测试、MockCurrentUser、覆盖率目标。
>
> **本文件吸收原 backend-architecture.md §10（可观测性）+ §11（测试金字塔）**。两者共享"运行时质量保障"主题。

## 1. 可观测性决策结论 [M1]

**从第一天就有**结构化日志 + Actuator + Micrometer，不追加。nxboot 的反面教材是"先上线再补监控，结果永远补不上"。

## 2. Spring Boot Actuator 端点白名单 [M1+M4]

```yaml
management:
  endpoints:
    web:
      base-path: /actuator
      exposure:
        include: health,info,metrics,prometheus,loggers,env
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true                # 启用 liveness/readiness
  info:
    env:
      enabled: true
    git:
      mode: full
  metrics:
    tags:
      application: ${spring.application.name}
```

| 端点 | 用途 | 公开/鉴权 |
|------|------|---------|
| `/actuator/health` | 整体健康 | 公开 |
| `/actuator/health/liveness` | K8s liveness probe | 公开 |
| `/actuator/health/readiness` | K8s readiness probe | 公开 |
| `/actuator/info` | 应用元信息（版本、git） | 公开 |
| `/actuator/metrics` | Micrometer 指标（JSON） | 鉴权（admin） |
| `/actuator/prometheus` | Prometheus 抓取端点 | 鉴权（内网） |
| `/actuator/loggers` | 运行时改日志级别 | 鉴权（admin） |

## 3. Micrometer 指标分类 [M1+M4]

| 指标类别 | 来源 | 样例 |
|---------|------|------|
| **JVM** | 自动 | `jvm.memory.used`, `jvm.gc.pause`, `jvm.threads.live` |
| **HTTP** | 自动 | `http.server.requests` (count/duration/status) |
| **数据库** | HikariCP | `hikaricp.connections.active`, `hikaricp.connections.usage` |
| **jOOQ 慢查询** | SlowQueryListener | `db.slow_query.count`, `db.slow_query.duration` |
| **业务（手动）** | 自定义 | `mb.auth.login.success`, `mb.auth.login.failure`, `mb.oplog.write` |

#### 自定义业务指标示例

```java
@Component
public class AuthMetrics {
    private final Counter loginSuccessCounter;
    private final Counter loginFailureCounter;

    public AuthMetrics(MeterRegistry registry) {
        this.loginSuccessCounter = Counter.builder("mb.auth.login.success")
            .description("登录成功次数")
            .register(registry);
        this.loginFailureCounter = Counter.builder("mb.auth.login.failure")
            .description("登录失败次数")
            .tag("reason", "unknown")  // 可以 withTag 细分
            .register(registry);
    }
}
```

## 4. Logback JSON encoder [M1]

```xml
<!-- mb-admin/src/main/resources/logback-spring.xml -->
<configuration>
    <springProperty scope="context" name="appName" source="spring.application.name"/>

    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"app":"${appName}"}</customFields>
            <includeMdcKeyName>traceId</includeMdcKeyName>
            <includeMdcKeyName>userId</includeMdcKeyName>
            <includeMdcKeyName>spanId</includeMdcKeyName>
        </encoder>
    </appender>

    <!-- 开发环境: plain text -->
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} [traceId=%X{traceId}] - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <!-- 生产环境: JSON -->
    <springProfile name="prod,test">
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
    </springProfile>
</configuration>
```

**依赖**（mb-infra/infra-observability/pom.xml）:
```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
</dependency>
```

## 5. 结构化日志字段 [M1]

每条 JSON 日志必须包含：

| 字段 | 来源 | 说明 |
|------|------|-----|
| `@timestamp` | 自动 | ISO 8601 UTC |
| `level` | 自动 | DEBUG / INFO / WARN / ERROR |
| `logger_name` | 自动 | 类名 |
| `message` | 自动 | 日志内容 |
| `app` | customFields | 应用名 |
| `traceId` | MDC | 链路追踪 ID（每次请求生成） |
| `userId` | MDC | 当前认证用户 ID |
| `spanId` | MDC | OpenTelemetry span id（预留） |
| `stack_trace` | 自动 | 异常时自动包含 |

#### TraceId 生成 Filter

```java
// mb-infra/infra-observability/.../TraceIdFilter.java
@Component
public class TraceIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        String traceId = req.getHeader("X-Trace-Id");
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }
        MDC.put("traceId", traceId);
        res.setHeader("X-Trace-Id", traceId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }
}
```

## 6. 健康检查 readiness/liveness [M1+M4]

K8s 兼容端点的语义区分：

- **liveness**: 应用进程是否存活，失败 → K8s 重启 pod
- **readiness**: 应用是否准备好接受流量，失败 → K8s 从 Service endpoint 摘除

#### 自定义 HealthIndicator

```java
// infra-observability/.../DatabaseReadinessIndicator.java
@Component("db")
public class DatabaseReadinessIndicator implements HealthIndicator {
    private final DataSource dataSource;

    @Override
    public Health health() {
        try (Connection c = dataSource.getConnection();
             Statement stmt = c.createStatement()) {
            stmt.execute("SELECT 1");
            return Health.up().build();
        } catch (Exception e) {
            return Health.down().withException(e).build();
        }
    }
}
```

<!-- verify: curl -s http://localhost:8080/actuator/health/readiness | jq -r .status -->

（预期输出: `UP`）

## 7. 多实例部署的兼容性约束 [P1]

v1 默认部署假设是**单实例**。如果使用者要多实例部署，必须了解以下组件的分布式安全性：

| 组件 | v1 默认 | 多实例安全？ | 改造路径 |
|------|--------|------------|---------|
| **Redis 缓存** | 分布式 | ✅ | 无需改造 |
| **Sa-Token JWT** | 无状态 | ✅ | 无需改造 |
| **Sa-Token 黑名单** | Redis | ✅ | 无需改造 |
| **限流（Bucket4j 内存版）** | 单机 | ❌ 每实例独立限流，总请求放大 N 倍 | v1.5 升级到 `bucket4j-redis` |
| **定时任务（Spring @Scheduled）** | 无锁 | ❌ 所有实例都会触发 | 用 `ShedLock` + JDBC 表（已在 platform-job 方案内） |
| **本地文件存储** | 单机 | ❌ 文件只在一个实例上 | 切换到 `AliyunOssFileStorage`（对象存储） |
| **阿里云 OSS 文件存储** | 分布式 | ✅ | 无需改造 |
| **WebSocket** | 单机 | ❌ | v1.5 + Redis Pub/Sub |
| **本地缓存（Caffeine）** | 单机 | ⚠️ 每实例独立缓存，不一致 | 用 Redis 替代或接受短时不一致 |

**v1 的默认部署约定**：
- **单实例** 是默认假设，所有 v1 默认实现都按这个假设写
- 多实例部署时，**必须**同时做：
  1. 限流切换到 Redis 版本（或接受放大风险）
  2. 定时任务用 ShedLock（v1 已默认包含）
  3. 文件存储切换到阿里云 OSS
  4. 避免使用 WebSocket（v1.5 才支持多实例）

这些要求会写进 `CLAUDE.md` 的"多实例部署检查清单"章节，供使用者决策时参考。

## 8. 测试金字塔决策 [M1+M4]

- **集成测试为主**（覆盖业务路径），**单元测试补充**（复杂纯逻辑）
- **BaseIntegrationTest**: Testcontainers PostgreSQL 单例 + 事务回滚（借用 nxboot）
- **ArchUnit 测试**: 架构守护（M1 3 条，M4 补全到 8-10 条）
- **目标覆盖率**: 集成测试行覆盖率 ≥ 60%

## 9. BaseIntegrationTest [M1]

```java
// mb-admin/src/test/java/com/metabuild/admin/BaseIntegrationTest.java
@SpringBootTest
@ActiveProfiles("test")
@Transactional           // 自动回滚
@Testcontainers
public abstract class BaseIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = SharedPostgresContainer.INSTANCE;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // 测试环境最小配置
        registry.add("MB_JWT_SECRET", () -> "test-secret-at-least-32-bytes-long-for-hs256");
    }
}
```

```java
// SharedPostgresContainer.java
public class SharedPostgresContainer extends PostgreSQLContainer<SharedPostgresContainer> {
    public static final SharedPostgresContainer INSTANCE = new SharedPostgresContainer();

    private SharedPostgresContainer() {
        super("postgres:16-alpine");
        withDatabaseName("metabuild_test");
        withUsername("test");
        withPassword("test");
        withReuse(true);  // 复用容器，避免每次测试重启
    }

    @Override
    public void start() {
        if (!isRunning()) {
            super.start();
        }
    }

    @Override
    public void stop() {
        // 不 stop，保持复用
    }
}
```

## 10. MockCurrentUser + TestSecurityConfig（ADR-0005） [M4]

**不再需要 `TestHelper.mockLoginUser()` 或 `mockStatic(StpUtil.class)`**。通过 `@Primary` Bean 替换 `CurrentUser` 实现，测试代码零 Sa-Token 引用。

```java
// mb-admin/src/test/java/com/metabuild/TestSecurityConfig.java
@TestConfiguration
public class TestSecurityConfig {

    @Bean
    @Primary
    public CurrentUser testCurrentUser() {
        return new MockCurrentUser();
    }
}
```

`MockCurrentUser` 完整实现见 [8.6.4](#864-测试时替换-beanmockcurrentuser)。

**集成测试标准用法**：
```java
@SpringBootTest
@Import(TestSecurityConfig.class)
class UserServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private MockCurrentUser currentUser;
    @Autowired private UserService userService;

    @BeforeEach
    void setup() {
        currentUser.clear();
    }

    @Test
    void admin_creates_user_successfully() {
        currentUser.asAdmin();
        UserVo user = userService.create(new UserCreateCmd("alice", "pwd"));
        assertThat(user.id()).isNotNull();
    }
}
```

## 11. 测试目录结构 [M4]

```
mb-admin/src/test/java/com/metabuild/
├── admin/
│   ├── BaseIntegrationTest.java
│   ├── SharedPostgresContainer.java
│   └── MetaBuildApplicationTests.java
├── TestSecurityConfig.java             # @TestConfiguration
├── MockCurrentUser.java                # CurrentUser 的测试实现
└── architecture/                       # ArchUnit 测试集中地
    ├── ArchitectureTest.java           # 聚合所有规则
    ├── DoNotIncludeGeneratedJooq.java  # ImportOption 排除 jOOQ 生成代码
    └── rules/
        ├── JooqIsolationTest.java
        ├── ModuleBoundaryTest.java
        ├── SaTokenIsolationTest.java
        └── CacheEvictionTest.java

mb-platform/platform-iam/src/test/java/com/metabuild/platform/iam/
├── UserServiceTest.java                # 单元测试（mock Repository 和 CurrentUser）
├── UserServiceIntegrationTest.java     # 集成测试（真 DB + MockCurrentUser）
└── UserControllerIntegrationTest.java  # MockMvc + MockCurrentUser

mb-infra/infra-cache/src/test/java/com/metabuild/infra/cache/
└── CacheEvictSupportIntegrationTest.java
```

## 12. 覆盖率目标 [M4]

| 类型 | 工具 | 目标 |
|------|------|------|
| ArchUnit 规则 | ArchUnit | M1: 3 条 → M4: 10+ 条 |
| 集成测试行覆盖率 | JaCoCo | ≥ 60%（仅 mb-platform + mb-business） |
| 单元测试 | - | 复杂纯逻辑必有（如 PasswordPolicy、状态机） |

## 13. 测试数据管理 [P1]

**目录约定**：

```
src/test/resources/
├── sql/
│   ├── iam/
│   │   ├── 01-users.sql          # 基础用户数据
│   │   ├── 02-roles.sql
│   │   └── 03-user-roles.sql
│   ├── oplog/
│   │   └── 01-logs.sql
│   └── order/
│       └── 01-orders.sql
└── fixtures/                      # Java 代码形式的数据构造
    ├── UserFixtures.java
    └── OrderFixtures.java
```

**使用 `@Sql` 注解加载 SQL 数据**：

```java
@SpringBootTest
@Import(TestSecurityConfig.class)
@Sql(scripts = {"/sql/iam/01-users.sql", "/sql/iam/02-roles.sql"})
class UserServiceIntegrationTest extends BaseIntegrationTest {

    @Test
    void list_users_returns_seeded_data() {
        currentUser.asAdmin();
        PageResult<UserVo> result = userService.page(new UserQry(), 1, 10);
        assertThat(result.totalElements()).isEqualTo(3);  // 01-users.sql 里有 3 条
    }
}
```

**使用 Java Fixtures 构造数据**（推荐用于复杂数据）：

```java
// fixtures/UserFixtures.java
public class UserFixtures {

    public static User alice() {
        return new User(
            snowflakeId.nextId(),
            0L,                                    // tenantId
            "alice",
            "hashed_password",
            "alice@example.com",
            1L,                                    // deptId
            UserStatus.ACTIVE
        );
    }

    public static User admin() {
        return new User(1L, 0L, "admin", "...", "admin@meta-build.dev", 0L, UserStatus.ACTIVE);
    }
}
```

**约定**：
- **简单场景** 用 Java fixtures（类型安全，IDE 友好）
- **批量数据** 用 `@Sql`（SQL 更简洁）
- **跨模块测试** 时共享 fixtures 放 `mb-admin/src/test/java/com/metabuild/fixtures/`
| API 契约测试 | MockMvc + @WebMvcTest | 每个 Controller 至少 1 个 happy path |

<!-- verify: cd server && mvn test jacoco:report -pl mb-admin && test -f mb-admin/target/site/jacoco/index.html -->

---

[← 返回 README](./README.md)
