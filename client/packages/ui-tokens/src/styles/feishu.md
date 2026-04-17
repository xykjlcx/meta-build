# feishu · Design System

> Meta-Build 的飞书管理后台风格契约。本文档是"风格样板"——遵循与 `shadcn-classic.md` 完全相同的 9 章结构，专门描述飞书扁平蓝的设计意图、token 决策和组件视觉约定。
>
> **文档定位**：给 AI 和人类读的**风格宪法**。CSS token（`semantic-feishu.css`）是机器可执行的约束，本文档是人读得懂的设计意图和边界。两者任何一方更新必须同步另一方。
>
> **参考站**：飞书管理后台 `https://g05t3iydj2i.feishu.cn/admin`（企业管理 / 产品设置等顶部 Tab）

---

## 1. 简介与参考

feishu 风格呈现的是**企业办公 SaaS 管理后台的扁平蓝美学**：以纯白背景为主画布，飞书蓝 (`#3370ff` ≈ `oklch(0.62 0.214 259)`) 作主色，浅蓝 (`#e1ecff` ≈ `oklch(0.93 0.04 259)`) 作激活底色，左侧模块 Sidebar 用极浅灰 (`#f5f6f7` ≈ `oklch(0.985 0 0)`) 承托，整体气质对标飞书管理后台——企业感、扁平、蓝色驱动。

标志性的视觉特征是**浅蓝整行激活 + 无阴影扁平**：Sidebar 激活菜单项整行填充浅蓝底色 `--color-accent`，文字变为蓝色且加粗 (`font-weight: 600`)，区别于 shadcn-classic 的"文字变色"模式；全局 shadow 清零（Button / Card / Popover 均无阴影），用细边框 `--color-border` 代替阴影区分层级。顶部导航 Tab 激活态是 pill 形浅蓝底而非下划线。

与其他风格的对照：
- **shadcn-classic**（默认）：极黑主色 + Inset 浮起卡片 + shadow 分层，视觉克制接近 Linear/Vercel
- **Apple 温暖风格**（未来）：米色背景 + 大圆角 + 温暖偏 toC 消费感
- **Notion 灰卡风格**（未来）：暖灰 + 大留白 + 无阴影，偏文档笔记

**典型使用场景**：企业内部管理后台、多模块 admin、SaaS 管理端（飞书生态的工具链）。当目标用户是企业用户且品牌与飞书/字节系有关联时，选 feishu style + mix layout 组合最贴近预期。

## 2. 色板映射表

### Primary（飞书蓝）

| Token | Primitive | 近似值 | 用途 |
|-------|-----------|--------|------|
| `--color-primary` | `var(--color-blue-500)` | `oklch(0.62 0.214 259)` ≈ `#3370ff` | Button Primary / Link / Ring |
| `--color-primary-foreground` | `var(--color-white)` | `#ffffff` | primary 之上的文字 |

### Accent（浅蓝激活）

| Token | Primitive | 近似值 | 用途 |
|-------|-----------|--------|------|
| `--color-accent` | `var(--color-blue-100)` | `oklch(0.93 0.04 259)` ≈ `#e1ecff` | Sidebar 激活底 / Tab pill 底 |
| `--color-accent-foreground` | `var(--color-blue-700)` | — | accent 之上文字（蓝色强调） |

### Surface

| Token | Primitive | 近似值 | 用途 |
|-------|-----------|--------|------|
| `--color-background` | `var(--color-white)` | `#ffffff` | 主内容区背景 |
| `--color-card` | `var(--color-white)` | `#ffffff` | Card / Dialog 内部 |
| `--color-popover` | `var(--color-white)` | `#ffffff` | Popover / DropdownMenu / Tooltip 底 |
| `--color-muted` | `var(--color-gray-100)` | `oklch(0.97 0.001 286)` | 表格 header、浅色辅助区块 |
| `--color-sidebar` | `var(--color-gray-50)` | `oklch(0.985 0 0)` ≈ `#f5f6f7` | 左侧模块 Sidebar 背景 |

