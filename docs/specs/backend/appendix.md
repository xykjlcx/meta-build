# 后端设计附录

> **关注点**：从 nxboot 借用的组件清单 + 每个 Maven 模块的 M1/M4 实施清单 + 推迟章节占位 + 术语表。
>
> **本文件吸收原 backend-architecture.md 附录 A + B + C + D 全部内容**。

## 附录 A: 从 nxboot 借用的组件清单

> **审查原则（ADR-0007 元方法论）**：每一条"从 nxboot 借用 XXX"的决策，都必须经过**三问审查**——
>
> 1. **原生范式来源**：此组件在 nxboot 里基于哪个生态的约定？（MyBatis-Plus / Spring Security / Spring 原生 / HTTP 协议 / etc.）
> 2. **新生态答案**：meta-build 的新技术栈（jOOQ / Sa-Token / Spring Boot 3.x / PostgreSQL）对同一问题的原生答案是什么？
> 3. **改造策略**：直接搬 / 部分借用 / 概念重写 / 彻底放弃 / 全新设计
>
> 如果答案 1 和答案 2 不一致，**优先采用新生态的原生哲学**，而不是无条件继承遗产的实现。
>
> A.1 总表用策略图标快速扫描；**涉及生态差异的条目（🟡/🟠/🔴）在 A.2 展开完整三问分析**；纯工具搬运（🟢）不重复审查。

**策略图标**：

| 图标 | 策略 | 含义 |
|-----|------|------|
| 🟢 | **直接搬** | nxboot 实现本身就是新技术栈的原生范式，仅改包名 |
| 🟡 | **部分借用** | 骨架保留，某些点按新技术栈原生答案调整 |
| 🟠 | **概念重写** | 只借问题定义，代码从零写，走新生态原生范式 |
| 🔴 | **彻底放弃** | 技术栈切换使原组件失去存在理由 |
| ⚪ | **全新设计** | nxboot 没有此项，按 meta-build 新生态原生答案从零写 |

### A.1 借用清单总表

