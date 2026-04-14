---
title: 计划中的代码片段必须 grep 验证
type: pitfall
triggers: [计划, plan, writing-plans, 代码片段, 方法签名, 实施]
scope: [流程]
---

# 计划中的代码片段必须 grep 验证

## 规则
实施计划中引用的方法名、类名、工具类，在写入计划时必须 grep 确认存在且签名匹配。不能凭记忆写代码片段。

## Why
2026-04-14 M4 审查修复计划中，3 处方法名与实际代码不匹配：
- `authFacade.login(sessionData)` → 实际是 `doLogin(Long, SessionData)`
- `CurrentUserUtil.getCurrentUserId()` → 该类不存在
- `ALL_PERMISSIONS` from `'../config/permissions'` → 实际是 `ALL_APP_PERMISSIONS` from `'@mb/api-sdk'`

这些错误在计划 Review 阶段被 Codex 对抗审查和 4 角色 Review 发现。如果跳过计划 Review 直接实施，agent 会在编译错误上反复撞墙浪费时间。

**根因**：写计划时处于"设计思维"，倾向于写"应该有的"方法名而不是"实际存在的"方法名。计划的价值在于方向和步骤，里面的代码片段可信度很低。

## How to apply
- 计划中每个 `modify` 文件，至少 grep 确认引用的方法/类存在
- 对于跨文件调用（A 调 B 的方法），grep B 的方法签名写入计划
- 如果无法确认，在代码片段旁标注"实施时确认签名"，不要写死一个猜测的签名
- 这条规则强化了 `plan-review-before-execution`：Review 的核心价值之一就是捕获这类不匹配
