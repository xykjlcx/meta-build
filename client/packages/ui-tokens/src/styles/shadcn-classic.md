# shadcn-classic · Design System

> Meta-Build 的默认风格契约。本文档是"风格样板"——任何新增 style（飞书扁平、Apple 温暖、Notion 灰卡等）都可以复制本结构并重写各章内容。
>
> **文档定位**：给 AI 和人类读的**风格宪法**。CSS token（primitive/semantic/component）是机器可执行的约束，本文档是人读得懂的设计意图和边界。两者任何一方更新必须同步另一方。

---

## 1. Visual Theme & Atmosphere

shadcn-classic 呈现的是**现代 SaaS 管理后台的极简美学**：以纯白背景为画布，极浅冷灰 (hue 286°) 的 Sidebar 做侧翼，近黑色 (`oklch(0.141 0.005 286)`) 作主色，高对比度承载信息。整体气质接近 Linear、Vercel Dashboard、shadcn/ui 官方样例——冷静、克制、不喧宾夺主。

标志性的视觉特征是 **Inset 浮起卡片**：Sidebar 之外的内容区域以 `m-2 rounded-xl shadow-sm` 的白卡片浮在极浅冷灰背景之上，顶部 Header 用 `backdrop-blur` 毛玻璃半透明；卡片内部才是真正的业务内容区。这种"壳层极浅灰 + 内容区浮起白卡"的双层结构是 shadcn-classic 区别于其他风格的核心视觉语言。

与其他风格的对照：
- **飞书风格**（未来）：企业蓝 + 扁平化 + 无圆角 / 小圆角，信息密度更高；对应 `feishu-flat`
- **Apple 温暖风格**（未来）：米色背景 + 衬线标题 + 大圆角，更偏消费 toC；对应 `apple-warm`
- **Notion 灰卡风格**（未来）：暖灰 + 中等留白 + 无阴影，偏文档/笔记；对应 `notion-calm`

## 2. Color Palette & Roles

### Primary

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `oklch(0.141 0.005 286)` / `var(--color-gray-950)` | Primary button / link / icon，近黑偏冷 |
| `--color-primary-foreground` | `#ffffff` | Primary button 文字 |

### Surface

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-background` | `#ffffff` | 画布底色（body / 内容卡片底） |
| `--color-card` | `#ffffff` | Card / Dialog 内部 |
| `--color-popover` | `#ffffff` | Popover / DropdownMenu / Tooltip 底 |
| `--color-muted` | `oklch(0.967 0.001 286)` | 表格 header、浅色辅助区块 |
| `--color-sidebar` | `oklch(0.97 0.003 250)` | Sidebar 底色（极浅冷灰，参考站独有） |

### Text

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-foreground` | `oklch(0.274 0.006 286)` / `var(--color-gray-800)` | 正文 |
| `--color-muted-foreground` | `oklch(0.552 0.013 286)` / `var(--color-gray-500)` | 辅助文字 / placeholder |
| `--color-card-foreground` | 同 foreground | Card 内文字 |
| `--color-sidebar-foreground` | `var(--color-gray-500)` | Sidebar 菜单文字（未 active） |

### Border & Input & Ring

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-border` | `var(--color-gray-200)` | 分割线、Card 外边框 |
| `--color-input` | `var(--color-gray-300)` | Input / Select 边框 |
| `--color-ring` | `var(--color-gray-800)` | Focus Ring（近黑高对比） |

### Semantic Status

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-destructive` | `var(--color-red-600)` | 删除 / 危险操作 |
| `--color-success` | `var(--color-green-500)` | 成功状态 |
| `--color-warning` | `var(--color-amber-500)` | 警告状态 |
| `--color-info` | `var(--color-blue-500)` | 中性提示 |

### Sidebar（专用 8 个）

| Token | 值 |
|-------|-----|
| `--color-sidebar` | `oklch(0.97 0.003 250)` |
| `--color-sidebar-foreground` | `var(--color-gray-500)` |
| `--color-sidebar-primary` | `var(--color-gray-950)` |
| `--color-sidebar-primary-foreground` | `#ffffff` |
| `--color-sidebar-accent` | `var(--color-gray-200)` |
| `--color-sidebar-accent-foreground` | `var(--color-gray-950)` |
| `--color-sidebar-border` | `var(--color-gray-200)` |
| `--color-sidebar-ring` | `var(--color-gray-800)` |