### Text

| Token | Primitive | 用途 |
|-------|-----------|------|
| `--color-foreground` | `var(--color-gray-800)` | 主文本 |
| `--color-muted-foreground` | `var(--color-gray-500)` | 辅助文字 / placeholder |
| `--color-card-foreground` | 同 foreground | Card 内文字 |
| `--color-sidebar-foreground` | `var(--color-gray-600)` | Sidebar 菜单文字（未 active，比 classic 稍深） |

### Border & Input & Ring

| Token | Primitive | 用途 |
|-------|-----------|------|
| `--color-border` | `var(--color-gray-200)` | 分割线、Card 外边框（扁平主要层级手段） |
| `--color-input` | `var(--color-gray-300)` | Input / Select 边框 |
| `--color-ring` | `var(--color-blue-500)` | Focus Ring（飞书蓝，区别于 classic 近黑） |

### Semantic Status

| Token | Primitive | 用途 |
|-------|-----------|------|
| `--color-destructive` | `var(--color-red-500)` | 删除 / 危险操作 |
| `--color-success` | `var(--color-green-500)` | 成功状态 |
| `--color-warning` | `var(--color-amber-500)` | 警告状态 |
| `--color-info` | `var(--color-blue-500)` | 中性提示（与 primary 同色，飞书信息色即品牌蓝） |

### Sidebar（专用 8 个）

| Token | Primitive | 说明 |
|-------|-----------|------|
| `--color-sidebar` | `var(--color-gray-50)` | 极浅灰底 |
| `--color-sidebar-foreground` | `var(--color-gray-600)` | 未激活菜单文字 |
| `--color-sidebar-primary` | `var(--color-blue-500)` | 激活项主色 |
| `--color-sidebar-primary-foreground` | `var(--color-white)` | 激活项主色上文字 |
| `--color-sidebar-accent` | `var(--color-blue-100)` | 激活整行底色 |
| `--color-sidebar-accent-foreground` | `var(--color-blue-700)` | 激活整行文字色 |
| `--color-sidebar-border` | `var(--color-gray-200)` | Sidebar 内分割线 |
| `--color-sidebar-ring` | `var(--color-blue-500)` | Sidebar 内 focus ring |

### W1 结构 Token

| Token | 值 | 说明 |
|-------|-----|------|
| `--nav-tab-active-bg` | `color-mix(in oklch, var(--color-primary) 12%, transparent)` | Tab 激活 pill 底（浅蓝透明） |
| `--nav-tab-active-radius` | `var(--radius-md)` | Tab pill 圆角 |
| `--nav-tab-active-underline-width` | `0` | 无下划线（飞书 Tab 是 pill 而非 underline） |
| `--sidebar-item-active-bg` | `var(--color-accent)` | Sidebar 整行浅蓝激活底 |
| `--sidebar-item-active-fg` | `var(--color-accent-foreground)` | Sidebar 激活文字蓝 |
| `--sidebar-item-active-font-weight` | `600` | 激活项加粗 |
| `--sidebar-item-hover-bg` | `color-mix(in oklch, var(--color-primary) 8%, transparent)` | hover 极淡蓝 |
| `--card-shadow` | `none` | Card 无阴影（扁平） |
| `--button-shadow` | `none` | Button 无阴影（扁平） |

## 3. Token 映射决策（Why 不 What）

### 为什么 primary 用 blue-500 而非 blue-600？

blue-500 对应 `oklch(0.62 0.214 259)`，换算 sRGB 约为 `#3370ff`，与飞书官方品牌蓝完全一致。blue-600 约为 `#2558d9`，明显偏深，在亮色背景上对比虽然够用但视觉感偏沉——飞书自己的按钮是明亮蓝不是深蓝。

### 为什么 accent 直接引用 blue-100 而非用 color-mix？

