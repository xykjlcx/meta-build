# M4: 后端底座 + 8 平台模块 + 契约驱动 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现后端 infra 剩余 7 模块 + 8 个 platform 模块 + OpenAPI 契约驱动，从 M1 脚手架状态到可运行的完整后端。

**Architecture:** 6 层 Maven 单向依赖（common → schema → infra → platform → business → admin）。infra 层提供基础设施能力（认证/缓存/异常/i18n/限流/验证码），platform 层实现 8 个平台业务模块（iam/oplog/file/notification/dict/config/job/monitor）。所有 Controller 通过 @RequirePermission 鉴权，所有 Repository 通过 DataScopeVisitListener 自动注入数据权限。契约驱动：springdoc → OpenAPI 3.1 JSON → @mb/api-sdk TypeScript client。

**Tech Stack:** Spring Boot 3.5.3, JDK 21, Sa-Token 1.39.0 (JWT Simple), jOOQ 3.19+, PostgreSQL 16, Redis 7, Flyway 10+, Testcontainers, ArchUnit 1.3.0, springdoc-openapi, Bucket4j, ShedLock, Lombok

**Branch:** `feature/m4-backend-platform`

**关键 specs:**
- `docs/specs/backend/README.md` — 后端设计入口 + 硬约束反向索引
- `docs/specs/backend/02-infra-modules.md` — 11 个 infra 子模块
- `docs/specs/backend/03-platform-modules.md` — 8 个 platform 模块 + 12 步清单
- `docs/specs/backend/04-data-persistence.md` — jOOQ/Flyway/事务/缓存/时区
- `docs/specs/backend/05-security.md` — 认证/授权/数据权限方案 E + **§8 密码安全**
- `docs/specs/backend/06-api-and-contract.md` — API 契约 + OpenAPI + 分页
- `docs/specs/backend/07-observability-testing.md` — 可观测性/测试金字塔
- `docs/specs/backend/08-archunit-rules.md` — ArchUnit 规则集（M1 3条 → M4 27条）
- `docs/specs/backend/09-config-management.md` — 配置管理 + @ConfigurationProperties

**Docker 端口:** PG 15432, Redis 16379（原生端口前加 1）
**jOOQ codegen:** 三插件模式（groovy → flyway → jooq-codegen）

---

## M1 现有资产（实施者必读）

以下类/文件 **M1 已创建**，plan 中标注"已存在"的不要重复创建：

**mb-common（零 Spring 依赖）：**
- `exception/`: MetaBuildException（int httpStatus）, BusinessException, NotFoundException, ForbiddenException, UnauthorizedException, ConflictException, SystemException
- `security/`: CurrentUser（接口）, AuthFacade（接口）, CurrentUserInfo, LoginResult, SessionData, DataScope, DataScopeType, BypassDataScope
- `dto/`: PageQuery, PageResult
- `id/`: SnowflakeIdGenerator

**mb-infra（4 个已实现，7 个占位）：**
- infra-jooq: MbJooqAutoConfiguration, JooqHelper（5 batch 方法）, SlowQueryListener, MbJooqProperties, MbIdProperties, IdGeneratorConfig
- infra-archunit: ModuleBoundaryRule（**在 `com.metabuild.infra.archunit` 包下，无 rules 子包**）, JooqIsolationRule, DoNotIncludeGeneratedJooq
- infra-observability: TraceIdFilter, ObservabilityAutoConfiguration
- infra-async: AsyncConfig

**mb-admin:** MetaBuildApplication, ClockConfig, application.yml（基础配置）, application-dev.yml, ArchitectureTest（3 条规则）, BaseIntegrationTest, SharedPostgresContainer

**mb-schema:** V20260601_001__iam_user.sql（mb_iam_user 表，缺 version/password_updated_at/must_change_password 字段）

**项目级：** 无 Lombok 依赖（所有代码用手写构造器）

---

## 依赖关系图

```
Phase 0: 基础设施准备（Lombok + dependencyManagement + M1 遗留修复）
    ↓
Phase 1: infra 基础设施（8 个 task）
    ├── 1A: infra-i18n
    ├── 1B: infra-exception + OpenApiConfig（runtime 依赖 MessageSource Bean，Maven 不依赖 infra-i18n）
    ├── 1C: infra-security（Sa-Token + CurrentUser 实现 + AuthFacade 实现 + CORS + PasswordEncoder）
    ├── 1D: infra-cache
    ├── 1E: infra-rate-limit
    ├── 1F: infra-captcha（依赖 1D 的 Redis）
    ├── 1G: infra-jooq 补全（DataScope + AuditFieldsRecordListener + SortParser）
    └── 1H: infra-observability 补全（Prometheus + HealthIndicator + 业务 Metrics）
    ↓
Phase 2: DDL + jOOQ codegen
    ↓
Phase 3: platform 模块（8 个）
    ├── 3A: platform-iam（含密码安全 §8 全套）
    ├── 3B: platform-oplog
    ├── 3C-3H: dict/config/file/notification/job/monitor
    ↓
Phase 4: ArchUnit 规则补全（3 → 27+ 条）
    ↓
Phase 5: 契约驱动 + application.yml 终稿
    ↓
Phase 6: 集成测试 + 全量验证
```

