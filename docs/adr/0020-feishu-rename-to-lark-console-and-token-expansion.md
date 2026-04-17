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
