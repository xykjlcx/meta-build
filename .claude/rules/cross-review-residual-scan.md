---
title: 交叉审查 + 残留扫描
type: pitfall
triggers: [批量替换, 重命名, rename, 多 agent 并行, 并行修改, grep 归零]
scope: [流程, 全栈]
---

# 交叉审查 + 残留扫描

## 规则
批量替换/重命名后，必须做残留扫描（grep 旧名称确认归零）。多 agent 并行修改后，必须做交叉审查（至少一轮 code-reviewer 检查残留）。

## Why
2026-04-11 模块命名重命名（framework→infra, system→platform）涉及 200+ 处替换，靠人眼不可能查全。通过 grep 旧名称确认归零才能确保一致性。2026-04-12 前端 spec 4 agent 并行修改后，code-reviewer 发现 5 处严重残留（旧命名、旧格式未同步），说明多 agent 并行修改后必须有一轮交叉检查。

## How to apply
- 批量替换完成后，立即 grep 所有旧名称，结果必须为零（或全部是合法保留并逐一确认）
- 多 agent 并行修改完成后，dispatch 一个 code-reviewer agent 做残留扫描
- 残留扫描的范围不限于本次修改的文件，要扫全项目（交叉引用可能在任何文件）
- 发现残留 → 修复 → 再扫一轮确认
