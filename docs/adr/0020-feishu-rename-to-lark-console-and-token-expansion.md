# ADR-0020：feishu → lark-console 重命名 + semantic token 扩展 54 → 70

## 状态

已采纳

## 日期

2026-04-18

## 背景

ADR-0019 落地了正交三层 token 契约，同时实施了 `feishu` style 的第一版（W1）。W1 聚焦于**语义色板层**：将 33 个颜色 token 按飞书配色赋值，并在 `semantic-feishu.css` 末尾追加了 9 个 W1 结构 token（`--nav-tab-*`、`--sidebar-item-*`、`--card-shadow` 等）。

2026-04-17 视觉回归和 nxboot-v2 对比之后，识别出两个问题：

1. **命名不够准确**：`feishu` 是一个泛化品牌词，而当前 style 专门复刻的是「飞书管理后台（Lark Console）」的视觉风格——page bg `#f2f3f5`、sidebar 与 page bg 同色融入（而非 W1 的 gray-50 微区分）、border `#dee0e3`（更深一档）、控件高度 30/32/36px（比 classic 紧凑一档）。命名 `lark-console` 比 `feishu` 更准确：lark 是飞书英文名，console 指明这是「管理后台」风格而非泛飞书品牌色。

2. **token 覆盖不足**：54 个语义 token 在第一版实施时够用，但落地 lark-console 全套视觉后发现缺少必要的语义控制点——例如无法区分「弱占位文字」与「图标色」、无法给 Sidebar hover 设独立 token（当前直接混用 accent）、无法给 lark-console 定义不同于 classic 的控件高度（只有一个 `--size-control-height`，无法支持三档尺寸复用）、缺少 floating/modal/selected 三类阴影语义（classic 的 sm/md/lg/xl 无法直接映射飞书的「无阴影」语义）、缺少生产力 easing（飞书动效比 classic 快且直线感强）。

2026-04-18 决策：**rename + 升级为 lark-console**，作为「飞书管理后台风格」的完整实现。

## 决策

### 决策 1：feishu → lark-console 重命名（翻转 ADR-0019 的 feishu 命名）

| 改动面 | 旧 | 新 |
|---|---|---|
| Style id | `feishu` | `lark-console` |
| CSS 文件 | `tokens/semantic-feishu.css` | `tokens/semantic-lark-console.css` |
| 风格文档 | `styles/feishu.md` | `styles/lark-console.md` |
| display name | `飞书` | `飞书控制台` |
| `styleRegistry.register()` | `id: 'feishu'` | `id: 'lark-console'` |
| `__MB_STYLE_IDS__` 白名单 | `'feishu'` | `'lark-console'` |

**兼容迁移**：`index.html` 内联脚本加入一次性映射：读到 localStorage `mb_style='feishu'` 时自动写入 `'lark-console'`，防止 v1 开发期已存储旧值的浏览器出现首帧闪烁。v1 阶段无外部用户，迁移成本极低。

**ADR-0019 的 module-switcher → mix 命名决策不受影响**，本 ADR 只翻转 feishu 部分的命名。

### 决策 2：semantic token 扩展 54 → 70（新增 16 个）

#### 2.1 颜色层级扩展（+4）

| Token | 用途 | 设计意图 |
|-------|------|---------|
| `--color-placeholder` | 表单占位文字色 | 比 `muted-foreground` 更浅，专用于 input placeholder |
| `--color-icon-foreground` | 图标默认色 | 介于 `foreground` 和 `muted-foreground` 之间，图标≠文字 |
| `--color-border-strong` | 强边框（分割线 / Table 边框） | 比 `--color-border` 更深一档，用于需要明显分割的场景 |
| `--color-panel` | 面板/区块背景（低层级容器） | 介于 `background` 和 `card` 之间，专用于内嵌面板、筛选区 |

#### 2.2 主色 hover + 状态软色（+4）

