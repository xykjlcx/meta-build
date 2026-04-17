# Meta-Build（元构）— AI 时代的可定制全栈技术底座

> **这是一份 AI 契约文档**。AI 和人类读这份文档都能在 3 分钟内理解 meta-build 的全貌，并找到任何细节的准确位置。
>
> **核心原则：索引而不是细节**。具体设计见 `docs/specs/`，决策原因见 `docs/adr/`，规划路线见 `docs/meta-build规划_v1_最终对齐.md`。CLAUDE.md 不重复任何细节——**改架构修 specs，不修 CLAUDE.md**，避免文档-代码 drift。

---

## 一句话定位

meta-build = **给 AI 执行的不可动摇的契约**（后端稳定 + 前端千人千面）。使用者用自己的 AI 改代码，约束由 ArchUnit + Maven + TypeScript strict 守护，AI 越界即编译失败或测试失败。

## 终极目标

> **人定义规则，AI 执行一夜，第二天验收。基于这个底座，一周内上线一个 B 端系统。**

具体工作模式：

1. **人输入 Spec + TDD 验收条件**（1-2 小时）：用结构化 YAML 定义业务模型（ER 关系 + 状态机 + 页面布局 + 权限矩阵），同时定义集成测试验收标准
2. **Spec 引擎确定性生成骨架**（~70%）：DDL + Repository + Service + Controller + DTO + 前端页面 + 测试骨架，全部自动生成到 `generated/` 目录
3. **AI 循环引擎无人值守执行**（~20%）：在骨架之上实现业务逻辑，TDD 测试验证 → 不通过 → AI 修正 → 再验证，MB 约束层全程守护
4. **人验收 + 最后一公里**（~10%）：处理复杂业务规则、UI 微调、集成对接

**一切架构设计都服务于这个目标**——ArchUnit 约束是为了让 AI 不破坏架构，12 步清单是为了让 Spec 引擎有模式可循，canonical reference 是为了反向提炼 Spec 引擎的输入格式，经验库是为了让系统越用越准。

详细方案见：[Meta-Build 愿景与技术方案](docs/vision/Meta-Build愿景与技术方案-AI驱动的异步开发体系.md)（v1.5+ 实施）

## 核心哲学