**并行策略：**
- Phase 1 内部：1A→1B→1C 串行（依赖链）；1D/1E/1F 可并行；1G/1H 独立
- Phase 3 内部：3A 必须先完成（其他模块依赖 iam）；3B-3H 可并行

---

## Phase 0: 基础设施准备

### Task 0.1: 添加 Lombok + 第三方依赖版本管理

**问题:** 项目无 Lombok 依赖，spec 大量使用 @RequiredArgsConstructor。root pom.xml 的 dependencyManagement 缺少 Sa-Token/springdoc/bucket4j/shedlock 条目。

**Files:**
- Modify: `server/pom.xml`

- [ ] **Step 1: 在 root pom.xml `<properties>` 添加版本号**

```xml
<lombok.version>1.18.34</lombok.version>
<springdoc.version>2.6.0</springdoc.version>
<bucket4j.version>8.14.0</bucket4j.version>
<shedlock.version>5.16.0</shedlock.version>
<!-- sa-token.version=1.39.0 已存在 -->
```

- [ ] **Step 2: 在 `<dependencyManagement>` 添加所有第三方依赖**

```xml
<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>${lombok.version}</version>
    <scope>provided</scope>
</dependency>
<!-- Sa-Token 全家桶 -->
<dependency><groupId>cn.dev33</groupId><artifactId>sa-token-spring-boot3-starter</artifactId><version>${sa-token.version}</version></dependency>
<dependency><groupId>cn.dev33</groupId><artifactId>sa-token-jwt</artifactId><version>${sa-token.version}</version></dependency>
<dependency><groupId>cn.dev33</groupId><artifactId>sa-token-redis-jackson</artifactId><version>${sa-token.version}</version></dependency>
<!-- springdoc -->
<dependency><groupId>org.springdoc</groupId><artifactId>springdoc-openapi-starter-webmvc-ui</artifactId><version>${springdoc.version}</version></dependency>
<!-- Bucket4j -->
<dependency><groupId>com.bucket4j</groupId><artifactId>bucket4j-core</artifactId><version>${bucket4j.version}</version></dependency>
<!-- ShedLock -->
<dependency><groupId>net.javacrumbs.shedlock</groupId><artifactId>shedlock-spring</artifactId><version>${shedlock.version}</version></dependency>
<dependency><groupId>net.javacrumbs.shedlock</groupId><artifactId>shedlock-provider-jdbc-template</artifactId><version>${shedlock.version}</version></dependency>
```

- [ ] **Step 3: 在 mb-infra/pom.xml（parent pom）添加 Lombok 为共享依赖**

所有 infra 子模块自动继承 Lombok。

- [ ] **Step 4: Commit**

---

### Task 0.2: M1 遗留修复 — ArchUnit 模块边界规则

**问题:** `CROSS_PLATFORM_ONLY_VIA_API` 误判同模块内依赖。

**Files:**
- Modify: `server/mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/ModuleBoundaryRule.java`（**注意：原路径，无 rules/ 子包**）

- [ ] **Step 1: 改用 slices API 做跨模块边界检查**

```java
// 新规则：跨 platform/business 模块只能走 api 包
public static final ArchRule CROSS_PLATFORM_ONLY_VIA_API = SlicesRuleDefinition
    .slices()
    .matching("com.metabuild.platform.(*)..")
    .should().notDependOnEachOther()
    .ignoreDependency(
        alwaysTrue(),                          // 任意 source
        resideInAPackage("..api..")            // 依赖 target 在 api 包 → 允许
    )
    .allowEmptyShould(true);  // Phase 3 完成后再移除
```

**注意 ignoreDependency 参数含义**: `ignoreDependency(sourcePredicate, targetPredicate)` — 当 source 满足第一个、target 满足第二个时忽略。这里是"忽略所有指向 api 包的依赖"。

- [ ] **Step 2: 确保 ArchitectureTest import 路径不变**（`com.metabuild.infra.archunit.ModuleBoundaryRule`）
- [ ] **Step 3: 运行验证**

```bash
cd server && mvn test -pl mb-admin -Dtest=ArchitectureTest
```

- [ ] **Step 4: Commit**

---

### Task 0.3: M1 遗留修复 — 异步线程上下文传递

