# Claude Warm · Design System

> Meta-Build 的默认风格契约。本文档是"风格样板"——以 Anthropic Claude Design（`claude.ai/design`）的 warm palette + midnight dark 为真相源，描述 claude-warm 风格的视觉哲学、token 决策和组件视觉约定。
>
> **文档定位**：给 AI 和人类读的**风格宪法**。CSS token（`semantic-claude-warm.css`）是机器可执行的约束，本文档是人读得懂的设计意图和边界。两者任何一方更新必须同步另一方。
>
> **决策背景**：本 style 的引入、命名、色板选型、light/dark 搭档策略见 [ADR frontend-0024 · Claude Design 对齐 14 项决策汇总](../../../../../../docs/adr/frontend-0024-claude-design-alignment-decisions.md)（决策 2 + 决策 6）。2026-04-18 随 Plan A 正式落地并切换为 meta-build v1 的默认 style。
>
> **视觉真相源**：
> - `/Users/ocean/Desktop/claude-design-test01/styles/tokens.css`（`[data-theme="claude"]` / `[data-theme="midnight"]`，token 值权威源）
> - `/Users/ocean/Desktop/claude-design-test01/styles/app.css`（布局、组件装饰、Topbar 毛玻璃、Sidebar item 激活态等交互细节）

---

## 1. 简介与参考

claude-warm 风格呈现的是 **Anthropic 原生的暖米白美学**：以 `oklch(0.975 0.008 85)` 的暖米白（hue 85°，略带米黄）作 page 底，Claude 暖橙 (`oklch(0.66 0.15 45)` ≈ 铁锈橙) 作主色，Surface 层用更亮一档的暖米白浮起，整体气质对标 Claude 官网、Anthropic Console——温暖、克制、带轻微手工感的"人味"。

标志性的视觉特征是**暖色微分层 + 圆润阴影 + 高级毛玻璃**：Surface / bg-elev / bg-sunken 三个亮度层在 hue 60–85° 暖色区间内做 2–3% 的微妙色差，配合 `rgb(20 14 8 / ...)` 的暖棕 tint 阴影（区别于常规纯黑阴影），即使在纯静态页面也透出一种"被阳光照着的纸面"感；Topbar 使用 `backdrop-filter: saturate(180%) blur(16px)` 叠加 `--glass-bg` 半透明米白，形成高级 SaaS 产品典型的毛玻璃顶栏。

Dark 模式切换到 **Midnight**——暖深棕黑（`oklch(0.18 0.012 60)`，hue 60° 暖偏）+ 提亮后的亮橙（`oklch(0.74 0.14 50)`），保留 warm palette 的"暖"基因但下沉到夜间语境，与蓝紫系冷暗模式形成明显区隔。

与其他风格的对照：
- **shadcn-classic**（第三 style）：极黑主色 + 冷灰 hue 286° Sidebar + Inset 浮起卡片，视觉接近 Linear / Vercel
- **lark-console**（第二 style）：飞书蓝 #3370ff + `#f2f3f5` 冷灰背景 + 纯扁平无阴影，企业感重
- **claude-warm**（默认）：暖橙 + 暖米白 + 圆润暖棕阴影 + 毛玻璃 Topbar，对外展示最友好

**典型使用场景**：面向专业知识工作者的管理后台、AI 产品后台、对视觉完成度要求高的对外展示样本。当目标用户期望"现代、温暖、有人味"的品质感时，claude-warm style + `claude-inset` 或 `claude-classic` preset 的组合最贴近 Claude / Anthropic 系的原生观感。

## 2. 色板映射表

### Primary（Claude 暖橙）

| Token | 值 / Primitive | 近似 | 用途 |
|-------|-----------|--------|------|
| `--color-primary` | `oklch(0.66 0.15 45)` | Claude 暖橙（铁锈橙系）| Button Primary / Link / 激活文字 / Ring（去 alpha 后）|
| `--color-primary-foreground` | `oklch(0.99 0.005 85)` | 极浅暖米白 | primary 之上的文字 |
| `--color-primary-hover` | `oklch(0.6 0.16 45)` | 更深更饱和的橙 | hover 态加深 |

### Accent / Secondary（浅橙底，用于激活背景和次级按钮）

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-secondary` | `oklch(0.95 0.03 55)` | 浅橙底（= `--brand-bg`），次级按钮 / 浅色容器 |
| `--color-secondary-foreground` | `oklch(0.48 0.012 60)` | 次级文字（暖灰棕）|
| `--color-accent` | `oklch(0.95 0.03 55)` | 激活态浅橙底（与 secondary 同族，sidebar 激活即消费此 token）|
| `--color-accent-foreground` | `oklch(0.6 0.16 45)` | 激活文字：brand-hover 档更饱和的橙，在浅橙底上可读 |

### Surface（三层暖米白微分层）

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-background` | `oklch(0.975 0.008 85)` | page 底色，暖米白（= `--bg`）|
| `--color-card` | `oklch(0.99 0.006 85)` | Card / Dialog 内部，比 bg 略亮（= `--bg-elev`）|
| `--color-popover` | `oklch(0.99 0.006 85)` | Popover / DropdownMenu / Tooltip 底 |
| `--color-muted` | `oklch(0.955 0.01 85)` | 次级区块 / 表格 header / Topbar 搜索框底（= `--bg-sunken`，比 bg **略暗** 2%）|
| `--color-panel` | `oklch(0.98 0.007 85)` | 平铺面板（= `--surface-alt`，在 Card 和 bg 之间的第四亮度层）|

