# ADR-0019：正交三层契约（Layout × Style × Component Token）的正式落地

## 状态

已采纳

## 日期

2026-04-17

## 背景

ADR-0016 确立了 Style + ColorMode + Customizer 四维度模型，ADR-0017 确立了 Layout Resolver + Preset Registry 机制。两份 ADR 分别解决了"主题维度"和"布局切换"两个独立问题，但没有明确规定 Layout 与 Style 之间如何通过 token 层衔接——即：当某个 Layout 需要特殊的视觉结构（如顶部 Tab 激活态样式、Sidebar 折叠后的 icon 显示）时，这些结构性 token 应该挂在哪一层、由谁覆写。

2026-04-17 实施 feishu style 时，这个问题具体化为：

1. `mix-layout.tsx` 内部大量硬编码了颜色、宽度等结构细节（`MODULE_SWITCHER_SIDEBAR_WIDTH = '15rem'`、`MODULE_SWITCHER_SIDEBAR_COLLAPSED = '3.125rem'`、`border-b-2 border-primary` 等），使得不同 Style 对 Mix Layout 的视觉几乎无法独立覆写
2. `module-switcher` 这个命名让人误解为"功能切换器"，而实际含义是"混合布局"（顶 Tab + 侧栏）
3. Primitive 层的 blue 色板停留在 hue 240（偏冷蓝），与 tailwind 官方标准（hue 259）不一致，feishu style 需要标准飞书蓝（`#3370ff ≈ oklch(0.62 0.214 259)`）时不得不绕路

这三个问题指向同一个根因：**三层 token 的职责边界没有显式约定**，导致 Layout 组件直接硬编码了本该属于 component token 层的结构细节。

## 决策

### 1. 正交三层 token 契约

确立 v1 前端 token 的三层职责划分：

| 层 | 文件 | 职责 | 覆写者 |
|---|---|---|---|
| **primitive** | `tokens/primitive.css` | 色板（10 阶每色）、基础尺寸单位（`--size-*`、`--radius-*`、`--font-*`）——与语义无关的原始值 | 框架维护，只在修正历史债务时改动 |
| **semantic** | `tokens/semantic-*.css` | 54 个语义 token（`--color-primary`、`--color-sidebar`……）——由 style 决定映射到哪个 primitive 值 | 每个 style 一份（classic / feishu / ...），相互隔离 |
| **component** | `tokens/component.css` | 结构 token（`--nav-tab-*`、`--sidebar-item-active-*`、`--sidebar-width`……）——与具体 UI 结构绑定；默认值用 semantic 变量表达；style 的 semantic 文件可选择性覆写 | component.css 提供默认，semantic-*.css 末尾追加覆写 |

**关键约束**：
- Layout 组件（`mix-layout.tsx`、`inset-layout.tsx`）只消费 CSS 变量（`var(--nav-tab-fg)` 等），不硬编码任何颜色/尺寸值
- Component token 在 `component.css` 统一定义默认值；feishu 等 style 通过 `semantic-feishu.css` 末尾追加覆写需要不同值的 token
- CSS 导入顺序铁律：`primitive → semantic-* → component`（保证 semantic 用到的 primitive 变量已定义、component 用到的 semantic 变量已定义）

### 2. `module-switcher` preset rename → `mix`

将 `@mb/app-shell` 中的 `module-switcher` preset 全面改名为 `mix`：

| 改动面 | 旧 | 新 |
|---|---|---|
| 目录 | `presets/module-switcher/` | `presets/mix/` |
| 文件 | `module-switcher-layout.tsx` | `mix-layout.tsx` |
| 类型/函数 | `ModuleSwitcherLayout` | `MixLayout` |
| Registry id | `'module-switcher'` | `'mix'` |
| i18n key | `layout.moduleSwitcher` / `layout.module-switcherDesc` | `layout.mix` / `layout.mixDesc` |

**命名依据**：对齐 Ant Design Pro 的 MixLayout 术语（顶部 Tab + 侧栏混合布局），避免"switcher"暗示"用于切换模块的功能组件"的误导。

**兼容策略**：不做旧 id 双写。localStorage 存有旧值 `mb_layout_preset='module-switcher'` 的用户，查询 registry 时找不到，自然回落到 `defaultLayoutId='inset'`（已有逻辑）。项目 v1 阶段无外部用户，不需要迁移脚本。

### 3. Primitive blue 色板修正（hue 240 → 259）+ 补全 10 阶

