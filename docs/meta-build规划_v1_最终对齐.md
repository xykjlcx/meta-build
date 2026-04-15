# Meta-Build(元构)— AI 时代的可定制全栈技术底座

> 本文档是 v1 阶段所有技术决策对齐后的完整规划。
> 与桌面上的 `新项目规划_v1.md`(已过时)的关系:本文档替换前者,反映 17 项最新决策。
> 时间基线:2026-04-10

---

> ## ⚠️ 已翻转决策对照表(2026-04-11 后续补充)
>
> 本规划文档冻结在 2026-04-10,作为 v1 决策历史基线保留,**正文永不修改**。以下决策已被后续 ADR 翻转,请以 `CLAUDE.md` 和对应 ADR 为准:
>
> | 本文档原决策 | 当前真相 | 翻转来源 |
> |---|---|---|
> | 决策 8:Spring Modulith + ArchUnit 双保险 | Spring Modulith **已移除**,改纯 Maven pom 白名单 + ArchUnit 双保险 | [ADR-0003](docs/adr/0003-移除spring-modulith保留archunit单保险.md) |
> | 决策 10/11 命名:`mb-framework` / `mb-system` | 改名为 `mb-infra` / `mb-platform` | [ADR-0002](docs/adr/0002-后端模块命名framework改infra-system改platform.md) |
> | 决策 2 目录树:4 层 Maven(common/framework/system/admin) | **6 层**:common / **schema** / infra / platform / **business** / admin | [ADR-0004](docs/adr/0004-新增mb-schema数据库契约层.md) |
> | 决策 4 认证:Spring Security + JJWT 双 token | **Sa-Token 1.39.x** + `CurrentUser`(读)+ `AuthFacade`(写)双门面层 | [ADR-0005](docs/adr/0005-认证框架切换到sa-token加currentuser门面层.md) |
> | 决策 9 DataScope 修复:"Repository 基类 + VisitListener 双保险" | **方案 E**:零基类,`DataScopeVisitListener` 单点拦截 + `DataScopeRegistry` 集中声明 + `NO_RAW_SQL_FETCH` ArchUnit 兜底 | [ADR-0007](docs/adr/0007-继承遗产前先问原生哲学.md) |
> | M1 里程碑:"Spring Modulith 包结构 + verify() 测试" | 此项作废,替换为 ArchUnit 3 条启动规则 | ADR-0003 |
> | M4 里程碑:"mb-common / mb-framework / mb-system / mb-admin 四层" | 应为 6 层 + 所有子模块相应改名 | ADR-0002 + ADR-0004 |
> | 表前缀 `sys_*`(L297 `sys_menu`、L497 `sys_user/sys_role/sys_menu`) | 改为 `mb_*`(`mb_iam_user / mb_iam_role / mb_iam_menu` 等) | [ADR-0009](docs/adr/0009-表前缀sys改mb.md) |
> | platform 模块 `audit`(L388,业务审计日志/操作日志) | 改名为 `platform-log`,注解 `@Audit` 改为 `@OperationLog` 并下沉到 `mb-common` | [ADR-0010](docs/adr/0010-审计日志改操作日志.md) + [ADR-0013](docs/adr/0013-oplog改名platform-log加注解下沉.md) |
> | infra 模块 `websocket`(L379) | v1 改为 `infra-sse`,用 SSE 单向推送替代 WebSocket 双向通信;`infra-websocket` 目录保留空占位 | [ADR-0014](docs/adr/0014-sse-替代-websocket-实时推送.md) |
> | Flyway 脚本组织(L682 开放讨论"V1_1__iam 还是 V20260410_001") | 统一采用时间戳命名:`V<yyyymmdd>_<nnn>__<module>_<table>.sql` | [ADR-0008](docs/adr/0008-flyway-migration命名用时间戳.md) |
>
> 此外增补了以下新 ADR(未翻转既有决策,仅补充规范):
> - [ADR-0001](docs/adr/0001-m0-文档从7份收敛到3份.md):M0 文档从 7 份收敛到 3 份
> - [ADR-0006](docs/adr/0006-canonical-reference质量规范.md):canonical reference 代码质量规范(P0 六维度 + P1 五维度)
> - [ADR-0011](docs/adr/0011-version字段按需添加.md):`version` 字段按需添加(不强制所有表)
> - [ADR-0012](docs/adr/0012-全局时间策略clock-bean.md):全局时间策略(Clock Bean + OffsetDateTime + DDL TIMESTAMPTZ)
>
> **维护约定**:本对照表在新增 ADR 翻转既有决策时同步更新;规划文档正文永不修改。详见 `CLAUDE.md` 的"维护约定"小节。
>
> **当前 ADR 总数**:14 份(0001-0014)。**以 `docs/adr/` 和 `CLAUDE.md` 的当前状态为准。**

---

## Context

**元构(meta-build)** 是一个全新项目,目标是打造一个**AI 可执行的可定制全栈技术底座**,让使用者能通过 AI 对话把 UI 改成任何样子,同时保持后端架构、权限、验证层不可动摇。

### 项目命名

- **英文名**:meta-build
- **中文名**:元构
- **模块前缀**:`mb-`(后端 Maven 模块)、`@mb/`(前端 pnpm package)
- **命名哲学**:meta = 元、本源、超越具体;build = 构建。合起来"元构建"——不是另一个管理后台,而是"生产管理后台的底座"。

### 项目定位

> **给 AI 执行的契约** + **千人千面的可定制视觉层**

基于 nxboot 积累的后端架构经验和前端组件抽象,结合 nxboot-v2(codex demo)验证的 shadcn 定制化前端方案,整合 GPT 讨论补充的工程纪律(Spring Modulith + OpenAPI 契约驱动 + 平台模块化),构建一个真正实现"**千人千面 UI 定制**"的 AI 时代全栈技术底座。

