---
name: 过度工程化陷阱识别
description: Review 发现"隐患"时先问"是不是真问题"，避免链式叠加补丁方案；本条是 meta-0023 的规则化沉淀
type: pitfall
scope: 流程 / 全栈
triggers:
  - 代码审查发现"隐患 / 潜在风险 / 技术反模式"
  - 性能 / 一致性 / 可观测性类改造
  - 方案写到第 2 轮还在补新问题
---

# 过度工程化陷阱识别

## 规则

Review 里识别的"技术现象"**不等于**"必须解决的问题"。进入"怎么做"之前必须先过两道闸门：

### 闸门 1：是不是真问题？

强制自问 4 件事，任一回答"no"就 stop：

1. 这个现象在**当前阶段**的真实影响有多大？（举具体数字 / 监控数据 / 压测结果）
2. 不解决会怎样？（最坏情况）
3. 解决方案引入的复杂度 vs 问题本身严重程度，比例合理吗？
4. 能不能登记到 `docs/handoff/v1-pre-prod-checklist.md` 等有真实数据再决定？

只有 1-4 都明确答出"必须现在做"，才进"是什么 / 怎么做"。

### 闸门 2：链式陷阱信号

一旦出现这些症状，**立即停下来**回到闸门 1 重审"最初那个问题是不是伪问题"：

```
Review 发现隐患
  → 设计方案 A
    → Review 方案 A 发现新问题
      → 设计方案 B 作为"更彻底解决"
        → Review 方案 B 又发现新问题
          → 设计方案 C...
```

每轮方案的复杂度持续叠加，就是最初"是不是"跳过了的信号。不是方案不够好。

## Why

**2026-04-18 meta-build M5 的反面样本**（见 meta-0023）：

起点是 review 识别出两个"隐患"：
- `PermissionService` 每次鉴权查三表 JOIN、无缓存
- `NotificationDispatcher` 用 `CompletableFuture.orTimeout` 不能真正中断阻塞线程

两条都直接进入"怎么做"，各自产生过度工程方案：
- ADR-0021：Java 25 升级 + 全局虚拟线程 + Dispatcher 重写 fire-and-forget
- ADR-0022：FK CASCADE → RESTRICT + Repository 改 + jOOQ listener + Facade + ArchUnit 规则

两轮 review 都发现新问题（Spring Boot 3.5.3 不兼容 Java 25 / listener 自递归 / Facade 职责迁移缺失等），若继续补丁就是第 3 轮过度工程。

洋哥一句"**到底有没有必要做这两个 ADR？问题本身影响真的大吗？**" 打断循环：

- PermissionService 无缓存 → 当前 QPS < 1 / PG 毫无压力 → **伪问题**
- Dispatcher 无超时 → 通知量日均个位数 / `mbAsyncExecutor` 队列稳定 0 → **伪问题**

最终撤销两个 ADR + 回退三个 commit（见 meta-0023），复杂度归零。

## How to apply

### Review PR 时

- Review 报告里每条"🔴"都先写一行影响评估：`当前 QPS / 数据量 / 错误率 = ?，阈值 = ?`
- 没有数据支撑的"🔴"降级为"📌待数据验证"，登记到 pre-prod checklist
- 真正的"🔴"保留（安全漏洞 / 明确违反 spec / 破坏数据正确性等）

### 设计方案时

- 写方案第一节必须是"是不是"自检 4 问的答案
- 方案写到第 2 轮还在补新问题时，强制回到"最初那个问题是不是伪问题"
- 方案复杂度 >> 问题严重度时，优先方案"登记到 pre-prod checklist 等数据"

### 引用资源

- 本次反面样本：[meta-0023](../adr/meta-0023-over-engineering-case-study.md)
- 决策四步协议：feedback memory `feedback_research_before_framing.md`（全局 memory）
- 验证方式登记：[docs/handoff/v1-pre-prod-checklist.md](../handoff/v1-pre-prod-checklist.md)

## 关联规则

- `plan-review-before-execution.md`：计划写完必须先 Review 再实施
- `adr-before-code.md`：翻转决策必须先写 ADR 再改代码
- `upstream-leverage-law.md`（全局）：上游决策的错误会被下游 N 个产出物放大，"是不是"错了，后面全错