| Token | 用途 | 设计意图 |
|-------|------|---------|
| `--color-primary-hover` | 主色 hover 态 | Button primary hover 背景，比 primary 深一档或浅一档（视 style 决定） |
| `--color-success-soft` | 成功软色背景 | Badge / Tag success 的浅色底，不刺眼的成功提示背景 |
| `--color-warning-soft` | 警告软色背景 | 同上，警告软色底 |
| `--color-destructive-soft` | 危险软色背景 | 同上，危险软色底（如"即将删除"的高亮区域） |

#### 2.3 Sidebar hover（+1）

| Token | 用途 | 设计意图 |
|-------|------|---------|
| `--color-sidebar-hover` | Sidebar 菜单项 hover 背景 | 独立于 `--color-sidebar-accent`（激活态），hover 需要更浅、更透明的视觉提示 |

#### 2.4 控件三档高度（+3）

| Token | Classic 值 | lark-console 值 | 用途 |
|-------|-----------|----------------|------|
| `--size-control-height-sm` | 2rem (32px) | 1.875rem (30px) | 小按钮 / 紧凑 Select |
| `--size-control-height-md` | 2.25rem (36px) | 2rem (32px) | 默认高度（替代原 `--size-control-height`） |
| `--size-control-height-lg` | 2.75rem (44px) | 2.25rem (36px) | 大按钮 / 搜索框 |

原 `--size-control-height` 保留为 `--size-control-height-md` 的别名（过渡期），M6 时清理。

**每个 style 定义自己的控件高度值**：classic 用 Shadcn 原味 32/36/44px，lark-console 用飞书原味 30/32/36px，不再用单一值强绑 primitive。

#### 2.5 阴影三类（+3）

| Token | 用途 | 设计意图 |
|-------|------|---------|
| `--shadow-floating` | 浮层阴影（Dropdown / Tooltip / Popover） | 比原 `shadow-md` 语义更明确；lark-console 可映射为 `none` |
| `--shadow-modal` | 模态阴影（Dialog / Drawer） | 比原 `shadow-lg` 语义更明确 |
| `--shadow-selected` | 选中/激活态阴影（Card 选中、表格行 hover 提升） | classic 可用浅阴影，lark-console 可映射为 `none` |

原 `shadow-sm/md/lg/xl` 保留，新三类与旧四类共存，新代码优先使用语义明确的新 token。

#### 2.6 Motion 生产力 easing（+1）

| Token | 值 | 用途 |
|-------|-----|------|
| `--easing-productive` | `cubic-bezier(0.2, 0, 0, 1)` | 飞书/IBM Carbon 风格的生产力 easing：快入超慢出，强调「有目的的移动」 |

### 决策 3：Inset × Classic 永远保留 Shadcn UI Kit 感

洋哥核心约束（不可违反）：

- **`inset × classic`**：永远是 Shadcn 原味感，圆润、有阴影、中性黑白调
- **`mix × lark-console`**：是飞书感的主战场，扁平、无阴影、飞书蓝驱动
- 其他两个组合（`inset × lark-console` / `mix × classic`）是合法的但非典型，让它们各自表达即可，不强制风格纯粹

## 理由

**为什么 rename 而不是保留 feishu 再新增 lark-console**：单一真源 > 两个半成品并存。feishu W1 已被实测证明与「完整飞书管理后台」有视觉差距（sidebar 同色融入 vs gray-50 微区分、border 深度等），继续维护两个相近 style 会产生 drift。rename 是最小变更路径，同时通过 localStorage 迁移保护已有环境。

**为什么 token 扩展不等比推进所有分组**：只新增 lark-console 落地过程中实际遇到的语义空洞，不提前抽象。新增 16 个 token 都有具体的消费场景（色层级来自组件 placeholder 需求、控件三档来自 lark-console 密度差异、阴影三类来自飞书全零阴影与 classic 的语义区分）。

**为什么控件三档替代单一 `--size-control-height`**：classic（36px default）与 lark-console（32px default）在同一 token 下无法共存。三档方案不仅解决 lark-console 的精确值，还给使用者提供 sm/md/lg 三档标准化选择，优于在 semantic 层直接用字面量覆写。

## 影响

### 正面影响