### 与 nxboot 的关系

- **不是 nxboot 的 fork 或演进**,是全新项目
- **参考**:nxboot 的后端架构、L2 业务组件 API 设计;nxboot-v2 的 L1 组件、Theme Registry
- **不同**:前端分层更细(5 层 package)、契约驱动、Spring Modulith、平台模块清晰化
- nxboot 和 nxboot-v2 作为参考资产继续存在,不持续维护 fork 关系

### 新项目 vs nxboot 的本质差异

| 维度 | nxboot | 元构 |
|------|--------|--------|
| **产品定位** | AI 执行的后端契约(RuoYi Plus)| AI 执行的契约 + 可定制视觉层 |
| **UI 哲学** | 固定风格(飞书/antd/shadcn 三选一)| 千人千面(使用者定义)|
| **L1 组件归属** | 依赖 antd(node_modules)| 源码在项目内(`@mb/ui-primitives`)|
| **主题机制** | CSS 预设 + antd adapter | Theme Registry + CSS 变量 + Tailwind |
| **前端分层** | 隐式(features + shared)| 显式 5 层 pnpm package |
| **API 契约** | Swagger 只是文档 | OpenAPI → TS SDK 自动生成(契约驱动)|
| **架构守护** | 无(靠人记) | Spring Modulith + ArchUnit 双保险 |
| **Spec 引擎职责** | 未实现 | v1 不做,v1.5 基于 canonical reference 反向提炼 |

---

## 核心架构决策(全部已对齐)

### 决策 1:前端五层可定制架构

**在 client 内部用 pnpm workspace 组织为 5 层 package:**

```
┌──────────────────────────────────────────────────────┐
│  L5: features(业务代码,在 apps/web-admin/src/)       │
│  - v1 手写,v1.5+ Spec 引擎生成                       │
│  - 完全依赖 @mb/ui-patterns + @mb/app-shell          │
│  - 不碰样式、不直接调 TanStack Table                  │
├──────────────────────────────────────────────────────┤
│  L4: @mb/app-shell(布局/导航/主题壳)                 │
│  - BasicLayout / SidebarLayout / TopLayout 等        │
│  - 多布局、多品牌、多租户皮肤                          │
│  - 主题切换、权限插槽、面包屑、页签                    │
│  - 使用者可定制:换壳不换业务                         │
├──────────────────────────────────────────────────────┤
│  L3: @mb/ui-patterns(业务组件)                       │
│  - NxTable / NxDrawer / NxForm / NxFilter / NxBar   │
│  - NxLoading / ApiSelect / 共 7 个                  │
│  - API 稳定,对 features 暴露的 props 签名不可变      │
│  - 底层依赖 @mb/ui-primitives + TanStack Table/RHF  │
├──────────────────────────────────────────────────────┤
│  L2: @mb/ui-primitives(原子组件)                     │
│  - Button / Input / Select / Dialog 等 25 个        │
│  - shadcn/Radix + CVA 风格                          │
│  - 源码在项目内,使用者可深度定制                     │
│  - 通过 @mb/ui-tokens 的 CSS 变量绑定                │
├──────────────────────────────────────────────────────┤
│  L1: @mb/ui-tokens(设计令牌 + Theme Registry)        │
│  - 颜色、圆角、字号、间距、布局、阴影、动画           │
│  - 多套主题作为 TS 对象管理                           │
│  - 运行时通过 CSS 变量 + Tailwind 绑定                │
│  - 优先定制目标,覆盖 ~60-80% 场景                     │
└──────────────────────────────────────────────────────┘
```

**核心原则(北极星):**
> Spec 只生成 L5(features),L1-L4 是样式载体。改 L1-L4 会自动让所有存量和新生成的 L5 页面无缝切换风格。这就是"千人千面"的实现机制。

**pnpm workspace 依赖关系(单向):**

```
apps/web-admin → @mb/app-shell → @mb/ui-patterns → @mb/ui-primitives → @mb/ui-tokens
                       ↓                ↓                  ↓
                   @mb/api-sdk     @mb/api-sdk        (也可能依赖 api-sdk)
```

**package 边界的硬约束:**
- `@mb/ui-tokens` 不依赖任何其他 `@mb/*` package(最底层)
- `@mb/ui-primitives` 只能依赖 `@mb/ui-tokens`
- `@mb/ui-patterns` 只能依赖 `@mb/ui-primitives` + `@mb/ui-tokens` + `@mb/api-sdk`
- `@mb/app-shell` 可以依赖以上全部
- `apps/web-admin` 可以依赖以上全部,但**不能越级**直接 import `@mb/ui-primitives` 绕过 `@mb/ui-patterns`

### 决策 2:项目结构(嵌套 monorepo)

**顶层 client/server 分离,内部各自 monorepo:**