### Text（暖深棕字色阶）

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-foreground` | `oklch(0.24 0.015 60)` | 主文本（暖深棕，非纯黑，hue 60° 暖偏）|
| `--color-muted-foreground` | `oklch(0.48 0.012 60)` | 辅助文字 / Form label（= `--fg-muted`）|
| `--color-placeholder` | `oklch(0.62 0.01 60)` | Input placeholder / 次次级文字（= `--fg-subtle`）|
| `--color-icon-foreground` | `oklch(0.24 0.015 60)` | 默认 icon 色，与正文同色 |
| `--color-card-foreground` | 同 foreground | Card 内文字 |

### Border & Input & Ring

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-border` | `oklch(0.9 0.008 70)` | 分割线、Card 外边框（暖灰，hue 70）|
| `--color-border-strong` | `oklch(0.82 0.01 70)` | Input focus 态 border / 强分割线 |
| `--color-input` | `oklch(0.9 0.008 70)` | Input / Select 边框（= border 同族）|
| `--color-ring` | `oklch(0.68 0.14 45 / 0.35)` | Focus Ring（暖橙带 35% alpha，柔和扩散感）|

### Semantic Status（含 soft 变体）

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-destructive` | `oklch(0.58 0.18 25)` | 删除 / 危险（暖红 hue 25）|
| `--color-destructive-soft` | `oklch(0.95 0.04 25)` | 浅红底（badge / alert 背景）|
| `--color-success` | `oklch(0.62 0.13 150)` | 成功（偏青绿，hue 150）|
| `--color-success-soft` | `oklch(0.95 0.04 150)` | 浅绿底 |
| `--color-warning` | `oklch(0.72 0.14 75)` | 警告（偏琥珀金，hue 75）|
| `--color-warning-soft` | `oklch(0.96 0.05 85)` | 浅米黄底 |
| `--color-info` | `oklch(0.62 0.12 235)` | 中性提示（蓝色 hue 235，与 primary 橙拉开对比）|

### Sidebar（从主色板推导，Claude Design 源无独立 sidebar token）

| Token | 值 | 说明 |
|-------|-----|------|
| `--color-sidebar` | `oklch(0.955 0.01 85)` | = `--bg-sunken`，比 page bg 略沉 2%，形成微妙层次 |
| `--color-sidebar-foreground` | `oklch(0.48 0.012 60)` | 未激活菜单文字（= `--fg-muted`）|
| `--color-sidebar-primary` | `oklch(0.66 0.15 45)` | 激活主色（Claude 暖橙）|
| `--color-sidebar-primary-foreground` | `oklch(0.99 0.005 85)` | 主色上文字 |
| `--color-sidebar-accent` | `oklch(0.95 0.03 55)` | 激活项浅橙底（`--brand-bg`）|
| `--color-sidebar-accent-foreground` | `oklch(0.6 0.16 45)` | 激活文字：更饱和的橙 |
| `--color-sidebar-hover` | `oklch(0.95 0.03 55)` | hover 背景，复用浅橙底（不另外定义灰色 hover）|
| `--color-sidebar-border` | `oklch(0.9 0.008 70)` | 分割线，与全局 border 同源 |
| `--color-sidebar-ring` | `oklch(0.66 0.15 45)` | Sidebar 内 focus ring（去 alpha 版 primary）|

### Shadow（暖棕 tint，非中性纯黑）

| Token | 值 | 说明 |
|-------|-----|------|
| `--shadow-sm` | `0 1px 2px rgb(20 14 8 / 0.06), 0 1px 1px rgb(20 14 8 / 0.04)` | Card / 按钮轻浮起 |
| `--shadow-md` | `0 4px 12px -2px rgb(20 14 8 / 0.08), 0 2px 4px -1px rgb(20 14 8 / 0.04)` | Popover / DropdownMenu |
| `--shadow-lg` | `0 12px 32px -8px rgb(20 14 8 / 0.12), 0 4px 8px -2px rgb(20 14 8 / 0.06)` | Dialog / Sheet |
| `--shadow-xl` | `0 24px 60px -12px rgb(20 14 8 / 0.18), 0 8px 16px -4px rgb(20 14 8 / 0.08)` | Topbar Tweaks popover / Toast |

> **关键**：所有阴影使用 `rgb(20 14 8 / ...)` 暖棕 tint，而非默认的 `rgb(0 0 0 / ...)` 纯黑。这是 Claude Design 的灵魂细节——在暖米白背景上，暖棕阴影保留了"暖感的延续"，纯黑阴影会显得生硬突兀。

## 3. Token 映射决策（Why 不 What）

### 为什么 primary 用暖橙 hue 45 而非 hue 30（纯橙）或 hue 60（金黄）？

Claude Design 的品牌橙是 `oklch(0.66 0.15 45)`，换算 sRGB 约为 `#d17755`——介于铁锈红与橙之间，更接近"陶土色"或"夕阳色"。hue 30 太红（接近番茄），hue 60 太黄（接近金黄），都会破坏 Anthropic 一贯的"沉稳温暖但不孩子气"气质。hue 45 的妙处是在暖米白底上有足够饱和度但不喧哗，在 midnight 深底上提亮到 0.74 仍保持可读且不刺眼。

