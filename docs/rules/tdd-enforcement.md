---
title: 业务逻辑代码必须 TDD（先写失败测试再实现）
type: pitfall
triggers: [TDD, 测试, test, 先写测试, 业务逻辑, Service, hook, 状态机, bug 修复, 先实现再测试, 补测试]
scope: [流程, 后端, 前端]
---

# 业务逻辑代码必须 TDD（先写失败测试再实现）

## 规则

凡涉及**业务语义**的代码（后端 Service / 状态机 / 权限判断 / 前端业务 hook / 页面业务逻辑 / 任何 bug 修复），**必须先写失败的测试、看它失败、再写最小代码让它通过**，而不是实现先行后补测试。

**Iron Law**：production code 的每一行都应该对应一个此前失败过的测试。**没有失败的测试 → 没有代码**。

与 Superpowers `superpowers:test-driven-development` skill 的规则一致。

## 适用分层（不是无差别全部 TDD）

| 代码类型 | TDD？ | 理由 |
|---|---|---|
| 后端 Service / 状态机 / 权限规则 / Repository 自定义查询 | ✅ **必须** | 有明确输入输出，TDD 回报最高 |
| 后端 bug 修复 | ✅ **必须** | 先写复现测试，否则无法证明已修、也无法防回归 |
| 前端 业务 hook / 表单校验 / 状态管理 / 权限判断 | ✅ **必须** | 有行为、有输入输出 |
| 前端 L3 业务组件的行为逻辑（筛选/排序/表单流/SSE 消费） | ✅ **必须** | 同上 |
| 前端 bug 修复 | ✅ **必须** | 同后端 |
| Spec 引擎生成的骨架（DDL / Controller 骨架 / DTO）| ❌ **不适用** | 骨架是"生成"的不是"写"的；测试针对骨架之上 AI 往里填的业务逻辑 |
| 前端 L2 原子组件的纯视觉表现 | ⚠️ **可选** | Storybook + 视觉回归更合适；纯视觉 TDD 回报低，但**有交互行为时仍必须 TDD** |
| Spike / 探索性原型 | ❌ **例外** | 探索完必须扔掉；重写时走 TDD（Superpowers 原话："Throw away exploration, start with TDD"） |

例外时，commit message 或 PR 描述必须写 `TDD-exempt: <reason>`。

## Why

2026-04-18 审计后端 M4/M5 实际开发轨迹，得到以下 commit 证据：

| 模块 | 实现 commit | 时间 | 测试 commit | 时间 | 间隔 | 顺序 |
|------|-------------|------|-------------|------|------|------|
| business-notice | `1fbc202b` | 23:10 | `a8caee87` | 23:41 | 31 min | 实现 → 测试 |
| platform-dict | `23a2d528` | 15:01 | `f9b31efa` | 15:40 | 39 min | 实现 → 测试 |
| infra-captcha | `004fd064` | 14:08 | （无） | — | ∞ | 无测试 |

**不存在任何"测试 commit 领先实现 commit"的情形**。这是**防守式测试**（事后验收），不是 **TDD**（事前规格）。落差的直接后果：

1. **测试覆盖不均**：mb-admin 集中（iam/notice/notification/dict 测试扎实），但 `mb-platform/*` 和 `mb-business/*` 模块自身零单元测试，infra-captcha 无测试
2. **测试质量风险**：测试按实现的样子写而非按需求的样子写，容易"测实现而非测行为"
3. **与 AI 循环引擎愿景冲突**：MB 终极工作模式 = 人定义 spec + TDD 验收条件 → AI 循环引擎跑一夜。验收条件缺位 ⇒ AI 无围栏 ⇒ 无法无人值守

## How to apply

### 工作流（Red → Green → Refactor）

1. **起步前自问**："这是 TDD 必须的层吗？"（对照上表）
2. **Red**：写一个**最小的失败测试**描述一个业务行为
3. **Verify Red**：运行它，确认**以预期原因失败**（断言失败 / 方法不存在，而不是编译错误或 typo）
4. **Green**：写**最小**代码让它通过，不加任何没被测试覆盖的分支
5. **Verify Green**：再跑测试确认通过，全量测试也绿
6. **Refactor**：保持绿，清理
7. **Commit 顺序**：`test: ...` 先于 `feat:` / `fix:`（同一功能内）

### Git 习惯

- commit 前缀约定：`test: ...` 必须出现在对应的 `feat:` / `fix:` **之前**
- **禁止**单条 commit 同时新增 `src/main/**` 实现 + `src/test/**` 测试（除非明确标注"TDD pair: test-first"且能证明测试先写）
- PR 审查第一项：看 commit 顺序能否看到 red → green 的痕迹

### 向 AI 派发业务逻辑任务时

- Prompt 必须**分两阶段**：
  1. 先让 AI 写测试 + 跑一遍 + 输出失败信息 + 停下等确认
  2. 确认失败原因正确后，再让 AI 写实现
- **禁止**一次性要 AI 输出"实现 + 测试"套餐 —— 这等价于事后补测试
- **bug 修复**：先让 AI 写复现测试、运行确认红、确认"失败原因 = 用户描述的 bug"，再改代码

### 回溯已有代码

- 不追溯补写所有历史代码的 TDD 轨迹（成本不可承受）
- 但**修改任何已有业务逻辑**时走 TDD：
  - 改 bug → 先写失败测试复现 bug
  - 加新行为 → 先写失败测试描述新行为
  - 纯重构（行为不变）→ 可跳过 red 阶段，但要先确认有绿色测试覆盖；没有就先补测试（确认绿），再重构

## 升级路径

本规则**暂时**停留在 rules 层（软约束 + AI 协作纪律），未升级为 ArchUnit 硬守护，因为：

- TDD 是**时序约束**（commit 顺序），ArchUnit 只能检测静态结构，技术上不匹配
- git pre-commit hook 可以做粗粒度拦截（diff 只涉及 `src/main/**` 而无 `src/test/**` 时警告），但会误伤纯重构和骨架生成，副作用大于收益

若未来被违反 ≥2 次，升级为：
1. CI 阶段扫描 PR：`src/main/**` 新增代码但对应 `src/test/**` 未新增 → CI fail（可加 `TDD-exempt` 标签豁免）
2. commit message lint：同 commit 同时含 `feat:` 和新增测试文件 → reject

## 相关规则

- `template-propagation-risk.md`：骨架 bug 会被批量复制 ⇒ 骨架本身 TDD 无意义，骨架之上的逻辑必须 TDD
- `plan-review-before-execution.md`：共用"上游杠杆定律"——测试是最上游的规格，写错或缺失的代价最高
- `plan-code-snippets-must-verify.md`：跨文件引用必须 grep 验证 ⇒ TDD 的 Red 阶段本身就是一种验证（测试跑不过 = 引用或签名有问题）