```
meta-build/
├── client/                          ← pnpm workspace 根
│   ├── packages/
│   │   ├── ui-tokens/               ← @mb/ui-tokens
│   │   ├── ui-primitives/           ← @mb/ui-primitives
│   │   ├── ui-patterns/             ← @mb/ui-patterns
│   │   ├── app-shell/               ← @mb/app-shell
│   │   └── api-sdk/                 ← @mb/api-sdk(OpenAPI 生成物)
│   ├── apps/
│   │   └── web-admin/               ← 主应用(features 在这里)
│   ├── pnpm-workspace.yaml
│   ├── package.json
│   ├── tsconfig.base.json
│   └── biome.json
│
├── server/                          ← Maven multi-module 根
│   ├── mb-common/                   ← 零 Spring 工具层
│   ├── mb-framework/                ← 基础设施层
│   ├── mb-system/                   ← 业务领域层
│   ├── mb-admin/                    ← 启动入口 + Flyway
│   └── pom.xml
│
├── specs/                           ← Spec 文件存放(v1.5+ 启用)
│   └── example/
│
├── tools/
│   └── mb-gen/                      ← Spec 代码生成器 CLI(v1.5+ 实施)
│
├── docs/
│   ├── adr/                         ← 架构决策记录
│   ├── specs/                       ← 设计规范
│   ├── guides/                      ← 使用者指南
│   ├── prompts/                     ← AI 示例 prompt 库
│   └── future-capabilities.md       ← 未来能力储备清单(含 Spec 引擎草稿)
│
├── .github/
│   └── workflows/
│       ├── client.yml               ← client CI(独立)
│       ├── server.yml               ← server CI(独立)
│       ├── contract.yml             ← 契约检查(openapi-diff)
│       └── security.yml             ← gitleaks + OWASP
│
├── docker-compose.yml               ← Postgres + Redis + MinIO(开发)
├── Dockerfile                       ← 应用镜像构建
├── CLAUDE.md                        ← AI 契约主文档
├── AGENTS.md                        ← AI 快速入口(< 200 行)
├── DESIGN.md                        ← 设计系统
├── README.md
└── CHANGELOG.md
```

**这个结构的好处:**
- **顶层 client/server 分离**:CI 独立、部署独立、职责清晰
- **client 内部 pnpm workspace**:5 层 package 边界 = 硬约束,AI 越界会被 pnpm 拦截
- **server 内部 Maven multi-module**:nxboot 已验证的分层

### 决策 3:前端技术栈(已对齐版本基线)

- **基础**:React 19 + TypeScript strict + Vite 8
- **路由**:**TanStack Router**(文件路由 + 完全类型推导 + Zod schema URL 契约)
- **数据**:TanStack Query 5.96+
- **状态**:Zustand 5(仅限 UI 偏好)
- **UI 层**:Radix UI + **Tailwind CSS 3.4**(不是 v4,因为 nxboot-v2 验证的是 3.4,AI 生态和代码借用都基于 3.4)+ CVA + shadcn 风格组件(源码在 `@mb/ui-primitives`)
- **表格引擎**:TanStack Table v8
- **表单引擎**:React Hook Form + Zod
- **图标**:Lucide React
- **i18n**:react-i18next(中英文双语,从第一天就做)
- **代码质量**:Biome(替代 ESLint + Prettier)
- **测试**:Vitest 4 + React Testing Library + MSW + Playwright(E2E) + Storybook

**为什么 TanStack Router 而不是 React Router:**

真实需求是"**动态菜单 + 静态路由**"——所有路由在前端代码里完整定义(包括 Spec 生成的业务模块),菜单数据来自后端(控制哪些菜单项对哪些用户可见)。这正是 TanStack Router 的舒适区:

1. **文件路由对 Spec 引擎是决定性优势** — Spec 生成新模块时,只需新建 `routes/business/orders.tsx` 文件,不需要更新任何中心化的 routes.tsx。React Router 则必须 diff 中心化文件,Spec 引擎的 idempotency 和冲突处理变复杂。
2. **完全类型推导** — useLoaderData / useSearch / useNavigate / useParams 全部自动推导,AI 改代码写错了编译不过,是"给 AI 执行的脚手架"的最强防线。
3. **Zod schema URL 契约化** — 和 Spec 引擎的声明式哲学完全一致,心智模型统一。
4. **loader 模式比 React Router 7 更先进** — `loaderDeps` + `validateSearch` 的组合让数据加载和 URL 状态完全类型安全。

**动态菜单和路由的解耦:**
- 菜单是 UI 层数据(来自后端),通过 `useQuery(['menus'])` 获取
- 路由是代码结构(前端静态),通过 TanStack Router 的文件路由定义
- 点击菜单 → `navigate({ to: menuItem.path })` → 跳到静态路由
- 每个路由有独立的权限守卫声明,运行时检查 `usePerm().has(...)`

**风险和缓解:**
- TanStack Router 的 AI 训练数据比 React Router 少
- 缓解措施:CLAUDE.md 里写清楚 TanStack Router 约定 + TypeScript strict 兜底 + Biome 规则

### 决策 4:后端技术栈(已对齐版本基线)

- **JVM**:JDK 21 LTS
- **框架**:**Spring Boot 3.5.13**(稳健选择,社区资源最多,将来无痛接入 Spring AI)
- **模块化**:**Spring Modulith 1.4.x + ArchUnit 双保险**
  - Spring Modulith 提供官方约定:模块识别、`@ApplicationModuleTest` 模块测试隔离、`Documenter` 自动生成依赖图
  - ArchUnit 提供自定义规则:jOOQ 不入 Service、Controller 不注入 Repository、跨领域走对方 Service 等(Modulith 表达不了的规则)
  - 两者职责互补,Modulith 管"模块边界",ArchUnit 管"代码细节"
- **安全**:Spring Security + JJWT 双 token
- **数据访问**:jOOQ 3.19+ + PostgreSQL 16 + Flyway 10+
- **缓存**:Redis(Lettuce)
- **限流**:Bucket4j
- **API 文档**:springdoc-openapi(OpenAPI 3.1)
- **契约驱动**:OpenAPI Generator → `@mb/api-sdk`(TypeScript client)
- **测试**:JUnit 5 + Testcontainers + ArchUnit
- **架构守护**:Spring Modulith verify + ArchUnit 双保险
- **可观测性**:Spring Boot Actuator + Micrometer + Logback JSON encoder
- **未来接入**:Spring AI 1.1.x(ai-core 能力储备,v1 不做)