### 为什么 background 和 foreground 的 hue 不同（85 vs 60）？

这是 Claude Design 最容易被忽略的细节：bg（hue 85，偏米黄）和 fg（hue 60，偏暖棕）**不在同一色相轴上**。如果 fg 也用 hue 85，文字会显得"漂"（黄叠黄）；用 hue 60 的暖棕作正文色，视觉上类似深棕色墨水印在米黄纸上，印刷品般的质感立刻出现。这个 25° 的 hue 偏移是"像纸"感的核心机制，不能随意统一。

### 为什么 card 比 background 亮（99 vs 97.5）？

lark-console 是扁平无阴影 + 暗 Card；shadcn-classic 是纯白 bg + 白 Card（靠 shadow 浮起）；claude-warm 选的是**比 bg 亮 1.5% 的 Card**——既有细微浮起感，又保留暖色调一致性。这个 "亮一档" 的细节在组件堆叠场景尤其有效：Card 内嵌 Table 时，Table 用 `--color-muted` (0.955) 作 header，和 Card (0.99) / bg (0.975) 三层形成清晰节奏。

### 为什么 shadow 用暖棕 tint `rgb(20 14 8 / ...)` 而非纯黑？

纯黑阴影（`rgb(0 0 0 / x)`）在暖米白背景上会产生"剪影感"——阴影边缘和 Surface 色调格格不入。`rgb(20 14 8)` 近似 hue 35 的极深棕，与 warm palette 的 hue 40–85 区间同源，阴影和背景在色相上连续，视觉上像"墨水在暖纸上的自然扩散"而非"贴上去的黑影"。这是 Claude Design 区别于通用 shadcn 的关键细节之一，必须严格保持。

### 为什么 ring 带 alpha 0.35 而非不透明 primary？

Claude Design 的 Focus Ring 是 `oklch(0.68 0.14 45 / 0.35)` 配合 `box-shadow: 0 0 0 4px var(--ring)`——带 alpha 的 ring 在 focus 时产生"光晕扩散"效果，比硬边 ring 更柔和贵气。lark-console 的 ring 是不透明蓝色边框（2px），视觉更锐利但少了这份温暖感。与 style 气质匹配。

### 为什么 accent 用 brand-bg 浅橙 `oklch(0.95 0.03 55)` 而非 color-mix？

`--brand-bg` 是 Claude Design 原型里专门定义的色阶（hue 55，介于 primary hue 45 和 warning hue 75 之间），稳定可读。用 `color-mix(in oklch, primary 8%, white)` 运行时生成虽然结果接近，但不同浏览器 oklch 插值精度不同会产生微妙偏差，且 DevTools 难以调试。直接引用具体色值最可预测。

### 为什么 sidebar 选 bg-sunken（0.955）而非 bg（0.975）？

Claude Design 的 `classic` 变体（即 `claude-classic` preset）中 Sidebar 是 `bg`（与 page 同色融入）；但 meta-build 的三层导航（系统 / Tab / 模块）决定了 Sidebar 需要更明显地区分出来——用 `bg-sunken` 比 `bg` 暗 2% 提供微妙边界，不需要 border 也能让用户感知 Sidebar 的存在。这个偏移相当于"把 Sidebar 从墙面略微凹陷进去"的视觉表达，与 Claude Design 的 sunken 语义完全一致。

### 为什么 dark 模式叫 Midnight 而非 Dark？

Claude Design 原型把 warm 的暗色版本命名为 `midnight`，暗示"深夜、暖炉"的语境——hue 60 的暖深棕黑不同于常规 dark mode 的蓝黑 / 冷灰黑。这个命名本身就是设计决策的一部分：它告诉使用者 "这不是简单反色的 dark theme，而是 warm palette 的夜间版"，为用户建立正确的视觉预期。

### 为什么字体栈新增 Inter 和 HarmonyOS Sans SC？

claude-warm 是 meta-build v1 对外展示最多的 style，字体栈需要在现代品牌感（Inter）和中文可读性（PingFang SC / HarmonyOS Sans SC）之间找平衡。Claude Design 原型用 Inter 作为首字体，**meta-build 保留这个决策但追加 HarmonyOS Sans SC 作为华为设备兜底**，同时启用 `font-feature-settings: "ss01", "cv11"` 激活 Inter 的 stylistic set（更几何的 `a`、带 cut 的 `l`），与 Claude 官网字体表现一致。

## 4. 典型组件视觉示意

### Button

| Variant | Background | Foreground | Height | Radius | Shadow |
|---------|-----------|------------|--------|--------|--------|
| Primary | `var(--color-primary)` (暖橙) | `var(--color-primary-foreground)` | `2.125rem` (34px) | `var(--radius-md)` (8px) | `var(--shadow-sm)` |
| Secondary | `var(--color-card)` (白) | `var(--color-foreground)` | `2.125rem` | `var(--radius-md)` | none（1px border）|
| Outline | transparent | `var(--color-foreground)` | `2.125rem` | `var(--radius-md)` | none（1px border）|
| Ghost | transparent | `var(--color-muted-foreground)` | `2.125rem` | `var(--radius-md)` | none |
| Destructive | `var(--color-destructive)` | white | `2.125rem` | `var(--radius-md)` | `var(--shadow-sm)` |