### Chart（primitive，跨 style 共享）

| Token | 值 | 说明 |
|-------|-----|-----|
| `--chart-1` | `oklch(0.141 0.005 286)` | 近黑 |
| `--chart-2` | `oklch(0.35 0.04 250)` | 暖冷蓝灰 |
| `--chart-3` | `oklch(0.21 0.008 286)` | 深灰 |
| `--chart-4` | `oklch(0.6 0.04 250)` | 中冷蓝灰 |
| `--chart-5` | `oklch(0.78 0.015 286)` | 浅灰 |

## 3. Typography Rules

### Font Family

| Role | Stack |
|------|-------|
| Sans | `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Mono | `ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace` |
| Heading | `var(--font-sans)`（与 Sans 同一字体栈，不使用 Serif） |

### Hierarchy

| Role | Font | Size | Weight | Line Height | 用途 |
|------|------|------|--------|-------------|------|
| Display | Sans | 2.25rem (36px) | 600 | 1.2 | 登录页 / 空状态大标题 |
| Heading 1 | Sans | 1.5rem (24px) | 600 | 1.3 | 页面标题 |
| Heading 2 | Sans | 1.25rem (20px) | 600 | 1.4 | 区块标题 / CardHeader |
| Heading 3 | Sans | 1rem (16px) | 600 | 1.5 | 卡片内部小标题 |
| Body Large | Sans | 0.9375rem (15px) | 400 | 1.5 | 列表项 / 正文段落 |
| Body | Sans | 0.875rem (14px) | 400 | 1.5 | **默认正文（管理后台紧凑密度）** |
| Body Small | Sans | 0.8125rem (13px) | 400 | 1.5 | 辅助文字 / Form label |
| Caption | Sans | 0.75rem (12px) | 400 | 1.5 | Metadata / Badge / Tooltip |
| Code | Mono | 0.875rem (14px) | 400 | 1.5 | 行内代码 / pre |

### Principles

- 全程使用 Sans 字体（Heading 也是 Sans），保持现代 SaaS 简洁感——不使用 Serif
- 所有 Heading 统一 `font-weight: 600`，不用 700 避免厚重
- 正文默认 14px 是管理后台紧凑密度的锚点；面向非管理后台的场景（落地页、营销页）可基于本风格复制后改为 16px
- 行高统一 1.5（Heading 1.2–1.4），保证可读性

## 4. Component Stylings

### Button

| Variant | Background | Foreground | Height | Radius | Shadow |
|---------|-----------|------------|--------|--------|--------|
| Primary | `var(--color-primary)` | `var(--color-primary-foreground)` | `2.25rem` | `var(--radius-md)` (0.375rem) | `var(--shadow-sm)` |
| Secondary | `var(--color-secondary)` | `var(--color-secondary-foreground)` | `2.25rem` | `var(--radius-md)` | none |
| Outline | transparent | `var(--color-foreground)` | `2.25rem` | `var(--radius-md)` | none（1px border） |
| Ghost | transparent | `var(--color-foreground)` | `2.25rem` | `var(--radius-md)` | none |
| Destructive | `var(--color-destructive)` | `var(--color-destructive-foreground)` | `2.25rem` | `var(--radius-md)` | `var(--shadow-sm)` |

Padding 统一 `0.5rem 1rem`（8×16px）。

### Card

- Background：`var(--color-card)`
- Border：`1px solid var(--color-border)`
- Radius：`var(--radius-lg)` (0.5rem)
- Shadow：`var(--shadow-sm)`（Inset 浮起效果的核心）
- Padding：`1.5rem`（24px）

### Input / Select / Textarea

- Background：`var(--color-background)`（或透明）
- Border：`1px solid var(--color-input)`
- Height：`2.25rem`（Textarea 多行不限）
- Radius：`var(--radius-md)` (0.375rem)
- Focus Ring：`2px var(--color-ring)` + `1px offset`

### Table

- Header Background：`var(--color-muted)`
- Header Foreground：`var(--color-muted-foreground)`
- Row Background：`var(--color-card)`
- Border：`1px solid var(--color-border)` between rows
- Row Height：`2.75rem`（40px，紧凑密度）

### Sidebar

- Background：`var(--color-sidebar)`（极浅冷灰）
- Foreground：`var(--color-sidebar-foreground)`
- Width：`16rem` (256px)，对齐参考站
- Item Height：`2rem`（32px）
- Item Radius：`var(--radius-md)`
- Active Background：`var(--color-sidebar-accent)`
- Active Foreground：`var(--color-sidebar-accent-foreground)`

### Header

- Background：`var(--color-background)` + `backdrop-filter: blur(8px)`（Inset 半透明效果）
- Height：`3.5rem` (56px)
- Border Bottom：`1px solid var(--color-border)`
- Sticky top-0

### Dialog / Sheet / Popover

- Background：`var(--color-popover)` / `var(--color-card)`
- Border：`1px solid var(--color-border)`
- Radius：`var(--radius-lg)`
- Shadow：`var(--shadow-lg)`（Modal）或 `var(--shadow-md)`（Popover）

## 5. Layout Principles

### Spacing Scale

基本单位 4px (0.25rem)，刻度：

| 名称 | 值 | 用途 |
|------|-----|------|
| space-1 | 4px | Icon 内 padding、tight gap |
| space-2 | 8px | Button 内 icon-text gap、小 gap |
| space-3 | 12px | Form field 内 padding |
| space-4 | 16px | Card 之间 gap、标准 padding |
| space-5 | 20px | 卡片内 section gap |
| space-6 | 24px | Card padding、section gap |
| space-8 | 32px | 区块之间大 gap |
| space-12 | 48px | 页面顶部 padding |
| space-16 | 64px | 空状态 / 登录页大留白 |

### Grid & Container

- Max content width：`80rem` (1280px)
- Sidebar width：`16rem` (256px) — 固定
- Content area：flex-1，左右各留 `0.5rem` inset 浮起 margin
- Responsive breakpoints：640 / 768 / 1024 / 1280 / 1536（Tailwind 默认）

### Border Radius Scale

| Scale | 值 | 用途 |
|-------|-----|------|
| `--radius-none` | 0 | 全宽 banner / 特殊贴边 |
| `--radius-sm` | 0.25rem (4px) | Badge / Tag |
| `--radius-md` | 0.375rem (6px) | Button / Input / Menu item |
| `--radius-lg` | 0.5rem (8px) | Card / Dialog / Sheet |
| `--radius-xl` | 0.75rem (12px) | Inset 浮起 Content 容器 |
| `--radius-full` | 9999px | Avatar / Pill tag |

### Whitespace Philosophy

- **管理后台紧凑密度**：行高 1.5、字号 14px、行高 32px（Sidebar item），信息密度优先
- Card 之间统一 1rem gap
- Section 之间 2rem gap
- Page 顶部 padding 1.5rem
- 两栏表单（label + field）水平 gap 1rem、垂直 gap 1rem

## 6. Depth & Elevation

| Level | Treatment | 用途 |
|-------|-----------|------|
| 0 · Flat | 无 shadow / 无 border | Body 背景、Sidebar 底色 |
| 1 · Subtle | `1px solid var(--color-border)` | 普通 Card（不浮起的） |
| 2 · Rise | `shadow-sm` + white bg | **Inset 浮起卡片（shadcn-classic 核心效果）** |
| 3 · Popover | `shadow-md` + white bg | Popover / DropdownMenu / Tooltip |
| 4 · Modal | `shadow-lg` + white bg | Dialog / Sheet / Drawer |
| 5 · Toast | `shadow-xl` + white bg | Sonner toast / 浮层通知 |

### Philosophy

shadcn-classic 的深度通过 **shadow + 轻微 border** 配合，不用厚重阴影。阴影有纵深但不压迫。最标志性的效果：

```
Body (gray-50 背景)
  └─ Inset 容器 (m-2 rounded-xl shadow-sm bg-background)
       └─ Card (rounded-lg border)
