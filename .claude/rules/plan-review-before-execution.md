---
title: 计划必须 Review 后才能实施
type: playbook
triggers: [计划, plan, 实施, execute, writing-plans, 并行, 串行]
scope: [流程]
---

# 计划必须 Review 后才能实施

## 模式
实施计划创建完成后，**禁止直接进入编码**。必须先经过至少一轮 Review，确认计划无重大问题后再开始实施。

## 适用场景
- superpowers:writing-plans 完成后
- 任何多步骤实施计划写完后
- 被问"并行还是串行开始？"之前

## 具体步骤

1. **计划写完后，第一反应是 Review，不是开始实施**
2. Review 手段（按需组合，至少用一种）：
   - `/codex:adversarial-review` — Codex 对抗性审查，专门挑逻辑漏洞、遗漏、与 specs 的 drift
   - `superpowers:requesting-code-review` — 多角色审查（架构师、DBA、AI 执行者等）
   - 人工 Review — 洋哥自己判断方向和优先级
3. **Review 发现的问题在计划阶段修复**，不要带到代码阶段
4. 计划确认无重大问题后，再决定并行/串行实施

## 效果数据
2026-04-14 M2 和 M4 两个会话均在计划阶段审查出大量问题。如果直接编码，这些问题会累积到代码中，修复成本从 O(1) 变为 O(n)。

## 底层逻辑
与 `template-propagation-risk.md` 同理：**计划是代码的模板，模板的 bug 会被批量复制。** 上游多花 30 分钟审查，下游省 3 小时返工。