与 classic / lark-console 的关键差异：Primary 和 Destructive **带浅阴影**（`shadow-sm`，暖棕 tint），hover 态 primary 加深到 `--color-primary-hover`；整体 radius 偏大（8px 而非 6px），呼应 warm palette 的圆润气质。

ASCII 示意：
```
[ 确认     ]   ←  Primary：暖橙底白字，暖棕微阴影
[  取消   ]   ←  Secondary：白底深棕字，1px 暖灰 border
[  删除   ]   ←  Destructive：暖红底，阴影略深
```

### Tab（Topbar 模块 Tab）

Topbar 的 Tab 组是 **segmented pill 容器**：外层 `--color-muted`（bg-sunken）底 + `padding: 3px` + `border-radius: 10px`，包裹若干 Tab 按钮；激活 Tab 是 `--color-card`（bg-elev）底 + `--color-foreground` 字 + `--shadow-xs` 轻阴影（约 `0 1px 1px rgb(20 14 8 / 0.04)`），呈现"浮起到容器表面"的视觉层次。

```
  ┌──────────────────────────────────────┐
  │ [ 组织管理 ]   内容     产品设置      │
  │   ↑浮起               ↑透明背景        │
  └── 外层浅色容器（bg-sunken pill）───────┘
```

高度：Topbar 整体 56px，内部 Tab 按钮高度 `6px 12px` padding → 实际 ~28–32px。这与 lark-console 的"顶部横向 Tab"或 classic 的"下划线 Tab"形成明显差异，更接近 Arc Browser / macOS Ventura 系统设置的 segmented control 交互。

### Sidebar Item

激活态是**白卡浮起 + 主色 icon + 1px 暖灰 border + shadow-xs**——这是 claude-warm 最标志性的 Sidebar 交互：

```
  ┌──────────────────────────┐
  │  🏠 首页                  │  ← 非激活：暖灰字（fg-muted）+ 暖灰 icon
  │ ┌────────────────────┐   │
  │ │ 🔒 权限管理         │   │  ← 激活：白卡（bg-elev）+ 深棕字 + 暖橙 icon + shadow-xs + 1px border
  │ └────────────────────┘   │
  │  👤 成员与部门            │
  │  🎭 角色管理              │
  └──────────────────────────┘
```

- Active Background：`var(--surface)`（= `--color-card`，白卡浮起）
- Active Foreground：`var(--color-foreground)`（暖深棕字，不变色）
- Active Icon Color：`var(--color-primary)`（**只有 icon 染橙**，文字保持深棕）
- Active Border：`1px solid var(--color-border)` + `var(--shadow-xs)`
- Active Radius：`7px`
- Item 高度：`padding: 7px 10px` → ~30px
- Hover Background：`var(--color-muted)`（bg-sunken，微微加深）

与 lark-console 的"无背景色 + 蓝字 + 蓝 icon"形成强对比：claude-warm 激活态是**有背景色浮起的白卡 + 仅 icon 变色**，视觉上更重但也更温暖。

### Card

- Background：`var(--color-card)` (bg-elev，暖米白偏亮)
- Border：`1px solid var(--color-border)`
- Radius：`var(--radius-lg)` (12px)
- Shadow：`var(--shadow-xs)`（极轻浮起，暖棕 tint）
- Header padding：`16px 20px 12px` + 下边线 `1px solid var(--color-border)`
- Body padding：`16px 20px`
- Header `font-size: 14px / font-weight: 600`，subtitle `12px / fg-subtle`

### Input / Select / Textarea

- Background：`var(--color-card)`（白卡底，非 page bg）
- Border：`1px solid var(--color-border)`
- Height：`2.125rem` (34px)
- Radius：`var(--radius-md)` (8px)
- Focus：`border-color: var(--color-border-strong)` + `box-shadow: 0 0 0 4px var(--color-ring)`

```
┌─────────────────────────┐
│ 输入成员姓名            │  ← 正常态：暖灰 border
└─────────────────────────┘
┌═════════════════════════╗
│ 输入成员姓名            ║  ← Focus：border 加深 + 4px 暖橙半透明光晕扩散
╚═════════════════════════╝
```

4px 的 ring 比 lark-console / classic 的 2px ring 更"柔"，因为 ring 本身带 0.35 alpha，柔化后不显臃肿。

### Table

- Wrap：`var(--color-card)` + `border: 1px solid var(--color-border)` + `border-radius: var(--radius-lg)` (12px) + `overflow: hidden`
- Header Background：`var(--color-muted)` (bg-sunken)
- Header Foreground：`var(--color-muted-foreground)` + `font-size: 12px / font-weight: 500 / letter-spacing: 0.01em`
- Row Background：`var(--color-card)`
- Row Height：`var(--row-h)` = 44px（默认 comfortable），随 density 切换
- Row hover：`background: var(--color-muted)` 过渡
- 末行无底 border（`last-child:border-bottom: none`）

