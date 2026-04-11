# 08 - ArchUnit 规则集与反面教材索引

> **关注点**：所有 ArchUnit 规则的集中清单 + nxboot 反面教材的索引。两者本质是"规则 ↔ 反模式"的双向映射。
>
> **本文件吸收原 backend-architecture.md §6（ArchUnit 规则集）+ §14（反面教材清单）**。

## 1. 决策结论 [M1+M4]

架构守护 = **Maven 依赖隔离 + ArchUnit 规则双保险**（ADR-0003 移除 Spring Modulith）。

- **Maven 层**（pom 级）：模块间依赖关系在 `pom.xml` 里显式声明，PR review 可见
- **ArchUnit 层**（包级）：规则代码放 `infra-archunit` 模块，测试集中在 `mb-admin/src/test/java/com/metabuild/architecture/`

**ArchUnit 规则分 3 类**：
1. **借用官方 `GeneralCodingRules`**：零成本的通用规则（字段注入禁用 / System.out 禁用 / java.util.logging 禁用 / 通用异常禁用）
2. **自研模块边界规则**：跨模块访问、jOOQ 隔离、Sa-Token 隔离等（核心守护）
3. **自研代码细节规则**：事务边界、时区、@CacheEvict 等

M1 启动 3 条最基础的规则，M4 补全到 10+ 条。

## 2. M1 启动 3 条规则 [M1]

