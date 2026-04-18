---
name: ADR 编号纪律
description: 新 ADR 必须带 scope 前缀 + 开新 ADR 前 ls docs/adr/ 查最大编号，防止前后端并发撞号
type: pitfall
scope: 全栈 / 流程
triggers:
  - 新增 ADR
  - 翻转既有决策需要写 ADR
  - 跨 session 并发开发
---

# ADR 编号纪律

## 规则

1. **新 ADR 命名**：`<scope>-<nnnn>-<kebab-title>.md`，scope ∈ `{frontend, backend, meta}`
   - 前端：`frontend-0023-claude-design-alignment-decisions.md`
   - 后端：`backend-0024-xxx.md`
   - 跨层 / 元方法论：`meta-0025-xxx.md`

2. **编号全局连续递增**（不分前后端各自计数），保证"ADR-0023"是唯一标识

3. **开新 ADR 前必须** `ls docs/adr/` **查最大编号 + 1**，不能凭印象估算

4. **现有 20 份 ADR**（`0001-*` 到 `0020-*`，加上 2026-04-18 的 `0021-*`/`0022-*`）**不动**，后续统一规整时再迁移到带 scope 前缀的命名

5. **跨层 ADR**（同时影响前后端，如元方法论、文档组织、工作流）用 `meta-` 前缀

## Why

**2026-04-18 前后端 ADR 编号撞车**：
- 前端会话讨论 Claude Design 对齐，计划写 ADR-0021（14 项决策汇总）和 ADR-0022（三层导航哲学）
- 同时后端会话在重构中已落 `0021-虚拟线程加java25加通知分发取消同步聚合.md` 和 `0022-权限一致性应用层清关联加jooq-listener源头捕获.md`
- 发现冲突时前端 ADR 还没落盘，改编号 + 加 scope 前缀才避免覆盖

核心风险：**共享编号空间 + 并发写入 = 覆盖风险**。即便没真覆盖，编号跳跃也会让后来者困惑。

## How to apply

### 开新 ADR 的标准流程

```bash
# 1. 确认 scope（前端/后端/meta）
# 2. 查最大编号
ls docs/adr/ | grep -oE '^[a-z]*-?[0-9]{4}' | sort -V | tail -3

# 3. 新建文件（示例）
touch docs/adr/frontend-0023-claude-design-alignment-decisions.md
```

### Review ADR PR 时的检查点

- [ ] 文件名带 scope 前缀（除非是 0001-0022 之间的老文件）
- [ ] 编号是 `ls docs/adr/` 最大值 + 1
- [ ] 没有和既有 ADR 编号冲突
- [ ] 前端会话的 ADR 归属是 `frontend-`，后端是 `backend-`，不要混淆

### 跨 session 并发时的额外小心

- 写 ADR 前先 `git pull --ff-only origin main`，对方可能刚落了新 ADR 占用编号
- 写完后尽快 push，缩短编号"预占用"到"实际占用"的窗口
- 如果 push 时发现编号被另一方抢占，**让步 + 递增**（改本地文件编号 +1，重新 push）

## 关联文档

- `docs/collab/concurrent-dev-protocol.md`：前后端并发协作完整约定
- `docs/rules/adr-before-code.md`：翻转决策必须先写 ADR 再改代码（现有 rule）