blue-100 是 primitive 层已有的固定色阶（`oklch(0.93 0.04 259)` ≈ `#e1ecff`），色值稳定可读，光模式下对比度一致。如果改用 `color-mix(in oklch, blue-500 12%, white)`，虽然视觉结果相近，但运行时受 oklch 混合插值影响，在不同色域支持的浏览器上可能产生微小偏差，且难以调试。直接引用 primitive 更可预测。

### 为什么 sidebar 背景用 gray-50 而非 white？

飞书管理后台左侧 Sidebar 背景约为 `#f5f6f7`，与主内容区的 white 形成约 5% 的明度差。这个细微对比让用户在无阴影的扁平布局中仍能感知 Sidebar 与内容区的边界，不依赖 border 或 shadow 做区分。gray-50 是最接近这个值的 primitive（`oklch(0.985 0 0)`）。

### 为什么 ring（focus）用 blue-500 而非 gray-800？

feishu 风格是蓝色驱动的品牌语言，focus ring 用蓝色与交互主色保持一致——点击 Input 产生蓝框，与 primary button 同色域，UI 反馈统一。shadcn-classic 用 gray-800 (近黑)是因为 classic 的 primary 就是近黑，focus 颜色跟随品牌色的逻辑相同。

### 为什么 shadow 全部清零？

飞书管理后台是纯扁平设计，所有 Card / Button / Popover 均无阴影，层级靠细边框和背景色区分。保留 shadow 会破坏扁平感，也与飞书的品牌气质不符。`--shadow-sm: none` 等同于"这个维度在 feishu 风格中没有意义"。

### 为什么 dark primary 提亮到 blue-400？

深色背景下，blue-500 (`oklch(0.62 0.214 259)`) 与 gray-950 背景的对比度约 3.5:1，在 WCAG AA 标准（4.5:1）下不及格，Button 文字可读性不足。blue-400 (`oklch(0.7 0.18 259)`) 亮度提升约 12%，对比度改善到 5.2:1，既保留蓝色感知又满足无障碍要求。

### 为什么 chart-1 可以复用 primary blue？

飞书系产品的数据可视化默认色通常是品牌蓝（如飞书图表、多维表格）。meta-build 默认不覆写 chart tokens（chart-1 ~ chart-5 在 primitive 层维护），使用者若要对齐飞书图表配色，可以在 `semantic-feishu.css` 里单独覆写 `--chart-1: var(--color-blue-500)`。当前版本按框架约定不在 style 层覆写 chart 系列，保持跨风格一致。

## 4. 典型组件视觉示意

### Button