- lark-console 可以精确复刻飞书管理后台：控件高度、border 深度、sidebar 同色融入全部有对应 token
- 70 个 token 给使用者更细致的视觉控制点，减少在组件里写字面量的冲动
- `easing-productive` 让飞书感的动效可配置，不依赖硬编码 cubic-bezier

### 代价

- `check-theme-integrity.ts` 的 `TOTAL_TOKENS` 常量需从 54 更新为 70
- 所有已有 style（classic light/dark、lark-console light/dark）需补齐新增的 16 个 token，否则完整性脚本失败
- 使用者 fork 后如有自定义 style，需手动补全 16 个新 token

### 已知限制（本次不处理）

- 原 `--size-control-height`（单一档）过渡期保留为 `--size-control-height-md` 别名，M6 时清理
- 阴影旧四档（sm/md/lg/xl）与新三类语义阴影共存，M6 评估是否合并

## 相关文档

- 翻转的 ADR：[ADR-0019](0019-正交三层契约与mix-rename和primitive-blue修正.md)（本 ADR 仅翻转其中 feishu 命名部分，mix rename 和 primitive blue 修正不受影响）
- 更新的规范：[02-ui-tokens-theme.md](../specs/frontend/02-ui-tokens-theme.md)（token 清单 54 → 70）
- 风格文档：[styles/lark-console.md](../../client/packages/ui-tokens/src/styles/lark-console.md)
- 历史实施文档：[2026-04-17-feishu-style-and-mix-rename.md](../specs/frontend/2026-04-17-feishu-style-and-mix-rename.md)（保留 feishu 历史命名，顶部加更新日志说明）

## 2026-04-18 夜间激活态精调（已经过两轮迭代）

本 ADR 采纳后当日晚间对 `mix × lark-console` 的激活态做了两轮迭代，最终落地方案**对齐 nxboot-v2 飞书实现**。保留这段历史让未来读者能追溯决策过程。

### 第一轮（短暂存在，已撤销）：下划线 tab + 灰底 sidebar

基于"用户贴图 = 真实飞书"的假设，把 Tab 改为"2px 蓝色下划线 + 加粗"，Sidebar accent 改为 gray-200。**但用真实飞书管理后台截图（`g05t3iydj2i.feishu.cn/admin`）对标后发现：**

- 真实飞书的 Tab 其实是**浅蓝 pill**（接近 nxboot-v2 实现），不是下划线
- 真实飞书的 Sidebar 激活也有**浅蓝色彩倾向**，不是纯灰底

第一轮方案的假设错了，立即撤销。

### 第二轮（最终方案）：对齐 nxboot-v2 飞书实现

直接参考 `/Users/ocean/Studio/05-codex/04-nxboot-v2/apps/admin-console/src/` 的实现，全量对齐：

**Sidebar 激活态：无背景色 + 左 3px 蓝条 + 蓝字 + 蓝 icon**

| Token | 值 | 对齐 nxboot-v2 |
|---|---|---|
| `--color-sidebar-accent` | `transparent` | nxboot-v2 `active && 'text-sidebar-accent'` 不改背景 |
| `--color-sidebar-accent-foreground` | `var(--color-blue-500)` / `blue-400`(dark) | = `--sidebar-accent: #3370ff` |
| `--sidebar-item-active-bg` | 引用 sidebar-accent (= transparent) | 显式无背景 |
| `--sidebar-item-active-font-weight` | `500` (font-medium) | nxboot-v2 `font-medium` |

组件层：`MixSidebar` 里 icon **不切断继承**，让它随父 button 激活文字色一起染蓝。左 3px 蓝条由 `ActiveIndicator` 组件绘制（原本就已实现）。

**Tab 激活态：浅蓝 pill + 蓝字**

| Token | 值 | 对齐 nxboot-v2 |
|---|---|---|
| `--nav-tab-active-bg` | `var(--color-blue-100)` (light) / `blue-900` (dark) | = nxboot-v2 `primary-light: #edf1ff` |
| `--nav-tab-active-radius` | `var(--radius-sm)` (0.25rem) | = nxboot-v2 `rounded-sm` |
| `--nav-tab-active-underline-width` | `0` | nxboot-v2 无下划线 |