```

这个双层浮起结构是 shadcn-classic 与其他风格的核心差异。

## 7. Do's and Don'ts

### Do

- 用近黑 `--color-primary` (oklch(0.141 0.005 286)) 作主色，保持高对比度
- Card 用 `shadow-sm` + `rounded-lg` 营造 Inset 浮起感
- 保留极浅冷灰 (Sidebar bg) 与白色 (Card bg) 的微妙对比——这是 shadcn-classic 的视觉身份
- Button 统一 `0.375rem` 圆角、`2.25rem` 高度
- 管理后台坚持 14px 字号紧凑密度
- 全程使用 oklch 色空间，不要混用 lab/rgb/hex（除了 `#ffffff` / `#000000` 纯色）
- 图表统一消费 `--chart-1` ~ `--chart-5`，不要硬编码色值

### Don't

- 别加饱和色作主色（除了 destructive/success/warning/info 等 semantic 状态）
- 别用厚重阴影（`shadow-xl` 等仅保留给 Toast 层）
- 别破坏 Inset 浮起效果（别给 Card 去 shadow 或 去圆角）
- 别用暖色调灰（参考站是冷灰 hue 286°，不是 neutral 或 stone）
- 别用 Serif 字体（保持 Sans 现代感）
- 别在组件里硬编码色值——永远通过 `var(--color-*)` 或 Tailwind utility (`bg-primary`) 消费
- 别为了"更好看"擅自调大圆角——shadcn-classic 的克制感来自偏小的圆角刻度

