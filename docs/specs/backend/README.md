# Meta-Build 后端设计

> **后端设计的唯一入口**。CLAUDE.md 只索引本文件；本文件再二级分发到 9 个子文档。
>
> 任何后端设计的细节调整都先改子文件，反向索引在本文件吸收变化，CLAUDE.md 保持零感知。

---

## 一句话定位

meta-build 后端 = **给 AI 执行的不可动摇的契约**。架构边界、代码约束、行为验证由 **Maven 依赖隔离 + ArchUnit 规则集 + Testcontainers 集成测试** 三层守护，让 AI 越界即编译失败或测试失败。

业务层（`platform` / `business` / `schema`）零感知基础设施细节——不直接依赖认证框架（Sa-Token），不直接写原始 SQL（通过 jOOQ DSL），不绕过缓存失效机制。所有外部技术细节通过**公共抽象接口**（`CurrentUser` / `AuthFacade` 在 `mb-common.security`，`CacheEvictSupport` 在 `infra-cache`）隔离；数据权限通过 **`DataScopeVisitListener` 在 jOOQ SQL 构建层单点拦截**（方案 E，零继承），Repository 写起来是普通类。

---

## 子文档导航

| 文件 | 关注点 | 何时读 |
|------|-------|-------|
| [01-module-structure.md](./01-module-structure.md) | 6 层 Maven + 模块边界守护 + 跨模块访问规则 | 设计模块 / 加新业务域 / 排查依赖问题 |
| [02-infra-modules.md](./02-infra-modules.md) | 10 个 `mb-infra` 子模块清单 | 用基础设施能力 / 加新基础设施 |
| [03-platform-modules.md](./03-platform-modules.md) | 8 个 `mb-platform` 平台模块 + ★ **新增业务模块 12 步清单** | **写新业务模块（最常用）** |
| [04-data-persistence.md](./04-data-persistence.md) | 数据访问 / Flyway / jOOQ codegen / 事务 / 缓存 / 时区 | 写 Repository / 设计表 / 调缓存 |
| [05-security.md](./05-security.md) | Sa-Token + CurrentUser + AuthFacade + @RequirePermission + **方案 E 数据权限** | 写认证 / 权限 / 数据权限 |
| [06-api-and-contract.md](./06-api-and-contract.md) | ProblemDetail 异常响应 + i18n + 契约驱动 OpenAPI | 写 Controller / 暴露 API / 错误码 |
| [07-observability-testing.md](./07-observability-testing.md) | Actuator/Logback/Micrometer + 测试金字塔 | 加监控 / 写测试 |
| [08-archunit-rules.md](./08-archunit-rules.md) | ArchUnit 规则集 + 反面教材索引 | 加新规则 / 看反面教材 |
| [09-config-management.md](./09-config-management.md) | ★ 配置管理：前缀策略 / env var 清单 / profile 分层 / `@ConfigurationProperties` 规范 / fail-fast 启动校验 / 敏感配置处理 | **M1 写 `application.yml` 时**（必读）/ 加新配置项 |
| [appendix.md](./appendix.md) | 借用清单 / 模块 M1/M4 实施清单 / 推迟章节 / 术语表 | 查 nxboot 借用 / 查术语 |

---

## 17 项决策回顾

本章节只列决策结论，决策背景与权衡见规划文档 `meta-build规划_v1_最终对齐.md` 的对应章节。

| # | 决策 | 结论 | 相关 ADR |
|---|------|------|---------|
| 1 | 项目名 | meta-build / 元构，Maven 前缀 `mb-` | — |
| 2 | 项目结构 | 嵌套 monorepo（client/server 分离），后端 **6 层 Maven**（common/schema/infra/platform/business/admin） | ADR-0002 / ADR-0004 |
| 4 | 认证框架 | **Sa-Token 1.39.x + `CurrentUser`（读）/ `AuthFacade`（写）双门面 + `@RequirePermission` 自定义注解**；数据权限走方案 E | ADR-0005 / ADR-0007 |
| 7 | 后端框架 | Spring Boot 3.5.13（JDK 21 LTS） | — |
| 8 | 后端模块化 | **Maven 模块隔离 + ArchUnit 双保险**（已移除 Spring Modulith） | ADR-0003 |
| 9 | 数据访问 | jOOQ 3.19+ + PostgreSQL 16 + Flyway 10+；Flyway SQL 和 jOOQ 生成代码都在 **mb-schema 契约层** | ADR-0004 |
| 10 | 基础设施 | 10 个 `mb-infra` 子模块 | ADR-0002 |
| 11 | 业务模块 | 8 个 `mb-platform` 平台模块 + `mb-business` 作为使用者扩展位和 M5 canonical reference 容纳地 | ADR-0004 |
| 12 | 契约驱动 | springdoc → OpenAPI 3.1 → @mb/api-sdk（TypeScript client） | — |
| 14 | Spec 引擎 | 推迟到 v1.5，基于 M5 canonical reference 反向提炼 | ADR-0006 |
| 15 | ai-core | 推迟到 v1 之后 | — |
| 16 | 多租户 | v1 预留 `tenant_id` 字段，完整实现推迟（ADR-007） | — |