将 `primitive.css` 的 blue 色板从"偏冷蓝"（hue 240）修正为 tailwind v4 官方 blue 标准（hue 259，chroma ~0.214），同时补齐缺失的 50/100 阶：

```css
--color-blue-50:  oklch(0.98 0.014 259);
--color-blue-100: oklch(0.93 0.04  259);
--color-blue-200: oklch(0.87 0.08  259);
/* ... 完整 10 阶 */
--color-blue-500: oklch(0.62 0.214 259);   /* ≈ #3370ff，飞书品牌蓝 */
```

**触发点**：feishu style 实施时，需要飞书品牌蓝（`#3370ff`）作为 `--color-primary`；旧 blue-500（hue 240）视觉偏冷，不符合飞书实际配色。修正 primitive 比在 feishu 语义层单独声明 oklch 字面量更符合"语义层映射 primitive，不引用字面量"的 token 原则。

**上游影响**：
- `semantic-classic.css` 的 `--color-info: var(--color-blue-500)` 视觉从"冷蓝 hue 240"变为"正蓝 hue 259"，色感可感知但语义"中性提示"不变
- `shadcn-classic.md` 色板文档同步更新数值
- 消费 `.bg-blue-500` / `.text-blue-500` 等 utility class 的业务代码，class 名不变，视觉颜色跟随变化

## 理由

**为什么在实施 feishu 之前先做 mix rename（而不是之后）**：rename 改动面涵盖 5 份 spec 文档和 ADR-0017，如果在 feishu style 实施后再改名，后续 AI agent 读到的文档和代码会混用旧/新名称，造成 doc drift。rename 作为 W1 的第一步，确保 feishu style（W2）的所有文档和代码引用都使用正确的 `mix` 名称。

**为什么 component token 放 semantic 文件末尾覆写，而不是单独一个文件**：减少文件数量；覆写与 semantic 定义上下文在一起，方便 AI 读取"这个 style 到底改了哪些结构 token"；CSS 特异性（`[data-theme-style='feishu']` 选择器）高于 component.css 默认值，不需要 `!important`。

**为什么 primitive blue 修正而不是新增 `--color-feishu-blue-500`**：上游杠杆定律——primitive 是最上游层，修正一次胜过每个 style 都声明一个字面量。同时 tailwind 标准 blue（hue 259）有广泛共识，作为 meta-build 的默认 blue 比"历史原因的 hue 240"更合理。

## 影响

### 正面影响

- Layout × Style 正交性完整落地：4 个组合（inset/mix × classic/feishu）视觉均可独立控制，无需对 Layout 组件写 Style 特化逻辑
- `mix` 命名简洁，与 Ant Design Pro 社区惯例一致，减少认知负担
- Primitive blue 修正后，feishu 和 classic 共享同一套蓝色阶梯，减少维护分叉

### 代价

- Classic × mix 下 sidebar 宽度从 15rem → 16rem、collapsed 从 3.125rem → 4rem（与 inset 统一，属于有意的回归）
- Classic 的 info 色视觉轻微变化（hue 240 → 259），属于"修正历史债务"的可接受代价
- localStorage 存旧 preset id 的用户自动回落到 inset（v1 无外部用户，风险可控）

### 已知限制（本次不处理）

以下两个问题在实施中识别，记录在此，待独立 ADR/任务跟进：

1. **Mix Layout 的 hero 区越权**：`mix-layout.tsx` 在主内容区渲染了"预设 label + 模块名 H1"，属于 shell 层对业务 UI 的越权。应通过 `heroSlot` 注入，但本次保持现状。
2. **品牌区硬编码**：`mix-layout.tsx` 中 `<div>Meta Build</div>` + `<LayoutGrid>` icon 应通过 `brandSlot` 或 brand token 驱动，本次不改。

## 相关文档与 commit

- 设计规范：[`docs/specs/frontend/2026-04-17-feishu-style-and-mix-rename.md`](../specs/frontend/2026-04-17-feishu-style-and-mix-rename.md)
- 相关 ADR：[ADR-0016](0016-前端主题系统从theme切换到style加color-mode与customizer.md) / [ADR-0017](0017-app-shell从固定布局切换到layout-resolver加preset-registry.md) / [ADR-0018](0018-废弃compact主题改为style加customizer维度组合.md)
- 关键 commit：
  - `6e1e03aa` — Rename module-switcher preset → mix
  - `52a93888` — primitive blue 色板修正到 tailwind 标准 + font-sans 补 PingFang
  - `413988b5` — 注册 feishu style + web-admin 白名单
  - `6f932a35` — Merge branch 'feat/feishu-mix-rename'（完整实施合并）
