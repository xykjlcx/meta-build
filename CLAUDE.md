# Meta-Build（元构）— AI 时代的可定制全栈技术底座

> **这是一份 AI 契约文档**。AI 和人类读这份文档都能在 3 分钟内理解 meta-build 的全貌，并找到任何细节的准确位置。
>
> **核心原则：索引而不是细节**。具体设计见 `docs/specs/`，决策原因见 `docs/adr/`，规划路线见 `meta-build规划_v1_最终对齐.md`。CLAUDE.md 不重复任何细节——**改架构修 specs，不修 CLAUDE.md**，避免文档-代码 drift。

---

## 一句话定位

meta-build = **给 AI 执行的不可动摇的契约**（后端稳定 + 前端千人千面）。使用者用自己的 AI 改代码，约束由 ArchUnit + Maven + TypeScript strict 守护，AI 越界即编译失败或测试失败。

## 核心哲学

1. **给 AI 执行的契约**：每一条"正确的事"都有工具拦截违反（ArchUnit 规则 / Maven pom 隔离 / TypeScript strict / `<!-- verify: -->` 可执行验证块）
2. **千人千面的前端**：L1 CSS 变量 + Theme Registry + App Shell 换壳定制，覆盖 80% 定制场景
3. **后端硬骨头 + 前端柔皮肤**：业务层零感知技术细节（`CurrentUser` / `AuthFacade` 门面 / `DataScopeVisitListener` jOOQ 层单点拦截数据权限 / `@RequirePermission` 自定义注解）
4. **不追新、不过度工程化**：技术栈选成熟方案；功能加到刚好够用即止
5. **反面教材先行**：nxboot 踩过的 15 条坑 + 1 条元方法论全部在 [backend/README.md 反向索引](docs/specs/backend/README.md#后端硬约束反向索引) 集中索引，meta-build 从第一天用工具拦截

---

## 当前阶段

| Milestone | 内容 | 状态 |
|-----------|------|-----|
| **M0** | 文档对齐（规划 + backend-architecture + frontend-architecture + CLAUDE.md） | 🟡 进行中（后端已定稿，前端未写） |
| M1 | 项目脚手架 + CI + 基础设施 | ⏸ 待开始 |
| M2 | 前端 L1 + Theme 系统 | ⏸ 待开始 |
| M3 | 前端 L2 + L4 | ⏸ 待开始 |
| M4 | 后端底座 + 8 平台模块 + 契约驱动 | ⏸ 待开始 |
| M5 | canonical reference（business-notice/order/approval） | ⏸ 待开始 |
| M6 | 验证层完整版 + 主题样本库 | ⏸ 待开始 |
| M7 | 开源准备 | ⏸ 待开始 |

## 阅读路径（按角色）

| 我是谁，要做什么 | 读什么 |
|---------------|------|
| **AI，要写业务代码** | [backend/README.md 阅读路径表](docs/specs/backend/README.md#阅读路径按角色) → [03-platform-modules.md §5 新增业务模块 12 步清单](docs/specs/backend/03-platform-modules.md) |
| **AI，要改前端视觉** | [frontend/README.md](docs/specs/frontend/README.md)（**M0 待写**，暂时参考规划文档决策 1）+ L1 `@mb/ui-tokens` |
| **人类开发者，要贡献代码** | 规划文档 → [backend/README.md](docs/specs/backend/README.md) → 本文档的"AI 硬约束"小节 |
| **想理解某个决策** | `docs/adr/` 目录 |
| **想知道项目全貌** | 本文档（CLAUDE.md）5 分钟读完 |

---

## 架构一图概览

```
meta-build/
├── client/                          # 前端（5 层 pnpm workspace）
│   ├── packages/
│   │   ├── ui-tokens/               # L1 Design tokens + Theme Registry
│   │   ├── ui-primitives/           # L2 原子组件（shadcn/Radix 风格）
│   │   ├── ui-patterns/             # L3 业务组件（NxTable / NxForm 等）
│   │   ├── app-shell/               # L4 布局/导航/主题壳
│   │   └── api-sdk/                 # OpenAPI 生成的 TypeScript client
│   └── apps/
│       └── web-admin/               # L5 features（业务代码）
│
├── server/                          # 后端（6 层 Maven multi-module）
│   ├── mb-common/                   # 零 Spring 工具（异常基类、Snowflake ID、PageResult）
│   ├── mb-schema/                   # ★ 数据库契约层（Flyway SQL + jOOQ 生成代码，ADR-0004）
│   ├── mb-infra/                    # 基础设施（10 个子模块：security/cache/jooq/exception/...）
│   ├── mb-platform/                 # 平台业务（8 个子模块：iam/audit/file/notification/...）
│   ├── mb-business/                 # ★ 使用者扩展位 + M5 canonical reference（ADR-0004）
│   └── mb-admin/                    # Spring Boot 启动入口 + 集成测试 + ArchUnit 测试
│
├── docs/
│   ├── specs/                       # 架构设计规范
│   │   ├── backend/                 # 后端完整设计（9 子文件 + README + appendix，~4200 行总量）
│   │   │   ├── README.md            # 入口 + 反向索引（CLAUDE.md 唯一引用点）
│   │   │   └── 01-08 + appendix     # 各 split 子文件
│   │   └── frontend/                # 前端完整设计（M0 占位，写时填入）
│   │       └── README.md
│   ├── adr/                         # 架构决策记录
│   │   ├── 0001-m0-文档从7份收敛到3份.md
│   │   ├── 0002-后端模块命名framework改infra-system改platform.md
│   │   ├── 0003-移除spring-modulith保留archunit单保险.md
│   │   ├── 0004-新增mb-schema数据库契约层.md
│   │   ├── 0005-认证框架切换到sa-token加currentuser门面层.md
│   │   └── 0006-canonical-reference质量规范.md
│   └── 日志/                        # 每日工作日志
│
├── meta-build规划_v1_最终对齐.md     # ground truth 基线（17 项决策）
└── CLAUDE.md                        # 本文档（AI 契约入口）
```

**后端依赖方向（严格单向）**：
```
mb-common → mb-schema → mb-infra → mb-platform → mb-business → mb-admin
```

**前端依赖方向（严格单向）**：
```
@mb/ui-tokens → @mb/ui-primitives → @mb/ui-patterns → @mb/app-shell → web-admin
```

---

## 技术栈

### 后端（详见 [backend/README.md 决策回顾](docs/specs/backend/README.md#17-项决策回顾)）

| 维度 | 选型 |
|------|------|
| JVM / 框架 | JDK 21 + Spring Boot 3.5.13 |
| 数据访问 | jOOQ 3.19+ + PostgreSQL 16 + Flyway 10+ |
| 认证 | **Sa-Token 1.39.x + `CurrentUser` 门面层 + `@RequirePermission` 自定义注解**（ADR-0005） |
| 模块边界 | **Maven pom 隔离 + ArchUnit 双保险**（ADR-0003，已移除 Spring Modulith） |
| 响应格式 | RFC 9457 ProblemDetail（错误）+ 业务对象直接返回（成功）+ PageResult（分页） |
| 缓存 | Redis + CacheEvictSupport（afterCommit 失效） |
| 可观测性 | Actuator + Micrometer + Logback JSON encoder |
| 测试 | JUnit 5 + Testcontainers + ArchUnit + MockCurrentUser |
| 契约驱动 | springdoc → OpenAPI 3.1 → @mb/api-sdk（TypeScript） |

### 前端（详见规划文档决策 3-4，`frontend-architecture.md` **M0 未写**）

| 维度 | 选型 |
|------|------|
| 基础 | React 19 + TypeScript strict + Vite |
| 路由 | TanStack Router（文件路由 + 完全类型推导） |
| 数据 | TanStack Query |
| UI | Radix UI + Tailwind CSS 3.4 + CVA + shadcn 风格（源码在 `@mb/ui-primitives`） |
| 表格/表单 | TanStack Table + React Hook Form + Zod |
| 测试 | Vitest + Playwright + Storybook |
| 代码质量 | Biome |

---

## ADR 索引（架构决策记录）

| ADR | 主题 | 状态 |
|-----|------|------|
| [0001](docs/adr/0001-m0-文档从7份收敛到3份.md) | M0 文档从 7 份收敛到 3 份 | 已采纳 |
| [0002](docs/adr/0002-后端模块命名framework改infra-system改platform.md) | 后端 Maven 命名 framework→infra, system→platform | 已采纳 |
| [0003](docs/adr/0003-移除spring-modulith保留archunit单保险.md) | **移除 Spring Modulith，改 Maven + ArchUnit 双保险** | 已采纳 |
| [0004](docs/adr/0004-新增mb-schema数据库契约层.md) | **新增 mb-schema 数据库契约层**（4 层 → 6 层 Maven） | 已采纳 |
| [0005](docs/adr/0005-认证框架切换到sa-token加currentuser门面层.md) | **认证框架切换到 Sa-Token + CurrentUser 门面层** | 已采纳 |
| [0006](docs/adr/0006-canonical-reference质量规范.md) | canonical reference 代码质量规范（P0 六维度 + P1 五维度） | 已采纳 |
| [0007](docs/adr/0007-继承遗产前先问原生哲学.md) | **继承遗产前先问新技术栈的原生哲学**（元方法论，方案 E 数据权限重构的触发点） | 已采纳 |
| [0008](docs/adr/0008-flyway-migration命名用时间戳.md) | **Flyway migration 命名从数字分段切换到时间戳**（ADR-0007 元方法论的第二次落地 + "一致性 > 局部优化"次级元原则） | 已采纳 |

**新增 ADR 的时机**：任何翻转既有决策、引入新架构概念、或修订规划文档的行为，都应该先写 ADR 再改代码/specs。

---

## AI 必须遵守的硬约束

后端的 17 条 MUST NOT + 1 条元方法论 + 15 条 MUST 完整列表、防御机制、规则代码位置，统一维护在：

→ **[后端硬约束反向索引](docs/specs/backend/README.md#后端硬约束反向索引)**

CLAUDE.md 不重复维护具体规则条目——`backend/README.md` 是后端的单一入口和反向索引，任何后端文档结构变化由 README.md 吸收，CLAUDE.md 零感知。

<!-- 以下原 16 条 MUST NOT + 11 条 MUST 表已迁移到 backend/README.md 反向索引节，删除以保持 CLAUDE.md 索引式结构 -->

### 前端 MUST / MUST NOT

`[M0 frontend-architecture.md 未写，此小节待补。暂时遵循规划文档决策 3-6]`

---

## 新增业务模块快速链接

**要加一个 `business-xxx` 业务模块？** 跳转到 [backend/README.md → 03-platform-modules.md §5 新增业务模块的完整操作流程（12 步清单）](docs/specs/backend/README.md#子文档导航)。

这一节包含：
- 目录和 pom.xml 模板
- Flyway SQL 命名规范
- Repository / Service / Controller 的标准骨架
- 集成测试模板
- 权限点登记步骤
- `mvn verify` 验证链路

---

## 语言规则

| 场景 | 语言 |
|------|------|
| 文档、注释、commit message | **中文** |
| 代码（变量、类名、方法名） | **英文** |
| Java 包命名 | 英文 `com.metabuild.<layer>.<domain>` |
| TypeScript 标识符 | 英文 camelCase |
| 错误码 key | 英文 camelCase，`<module>.<resource>.<error>` 格式（例：`iam.user.notFound`） |
| Flyway SQL 文件名 | 英文 snake_case，`V<yyyymmdd>_<nnn>__<module>_<table>.sql` 时间戳格式（ADR-0008） |
| 用户可见的 UI 文案 | 默认中文 + i18n 英文（Accept-Language 识别） |

---

## 已知限制（v1 阶段）

- **单实例默认**：v1 默认单实例部署。多实例需改用 Redis 限流 / MinIO 存储 / ShedLock + 避免 WebSocket（见 §10.7）
- **不做多租户**：v1 预留 `tenant_id` 字段，完整多租户路由推迟到 v1.5
- **不做消息队列**：v1 模块间异步用 Spring 原生 `@EventListener + @Async`，Kafka/RabbitMQ 推迟到 v1.5+
- **不做分布式事务 / 微服务**：v1 是模块化单体
- **不支持 SSO/LDAP/OIDC**：v1 用 Sa-Token，需要企业 SSO 时切换到 Spring Security（切换成本约半天，见 ADR-0005）
- **Spec 引擎推迟到 v1.5**：v1 手写 canonical reference（notice/order/approval）作为反向提炼样本
- **AI 运行时能力（ai-core）推迟到 v1 之后**：v1 先把底座跑通

---

## 维护约定（防 drift 铁律）

| 场景 | 正确做法 |
|------|---------|
| 要修改后端架构 | 先改 [backend/](docs/specs/backend/README.md) 下对应子文件 或写新 ADR，再改代码 |
| 要翻转既有决策 | 写新 ADR，**不改规划文档原文**，后续文档以新 ADR 为准 |
| 要加新 MUST/MUST NOT | 先在 backend/ 对应子文件加章节 + ArchUnit 规则，再补到 [backend/README.md 反向索引](docs/specs/backend/README.md#后端硬约束反向索引)；**CLAUDE.md 不动**（已只索引 backend/README.md） |
| 要改 CLAUDE.md | **只改顶层导航和指针**，不要塞架构细节（详情放 specs） |
| 发现文档-代码 drift | **立即修正**，不允许"等下次一起改"——nxboot 的反面教材 |
| 每完成一个 milestone | 回补 `[M1 时补]` / `[M4 时补]` 占位 + 更新本文档"当前阶段"表格 |

---

## 常用命令

`[M1 脚手架完成后填充具体命令]` 。规划中的命令链路（等 M1 有代码后能跑）：

```bash
# 后端构建 + 全部测试（单元 + 集成 + ArchUnit）
cd server && mvn verify

# 重新生成 jOOQ schema 类型（改完 Flyway migration 后）
cd server && mvn -Pcodegen generate-sources -pl mb-schema

# 启动 Spring Boot 应用
cd server && mvn spring-boot:run -pl mb-admin

# 只跑 ArchUnit 架构测试
cd server && mvn -pl mb-admin test -Dtest=ArchitectureTest

# 前端开发
cd client && pnpm install && pnpm -C apps/web-admin dev

# 前端类型检查（验证 @mb/api-sdk 契约一致）
cd client && pnpm -C apps/web-admin tsc --noEmit
```

---

## 反面教材速览（详见 [backend/README.md 后端硬约束反向索引](docs/specs/backend/README.md#后端硬约束反向索引)）

从 nxboot 踩过的坑提炼出 15 条坑 + meta-build 扩展 2 条 + 1 条元方法论（ADR-0007），MUST NOT 共 17 条。前 7 条最致命：

1. **文档-代码 drift**（nxboot CLAUDE.md 描述了 7 个 shared/components 在磁盘是空目录）→ 本文档索引式 + 每章 verify 块
2. **opt-in 安全模式**（DataScope 忘加注解就静默泄漏）→ **方案 E**：`DataScopeVisitListener` 在 jOOQ SQL 构建层单点拦截 + 零 Repository 基类 + `DataScopeRegistry` 集中声明（详见 ADR-0007）
3. **jOOQ 泄漏到 Service 层**（50 个文件混写 SQL）→ ArchUnit 强制隔离
4. **全量缓存失效**（`allEntries=true` 规模大了形同虚设）→ ArchUnit 禁用
5. **R<T> 200 OK 包装**（HTTP 语义破坏）→ 换 ProblemDetail + 业务对象直接返回
6. **认证框架耦合业务层**（Spring Security/Sa-Token 到处是）→ `CurrentUser`（读）+ `AuthFacade`（写）双门面 + ArchUnit 隔离
7. **继承惯性把 nxboot 的基类范式搬到 jOOQ 世界**（原方案保留 `DataScopedRepository` 基类是 MyBatis-Plus 习惯的残留）→ **ADR-0007 元方法论**：继承遗产前先问新技术栈的原生哲学

---

## 文档索引

| 文档 | 用途 | 状态 |
|------|------|------|
| [meta-build规划_v1_最终对齐.md](meta-build规划_v1_最终对齐.md) | v1 阶段的 17 项决策 ground truth 基线 | 定稿 |
| [docs/specs/backend/README.md](docs/specs/backend/README.md) | **后端设计入口**（9 子文件 + 反向索引；4000+ 行，已从单文件拆分） | **定稿** |
| [docs/specs/frontend/README.md](docs/specs/frontend/README.md) | 前端设计入口（占位，M0 待写） | **M0 待写** |
| [docs/adr/](docs/adr/) | 架构决策记录（8 份） | 定稿 |
| [docs/日志/](docs/日志/) | 每日工作日志 | 持续更新 |

---

## 最近一次大修

- **日期**: 2026-04-11
- **内容**:
  1. M0 后端架构文档定稿 + ADR-0003/0004/0005/0006 落盘
  2. 三处 drift 修复（A1 AuthFacade 门面 / A2 方案 E 数据权限重构 / A3 文案）+ ADR-0007 落盘
  3. **后端设计文档拆分**：`backend-architecture.md`（4071 行单文件）→ `docs/specs/backend/` 9 个子文件 + README 反向索引；CLAUDE.md 改为只索引 backend/README.md
  4. **附录 A 借用清单按 ADR-0007 三问审查**（N1 任务）：16 条借用清单拆为"总表 + 三问详解"两层结构，修复 `JooqHelper.dataScopeFilter()` 的方案 E drift
  5. **Flyway migration 命名切换到时间戳**（ADR-0008 落盘）：撤销 V50-V89 数字分段方案，改为 `V<yyyymmdd>_<nnn>__<module>_<table>.sql`。ADR-0007 元方法论的第二次落地 + 引入"一致性 > 局部优化"次级元原则
  6. **配置管理完整版落盘**(M1.1 任务):后端新增独立配置管理章节(~730 行,见 [backend/README.md](docs/specs/backend/README.md) 子文档导航),覆盖前缀策略(原生优先 + `mb.*` 自建)、70+ env var 完整清单(11 组)、profile 分层(dev/test/prod)、`@ConfigurationProperties` 规范、fail-fast 三层防护、敏感配置 `toString()` 覆盖 ArchUnit、AI 协作 checklist
  7. **密码与账户安全规范落盘**(M4.1 任务):后端 05-security.md 追加 §8 "密码与账户安全"章节(~450 行)——密码哈希选型 `spring-security-crypto` + bcrypt strength=12(不违反 ADR-0005 的 ArchUnit 精确规则)、可配置密码策略 `mb.iam.password.*`、Redis 账户锁定、Redis 一次性忘密 token + 防 email enumeration、首次登录强制改密、`AuthFacade.kickoutAll` 扩展、完整 AuthService 代码骨架、v1.5+ 预留(2FA/zxcvbn/异常登录)
  8. **jOOQ 横切关注点全面原生化**(M4.2 任务):04-data-persistence.md 新增 §8.5-§8.8 四节(~430 行)——乐观锁 / updated_at / created_by / updated_by 全部走 jOOQ 原生 Settings + RecordListener；JooqHelper 从静态工具聚合类重构为 @Component 二元路径（单条 Record / 批量+条件 helper）；4 条 ArchUnit 硬规则锁死业务层写操作入口（见 [backend/README.md](docs/specs/backend/README.md)）；**软删除完全去除**（schema 清理 deleted 字段）；新增 `CurrentUser.userIdOrSystem()` + `SYSTEM_USER_ID = 0L` 支持无认证上下文的审计填充。ADR-0007 元方法论第三次应用样本。
  9. **分页查询保护性约束落盘**(M4.3 任务):`mb-common.pagination` 包新增 `PageQuery` / `PageResult<T>` / `SortParser`（Builder 风格，`forTable` 约定 + `allow` 显式白名单）；`infra-exception` 模块新增 `MbApiPaginationProperties` + `PageQueryArgumentResolver`（Spring MVC 自动解析，Controller 零样板）；配置项 `mb.api.pagination.{default-size=20, max-size=200}`；未指定 sort 时默认 `created_at DESC`；6 组文档落地（06 分页契约章节 / 04 jOOQ 分页模板 / 09 配置项 / appendix 术语表 / README 阅读路径 / CLAUDE.md 最近大修）。
  10. **Domain Model 规范 + 职责划分 + 编码风格契约**（N3+C2 合并任务）：01-module-structure.md 新增 §4 Domain Model 与层次职责（~370 行：11 类清单 + Controller/Service/Repository 职责表 + 包结构约定 + 典型代码示例 + 编排 Service 拆分原则 + DTO 命名后缀表）；**修复 §8.5.4 drift**（Service 不再直接持有 DSLContext，通过 repository.save() 走 M4.2 原生路径）；**修复权限注解位置 drift**（05-security.md §8 两处 @RequirePermission 从 Service 方法移到对应的 Controller 层示例，新增 §2.5 位置规范节）；08-archunit-rules.md 新增"N3 精化规则"章节（DSLCONTEXT_ONLY_IN_REPOSITORY + SERVICE_MUST_NOT_USE_JOOQ_DSL 两条新规则）和"编码风格契约 [M4]"章节（7 条硬规则：record / @RequiredArgsConstructor / 禁 MapStruct / virtual thread 关闭 / Optional 限制 / enum 状态 / jakarta.annotation.Nullable + M4 实施 checklist）；appendix.md 术语表补充 View/Command/Query/Event/ModuleApi/编排 Service 条目；README 反向索引补充 MUST NOT #17 和 MUST #12-14；verify-docs.sh 新增 §4.7 N3 关键词检查和 §4.8 C2 关键词检查。ADR-0007 元方法论第四次应用样本。
- **下一次**: frontend-architecture.md 完成时，或 M1 脚手架完成时