### Header / Topbar

- Background：`var(--glass-bg)` = `oklch(0.99 0.005 85 / 0.6)`（暖米白 60% 透明）
- **backdrop-filter: `saturate(180%) blur(16px)`**（毛玻璃核心效果）
- Height：56px
- Border Bottom：`1px solid var(--color-border)`
- Brand mark：28px 方块，`linear-gradient(135deg, var(--color-primary), color-mix(in oklch, var(--color-primary), var(--color-foreground) 30%))` 暖橙渐变

> **毛玻璃是 claude-warm 身份标识**：没有 backdrop-blur 的 Topbar 就不是 claude-warm。这个效果需要浏览器支持 `backdrop-filter`（所有现代浏览器均支持），降级方案用 `--color-card` 不透明替代。

### Dialog / Sheet / Popover

- Background：`var(--glass-bg)`（Popover）/ `var(--color-card)`（Dialog / Sheet，实底）
- Border：`1px solid var(--color-border)` 或 `var(--glass-border)`
- Radius：`var(--radius-xl)` (16px，比 Card 更圆润)
- Shadow：`var(--shadow-xl)`（Popover）/ `var(--shadow-lg)`（Dialog）

Topbar 的 Tweaks 面板（Customizer）使用 `.popover--tweaks` 样式：`backdrop-filter: blur(24px) saturate(180%)` + `--glass-border`（偏白 50% alpha），这是 claude-warm 最精致的组件之一。

## 5. 结构特征

### Spacing Scale

基本单位 4px，与 classic / lark-console 一致：

| 名称 | 值 | 用途 |
|------|-----|------|
| space-1 | 4px | Icon 内 padding、tight gap |
| space-2 | 8px | Button 内 icon-text gap |
| space-3 | 12px | Form field padding / Card gap |
| space-4 | 16px | Card padding-y / Section gap |
| space-5 | 20px | Card padding-x / Page header 下 margin |
| space-6 | 24px | Page padding-y |
| space-7 | 28px | Page padding-x（claude-warm 独有一档）|
| space-8 | 32px | 区块之间大 gap |
| space-12 | 48px | 页面顶部 padding |

### Grid & Container

- Max content width：`80rem` (1280px)
- 模块 Sidebar（`claude-classic` / `claude-inset` preset）width：`248px`（Claude Design 实测值）
- Rail Sidebar（`claude-rail` preset）width：`64px`（图标 only）
- Page padding：`24px 28px`（Classic）/ 继承 Surface 边界（Inset）
- Responsive breakpoints：640 / 768 / 1024 / 1280 / 1536（Tailwind 默认）

### Border Radius Scale

claude-warm 的 radius 刻度比 classic 偏大一档（更圆润），与 warm palette 的气质匹配：

| Scale | 值 | 用途 |
|-------|-----|------|
| `--radius-xs` | 4px | kbd / micro badge |
| `--radius-sm` | 6px | Tag / Badge / segmented btn |
| `--radius-md` | 8px | Button / Input / Menu item / Sidebar item |
| `--radius-lg` | 12px | **Card / Table wrap（claude-warm 默认卡片圆角）** |
| `--radius-xl` | 16px | Dialog / Popover / Inset main 容器 |
| `--radius-2xl` | 20px | Brand mark / 空状态插画容器 |
| `--radius-full` | 9999px | Avatar / Pill badge / Topbar user chip |

### Whitespace Philosophy

- **专业生产力密度**：默认 `--row-h: 44px`、字号 14px、行高 1.5，介于 lark-console（32px item）的紧凑和消费端的宽松之间
- 支持 density 三档切换（compact 36px / default 44px / comfortable 52px）
- Card padding 16/20（y/x），刻意不对称以给 Card header 的 border-bottom 更多呼吸
- Page padding 24px（垂直）28px（水平），左右多 4px 是 Claude Design 原型细节

### 5.1 层级与深度

claude-warm 的"层级"靠**三件事协同**：暖色微分层（bg-elev/bg/bg-sunken）+ 暖棕 tint shadow + 细边框：

| Level | Treatment | 用途 |
|-------|-----------|------|
| 0 · Flat | `--color-background` 无 shadow / 无 border | body 背景 |
| 1 · Surface | `--color-card` + `--shadow-xs` | 普通 Card / Sidebar 激活 item |
| 2 · Elevated | `--color-card` + `--shadow-sm` | Primary Button / Inset main 容器 |
| 3 · Popover | `--glass-bg` + backdrop-blur + `--shadow-md` | Dropdown / Tooltip |
| 4 · Modal | `--color-card` + `--shadow-lg` | Dialog / Sheet |
| 5 · Floating | `--glass-bg` + backdrop-blur(24px) + `--shadow-xl` | Topbar Tweaks / Toast |

```
Body (bg 暖米白)
  └─ Sidebar (bg-sunken)     ← 比 body 暗 2%，无 border 也能感知
  └─ Inset main (surface + border + shadow-sm)  ← 白卡浮起
       └─ Card (bg-elev + border + shadow-xs)    ← 再浮起一档
            └─ Active Sidebar item (surface + border + shadow-xs) ← 嵌套浮起
  └─ Topbar (glass-bg + backdrop-blur)           ← 毛玻璃悬浮，不与任何层级竞争
```

