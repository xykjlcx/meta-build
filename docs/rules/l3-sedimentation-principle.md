---
title: L3 是沉淀出来的，不是设计出来的
type: playbook
triggers: [新增组件, 考虑 L3 下沉, ui-patterns 扩展, Dashboard 图表组件, features/components]
scope: [前端]
---

# L3 是沉淀出来的，不是设计出来的

## 模式

meta-build 的 5 层前端架构里：
- L1 `@mb/ui-tokens`：设计出来的（自上而下的契约）
- L2 `@mb/ui-primitives`：设计出来的（shadcn/ui v4 原版骨架）
- **L3 `@mb/ui-patterns`：沉淀出来的（业务实战中多次复用后提炼）**
- L4 `@mb/app-shell`：设计出来的（Layout / Provider 基础设施）
- L5 `web-admin`：消费层

L1/L2/L4 是"自上而下的契约层"，可以预先设计；L3 是"自下而上的沉淀层"，必须等业务场景验证过再抽象。提前设计 L3 会产生"想象中的复用"——抽象早、场景少、API 打磨不足，结果是 L3 膨胀而真实复用率低。

## 适用场景

- 新业务页面（如 Dashboard、模块首页）涌现出多个组件，纠结"要不要顺手放 L3"
- Review PR 时看到"顺手沉淀 L3"的动作，需要判断是否该拦下
- Milestone review 时盘点 `features/*/components/`，判断是否批量下沉

## 判断标准

### 可以下沉 L3
- 组件已经在 **2 处以上实际业务场景**使用
- 业务语义清晰（不是"花哨的 Card"这种装饰性组件）
- 有稳定的 API 抽象（props 接口经过多轮使用打磨过）
- 未来新业务模块会很自然地继续用它

### 不应下沉 L3
- 只在 1 处使用（哪怕看起来通用）
- 是"想象中的复用"（"以后别的页面可能会用" → 以后再说）
- 业务耦合强但 props 抽象不清晰
- 为了"让 L3 更丰富"而下沉

## 具体步骤

1. **做新页面时**：把新组件先放 `features/<domain>/components/`，不走 L3
2. **Review PR 时**：看到"顺手下沉 L3"的动作，先问"它在几处使用？API 是否已打磨？"
3. **Milestone review 时**：盘点 `features/*/components/` 里是否有高频重复的组件，再考虑批量下沉
4. **下沉时**：带着 2+ 处真实调用点一起迁移，而不是先放 L3 再改调用方

## 效果数据

2026-04-18 Claude Design 对齐讨论（决策 Q11）：Dashboard 需要 5 个图表组件（StatCard / Sparkline / LineChart / BarChart / ActivityFeed）。是否下沉 L3？判断过程：
- Dashboard 是演示页面、图表只用一次、没有经过业务实战检验
- 未来可能复用的场景（监控面板、业务模块首页）都还未落地
- 结论：**不下沉**，先在页面内私有使用，未来真出现复用需求再沉淀

## 底层逻辑

与 `template-propagation-risk.md` 反向呼应：模板错误会被 AI 批量复制（上游放大效应）→ L3 是最上游的业务组件契约，一旦下沉不当，N 个业务模块会继承这个不成熟的抽象。先让组件在 L5 经过实战，props 和边界稳定后再沉淀，等于用**使用频次**当天然筛子，避免 L3 变成"想象中的复用"的垃圾场。