## 8. Responsive Behavior

### Breakpoints

| Name | Min Width | Tailwind Prefix |
|------|-----------|-----------------|
| Mobile | 0 | (default) |
| sm | 640px | `sm:` |
| md | 768px | `md:` |
| Tablet | 1024px | `lg:` |
| Desktop | 1280px | `xl:` |
| Wide | 1536px | `2xl:` |

### Touch Targets

- Button / Input：移动端保证最小触控面积 44×44px（`min-h-11`）
- Menu item：移动端 Sidebar item 高度 48px（Desktop 为 32px）
- Table row：移动端改为卡片化，不保留紧凑 40px 行高

### Collapsing Strategy

| Component | Desktop | Tablet (<1024) | Mobile (<768) |
|-----------|---------|---------------|---------------|
| Sidebar | 固定 256px | 可折叠为 icon-only (64px) | 抽屉式（Sheet 从左滑入） |
| Header 工具栏 | 完整展开 | 完整 | 折叠到 overflow menu（⋮） |
| Inset 浮起边距 | `m-2` | `m-2` | `m-0`（全宽贴边） |
| Table | 多列 | 多列（隐藏部分列） | 卡片化（每行一张 Card） |
| Form | 水平 label+field | 水平 | 垂直（label 在上、field 在下） |

### Density 控制

管理后台默认紧凑密度；如需切换为舒适密度（TouchScreen 模式），通过 customizer 的 `data-theme-scale='comfortable'` 维度覆盖控件高度（2.5rem）、行高、padding。

## 9. Agent Prompt Guide

本节提供给 AI 生成代码时的 **example prompts**。当使用 Meta-Build 基于 shadcn-classic 生成新组件或页面时，参考以下模板。

### Consuming tokens（通用约定）

