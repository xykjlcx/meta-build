# M1 → M2 交接文档

> 新 session 开始前读这份文档，5 分钟内获得完整上下文。

---

## 当前状态

- **M1 已完成**，合并到 main，推送到 GitHub（私有仓库 xykjlcx/meta-build）
- 后端 `mvn verify` 全绿，前端 `pnpm build` + `lint` + `lint:css` + `check:types` + `check:env` 全绿
- 分支干净，只有 main

## 已有的代码结构

### 后端（server/，6 层 Maven）

```
mb-common     → 安全接口（CurrentUser/AuthFacade）+ 异常体系 + ID 生成器 + 分页 DTO
mb-schema     → Flyway V1（mb_iam_user 表）+ jOOQ 生成代码（三插件 codegen）
mb-infra      → 11 子模块（4 个有代码：jooq/async/observability/archunit，7 个占位）
mb-platform   → 占位
mb-business   → 占位
mb-admin      → Spring Boot 入口 + 全量配置 + 测试（4 tests 全绿）
```

### 前端（client/，5 层 pnpm workspace）

```
@mb/ui-tokens      → L1，46 token 常量 + tailwind-theme.css（@theme 块，不含 @import "tailwindcss"）+ themes/default.css
@mb/ui-primitives  → L2，空骨架
@mb/ui-patterns    → L3，空骨架
@mb/app-shell      → L4，空骨架
@mb/api-sdk        → 空骨架
apps/web-admin     → Vite + React 19 + Tailwind v4，Mock 登录页
```

### 基础设施

- docker-compose：PG 15432，Redis 16379（端口规则：原生端口前加 1）
- CI：.github/workflows/server.yml + client.yml
- Branch protection：暂未开启（GitHub 免费版私有仓库不支持）

## M2 要做的事

### 目标
主题系统可切换 + L2 原子组件开始落地

### 具体任务

1. **L1 主题扩展**（3 个主题）
   - 新增 `themes/dark.css` + `themes/compact.css`
   - 每个主题必须定义全部 46 token

2. **Theme Registry + 运行时切换**
   - `theme-registry.ts`：注册可用主题，返回主题列表
   - `apply-theme.ts`：`document.documentElement.dataset.theme = 'dark'` + localStorage 持久化
   - `initTheme()`：页面加载时从 localStorage 恢复，避免闪烁

3. **主题完整性校验脚本**
   - ~50 行 TS，扫描所有 themes/*.css，确保每个主题定义了全部 46 token
   - CI 硬失败
   - 加到 `pnpm check:theme` 脚本

4. **L2 原子组件**（shadcn/Radix 风格）
   - ~30 个组件：Button, Input, Dialog, Select, Tabs, Tooltip, Popover, DropdownMenu, Badge, Card, Avatar...
   - 使用 CVA + clsx + tailwind-merge
   - 每个组件引用 CSS 变量（var(--color-primary)），不硬编码颜色

5. **Storybook 搭建**
   - 每个 L2 组件每个 variant 一个 story
   - Storybook 能切换主题预览

6. **Vitest 搭建**
   - L2 组件基础单元测试

7. **质量门禁升级**
   - 启用 theme-integrity-check（CI 硬失败）
   - L2 组件必须有 Storybook story（MUST #1）

### 关键 spec 文件

- `docs/specs/frontend/02-ui-tokens-theme.md` — L1 主题系统完整设计
- `docs/specs/frontend/03-ui-primitives.md` — L2 组件列表和规范
- `docs/specs/frontend/10-quality-gates.md §6.2` — M2 阶段启用的工具和规则

## 已知的待处理问题（M4 阶段）

Codex 对抗性审查发现，M4 写业务代码时会暴露：

| 问题 | 涉及文件 |
|------|---------|
| ArchUnit 模块边界规则误判同模块内依赖 | infra-archunit/ModuleBoundaryRule.java |
| 异步线程丢失 MDC traceId + 认证上下文 | infra-async/AsyncConfig.java |
| JooqHelper 缺少审计字段自动填充 | infra-jooq/JooqHelper.java |
| BaseIntegrationTest 缺少 rollback 隔离 | mb-admin/BaseIntegrationTest.java |

这些在 M4 计划时统一处理，M2 不需要管。

## 关键技术决策备忘

| 决策 | 结论 | 依据 |
|------|------|------|
| Tailwind 版本 | v4（CSS-first，@theme 指令） | 不是 v3，没有 tailwind.config.js |
| `@import "tailwindcss"` 位置 | 只在 app 入口 CSS（styles.css）中 | L1 包不声明 tailwindcss 依赖，避免 pnpm strict 构建失败 |
| jOOQ codegen | 三插件模式（groovy → flyway → jooq-codegen） | Maven 插件 ClassLoader 隔离，无法共享容器 |
| Docker 端口 | 原生端口前加 1（15432/16379） | 避免与本机服务冲突 |
| ID 类型 | 统一 Long（包装类型） | 容错优先 |
| 合并策略 | --no-ff 保留全部 commit | git blame 可追溯 |

## 常用命令

```bash
# 后端
cd server && mvn verify                              # 全量验证
cd server && mvn spring-boot:run -pl mb-admin        # 启动（需先 mvn install -DskipTests）
cd server && mvn -Pcodegen generate-sources -pl mb-schema  # jOOQ 代码生成

# 前端
cd client && pnpm install                            # 安装依赖
cd client && pnpm dev                                # 启动 dev server（localhost:5173）
cd client && pnpm build                              # 生产构建
cd client && pnpm check:types && pnpm lint && pnpm lint:css && pnpm check:env  # 全量检查

# Docker
docker compose up -d                                 # 启动 PG(15432) + Redis(16379)
```

## Rules 索引

M1 实施期间沉淀的经验规则（`~/.claude/rules/`）：

- `verify-all-modes.md` — dev/build/lint 三态都要验证
- `toolchain-compat-check.md` — 工具链组合引入后立刻用真实代码验证
- `maven-ci-friendly-versions.md` — ${revision} 必须配 flatten-maven-plugin
- `jooq-codegen-testcontainers.md` — 三插件模式详解
- `parallel-subagent.md` — 前后端隔离时可并行派 agent
- `archunit-empty-rules.md` — M1 阶段 allowEmptyShould(true)
- `testcontainers-version-compat.md` — Testcontainers 与 Docker Desktop 版本兼容
- `local-pg-port-conflict.md` — 本机 PG 端口冲突处理
