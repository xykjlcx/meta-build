# Meta-Build 前端设计

> **状态**：M0 待写
>
> 前端设计文档将与后端 (`docs/specs/backend/`) 同构，按 5 层 pnpm workspace（`@mb/ui-tokens` → `@mb/ui-primitives` → `@mb/ui-patterns` → `@mb/app-shell` → `web-admin`）的天然结构拆分为约 10-12 个子文件 + README 入口。
>
> 当前请参考：
> - [meta-build规划_v1_最终对齐.md](../../../meta-build规划_v1_最终对齐.md) 决策 1（5 层架构）+ 决策 3（前端技术栈）+ 决策 4（UI 层）+ 决策 5（主题机制）+ 决策 6（定制入口）
> - [CLAUDE.md](../../../CLAUDE.md) 的"前端"小节

## 计划的子文档结构（M0 写时填入）

- `README.md`（本文件，将变成完整入口 + 反向索引）
- `01-layer-structure.md` — 5 层 package 结构 + 依赖方向
- `02-ui-tokens-theme.md` — L1 Design tokens + Theme Registry
- `03-ui-primitives.md` — L2 25 个原子组件清单
- `04-ui-patterns.md` — L3 7 个业务组件 API 设计
- `05-app-shell.md` — L4 布局 + 导航 + 主题壳
- `06-routing-and-data.md` — TanStack Router 文件路由 + TanStack Query
- `07-contract-client.md` — `@mb/api-sdk` 消费（与后端 06-api-and-contract 对称）
- `08-customization-workflow.md` — 千人千面定制三种路径
- `09-quality-gates.md` — Biome + TypeScript strict + Vitest + Playwright
- `10-antipatterns.md` — 前端反面教材
- `appendix.md` — 术语表 + 依赖图

---

**M0 待写** — 等当前会话结束后由洋哥触发"开始写前端文档"时填入。