所有色值、尺寸、圆角、阴影**必须**通过 CSS 变量或 Tailwind utility 消费，**禁止**硬编码。

```
Good:
  bg-primary / text-foreground / border-border / rounded-lg / shadow-sm
  style={{ background: 'var(--color-primary)' }}

Bad:
  bg-[#000] / style={{ background: 'oklch(0.141 0.005 286)' }}
```

### Card

```
Create a card with:
- Background: var(--color-card) (bg-card)
- Border: 1px solid var(--color-border) (border)
- Radius: var(--radius-lg) (rounded-lg)
- Shadow: var(--shadow-sm) (shadow-sm)
- Padding: 1.5rem (p-6)
Use shadcn-classic style. Keep markup semantic (article / section).
```

### Primary Button

```
Create a primary button:
- Background: var(--color-primary) (bg-primary)
- Foreground: var(--color-primary-foreground) (text-primary-foreground)
- Height: 2.25rem (h-9)
- Radius: var(--radius-md) (rounded-md)
- Padding: 0.5rem 1rem (px-4 py-2)
- Shadow: var(--shadow-sm) (shadow-sm)
- Focus: ring-2 ring-ring ring-offset-2
Use shadcn-classic style.
```

### Sidebar with Inset Layout

```
Create an Inset sidebar layout for shadcn-classic:
- Outer container: flex h-screen bg-sidebar (极浅冷灰)
- Sidebar: w-64 (256px) bg-sidebar px-3 py-4
- Inset content: flex-1 m-2 rounded-xl shadow-sm bg-background overflow-hidden
  - Header inside inset: sticky top-0 h-14 backdrop-blur-md bg-background/70 border-b
  - Main content: flex-1 p-6 overflow-auto
- Sidebar items: h-8 px-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent
  - Active: bg-sidebar-accent text-sidebar-accent-foreground
```

### Data Table

```
Create a data table using shadcn-classic style:
- Container: rounded-lg border bg-card shadow-sm
- Header row: bg-muted text-muted-foreground h-10 text-sm
- Body rows: h-11 border-b border-border last:border-b-0
- Row hover: hover:bg-muted/50
- Cell padding: px-4
- Action column right-aligned with ghost icon buttons
Don't zebra-stripe rows (keep them clean).
```

### Form Field

```
Create a form field using shadcn-classic style:
- Label: text-sm font-medium text-foreground mb-2
- Input: h-9 px-3 rounded-md border border-input bg-background
  focus:ring-2 focus:ring-ring
- Helper text: text-xs text-muted-foreground mt-1.5
- Error: text-xs text-destructive mt-1.5
- Field gap: mb-4 between fields
```

### Dialog

```
Create a dialog using shadcn-classic style:
- Overlay: fixed inset-0 bg-black/50 backdrop-blur-sm
- Content: fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
  max-w-md w-full rounded-lg bg-card border shadow-lg p-6
- Title: text-lg font-semibold
- Description: text-sm text-muted-foreground mt-1.5
- Footer: flex justify-end gap-2 mt-6
  - Cancel: variant=outline
  - Confirm: variant=primary
```

### Chart

```
Create a chart using shadcn-classic palette:
- Primary series: var(--chart-1) (near black)
- Secondary: var(--chart-2) (warm blue-gray)
- Tertiary: var(--chart-3), var(--chart-4), var(--chart-5)
- Grid lines: var(--color-border)
- Axis text: var(--color-muted-foreground), text-xs
Don't use rainbow palettes—shadcn-classic charts are monochrome + one accent.
```

---

## 附：文档维护约定

- 任何 CSS token（primitive / semantic-classic / component）的修改必须同步更新本文档对应章节
- 任何本文档的约束修改必须同步更新 CSS token 或通过 lint 规则守护
- 新增 style（如 `feishu-flat`）时复制本文档结构并重写各章，保持 9 章结构不变
- 本文档同时是**给 AI 读的风格宪法**——请保持描述精确、表格数据齐全