| # | 组件 | 策略 | 改造要点 | meta-build 落地位置 |
|---|------|:---:|--------|---------------------|
| 1 | `BaseIntegrationTest` | 🟢 | 改用 `SharedPostgresContainer.INSTANCE` + `@ActiveProfiles("test")` | `mb-admin/src/test/java/com/metabuild/admin/BaseIntegrationTest.java` |
| 2 | ~~`TestHelper`~~ | 🔴 | 生态切换（Spring Security → Sa-Token 门面）→ `MockCurrentUser` + `TestSecurityConfig`，见 [A.2.1](#a21) | `mb-admin/src/test/java/com/metabuild/MockCurrentUser.java` |
| 3 | `CacheEvictSupport` | 🟢 | 包名改即可 | `mb-infra/infra-cache/.../CacheEvictSupport.java` |
| 4 | `SlowQueryListener` | 🟢 | 阈值参数化（`@ConfigurationProperties` 默认 500ms） | `mb-infra/infra-jooq/.../SlowQueryListener.java` |
| 5 | `AsyncConfig` | 🟡 | ThreadLocal 传递列表替换（Spring Security → Sa-Token，方案 E 后**不再传 `DataScopeContext`**），见 [A.2.2](#a22) | `mb-infra/infra-async/.../AsyncConfig.java` |
| 6 | `RateLimitInterceptor` | 🟢 | M1 用内存版（Bucket4j），标注"高并发时升级 Redis" | `mb-infra/infra-rate-limit/.../RateLimitInterceptor.java` |
| 7 | `GlobalExceptionHandler` | 🟡 | 骨架保留，**响应格式重写**（自定义 `R<T>` → RFC 9457 `ProblemDetail`），见 [A.2.3](#a23) | `mb-infra/infra-exception/.../GlobalExceptionHandler.java` |
| 8 | `JooqHelper` | 🟠 | **概念重写**：从静态工具聚合类改为 `@Component` + 二元路径（批量 `batch*`、条件 `conditional*`），砍掉 `softDeletedFilter` / `setAuditInsert` / `setAuditUpdate` / `dataScopeFilter`（全部被 jOOQ 原生机制替代）；详见 [A.2.4](#a24) | `mb-infra/infra-jooq/.../JooqHelper.java` |
| 9 | `DataScopeAspect` → `DataScopeVisitListener` | 🟠 | 生态切换（MyBatis AOP 基类 → jOOQ `VisitListener` 单点），**方案 E = ADR-0007 的触发样本**，见 [A.2.5](#a25) | `mb-infra/infra-jooq/.../DataScopeVisitListener.java` |
| 10 | ~~`JwtTokenProvider`~~ | 🔴 | Sa-Token `sa-token-jwt` 模块原生支持，零代码复用，见 [A.2.6](#a26) | Sa-Token `sa-token-jwt` |
| 11 | ~~`SecurityUtils`~~ → `CurrentUser` | 🔴→🟠 | Spring Security 静态工具彻底放弃；门面接口是新生态原生架构答案，见 [A.2.7](#a27) | 接口：`mb-common/.../security/CurrentUser.java`；实现：`mb-infra/infra-security/.../SaTokenCurrentUser.java` |
| 12 | ~~`MemoryTokenBlacklist` / `RedisTokenBlacklist`~~ | 🔴 | Sa-Token `StpLogic` + Redis session 原生支持黑名单/强制注销/踢人下线 | Sa-Token 内置 |
| 13 | `SnowflakeIdGenerator` | 🟢 | 纯算法工具类，无生态耦合 | `mb-common/.../id/SnowflakeIdGenerator.java` |
| 14 | `I18nHelper` + `MessageSource` 配置 | 🟢 | 集成 `AcceptHeaderLocaleResolver`，Spring 原生答案 | `mb-infra/infra-i18n/...` |
| 15 | Flyway schema 设计（mb_iam_*） | 🟡 | **只借业务结构**，SQL 按 PostgreSQL 惯例重写；加 `tenant_id` / `version`；命名 `V<yyyymmdd>_<nnn>__<module>_<table>.sql`（ADR-0008 时间戳）；位置在 `mb-schema`（ADR-0004），见 [A.2.8](#a28) | `mb-schema/src/main/resources/db/migration/V20260601_001__iam_user.sql` 等 |
| 16 | `CorsConfig` | ⚪ | nxboot 无此项，按 Spring `CorsConfigurationSource` + `CorsFilter` 原生答案从零写 | `mb-infra/infra-security/.../CorsConfig.java` |

<!-- verify: test -d /Users/ocean/Studio/01-workshop/02-软件开发/04-nxboot/server/nxboot-common && test -d /Users/ocean/Studio/01-workshop/02-软件开发/04-nxboot/server/nxboot-framework -->

### A.2 涉及生态差异的条目三问详解

> 以下 8 条涉及生态切换、原生语义违反、或概念重写，按 ADR-0007 三问逐条审查。纯工具搬运（🟢）不在此列。

<a id="a21"></a>
#### A.2.1 `TestHelper` → `MockCurrentUser`（🔴 彻底放弃）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | nxboot 的 `TestHelper` 基于 Spring Security 的测试惯例（`@WithMockUser` / `TestingAuthenticationToken` / `SecurityContextHolder.setContext()`）——Spring Security 生态约定 |
| **新生态答案** | Sa-Token 没有官方测试注解等价物，meta-build 不直接依赖 Sa-Token 测试 API；**正确答案是通过 `CurrentUser` 门面隔离**：测试层用 `@Primary` Bean 提供 `MockCurrentUser` 实现，业务代码和测试代码都零 Sa-Token 引用 |
| **改造策略** | **彻底放弃**，零代码复用。`MockCurrentUser` 是按"门面隔离"的原生架构答案从零写，不是 `TestHelper` 的修补版本 |
| **决策依据** | ADR-0005（Spring Security → Sa-Token 切换）+ ADR-0007（门面隔离使测试零认证框架引用） |

---

<a id="a22"></a>
#### A.2.2 `AsyncConfig`（🟡 部分借用）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | Spring `@Async` + `ThreadPoolTaskExecutor` + `TaskDecorator` 传递 `ThreadLocal` 上下文——**Spring 生态通用模式，跨框架中立**，不是 nxboot 特有 |
| **新生态答案** | 同样是 Spring 原生答案，骨架无需重写。差异只在"要传递的 ThreadLocal 列表"：① 请求上下文 `RequestContextHolder`（不变）② 认证上下文从 `SecurityContextHolder` → `SaTokenContext`（ADR-0005 连带变化）③ **砍掉 `DataScopeContext`**（方案 E 之后，数据权限状态只存在 Sa-Token session 中由 `CurrentUser` 读出，不再需要单独的 ThreadLocal） |
| **改造策略** | **部分借用**：线程池参数（4/8/200 + `CallerRunsPolicy` + 队列容量）直接搬；`TaskDecorator` 的 ThreadLocal 传递列表按新生态调整 |
| **决策依据** | ADR-0005 + ADR-0007 方案 E |

---

<a id="a23"></a>
#### A.2.3 `GlobalExceptionHandler`（🟡 响应格式重写）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | `@ControllerAdvice` + `@ExceptionHandler` 是 **Spring 原生**（nxboot 和 meta-build 在这一层没有分歧）。但 nxboot 在**更深一层**踩了反面教材：**自定义 `R<T>` 包装所有错误返回 200 OK** —— 这违反的不是 Spring 生态，而是 **HTTP 协议本身**的语义（4xx/5xx 状态码 + 结构化错误体） |
| **新生态答案** | **RFC 9457 ProblemDetail** —— HTTP 生态对"结构化错误响应"的标准答案，Spring Boot 3.x 原生内置 `org.springframework.http.ProblemDetail`。业务成功返回业务对象直接序列化（非 `ResponseEntity` 包装），失败返回 `ProblemDetail` |
| **改造策略** | 骨架借用（`@ControllerAdvice` 结构 + 异常类型到 HTTP 状态码的映射表），**响应格式完全重写**（`R<T>` → `ProblemDetail`） |
| **决策依据** | [反面教材 #5](08-archunit-rules.md)：nxboot 的 `R<T>` 200 OK 包装破坏 HTTP 语义。ADR-0007 元方法论推论：**当 nxboot 违反的是更底层协议的原生语义时，必须回归协议原生答案**，不能以"这是 nxboot 的做法"为由机械搬运 |

---

<a id="a24"></a>
#### A.2.4 `JooqHelper`（🟠 概念重写）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | nxboot 的 `JooqHelper` 是一个静态工具聚合类，承载 14 个方法：分页辅助、软删除过滤 `softDeletedFilter()`、审计字段填充 `setAuditInsert()`/`setAuditUpdate()`、乐观锁辅助、jOOQ 便捷操作等。这是"把所有横切关注点聚合到单个 helper"的传统 Java 工具类范式 |
| **新生态答案** | **jOOQ 原生已经为这些横切关注点提供了框架级拦截机制**，根本不需要 helper 聚合：① **乐观锁**：`Settings.executeWithOptimisticLocking + updateRecordVersion` 全局开关 ② **`updated_at` 自动**：`Settings.updateRecordTimestamp` ③ **`created_by / updated_by` 填充**：`RecordListener.insertStart / updateStart` 钩子（`AuditFieldsRecordListener`）④ **`created_at` 初始值**：数据库 `DEFAULT CURRENT_TIMESTAMP` ⑤ **数据权限 `WHERE dept_id IN (...)`**：`VisitListener`（方案 E，[05-security.md §7](05-security.md)）⑥ **软删除**：meta-build 不做（详见 [04-data-persistence.md §8.8](04-data-persistence.md)）⑦ **慢查询日志**：`ExecuteListener`（nxboot `SlowQueryListener` 本来就是原生） |
| **改造策略** | **🟠 概念重写**：把 `JooqHelper` 从"静态工具聚合类"重新定义为 `@Component`（Spring bean，注入 `DSLContext + CurrentUser`），只保留**批量操作和业务条件更新**两类方法（`batchInsert` / `batchUpdate` / `batchDelete` / `conditionalUpdate` / `conditionalDelete`）。**全部砍掉**的方法：`softDeletedFilter` / `setAuditInsert` / `setAuditUpdate` / `dataScopeFilter` / `optimisticUpdate`（这些全部被 jOOQ 原生机制替代）。保留的 nxboot 借用方法：仅分页辅助和 Snowflake ID 相关的纯工具方法（具体清单见实施时的 Javadoc）|
| **决策依据** | ADR-0007 元方法论第三次应用（前两次：方案 E 数据权限、ADR-0008 Flyway 命名）。本次的元规则强化："**决策起点是官方文档，不是 nxboot 或项目已有抽象**"——官方 jOOQ 文档清晰说明 `Settings + RecordListener + VisitListener` 是横切关注点的原生归宿，helper 聚合范式只在这三个原生机制无法覆盖的场景（批量 DSL 不触发 listener）才有意义 |

> ⚠️ **本条是一次较大规模的改造**：`JooqHelper` 的形态从静态工具改为 `@Component`，砍掉 5 个方法，新增 5 个二元路径方法。业务层的所有写操作收敛到两个入口——`UpdatableRecord.store()` 或 `jooqHelper.batch*/conditional*`，由 ArchUnit 的 4 条规则硬性强制（见 [08-archunit-rules.md](08-archunit-rules.md)）。
---

<a id="a25"></a>
#### A.2.5 `DataScopeAspect` → `DataScopeVisitListener`（🟠 概念重写）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | nxboot 所在的 **MyBatis-Plus 生态**的继承范式：`@Aspect` 切面 + `DataScopeContext` ThreadLocal + `extends BaseMapper` 基类在 where 条件中拼接部门过滤（**方案 E 已废弃这套 MyBatis 继承惯性**）。MyBatis-Plus 官方甚至提供了 `DataPermissionInterceptor` 插件 |
| **新生态答案** | **jOOQ 原生范式**的标准答案是 **`VisitListener` 在 SQL AST 构建层单点拦截**（Lukas Eder 博客长期案例 + jOOQ 官方文档 + Stack Overflow 主流答案）。jOOQ 鼓励组合 + 函数式风格，**不鼓励基类继承**。方案 E 的完整结构：`DataScopeRegistry`（集中声明受保护表）+ `DataScopeVisitListener`（单点拦截，opt-out 本体）+ `BypassDataScopeAspect`（窄范围 AOP，ThreadLocal boolean 标记，`@BypassDataScope` 强制填 `reason`） |
| **改造策略** | **只借鉴"动态注入 `dept_id IN (...)` 条件"的问题定义**，代码完全重写。**砍掉基类 `DataScopedRepository`**（MyBatis-Plus 继承惯性残留）**砍掉 `DataScopeContext` ThreadLocal**（冗余，`CurrentUser` 已是单一数据源） |
| **决策依据** | **ADR-0007 本身的触发样本** —— 这是元方法论的第一个落地案例。前四轮方案都在优化"基类怎么变好"，第五轮才问"为什么需要基类"并砍掉。详见 [ADR-0007 §背景](../../adr/0007-继承遗产前先问原生哲学.md#背景) |

---

<a id="a26"></a>
#### A.2.6 `JwtTokenProvider` / `MemoryTokenBlacklist` / `RedisTokenBlacklist`（🔴 彻底放弃）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | nxboot 用 **Spring Security**，Spring Security 本身**不提供 JWT 生成/解析工具**和**不提供 token 黑名单存储**。使用者必须**自己实现这两层**（手写 JWT header/payload 构造 + JJWT 库 + 自建黑名单存储）—— 这是 Spring Security 生态的已知补洞项，也是大量项目踩坑的源头 |
| **新生态答案** | **Sa-Token 原生内置全部能力**：① `sa-token-jwt` 模块原生支持 JWT（多种签名算法 + 自动注入当前会话的 login id）② `StpLogic` + Redis session 原生支持 token 黑名单 / 强制注销 / 踢人下线 / 二次授权 / 同端互斥登录。**不需要使用者写任何一行代码** |
| **改造策略** | **彻底放弃全部 3 个组件**，零代码复用 |
| **决策依据** | ADR-0005 —— 选 Sa-Token 的核心吸引力之一就是"这类基础设施不需要使用者再手写"。保留 nxboot 的手写组件 = 白白放弃 Sa-Token 的生态红利 |

---

<a id="a27"></a>
#### A.2.7 `SecurityUtils` → `CurrentUser`（🔴→🟠 彻底放弃 + 门面概念重写）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | nxboot 的 `SecurityUtils.getCurrentUser()` 是对 `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` 的静态封装 —— **Spring Security 生态的静态工具惯例**。这种惯例本身不算错，但"业务层直接调用认证框架静态工具"是**跨框架的架构反模式**（和 nxboot 的另一坑"R<T> 包装"同级别） |
| **新生态答案** | Sa-Token 的原生静态工具是 `StpUtil.getLoginIdAsLong()` / `StpUtil.getSession()`，**直接暴露会污染业务层**，重复 Spring Security 的反模式。**正确答案是门面隔离**：`CurrentUser`（读门面接口，定义在 `mb-common.security`，业务层唯一依赖）+ `AuthFacade`（写门面接口：login/logout/kickout/renew，业务层做登录等技术动作时必须通过此接口）+ Sa-Token 实现放在 `infra-security`，业务层零 Sa-Token 引用 |
| **改造策略** | **双重动作**：① 🔴 彻底放弃 nxboot 的 `SecurityUtils` 代码 ② 🟠 按"门面接口 + ArchUnit 隔离"的原生架构答案**从零写** `CurrentUser` / `AuthFacade` 接口和实现 |
| **决策依据** | ADR-0005（门面策略为 Sa-Token 接入方式）+ ADR-0007（**门面不是 nxboot 借用，是新生态的原生架构答案** —— 即使 nxboot 有类似组件，也要判断它的哲学是否匹配新技术栈。这里答案是"nxboot 的静态工具哲学在 Sa-Token 生态里是反模式"） |

---

<a id="a28"></a>
#### A.2.8 Flyway schema 设计（🟡 结构借用）

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | nxboot 的 SQL 基于 **MySQL 8 + MyBatis-Plus 约定**（`BIGINT` 主键、`DATETIME` 时间类型、`utf8mb4` 字符集、`TINYINT(1)` 表示 boolean、单表无分区等） |
| **新生态答案** | meta-build 用 **PostgreSQL 16 + jOOQ**。PostgreSQL 的原生特性必须被激活：① `BIGINT` 保留但用 Snowflake 生成（ADR-0006 主键策略）② 时间类型用 `TIMESTAMPTZ`（带时区，规划决策 6 时区约束）③ 字符集无需声明（PG 默认 UTF-8）④ boolean 用真正的 `BOOLEAN` 类型（不用 tinyint）⑤ 复杂字段用 `JSONB`（不用 TEXT + 应用层 JSON 解析）⑥ 大表支持声明式分区（`PARTITION BY RANGE`） |
| **改造策略** | **只借业务结构**：mb_iam_* 的表数量、字段含义、索引策略、关联关系作为参考；**SQL 按 PostgreSQL 惯例重写**。额外必须调整：加 `tenant_id BIGINT NOT NULL DEFAULT 0`（多租户预留 + 单租户默认值 0）加 `version INTEGER NOT NULL DEFAULT 0`（乐观锁）文件命名采用时间戳格式 `V<yyyymmdd>_<nnn>__<module>_<table>.sql`（ADR-0008）位置迁移到 `mb-schema`（ADR-0004） |
| **决策依据** | ADR-0004（mb-schema 契约层）+ 规划决策 2（PostgreSQL 优先）+ ADR-0007（数据库也是一种生态，MySQL 惯例不能搬到 PostgreSQL） |

## 附录 B: 每个 Maven 模块的 M1/M4 实施清单

### B.1 mb-schema（ADR-0004 新增）

| 阶段 | 必做 |
|------|------|
| M1 | `pom.xml` + jOOQ codegen profile 配置 + V01 Flyway 脚本（至少 `mb_iam_user`）+ 第一次 codegen 生成 |
| M4 | 8 个 platform 域的完整 Flyway 脚本（iam/audit/file/notification/dict/config/job/monitor，命名见 ADR-0008 时间戳规范）+ 初始化数据脚本 `V<yyyymmdd>_<nnn>__init_data.sql` + 完整 jOOQ 生成代码 |
| M5 | canonical reference 三个模块的 Flyway 脚本：`business-notice` / `business-order`（主从表）/ `business-approval`（跨模块编排），时间戳命名 `V<yyyymmdd>_<nnn>__business_<模块>_<表>.sql`（ADR-0008） |

### B.2 mb-infra 子模块

| 模块 | M1 必做 | M4 必做 |
|------|---------|---------|
| `infra-security` | （占位 pom） | `SaTokenCurrentUser`（实现 `com.metabuild.common.security.CurrentUser`）+ `AuthFacade` 接口 + `SaTokenAuthFacade` 实现 + `@RequirePermission` + `RequirePermissionAspect` + `CorsConfig` + Sa-Token 配置 |
| `infra-cache` | （占位 pom） | `CacheEvictSupport`, `RedisCacheConfig`, TTL 抖动工具 |
| `infra-jooq` | `JooqHelper`（基础 5 方法）, `SlowQueryListener`, `SnowflakeIdGenerator` Bean | `JooqHelper`（完整 14 方法）, **方案 E 数据权限三件套**：`DataScopeRegistry` + `DataScopeVisitListener` + `BypassDataScopeAspect` |
| `infra-exception` | （占位 pom） | `GlobalExceptionHandler`（ProblemDetail 输出）, `MetaBuildException` 基类层次, `OpenApiConfig` |
| `infra-i18n` | （占位 pom） | `MessageSourceAutoConfiguration`, `AcceptHeaderLocaleResolver`, `I18nHelper` |
| `infra-async` | `AsyncConfig`（基础线程池 4/8/200 + `CallerRunsPolicy`） | + `RequestContextHolder` 传递 + Sa-Token 上下文跨线程传递（方案 E 后只剩这一个 ThreadLocal 需要传递） |
| `infra-rate-limit` | （占位 pom） | `RateLimitInterceptor`（内存版 Bucket4j）, `RateLimitProperties` |
| `infra-websocket` | （占位 pom，v1.5 实施） | （v1.5） |
| `infra-observability` | `logback-spring.xml`（JSON encoder）, `TraceIdFilter`, `/actuator/health` | + Micrometer `MeterRegistry` 配置 + Prometheus 端点 + `/readiness` + `/liveness` + 自定义 `HealthIndicator` |
| `infra-archunit` | 规则类: `JooqIsolationRule`, `ModuleBoundaryRule`（3 条 M1 规则） | + `SaTokenIsolationRule`, `DataScopeRule`, `CacheEvictRule`, `TimezoneRule`, `TransactionRule`, `ControllerRule`, `GeneralCodingRulesBundle` |

### B.3 mb-platform 子模块（M4 必做全部）

| 模块 | 核心内容 |
|------|---------|
| `platform-iam` | `UserApi` / `RoleApi` / `MenuApi` / `DeptApi` / `AuthApi` / `PermissionApi` + 对应 api/domain/web + `@OperationLog` 注解装饰 + **方案 E 的 `DataScopeLoader`**（登录时展开数据范围的业务计算） |
| `platform-log` | `OperationLogApi` + `@OperationLog` 注解 + `OperationLogAspect` + 异步写入 `mb_log_operation` + 敏感字段脱敏 |
| `platform-file` | `FileApi` + `FileStorage` 接口 + `LocalFileStorage` + `AliyunOssFileStorage`（可选）+ 秒传 |
| `platform-notification` | `NotificationApi` + 通知公告 + 站内信 + 邮件/短信 adapter（可选） |
| `platform-dict` | `DictApi` + 字典 CRUD + 本地缓存 + 事件刷新 |
| `platform-config` | `ConfigApi` + 运行时配置 + 本地缓存 |
| `platform-job` | `JobApi` + Spring `@Scheduled` + ShedLock + 执行历史 |
| `platform-monitor` | `MonitorApi` + 服务器资源 + 慢查询监控 |

### B.4 mb-business（v1 M1-M4 空目录占位，M5 填入）

| 模块 | 触发时机 | 核心内容 |
|------|---------|---------|
| `business-notice` | M5 | 低复杂度 CRUD + 富文本 + 状态枚举 |
| `business-order` | M5 | 主从表 + 状态机（DRAFT→SUBMITTED→APPROVED→REJECTED→CANCELLED） |
| `business-approval` | M5 | 跨模块编排（iam + notification + audit）+ ApplicationService 编排层 |

## 附录 C: 推迟章节占位

以下章节的骨架已经存在或不必前置，推迟到对应 milestone 时补全。

| 章节 | 触发时机 | 补充内容 |
|------|---------|---------|
| ~~**配置管理完整版** [P1]~~ | ~~M1 写 application.yml 时~~ | **已展开为独立章节 [09-config-management.md](09-config-management.md)**(M1.1 任务完成,~730 行) |
| **Dockerfile** | M1 写 Dockerfile 时 | 多阶段构建 / `eclipse-temurin:21-jre-alpine` base / layered jar / JVM 启动参数 / healthcheck / 用户权限 |
| **docker-compose.yml** | M1 写 compose 时 | postgres + redis / 卷挂载 / 健康检查 / 网络 / profile 切换 |
| **CI/CD server.yml 完整脚本** [P1] | M1 写 CI 时 | JDK 21 setup → Maven cache → `mvn -B verify` → jacoco report → docker build（可选）→ push registry（可选） |
| **WebSocket 推送** | v1.5 | 单节点实现 + Redis Pub/Sub 多节点 + 强制下线集成 |
| **消息队列集成**（Kafka/RabbitMQ） | v1.5+ | v1 用 Spring 原生事件即可 |
| **Spectral API lint** | M6 | `.spectral.yaml` + CI 集成 |
| **oasdiff breaking change 检查** | M6 | PR 流程 + `openapi.json` 对比 |
| **API 废弃策略细化** | M6 | deprecation 时间线 + 通知机制 + 向下兼容版本跨度 |
| **@mb/api-sdk 版本化** | M6 | 版本号策略 + 发布流程 |
| **文档可验证性脚本** | v1 完成时 | 批量执行所有 `<!-- verify: -->` 块的工具 |
| **每个 platform 模块的详细 ER 图** | M4 实施前 | iam/audit/file 等 8 个模块的 ER 图 + 状态机 + 权限点清单 |
| **canonical reference 详细设计** | M4 末 / M5 初 | notice/order/approval 的需求/ER/状态机/UI 原型 |

## 附录 D: 术语表

| 术语 | 定义 |
|------|-----|
| **meta-build / 元构** | 本项目名。AI 时代的可定制全栈技术底座 |
| **mb-** | 后端 Maven 模块前缀（6 层：`mb-common` / `mb-schema` / `mb-infra` / `mb-platform` / `mb-business` / `mb-admin`） |
| **@mb/** | 前端 pnpm package 前缀（`@mb/api-sdk` / `@mb/ui-tokens` 等） |
| **L1-L5** | 前端五层架构（`ui-tokens` / `ui-primitives` / `ui-patterns` / `app-shell` / `features`），见 `frontend-architecture.md` |
| **mb-schema** | **数据库契约层**（ADR-0004）。Flyway migration + jOOQ 生成代码集中地。和前端 `@mb/api-sdk` 对称 |
| **mb-business** | **使用者业务扩展位**（ADR-0004）。M5 填入 canonical reference 示例；使用者自己的业务扩展也在这层 |
| **canonical reference** | M5 手写的业务示例模块（notice / order / approval），作为 v1.5 Spec 引擎的代码样本来源。质量规范见 ADR-0006 |
| **ground truth** | 不可质疑的事实基线（本文档对后端就是 ground truth） |
| **opt-in / opt-out** | 默认行为方式：opt-in = 默认关闭，需显式启用；opt-out = 默认开启，需显式跳过 |
| **Sa-Token** | dromara 开源的轻量 Java 认证框架，meta-build 的认证底层（ADR-0005） |
| **CurrentUser** | **认证读门面接口**（ADR-0005）。业务层必须通过这个接口获取当前用户信息和权限判断，禁止直接依赖 Sa-Token API。接口定义在 `mb-common.security`，Sa-Token 实现在 `infra-security`。v1 M4.2 扩展:新增常量 `SYSTEM_USER_ID = 0L` 和默认方法 `userIdOrSystem()`,用于无认证上下文（`@Scheduled` / `@Async`）场景下的审计字段填充。|
| **AuthFacade** | **认证写门面接口**（ADR-0005 + 方案 E）。封装登录/登出/强制注销/续期等"改变认证状态"的操作，业务层要做登录等技术动作时必须通过此接口。与 `CurrentUser` 对称（读 vs 写） |
| **@RequirePermission** | **自定义权限注解**（ADR-0005）。**必须放在 Controller 层的方法上**（N3 §2.5），不能放 Service 层。AOP 委托给 `CurrentUser.hasPermission()` 判断。Service 间调用不重新检查权限，跨模块可见性通过 `<Module>Api` 接口 + ArchUnit 编译期保护 |
| **View** | API 响应 DTO 的命名后缀，如 `UserView` / `OrderDetailView`，必须是 record，带 `from(Record)` 静态工厂方法 |
| **Command** | 写操作请求 DTO 的命名后缀，如 `UserCreateCommand` / `UserUpdateEmailCommand` / `OrderSubmitCommand`，必须是 record |
| **Query** | 查询参数 DTO 的命名后缀，如 `UserQuery` / `OrderQuery`，必须是 record |
| **Event** | 领域事件 DTO 的命名后缀，如 `UserCreatedEvent`，必须是 record，通过 `ApplicationEventPublisher` 发布 |
| **&lt;Module&gt;Api** | 跨模块调用接口的命名，如 `UserApi` / `OrderApi`。模块内的 `Service` class `implements <Module>Api`。跨模块调用必须走 Api 接口（`CROSS_PLATFORM_ONLY_VIA_API` ArchUnit 规则强制）|
| **Application Service / Use Case / 编排 Service** | meta-build v1 不强制区分 "Application Service vs Domain Service"（DDD 纯粹派分法）。复杂业务（跨多个聚合根/模块）拆独立的 `<Process>Service`（如 `UserRegistrationService` / `OrderSubmitService`）。详见 [01-module-structure.md §4.7](./01-module-structure.md) |
| **MockCurrentUser** | 测试用的 `CurrentUser` 实现，通过 `@Primary` Bean 替换生产实现，测试代码零 Sa-Token 引用 |
| **ProblemDetail** | RFC 9457 定义的 HTTP 错误响应标准格式（Spring Boot 3.x 内置 `org.springframework.http.ProblemDetail`） |
| **PageQuery** | 分页查询参数 record（`mb-common.pagination`），包含 `page` / `size` / `sort`。由 `PageQueryArgumentResolver` 自动从 HTTP query string 解析 |
| **PageResult&lt;T&gt;** | 分页结果 record（`mb-common.pagination`），包含 `content` / `totalElements` / `totalPages` / `page` / `size`。通过 `PageResult.of(content, total, query)` 构造。详见 [06-api-and-contract.md §12](./06-api-and-contract.md) |
| **SortParser** | Sort 字段解析器（`mb-common.pagination`），Builder 风格 API，`.forTable()` 自动注册通用字段，`.allow()` 显式列举业务字段，`.defaultSort()` 指定默认排序。详见 [06-api-and-contract.md §12.5](./06-api-and-contract.md) |
| **ArchUnit** | Java 架构测试库，把架构规则写成 JUnit 测试。meta-build 用它做模块边界 + 代码细节守护（ADR-0003） |
| **DataScope** | 数据范围值对象（`DataScopeType + Set<Long> deptIds`）。5 种类型：`ALL / CUSTOM_DEPT / OWN_DEPT / OWN_DEPT_AND_CHILD / SELF`。类型定义在 `mb-common.security`，登录时由 `DataScopeLoader` 展开并存入 Sa-Token session |
| **DataScopeRegistry**（方案 E） | 数据权限受保护表的**集中注册中心**（`infra-jooq`）。使用者在 `@Configuration` 里声明"表名 → 部门字段名"映射，`DataScopeVisitListener` 读取此映射决定哪些查询要注入 where 条件 |
| **DataScopeVisitListener**（方案 E） | 数据权限的**唯一拦截点**。jOOQ 全局 VisitListener，在 SQL AST 构建层自动对注册过的表注入 `dept_id IN (...)` 条件。替代 nxboot 的 `DataScopeAspect` + `DataScopedRepository` 基类双保险（详见 ADR-0007） |
| **BypassDataScope** | 显式跳过数据权限的注解。实现是 `BypassDataScopeAspect`（`infra-jooq`）——一个窄范围 AOP 切面，只持有一个 `boolean` ThreadLocal 标记，`@BypassDataScope` 方法返回时 try-finally 清理。注解必须填 `reason` 说明 bypass 理由 |
| **@OperationLog** | 自定义操作日志注解（ADR-0006 P0.6），AOP 拦截写入 `mb_log_operation` |
| **ShedLock** | 分布式定时任务锁库，防止多实例重复执行 `@Scheduled` 任务 |
| **FileStorage** | 文件存储抽象接口（ADR-0006 P0.5），实现类：`LocalFileStorage` / `AliyunOssFileStorage` |
| **HikariCP** | Spring Boot 默认的 JDBC 连接池，见 7.8 节的基线配置 |
| **ADR** | Architecture Decision Record，架构决策记录 |
| **M1/M4/M5** | 规划文档里的 milestone 编号（M1 = 脚手架，M4 = 后端底座 + 平台模块 + 契约驱动，M5 = canonical reference） |
| **P0/P1/P2** | canonical reference 质量规范的优先级（ADR-0006）：P0 必在 M0 就定完，P1 占位 + 方向，P2 推迟 |
| **JooqHelper** | `mb-infra/infra-jooq` 中的 jOOQ 操作辅助类，提供 conditionalUpdate、batch 等简化 API |
| **RecordListener** | jOOQ 原生接口，在 record 的 insert/update/delete 操作前后触发回调。meta-build 用于自动填充审计字段（created_by / updated_by / updated_at / owner_dept_id） |
| **Clock Bean** | Spring Bean（`java.time.Clock`），统一时间获取入口。生产注入 `Clock.systemUTC()`，测试注入 `Clock.fixed(...)` 实现时间冻结 |
| **owner_dept_id** | 数据权限归属部门字段，记录数据创建时所属的部门 ID。创建后不可变，不随创建人调岗更新。VisitListener 通过此字段注入 `WHERE owner_dept_id IN (...)` 条件 |

---

[← 返回 README](./README.md)