| Variant | Background | Foreground | Height | Radius | Shadow |
|---------|-----------|------------|--------|--------|--------|
| Primary | `var(--color-primary)` (#3370ff) | `var(--color-white)` | `2.25rem` | `var(--radius-md)` (6px) | **none** |
| Secondary | `var(--color-secondary)` (gray-100) | `var(--color-secondary-foreground)` | `2.25rem` | `var(--radius-md)` | none |
| Outline | transparent | `var(--color-primary)` (蓝字) | `2.25rem` | `var(--radius-md)` | none（1px blue border） |
| Ghost | transparent | `var(--color-foreground)` | `2.25rem` | `var(--radius-md)` | none |
| Destructive | `var(--color-destructive)` | `var(--color-white)` | `2.25rem` | `var(--radius-md)` | none |

飞书按钮与 classic 的关键差异：Primary 和 Destructive 无阴影；Outline 边框色用 primary 蓝。

ASCII 示意：
```
[ 确认    ]   ←  Primary：蓝底白字，无阴影
[  取消   ]   ←  Outline：白底蓝边框蓝字
```

### Tab（顶部导航）

激活 Tab 是**浅蓝 pill**（底色 `--nav-tab-active-bg`，圆角 `--nav-tab-active-radius`），无下划线（`--nav-tab-active-underline-width: 0`）。

```
[ 企业管理 ]  [ 产品设置 ]  [ 安全中心 ]
  ^----- 激活：浅蓝 pill，文字深蓝加粗
              ^---- 非激活：灰字，hover 极淡蓝底
```

### Sidebar Item

激活态是**整行浅蓝填充**，不只是文字变色——这是飞书激活态的核心视觉语言。

```
  ┌──────────────────────────┐
  │ ▌ 首页                   │  ← 非激活：灰字
  │▓▓ 权限管理 ▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 激活：整行 blue-100 底 + 蓝字加粗
  │   用户管理               │
  │   角色管理               │
  └──────────────────────────┘
```

- Active Background：`--color-sidebar-accent`（`var(--color-blue-100)` ≈ `#e1ecff`）
- Active Foreground：`--color-sidebar-accent-foreground`（`var(--color-blue-700)`）
- Active Font Weight：`600`（显著加粗区别未激活项）
- Hover Background：`--sidebar-item-hover-bg`（`color-mix(in oklch, blue-500 8%, transparent)`，极淡蓝）

### Card

- Background：`var(--color-card)` (white)
- Border：`1px solid var(--color-border)` (gray-200)
- Radius：`var(--radius-lg)` (8px)
- **Shadow：none**（区别于 classic 的 shadow-sm，feishu 扁平无阴影）
- Padding：`1.5rem`（24px）

### Input / Select / Textarea

- Background：`var(--color-background)`（白底）
- Border：`1px solid var(--color-input)` (gray-300)
- Height：`2.25rem`
- Radius：`var(--radius-md)` (6px)
- Focus Ring：`2px var(--color-ring)`（飞书蓝）+ `1px offset`

```
┌─────────────────────────┐
│ 输入用户名              │  ← 正常态：gray-300 border
└─────────────────────────┘
┌═════════════════════════╗
│ 输入用户名              ║  ← Focus：2px 蓝色 ring
╚═════════════════════════╝
```

### Table

- Header Background：`var(--color-muted)` (gray-100)
- Header Foreground：`var(--color-muted-foreground)` (gray-500)
- Row Background：`var(--color-card)` (white)
- Border：`1px solid var(--color-border)` between rows
- Row Height：`2.75rem`（40px，紧凑密度，与 classic 相同）
- 无斑马纹（飞书表格为纯白行）

### Header

- Background：`var(--color-background)`（纯白，**无** backdrop-blur，区别于 classic）
- Height：`3.5rem` (56px)
- Border Bottom：`1px solid var(--color-border)`
- 无阴影，零毛玻璃（飞书 Header 完全扁平）

### Dialog / Sheet / Popover

- Background：`var(--color-popover)` / `var(--color-card)`（白底）
- Border：`1px solid var(--color-border)`
- Radius：`var(--radius-lg)` (8px)
- **Shadow：none**（Popover 也无阴影，仅依靠 border 层级界定）

> **注意**：feishu 风格的 Popover 无阴影与 shadcn-classic 的 shadow-md 形成反差。如需在浅色背景上清晰可见，请确保 Popover 背景色与父容器有足够对比度（白 vs 灰-50）。

## 5. 结构特征

### Spacing Scale

基本单位 4px，与 shadcn-classic 一致：

| 名称 | 值 | 用途 |
|------|-----|------|
| space-1 | 4px | Icon 内 padding、tight gap |
| space-2 | 8px | Button 内 icon-text gap |
| space-3 | 12px | Form field 内 padding |
| space-4 | 16px | Card 之间 gap、标准 padding |
| space-5 | 20px | 卡片内 section gap |
| space-6 | 24px | Card padding、section gap |
| space-8 | 32px | 区块之间大 gap |
| space-12 | 48px | 页面顶部 padding |
| space-16 | 64px | 空状态大留白 |

### Grid & Container

- Max content width：`80rem` (1280px)
- 模块 Sidebar（左导航）width：`16rem` (256px)，collapsed：`4rem`
- 页面 Sidebar（侧边模块列表，如有）：与内容区横向排列
- Responsive breakpoints：640 / 768 / 1024 / 1280 / 1536（Tailwind 默认）

### Border Radius Scale

feishu 实际圆角 4-6px，primitive `--radius` 基值 `0.5rem` (8px)，由此推算：

| Scale | 值 | 用途 |
|-------|-----|------|
| `--radius-none` | 0 | 全宽 banner |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 4px | Badge / Tag |
| `--radius-md` | `calc(var(--radius) - 2px)` = 6px | Button / Input / Menu item |
| `--radius-lg` | `var(--radius)` = 8px | Card / Dialog |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 12px | 容器级 |
| `--radius-full` | 9999px | Avatar / Pill |

### Whitespace Philosophy

- **管理后台紧凑密度**：默认字号 14px、行高 1.5、Sidebar item 高度 32px
- 飞书管理后台信息密度略高于通用管理后台，因此不建议调大行高或 padding
- Card padding 1.5rem（24px），Card gap 1rem（16px），与 classic 相同

### 5.1 层级与深度

feishu 扁平设计中，"层级"靠**边框 + 背景色对比**，不靠阴影：

| Level | Treatment | 用途 |
|-------|-----------|------|
| 0 · Flat | 无 shadow / 无 border | body 背景、sidebar 底色 |
| 1 · Border | `1px solid var(--color-border)` | Card / 分割线 / Popover |
| 2 · AccentBg | `var(--color-accent)` 背景 | Sidebar 激活行 / Tab pill |
| 3 · PrimaryBg | `var(--color-primary)` 背景 | Primary Button / 徽标 |

**所有 shadow-sm / shadow-md / shadow-lg / shadow-xl 均被清零**（`none`）。这是 feishu style 与 shadcn-classic 最根本的视觉哲学差异——飞书不用阴影，只用颜色区分层级。

```
Body (white 主内容区)
  └─ Sidebar (gray-50)    ← 和 body 形成微妙色差，无需 border/shadow 分隔
  └─ Card (white + border) ← 用 1px gray-200 border 界定边界
       └─ Active Row       ← 用 blue-100 accent 底色突出
```

对比 shadcn-classic 的双层浮起结构，feishu 是**单层平铺 + 颜色标注**，更接近"所有内容在同一层面上，用颜色做导航"的哲学。

### 5.2 Do / Don't 检查清单

**Do**

- 用飞书蓝 `--color-primary` (blue-500 ≈ #3370ff) 作主色
- Sidebar 激活态用整行浅蓝 `--color-accent` 填充，并加粗文字
- Tab 激活用 pill 形浅蓝底（`--nav-tab-active-bg`），不用下划线
- 保持 shadow 全零——Card / Button / Popover 无阴影
- 用 `--color-border` (gray-200) 细线作为所有组件的层级分隔手段
- Focus ring 用飞书蓝 `--color-ring` (blue-500)，与主色保持一致
- 字体栈首选 PingFang SC（中文管理后台必须）
- 坚持 14px 字号紧凑密度——飞书是企业生产力工具，不是消费端 App

**Don't**

- 别给 Card / Button / Popover 加 shadow（破坏扁平感）
- 别用 Tab 下划线激活（feishu 是 pill，不是 underline）
- 别用 Sidebar 激活仅改文字颜色（必须整行背景底色 + 加粗）
- 别混用冷灰 primary（classic 风格）——feishu 的 primary 必须是品牌蓝
- 别在组件里硬编码 `#3370ff`——永远通过 `var(--color-primary)` 消费
- 别对 Info / Ring 用 gray 色——feishu 信息色与品牌色一致，不是中性灰
- 别用 Serif 字体——保持 Sans 现代感和中文优先
- 别擅自在 light 主题给组件补 shadow "以免看不清楚"——用 border 代替 shadow

## 6. 字体与密度

### 字体栈

feishu style 使用 primitive 层定义的统一字体栈，**不单独覆写**：

```css
--font-sans: 'PingFang SC', 'Hiragino Sans GB', ui-sans-serif, system-ui,
             -apple-system, 'Segoe UI', sans-serif;
```

PingFang SC（苹方）是飞书管理后台的**事实字体**：
- macOS / iOS 下直接渲染，字形轻盈、中宫较大，与飞书的简洁气质高度契合
- Windows / Linux 下自动 fallback 到 `ui-sans-serif`（通常为 Segoe UI / Noto Sans），形态相近
- 该字体栈在 T6 primitive 层统一声明，**所有 style 共用**，feishu 不在 semantic 层覆写

与 shadcn-classic 的字体差异：**无**（共用 primitive）。

### 密度策略

| 维度 | 值 | 说明 |
|------|-----|------|
| 字号（base） | `14px` | 企业后台惯例，比消费端 App 小一档 |
| 行高 | `1.5` | 与 classic 相同 |
| Sidebar item 高 | `32px` | 紧凑，符合飞书实测 |
| 控件高度 `--size-control-h-md` | `2.25rem` = `36px` | 主按钮 / 输入框 / Select，飞书实测值 |
| customizer scale 档位 | `xs / sm / md`（默认 md） | 通过 `data-theme-scale` 切换 |

飞书管理后台本身就是**中偏紧**的密度风格，因此 feishu style 默认保持 scale 默认档（md）而不主动缩小。如果使用者觉得太紧，可通过 customizer 切换到 `comfortable` 档（控件高度 `2.5rem`，行高微增）。

与 shadcn-classic 的密度差异：**无**（都用 default scale，差异在配色而非密度）。

## 7. 深色模式态度

### 事实：飞书管理后台没有深色模式

截至 2026 年初实测，飞书管理后台（`feishu.cn/admin`）只提供浅色主题，没有深色模式切换入口。因此 feishu style 的深色 token 没有"可复刻的对象"。

### meta-build 约束与本 style 的策略

meta-build 的 `check-theme-integrity.ts` 强制每个 style 提供 `light` + `dark` 两个 CSS block，否则质量检查不通过。

本 style 的策略是**"能用不崩"**：dark block 提供合理的深色默认值，保证用户切到深色时页面不白屏、不错乱、不出现对比度灾难，但**不追求 1:1 复刻飞书深色**（因为没有可复刻的参考）。

### Dark Block 关键 Token 调整

| Token | Light 值 | Dark 值 | 原因 |
|-------|---------|---------|------|
| `--color-primary` | `blue-500` | `blue-400` | 深色背景下 blue-500 对比度不达 WCAG AA，提亮一档 |
| `--color-accent` | `blue-100` | `color-mix(in oklch, blue-500 20%, gray-900)` | 保留浅蓝感，同时适配深色底 |
| `--color-accent-foreground` | `blue-700` | `blue-300` | 深色 accent 底上的文字需要足够亮 |
| `--color-background` | `white` | `gray-950` | 主内容区反相 |
| `--color-card` | `white` | `gray-900` | Card 比背景略浅，形成层次 |
| `--color-sidebar` | `gray-50` | `gray-900` | Sidebar 与 body 保持微妙对比 |
| `--color-border` | `gray-200` | `gray-700` | 深色下边框加深才可见 |
| `--color-ring` | `blue-500` | `blue-400` | 跟随 primary 一同提亮 |

### 用户建议

飞书风格的产品面向企业用户，首选在 light 模式下使用。如果产品确实需要深色模式，建议在设计阶段参考飞书桌面客户端的深色配色（而非管理后台），在 `semantic-feishu.css` 的 dark block 中手工精调 token 值。

## 8. 扩展性与混搭

### Style × Layout 正交原则

feishu style 可以和任何 layout preset 自由组合——Style 决定配色与视觉语言，Layout 决定页面骨架，两者完全正交。

### 推荐组合

| 组合 | 效果 | 适用场景 |
|------|------|----------|
| `mix × feishu` | 固定顶部 Header（含 Tab 导航）+ 左侧模块 Sidebar + 内容区 | **完整飞书管理后台观感**，本 plan 的核心目标 |
| `inset × feishu` | Inset 浮起卡片 + 飞书蓝配色 | 优雅感更强的管理后台，适合品牌调性更精致的产品 |
| `basic × feishu` | 无 Sidebar 的全宽页面 | 登录页、落地页、简单工具页也可套 feishu 配色 |

> **最佳实践**：`mix × feishu` 是最贴近飞书管理后台原始观感的组合。`inset × feishu` 视觉上更现代，适合想要飞书配色但不完全照搬飞书布局的场景。

### 创建飞书变种

如果使用者需要"飞书橙色版"或"飞书绿色版"等品牌变种，只需：

1. Fork `semantic-feishu.css` → 重命名为 `semantic-feishu-brand.css`
2. 修改 `--color-primary`（以及关联的 `ring`、`info`、`sidebar-primary`、`sidebar-ring`、`sidebar-accent`）
3. 通过 `registerStyle` API 注册新 style：

```ts
// 在 ui-tokens/src/style-registry.ts 扩展
registerStyle({
  id: 'feishu-brand',
  label: '飞书·品牌版',
  cssFile: './styles/semantic-feishu-brand.css',
})
```

不需要改 layout、不需要改 primitive、不需要改任何组件代码——配色的变化完全封装在 semantic CSS 层。

### W1 扩展 Token 的复用边界

`semantic-feishu.css` 中的 W1 结构 token（`--nav-tab-active-bg`、`--sidebar-item-active-bg` 等）是 feishu style 私有的语义扩展，**不属于跨 style 的公共约定**。如果 shadcn-classic 也想支持相同的 Tab pill 交互，应在 `semantic-classic.css` 中独立定义，不共用 feishu 的 token 名。这样做确保每个 style 的变更不会意外影响其他 style。

## 9. 与 classic 的差异速查表

| 维度 | classic | feishu |
|---|---|---|
| Primary | `--color-gray-950`（纯黑）| `--color-blue-500`（飞书蓝 #3370ff）|
| Tab 激活 | border-bottom 2px | pill（浅蓝底 + radius-md，无下划线）|
| Sidebar 激活 | 文字 primary 色 + bg-background | **整行 accent 浅蓝底** + font-weight 600 |
| Card shadow | `var(--shadow-sm)` | `none`（扁平）|
| Button shadow | `var(--shadow-sm)` | `none`（扁平）|
| Popover shadow | `var(--shadow-md)` | `none`（仅 border 界定层级）|
| Sidebar 背景 | `var(--color-gray-50)` | `var(--color-gray-50)`（相同）|
| Focus Ring | `gray-800`（近黑）| `blue-500`（飞书蓝，与 primary 一致）|
| `--color-info` | `blue-500`（hue 259 after T6）| `blue-500`（同步）|
| 字体 | 共用 primitive（PingFang 首选）| 共用 primitive（PingFang 首选）|
| 圆角刻度 | 共用 primitive | 共用 primitive |
| Dark 模式策略 | 完整定义 | "能用不崩"不追求 1:1 |
| 典型 Layout 搭档 | `inset`（浮起卡片）| `mix`（飞书管理后台骨架）|

---

## 附：文档维护约定

- 任何 `semantic-feishu.css` 中的 token 修改必须同步更新本文档对应章节
- 任何本文档的约束修改必须同步更新 `semantic-feishu.css` 或通过 lint 规则守护
- 本文档同时是**给 AI 读的飞书风格宪法**——请保持描述精确、表格数据齐全
- 参考站截图或设计稿变更时，优先更新第 1 章的视觉描述和第 4 章的组件示意