---

## 文档边界

| 其他文档 | 关系 |
|---------|-----|
| `frontend-architecture.md` | 通过契约驱动（@mb/api-sdk）与本文档解耦，互不依赖 |
| `CLAUDE.md` | 索引式结构，指向本文档相关章节，不重复细节 |
| `docs/adr/` | 本文档不写"为什么"，决策原因和历史背景都在 ADR 里 |
| `规划文档_v1_最终对齐.md` | ground truth 基线，本文档是它的"后端实施展开版" |

---

## 6 层 Maven 模块全景

```
server/
├── mb-common/          # 零 Spring 依赖，纯工具 + 公共抽象（CurrentUser / DataScope / PageResult / MetaBuildException 等）
├── mb-schema/          # 数据库契约层（Flyway SQL + jOOQ 生成代码）★ ADR-0004
├── mb-infra/           # 基础设施层（10 个子模块 pom parent）
├── mb-platform/        # 平台业务层（8 个平台模块 pom parent）
├── mb-business/        # 使用者扩展位 + M5 canonical reference ★ ADR-0004
├── mb-admin/           # Spring Boot 启动入口 + Flyway runtime + 集成测试 + ArchUnit 测试
└── pom.xml
```

**依赖方向（严格单向，不可反转）**：

```
mb-common → mb-schema → mb-infra → mb-platform → mb-business → mb-admin
```

详细模块边界 / 包命名 / 目录树见 [01-module-structure.md](./01-module-structure.md)。

---

## 阅读路径（按角色）

