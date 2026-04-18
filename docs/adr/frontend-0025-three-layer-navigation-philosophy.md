# ADR frontend-0025：三层导航哲学（系统 / 模块 / 页面）

## 状态

已采纳

## 日期

2026-04-18

## 背景

Claude Design 原型展示了 Topbar 双 Tab（企业管理 / 产品设置）+ Sidebar 分组的信息架构。在对齐讨论中（ADR frontend-0024 决策 Q4），洋哥基于第一性原理推导出更通用的三层导航抽象，把九宫格的定位从「布局变体」升级为「系统级切换」。这一推导的结果需要独立成文展开论证，因为它不仅是一次 UI 摆放决策，更是 meta-build 对中大型企业后台信息架构的哲学表态。

## 决策

meta-build 采用正交的三层导航：

| 层级 | 抽象 | UI 入口 | v1 实现 | 未来扩展 |
|---|---|---|---|---|
| 系统级 | System | 九宫格图标（Topbar 最右） | 前端硬编码占位，点击出悬浮框 | 表驱动 / 配置驱动 |
| 模块级 | Module | Header Tab（上限 5） | 顶层菜单节点（`parent_id=null`）作为 Tab | - |
| 页面级 | Page | Sidebar 菜单项 | 现有菜单树（`parent_id` 指向当前激活模块） | - |

## 理由

- **系统级 vs 模块级**：不同系统（财务 / CRM / 快递打单）之间是「应用间跳转」，模块（应收 / 应付 / 账单）之间是「应用内切换」。两者的用户心智、权限边界、数据隔离都不同，应该正交拆分。合并会让任何一层都不够用。
- **模块级 UI 跟随 layout**：有 Header Tab 的 layout（claude-classic / claude-inset / claude-rail / mix）显示为 Tab，没有 Header Tab 的 layout（inset）显示为 Sidebar 一级节点。数据模型统一，UI 由 layout 决定。
- **数据模型零改动**：现有 `mb_iam_menu` 表的 `parent_id` 自引用天然支持多层树，顶层节点就是模块，不需要引入新表。这与 ADR frontend-0024 决策 10（菜单数据模型零改动）一致。

## 拒绝的替代方案

### 替代 1：单层菜单 + 路由前缀分组（如 `/org/*`、`/content/*`）

- **方案**：不引入「模块」抽象，统一铺平菜单；在 UI 层按路由前缀分组为视觉 group。
- **拒绝原因**：
  1. 分组信息与 URL 硬绑定，后期调整分组（例如把「菜单管理」从「组织管理」挪到「产品设置」）需要改路由 + 所有相关链接，代价高。
  2. 前后端都要引入分组语义的 convention，容易长时间 drift（前端改了前缀但 iam 权限码没跟上）。
  3. 新业务模块加入时要先约定前缀，违反「数据驱动、UI 消费」的原则。

### 替代 2：把「系统」做成 layout 变体（每个系统一个 preset）

- **方案**：不引入九宫格，而是给每个系统（财务 / CRM / 物流）分别定义一套 layout preset，用户通过切 preset 进入不同系统。
- **拒绝原因**：
  1. 混淆「视觉形态」（preset）和「业务边界」（system）两个正交维度，每加一个系统都要造一个 preset，preset 数量爆炸。
  2. 同一个系统内用户可能想切 preset 风格（`claude-classic` → `claude-inset`），这个需求和切系统独立，不该耦合。
  3. v1 多系统实际还不存在，超前做成 preset 是明显的 YAGNI。

### 替代 3：给菜单数据加 `group` meta 字段

- **方案**：后端 `mb_iam_menu` 表加 `group_key` 字段，前端按 group 分组渲染。
- **拒绝原因**：
  1. 现有 `parent_id` 自引用树已经天然承担「分组」语义，再加 `group_key` 是冗余。
  2. 会让「分组」和「目录节点」两个概念并存，数据模型复杂度上升、约束变多（group 和 parent 之间是否一致？）。
  3. ADR frontend-0024 决策 10 已明确「数据模型零改动」，引入新字段破坏该承诺。

## 影响

- 前端新增 `useActiveModule` hook（从 URL 推导当前激活的顶层节点 id，支持 localStorage 恢复 / 首次 fallback）
- 新增 `HeaderTabSwitcher` 组件（被 `claude-classic` / `claude-inset` / `claude-rail` / `mix` preset 共用）
- Sidebar 改造为「按 `activeModuleId` 过滤子节点」
- 九宫格占位实现为 `SystemSwitcher`（Topbar 最右图标 + 悬浮框，v1 数据硬编码在 `web-admin/src/config/systems.ts`）
- 后端零改动（菜单表结构不变）

## 如何验证

- 所有 preset 消费同一份 `MenuNode[]`，切换 preset 不需要改数据。
- `useActiveModule.test.ts` 覆盖 URL 推导 / localStorage 恢复 / 首次 fallback 三种场景。
- 跨 preset 切换时 Sidebar 内容随 `activeModuleId` 自动切换，无状态丢失。
- 有 Header Tab 的 preset 显示 Tab，无 Header Tab 的 preset 显示为 Sidebar 一级节点，视觉回归截图通过。

## 关联 ADR

- [ADR-0017](0017-app-shell从固定布局切换到layout-resolver加preset-registry.md)（Layout Resolver + Preset Registry）：扩展
- [ADR frontend-0024](frontend-0024-claude-design-alignment-decisions.md)（14 项决策汇总）：本 ADR 是其 Q4 决策的详细展开