**Files:**
- Modify: `server/mb-infra/infra-async/src/main/java/com/metabuild/infra/async/AsyncConfig.java`
- Create: `server/mb-infra/infra-async/src/main/java/com/metabuild/infra/async/MdcTaskDecorator.java`

- [ ] **Step 1: 创建 MdcTaskDecorator — 复制父线程 MDC 到异步线程**

```java
package com.metabuild.infra.async;

import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;
import java.util.Map;

public class MdcTaskDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        return () -> {
            if (contextMap != null) MDC.setContextMap(contextMap);
            try { runnable.run(); }
            finally { MDC.clear(); }
        };
    }
}
```

- [ ] **Step 2: 在 AsyncConfig 的 executor 上注册 `setTaskDecorator(new MdcTaskDecorator())`**
- [ ] **Step 3: Commit**

---

### Task 0.4: M1 遗留修复 — BaseIntegrationTest 事务隔离

**Files:**
- Modify: `server/mb-admin/src/test/java/com/metabuild/admin/BaseIntegrationTest.java`

- [ ] **Step 1: 添加 @Transactional（默认回滚）**

```java
@SpringBootTest
@Transactional  // 每个测试默认回滚
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {
    // ...existing code...
}
```

**已知限制：** @Transactional 会让 @TransactionalEventListener(AFTER_COMMIT) 永远不触发。需要测试事件行为的测试用 `@Commit` 注解覆盖，或使用 `TestTransaction.flagForCommit()`。

- [ ] **Step 2: Commit**

---

### Task 0.5: M1 遗留修复 — Testcontainers Redis

**问题:** M4 引入 Sa-Token Redis + infra-cache，但测试环境无 Redis。

**Files:**
- Create: `server/mb-admin/src/test/java/com/metabuild/admin/SharedRedisContainer.java`
- Modify: `server/mb-admin/src/test/java/com/metabuild/admin/BaseIntegrationTest.java`

- [ ] **Step 1: 创建 SharedRedisContainer（和 SharedPostgresContainer 同模式）**

```java
public class SharedRedisContainer {
    private static final GenericContainer<?> REDIS =
        new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379)
            .withReuse(true);

    static {
        REDIS.start();
    }

    public static void applyProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }
}
```

- [ ] **Step 2: 在 BaseIntegrationTest 的 @DynamicPropertySource 中注册 Redis 属性**
- [ ] **Step 3: Commit**

---

## Phase 1: infra 基础设施层

### Task 1A: infra-i18n

**Files:**
- Create: `server/mb-infra/infra-i18n/src/main/java/com/metabuild/infra/i18n/I18nAutoConfiguration.java`
- Create: `server/mb-infra/infra-i18n/src/main/java/com/metabuild/infra/i18n/MbI18nProperties.java`
- Create: `server/mb-infra/infra-i18n/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
- Create: `server/mb-admin/src/main/resources/messages/messages_zh_CN.properties`
- Create: `server/mb-admin/src/main/resources/messages/messages_en_US.properties`

- [ ] **Step 1: 创建 MbI18nProperties**

```java
@ConfigurationProperties(prefix = "mb.i18n")
@Validated
public record MbI18nProperties(
    Locale defaultLocale,          // 默认 zh_CN（不加 @NotNull，compact constructor 给默认值）
    List<Locale> supportedLocales
) {
    public MbI18nProperties {
        if (defaultLocale == null) defaultLocale = Locale.SIMPLIFIED_CHINESE;
        if (supportedLocales == null || supportedLocales.isEmpty())
            supportedLocales = List.of(Locale.SIMPLIFIED_CHINESE, Locale.US);
    }
}
```

- [ ] **Step 2: 创建 I18nAutoConfiguration**

配置 `ReloadableResourceBundleMessageSource` + `AcceptHeaderLocaleResolver`。MessageSource basenames 覆盖所有 platform 模块的消息文件。

- [ ] **Step 3: 创建公共 messages 文件（system.internal / validation / auth.* / common.pagination.*）**
- [ ] **Step 4: 编译验证 + Commit**

---

### Task 1B: infra-exception

**职责:** GlobalExceptionHandler + ProblemDetail + PageQueryArgumentResolver + SecurityHeaderFilter

**注意:** infra-exception 的 pom.xml **不需要 Maven 依赖 infra-i18n**。它只需要 `@Autowired MessageSource`（Spring Bean），I18nAutoConfiguration 在运行时提供 Bean 即可。

**Files:**
- Create: `server/mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/GlobalExceptionHandler.java`
- Create: `server/mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/ExceptionAutoConfiguration.java`
- Create: `server/mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/web/WebMvcConfig.java`
- Create: `server/mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/web/PageQueryArgumentResolver.java`
- Create: `server/mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/web/SecurityHeaderFilter.java`
- Create: `server/mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/web/MbPaginationProperties.java`
- Create: `server/mb-infra/infra-exception/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`

**关键实现：**
- GlobalExceptionHandler 处理：MetaBuildException → ProblemDetail（用 `ex.getHttpStatus()` int 值）、MethodArgumentNotValidException → 400、DataChangedException → 409、Sa-Token 异常（provided scope 依赖）、Exception 兜底 → 500
- PageQueryArgumentResolver 按 `06-api-and-contract.md §12.3` 实现
- SecurityHeaderFilter 按 `05-security.md §5.1`：X-Content-Type-Options / CSP / X-Frame-Options

- [ ] **Step 1-6: 按 spec 实现所有组件**
- [ ] **Step 7: pom.xml 依赖**

```xml
<dependencies>
    <!-- mb-common 通过 mb-infra parent 继承 -->
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <!-- Sa-Token 异常类（provided scope，运行时由 infra-security 提供） -->
    <dependency><groupId>cn.dev33</groupId><artifactId>sa-token-spring-boot3-starter</artifactId><scope>provided</scope></dependency>