| 我是谁，要做什么 | 建议章节顺序 |
|---------------|-----|
| **AI，要写新业务模块** | README → [03-platform-modules.md §5 12 步清单](./03-platform-modules.md) → [05-security.md](./05-security.md) → [04-data-persistence.md](./04-data-persistence.md) → [06-api-and-contract.md](./06-api-and-contract.md) → [06-api-and-contract.md §12 分页契约](./06-api-and-contract.md) |
| **AI，要修架构 bug** | README → [08-archunit-rules.md](./08-archunit-rules.md)（看规则） → 对应子文档 |
| **M1 脚手架实施者** | README → [01-module-structure.md](./01-module-structure.md) → [02-infra-modules.md](./02-infra-modules.md) → [09-config-management.md](./09-config-management.md)（**写 application.yml 必读**）→ [04-data-persistence.md](./04-data-persistence.md) → [appendix.md B](./appendix.md) |
| **M4 后端底座实施者** | README → [03-platform-modules.md](./03-platform-modules.md) → [05-security.md](./05-security.md) → [06-api-and-contract.md](./06-api-and-contract.md) → [07-observability-testing.md](./07-observability-testing.md) |
| **回顾决策原因** | README 决策回顾表 → [ADR 索引](#adr-索引)（7 份） → 规划文档 |
| **新增业务表** | [03-platform-modules.md §5 步骤 10.1](./03-platform-modules.md) → [05-security.md §7 方案 E 注册](./05-security.md) |

---

## 后端硬约束反向索引

> **CLAUDE.md 只引用本节**。后端所有 MUST NOT / MUST 的具体规则、防御机制、子文档位置都在这里集中维护。
> 拆分后子文件结构变化时，**只改本节**，CLAUDE.md 零感知。

### MUST NOT 速查（17 条 + 1 条元方法论）

| # | 禁止 | 防御机制 | 详见 |
|---|------|---------|------|
| 1 | 跨 `mb-platform` 模块直接 import 对方的 `domain` / `web` 包 | Maven pom 白名单 + ArchUnit `CROSS_PLATFORM_ONLY_VIA_API` | [01-module-structure.md §3 跨模块访问的反模式修复](./01-module-structure.md#3-跨模块访问的反模式修复-m1m4) |
| 2 | Service / Controller 持有 `DSLContext` 字段（允许 `import com.metabuild.schema.tables.records.*` Record 数据类型）| ArchUnit `DSLCONTEXT_ONLY_IN_REPOSITORY`（N3 精化了原 `DOMAIN_MUST_NOT_USE_JOOQ`）| [04-data-persistence.md §7 jOOQ 不入 Service 层](./04-data-persistence.md#7-jooq-不入-service-层-m1m4) + [08-archunit-rules.md §6 N3 精化规则](./08-archunit-rules.md) |
| 3 | 业务层（`platform` / `business`）`import cn.dev33.satoken.*` | ArchUnit `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN` | [05-security.md §6 CurrentUser 门面层](./05-security.md#6-currentuser-门面层设计adr-0005) |
| 4 | `@CacheEvict(allEntries = true)` | ArchUnit `NO_EVICT_ALL_ENTRIES` | [04-data-persistence.md §11 缓存 key 级失效](./04-data-persistence.md#11-缓存-key-级失效禁用-allentriestrue-m4) |
| 5 | Controller 用 Spring `@PreAuthorize`（必须用自定义 `@RequirePermission`），或把 `@RequirePermission` 放 Service 层（**必须**放 Controller 层）| 代码约定 + 示例强制 | [05-security.md §2.5 @RequirePermission 位置规范](./05-security.md#25-requirepermission-位置规范n3-修订) |
| 6 | `api` 包使用 `LocalDateTime`（必须用 `Instant`） | ArchUnit `NO_LOCALDATETIME_IN_API` | [04-data-persistence.md §12 时区规范](./04-data-persistence.md#12-时区规范-m1) |
| 7 | `@Autowired` 字段注入 | ArchUnit `GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION` | [08-archunit-rules.md §4 编码规范规则](./08-archunit-rules.md#4-controller--依赖注入--编码规范规则-m4) |
| 8 | Controller / Repository 使用 `@Transactional`（只允许 Service 层） | ArchUnit `TRANSACTIONAL_ONLY_IN_SERVICE` | [04-data-persistence.md §8 事务边界规范](./04-data-persistence.md#8-事务边界规范-m4) |
| 9 | 响应用 `R<T>{code, msg, data}` 包装（必须用 `ProblemDetail` + `PageResult` + 直接返回） | 代码 review + ArchUnit | [06-api-and-contract.md §3 响应格式混合方案](./06-api-and-contract.md#3-响应格式混合方案-m4) |
| 10 | `mb-common` 依赖 Spring / jOOQ / JJWT / Sa-Token | Maven 依赖检查 | [01-module-structure.md §1.5 单向依赖硬约束](./01-module-structure.md#15-单向依赖硬约束) |
| 11 | `mb-schema` 依赖任何 `mb-*` 模块（只能依赖 `org.jooq` runtime） | Maven 依赖检查 | [01-module-structure.md §1.5 单向依赖硬约束](./01-module-structure.md#15-单向依赖硬约束) |
| 12 | 业务异常抛 checked Exception（必须继承 `RuntimeException`） | 代码约定 | [04-data-persistence.md §8 事务边界规范（回滚规则）](./04-data-persistence.md#8-事务边界规范-m4) |
| 13 | 业务层使用 jOOQ `@PlainSQL` 字符串 SQL API（`dsl.fetch(String)` 等，会绕过 `DataScopeVisitListener` 数据权限拦截） | ArchUnit `NO_RAW_SQL_FETCH` | [05-security.md §7.9 ArchUnit 规则 NO_RAW_SQL_FETCH](./05-security.md#79-archunit-规则-no_raw_sql_fetch) |
| 14 | jOOQ 生成代码放在 `mb-infra` 或业务层(必须在 `mb-schema/src/main/jooq-generated/`) | 约定 + codegen profile 配置 | [04-data-persistence.md §6 jOOQ 代码生成流程](./04-data-persistence.md#6-jooq-代码生成流程-m1m4) |
| 15 | 硬编码敏感配置 / 用 `@Value` 注入 / 含敏感字段的 `record` 未覆盖 `toString()`（必须全部通过 `@ConfigurationProperties` + `@Validated` + env var） | ArchUnit `NO_AT_VALUE_ANNOTATION` / `PROPERTIES_MUST_BE_VALIDATED` / `SENSITIVE_RECORDS_MUST_OVERRIDE_TOSTRING` + 启动失败兜底（§9.5）| [09-config-management.md §9.5 fail-fast 启动校验](./09-config-management.md#95-fail-fast-启动校验) + [§9.6 敏感配置处理](./09-config-management.md#96-敏感配置处理) |
| 16 | 业务层直接调用 `StpUtil.login()` / `logout()` / `kickout()` 等 Sa-Token 写 API（必须通过 `AuthFacade` 门面） | ArchUnit `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN` + `ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN` | [05-security.md §6.6 AuthFacade 登录登出技术门面](./05-security.md#66-authfacade登录登出技术门面) |
| 17 | `Optional<T>` 作为字段类型 / 方法参数 / 集合元素（只能作为返回值）| ArchUnit `OPTIONAL_ONLY_RETURN` + `NO_OPTIONAL_PARAMETERS`（C2）| [08-archunit-rules.md §7.5](./08-archunit-rules.md) |
| **元** | **从 nxboot（或任何遗产项目）借用组件时，未先挑战新技术栈的原生范式**（继承惯性把 MyBatis-Plus 的基类范式带到 jOOQ 世界） | ADR-0007 元方法论 + 借用清单审查流程 | [ADR-0007 继承遗产前先问原生哲学](../../adr/0007-继承遗产前先问原生哲学.md) + [appendix.md 附录 A 借用清单](./appendix.md#附录-a-从-nxboot-借用的组件清单) |

### MUST 速查（15 条）

| # | 必须 | 详见 |
|---|------|------|
| 1 | Controller 每个方法显式声明 `@RequirePermission(...)` 或 `@PermitAll` | [05-security.md §2 权限模型](./05-security.md#2-权限模型currentuser--requirepermission) |
| 2 | Service 层**只能**通过 `CurrentUser` 门面访问当前用户；登录/登出/强制注销等认证写操作**只能**通过 `AuthFacade` 门面 | [05-security.md §6 CurrentUser 门面层](./05-security.md#6-currentuser-门面层设计adr-0005) + [§6.6 AuthFacade](./05-security.md#66-authfacade登录登出技术门面) |
| 3 | 所有表必须有 `tenant_id / created_by / created_at / updated_by / updated_at` 字段；`version` 字段按需添加（仅需要乐观锁的表）| [04-data-persistence.md §1 表/字段命名规范](./04-data-persistence.md#1-表字段命名规范-m1m4) |
| 4 | 跨模块异步通信用 `@EventListener` + `@Async` + `@TransactionalEventListener(AFTER_COMMIT)` | [01-module-structure.md §2.4 跨模块通信 Spring 原生事件机制](./01-module-structure.md#24-跨模块通信spring-原生事件机制) |
| 5 | 操作日志用 `@OperationLog` 注解 + AOP 自动写入 `mb_operation_log` | [03-platform-modules.md §2.3 platform-oplog 的具体实现](./03-platform-modules.md#23-platform-oplog-的具体实现p0) |
| 6 | 定时任务用 `@Scheduled` + `@SchedulerLock`（ShedLock 分布式锁） | [03-platform-modules.md §2.1 platform-job 的具体技术选择](./03-platform-modules.md#21-platform-job-的具体技术选择p0) |
| 7 | 跨模块依赖**必须**在 pom.xml 里显式声明（PR review 可见） | [01-module-structure.md §2.3 跨模块访问规则](./01-module-structure.md#23-跨模块访问规则) |
| 8 | Flyway migration 文件放在 `mb-schema/src/main/resources/db/migration/`，命名用时间戳 `V<yyyymmdd>_<nnn>__<module>_<table>.sql`（ADR-0008） | [04-data-persistence.md §5 Flyway 脚本组织](./04-data-persistence.md#5-flyway-脚本组织-m1m4) + [ADR-0008](../../adr/0008-flyway-migration命名用时间戳.md) |
| 9 | jOOQ codegen 生成的代码放在 `mb-schema/src/main/jooq-generated/` 并入 git | [04-data-persistence.md §6 jOOQ 代码生成流程](./04-data-persistence.md#6-jooq-代码生成流程-m1m4) |
| 10 | ArchUnit 测试集中放在 `mb-admin/src/test/java/com/metabuild/architecture/` | [08-archunit-rules.md §5 测试基类 ArchitectureTest](./08-archunit-rules.md#5-测试基类-architecturetest-m1m4) |
| 11 | 新增业务表**必须**在 `DataScopeConfig` 调用 `registry.register(tableName, deptColumn)` 注册到 `DataScopeRegistry`，否则数据权限不会生效（漏注册 = 超权风险） | [05-security.md §7.7 使用者注册受保护表](./05-security.md#77-使用者注册受保护表集中声明) + [03-platform-modules.md §5 步骤 10.1](./03-platform-modules.md#5-新增业务模块的完整操作流程12-步清单-p0) |
| 12 | 所有 API 边界数据类（`*View` / `*Command` / `*Query` / `*Event`）**必须**用 Java `record` 定义，禁用 Lombok `@Data` / `@Value` 定义 DTO（C2）| [08-archunit-rules.md §7.1 DTO / VO / Command / Query / Event 必须用 record](./08-archunit-rules.md) |
| 13 | Service / Repository / Controller **必须**用 Lombok `@RequiredArgsConstructor` + `final` 字段构造器注入（C2）| [08-archunit-rules.md §7.2](./08-archunit-rules.md) |
| 14 | 实体 → DTO 映射**必须**手写 `from()` 静态方法，v1 **禁用** MapStruct / ModelMapper（C2）| [08-archunit-rules.md §7.3](./08-archunit-rules.md) |
| 15 | Service 对 `org.jooq` 的依赖**仅限** `Record` / `Result` / `exception` 白名单（`SERVICE_JOOQ_WHITELIST`）；`DSLContext` / `DSL` / `Field` / `Condition` / 各类 Step 一律禁止（C8）| [08-archunit-rules.md §6 N3 精化规则](./08-archunit-rules.md) |

---

## ADR 索引

| ADR | 主题 | 状态 |
|-----|------|------|
| [0001](../../adr/0001-m0-文档从7份收敛到3份.md) | M0 文档从 7 份收敛到 3 份 | 已采纳 |
| [0002](../../adr/0002-后端模块命名framework改infra-system改platform.md) | 后端 Maven 命名 framework→infra, system→platform | 已采纳 |
| [0003](../../adr/0003-移除spring-modulith保留archunit单保险.md) | **移除 Spring Modulith，改 Maven + ArchUnit 双保险** | 已采纳 |
| [0004](../../adr/0004-新增mb-schema数据库契约层.md) | **新增 mb-schema 数据库契约层**（4 层 → 6 层 Maven） | 已采纳 |
| [0005](../../adr/0005-认证框架切换到sa-token加currentuser门面层.md) | **认证框架切换到 Sa-Token + CurrentUser 门面层** | 已采纳 |
| [0006](../../adr/0006-canonical-reference质量规范.md) | canonical reference 代码质量规范（P0 六维度 + P1 五维度） | 已采纳 |
| [0007](../../adr/0007-继承遗产前先问原生哲学.md) | **继承遗产前先问新技术栈的原生哲学**（元方法论，方案 E 数据权限重构） | 已采纳 |
| [0008](../../adr/0008-flyway-migration命名用时间戳.md) | **Flyway migration 命名从数字分段切换到时间戳**（ADR-0007 元方法论的第二次落地 + "一致性 > 局部优化"次级元原则） | 已采纳 |

---

## 维护约定（防 drift 铁律）

| 场景 | 正确做法 |
|------|---------|
| 改后端架构 | 先改对应子文件 → 必要时回写本 README 的反向索引 → 写新 ADR（如果是决策翻转） |
| 翻转既有决策 | 写新 ADR，**不改规划文档原文**，后续以新 ADR 为准 |
| 加新硬约束 | 在子文件加章节 + ArchUnit 规则 → 在本 README 反向索引补一行（这是 CLAUDE.md 唯一感知点） |
| 新拆/合并子文件 | 改本 README 导航 + 反向索引锚点；**不改 CLAUDE.md** |
| 发现 drift | 立即修正，不允许"等下次一起改"——nxboot 反面教材 |
| 完成 milestone | 子文件回补 `[M1 时补]` / `[M4 时补]` 占位 |

---

## 写法约定（本目录所有子文件遵守）

1. 每章都有 milestone 标签 `[M1]` / `[M4]` / `[M1+M4]`
2. 每章核心段末尾有 `<!-- verify: <command> -->` 可执行验证块
3. 详细代码用 `[M4 时补]` 占位，骨架必须给关键接口签名
4. 不写"将来应该"类虚拟引用，每个被引用的组件必须有真实路径
5. 文档与代码同步演进：每完成一个模块就回补对应章节（避免 nxboot 式 drift）
6. 标题尽量用纯中文 + 数字编号，**避免冒号、斜杠、括号**等会影响 markdown anchor 的字符