1. **给 AI 执行的契约**：每一条"正确的事"都有工具拦截违反（ArchUnit 规则 / Maven pom 隔离 / TypeScript strict / `<!-- verify: -->` 可执行验证块）
2. **千人千面的前端**：L1 CSS 变量 + Style Registry + Layout Resolver 换壳定制，覆盖 80% 定制场景
3. **后端硬骨头 + 前端柔皮肤**：业务层零感知技术细节（`CurrentUser` / `AuthFacade` 门面 / `DataScopeVisitListener` jOOQ 层单点拦截数据权限 / `@RequirePermission` 自定义注解）
4. **不追新、不过度工程化**：技术栈选成熟方案；功能加到刚好够用即止
5. **反面教材先行**：nxboot 踩过的 15 条坑 + 1 条元方法论全部在 [backend/README.md 反向索引](docs/specs/backend/README.md#后端硬约束反向索引) 集中索引，meta-build 从第一天用工具拦截

---

## 当前阶段

| Milestone | 内容 | 状态 |
|-----------|------|-----|
| **M0** | 文档对齐（规划 + backend specs + frontend specs + CLAUDE.md） | ✅ 已定稿 |
| **M1** | 项目脚手架 + CI + 基础设施 | ✅ 已完成 |
| **M2** | 前端 L1 主题系统 + L2 原子组件（42 个 shadcn/ui v4） | ✅ 已完成 |
| **M3** | 前端 L3 业务组件 + L4 壳层 + L5 路由 + api-sdk | ⚠️ 架构就位 / 下班信号未达成（user 模块骨架未做，详见 [frontend-gap-analysis.md](docs/handoff/frontend-gap-analysis.md)） |
| **M4** | 后端底座 + 8 平台模块 + 契约驱动 | ⚠️ 后端已完成 / 前后端联调下班信号未达成（8 平台模块前端 0 页面） |
| **M5** | canonical reference（business-notice） | ✅ 已完成（canonical reference + SSE + 4 通知渠道 + UI 打磨；order/approval 未启动） |
| M6 | 验证层完整版 + 主题样本库 | ⏸ 待开始 |
| M7 | 开源准备 | ⏸ 待开始 |

## 阅读路径（按角色）

| 我是谁，要做什么 | 读什么 |
|---------------|------|
| **AI，要写业务代码** | [backend/README.md 阅读路径表](docs/specs/backend/README.md#阅读路径按角色) → [03-platform-modules.md §5 新增业务模块 12 步清单](docs/specs/backend/03-platform-modules.md) |
| **AI，要改前端视觉** | [frontend/README.md 阅读路径表](docs/specs/frontend/README.md) → L1 `@mb/ui-tokens` |
| **人类开发者，要贡献代码** | 规划文档 → [backend/README.md](docs/specs/backend/README.md) → 本文档的"AI 硬约束"小节 |
| **想理解某个决策** | `docs/adr/` 目录 |
| **使用者，想用 meta-build 定制自己的管理后台** | [frontend/09-customization-workflow.md](docs/specs/frontend/09-customization-workflow.md)（前端定制）→ [backend/03-platform-modules.md §5 12 步清单](docs/specs/backend/03-platform-modules.md)（后端加模块） |
| **想知道项目全貌** | 本文档（CLAUDE.md）5 分钟读完 |

---

## 架构一图概览

```
meta-build/
├── client/                          # 前端（5 层 pnpm workspace）
│   ├── packages/
│   │   ├── ui-tokens/               # L1 Design tokens + Style Registry + ColorMode + Customizer CSS 维度
│   │   ├── ui-primitives/           # L2 原子组件（42 个 shadcn/ui v4 原版 + Sonner）
│   │   ├── ui-patterns/             # L3 业务组件（8 个：NxTable/NxForm/NxFilter/NxDrawer/NxLoading/NxBar/ApiSelect/NxTree）
│   │   ├── app-shell/               # L4 Layout Resolver + Preset Registry + Provider 树 + i18n + 认证门面 + 菜单
│   │   └── api-sdk/                 # HTTP 客户端 + 拦截器（M3 手写，M5 切 OpenAPI 生成）
│   ├── apps/
│   │   └── web-admin/               # L5 TanStack Router 文件路由 + 业务页面 + MSW mock
│   └── scripts/                     # 质量脚本（check-i18n / check-business-words / check-env-example 等）
│
├── server/                          # 后端（6 层 Maven multi-module）
│   ├── mb-common/                   # 零 Spring 工具（异常基类、Snowflake ID、PageResult）
│   ├── mb-schema/                   # ★ 数据库契约层（Flyway SQL + jOOQ 生成代码，ADR-0004）
│   ├── mb-infra/                    # 基础设施（11 个子模块：security/cache/jooq/exception/captcha/...）
│   ├── mb-platform/                 # 平台业务（8 个子模块：iam/log/file/notification/...）
│   ├── mb-business/                 # ★ 使用者扩展位 + M5 canonical reference（ADR-0004）
│   └── mb-admin/                    # Spring Boot 启动入口 + 集成测试 + ArchUnit 测试
│
├── docs/
│   ├── specs/                       # 架构设计规范
│   │   ├── backend/                 # 后端完整设计（9 子文件 + README + appendix，~4200 行总量）
│   │   └── frontend/                # 前端完整设计（12 子文件 + README + appendix）
│   ├── adr/                         # 架构决策记录（14 份）
│   ├── handoff/                     # Milestone 交接文档（m1~m5 complete + m2-shadcn-upgrade-supplement + frontend-gap-analysis）
│   ├── rules/                       # 项目规则库（pitfall + playbook，持续积累）
│   └── 日志/                        # 每日工作日志
│
├── docs/meta-build规划_v1_最终对齐.md # ground truth 基线（17 项决策）
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
| JVM / 框架 | JDK 21 + Spring Boot 3.5.3 |
| 数据访问 | jOOQ 3.19+ + PostgreSQL 16 + Flyway 10+ |
| 认证 | **Sa-Token 1.39.x + `CurrentUser` 门面层 + `@RequirePermission` 自定义注解**（ADR-0005） |
| 模块边界 | **Maven pom 隔离 + ArchUnit 双保险**（ADR-0003，已移除 Spring Modulith） |
| 响应格式 | RFC 9457 ProblemDetail（错误）+ 业务对象直接返回（成功）+ PageResult（分页） |
| 缓存 | Redis + CacheEvictSupport（afterCommit 失效） |
| 可观测性 | Actuator + Micrometer + Logback JSON encoder |
| 测试 | JUnit 5 + Testcontainers + ArchUnit + MockCurrentUser |
| 契约驱动 | springdoc → OpenAPI 3.1 → @mb/api-sdk（TypeScript） |

### 前端（详见 [frontend/README.md](docs/specs/frontend/README.md)）

| 维度 | 选型 |
|------|------|
| 基础 | React 19 + TypeScript strict + Vite |
| 路由 | TanStack Router v1（文件路由 + routeTree.gen.ts + 完全类型推导） |
| 数据 | TanStack Query v5 |
| UI | **shadcn/ui v4 原版** + `radix-ui` 统一包 + Tailwind CSS v4 + CVA（源码在 `@mb/ui-primitives`） |
| Toast | **Sonner**（替代 Radix Toast，命令式 `toast()` + `<Toaster />`） |
| 表格/表单 | TanStack Table v8 + React Hook Form + Zod（封装在 L3 `@mb/ui-patterns`） |
| i18n | react-i18next + i18next（zh-CN 默认 + en-US，全量加载） |
| HTTP 客户端 | `@mb/api-sdk`（原生 fetch + 4 拦截器，M5 切 OpenAPI 生成） |
| 测试 | Vitest（274 tests：L2 197 + L3 55 + api-sdk 22）+ Storybook 8 + Playwright 19 E2E |
| 代码质量 | Biome + Stylelint + dependency-cruiser（7 条规则） |

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
| [0009](docs/adr/0009-表前缀sys改mb.md) | **平台表前缀从 sys_ 切换到 mb_** | 已采纳 |
| [0010](docs/adr/0010-审计日志改操作日志.md) | **v1 用操作日志替代审计日志**（platform-audit → platform-oplog，@Audit → @OperationLog） | 已采纳 |
| [0011](docs/adr/0011-version字段按需添加.md) | **version 字段按需添加**（不再强制所有表） | 已采纳 |
| [0012](docs/adr/0012-全局时间策略clock-bean.md) | **全局时间策略**（Clock Bean + 文档引导） | 已采纳 |
| [0013](docs/adr/0013-oplog改名platform-log加注解下沉.md) | **platform-oplog → platform-log + @OperationLog 下沉 mb-common** | 已采纳 |
| [0014](docs/adr/0014-sse-替代-websocket-实时推送.md) | **SSE 替代 WebSocket 作为 v1 实时推送方案** | 已采纳 |
| [0015](docs/adr/0015-分页契约拆分为请求dto与内部query.md) | **分页契约拆分为 PageRequestDto + PaginationPolicy + PageQuery** | 已采纳 |
| [0016](docs/adr/0016-前端主题系统从theme切换到style加color-mode与customizer.md) | **前端主题系统从 Theme 切换到 Style + ColorMode + Customizer** | 已采纳 |
| [0017](docs/adr/0017-app-shell从固定布局切换到layout-resolver加preset-registry.md) | **App Shell 从固定布局切换到 Layout Resolver + Preset Registry** | 已采纳 |
| [0018](docs/adr/0018-废弃compact主题改为style加customizer维度组合.md) | **废弃 Compact 主题，改为 Style + Customizer 维度组合** | 已采纳 |

**新增 ADR 的时机**：任何翻转既有决策、引入新架构概念、或修订规划文档的行为，都应该先写 ADR 再改代码/specs。

---

## AI 必须遵守的硬约束

后端的 18 条 MUST NOT + 1 条元方法论 + 16 条 MUST 完整列表、防御机制、规则代码位置，统一维护在：

→ **[后端硬约束反向索引](docs/specs/backend/README.md#后端硬约束反向索引)**

CLAUDE.md 不重复维护具体规则条目——`backend/README.md` 是后端的单一入口和反向索引，任何后端文档结构变化由 README.md 吸收，CLAUDE.md 零感知。

<!-- 以下原 16 条 MUST NOT + 11 条 MUST 表已迁移到 backend/README.md 反向索引节，删除以保持 CLAUDE.md 索引式结构 -->

### 前端 MUST / MUST NOT

前端的 MUST / MUST NOT 完整列表、防御机制统一维护在：

→ **[前端硬约束反向索引](docs/specs/frontend/README.md#前端硬约束反向索引)**

CLAUDE.md 不重复维护具体规则条目——`frontend/README.md` 是前端的单一入口和反向索引，任何前端文档结构变化由 README.md 吸收，CLAUDE.md 零感知。

---

## 新增业务模块快速链接

**要加一个 `business-xxx` 业务模块？** 跳转到 [backend/README.md → 03-platform-modules.md §5 新增业务模块的完整操作流程（12 步清单）](docs/specs/backend/README.md#子文档导航)。

这一节包含：
- 目录和 pom.xml 模板
- Flyway SQL 命名规范
- Repository / Service / Controller 的标准骨架
- 集成测试模板
- 权限点登记步骤
- `./mvnw verify` 验证链路

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

- **单实例默认**：v1 默认单实例部署。多实例需改用 Redis 限流 / 阿里云 OSS 存储 / ShedLock + 避免 WebSocket（见 §10.7）
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
| 每完成一个 milestone | 回补 `[M1 时补]` / `[M4 时补]` 占位 + 更新本文档"当前阶段"表格 + 规则库健康度检查 |
| 写项目日志 | 末尾必须包含"规则库复盘"区域（见下方模板） |

**项目日志"规则库复盘"模板**（每篇日志末尾必须包含）：

```markdown
## 规则库复盘

### 已有规则执行情况
- 本次涉及哪些 rules？是否遵守？违反了哪条？
（没涉及则写"无"）

### 新增规则候选
- 有没有新发现值得沉淀？（pitfall 或 playbook）
（没有则写"无"）

### 已有规则修正
- 有没有已有规则需要修正、合并或归档？
（没有则写"无"）
```

---

## 规则库（`docs/rules/`）

项目级经验沉淀，工具无关。完整索引、frontmatter 规范、生命周期管理见 [`docs/rules/INDEX.md`](docs/rules/INDEX.md)。

**两种类型**：
- **pitfall**（踩坑经验）：防重犯。格式：规则 → Why（事件+日期） → How to apply
- **playbook**（正面经验）：可复用的操作模式。格式：模式 → 适用场景 → 具体步骤

**当前规则**（9 pitfall + 2 playbook，按场景分类见 INDEX.md）：

| 规则文件 | type | scope | 一句话 |
|---------|------|-------|-------|
| `adr-before-code.md` | pitfall | 流程 | 翻转决策必须先写 ADR 再改代码，不允许补写 |
| `verify-block-discipline.md` | pitfall | 流程 | specs 新增约束必须同步新增 verify 块 + 扩展 verify-docs.sh |
| `cross-review-residual-scan.md` | pitfall | 流程 | 批量替换后 grep 归零（含文档，因为文档=AI 的 prompt）+ 多 agent 并行后交叉审查 |
| `plan-code-snippets-must-verify.md` | pitfall | 流程 | AI 跨文件引用必须 grep 验证（置信度陷阱：AI 自信写出不存在的东西） |
| `multi-perspective-review.md` | playbook | 流程 | 多视角审查角色清单（specs 4 维度 / 走查 7 角色），含验证过的分工方案 |
| `frontend-backend-joint-check.md` | pitfall | 全栈 | 改了 API 契约相关内容必须联查对端 specs |
| `template-propagation-risk.md` | pitfall | 全栈 | 模板 bug 会被 AI 在 N 个业务模块中批量复制，修复成本 O(n) |
| `plan-review-before-execution.md` | playbook | 流程 | 计划写完禁止直接编码，必须先 Review（Codex 对抗审查 / 多角色 Review） |
| `orval-hooks-over-handwritten.md` | pitfall | 前端 | 优先用 orval hooks，手写 API 调用必须交叉验证路径和响应类型 |
| `msw-handler-sync.md` | pitfall | 前端 | 新增前端页面必须同步补全 MSW mock handler，防穿透 401 |
| `radix-no-empty-value.md` | pitfall | 前端 | Radix Select/RadioGroup 禁止空字符串 value，用 "ALL" 占位 |

**维护约定**：
- **做事前**：扫 INDEX.md 的 triggers 列，匹配到就读对应规则
- **做事后**：发现新坑或验证了好的操作模式，主动写入并更新 INDEX.md
- **写入标准**：能防止未来同类错误的具体经验 / 能复用的操作模式，不是泛泛的原则
- **命名规范**：语义化英文短横线连接（如 `adr-before-code.md`），不用日期前缀
- **归档**：已被工具化守护（ArchUnit/CI/编译器）的规则，移到 `rules/archive/`
- **升级**：同一条规则被违反 ≥2 次、或可用确定性逻辑表达 → 升级为 MUST + 工具守护，原文件归档
- **清理**：每个 milestone 完成时 review 全部规则的时效性

---

## 常用命令

```bash
# === 前端开发 ===
cd client && pnpm install                                 # 安装依赖
cd client && pnpm dev                                     # dev server（localhost:5173 + MSW mock）
cd client && pnpm build                                   # 生产构建

# === 前端测试 ===
cd client && pnpm test                                    # 全量测试（274 tests）
cd client && pnpm -F @mb/ui-primitives test               # L2 测试（197 tests）
cd client && pnpm -F @mb/ui-patterns test                 # L3 测试（55 tests）
cd client && pnpm -F @mb/api-sdk test                     # api-sdk 测试（19 tests）

# === 前端质量检查（12 项，CI 等效）===
cd client && pnpm build                                   # 生产构建
cd client && pnpm check:types                             # TypeScript 类型检查（全包）
cd client && pnpm test                                    # 单元测试
cd client && pnpm check:theme                             # 主题完整性（3 × 54 token）
cd client && pnpm check:i18n                              # i18n 双语 key 一致性
cd client && pnpm check:business-words                    # L3 业务词汇扫描
cd client && pnpm lint                                    # Biome 代码检查
cd client && pnpm lint:css                                # Stylelint CSS 检查
cd client && pnpm check:deps                              # 依赖方向检查（7 条规则）
cd client && pnpm check:env                               # 环境变量 .env.example 一致性

# === shadcn CLI（必须带 -c 指向 L2 包）===
pnpm dlx shadcn@latest info --json -c client/packages/ui-primitives  # 项目配置
pnpm dlx shadcn@latest add <name> -c client/packages/ui-primitives   # 安装原子组件到 L2
pnpm dlx shadcn@latest view <name>                                   # 查看组件源码（不安装，当参考）
pnpm dlx shadcn@latest docs <name>                                   # 获取组件文档和示例 URL
pnpm dlx shadcn@latest search <query>                                # 搜索注册表

# === Storybook ===
cd client && pnpm storybook                               # L2 Storybook（localhost:6006）
cd client && pnpm -F @mb/ui-patterns storybook            # L3 Storybook（localhost:6007）

# === 后端 ===
cd server && ./mvnw verify                                # 全量构建 + 测试
cd server && ./mvnw -Pcodegen generate-sources -pl mb-schema  # jOOQ codegen
cd server && ./scripts/verify-and-run-admin.sh            # 正式启动：admin 依赖闭包 verify 后再启动
cd server && SERVER_PORT=18080 ./scripts/verify-and-run-admin.sh  # 临时改端口启动
cd server && ./mvnw -pl mb-admin test -Dtest=ArchitectureTest # ArchUnit 测试

# === Docker ===
docker compose up -d                                      # PG(15432) + Redis(16379)
```

---

## 反面教材速览（详见 [backend/README.md 后端硬约束反向索引](docs/specs/backend/README.md#后端硬约束反向索引)）

从 nxboot 踩过的坑提炼出 15 条坑 + meta-build 扩展 3 条 + 1 条元方法论（ADR-0007），MUST NOT 共 18 条。前 7 条最致命：

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
| [meta-build规划_v1_最终对齐.md](docs/meta-build规划_v1_最终对齐.md) | v1 阶段的 17 项决策 ground truth 基线 | 定稿 |
| [docs/specs/backend/README.md](docs/specs/backend/README.md) | **后端设计入口**（9 子文件 + 反向索引；4000+ 行，已从单文件拆分） | **定稿** |
| [docs/specs/frontend/README.md](docs/specs/frontend/README.md) | **前端设计入口**（12 子文件 + 反向索引 + appendix） | **定稿** |
| [docs/adr/](docs/adr/) | 架构决策记录（14 份） | 定稿 |
| [docs/handoff/](docs/handoff/) | **Milestone 交接文档**（m1-complete / m2-complete / m2-shadcn-upgrade-supplement / m3-complete / m4-complete / m5-complete / frontend-gap-analysis） | 持续更新 |
| [docs/日志/](docs/日志/) | 每日工作日志 | 持续更新 |
| [docs/rules/](docs/rules/) | **项目规则库**（pitfall + playbook，持续积累） | 持续更新 |

---

## 最近一次大修

- **日期**: 2026-04-15
- **内容**:
  1. **M5 Plan A**：business-notice 后端（CRUD + 状态机 + 权限 + XSS 防护 + Excel 导出 + 31 集成测试）+ OpenAPI 生成 + orval 管线
  2. **M5 Plan B**：infra-sse（连接管理 + 心跳 + force-logout + Bucket4j 限流）+ 多渠道通知系统（IN_APP/EMAIL/WECHAT_MP/WECHAT_MINI）+ 2 DDL + 18 测试
  3. **M5 Plan C**：Notice 前端全量（列表/编辑/详情 + SSE 集成 + NotificationBadge + 微信绑定页 + dep-cruiser + CI + 19 E2E）
  4. **Notice UI 打磨**：列表页筛选面板式重写 + 编辑全屏 Dialog 双栏 + 详情页 Card 重构
  5. **3 轮 Review**：计划 Review（7C+15I）→ 中期 Review → 最终 Review（2 运行时 bug 修复）
- **上一次**: 2026-04-14（M4 后端底座）
- **下一次**: 补完 M3/M4 前端缺口（8 平台模块页面）→ M6 定义（见 [frontend-gap-analysis.md](docs/handoff/frontend-gap-analysis.md)）