</dependencies>
```

- [ ] **Step 8: Commit**

---

### Task 1B-2: OpenApiConfig（独立子任务，放在 mb-admin 而非 infra-exception）

**问题修复:** OpenApiConfig 语义上不属于异常处理。放在 mb-admin（应用级配置）更合理。

**Files:**
- Create: `server/mb-admin/src/main/java/com/metabuild/admin/config/OpenApiConfig.java`

- [ ] **Step 1: 按 `06-api-and-contract.md §7` 创建 OpenApiConfig Bean**
- [ ] **Step 2: 在 mb-admin pom.xml 添加 springdoc 依赖**
- [ ] **Step 3: Commit**

---

### Task 1C: infra-security

**职责:** Sa-Token 封装 + SaTokenCurrentUser + SaTokenAuthFacade + @RequirePermission AOP + CORS + PasswordEncoder

**重要：** mb-common 中的接口（CurrentUser/AuthFacade/LoginResult 等）**M1 已创建**，不要重复创建。

**Files:**
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaTokenCurrentUser.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaTokenAuthFacade.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/RequirePermission.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/RequirePermissionAspect.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaTokenJwtConfig.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaPermissionImpl.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/CorsConfig.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/config/PasswordEncoderConfig.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/MbAuthProperties.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/MbCorsProperties.java`
- Create: `server/mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SecurityAutoConfiguration.java`

**Key specs:** 05-security.md §1-6

**pom.xml 依赖:**
```xml
<dependency><groupId>cn.dev33</groupId><artifactId>sa-token-spring-boot3-starter</artifactId></dependency>
<dependency><groupId>cn.dev33</groupId><artifactId>sa-token-jwt</artifactId></dependency>
<dependency><groupId>cn.dev33</groupId><artifactId>sa-token-redis-jackson</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-aop</artifactId></dependency>
<dependency><groupId>org.springframework.security</groupId><artifactId>spring-security-crypto</artifactId></dependency>
```

- [ ] **Step 1-12: 按 05-security.md §1-6 逐个创建组件**
- [ ] **Step 13: Commit**

---

### Task 1D: infra-cache

- [ ] 按原计划实现：MbCacheProperties + CacheEvictSupport(afterCommit) + CacheAutoConfiguration
- [ ] **Commit**

---

### Task 1E: infra-rate-limit

- [ ] @RateLimit 注解 + RateLimitInterceptor(Bucket4j 内存) + MbRateLimitProperties
- [ ] **Commit**

---

### Task 1F: infra-captcha

- [ ] CaptchaService(BufferedImage + Redis) + CaptchaController(GET generate + POST verify, @PermitAll) + MbCaptchaProperties
- [ ] **Commit**

---

### Task 1G: infra-jooq 补全

**职责:** DataScopeRegistry + DataScopeVisitListener + BypassDataScopeAspect + AuditFieldsRecordListener + SortParser

**注意：**
- **不在 JooqHelper 中做审计字段填充**（之前计划的 Task 0.3 审计部分**移除**，统一用 RecordListener）
- infra-jooq pom.xml 需要新增 `spring-boot-starter-aop` 依赖（BypassDataScopeAspect 需要）
- `DataScope`/`DataScopeType`/`BypassDataScope` **M1 已在 mb-common 中创建**

**Files:**
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/DataScopeRegistry.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/DataScopeVisitListener.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/BypassDataScopeAspect.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/AuditFieldsRecordListener.java`
- Create: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/SortParser.java`
- Modify: `server/mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/MbJooqAutoConfiguration.java`
- Modify: `server/mb-infra/infra-jooq/pom.xml`（添加 spring-boot-starter-aop）

