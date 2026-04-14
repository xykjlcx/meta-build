---
title: verify 块纪律
type: pitfall
triggers: [specs, verify, 新增约束, 新增规则, verify-docs.sh, 文档验证]
scope: [流程, 全栈]
---

# verify 块纪律

## 规则
specs 文件中的 `<!-- verify: -->` 块必须可执行且覆盖完整。新增规则/约束时，必须同步新增对应的 verify 块，且 `verify-docs.sh` 同步扩展覆盖新关键词。

## Why
2026-04-13 ADR-0009~0012 补写后，发现 verify-docs.sh 未扩展覆盖新关键词（如 mb_ 前缀、操作日志等），导致新规则没有自动化验证保障。后续 92→112→250 项验证的递增过程证明：每轮决策变更都必须同步扩展验证覆盖面，否则 drift 悄悄进入。

## How to apply
- 改 specs 加了新约束 → 同文件加 `<!-- verify: -->` 块
- 跑 `verify-docs.sh` 确认新块被纳入统计
- 如果新增了全新的校验维度（如新的表前缀、新的注解名），在 verify-docs.sh 中增加对应的 grep 规则
- milestone 完成时 verify 全绿是交付门槛
- **参考**：验证脚本位于 `scripts/verify-docs.sh`
