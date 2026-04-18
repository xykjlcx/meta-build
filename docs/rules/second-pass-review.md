---
name: 高风险任务主动做二轮 Review（不等用户问）
description: 批次级改动（≥3 commit / infra 层 / 契约变更 / ADR 撤销）结束前必须主动做一次独立视角的二轮 review，并把发现交付给用户
type: playbook
scope: 流程
triggers:
  - 完成 ≥3 个 commit 的批次任务
  - 涉及 infra-* / mb-schema / application*.yml 的改动
  - 契约变更（OpenAPI / api-sdk / DTO 重命名）
  - ADR 撤销 / 翻转
  - Milestone 交付
---

# 高风险任务主动做二轮 Review

## 模式

批次级任务**完成后**、交付用户**之前**，主动做一次**独立视角的二轮 review**，把发现（而不是"没发现"）交付。

- **一轮 review**：通常是执行时顺手的自检（编译过 / 测试过 / grep 扫残留）
- **二轮 review**：冷启动式重新过一遍批次产出，找一轮可能漏掉的
- **强调"独立视角"**：不复述一轮做过什么，换角度（事实核查 / 对外影响 / 文档一致性 / 未来读者体验）

## 为什么

**2026-04-18 meta-0023 会话数据**：

- 一轮 review：grep 扫残留全部通过，声称"全绿可交付"
- 用户要求"再 review 一遍"后，二轮主动发现：
  - 🔴 `server/api-contract/openapi-v1.json` 是 500 错报 JSON，持续被写入几小时没人察觉（实际上是 snapshot 测试 bug，前端 orval 读到即废）
  - 🟡 memory `feedback_business_logic_in_application_layer` 的操作指引基于已撤销的 ADR-0022，与代码现状矛盾
  - 🟢 commit `7a8471d1` message 与最终内容脱节（"登录态隔离"写成了 MDC-only）
  - 🟢 commit `b2072282` 声称同步 AGENTS.md，但 Edit 因未 Read silent fail，实际没 sync

**二轮发现的 ROI ≫ 一轮**。一轮只验证"代码跑得动"，二轮验证"产物真的对"。

## 触发条件

满足下列**任一**必须做二轮 review：

- [ ] 本批次 commit 数 ≥ 3
- [ ] 涉及 `infra-*` / `mb-schema` / `mb-common` 等基础设施层
- [ ] 涉及 `application*.yml` / `pom.xml` 的配置改动
- [ ] 契约变更（`api-contract/openapi-v1.json` / `@mb/api-sdk` / DTO 重命名）
- [ ] 新建 / 撤销 / 翻转 ADR
- [ ] Milestone 交付前

**不符合任一条件的小改动（单文件 bug fix、文档 typo）跳过本 playbook**。

## 二轮 Review 的 6 维度视角

按顺序过。每项花 2-5 分钟，不省略：

### 1. 事实核查（grep 扫残留）

批量扫被撤销 / 重命名 / 删除的符号：
```bash
grep -rn "<撤销的类>" server/ docs/
grep -rn "<撤销的配置 key>" server/
grep -rn "<重命名前的字段>" .
```

期望：只在 `docs/adr/` / `docs/handoff/` / `docs/rules/` 里出现。

### 2. 方案自洽性

本批次内部的改动之间有没有互相矛盾？
- 回退 ADR-0022 → 那 memory 里"FK RESTRICT"的操作指引还有效吗？
- 引入新 rule → 和已有 rule 重复 / 冲突吗？
- 删某 bean → 同名方法在别处还有调用吗？

### 3. 对外影响盘点

本批次产出谁会消费 / 谁会看到？
- commit 触发 CI 吗？CI 的哪些步骤会跑？
- 契约变更触发前端 orval 吗？何时？需要协调吗？
- `docs/rules/INDEX.md` 新增的 rule 对未来 session 意味着什么？

### 4. 文档一致性

改了代码 / 架构，文档有没有同步？
- `CLAUDE.md` / `AGENTS.md` 的架构说明 / ADR 索引 / 命令列表
- `docs/specs/` 对应章节的 verify 块
- 相关 `docs/handoff/` 的状态字段

### 5. Commit 历史可读性

拿 `git log --oneline origin/main..HEAD` 看本批次：
- 每个 commit message 与实际 diff 一致吗？
- 有没有 commit 描述的是写时意图，但内容后来变了没更新？
- 原子性如何？有没有应该拆分 / 应该合并的？

### 6. 未来读者体验

想象 3 个月后的自己 / 新加入的同事：
- 翻 `docs/adr/` 能看懂为什么这么做吗？
- 翻 `docs/rules/INDEX.md` 能快速找到本次新增的规则吗？
- 翻本批次 commit log 能一眼看出"这是在干什么"吗？

## 产出模板

二轮 review 结束后，给用户一份结构化报告：

```markdown
## Review 报告

### ✅ 事实核查全部通过
- <grep 扫描结果>
- <关键文件一致性检查>

### 🔴 发现外部前置问题 / 严重回归（如有）
- <问题 + 影响范围 + 是否本次引入>

### 🟡 已修（review 期间顺手修的）
- <修的内容 + 链接到 commit>

### 🟢 小瑕疵（不修说明）
- <现象 + 不修的理由>

### 等待你决策的项
- <需要用户 judgment 的地方>
```

## Review 里不允许的措辞

- "应该都 OK"
- "理论上没问题"
- "测试跑过就行"
- "后面再说"

**这些都是一轮 review 的信号**，不是二轮。二轮必须给具体发现（即便是"0 发现"也要说明扫了哪 6 个维度）。

## 和其他 rules 的关系

- `docs/rules/multi-perspective-review.md`（playbook）：多角色审查，更重；本 rule 是 multi-perspective 的简化版（单人快速自审）
- `docs/rules/cross-review-residual-scan.md`：本 rule 的第 1 维度深化
- `docs/rules/plan-review-before-execution.md`：上游 review（计划阶段）；本 rule 是下游 review（执行后）

## 维护约定

- 每次触发二轮 review 都要**主动**做，不要等用户问"能不能再 review 一下"
- 如果 6 个维度全 0 发现，**依然要出报告**，列出扫了哪些、结论清晰化
- 本 rule 产出的 review 报告可以保留在 `docs/handoff/<date>-review.md` 里（批次大的时候）
