---
title: AI 跨文件引用必须 grep 验证（置信度陷阱）
type: pitfall
triggers: [计划, plan, writing-plans, 代码片段, 方法签名, 实施, 跨文件调用, import, 常量引用]
scope: [流程]
---

# AI 跨文件引用必须 grep 验证（置信度陷阱）

## 规则
AI 产出（计划、代码、Review 建议）中任何**跨文件引用**——调用别的模块的类、方法、常量、配置项——必须 grep 验证存在且签名匹配。"看起来对" ≠ "确实存在"。

## Why

### 元模式：AI 置信度陷阱
AI 最危险的不是"不知道"，而是"自信地写出不存在的东西"。AI 的"记忆"本质是概率生成，不是精确检索。越是看起来合理的名字越危险——因为"合理"让人和 AI 都放松了验证。

### 证据（M0-M4 积累）

**计划中的错误签名**（0414 M4 修复计划）：
- `authFacade.login(sessionData)` → 实际是 `doLogin(Long, SessionData)`
- `CurrentUserUtil.getCurrentUserId()` → 该类不存在
- `ALL_PERMISSIONS` from `'../config/permissions'` → 实际是 `ALL_APP_PERMISSIONS` from `'@mb/api-sdk'`

**技术决策中的惯性推导**（0411-0413）：
- 从 nxboot 的 MyBatis-Plus 习惯推导出 `DataScopedRepository` 基类 → jOOQ 世界不需要这个（ADR-0007）
- 从项目原则推导技术选型 → 应该先查官方文档再决策

**根因**：写计划/代码时处于"设计思维"，倾向于写"应该有的"而非"实际存在的"。计划的价值在方向和步骤，里面的代码片段可信度很低。

## How to apply
- **计划阶段**：每个 `modify` 文件，至少 grep 确认引用的方法/类存在
- **编码阶段**：跨模块 import 前，grep 确认目标类/方法/常量的确切名称和路径
- **Review 建议**：建议"改成 XXX"之前，grep 确认 XXX 存在
- **技术决策**：先查官方文档，不从旧项目经验或项目原则反推（ADR-0007 + 决策四步协议）
- 如果无法确认，标注"实施时确认签名"，不要写死猜测的签名
- 这条规则强化了 `plan-review-before-execution`：Review 的核心价值之一就是捕获这类不匹配
- **上位规则**：`upstream-leverage-law`（全局）——跨文件引用错误在上游修成本 O(1)，在下游修成本 O(n)