**SortParser 中异常构造要用 int httpStatus**：
```java
throw new BusinessException("common.pagination.invalidSortField", 400, fieldName);
// 不是 HttpStatus.BAD_REQUEST — mb-common 零 Spring 依赖
```

- [ ] **Step 1-7: 按 05-security.md §7 + 06-api-and-contract.md §12.5 实现**
- [ ] **Step 8: Commit**

---

### Task 1H: infra-observability 补全（M4 新增）

**问题修复:** 原计划完全遗漏了 infra-observability 的 M4 补全工作。

**Files:**
- Create: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/MbObservabilityProperties.java`
- Create: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/DatabaseReadinessIndicator.java`
- Create: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/AuthMetrics.java`
- Modify: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/TraceIdFilter.java`（添加 userId 到 MDC）
- Modify: `server/mb-infra/infra-observability/src/main/java/com/metabuild/infra/observability/ObservabilityAutoConfiguration.java`

**Key specs:** 07-observability-testing.md §2-3

- [ ] **Step 1: 创建 MbObservabilityProperties**（`mb.observability.*` 前缀）
- [ ] **Step 2: 修改 TraceIdFilter — 在认证后把 userId 写入 MDC**

```java
// 在 filter chain 之后（认证已完成），从 CurrentUser 读 userId 写入 MDC
// 使用 ObjectProvider<CurrentUser> 延迟解析
```

- [ ] **Step 3: 创建 DatabaseReadinessIndicator**

```java
@Component
public class DatabaseReadinessIndicator implements HealthIndicator {
    private final DSLContext dsl;
    @Override
    public Health health() {
        try {
            dsl.selectOne().fetch();
            return Health.up().build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

- [ ] **Step 4: 创建 AuthMetrics — 业务指标（mb.auth.login.success / failure）**
- [ ] **Step 5: 配置 Prometheus 端点（在 application.yml 中启用）**
- [ ] **Step 6: Commit**

---

### Task 1-Final: application.yml 补全

**Files:**
- Modify: `server/mb-admin/src/main/resources/application.yml`
- Modify: `server/mb-admin/src/main/resources/application-dev.yml`
- Modify: `server/mb-admin/src/main/resources/application-test.yml`
- Modify: `server/mb-admin/src/main/resources/application-prod.yml`
- Modify: `server/mb-admin/pom.xml`

按 `09-config-management.md` 添加所有 M4 新增配置：Redis / Sa-Token / mb.auth.* / mb.cache.* / mb.captcha.* / mb.rate-limit.* / mb.i18n.* / mb.api.pagination.* / springdoc / management.endpoints（Prometheus）。

dev profile 用本地 Docker 值（localhost:15432 / localhost:16379）。
test profile 用 Testcontainers 动态注入（@DynamicPropertySource）。
prod profile 用 `${MB_*}` 环境变量（fail-fast，无默认值）。

- [ ] **Step 1-4: 按 profile 更新配置文件**
- [ ] **Step 5: 在 mb-admin pom.xml 确保依赖所有 infra 子模块**
- [ ] **Step 6: 验证全量编译**

```bash
cd server && mvn compile
```

- [ ] **Step 7: Commit**

---

## Phase 2: DDL + jOOQ Codegen

### Task 2.1: 全量 Flyway DDL

**⚠️ 关键修复：Flyway 日期必须 >= 20260602**

M1 已有 `V20260601_001__iam_user.sql`。新 DDL 必须用 `V20260602_*` 或更晚的日期，否则 Flyway 排序错误。

**文件清单（全在 `server/mb-schema/src/main/resources/db/migration/`）：**

| # | 文件名 | 内容 |
|---|--------|------|
| 1 | `V20260602_001__iam_user_add_fields.sql` | ALTER mb_iam_user ADD version/password_updated_at/must_change_password |
| 2 | `V20260602_002__iam_role.sql` | mb_iam_role（含 data_scope 字段） |
| 3 | `V20260602_003__iam_dept.sql` | mb_iam_dept |
| 4 | `V20260602_004__iam_user_role.sql` | mb_iam_user_role |
| 5 | `V20260602_005__iam_route_tree.sql` | mb_iam_route_tree |
| 6 | `V20260602_006__iam_menu.sql` | mb_iam_menu |
| 7 | `V20260602_007__iam_role_menu.sql` | mb_iam_role_menu |
| 8 | `V20260602_008__iam_role_data_scope_dept.sql` | mb_iam_role_data_scope_dept（**CUSTOM_DEPT 支持**） |
| 9 | `V20260602_009__iam_password_history.sql` | mb_iam_password_history |
| 10 | `V20260602_010__iam_login_log.sql` | mb_iam_login_log（登录日志） |
| 11 | `V20260603_001__oplog_operation_log.sql` | mb_operation_log（**注意：不注册 DataScope，追加表**） |
| 12 | `V20260603_002__file_metadata.sql` | mb_file_metadata |
| 13 | `V20260603_003__notification.sql` | mb_notification + mb_notification_read |
| 14 | `V20260603_004__dict.sql` | mb_dict_type + mb_dict_data |
| 15 | `V20260603_005__config.sql` | mb_config |
| 16 | `V20260603_006__job_log.sql` | mb_job_log |
| 17 | `V20260603_007__shedlock.sql` | shedlock（标准 schema） |
| 18 | `V20260604_001__init_data.sql` | 超管角色 + 默认部门 + 超管用户绑定 |

**Review 修复点汇总：**

1. **mb_iam_user ALTER**（#1）：添加 `version INT NOT NULL DEFAULT 0`, `password_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `must_change_password BOOLEAN NOT NULL DEFAULT false`
2. **mb_iam_role_data_scope_dept**（#8）：新增表，支持 CUSTOM_DEPT 数据权限类型
3. **mb_iam_password_history**（#9）：按 05-security.md §8.7.2
4. **mb_iam_login_log**（#10）：登录历史（IP/device/success/failure）
5. **mb_operation_log**（#11）：**不加 dept_id，不注册 DataScope**（追加表，按 user_id 过滤更合理）
6. **mb_notification** 添加 `version INT NOT NULL DEFAULT 0` + 索引 `(tenant_id, status)` + `(tenant_id, created_at DESC)`
7. **mb_notification_read** 移除多余的 `updated_by/updated_at`（追加表）
8. **mb_job_log** 移除多余的 `updated_by/updated_at`（追加表）
9. **mb_dict_data** 添加 UNIQUE `(tenant_id, dict_type_id, value)`
10. **DataScopeType 枚举对齐**：统一用 `ALL/CUSTOM_DEPT/OWN_DEPT/OWN_DEPT_AND_CHILD/SELF`（不用 DEPT/DEPT_AND_CHILDREN）

