# 08 - ArchUnit 规则集与反面教材索引

> **关注点**：所有 ArchUnit 规则的集中清单 + nxboot 反面教材的索引。两者本质是"规则 ↔ 反模式"的双向映射。
>
> **本文件吸收原 backend-architecture.md §6（ArchUnit 规则集）+ §14（反面教材清单）**。

## 1. 决策结论 [M1+M4]

架构守护 = **Maven 依赖隔离 + ArchUnit 规则双保险**（ADR-0003 移除 Spring Modulith）。

- **Maven 层**（pom 级）：模块间依赖关系在 `pom.xml` 里显式声明，PR review 可见
- **ArchUnit 层**（包级）：规则代码放 `infra-archunit` 模块，测试集中在 `mb-admin/src/test/java/com/metabuild/admin/architecture/`

**ArchUnit 规则分 3 类**：
1. **借用官方 `GeneralCodingRules`**：零成本的通用规则（字段注入禁用 / System.out 禁用 / java.util.logging 禁用 / 通用异常禁用）
2. **自研模块边界规则**：跨模块访问、jOOQ 隔离、Sa-Token 隔离等（核心守护）
3. **自研代码细节规则**：事务边界、时区、@CacheEvict 等

M1 启动 3 条最基础的规则，M4 补全到 24 条；后续在分页契约重构中新增 2 条分页守护规则、在 Admin usecase 边界中新增 2 条编排守护规则，当前实际落到代码的 `ArchitectureTest` 共 28 个 `@Test` 方法。

## 2. M1 启动 3 条规则 [M1]

| # | 规则名 | 意图 | 所属章节 |
|---|--------|-----|---------|
| 1 | `DOMAIN_MUST_NOT_USE_JOOQ`（精化为 `DSLCONTEXT_ONLY_IN_REPOSITORY` + `SERVICE_JOOQ_WHITELIST`，N3）| Service / Controller 禁止持有 DSLContext；Service 对 jOOQ 依赖仅限 Record/Result 白名单 | [04-data-persistence.md §7](./04-data-persistence.md) + 本章编码风格契约 |
| 2 | `CROSS_PLATFORM_ONLY_VIA_API` | 跨 platform 模块只走 api 子包 | [01-module-structure.md §3](./01-module-structure.md) |
| 3 | `NO_CYCLIC_DEPENDENCIES` | 无模块间循环依赖 | [01-module-structure.md §3](./01-module-structure.md) |

## 3. M4 补全规则 [M4]

