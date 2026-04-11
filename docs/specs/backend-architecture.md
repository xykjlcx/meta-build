# Meta-Build 后端架构设计（已拆分）

> **本文档已于 2026-04-11 拆分为 `docs/specs/backend/` 子目录**。
>
> 入口：[backend/README.md](./backend/README.md)
>
> 拆分理由：单文件 4071 行，对 AI context window 不友好，且多个跨章节主题（jOOQ 隔离 / 数据权限 / 缓存失效 / 时区 / 跨模块规则）被强行塞在 `§5 架构问题修复方案` 一章里，违反高内聚原则。
>
> 拆分策略：把跨章节主题归位到对应职责文件（详见 `/Users/ocean/.claude/plans/resilient-puzzling-tarjan.md`）。

## 新结构导航

| 关注点 | 子文件 |
|---|---|
| 模块结构与边界守护 | [backend/01-module-structure.md](./backend/01-module-structure.md) |
| 基础设施层 mb-infra | [backend/02-infra-modules.md](./backend/02-infra-modules.md) |
| 平台业务层 + 新增业务模块 12 步 | [backend/03-platform-modules.md](./backend/03-platform-modules.md) |
| 数据访问与持久化（含 jOOQ 隔离 / 缓存 / 时区） | [backend/04-data-persistence.md](./backend/04-data-persistence.md) |
| 安全模型 + 方案 E 数据权限 | [backend/05-security.md](./backend/05-security.md) |
| API 响应与契约驱动 | [backend/06-api-and-contract.md](./backend/06-api-and-contract.md) |
| 可观测性与测试 | [backend/07-observability-testing.md](./backend/07-observability-testing.md) |
| ArchUnit 规则集 + 反面教材索引 | [backend/08-archunit-rules.md](./backend/08-archunit-rules.md) |
| 借用清单 / 模块清单 / 推迟章节 / 术语表 | [backend/appendix.md](./backend/appendix.md) |

## 后端硬约束反向索引

→ [backend/README.md#后端硬约束反向索引](./backend/README.md#后端硬约束反向索引)

---

**保留此占位文件**避免外部历史链接失效（git history、ADR 引用、未来 PR 评论等）。新内容**只在** `backend/` 目录维护。