### 5.2 Do / Don't 检查清单

**Do**

- 用 Claude 暖橙 `--color-primary` (`oklch(0.66 0.15 45)`) 作主色
- Sidebar 激活态用**白卡浮起 + 暖橙 icon + shadow-xs + 1px border**（不是全区域背景色）
- Topbar 必须带 `backdrop-filter: saturate(180%) blur(16px)` + `--glass-bg`——毛玻璃是 claude-warm 身份
- 所有 shadow 使用暖棕 tint `rgb(20 14 8 / x)`，禁止纯黑 `rgb(0 0 0 / x)`
- 正文字色用 `--color-foreground` (hue 60 暖深棕)，不用纯黑 `#000`
- Card 圆角用 `--radius-lg` = 12px，比 classic / lark-console 更圆润
- Ring 保持 0.35 alpha 的柔光扩散，不改成硬边框
- 字体启用 `font-feature-settings: "ss01", "cv11"` 让 Inter 更几何
- Focus ring 用 `box-shadow: 0 0 0 4px var(--color-ring)` 而非 `outline`（柔和度差距大）
- bg / bg-elev / bg-sunken 三层暖色分层全部保留，不要为"简化"合并

**Don't**

- 别把 primary 换成红色或金黄（hue 30 / hue 60）——Claude 橙的"陶土感"必须保持 hue 45
- 别用纯黑阴影——会破坏暖感连续性
- 别把 background / foreground 的 hue 统一到同一值——hue 85 vs hue 60 的偏移是"像纸"感的核心
- 别移除 Topbar 的 `backdrop-filter`——等同于剥离 claude-warm 的视觉 DNA
- 别把 Sidebar 激活态简化为"全区域背景色"——白卡浮起是与 lark-console 的核心差异
- 别用 `--color-primary` 做 Tab 激活文字——Tab 激活用 `--color-foreground`（深棕），只有 Sidebar icon 才染橙
- 别在 Card 用 `rounded-sm` (4px) 或 `rounded-md` (8px)——claude-warm 默认 `rounded-lg` (12px)
- 别在 dark 模式下继续用 `rgb(20 14 8 / ...)` 阴影——Midnight 主题下改回纯黑 `rgb(0 0 0 / ...)` 更合理（见 §7）
- 别混用 classic 的极浅冷灰 sidebar（hue 286）——claude-warm 的 Sidebar 必须走 hue 85 暖米白系
- 别在组件里硬编码 `#d17755` 或 `oklch(...)`——永远通过 `var(--color-*)` 消费

## 6. 字体与密度

### 字体栈

claude-warm 在 primitive 层默认字体栈基础上**覆写**，引入 Inter 作为首字体：

```css
--font-sans: 'Inter', 'PingFang SC', 'HarmonyOS Sans SC', ui-sans-serif, system-ui,
             -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, 'Cascadia Code', monospace;
--font-heading: var(--font-sans);
```

字体栈决策：
- **Inter**：Claude 官网的首字体，几何感强、x-height 高、有完整的 `ss01`（更几何的 `a`、`g`）和 `cv11`（带 cut 的 `l`）variant 支持。英文界面的首选
- **PingFang SC**：苹果中文默认字体，macOS / iOS 原生渲染，字形与 Inter 搭配协调
- **HarmonyOS Sans SC**：华为设备用户的兜底（Inter 英文 + HarmonyOS 中文在鸿蒙系统上有原生支持）
- **Microsoft YaHei**（在 Claude Design 原型 `:root` 中列出）**未进入 semantic 层**：避免 Windows 下字形过粗干扰整体观感，由 `ui-sans-serif` 兜底更安全

与 classic / lark-console 的字体差异：classic / lark-console 共用 primitive（PingFang SC 首选），claude-warm 提升 Inter 为首字体，是三个 style 中字体差异最大的一个。

### Font Feature Settings

在 `app.css` 的 `body` 上统一声明：

```css
body {
  font-feature-settings: "ss01", "cv11";
  letter-spacing: -0.005em;
  -webkit-font-smoothing: antialiased;
}
```

这三项组合让 Inter 在视觉上更接近 Claude 官网的专业感。**迁移时必须同步复制到 `app-shell` 的全局 style**，否则即使字体栈对了也仍有 5% 的视觉偏差。

### 密度策略

| 维度 | 值 | 说明 |
|------|-----|------|
| 字号（base） | `14px` | 继承 primitive |
| 行高 | `1.5` | 与 classic 一致 |
| Sidebar item padding | `7px 10px` | Claude Design 实测值 |
| Sidebar item radius | `7px` | Claude Design 非标准值（介于 6/8 之间）|
| 控件高度 `--row-h` | `44px` | 默认 comfortable，支持 density 切换 |
| Page padding | `24px 28px` | 垂直紧 + 水平松 |
| customizer density 档位 | `compact / default / comfortable`（ADR-0024 决策 7 rename，原 xs/default/lg）|

与 classic / lark-console 的密度差异：claude-warm 默认 `--row-h: 44px` 比 classic 的 40px / lark-console 的 48px 都不一样——这是 Claude Design 原型实测值，不要对齐其他 style。如果使用者觉得偏松，可切到 compact 档（36px）。