- [ ] **Step 1-10: 创建所有 DDL 文件**（按 spec 中的 DDL 定义）
- [ ] **Step 11: jOOQ codegen 重新生成**

```bash
cd server && docker compose up -d
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

- [ ] **Step 12: 验证编译 + Commit（DDL + jOOQ 生成代码一起提交）**

---

## Phase 3: Platform 模块

### Task 3A: platform-iam

**最大最核心的模块**。包含 7 个子领域：user/role/dept/menu/permission/auth/session + **密码安全全套（05-security.md §8）**。

**Files（按 03-platform-modules.md §3-4 标准骨架）：**

```
server/mb-platform/platform-iam/
├── pom.xml
├── src/main/java/com/metabuild/platform/iam/
│   ├── api/ (UserApi, RoleApi, MenuApi, DeptApi, AuthApi, PermissionApi + dto/)
│   ├── domain/
│   │   ├── user/         → UserService, UserRepository
│   │   ├── role/         → RoleService, RoleRepository
│   │   ├── menu/         → MenuService, MenuRepository, RouteTreeRepository
│   │   ├── dept/         → DeptService, DeptRepository
│   │   ├── permission/   → PermissionService
│   │   ├── datascope/    → DataScopeLoader（**注意路径：datascope，不是 auth**）
│   │   ├── auth/         → AuthService, PasswordPolicy, MustChangePasswordInterceptor
│   │   └── session/      → RouteTreeSyncRunner, OnlineUserService, LoginLogService
│   ├── config/
│   │   └── MbIamPasswordProperties.java（mb.iam.password.* 12个配置项）
│   └── web/
│       ├── UserController, RoleController, MenuController, DeptController, AuthController
│       └── ...
├── src/main/resources/
│   ├── messages/iam_zh_CN.properties, iam_en_US.properties
│   ├── route-tree.json（**占位空 JSON：[]**，M2/M3 前端产出后替换）
│   └── META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

**密码安全功能清单（05-security.md §8，原计划遗漏）：**
- PasswordEncoder Bean 在 infra-security（Task 1C 已创建）
- MbIamPasswordProperties（12 个配置项：最小长度/复杂度/历史数/过期天数/锁定阈值...）按 09-config-management.md §9.2.12
- PasswordPolicy 类 — 校验密码是否满足策略
- 登录保护 — Redis 记录失败次数 → 渐进延迟 + 验证码阈值
- MustChangePasswordInterceptor — `must_change_password=true` 时拦截除改密外的所有请求
- PasswordHistoryRepository — 密码历史检查（防重用）
- 忘密流程 — Redis 一次性 token + notification 发邮件
- 改密后 AuthFacade.kickoutAll() 清除所有 session

**DataScopeConfig 注册表：**
```java
registry.register("mb_iam_user", "dept_id");
// mb_operation_log 不注册 — 追加表，不做部门级数据权限
```

