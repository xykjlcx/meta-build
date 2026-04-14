# M1 完成交接文档

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

---

## 下一阶段：M2 + M4 可并行

### 里程碑全景

| Milestone | 内容 | 依赖 | 方向 |
|-----------|------|------|------|
| **M2** | 前端 L1 完整 + Theme 系统 + L2 原子组件 | M1 ✅ | **纯前端** |
| M3 | 前端 L3 业务组件 + L4 App Shell + 路由 + i18n | M2 | 前端 |
| **M4** | 后端底座 + 8 平台模块 + 契约驱动 | M1 ✅ | **纯后端** |
| M5 | Canonical Reference（notice/order/approval） | M3 + M4 | 前后端联调 |
| M6 | 验证层完整版 + 主题样本库 | M5 | 全栈 |
| M7 | 开源准备 | M6 | 文档/运维 |

**M2 和 M4 零依赖，可以完全并行开发。** M5 是第一个需要前后端联调的里程碑。

---

## M2：前端 L1 完整 + Theme 系统 + L2 组件

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
   - CI 硬失败，加到 `pnpm check:theme`

4. **L2 原子组件**（shadcn/Radix 风格，~30 个）
   - Button, Input, Dialog, Select, Tabs, Tooltip, Popover, DropdownMenu, Badge, Card, Avatar...
   - CVA + clsx + tailwind-merge
   - 引用 CSS 变量，不硬编码颜色

5. **Storybook 搭建**
   - 每个 L2 组件每个 variant 一个 story，能切换主题预览

6. **Vitest 搭建** — L2 组件单元测试

7. **质量门禁升级** — theme-integrity-check + Storybook story 必须存在

### 关键 spec
- `docs/specs/frontend/02-ui-tokens-theme.md` — 主题系统完整设计
- `docs/specs/frontend/03-ui-primitives.md` — L2 组件列表和规范
- `docs/specs/frontend/10-quality-gates.md §6.2` — M2 阶段启用的工具和规则

---

## M4：后端底座 + 8 平台模块 + 契约驱动

### 目标
8 个平台模块全部实现 + OpenAPI 契约驱动前后端对接

### 具体任务

1. **infra 剩余 7 模块实现**
   - infra-security：Sa-Token 封装 + SaTokenCurrentUser + @RequirePermission + CORS
   - infra-cache：Redis + CacheEvictSupport
   - infra-exception：GlobalExceptionHandler + ProblemDetail
   - infra-i18n：MessageSource + LocaleResolver
   - infra-rate-limit：Bucket4j
   - infra-captcha：滑块验证
   - infra-websocket：预留（v1 可选）

2. **8 个 platform 模块**
   - platform-iam：用户/角色/菜单/部门 CRUD + 数据权限
   - platform-oplog：操作日志（@OperationLog 注解 + AOP）
   - platform-file：文件上传/下载（本地 + OSS 切换）
   - platform-notification：站内通知
   - platform-dict：数据字典
   - platform-config：系统配置
   - platform-job：定时任务
   - platform-monitor：系统监控

3. **Flyway 全量迁移** — 8 模块的表结构
4. **jOOQ 代码重新生成** — 覆盖所有新表
5. **契约驱动** — springdoc → OpenAPI 3.1 → @mb/api-sdk
6. **ArchUnit 规则完善** — M1 的 3 条 + M4 新增规则

### 关键 spec
- `docs/specs/backend/README.md` — 后端设计入口（按 M4 实施者阅读路径）
- `docs/specs/backend/03-platform-modules.md` — 8 模块设计 + 12 步新增模块清单
- `docs/specs/backend/05-security.md` — 认证/授权/数据权限完整设计
- `docs/specs/backend/06-api-and-contract.md` — API 契约 + OpenAPI 生成

### M1 遗留的 M4 待修复项（Codex 审查发现）

| 问题 | 涉及文件 | 说明 |
|------|---------|------|
| ArchUnit 模块边界规则误判同模块内依赖 | infra-archunit/ModuleBoundaryRule.java | 需加模块名比对 |
| 异步线程丢失 MDC traceId + 认证上下文 | infra-async/AsyncConfig.java | 需加 TaskDecorator |
| JooqHelper 缺少审计字段自动填充 | infra-jooq/JooqHelper.java | 需注入 CurrentUser + Clock |
| BaseIntegrationTest 缺少 rollback 隔离 | mb-admin/BaseIntegrationTest.java | 需加 @Transactional 或 reset |

---

## 并行开发策略建议

- 如果一个 session 做：先 M2 后 M4（前端体量小，先收尾）
- 如果多 session 并行：一个 session 做 M2，另一个做 M4，各自开 feature 分支
- M5 是汇合点——需要 M2 的组件 + M4 的 API 都就绪

---

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