## 7. 深色模式态度

### Midnight：Warm 的夜间表达

与 lark-console "飞书没有 dark，能用不崩" 的策略不同，**claude-warm 的 dark 模式是完整且同等优先级的设计**——Claude Design 原型里 `[data-theme="midnight"]` 被定义为与 warm 并列的第一公民。meta-build 的 `[data-theme-style='claude-warm'][data-theme-color-mode='dark']` 完整继承 Midnight 的全部 token。

### Midnight 色彩哲学

Midnight **不是** warm 的反色（纯暗色 + 反相），而是"夜晚的暖色版本"——hue 60° 的暖深棕黑（`oklch(0.18 0.012 60)`）替代常规 dark mode 的蓝黑，保留"暖"基因下沉到夜间语境。类比：从"秋天下午的暖阳客厅"→ "秋天夜晚的暖炉边"，而非"白天客厅 → 星际空间"。

### Dark Block 关键 Token 调整

| Token | Light 值 | Dark (Midnight) 值 | 原因 |
|-------|---------|---------|------|
| `--color-primary` | `oklch(0.66 0.15 45)` | `oklch(0.74 0.14 50)` | 提亮 12% 保证 WCAG AA，hue 微调 45 → 50 让夜间略带金调 |
| `--color-primary-foreground` | 极浅暖米白 | `oklch(0.18 0.012 60)` = bg | **深字亮底反差**，与 light 相反 |
| `--color-background` | `oklch(0.975 0.008 85)` | `oklch(0.18 0.012 60)` | 暖米白 → 暖深棕黑，hue 85 → 60 |
| `--color-foreground` | `oklch(0.24 0.015 60)` | `oklch(0.94 0.008 85)` | 深棕字 → 亮米白字，hue 互换 |
| `--color-card` | `oklch(0.99 0.006 85)` | `oklch(0.24 0.012 60)` | dark 下 Card 比 bg 亮（0.24 vs 0.18）|
| `--color-border` | `oklch(0.9 0.008 70)` | `oklch(0.32 0.012 60)` | dark 下 border 必须提亮才可见 |
| `--color-ring` | `oklch(0.68 0.14 45 / 0.35)` | `oklch(0.7 0.14 45 / 0.45)` | alpha 提到 0.45 补偿暗底上的可见度 |
| `--shadow-*` | `rgb(20 14 8 / x)` 暖棕 tint | `rgb(0 0 0 / x*2.5)` 纯黑加深 | dark 下暖棕 tint 看不见，改回纯黑加深一倍 |

### 视觉身份

Midnight 保留三个关键身份元素：
1. **暖 hue 基因**（60° 暖深棕黑而非 240° 冷蓝黑）
2. **Topbar 毛玻璃**（`--glass-bg: oklch(0.22 0.012 60 / 0.55)` + backdrop-blur）
3. **同样的 Sidebar 激活交互**（白卡浮起 → 暖橙低亮卡浮起，`oklch(0.3 0.05 50)` 作 active bg）

### 用户建议

- 默认提供 light（warm）+ dark（midnight），跟随系统偏好（`prefers-color-scheme`）
- 如果使用者需要纯冷调 dark 或灰阶 dark，建议**不要在 claude-warm 的 dark block 改**，而是创建新 style（如 `midnight-blue` 变种）
- 图表 chart-1 ~ chart-5 在 dark 模式下自动使用 primitive 层的 dark 变体，无需 style 层额外覆写

## 8. 扩展性与混搭

### Style × Layout 正交原则

claude-warm style 可以和任何 layout preset 自由组合——Style 决定配色与视觉语言，Layout 决定页面骨架，两者完全正交。ADR-0024 决策 5 新增的 3 个 Claude 专属 preset（`claude-classic` / `claude-inset` / `claude-rail`）与 claude-warm 的配对度最高。

### 推荐组合

| 组合 | 效果 | 适用场景 |
|------|------|----------|
| `claude-inset × claude-warm` | **默认组合**。Topbar 贴顶毛玻璃 + Sidebar 无边界融入 + main 内容区 surface 卡片浮起 | meta-build v1 对外展示首选，呼应 Anthropic Console / Claude 官网观感 |
| `claude-classic × claude-warm` | Topbar + Sidebar + 主内容区三段式，Sidebar 有 border-right 分割 | 经典管理后台观感，适合偏传统使用者 |
| `claude-rail × claude-warm` | 64px 图标 only Rail + 主内容区 surface 卡 + Topbar 毛玻璃 | Command-first 工作流，适合模块多但聚焦单页面工作 |
| `inset × claude-warm` | meta-build 原 Inset preset（ADR-0017）+ claude-warm 配色 | 过渡方案（与 lark-console 共存场景）|
| `basic × claude-warm` | 无 Sidebar 的全宽页面 + claude-warm 配色 | 登录页 / 落地页 / 错误页 |

> **最佳实践**：`claude-inset × claude-warm` 是 Plan A 完成后 meta-build 的新默认组合（ADR-0024 决策 2 + 决策 5 + 决策 6 合力定义）。如果产品需要"更传统的管理后台观感但保留暖色基因"，选 `claude-classic × claude-warm`。