**route-tree.json 占位：**
```json
[]
```
RouteTreeSyncRunner 需要 `@ConditionalOnResource(resources = "classpath:route-tree.json")` 或判空处理，避免空文件启动失败。

- [ ] **Step 1-14: 按 spec 完整实现所有子领域 + 密码安全**
- [ ] **Step 15: Commit**

---

### Task 3B: platform-oplog

按 03-platform-modules.md §2.3 实现：@OperationLog 注解 + OperationLogAspect + 异步写入。

关键：`@OperationLog` 标在 Controller 层。OperationLogWriter 用 `@Async` 异步写入。
mb_operation_log 是追加表（无 version/updated_*）。

- [ ] **Step 1-8: 实现 + Commit**

---

### Task 3C-3H: 其余 6 个 platform 模块

每个按标准骨架实现：pom.xml → api → Repository → Service → Controller → i18n → AutoConfiguration.imports。

| 模块 | 核心 | 特殊点 |
|------|------|--------|
| **3C: platform-dict** | DictTypeApi + DictDataApi + Redis 缓存 | mb_dict_data UNIQUE (tenant_id, dict_type_id, value) |
| **3D: platform-config** | ConfigApi + key-value CRUD + 缓存 | 无 owner_dept_id，不注册 DataScope |
| **3E: platform-file** | FileApi + FileStorage 接口 + LocalFileStorage | SHA-256 分级目录，双重校验(扩展名+MIME) |
| **3F: platform-notification** | NotificationApi + 发送/已读标记 | mb_notification_read 是追加表 |
| **3G: platform-job** | @Scheduled + ShedLock + JobLogWriter | 操作日志清理任务（90天过期） |
| **3H: platform-monitor** | MonitorApi + JVM/DB 指标读取 | 无独立表，依赖 Actuator + Micrometer |

每个模块完成后单独 commit。

---

## Phase 4: ArchUnit 规则补全

### Task 4.1: 新增 ArchUnit 规则（M1 3条 → 27+ 条）

**Files（全在 `server/mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/` 下，**不新建 rules/ 子包**，和 M1 保持一致）：**

| 文件 | 覆盖规则 # |
|------|-----------|
| `SaTokenIsolationRule.java` | #6 BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN, #20 ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN |
| `ControllerRule.java` | #7 CONTROLLER_NO_DIRECT_REPOSITORY, #8 CONTROLLER_MUST_HAVE_REQUIRE_PERMISSION |
| `DataScopeRule.java` | #4 NO_RAW_SQL_FETCH |
| `CacheEvictRule.java` | #5 NO_EVICT_ALL_ENTRIES |
| `TransactionRule.java` | #10 TRANSACTIONAL_ONLY_IN_SERVICE |
| `TimezoneRule.java` | #9 NO_LOCALDATETIME_IN_API |
| `CodingStyleRule.java` | #17 NO_MAPSTRUCT, #18+#19 OPTIONAL_ONLY_RETURN + NO_OPTIONAL_PARAMETERS, #19 ONLY_JAKARTA_NULLABLE |
| `GeneralCodingRulesBundle.java` | #12-14 + NO_GENERIC_EXCEPTIONS + NO_JODATIME（共 5 条） |
| `ConfigManagementRule.java` | #24 NO_AT_VALUE_ANNOTATION, #25 PROPERTIES_MUST_BE_VALIDATED, #26 NO_CONFIG_HARDCODED |
| `JooqWriteRule.java` | #21 WRITE_OPS_ONLY_VIA_RECORD_OR_HELPER, #22 NO_MANUAL_VERSION_INCREMENT, #23 NO_MANUAL_AUDIT_FIELDS |
| `JdbcIsolationRule.java` | #27 NO_JDBC_TEMPLATE_IN_BUSINESS |
| `BusinessBoundaryRule.java` | #11 BUSINESS_ONLY_DEPENDS_ON_PLATFORM_API（allowEmptyShould=true） |
| `CryptoIsolationRule.java` | 05-security.md §8.8.1 — 业务层只允许 spring-security-crypto.* |

**修改 ArchitectureTest：** 注册所有 27+ 条规则。移除 M1 的 `allowEmptyShould(true)`（Phase 3 已有真实代码）。

- [ ] **Step 1-3: 创建所有规则类 + 更新 ArchitectureTest + 运行验证**
- [ ] **Step 4: 修复任何违规代码直到全绿**
- [ ] **Step 5: Commit**

---

## Phase 5: 契约驱动

### Task 5.1: springdoc + OpenAPI + PermissionOperationCustomizer

**Files:**
- Create: `server/mb-admin/src/main/java/com/metabuild/admin/config/PermissionOperationCustomizer.java`
- Create: `server/api-contract/openapi-v1.json`
- Modify: `server/mb-admin/pom.xml`（springdoc-openapi-maven-plugin）