| # | 规则名 | 意图 | 所属章节 |
|---|--------|-----|---------|
| 1 | `DOMAIN_MUST_NOT_USE_JOOQ` | Domain 层不依赖 jOOQ | [5.1](#51-jooq-不入-service-m1m4) |
| 2 | `CROSS_PLATFORM_ONLY_VIA_API` | 跨 platform 模块只走 api 子包 | [5.2](#52-跨模块走对方-api-子包-m1m4) |
| 3 | `NO_CYCLIC_DEPENDENCIES` | 无模块间循环依赖 | [5.2](#52-跨模块走对方-api-子包-m1m4) |

## 3. M4 补全规则 [M4]

| # | 规则名 | 意图 | 所属章节 |
|---|--------|-----|---------|
| 4 | `NO_RAW_SQL_FETCH` | **业务层禁止使用 jOOQ `@PlainSQL` API**（会绕过 `DataScopeVisitListener`） | [5.3](#53-datascope-opt-out方案-e-visitlistener-单点--零基类-m1m4) |
| 5 | `NO_EVICT_ALL_ENTRIES` | 禁止 @CacheEvict(allEntries=true) | [5.4](#54-缓存-key-级失效禁用-allentriestrue-m4) |
| 6 | `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN` | **业务层禁止直接依赖 Sa-Token**（ADR-0005） | [8.6](#86-currentuser-门面层设计-adr-0005) |
| 7 | `CONTROLLER_NO_DIRECT_REPOSITORY` | Controller 不直接注入 Repository | 本章 6.4 |
| 8 | `CONTROLLER_MUST_HAVE_REQUIRE_PERMISSION` | 所有 Controller 方法必须有 @RequirePermission 或 @PermitAll | 本章 6.4 |
| 9 | `NO_LOCALDATETIME_IN_API` | api 包禁用 LocalDateTime（必须 Instant） | [13](#13-时区规范-adr-008-m1) |
| 10 | `TRANSACTIONAL_ONLY_IN_SERVICE` | @Transactional 只出现在 Service 层 | [7.7](#77-事务边界规范-p1) |
| 11 | `BUSINESS_ONLY_DEPENDS_ON_PLATFORM_API` | business 模块只能依赖 platform 的 api | [5.2](#52-跨模块走对方-api-子包-m1m4) |
| 12 | `GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION` | 禁用 @Autowired 字段注入 | 本章 6.4 |
| 13 | `GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS` | 禁用 System.out/err | 本章 6.4 |
| 14 | `GeneralCodingRules.NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING` | 禁用 java.util.logging（必须 SLF4J） | 本章 6.4 |

> **注意**：原规则 `REPOSITORIES_MUST_EXTEND_DATA_SCOPED` 已被方案 E 移除（详见 ADR-0007）。数据权限改由 `DataScopeVisitListener` 单点拦截，不再需要 Repository 继承基类。等价的守护规则是新的 `NO_RAW_SQL_FETCH`——只要业务层不走 `@PlainSQL` 字符串 SQL，VisitListener 就不会被绕过。

## 4. Controller + 依赖注入 + 编码规范规则 [M4]

```java
// infra-archunit/src/main/java/com/metabuild/infra/archunit/rules/ControllerRule.java
public class ControllerRule {

    public static final ArchRule CONTROLLER_NO_DIRECT_REPOSITORY = noClasses()
        .that().resideInAPackage("..web..")
        .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository")
        .as("Controller 不能直接依赖 Repository，必须走 Service/Api");

    public static final ArchRule CONTROLLER_MUST_HAVE_REQUIRE_PERMISSION = methods()
        .that().areDeclaredInClassesThat().areAnnotatedWith(RestController.class)
        .and().arePublic()
        .and().areNotDeclaredIn(Object.class)
        .should().beAnnotatedWith(RequirePermission.class)
        .orShould().beAnnotatedWith(PermitAll.class)
        .as("所有 public Controller 方法必须显式声明 @RequirePermission 或 @PermitAll");
}
```

```java
// infra-archunit/src/main/java/com/metabuild/infra/archunit/rules/SaTokenIsolationRule.java
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

public class SaTokenIsolationRule {

    /** 业务层（platform/business/schema）禁止直接依赖 Sa-Token */
    public static final ArchRule BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN = noClasses()
        .that().resideInAnyPackage(
            "com.metabuild.platform..",
            "com.metabuild.business..",
            "com.metabuild.schema.."
        )
        .should().dependOnClassesThat().resideInAPackage("cn.dev33.satoken..")
        .as("业务层必须通过 CurrentUser 门面使用认证，禁止直接依赖 Sa-Token API（ADR-0005）");

    /** Sa-Token 的 API 只能在 infra-security 和 admin 里用 */
    public static final ArchRule ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN = classes()
        .that().dependOnClassesThat().resideInAPackage("cn.dev33.satoken..")
        .should().resideInAnyPackage(
            "com.metabuild.infra.security..",
            "com.metabuild.admin.."   // 启动入口允许直接配置
        )
        .as("Sa-Token API 只能在 infra-security 模块内部和 admin 启动入口使用");
}
```

**借用 ArchUnit 官方 `GeneralCodingRules`（零成本规则）**：

```java
import com.tngtech.archunit.library.GeneralCodingRules;

public class GeneralCodingRulesBundle {

    public static final ArchRule NO_FIELD_INJECTION =
        GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;

    public static final ArchRule NO_SYSTEM_STREAMS =
        GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS;

    public static final ArchRule NO_JAVA_UTIL_LOGGING =
        GeneralCodingRules.NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING;

    public static final ArchRule NO_GENERIC_EXCEPTIONS =
        GeneralCodingRules.NO_CLASSES_SHOULD_THROW_GENERIC_EXCEPTIONS;

    public static final ArchRule NO_JODATIME =
        GeneralCodingRules.NO_CLASSES_SHOULD_USE_JODATIME;
}
```

## 5. 测试基类 ArchitectureTest [M1+M4]

**位置**：`mb-admin/src/test/java/com/metabuild/architecture/ArchitectureTest.java`

`mb-admin` 的 `pom.xml` 依赖所有 `platform-*` 和 `business-*` 模块（启动聚合），ArchUnit 测试在这里能扫描到所有 class。

**关键：排除 jOOQ 生成代码**（来自 `mb-schema` 的 `jooq-generated/`），避免 ArchUnit 误报生成代码中的命名规范问题。

```java
// mb-admin/src/test/java/com/metabuild/architecture/ArchitectureTest.java
package com.metabuild.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.core.importer.Location;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(
    packages = "com.metabuild..",
    importOptions = {
        ImportOption.DoNotIncludeTests.class,
        ImportOption.DoNotIncludeArchives.class,
        DoNotIncludeGeneratedJooq.class
    }
)
public class ArchitectureTest {

    // === M1 3 条 ===
    @ArchTest
    static final ArchRule domain_must_not_use_jooq =
        JooqIsolationRule.DOMAIN_MUST_NOT_USE_JOOQ;

    @ArchTest
    static final ArchRule cross_platform_only_via_api =
        ModuleBoundaryRule.CROSS_PLATFORM_ONLY_VIA_API;

    @ArchTest
    static final ArchRule no_cyclic_dependencies =
        ModuleBoundaryRule.NO_CYCLIC_DEPENDENCIES;

    // === M4 补全 ===
    @ArchTest
    static final ArchRule business_must_not_depend_on_sa_token =
        SaTokenIsolationRule.BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN;

    @ArchTest
    static final ArchRule no_raw_sql_fetch =
        DataScopeRule.NO_RAW_SQL_FETCH;

    @ArchTest
    static final ArchRule no_evict_all_entries =
        CacheEvictRule.NO_EVICT_ALL_ENTRIES;

    @ArchTest
    static final ArchRule controller_no_direct_repository =
        ControllerRule.CONTROLLER_NO_DIRECT_REPOSITORY;

    @ArchTest
    static final ArchRule controller_must_have_require_permission =
        ControllerRule.CONTROLLER_MUST_HAVE_REQUIRE_PERMISSION;

    @ArchTest
    static final ArchRule no_localdatetime_in_api =
        TimezoneRule.NO_LOCALDATETIME_IN_API;

    @ArchTest
    static final ArchRule transactional_only_in_service =
        TransactionRule.TRANSACTIONAL_ONLY_IN_SERVICE;

    // === GeneralCodingRules 零成本规则 ===
    @ArchTest
    static final ArchRule no_field_injection = GeneralCodingRulesBundle.NO_FIELD_INJECTION;

    @ArchTest
    static final ArchRule no_system_streams = GeneralCodingRulesBundle.NO_SYSTEM_STREAMS;

    @ArchTest
    static final ArchRule no_java_util_logging = GeneralCodingRulesBundle.NO_JAVA_UTIL_LOGGING;

    @ArchTest
    static final ArchRule no_generic_exceptions = GeneralCodingRulesBundle.NO_GENERIC_EXCEPTIONS;
}
```

**排除 jOOQ 生成代码的 ImportOption**：

```java
// mb-admin/src/test/java/com/metabuild/architecture/DoNotIncludeGeneratedJooq.java
package com.metabuild.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.core.importer.Location;

public class DoNotIncludeGeneratedJooq implements ImportOption {
    @Override
    public boolean includes(Location location) {
        return !location.contains("/generated-sources/jooq/")
            && !location.contains("/mb-schema/") // mb-schema 的 jooq-generated 目录
            && !location.contains("/com/metabuild/schema/");
    }
}
```

**关键**：ArchUnit 测试放在 `mb-admin` 而不是 `infra-archunit`，因为：
- `mb-admin` 依赖所有 `platform-*` 和 `business-*` 模块（聚合启动），classpath 完整
- `infra-archunit` 只放**规则代码**（规则类），**不放测试**，可以被所有模块引用而不引入循环
- 规则类 → `infra-archunit`，测试 → `mb-admin`

<!-- verify: cd server && mvn -pl mb-admin test -Dtest=ArchitectureTest -->

## 6. 反面教材清单（15 条 + 1 元方法论） [M0]

> 这些是 nxboot 已经踩过的坑，**meta-build 从第一天起用工具拦截**，让错误在编译/测试阶段暴露。每条都有对应的防御机制 + 可执行验证。

| # | 反面教材 | 防御机制 | 本文档位置 | 验证方式 |
|---|---------|---------|-----------|---------|
| 1 | **文档-代码 drift**（nxboot CLAUDE.md 描述 7 个 shared/components 在磁盘是空目录） | 每章 verify 块可执行 + CLAUDE.md 索引式（与代码同步演进） | 全文 | 每章末尾 `<!-- verify: -->` |
| 2 | **反 opt-in 安全模式**（DataScope 忘加注解就静默泄漏） | **方案 E：`DataScopeVisitListener` 在 jOOQ SQL 构建层单点拦截（零 Repository 基类）**+ `DataScopeRegistry` 集中声明受保护表 + `@BypassDataScope` 显式跳过 + `NO_RAW_SQL_FETCH` ArchUnit 兜底 | [5.3](#53-datascope-opt-out方案-e-visitlistener-单点--零基类-m1m4) | `UserRepositoryDataScopeTest` + `NO_RAW_SQL_FETCH` 规则 |
| 3 | **反 jOOQ 泄漏到 Service**（nxboot 50 个文件 import org.jooq） | ArchUnit `DOMAIN_MUST_NOT_USE_JOOQ` | [5.1](#51-jooq-不入-service-m1m4) | `JooqIsolationTest` |
| 4 | **反全量缓存失效**（`@CacheEvict(allEntries=true)` 规模上去形同虚设） | ArchUnit `NO_EVICT_ALL_ENTRIES` + grep 校验 | [5.4](#54-缓存-key-级失效禁用-allentriestrue-m4) | `mvn test + grep` |
| 5 | **反继承惯性从 nxboot 搬 `DataScopedRepository` 基类**（MyBatis-Plus 习惯带到 jOOQ，隐式全局 `DataScopeContext` ThreadLocal，异步丢失 + AI 追父类心智负担） | **方案 E 整体砍掉基类和 `DataScopeContext`**；数据权限通过 `CurrentUser`（来自 Sa-Token session 单一数据源）+ `DataScopeVisitListener` 实现，整个项目只剩 Sa-Token 一个 ThreadLocal 需要在 `AsyncConfig` 传递 | [5.3](#53-datascope-opt-out方案-e-visitlistener-单点--零基类-m1m4) / [ADR-0007](../adr/0007-继承遗产前先问原生哲学.md) | 代码搜索 `extends DataScopedRepository` / `DataScopeContext` 应全为 0 |
| 6 | **反 R<T> 200 OK 包装**（破坏 HTTP 语义，监控/CDN 失效） | 错误一律 4xx/5xx + ProblemDetail + ArchUnit 校验 Controller 返回类型 | [9.3](#93-响应格式混合方案) | `ResponseFormatTest` |
| 7 | **反硬编码敏感配置**（密钥默认值写在代码里） | env var 无默认值，缺失启动失败 + `@ConfigurationProperties` 校验 | [8.4](#84-强制敏感配置) | `ConfigValidationTest` |
| 8 | **反跨模块穿透 Repository**（RoleService 直接读 menu 表） | Maven pom 白名单 + ArchUnit `CROSS_PLATFORM_ONLY_VIA_API`（ADR-0003） | [5.2](#52-跨模块走对方-api-子包-m1m4) | `ModuleBoundaryTest` |
| 9 | **反时区混乱**（LocalDateTime 出现在 API 边界） | ArchUnit `NO_LOCALDATETIME_IN_API` + Jackson UTC 配置 | [13](#13-时区规范-adr-008-m1) | `TimezoneRuleTest` |
| 10 | **反 Controller 直接注入 Repository** | ArchUnit `CONTROLLER_NO_DIRECT_REPOSITORY` | [6.4](#64-controller--依赖注入--编码规范规则) | `ControllerBoundaryTest` |
| 11 | **反 @Autowired 字段注入** | `GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION` | [6.4](#64-controller--依赖注入--编码规范规则) | `InjectionStyleTest` |
| 12 | **反 CLAUDE.md 全细节**（nxboot CLAUDE.md 19KB 单文件，drift 一次全毁） | CLAUDE.md 索引式，细节下放 specs/adr | `CLAUDE.md` 骨架 | 人工审查 |
| 13 | **反认证框架耦合业务层**（Spring Security / Sa-Token 的 API 散落在 Service / Controller） | `CurrentUser` 门面 + ArchUnit `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN`（ADR-0005） | [8.6](#86-currentuser-门面层设计-adr-0005) | `SaTokenIsolationTest` |
| 14 | **反 jOOQ 生成代码放在基础设施层**（语义错配） | 独立 `mb-schema` 数据库契约层（ADR-0004） | [1.2](#12-6-层-maven-模块)、[7.6](#76-jooq-代码生成流程adr-0004codegen-在-mb-schema) | Maven 依赖检查 |
| 15 | **反 Service 方法抛 checked Exception**（Spring 默认不回滚） | 业务异常继承 `RuntimeException`；约定 Service 不抛 checked | [7.7 回滚规则](#回滚规则) | 代码 review |

---

[← 返回 README](./README.md)