### 创建 Claude Warm 品牌变种

如果使用者需要"Claude 蓝色版"或"Claude 紫色版"等变种，只需：

1. Fork `semantic-claude-warm.css` → 重命名为 `semantic-claude-purple.css`
2. 修改 `--color-primary` / `--color-primary-hover` / `--color-primary-foreground` / `--color-accent` / `--color-accent-foreground` / `--color-ring` 等 brand 色组 token
3. **保留** surface 三层暖色、shadow 暖棕 tint、font-feature-settings——这些是 claude-warm "暖" 身份的基础，不是可换的
4. 在 `ui-tokens/src/style-registry.ts` 追加注册：

```ts
styleRegistry.register({
  id: 'claude-purple',
  displayName: 'Claude·紫',
  description: 'Claude Warm 品牌紫色变种',
  color: '#8b5cf6',
  cssFile: './tokens/semantic-claude-purple.css',
});
```

同时在 `styles/index.css` 追加 `@import` 并在 `web-admin/src/main.tsx` 的 `__MB_STYLE_IDS__` 数组中追加。

### 与 Claude Design 原型的差异（明确排除）

ADR-0024 决策 12 明确以下 Claude Design 原型内容**不落地**到 meta-build：

- `groups`（用户组）模块：与角色模型语义重叠，不做
- `invoices`（发票）模块：跨境电商业务，不属于平台底座
- `slate` palette：视觉完成度不如 warm/midnight，仅 midnight 作为 dark 搭档
- Claude Design 原型的 `[data-theme="slate"]` 在 `semantic-claude-warm.css` 中**无对应产出**

### Token 复用边界

`semantic-claude-warm.css` 中的扩展 token（`--color-panel`、`--color-placeholder`、`--color-primary-hover`、所有 soft 变体、`--shadow-floating` / `--shadow-modal` / `--shadow-selected`）是 claude-warm style 私有的语义扩展，**不属于跨 style 的公共约定**。classic / lark-console 若需要同名 token，应在各自 semantic CSS 中独立定义。

## 9. 与 classic / lark-console 的差异速查表

| 维度 | classic | lark-console | **claude-warm** |
|---|---|---|---|
| Primary | `gray-950` 纯黑 | `blue-500` 飞书蓝 #3370ff | **`oklch(0.66 0.15 45)` Claude 暖橙 #d17755** |
| Page Background | `white` | `gray-100` #f2f3f5 冷灰 | **`oklch(0.975 0.008 85)` 暖米白** |
| Foreground hue | hue 286 (冷灰) | hue 286 (冷灰) | **hue 60 (暖深棕)** |
| Surface 层次 | white + shadow-sm 浮起 | 纯扁平 | **bg / bg-elev / bg-sunken 三层暖色微分层** |
| Shadow 色调 | 中性黑 `rgb(0 0 0 / x)` | **none（扁平）** | **暖棕 tint `rgb(20 14 8 / x)`** |
| Tab 激活 | border-bottom 2px | 半透明主色 pill（rgba 0.08）| **segmented pill，白卡浮起 shadow-xs** |
| Sidebar 激活 | bg-sidebar-accent 背景 | 无背景 + 蓝字 + 蓝 icon | **白卡浮起 + shadow-xs + 1px border + 暖橙 icon** |
| Topbar | backdrop-blur 半透明 | 纯白无 blur | **`glass-bg` + `backdrop-filter: saturate(180%) blur(16px)`** |
| Card radius | `--radius-lg` = 8px | `--radius-xs` = 4px（实测）| **`--radius-lg` = 12px** |
| Card shadow | `shadow-sm` | none | `shadow-xs`（极轻，暖棕 tint）|
| Focus Ring | 2px 不透明 gray-800 | 2px 不透明 blue-500 | **4px 暖橙带 0.35 alpha 光晕扩散** |
| 字体首选 | PingFang SC（共用 primitive）| PingFang SC（共用 primitive）| **Inter + PingFang SC + HarmonyOS Sans SC（覆写）**|
| font-feature-settings | 无（共用默认）| 无 | **`"ss01", "cv11"` + `letter-spacing: -0.005em`** |
| Dark 模式策略 | 完整定义 | "能用不崩" | **Midnight 完整对等，与 light 并列一等公民** |
| 典型 Layout 搭档 | `inset`（原生 shadcn inset）| `mix`（飞书管理后台）| **`claude-inset`（新 preset）**|
| 气质定位 | Linear / Vercel 冷静极简 | 飞书管理后台 企业扁平 | **Anthropic / Claude 专业温暖** |

---

## 附：文档维护约定

- 任何 `semantic-claude-warm.css` 中的 token 修改必须同步更新本文档对应章节
- 任何本文档的约束修改必须同步更新 `semantic-claude-warm.css` 或通过 lint 规则守护
- 本文档同时是**给 AI 读的 claude-warm 风格宪法**——请保持描述精确、表格数据齐全
- 参考 Claude Design 原型更新时（`/Users/ocean/Desktop/claude-design-test01`），优先更新第 1 章视觉描述、第 2 章色板映射、第 4 章组件示意
- 与 ADR frontend-0024 / frontend-0025 的决策保持一致；如有冲突，以新 ADR 为准