- [ ] **Step 1: 创建 PermissionOperationCustomizer**（06-api-and-contract.md §13.2）
- [ ] **Step 2: 添加 springdoc-openapi-maven-plugin 到 mb-admin pom.xml**
- [ ] **Step 3: 生成 OpenAPI JSON 基线**

```bash
cd server && docker compose up -d  # 需要 PG + Redis
cd server && mvn verify -pl mb-admin
cp server/mb-admin/target/openapi.json server/api-contract/openapi-v1.json
```

- [ ] **Step 4: Commit**

---

### Task 5.2: @mb/api-sdk 生成配置

- Create: `tools/openapi-generator/config.yaml`
- Modify: `client/packages/api-sdk/package.json`

- [ ] **按 06-api-and-contract.md §9-10 配置 + Commit**

---

## Phase 6: 集成测试 + 全量验证

### Task 6.1: 测试基础设施完善

- 完善 MockCurrentUser（添加 DataScope 相关方法）
- 完善 MockAuthFacade
- 创建 TestSecurityConfig（@Bean @Primary 两个 mock）

### Task 6.2: 关键集成测试

每个 platform 模块至少 1 个集成测试：
- **platform-iam**: 登录/创建用户/角色分配/数据权限过滤/密码策略
- **platform-oplog**: 操作日志记录
- **platform-file**: 文件上传/下载
- **platform-dict**: 字典 CRUD + 缓存

### Task 6.3: 全量验证

| 检查项 | 命令 | 预期 |
|--------|------|------|
| 全量编译 | `cd server && mvn compile` | BUILD SUCCESS |
| 全量测试 | `cd server && mvn verify` | 0 failures |
| ArchUnit 全绿 | `mvn test -Dtest=ArchitectureTest -pl mb-admin` | 全绿 |
| Spring Boot 启动 | `mvn spring-boot:run -pl mb-admin` | 启动成功 |
| Actuator 健康检查 | `curl localhost:8080/actuator/health` | {"status":"UP"} |
| jOOQ codegen | `mvn -Pcodegen generate-sources -pl mb-schema` | 全表生成 |
| 单模块运行 | `mvn install -DskipTests && mvn spring-boot:run -pl mb-admin` | 通过 |

---

## Review 修复记录

本计划经过三轮独立 review（spec 覆盖 + 技术准确性 + DBA），修复了以下问题：

| # | 问题 | 修复 |
|---|------|------|
| C1 | Flyway V20260414 < V20260601 排序错误 | 改用 V20260602+ |
| C2 | 缺失 mb_iam_password_history | 添加 DDL #9 |
| C3 | mb_iam_user 缺 version/password 字段 | 添加 ALTER DDL #1 |
| C4 | infra-observability M4 补全遗漏 | 新增 Task 1H |
| C5 | 缺少 3+ 条 ArchUnit 规则 | Phase 4 补全 13 个文件 |
| C6 | Task 0.3 与 Task 1G 审计机制重复 | 删除 Task 0.3 审计部分，只用 RecordListener |
| C7 | SortParser 用 HttpStatus（Spring） | 改用 int 400 |
| C8 | mb_operation_log 无 dept_id 但被 DataScopeConfig 注册 | 不注册 DataScope |
| C9 | OpenApiConfig 放 infra-exception 语义错 | 移到 mb-admin |
| M1 | 缺失密码安全特性 | Task 3A 补全 05-security.md §8 |
| M2 | 缺失 mb_iam_role_data_scope_dept | 添加 DDL #8 |
| M3 | 缺失 mb_iam_login_log | 添加 DDL #10 |
| M4 | dependencyManagement 缺条目 | Task 0.1 统一添加 |
| M5 | 测试缺 Redis | Task 0.5 SharedRedisContainer |
| M6 | 无 Lombok | Task 0.1 添加 |
| M7 | datascope 子包路径错 | 改为 domain/datascope/ |
| M8 | infra-jooq 缺 AOP 依赖 | Task 1G 补充 |
| M9 | @NotNull + null 默认值矛盾 | 移除 @NotNull |
| M10-12 | DDL 缺索引/version/UNIQUE | Phase 2 修复 |
| M13 | 缺 route-tree.json 占位 | Task 3A 添加空 JSON |
| M14 | DataScopeType 枚举名不一致 | 统一为 OWN_DEPT/OWN_DEPT_AND_CHILD |
| M15 | mb-common 类已存在未标注 | 添加"M1 现有资产"章节 |
| M16 | ModuleBoundaryRule 迁移会 break import | 保持原路径 |
| M17 | test/prod profile 未更新 | Task 1-Final 覆盖 |