| # | 规则名 | 意图 | 所属章节 |
|---|--------|-----|---------|
| 4 | `NO_RAW_SQL_FETCH` | **业务层禁止使用 jOOQ `@PlainSQL` API**（会绕过 `DataScopeExecuteListener`） | [05-security.md §7](./05-security.md) |
| 5 | `NO_EVICT_ALL_ENTRIES` | 禁止 @CacheEvict(allEntries=true) | [04-data-persistence.md §11](./04-data-persistence.md) |
| 6 | `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN` | **业务层禁止直接依赖 Sa-Token**（ADR-0005） | [05-security.md §6](./05-security.md) |
| 7 | `CONTROLLER_NO_DIRECT_REPOSITORY` | Controller 不直接注入 Repository | 本章 §4 |
| 8 | `CONTROLLER_MUST_HAVE_REQUIRE_PERMISSION` | 所有 Controller 方法必须有 @RequirePermission 或 @PermitAll | 本章 §4 |
| 9 | `NO_LOCALDATETIME_IN_API` | api 包禁用 LocalDateTime（必须 Instant） | [04-data-persistence.md §12](./04-data-persistence.md) |
| 10 | `TRANSACTIONAL_ONLY_IN_SERVICE` | @Transactional 只出现在 Service 层 | [04-data-persistence.md §8](./04-data-persistence.md) |
| 11 | `BUSINESS_ONLY_DEPENDS_ON_PLATFORM_API` | business 模块只能依赖 platform 的 api | [01-module-structure.md §3](./01-module-structure.md) [M4 补全] |
| 12 | `GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION` | 禁用 @Autowired 字段注入 | 本章 §4 |
| 13 | `GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS` | 禁用 System.out/err | 本章 §4 |
| 14 | `GeneralCodingRules.NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING` | 禁用 java.util.logging（必须 SLF4J） | 本章 §4 |
| 15 | `DSLCONTEXT_ONLY_IN_REPOSITORY` | DSLContext 只能作为 Repository 字段，Service/Controller 禁止持有（N3） | 本章 §7 N3 精化规则 |
| 16 | `SERVICE_JOOQ_WHITELIST` | Service 对 org.jooq 依赖仅限 Record/Result/exception 白名单；DSLContext / DSL / Field / Condition 等 DSL 类一律禁止（N3，C8）| 本章 §7 N3 精化规则 |
| 17 | `NO_MAPSTRUCT` | v1 禁用 MapStruct / ModelMapper，手写 `from()` 静态工厂（C2） | 本章 §8 编码风格契约 |
| 18 | `OPTIONAL_ONLY_RETURN` + `NO_OPTIONAL_PARAMETERS` | Optional 只能作为返回值，禁作字段类型（OPTIONAL_ONLY_RETURN）和方法参数（NO_OPTIONAL_PARAMETERS）（C2） | 本章 §8 编码风格契约 |
| 19 | `ONLY_JAKARTA_NULLABLE` | @Nullable 统一用 jakarta.annotation.Nullable（C2） | 本章 §8 编码风格契约 |
| 20 | `ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN` | Sa-Token API 只能在 infra-security 和 admin 里用 | [05-security.md §6](./05-security.md) + 本章 §4 |
| 21 | `WRITE_OPS_ONLY_VIA_RECORD_OR_HELPER` | 业务层写操作只走 Record.store() 或 JooqHelper | 本章 §6 M4 jOOQ 写操作硬约束 |
| 22 | `NO_MANUAL_VERSION_INCREMENT` | 业务层禁止手动操作 version 字段 | 本章 §6 M4 jOOQ 写操作硬约束 |
| 23 | `NO_MANUAL_AUDIT_FIELDS` | 业务层禁止手动设置审计字段 | 本章 §6 M4 jOOQ 写操作硬约束 |
| 24 | `NO_AT_VALUE_ANNOTATION` | 禁止 `@Value` 注入配置（必须用 `@ConfigurationProperties`） | [09-config-management.md §9.5](./09-config-management.md) |
| 25 | `PROPERTIES_MUST_BE_VALIDATED` | `@ConfigurationProperties` 类必须加 `@Validated` | [09-config-management.md §9.5](./09-config-management.md) |
| 26 | `NO_CONFIG_HARDCODED` | 禁止硬编码配置值（评估替代方案：Checkstyle/PMD） [M4 评估] | [09-config-management.md §9.1](./09-config-management.md) |
| 27 | `NO_JDBC_TEMPLATE_IN_BUSINESS` | 业务层（platform/business）禁止使用 JdbcTemplate / NamedParameterJdbcTemplate / DataSource.getConnection()（会绕过 DataScopeExecuteListener 数据权限拦截） | [05-security.md §7](./05-security.md) |
| 28 | `ADMIN_USECASE_ONLY_DEPENDS_ON_MODULE_API_OR_SHARED` | `mb-admin/usecase` 只允许依赖模块公开 API 和共享层，不得依赖模块内部实现 | [01-module-structure.md §4.2](./01-module-structure.md#42-层次职责严格划分) |
| 29 | `ADMIN_WEB_MUST_NOT_DEPEND_ON_MODULES_DIRECTLY` | `mb-admin/web` 不得直接依赖 `platform` / `business` 模块，必须经 `mb-admin/usecase` | [01-module-structure.md §4.2](./01-module-structure.md#42-层次职责严格划分) |

> **注意**：原规则 `REPOSITORIES_MUST_EXTEND_DATA_SCOPED` 已被方案 E 移除（详见 ADR-0007）。数据权限改由 `DataScopeExecuteListener` 单点拦截，不再需要 Repository 继承基类。等价的守护规则是新的 `NO_RAW_SQL_FETCH`——只要业务层不走 `@PlainSQL` 字符串 SQL，VisitListener 就不会被绕过。
>
> **N3 精化**：原规则 `DOMAIN_MUST_NOT_USE_JOOQ` 在 M1 阶段仍然保留，M4 阶段用更精确的 `DSLCONTEXT_ONLY_IN_REPOSITORY`（字段级）+ `SERVICE_JOOQ_WHITELIST`（白名单级）替代，完整表达"jOOQ DSL 查询只在 Repository 里写"的意图（详见本章 §7 N3 精化规则）。
>
> **Clock Bean**：`Clock` Bean 统一时间获取为编码建议（非 ArchUnit 硬规则），通过 canonical reference 模板代码示范引导，详见本章 §8.8。

### 3.1 Admin usecase 边界规则 [M5+]

围绕 `mb-admin/usecase` 的定位，新增两条规则：

1. **`ADMIN_USECASE_ONLY_DEPENDS_ON_MODULE_API_OR_SHARED`**  
   `mb-admin/usecase` 只允许依赖：
   - `platform..api..`
   - `business..api..`
   - `common..`
   - `infra..`
   - 以及 Java / Jakarta / Spring / SLF4J 等基础技术包

   明确禁止它直接碰：
   - `platform..domain..`
   - `platform..web..`
   - `business..domain..`
   - `business..web..`
   - 以及由此引申出的 Repository / jOOQ 细节

2. **`ADMIN_WEB_MUST_NOT_DEPEND_ON_MODULES_DIRECTLY`**  
   `mb-admin/web` 只做管理端 HTTP 适配，不允许直接依赖 `platform` / `business` 模块。跨模块组合必须先下沉到 `mb-admin/usecase`。

这两条规则当前都带 `allowEmptyShould(true)`，因为仓库中 `mb-admin/usecase` / `mb-admin/web` 还未正式落地代码，先固化边界意图，后续落代码时自动受约束。

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

**位置**：`mb-admin/src/test/java/com/metabuild/admin/architecture/ArchitectureTest.java`

`mb-admin` 的 `pom.xml` 依赖所有 `platform-*` 和 `business-*` 模块（启动聚合），ArchUnit 测试在这里能扫描到所有 class。

**关键：排除 jOOQ 生成代码**（来自 `mb-schema` 的 `jooq-generated/`），避免 ArchUnit 误报生成代码中的命名规范问题。

```java
// mb-admin/src/test/java/com/metabuild/admin/architecture/ArchitectureTest.java
package com.metabuild.admin.architecture;

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

    // === M4 jOOQ 写操作硬约束 ===
    @ArchTest
    static final ArchRule write_ops_only_via_record_or_helper =
        JooqWriteRule.WRITE_OPS_ONLY_VIA_RECORD_OR_HELPER;

    @ArchTest
    static final ArchRule no_manual_version_increment =
        JooqWriteRule.NO_MANUAL_VERSION_INCREMENT;

    @ArchTest
    static final ArchRule no_manual_audit_fields =
        JooqWriteRule.NO_MANUAL_AUDIT_FIELDS;

    // === Sa-Token 双向隔离 ===
    @ArchTest
    static final ArchRule only_infra_security_depends_on_sa_token =
        SaTokenIsolationRule.ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN;

    // === N3 精化规则 ===
    @ArchTest
    static final ArchRule dslcontext_only_in_repository =
        JooqIsolationRule.DSLCONTEXT_ONLY_IN_REPOSITORY;

    @ArchTest
    static final ArchRule service_jooq_whitelist =
        JooqIsolationRule.SERVICE_JOOQ_WHITELIST;

    // === 编码风格契约规则 ===
    @ArchTest
    static final ArchRule no_mapstruct =
        CodingStyleRule.NO_MAPSTRUCT;

    @ArchTest
    static final ArchRule optional_only_return =
        CodingStyleRule.OPTIONAL_ONLY_RETURN;

    @ArchTest
    static final ArchRule no_optional_parameters =
        CodingStyleRule.NO_OPTIONAL_PARAMETERS;

    @ArchTest
    static final ArchRule only_jakarta_nullable =
        CodingStyleRule.ONLY_JAKARTA_NULLABLE;

    // === JDBC 隔离 ===
    @ArchTest
    static final ArchRule no_jdbc_template_in_business =
        JdbcIsolationRule.NO_JDBC_TEMPLATE_IN_BUSINESS;

    // === GeneralCodingRules 零成本规则 ===
    @ArchTest
    static final ArchRule no_field_injection = GeneralCodingRulesBundle.NO_FIELD_INJECTION;

    @ArchTest
    static final ArchRule no_system_streams = GeneralCodingRulesBundle.NO_SYSTEM_STREAMS;

    @ArchTest
    static final ArchRule no_java_util_logging = GeneralCodingRulesBundle.NO_JAVA_UTIL_LOGGING;

    @ArchTest
    static final ArchRule no_generic_exceptions = GeneralCodingRulesBundle.NO_GENERIC_EXCEPTIONS;

    @ArchTest
    static final ArchRule no_jodatime = GeneralCodingRulesBundle.NO_JODATIME;
}
```

**排除 jOOQ 生成代码的 ImportOption**：

```java
// mb-admin/src/test/java/com/metabuild/admin/architecture/DoNotIncludeGeneratedJooq.java
package com.metabuild.admin.architecture;

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

## 6. M4 jOOQ 写操作硬约束 [M4]

> 配合 [04-data-persistence.md §8.5-§8.7](04-data-persistence.md) 的 jOOQ 二元路径规范。业务层的所有写操作收敛到两个入口：`UpdatableRecord.store()`（单条）或 `jooqHelper.batch*/conditional*`（批量+条件）。以下 4 条 ArchUnit 规则强制锁死其他入口。

### WRITE_OPS_ONLY_VIA_RECORD_OR_HELPER

业务层（`platform-*` 业务模块 + `business-*` 模块）禁止直接调用 `DSLContext.insertInto(Table)` / `DSLContext.update(Table)` / `DSLContext.deleteFrom(Table)`。

**例外**：`infra-*` 所有模块 + `platform-job.*` 允许原生 DSL（系统级维护动作）。

```java
@ArchTest
static final ArchRule WRITE_OPS_ONLY_VIA_RECORD_OR_HELPER = noClasses()
    .that().resideInAnyPackage(
        "com.metabuild.platform..",
        "com.metabuild.business.."
    )
    .and().doNotResideInAnyPackage(
        "com.metabuild.platform.job.."          // platform-job 允许(系统级清理)
    )
    .should().callMethodWhere(
        // 匹配 DSLContext.update(Table) / insertInto(Table) / deleteFrom(Table)
        JavaCall.Predicates.target(HasOwner.Predicates.With.owner(
            type(DSLContext.class)
        )).and(JavaCall.Predicates.target(name("update").or(name("insertInto")).or(name("deleteFrom"))))
    )
    .because(
        "业务层写操作必须走 UpdatableRecord.store() 或 JooqHelper.batch*/conditional*," +
        "不能直接用原生 DSL 绕过 RecordListener + Settings 的审计字段 + 乐观锁机制" +
        "(详见 04-data-persistence.md §8.5-§8.7)"
    );
```

### NO_MANUAL_VERSION_INCREMENT

业务层禁止手动操作 `version` 字段（`VERSION.add(1)` / `set(T.VERSION, ...)` / `where(T.VERSION.eq(?))`）。这些是"没用 jOOQ 原生乐观锁"的症状。

```java
@ArchTest
static final ArchRule NO_MANUAL_VERSION_INCREMENT = noClasses()
    .that().resideInAnyPackage(
        "com.metabuild.platform..",
        "com.metabuild.business.."
    )
    .should().accessFieldWhere(
        // 规则实现:检测对任何 TableField 的 VERSION 字段的读写
        // 具体实现见 infra-archunit/src/test/java/...
    )
    .because(
        "乐观锁统一走 jOOQ Settings.executeWithOptimisticLocking + updateRecordVersion," +
        "业务层禁止手动拼 SET version = version + 1 或 WHERE version = ?" +
        "(详见 04-data-persistence.md §8.5)"
    );
```

### NO_MANUAL_AUDIT_FIELDS

业务层禁止手动设置 `created_at / created_by / updated_at / updated_by` 四个审计字段。这些字段由 jOOQ 原生机制自动填充：

- `created_at`：数据库 `DEFAULT CURRENT_TIMESTAMP`
- `updated_at`：`Settings.updateRecordTimestamp=true`
- `created_by / updated_by`：`AuditFieldsRecordListener`（单条）或 `jooqHelper` 内部（批量）

```java
@ArchTest
static final ArchRule NO_MANUAL_AUDIT_FIELDS = noClasses()
    .that().resideInAnyPackage(
        "com.metabuild.platform..",
        "com.metabuild.business.."
    )
    .and().doNotResideInAnyPackage(
        "com.metabuild.infra.jooq.."            // JooqHelper 自己要填审计字段
    )
    .should().callMethodWhere(
        // 规则实现:检测 record.set(T.CREATED_AT, ...) / SET(T.UPDATED_BY, ...) 等
    )
    .because(
        "审计字段由 DB DEFAULT + jOOQ Settings + RecordListener 自动填充," +
        "业务层手动设置 = 绕过原生机制 = 和 nxboot JooqHelper.setAuditInsert() 补丁范式同源" +
        "(详见 04-data-persistence.md §8.6)"
    );
```

### NO_RAW_SQL_FETCH

（**已存在**，见 [05-security.md §7.9](05-security.md)，本节不重复定义。）

### NO_JDBC_TEMPLATE_IN_BUSINESS

业务层禁止直接使用 JDBC，所有数据库访问必须走 jOOQ DSL（确保 DataScopeExecuteListener 生效）。

```java
// NO_JDBC_TEMPLATE_IN_BUSINESS [M4]
// 业务层禁止直接使用 JDBC，所有数据库访问必须走 jOOQ DSL（确保 DataScopeExecuteListener 生效）
public static final ArchRule NO_JDBC_TEMPLATE_IN_BUSINESS = noClasses()
    .that().resideInAnyPackage("com.metabuild.platform..", "com.metabuild.business..")
    .should().dependOnClassesThat().haveFullyQualifiedName("org.springframework.jdbc.core.JdbcTemplate")
    .orShould().dependOnClassesThat().haveFullyQualifiedName("org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate")
    .because("业务层所有数据库访问必须走 jOOQ DSL，确保 DataScopeExecuteListener 数据权限拦截生效。直连 JDBC 会绕过数据权限。");
```

---

## 7. N3 精化规则：DSLContext 隔离 [M4]

> N3 对原 `DOMAIN_MUST_NOT_USE_JOOQ` 的精化：用两条更精确的规则替代，完整表达"jOOQ DSL 查询只在 Repository 里写"的意图。`SERVICE_JOOQ_WHITELIST` 用白名单而非黑名单——允许 Service 使用 Record/Result 数据载体，拒绝 DSLContext / DSL 等查询构建 API。

```java
// infra-archunit/src/main/java/com/metabuild/infra/archunit/rules/JooqIsolationRule.java

/**
 * DSLContext 只能作为 Repository 的字段，Service / Controller 不能持有。
 * 替代原 DOMAIN_MUST_NOT_USE_JOOQ 规则，更精确地表达"jOOQ DSL 查询只在 Repository 里写"的意图。
 */
@ArchTest
static final ArchRule DSLCONTEXT_ONLY_IN_REPOSITORY = fields()
    .that().haveRawType(org.jooq.DSLContext.class)
    .should().beDeclaredInClassesThat()
    .areAnnotatedWith(org.springframework.stereotype.Repository.class)
    .because("DSLContext 只能作为 Repository 字段，Service/Controller 禁止持有（N3 §4.2）");

/**
 * SERVICE_JOOQ_WHITELIST [M4]
 * Service 对 org.jooq 的依赖仅限 Record/Result 白名单（MUST）。
 * 白名单：Record 及子接口、Result、exception。
 * 其余 org.jooq.*（DSLContext / DSL / Field / Condition / 各种 Step）一律禁止。
 */
@ArchTest
static final ArchRule SERVICE_JOOQ_WHITELIST = classes()
    .that().resideInAnyPackage("..platform..", "..business..")
    .and().areAnnotatedWith(org.springframework.stereotype.Service.class)
    .should(onlyDependOnJooqDataCarriers());

private static ArchCondition<JavaClass> onlyDependOnJooqDataCarriers() {
    return new ArchCondition<>("only depend on jOOQ data carriers (Record/Result)") {
        @Override
        public void check(JavaClass item, ConditionEvents events) {
            item.getDirectDependenciesFromSelf().stream()
                .map(Dependency::getTargetClass)
                .filter(t -> t.getPackageName().startsWith("org.jooq"))
                .filter(t -> !isAllowed(t.getName()))
                .forEach(t -> events.add(SimpleConditionEvent.violated(item,
                    item.getSimpleName() + " 依赖了禁止的 jOOQ 类型: " + t.getName())));
        }

        private boolean isAllowed(String name) {
            if (name.startsWith("org.jooq.Record")) return true;  // Record, Record1-22
            if (name.equals("org.jooq.UpdatableRecord")) return true;
            if (name.equals("org.jooq.TableRecord")) return true;
            if (name.equals("org.jooq.Result")) return true;
            if (name.startsWith("org.jooq.exception.")) return true;
            return false;
        }
    };
}
```

**与原规则的关系**：
- `DOMAIN_MUST_NOT_USE_JOOQ`（M1）：包级规则，`..domain..` 包不能依赖 `org.jooq..`。M1 阶段保留，作为粗粒度防线
- `DSLCONTEXT_ONLY_IN_REPOSITORY`（M4）：字段级规则，更精确——允许 Repository 的字段是 DSLContext，禁止 Service/Controller 字段是 DSLContext
- `SERVICE_JOOQ_WHITELIST`（M4）：白名单规则，Service 对 org.jooq 的依赖仅限 Record/Result/exception；DSLContext / DSL / Field / Condition 等 DSL 类一律禁止

---

## 8. 编码风格契约 [M4]

> **关注点**：Java 21 + Spring Boot 3.x + Lombok 的编码风格硬规则，通过 ArchUnit 规则和 code review 强制。
>
> **定位**：给 AI 和使用者一份明确的"do/don't"清单，避免 M4 落地时各业务模块风格不一。

### 8.1 DTO / Vo / Cmd / Qry / Event 必须用 `record`

**规则**：所有 API 边界的数据类（`*Vo` / `*Cmd` / `*Qry` / `*Event`）必须用 Java `record` 定义，禁用 Lombok `@Data` / `@Value` / `@Getter` + `@Setter` 组合。

**理由**：
- Spring Boot 3.x 对 record 是一等公民（Jackson / Jakarta Validation / @ConfigurationProperties 原生支持）
- record 天然不可变，线程安全
- 代码量少（`public record UserVo(Long id, String username) {}` vs 30+ 行传统 class）
- 2024+ 主流做法

**示例**：

```java
// ✅ 正确
public record UserVo(Long id, String username, String email, OffsetDateTime createdAt) {
    public static UserVo from(UserRecord record) {
        return new UserVo(record.getId(), record.getUsername(), record.getEmail(), record.getCreatedAt());
    }
}

// ❌ 错误：Lombok @Data 定义 DTO
@Data
public class UserVo {
    private Long id;
    private String username;
    // ...
}
```

**例外**：`@ConfigurationProperties` 类也用 record（已在 [09-config-management.md §9.4.2](09-config-management.md) 定下）。

### 8.2 Service / Repository / Controller 用 `@RequiredArgsConstructor` 构造器注入

**规则**：所有 Spring Bean（`@Service` / `@Repository` / `@Controller` / `@Component`）用 Lombok `@RequiredArgsConstructor` + `final` 字段做构造器注入，禁用 `@Autowired` 字段注入。

**ArchUnit 规则**（已存在，本章 §4）：

```java
@ArchTest
static final ArchRule NO_FIELD_INJECTION =
    GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;
```

**示例**：

```java
// ✅ 正确
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
}

// ❌ 错误：字段注入
@Service
public class UserService {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
}
```

### 8.3 实体 → DTO 映射手写 `from()` 静态方法，不引入 MapStruct

**规则**：实体（`UserRecord`）到 DTO（`UserVo`）的映射通过 DTO record 里的 `public static <DTO> from(<Entity>)` 静态工厂方法手写。v1 **禁用** MapStruct / ModelMapper。

**ArchUnit 规则**：

```java
@ArchTest
static final ArchRule NO_MAPSTRUCT = noClasses()
    .that().resideInAPackage("com.metabuild..")
    .should().dependOnClassesThat()
    .resideInAnyPackage("org.mapstruct..", "org.modelmapper..")
    .because("v1 禁用 MapStruct / ModelMapper，手写 record.from() 静态工厂（C2）");
```

**理由**：
- meta-build DTO 用 record，简单映射手写 `from()` 更直白（`return new UserVo(record.getId(), ...)`）
- MapStruct 的 annotation processor 增加 build 时间，随 mapper 数量显著变慢
- AI 生成手写 `from()` 错误率比 MapStruct 注解低
- M5 canonical reference 写完后有实战数据再评估 MapStruct（v1.5+）

**示例**见 §8.1 的 `UserVo.from()`。

### 8.4 virtual thread 默认关闭

**规则**：`application.yml` 硬设 `spring.threads.virtual.enabled=false`，v1 不启用 virtual thread。

**理由**（2026 年 4 月调研事实）：
- Java 21 virtual thread 在 `synchronized` 块内会被 pin 到 carrier thread，丧失优势
- Spring Framework 自己的 `AbstractJdbcCall.compile()` 用 synchronized，触发 pinning + 死锁（活跃 issue 未修复）
- Spring Boot 3.4.0 退化：WebMVC + virtual thread + lazy init 访问 `/actuator/health` 触发 pin（3.3.6 → 3.4.0 的回退）
- 第三方库（JDBC 驱动 / Sentry Java / etc）的 synchronized 是隐藏雷
- 极端并发测试：virtual thread 错误率 23-30%（高于平台线程）
- Java 24 改善部分场景但**没完全解决 pinning 问题**

**评估时机**：M4 末对 meta-build 跑性能压测，pinning 审计全绿 + 有明确收益时 v1.5 可开启。

**不是"保守不追新"**，而是"不追尚未成熟的特性"。盲目开 virtual thread 本身是补丁式追新。

### 8.5 `Optional` 只作返回值

**规则**：`Optional<T>` **只能**作为方法返回值，**禁止**作为：
- 字段类型（`private Optional<User> currentUser;` ← 禁）
- 方法参数（`void setName(Optional<String> name)` ← 禁）
- 集合元素（`List<Optional<User>>` ← 禁）

**ArchUnit 规则**：

```java
@ArchTest
static final ArchRule OPTIONAL_ONLY_RETURN = noFields()
    .should().haveRawType(java.util.Optional.class)
    .because("Optional 只能作返回值，禁作字段类型（Brian Goetz 设计意图）");

@ArchTest
static final ArchRule NO_OPTIONAL_PARAMETERS = noMethods()
    .should().haveRawParameterTypes(java.util.Optional.class)
    .because("Optional 禁作方法参数");
```

**理由**：
- Java 语言架构师 Brian Goetz 原话：Optional 设计时**仅用于方法返回值**
- `Optional` 不实现 `Serializable`，作为字段类型会导致序列化失败
- 作为参数违反简洁性（应该用方法重载或 `@Nullable` 替代）

### 8.6 sealed class / pattern matching 不用，状态用 `enum`

**规则**：v1 **不使用** sealed class / sealed interface。所有业务状态（订单状态 / 审批状态 / 用户状态）用 Java `enum`。

**理由**：
- enum 是 Java 生态一等公民，IDE 支持最好，AI 生成代码准确率最高
- sealed class + pattern matching 是 Java 17+ 新特性，社区尚未完全吸收
- v1 优先选择"最成熟"的答案

**示例**：

```java
// ✅ 正确
public enum OrderStatus {
    DRAFT,
    SUBMITTED,
    APPROVED,
    REJECTED,
    CANCELLED
}

// ❌ 错误（v1 禁用）：sealed interface
// public sealed interface OrderStatus permits OrderStatus.Draft, OrderStatus.Submitted, ... {}
```

**如果业务状态需要携带不同数据**（DDD 纯粹派会用 sealed），meta-build v1 的做法是：
- 状态本身用 enum
- 额外数据单独存字段（如 `cancelReason` 存在订单表上，`OrderStatus = CANCELLED` 时才有意义）

v1.5+ 可以评估 sealed class，v1 不用。

### 8.7 `@Nullable` 统一用 `jakarta.annotation.Nullable`

**规则**：需要标记"可能为 null"的字段/参数/返回值时，统一用 `jakarta.annotation.Nullable`。**禁用**以下其他注解（v1）：
- ❌ `javax.annotation.Nullable`（JSR-305 废弃草案）
- ❌ `org.jetbrains.annotations.Nullable`
- ❌ `org.checkerframework.checker.nullness.qual.Nullable`
- ❌ `org.jspecify.annotations.Nullable`（业界正在收敛但 v1 不赶先）

**ArchUnit 规则**：

```java
@ArchTest
static final ArchRule ONLY_JAKARTA_NULLABLE = noClasses()
    .that().resideInAPackage("com.metabuild..")
    .should().dependOnClassesThat()
    .haveFullyQualifiedName("javax.annotation.Nullable")
    .because("统一用 jakarta.annotation.Nullable，禁止 javax.annotation.Nullable 等竞品（C2）");
```

**理由**：
- Spring Boot 3.x **原生依赖** `jakarta.annotation-api`，不需要额外加依赖
- v1.5+ 跟随 Spring Framework 6.2+ 迁移到 JSpecify（业界趋势）

### 8.8 `Clock` Bean 统一时间获取（编码建议） [M4]

**本节为编码建议，不通过 ArchUnit 硬约束。** 通过 `Clock` Bean 工具类 + canonical reference 模板代码示范引导。

**建议**：业务代码通过注入 `Clock` Bean 后使用带 Clock 参数的重载获取时间，避免直接调用无参时间获取方法。SQL 层统一用 `CURRENT_TIMESTAMP`（由数据库填充，不在 Java 代码里生成时间）。

**正确用法示例**：

```java
// ✅ 生产代码：注入 Clock Bean
@Service
@RequiredArgsConstructor
public class SomeService {
    private final Clock clock;  // Bean 注入，生产用 Clock.systemUTC()

    public void doSomething() {
        Instant now = Instant.now(clock);  // ← 带 Clock 参数
    }
}

// ✅ 测试代码：Clock.fixed 让时间可控
@SpringBootTest
class SomeServiceTest {
    @TestConfiguration
    static class TestConfig {
        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2026-04-12T10:00:00Z"), ZoneOffset.UTC);
        }
    }
}