**Spring Boot 3.5 vs 4.0 的选择理由:**
- 2026-04 两者都在稳定线(3.5.13 和 4.0.5 共存)
- 3.5 的社区资源最多,问题容易查
- Spring AI 1.1.x 当前只支持 3.4.x/3.5.x,选 3.5 为未来接入 ai-core 留空间
- 1-2 年后 Spring Boot 4.x 成熟时可以平稳升级

### 决策 5:主题定制机制(参考三套现有实现)

采用"方案 C:主题配置 + 组件源码双层定制",参考:

1. **老 nxboot 的 3 套 CSS 预设**(antd.css / feishu.css / shadcn.css) — 学习 CSS 变量命名规范
2. **nxboot-v2 的 Theme Registry 对象模型** — 学习结构化主题对象
3. **Ant Design 的 ThemeConfig 体系**(https://ant.design/docs/react/customize-theme-cn) — 学习语义 token 和组件 token 的分层
4. **shadcn 的 CSS variables 主题方式**(https://ui.shadcn.com/docs/theming)

**初期 Theme Registry 维度(覆盖 80% 场景)**:

```typescript
// @mb/ui-tokens/src/types.ts
export type ThemeDefinition = {
  id: string;
  label: string;
  density: 'comfortable' | 'compact';
  colors: ThemeColorTokens;    // 30+ 语义色(brand/fg/bg/border/muted/destructive/success/warning)
  radii: ThemeRadiusTokens;     // sm/md/lg/xl
  sizes: ThemeSizeTokens;       // controlHeight/headerHeight/sidebarWidth 等
  layout: ThemeLayoutTokens;    // gutter/padding 等布局度量
  shadows: ThemeShadowTokens;   // floating/modal/selected
  motion: ThemeMotionTokens;    // easing + duration
  fonts: ThemeFontTokens;       // sans/mono
};
```

**逻辑上可不断扩展**——超出初期维度的定制走"改 L1 组件源码"的兜底路径。

### 决策 6:定制入口(使用者 UX)

**不做专用工具。** 使用者用自己的 AI 直接改文件。元构的职责是:

- 定义清晰的**文件结构**(知道改哪里)
- 定义明确的**约束契约**(知道不能破什么)
- 提供高质量的 **CLAUDE.md / DESIGN.md** 指导 AI
- 通过**验证层**兜底(改坏了构建会红)

三个典型定制工作流:
1. **主题级定制**:AI 改 `@mb/ui-tokens/src/registry.ts` → 全站同步
2. **组件级定制**:AI 改 `@mb/ui-primitives/src/button.tsx` → 所有依赖者同步
3. **业务级定制**:AI 改 `apps/web-admin/src/features/order/*.custom.tsx` → 保留在独立文件,不被 Spec regen 覆盖

### 决策 7:Spec 引擎职责(v1.5+ 实施)

**v1 不做 Spec 引擎,推迟到 v1.5 基于 canonical reference 反向提炼。**

未来 Spec 引擎将只生成业务层代码(L5 features):

- **后端**:VO / Command / Controller / Service / Repository / Flyway 迁移 / 集成测试
- **前端 L5**:types.ts / api.ts / columns.tsx / XxxList.tsx / XxxForm.tsx
- **菜单/权限**:自动往 `sys_menu` 表插行,绑定默认角色

**Spec 不碰 L1-L4:**
- `@mb/ui-tokens` / `@mb/ui-primitives` / `@mb/ui-patterns` / `@mb/app-shell` 都是"样式载体",由使用者定制
- Spec 生成的 L5 代码通过 import `@mb/ui-patterns` 等 package 的组件完成业务

**L5 被 regen 覆盖的问题自动解决**:因为 L5 是纯业务骨架,定制发生在 L1-L4,所以 regen L5 不会丢失使用者的工作。

### 决策 8:契约驱动(最小集 MVP)

**做最小集(springdoc + OpenAPI Generator → @mb/api-sdk)**,不做 Spectral lint 和 oasdiff 检查(延后到 M6)。

**工作流:**

```
Spring Controller + @Operation 注解
  ↓
springdoc 自动扫描 → OpenAPI 3.1 JSON/YAML(入 git)
  ↓
OpenAPI Generator 生成 TypeScript client
  ↓
@mb/api-sdk package(不入 git,本地/CI 生成)
  ↓
前端 features 代码通过 import '@mb/api-sdk' 使用
  ↓
前端 tsc --noEmit 保证类型同步
```

**关键规则:**
- 前端 features 代码**禁止手写 axios 和接口类型**
- 所有 API 调用必须通过 `@mb/api-sdk`
- 后端改 DTO → CI 重新生成 api-sdk → 前端 typecheck 立即报错

**价值:**
- 扩展接口(审批/导出/批量操作)的类型同步只有两条路:手写(会漂移,老 nxboot 的坑)或契约驱动
- 工作量只有 1-2 天,永久解决类型漂移

**Spectral/oasdiff 延后:** 这两个是进阶能力,M6 阶段再加。

### 决策 9:后端借用策略(修复 4 个架构问题)

从 nxboot 借用**架构和代码**,但不保持 fork 关系。

**直接借用的组件:**
- BaseIntegrationTest(Testcontainers 单例 + 事务回滚)
- TestHelper(mockLoginUser / adminToken)
- CacheEvictSupport(事务提交后失效)
- SlowQueryListener、AsyncConfig、RateLimitInterceptor
- GlobalExceptionHandler、JooqHelper
- Flyway schema 设计(参考,不直接复用 SQL 文件)

**借用时修复的 4 个架构问题:**

1. **jOOQ 泄漏到 Service 层** → Service 禁止 import `org.jooq.*`,用 ArchUnit 固化
2. **跨领域 Service 穿透 Repository** → 跨模块访问走对方 Service,用 Spring Modulith + ArchUnit 双保险
3. **DataScope 是 opt-in 模式** → 反转为 opt-out,Repository 基类 + jOOQ VisitListener 双保险,`@BypassDataScope` 显式跳过
4. **缓存全量失效** → 一律 key 级失效,级联失效显式声明

**全新设计:**
- 第一天就有 Spring Boot Actuator + Micrometer + Logback JSON 结构化日志
- Spring Modulith 做模块边界自动验证
- 应用 Dockerfile(多阶段构建,`eclipse-temurin:21-jre-alpine` base)
- ArchUnit 架构守护(5-8 条核心规则)
- 权限覆盖率自动检查
- SpotBugs + FindSecBugs + gitleaks 加入 CI
- Flyway 从 V1 开始,所有表预留 `tenant_id BIGINT NOT NULL DEFAULT 0`(ADR-007)

### 决策 10:平台模块清单(framework 基础设施 + system 业务模块)

**不把 nxboot 的 14 个模块全抄过来**,按"基础设施 vs 平台能力 vs 业务能力"三层重新划分:

#### mb-framework 层(10 个基础设施,不对外暴露 API)

| 能力 | nxboot 对应 | 作用 |
|------|------------|------|
| **security** | JWT + DataScope + Spring Security | 认证授权基础 |
| **cache** | Redis + CacheEvictSupport | 缓存基础 |
| **jooq** | JooqHelper + SlowQueryListener + VisitListener(新) | SQL 基础 |
| **exception** | GlobalExceptionHandler + ProblemDetail(RFC 9457) | 统一异常 |
| **i18n** | MessageSource + LocaleResolver | 国际化基础 |
| **async** | AsyncConfig + 线程池 | 异步基础 |
| **rate-limit** | Bucket4j + RateLimitInterceptor | 限流基础 |
| **websocket** | WebSocket 基础设施 | 实时推送基础 |
| **observability** | Actuator + Micrometer + Logback JSON(新)| 可观测性基础 |
| **archunit** | Spring Modulith + ArchUnit 测试(新)| 架构守护 |

#### mb-system 层(8 个平台业务模块,对外暴露 API)

| 模块 | 职责 | nxboot 对应 |
|------|------|------------|
| **iam** | 用户 / 角色 / 菜单 / 部门 / 权限 / 数据范围 / 在线用户 / 认证 / 登录日志 | user + role + menu + dept + auth + online + login-log(收敛)|
| **audit** | 业务审计日志 / 操作日志 | audit + log |
| **file** | 文件上传 / 对象存储 / 附件元数据 | file |
| **notification** | 通知公告 / 站内信 / 邮件 / 短信 / Webhook | notice + 扩展 |
| **dict** | 字典 / 枚举管理 | dict |
| **config** | 系统运行时配置 / 业务参数 | config |
| **job** | 定时任务 / 任务执行历史 | job + job-log |
| **monitor** | 服务器资源监控 / 慢查询监控 / 健康检查 | monitor |

**iam 是大模块**,有意收敛 nxboot 的 7 个分散领域(user/role/menu/dept/auth/online/login-log)。"Identity and Access Management"一体化是业界共识。

#### 业务模块由 M5 canonical reference 提供

v1 阶段**不在 mb-system 里写额外业务模块**(订单/库存/商品等)。这些通过 M5 的 canonical reference features(notice + order + approval)手写实现,作为未来 Spec 引擎的参考样本。

---

## 决策前必读文档清单(7 份)

标记 **[可独立]** 的文档可以直接写,**[需讨论]** 的需要进一步对齐。

### 1. 项目定位和愿景文档 **[需讨论]**
`docs/vision.md` — 元构的产品定位、目标用户、核心差异化、与同类项目对比、成功指标、反定位、品牌故事

### 2. 参考资产盘点报告 **[可独立]**
`docs/references/asset-inventory.md` — nxboot 后端可借用清单、nxboot-v2 前端可借用清单、需要全新设计的部分、每项资产的"借用成本"和"迁移成本"

### 3. 前端五层架构设计文档 **[可独立 + 需讨论]**
`docs/specs/frontend-five-layer-architecture.md` — 5 层 package 的职责边界、25 个 L1 组件清单、7 个 L2 组件清单、Theme Registry schema、定制工作流

### 4. 后端架构借用 + 修复方案 **[可独立]**
`docs/specs/backend-architecture.md` — 借用清单、4 个架构问题修复方案、Spring Modulith 集成、Actuator/Micrometer、ArchUnit 规则、tenant_id 预留(ADR-007)、时区规范(ADR-008)

### 5. Canonical Reference Features 设计 **[需讨论]**
`docs/specs/canonical-reference-features.md` — notice / order / approval 三个示例模块的需求、ER 图、UI 原型、权限声明、状态流转、和平台模块的集成点

### 6. 项目结构和模块划分 **[可独立]**
`docs/specs/project-structure.md` — 嵌套 monorepo 完整目录树、依赖方向约束、包命名规范

### 7. CLAUDE.md / AGENTS.md 初稿 **[可独立 + 需讨论]**
`CLAUDE.md` + `AGENTS.md` — AI 契约全文,MUST/MUST NOT/SHOULD + `<!-- verify: -->` 可执行验证块

---

## 未来能力储备(v1 不做,记录备忘)

`docs/future-capabilities.md` 记录这些"想做但不在 v1 范围"的能力:

| 能力 | 原因(为什么 v1 不做) | 触发条件(什么时候做) |
|------|---------------------|------------------|
| **Spec 引擎**(声明式业务模块生成器) | **没有代码样本无法设计合理的 Spec** | **v1 完成后,基于 canonical reference 反向提炼**(v1.5)|
| **ai-core 模块**(运行时 AI 能力) | 先把底座跑通,Spring AI 会持续演进 | v1 完成后 + 有明确业务场景 |
| **多租户完整实现** | v1 只预留 `tenant_id` 字段 | 有 2+ 租户的实际需求时 |
| **分布式追踪**(OpenTelemetry) | 单体应用够用 Micrometer | 拆出第 2 个服务时 |
| **契约测试**(Pact) | 前后端在同一仓库 | 有多个前端消费同一后端时 |
| **微服务拆分** | 模块化单体更合适 | 有明确的独立部署需求时 |
| **Spectral API lint** | MVP 阶段契约驱动只做最小集 | M6 阶段 |
| **oasdiff breaking change 检查** | MVP 阶段契约驱动只做最小集 | M6 阶段 |
| **Visual Regression Testing** | Storybook 已有,但不强制 | M6 阶段,如果主题维度增多 |
| **Spring Authorization Server** | 自己的 JWT 够用 | 有企业 SSO 集成需求时 |
| **Keycloak 集成** | Docker compose 里不默认启用 | 有独立身份服务需求时 |
| **MinIO 对象存储默认启用** | v1 只提供本地文件存储 | file 模块扩展时 |
| **MCP Server 暴露业务能力** | 依赖 ai-core 模块 | ai-core 做完后 |
| **树形数据 Spec 支持** | v1 menu/dept 手写,v1.5 Spec 再抽象 | Spec 引擎 v1.5 |
| **多对多关系 Spec 支持** | v1 user-role/role-menu 手写 | Spec 引擎 v1.5 |
| **字段级权限** | v1 只做操作级权限 | 有字段脱敏需求时 |

### Spec 引擎设计草稿(v1.5 的起点)

v1 不做 Spec 引擎,但今天讨论的设计思考不丢弃,作为 v1.5 的起点草稿:

**目标范围(v1.5)**:L1-L6(含 ApplicationService 编排)

**能力层级:**
- **L1**:字段 + 基础 CRUD + 约束 + UI 提示 + 权限
- **L2**:引用关系(外键 JOIN、下拉选择器)
- **L3**:主从表(master-detail)
- **L4**:枚举状态机(transitions 声明)
- **L5**:扩展点(service-hook、custom-query、ui-override)
- **L6**:ApplicationService 编排层(跨模块协调)

**不在 v1.5 范围:** L7-L10(复杂表单控件 / JSON / 树形 / 多对多)推迟到 v2

**v1.5 Spec 引擎实现栈:** Node.js CLI + TypeScript + commander + yaml + EJS/Handlebars 模板

**v1.5 Spec 引擎的输入:** v1 积累的 canonical reference features(notice/order/approval)的代码模式

**v1.5 Spec 引擎的输出:** 只生成 L5 features(后端 VO/Command/Controller/Service/Repository + 前端 route/list/form + Flyway SQL + 菜单权限)

**i18n 策略:** 字段 label 支持多语言对象 `{ zh-CN, en-US }`(内联多语言,自包含)

**权限粒度:** 操作级(list/create/update/delete)

**数据权限:** Spec 声明 `dataScope: true`,具体规则由角色配置决定

---

## 实施路线图(8 个 Milestone)

### M0:文档齐全(7 份决策前必读)
**产出:** 上述 7 份文档全部写完 + `docs/future-capabilities.md`
**下班信号:** 任意决策回溯都能在对应文档里找到依据
**工作量:** 3-5 天

### M1:项目脚手架 + CI + 基础设施
**产出:**
- 空项目骨架(嵌套 monorepo)
- 基础 CI workflow(client.yml + server.yml)
- 应用 Dockerfile(多阶段构建)
- docker-compose 一键启动(Postgres + Redis)
- 第一个 Flyway V1(sys_user / sys_role / sys_menu + tenant_id)
- Spring Modulith 包结构 + 最小 verify() 测试
- ArchUnit 3 条启动规则
- `@mb/ui-tokens` 的第一版(只有一套默认主题)

**下班信号:** 空 clone 后 `docker compose up -d && ./scripts/dev.sh` 能看到登录页(接口还是 mock)
**工作量:** 5-7 天

### M2:前端 L1 + Theme 系统
**产出:**
- `@mb/ui-primitives`:25 个 L1 原子组件
- `@mb/ui-tokens`:完整的 Theme Registry + 3 套预设主题
- ThemeProvider + 运行时切换
- Tailwind 配置 + CSS 变量绑定
- 每个 L1 组件都有 Vitest 测试
- Storybook 故事
- 主题切换的 demo 页面

**下班信号:** 能在 demo 页面切换 3 套主题,看到按钮/输入框/表格全部同步变化
**工作量:** 7-10 天

### M3:前端 L3 + L4(业务组件 + app-shell)
**产出:**
- `@mb/ui-patterns`:7 个 L2 核心组件
- `@mb/app-shell`:5 种布局预设 + 动态菜单
- 一个 canonical reference feature(user 模块的前端骨架)

**下班信号:** user 模块完全用 `@mb/ui-patterns` 拼出,切换主题和布局都正确传导
**工作量:** 10-14 天

### M4:后端底座 + 平台模块 + 契约驱动最小集
**产出:**
- mb-common / mb-framework / mb-system / mb-admin 四层 Maven 模块
- mb-framework 层的 10 个基础设施全部就位
- mb-system 层的 8 个平台业务模块全部实现
- 4 个架构问题的修复方案全部落地
- Flyway V1-V20(覆盖 8 个平台模块 + 初始化数据)
- Actuator + Micrometer + Logback JSON
- Spring Modulith 完整 verify() 测试
- ArchUnit 完整规则
- 集成测试覆盖率 > 60%
- springdoc → OpenAPI Generator → @mb/api-sdk(契约驱动 MVP)

**下班信号:** 前后端联调 8 个平台模块的管理操作,切换主题时整体风格变化
**工作量:** 14-21 天

### M5:Canonical Reference Features(手写 3 个业务示例模块)

**重要调整:** v1 不做 Spec 引擎。Spec 推迟到 v1.5,基于 M5 积累的真实代码样本再设计。

**产出:**

手写 **3 个完整的业务示例模块**:

1. **notice(通知公告)** - 低复杂度
   - 基础 CRUD + 枚举状态(草稿/已发布) + 富文本内容

2. **order + order-item(订单 + 订单明细)** - 中复杂度
   - 主从表 + 引用客户 + 状态机(DRAFT→SUBMITTED→APPROVED→REJECTED→CANCELLED)

3. **approval(审批流程)** - 高复杂度
   - ApplicationService 编排层(跨模块协调)
   - 涉及 order + notification + audit 模块

**验证产出:**
- 每个模块完整的前后端实现 + 集成测试
- 每个模块的 ADR 记录(为什么这样设计)
- 每个模块的"AI 手写指南"章节(写进 CLAUDE.md)
- 对这 3 个模块做主题切换测试

**下班信号:**
- 3 个模块全部通过集成测试
- 切换 8 套主题,3 个模块的视觉完全同步变化(千人千面机制验证成功)

**工作量:** 7-10 天

### M6:验证层完整版 + 主题样本库
**产出:**
- ArchUnit 完整规则(8-10 条)
- 权限覆盖率自动检查
- 性能基线(N+1 检测 + 慢查询阈值)
- OpenAPI diff(API 向后兼容检查)
- Spectral API 风格 lint
- Secret 扫描(gitleaks)+ OWASP 依赖扫描
- Playwright E2E
- **主题样本库**:6-8 套完整主题(飞书 / 几何 / 苹果 / Material / 赛博朋克 / 简约 / 暖色 / 深色)

**下班信号:** 8 套主题任意切换 UI 都正确,故意触发 ArchUnit 违规 CI 立即报错
**工作量:** 10-14 天

### M7:开源准备 + 文档完善
**产出:**
- LICENSE / ISSUE_TEMPLATE / PR_TEMPLATE / Code of Conduct
- 完整的 CLAUDE.md / README 中英文双语
- Quickstart 视频
- `.metabuild/index.json`(AI 机器可读索引)
- `docs/prompts/` AI 示例库
- 官网 / Demo 站点

**下班信号:** 陌生开发者从 README 开始,15 分钟从 clone 到本地 demo 完成
**工作量:** 5-7 天

---

## 时间总览

| Milestone | 内容 | 工作量 |
|-----------|------|--------|
| M0 | 7 份决策前必读文档(含 canonical reference 设计) | 3-5 天 |
| M1 | 脚手架 + CI + 嵌套 monorepo | 5-7 天 |
| M2 | L1 原子组件 + Theme Registry | 7-10 天 |
| M3 | L2 业务组件 + L4 app-shell | 10-14 天 |
| M4 | 后端底座 + 平台模块 + 契约驱动 MVP | 14-21 天 |
| **M5** | **Canonical Reference Features(notice + order + approval)** | **7-10 天** |
| M6 | 验证层 + 主题样本库 | 10-14 天 |
| M7 | 开源准备 | 5-7 天 |

**总计:61-88 天**(比 Spec 引擎方案省 3-4 天,Spec 引擎推迟到 v1.5)

**v1.5 规划:** Spec 引擎 MVP(基于 M5 的 canonical reference 反向提炼)—— 10-14 天

---

## 三大风险和对冲

### 风险 1:L2 业务组件的重新设计

**问题:** 老 nxboot 的 L2 API 基于 antd 习惯,shadcn 生态的心智模型不同。强行保留 API 会"水土不服",完全抛弃又丢失老 nxboot 的工程经验。

**对冲:**
- 保留 L2 的**职责划分和命名**(NxTable / NxDrawer / NxForm 等 7 个)
- **重新设计 props 接口**:按 shadcn + TanStack Table + RHF 的自然形态
- **保留抽象层次**:L5 通过 L2 调用,不直接调用 TanStack Table 和 RHF
- 每个 L2 组件写 ADR 记录"为什么这样设计"

### 风险 2:Spring Modulith 学习曲线

**问题:** Spring Modulith 1.4 是相对较新的工具,nxboot 没有用过,可能遇到未知坑。

**对冲:**
- M1 阶段就集成,最小可用即可(一个 verify() 测试)
- 不强求使用所有高级特性(`@NamedInterface` / `Documenter` 等可延后)
- 配合 ArchUnit 做"双保险",哪怕 Modulith 出问题 ArchUnit 也能拦截
- 准备一个 fallback:如果 Modulith verify() 过于严格导致开发卡顿,退化为纯 ArchUnit

### 风险 3:TanStack Router 的 AI 训练数据

**问题:** TanStack Router 的 AI 训练数据比 React Router 少,使用者用自己的 AI 改代码时可能生成不规范的代码。

**对冲:**
- CLAUDE.md 里写清楚 TanStack Router 约定和范式示例
- 每个 `routes/*.tsx` 文件都有标准注释,告诉 AI 应该怎么写
- TypeScript strict + Biome 规则兜底——AI 写错了编译不过

---

## 17 项已对齐决策完整清单

| # | 决策 | 结论 |
|---|------|------|
| 1 | 项目名 | meta-build / 元构 |
| 2 | 项目结构 | 嵌套 monorepo(顶层 client/server 分离) |
| 3 | 前端基础库 | React 19 + TypeScript strict + Vite 8 |
| 4 | 前端 UI 层 | Radix + Tailwind 3.4 + CVA + shadcn 风格 |
| 5 | 前端路由 | TanStack Router(文件路由 + 类型推导) |
| 6 | 前端分层 | 5 层 package(tokens/primitives/patterns/app-shell/web-admin) |
| 7 | 后端框架 | Spring Boot 3.5.13 |
| 8 | 后端模块化 | Spring Modulith + ArchUnit 双保险 |
| 9 | 后端数据访问 | jOOQ + Flyway + PostgreSQL 16 |
| 10 | 后端基础设施 | 10 个 framework 模块 |
| 11 | 后端业务模块 | 8 个 system 平台模块 |
| 12 | 契约驱动 | 最小集 MVP(springdoc → @mb/api-sdk) |
| 13 | M5 内容 | Canonical Reference Features(notice + order + approval) |
| 14 | Spec 引擎 | 推迟到 v1.5(基于 canonical reference 反向提炼) |
| 15 | 运行时 AI(ai-core)| 推迟到 v1 之后 |
| 16 | 多租户 | v1 预留 tenant_id 字段,完整实现推迟 |
| 17 | Spec 引擎语言 | Node.js CLI(v1.5 实施) |

---

## 剩余 4 个细节决策(M0 写文档时再细化)

1. **初始默认主题** — 飞书风格 / 新设计的中性基调 / 参考 shadcn 默认 / 设计 meta-build 品牌风格?
2. **L2 API 重新设计时** — props 里要不要加 i18n key 约定?
3. **canonical reference 的 3 个模块最终选型** — notice / order / approval 是默认推荐
4. **Flyway 脚本组织** — 按时间顺序(V20260410_001)还是按业务(V1_1__iam, V2_1__audit)?

---

## 关键文件(实施时会创建)

### 前端核心代码
- `client/packages/ui-tokens/src/registry.ts` — Theme Registry
- `client/packages/ui-primitives/src/*.tsx` — L2 原子组件(25 个)
- `client/packages/ui-patterns/src/*.tsx` — L3 业务组件(7 个)
- `client/packages/app-shell/src/*.tsx` — L4 布局/主题/权限壳
- `client/packages/api-sdk/` — L5 OpenAPI 生成物(不入 git)
- `client/apps/web-admin/src/features/` — L5 业务代码
- `client/apps/web-admin/src/routes/` — TanStack Router 文件路由
- `client/pnpm-workspace.yaml`
- `client/apps/web-admin/tailwind.config.ts`

### 后端核心代码
- `server/mb-framework/src/main/java/com/metabuild/framework/archunit/` — ArchUnit 规则
- `server/mb-framework/src/main/java/com/metabuild/framework/security/BypassDataScope.java` — DataScope opt-out
- `server/mb-framework/src/main/java/com/metabuild/framework/jooq/DataScopeVisitListener.java` — jOOQ 全局注入
- `server/mb-system/src/main/java/com/metabuild/system/iam/` — iam 平台模块
- `server/mb-admin/src/main/resources/db/migration/V1__init.sql` — 含 tenant_id
- `server/pom.xml`

### 工具和配置
- `tools/mb-gen/` — Spec 模块生成器 CLI(v1.5+ 实施)
- `Dockerfile` — 多阶段应用镜像
- `docker-compose.yml` — 开发环境
- `.github/workflows/{client,server,contract,security}.yml`

### 决策前文档
- `docs/vision.md`
- `docs/references/asset-inventory.md`
- `docs/specs/frontend-five-layer-architecture.md`
- `docs/specs/backend-architecture.md`
- `docs/specs/canonical-reference-features.md`
- `docs/specs/project-structure.md`
- `docs/future-capabilities.md`
- `CLAUDE.md`
- `AGENTS.md`

### 参考来源(不修改)
- `/Users/ocean/Studio/05-codex/04-nxboot-v2` — 前端 L1/L2 组件 + Theme Registry 参考
- `/Users/ocean/Studio/01-workshop/02-软件开发/04-nxboot` — 后端架构 + L2 API 设计参考
- `/Users/ocean/Downloads/chrome 下载/ai-vibe-coding-scaffold-discussion.md` — GPT 补充的工程纪律参考

---

## 验证方案

### 整体规划的验证
每个 Milestone 都有明确的"下班信号",以可观察的现象为准。

### 关键里程碑的端到端验证

1. **M0 文档齐全** → 任意架构决策都能在对应文档里找到依据和原因
2. **M1 脚手架** → 空 clone 后一条命令链启动,Spring Modulith verify() 通过
3. **M2 L1 + Theme** → demo 页面切换主题,整站视觉同步变化
4. **M3 L2 + app-shell + canonical** → user 模块只用 @mb/ui-patterns 拼出,主题切换正确传导
5. **M4 后端 + 契约驱动** → 前后端联调 8 个平台模块,@mb/api-sdk 自动生成链路跑通
6. **M5 Canonical Reference** → 3 个业务示例模块全部通过测试,主题切换传导正确
7. **M6 验证层** → 故意 ArchUnit 违规 CI 立即报错,8 套主题任意切换
8. **M7 开源** → 陌生开发者 15 分钟上手

### 北极星验证
项目做成的标志:**一个陌生开发者能用自己的 AI**,在 1 天内:
1. clone 项目
2. 看到完整的 8 个平台模块 + 3 个业务示例
3. 描述 UI 风格,让 AI 修改 L1-L4
4. 描述新业务需求,让 AI 参照 canonical reference 手写新模块
5. 得到一个风格独特、业务完整、质量可信的管理系统

(v1.5 启动 Spec 引擎后,第 4 步从"手写"变成"YAML Spec → mb-gen apply")