组件层：tab className 保持 `font-medium`（nxboot-v2 激活不额外加粗）。

**SearchInput：回到 bg-muted（和 page bg 同色融合）**

nxboot-v2 search-input 用 `bg-secondary`（= page bg 同色），默认态隐身，靠 focus 的白底 + 蓝 ring 区分。meta-build 的 `bg-muted` 在 lark-console 下等价，保持一致。

### 决策延续性与经验

- 这次精调不新增/删除 token，不翻转 ADR-0020 的 70 token 体系
- 第一轮错走"下划线路线"的教训：**不要用用户贴的单张对比图代替真实目标的完整观察**。对标"飞书风格"时，先拉真实飞书截图或直接看 nxboot-v2 这个成熟仿品的源码，再下判断
- ADR-0007 元方法论（继承遗产前先问原生哲学）的反向应用：nxboot-v2 本身就是按飞书原生哲学做的，直接学它是最短路径

## 2026-04-18 深夜 · 第三轮全量对齐（v3，基于 computed style 实测）

v2 完成后对比仍有明显差距。用 Agent Browser 直接连接真实飞书管理后台（`g05t3iydj2i.feishu.cn/admin`），通过 `getComputedStyle` 逐元素采集真实 CSS 值，发现 v2 基于 nxboot-v2 源码推断出来的设计还有 9 处偏差。完整对比报告见 `docs/handoff/feishu-vs-metabuild-gap-analysis.md`。

### 9 项全量修正

| # | 维度 | v2 | v3（飞书实测） | 修复位置 |
|---|---|---|---|---|
| 1 | Card 圆角 | 12px (rounded-xl) | **4px** | `--card-radius` token，Card/NxTable 消费 |
| 2 | Sidebar 左 3px 蓝条 | 有（ActiveIndicator 组件） | **无** | 删除 ActiveIndicator 所有调用 |
| 3 | Sidebar item 高度 | 44px (h-11) | **48px** | mix-layout TopNavItem → h-12 |
| 4 | Top Tab 高度 | 32px (control-h-md) | **36px** | `--nav-tab-height: 2.25rem` |
| 5 | Top Tab padding | 0.25rem 字面（仅 x） | **7px 12px** | 新 `--nav-tab-padding-y`，x 覆写 0.75rem |
| 6 | Tab 激活背景 | 不透明 blue-100 | **rgba(51,112,255,0.08)** | 直接字面 rgba 值 |
| 7 | Aside 左留白 | 贴边 (x=0) | **x=8px** | aside `lg:ml-2` |
| 8 | Card padding-y | 24px (py-6) | **20px** | `--card-padding-y` token |
| 9 | notice-list gap | 16px (space-y-4) | **12px** | notice-list-page 单页改 space-y-3 |

### 新增 token（仍在 70 个 token 数量内，**未扩编**）

v3 通过**让现有 token 被实际消费**而不是新增 token 完成修正：
- `--card-radius`：原本已在 component.css 定义但 Card 组件没消费（用 `rounded-xl` 写死），v3 改 Card.tsx 消费这个 token
- `--card-padding-y`：新增的组件级 token（不计入 semantic 70 个），默认 1.5rem，lark-console 覆 1.25rem
- `--nav-tab-padding-y`：新增组件级 token，默认 0，lark-console 覆 0.4375rem
- 这三个都是 component 层 token，不算在 semantic 70 token 清单里

### 决策延续性与经验

- v3 不翻转 ADR-0020 的任何宏观决策（70 semantic token / mix × lark-console 主战场 / Inset × Classic 保留原味等）
- **最关键的教训固化为规则**：对标外部 UI 时**必须用 Agent Browser 拉 computed style**，不能凭截图目测、不能完全依赖二手仿品（即使是 nxboot-v2 这样好的仿品也有原作者的"视觉改良夹带"）
- nxboot-v2 可作为参考**结构**（DOM 组织、class 命名），但**数值**必须以真实飞书实测为准
- 这条规则应升级为 MUST：见 `docs/rules/`（后续补入）