// ✅ SQL 层：用数据库函数，不在 Java 层生成时间
-- created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

// ❌ 不推荐：无参时间调用（测试不可控）
Instant.now()           // 不推荐
OffsetDateTime.now()    // 不推荐
LocalDateTime.now()     // 不推荐
new Date()              // 不推荐
```

**理由**：
- 无参调用隐式用系统时钟，测试不可控（无法冻结时间、模拟未来/过去）
- `Clock` Bean 是 Spring 官方推荐的可测试时间模式
- 统一入口后，未来切换时区策略只改一处

**例外**：`infra-*` 模块内部的基础设施初始化代码（如 Micrometer 计时）可以直接用无参调用。

### 8.9 次要规范（文档推荐，不做硬规则）

以下是推荐做法，不通过 ArchUnit 强制，由 code review 守护：

- **`List.of()` / `Map.of()`** 优先于 `Arrays.asList` / `new HashMap`（Java 9+ 不可变工厂方法）
- **`var` 类型推断**在方法内部局部变量可用，公开 API（方法返回值 / 参数）推荐显式类型
- **Text blocks**（`"""`）推荐用于多行字符串（SQL / JSON 字符串 / 模板）
- **方法引用** `UserVo::from` 优先于等价 lambda `r -> UserVo.from(r)`
- **Stream API** 推荐用于集合转换（`stream().map().toList()`），传统 for 循环用于有副作用的场景

### 8.10 M4 实施 checklist

每个业务模块 M4 落地时应该通过以下自检：

- [ ] 所有 DTO（Vo/Cmd/Qry/Event）都是 record
- [ ] Service / Repository / Controller 用 `@RequiredArgsConstructor`，无 `@Autowired` 字段
- [ ] 实体映射用 `XxxVo.from(record)`，无 MapStruct 依赖
- [ ] `application.yml` 未开启 `spring.threads.virtual.enabled`
- [ ] `Optional` 只在方法返回值出现，无字段/参数
- [ ] 所有状态字段用 enum，无 sealed class
- [ ] 所有 `@Nullable` 注解是 `jakarta.annotation.Nullable`
- [ ] 时间获取推荐通过注入 `Clock` Bean + `Instant.now(clock)`（编码建议，非硬规则）
- [ ] `mvn verify` 通过（含 ArchUnit 测试）

---

## 9. 反面教材清单（15 条 + 1 元方法论） [M0]

> 这些是 nxboot 已经踩过的坑，**meta-build 从第一天起用工具拦截**，让错误在编译/测试阶段暴露。每条都有对应的防御机制 + 可执行验证。

| # | 反面教材 | 防御机制 | 文档位置 | 验证方式 |
|---|---------|---------|-----------|---------|
| 1 | **文档-代码 drift**（nxboot CLAUDE.md 描述 7 个 shared/components 在磁盘是空目录） | 每章 verify 块可执行 + CLAUDE.md 索引式（与代码同步演进） | 全文 | 每章末尾 `<!-- verify: -->` |
| 2 | **反 opt-in 安全模式**（DataScope 忘加注解就静默泄漏） | **方案 E：`DataScopeExecuteListener` 在 jOOQ SQL 构建层单点拦截（零 Repository 基类）**+ `DataScopeRegistry` 集中声明受保护表 + `@BypassDataScope` 显式跳过 + `NO_RAW_SQL_FETCH` ArchUnit 兜底 | [05-security.md §7](./05-security.md) | `UserRepositoryDataScopeTest` + `NO_RAW_SQL_FETCH` 规则 |
| 3 | **反 jOOQ 泄漏到 Service**（nxboot 50 个文件 import org.jooq） | ArchUnit `DOMAIN_MUST_NOT_USE_JOOQ` | [04-data-persistence.md §7](./04-data-persistence.md) | `JooqIsolationTest` |
| 4 | **反全量缓存失效**（`@CacheEvict(allEntries=true)` 规模上去形同虚设） | ArchUnit `NO_EVICT_ALL_ENTRIES` + grep 校验 | [04-data-persistence.md §11](./04-data-persistence.md) | `mvn test + grep` |
| 5 | **反继承惯性从 nxboot 搬 `DataScopedRepository` 基类**（MyBatis-Plus 习惯带到 jOOQ，隐式全局 `DataScopeContext` ThreadLocal，异步丢失 + AI 追父类心智负担） | **方案 E 整体砍掉基类和 `DataScopeContext`**；数据权限通过 `CurrentUser`（来自 Sa-Token session 单一数据源）+ `DataScopeExecuteListener` 实现，整个项目只剩 Sa-Token 一个 ThreadLocal 需要在 `AsyncConfig` 传递 | [05-security.md §7](./05-security.md) / [ADR-0007](../adr/0007-继承遗产前先问原生哲学.md) | 代码搜索 `extends DataScopedRepository` / `DataScopeContext` 应全为 0 |
| 6 | **反 R<T> 200 OK 包装**（破坏 HTTP 语义，监控/CDN 失效） | 错误一律 4xx/5xx + ProblemDetail + ArchUnit 校验 Controller 返回类型 | [06-api-and-contract.md §3](./06-api-and-contract.md) | `ResponseFormatTest` |
| 7 | **反硬编码敏感配置**（密钥默认值写在代码里） | env var 无默认值，缺失启动失败 + `@ConfigurationProperties` 校验 | [05-security.md §4](./05-security.md) / [09-config-management.md §9.6](./09-config-management.md) | `ConfigValidationTest` |
| 8 | **反跨模块穿透 Repository**（RoleService 直接读 menu 表） | Maven pom 白名单 + ArchUnit `CROSS_PLATFORM_ONLY_VIA_API`（ADR-0003） | [01-module-structure.md §3](./01-module-structure.md) | `ModuleBoundaryTest` |
| 9 | **反时区混乱**（LocalDateTime 出现在 API 边界） | ArchUnit `NO_LOCALDATETIME_IN_API` + Jackson UTC 配置 | [04-data-persistence.md §12](./04-data-persistence.md) | `TimezoneRuleTest` |
| 10 | **反 Controller 直接注入 Repository** | ArchUnit `CONTROLLER_NO_DIRECT_REPOSITORY` | 本章 §4 | `ControllerBoundaryTest` |
| 11 | **反 @Autowired 字段注入** | `GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION` | 本章 §4 | `InjectionStyleTest` |
| 12 | **反 CLAUDE.md 全细节**（nxboot CLAUDE.md 19KB 单文件，drift 一次全毁） | CLAUDE.md 索引式，细节下放 specs/adr | `CLAUDE.md` 骨架 | 人工审查 |
| 13 | **反认证框架耦合业务层**（Spring Security / Sa-Token 的 API 散落在 Service / Controller） | `CurrentUser` 门面 + ArchUnit `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN`（ADR-0005） | [05-security.md §6](./05-security.md) | `SaTokenIsolationTest` |
| 14 | **反 jOOQ 生成代码放在基础设施层**（语义错配） | 独立 `mb-schema` 数据库契约层（ADR-0004） | [01-module-structure.md §1](./01-module-structure.md) / [04-data-persistence.md §6](./04-data-persistence.md) | Maven 依赖检查 |
| 15 | **反 Service 方法抛 checked Exception**（Spring 默认不回滚） | 业务异常继承 `RuntimeException`；约定 Service 不抛 checked | [04-data-persistence.md §8](./04-data-persistence.md) | 代码 review |

---

[← 返回 README](./README.md)
