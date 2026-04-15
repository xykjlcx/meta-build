---
title: Radix 组件禁止空字符串 value
type: pitfall
triggers: [Select, SelectItem, RadioGroup, Radix, value, 空字符串]
scope: [前端]
---

# Radix 组件禁止空字符串 value

## 规则
Radix UI 的 Select、RadioGroup 等组件的选项 `value` 属性**不能是空字符串 `""`**。空字符串在 Radix 中被保留为"清除选择/显示 placeholder"的语义，传给 `<SelectItem value="">` 会导致运行时崩溃。

## Why
2026-04-15 M5 Notice 列表页，状态筛选的"全部"选项用了 `<SelectItem value="">`，访问 `/notices` 直接白屏：
> A `<Select.Item />` must have a value prop that is not an empty string.

## How to apply
- 需要"全部/不限"选项时，用 `"ALL"` 或 `"__all__"` 等非空占位值
- 查询参数构造时过滤掉占位值：`filter !== 'ALL' ? filter : undefined`
- 同样适用于 RadioGroup、ToggleGroup 等 Radix 组件
