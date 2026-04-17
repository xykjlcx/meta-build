# 02 - L1 设计令牌与主题工程

> **关注点**：L1 `@mb/ui-tokens` + 纯 CSS Variables Only 哲学 + 70 个核心语义 token + 扁平命名 + Style Registry + ColorMode + Customizer CSS 维度 + 主题完整性校验脚本 + Tailwind v4 CSS-first 配置 + 使用者扩展新风格。
>
> **本文件吸收**：brainstorming 决策 4（主题工程模型 = 纯 CSS Variables Only + 扁平命名）+ 千人千面硬约束中的 RECOMMENDED #1（硬编码颜色）/ MUST NOT #7（非扁平命名）+ MUST #2（所有主题必须定义全部 token）。

---

## 1. 决策结论 [M1]

### 1.1 核心决策

| 维度 | 决策 |
|------|------|
| 主题源数据 | **纯 CSS 文件**（`packages/ui-tokens/src/styles/*.css` + `customizer.css`） |
| 命名约定 | **扁平命名**（`--color-primary` / `--radius-md`，禁用嵌套或点分段） |
| 运行时模型 | **Style + ColorMode + Customizer CSS 维度**：`data-theme-style` / `data-theme-color-mode` / `body data-theme-*` |
| Token 总数 | 70 个语义 token，分 6 组（colors / radii / sizes / shadows / motion / fonts） |
| 完整性保障 | 自写 ~50 行 TypeScript 校验脚本，CI 硬失败 |
| Tailwind 集成 | Tailwind CSS v4 的 `@theme` 指令 CSS-first 配置，L2-L5 共享同一份主题 CSS |
| 初始风格数量 | **1 套 canonical style**：`classic`；浅色/深色由 `ColorMode` 切换，`compact` 废弃并迁移到 Customizer 组合 |

### 1.2 决策依据汇总

| 候选 | 决策 | 否决理由 |
|------|------|---------|
| TS 源 → 自写编译器生成 CSS | ❌ | 自写 TS→CSS 编译器维护成本高；shadcn 全生态训练数据都是 CSS 变量；AI 改 TS 源后还得记得重新编译，多一步出错点 |
| JSON 源 → 工具链生成 CSS | ❌ | v1 没有"运行时动态加载主题"的需求（YAGNI）；JSON 源需要额外构建步骤；扁平命名约定已经为未来升级到 JSON 源保留了平滑路径 |
| **CSS 文件即源数据** | ✅ | 单一事实源；100% 对齐 shadcn 生态；改主题→刷新→看效果，反馈回路最短；AI 训练数据最丰富 |

---

## 2. CSS Variables Only 哲学 [M1]

### 2.1 为什么不做 TS 源

**TS 源方案**（被否决）的典型形态：

```typescript
// ❌ 反面教材：TS 源 + 自写编译器
export const lightTheme = {
  colors: {
    primary: { 50: '#f0f9ff', 500: '#0ea5e9', 900: '#0c4a6e' },
    background: '#ffffff',
  },
  radii: { sm: 4, md: 8, lg: 16 },
};
```

为什么对 meta-build 不合适：

| 问题 | 影响 |
|------|------|
| 需要自写 TS → CSS 编译器 | 至少 200 行编译器代码 + 持续维护；违背"~180 行自写配置"的契约密度承诺 |
| 与 shadcn 生态分裂 | shadcn-ui / shadcn examples / shadcn-themes 全部用 CSS 变量；AI 训练数据全部是 CSS 变量 |
| AI 改 TS 后忘记重新生成 CSS | 出现"代码改了但样式没变"的诡异 bug |
| 类型安全的收益小 | 主题错了刷新就看到，不需要编译期保护（详见 §2.3） |

### 2.2 为什么不做 JSON 源

**JSON 源方案**（被否决）的典型形态：

```json
{
  "colors": {
    "primary": { "value": "#0ea5e9" }
  }
}
```

为什么 v1 不做：

| 问题 | 影响 |
|------|------|
| 需要构建步骤把 JSON 转 CSS | 多一个工具链环节 |
| 运行时动态加载主题是 YAGNI | v1 没有"用户在 UI 里上传 JSON 主题包"的需求 |
| 失去 IDE 自动补全和注释能力 | CSS 变量在 IDE 里支持反向跳转和注释，JSON 不行 |

**为什么扁平命名是"未来升级 JSON 源"的平滑路径**：

JSON 源最自然的 schema 是嵌套结构（`colors.primary.500`），而扁平 CSS 变量名（`--color-primary`）是 JSON 嵌套结构的 flatten 形式。如果未来真的需要 JSON 源，只需要写一个 30 行的 `flatten()` 函数把 JSON → 扁平 CSS 变量即可，不需要改任何 L2-L5 的消费代码。如果一开始就用嵌套命名（`--colors-primary-500`），未来反而难以从 JSON 源生成（因为消费侧已经依赖了多段命名结构）。

### 2.3 视觉即反馈 vs 编译期类型安全的权衡

后端选 jOOQ 而不是 raw JDBC 的核心理由是"编译期类型安全"——因为后端数据错了**代价高**（DB 数据损坏、用户事务回滚、跨服务一致性破坏），所以值得用 generated code 换编译期保护。

前端主题恰好相反：**改主题错了刷新就看到**，反馈回路只有 1 秒。投入"自写 TS → CSS 编译器 + 类型 schema"换编译期保护是负收益——不如把这部分精力用在写"主题完整性校验脚本"（保证所有主题都定义了所有 token）和"Tailwind class 白名单"（拦截硬编码颜色）。

| 出错代价 | 反馈速度 | 推荐保护方式 |
|---------|--------|------------|
| 高（后端数据） | 慢（生产事故才发现） | 编译期 + 类型 + 测试 |
| 低（前端样式） | 快（刷新就看到） | 完整性校验脚本 + Lint |

---

## 3. 语义 token 完整清单（70 个）[M1+M2]

下表是 v1 的全部语义 token。**所有主题文件必须定义全部 token**，否则主题完整性校验脚本（§8）会失败。

### 3.1 颜色（42 个）

原始 33 个颜色 token（2026-04-17 落地）基础上，2026-04-18 扩展为 42 个（新增 9 个，见 [ADR-0020](../../adr/0020-feishu-rename-to-lark-console-and-token-expansion.md)）。

**基础色板（原 33 个）**

| 变量名 | 用途 | 示例值（classic light） |
|-------|------|---------------------|
| `--color-background` | 全局页面背景 | `var(--color-white)` |
| `--color-foreground` | 全局文字颜色 | `var(--color-gray-800)` |
| `--color-primary` | 主品牌色（按钮 / 链接 / 高亮） | `var(--color-gray-950)` |
| `--color-primary-foreground` | 主品牌色上的文字 | `var(--color-white)` |
| `--color-secondary` | 次要按钮 / 次要操作背景 | `var(--color-gray-300)` |
| `--color-secondary-foreground` | 次要按钮上的文字 | `var(--color-gray-800)` |
| `--color-muted` | 弱化背景（次要面板 / placeholder） | `var(--color-gray-100)` |
| `--color-muted-foreground` | 弱化文字（次要描述 / 占位） | `var(--color-gray-500)` |
| `--color-accent` | 强调背景（hover / 选中态） | `var(--color-gray-200)` |
| `--color-accent-foreground` | 强调背景上的文字 | `var(--color-gray-800)` |
| `--color-destructive` | 危险操作背景（删除 / 错误） | `var(--color-red-600)` |
| `--color-destructive-foreground` | 危险操作上的文字 | `var(--color-white)` |
| `--color-success` | 成功状态背景（表单提交成功、审批通过） | `var(--color-green-500)` |
| `--color-success-foreground` | 成功状态上的文字 | `var(--color-white)` |
| `--color-warning` | 警告状态背景（库存预警、即将过期） | `var(--color-amber-500)` |
| `--color-warning-foreground` | 警告状态上的文字 | `var(--color-gray-800)` |
| `--color-info` | 信息状态背景（系统通知、辅助提示） | `var(--color-blue-500)` |
| `--color-info-foreground` | 信息状态上的文字 | `var(--color-white)` |
| `--color-card` | 卡片背景（和页面背景有微妙区分，层次感） | `var(--color-white)` |
| `--color-card-foreground` | 卡片上的文字 | `var(--color-gray-800)` |
| `--color-popover` | 弹层背景（Dropdown / Tooltip / Popover） | `var(--color-white)` |
| `--color-popover-foreground` | 弹层上的文字 | `var(--color-gray-800)` |
| `--color-border` | 边框颜色 | `var(--color-gray-200)` |
| `--color-input` | 表单输入框边框 | `var(--color-gray-300)` |
| `--color-ring` | 焦点环（focus ring） | `var(--color-gray-800)` |
| `--color-sidebar` | 侧边栏背景（极浅冷灰，与页面背景有微妙区分） | `oklch(0.97 0.003 250)` |
| `--color-sidebar-foreground` | 侧边栏文字（次要灰） | `var(--color-gray-500)` |
| `--color-sidebar-primary` | 侧边栏激活项背景 / 主色 | `var(--color-gray-950)` |
| `--color-sidebar-primary-foreground` | 侧边栏激活项文字 | `var(--color-white)` |
| `--color-sidebar-accent` | 侧边栏激活背景 | `var(--color-gray-200)` |
| `--color-sidebar-accent-foreground` | 侧边栏激活文字 | `var(--color-gray-950)` |
| `--color-sidebar-border` | 侧边栏边框 | `var(--color-gray-200)` |
| `--color-sidebar-ring` | 侧边栏焦点环 | `var(--color-gray-800)` |

**扩展色（新增 9 个，ADR-0020）**

| 变量名 | 用途 | 示例值（classic light） |
|-------|------|---------------------|
| `--color-placeholder` | 表单占位文字（比 muted-foreground 更浅） | `var(--color-gray-400)` |
| `--color-icon-foreground` | 图标默认色（介于 foreground 和 muted-foreground 之间） | `var(--color-gray-500)` |
| `--color-border-strong` | 强边框（分割线 / Table 边框，比 border 深一档） | `var(--color-gray-300)` |
| `--color-panel` | 面板/区块背景（低层级容器，介于 background 和 card 之间） | `var(--color-gray-50)` |
| `--color-primary-hover` | 主色 hover 态（Button primary hover 背景） | `var(--color-gray-800)` |
| `--color-success-soft` | 成功软色背景（Badge / Tag success 浅色底） | `oklch(0.96 0.04 145)` |
| `--color-warning-soft` | 警告软色背景（同上，警告场景） | `oklch(0.97 0.04 85)` |
| `--color-destructive-soft` | 危险软色背景（"即将删除"高亮区域等） | `oklch(0.97 0.04 27)` |
| `--color-sidebar-hover` | Sidebar 菜单项 hover 背景（独立于激活态 accent） | `var(--color-gray-100)` |

### 3.2 圆角（4 个）

| 变量名 | 用途 |
|-------|------|
| `--radius-sm` | 小圆角（小按钮 / Tag / Badge） |
| `--radius-md` | 中圆角（输入框 / 按钮 / Card） |
| `--radius-lg` | 大圆角（Dialog / Drawer / 大型卡片） |
| `--radius-xl` | 超大圆角（Hero 区 / 装饰块） |

### 3.3 尺寸（8 个）

原始 5 个 + 2026-04-18 新增 3 个控件高度档位（ADR-0020）。

| 变量名 | 用途 |
|-------|------|
| `--size-control-height` | 表单控件默认高度（等同 md 档，过渡期保留，M6 清理） |
| `--size-control-height-sm` | 小档控件高度（classic: 32px；lark-console: 30px） |
| `--size-control-height-md` | 中档控件高度（classic: 36px；lark-console: 32px）— 默认档 |
| `--size-control-height-lg` | 大档控件高度（classic: 44px；lark-console: 36px） |
| `--size-header-height` | 顶部导航栏高度 |
| `--size-sidebar-width` | 侧边栏展开宽度 |
| `--size-sidebar-width-collapsed` | 侧边栏折叠宽度 |
| `--size-content-max-width` | 主内容区最大宽度 |

### 3.4 阴影（7 个）

原始 4 个（尺寸语义）+ 2026-04-18 新增 3 个（场景语义，ADR-0020）。新代码优先使用场景语义 token；旧四档保留，M6 评估合并。

| 变量名 | 用途 |
|-------|------|
| `--shadow-sm` | 小阴影（hover 提升 / Tag） |
| `--shadow-md` | 中阴影（Dropdown / Tooltip / Popover） |
| `--shadow-lg` | 大阴影（Dialog / Drawer） |
| `--shadow-xl` | 超大阴影（全屏 Modal / 浮层） |
| `--shadow-floating` | 浮层阴影（Dropdown / Tooltip / Popover）— 语义更明确的场景 token |
| `--shadow-modal` | 模态阴影（Dialog / Drawer）— 语义更明确的场景 token |
| `--shadow-selected` | 选中/激活态阴影（Card 选中、表格行 hover 提升）|

### 3.5 动效（6 个）

原始 5 个 + 2026-04-18 新增 1 个（ADR-0020）。

| 变量名 | 用途 |
|-------|------|
| `--duration-fast` | 快速过渡（hover / 焦点切换，~150ms） |
| `--duration-normal` | 常规过渡（开关 / Tab，~250ms） |
| `--duration-slow` | 慢速过渡（Drawer / Dialog 进场，~400ms） |
| `--easing-in` | 进场缓动函数 |
| `--easing-out` | 出场缓动函数 |
| `--easing-productive` | 生产力 easing（`cubic-bezier(0.2, 0, 0, 1)`，飞书/IBM Carbon 风格：快入超慢出，「有目的的移动」） |

### 3.6 字体（3 个）

| 变量名 | 用途 |
|-------|------|
| `--font-sans` | 全局正文字体（系统 sans-serif 栈） |
| `--font-mono` | 等宽字体（代码 / 数字表格） |
| `--font-heading` | 标题字体（默认与 sans 相同，使用者可覆盖） |

**总计**：42 + 4 + 8 + 7 + 6 + 3 = **70 个语义 token**。

### 3.7 备注：未来可选 token

以下 token 当前未实现，按需追加时需同步更新 `TOTAL_TOKENS` 常量和所有 style 文件：

| 分组 | token | 时机 | 说明 |
|------|-------|------|------|
| 图表色 | chart-1 到 chart-5（5 个） | M6+ | 仪表盘/图表场景 |
| 额外圆角 | radius-2xl, radius-3xl（2 个） | 按需 | shadcn/ui 有但 admin 系统较少用到 |

---

## 4. 扁平命名约定 [M1]

### 4.1 命名格式

**扁平命名**：`--<group>-<name>` 或 `--<group>-<name>-<modifier>`

| 正确 | 错误 | 错误理由 |
|------|------|---------|
| `--color-primary` | `--colors-primary-500` | 嵌套命名（多段段落表达层级） |
| `--color-primary-foreground` | `--color.primary.foreground` | 点分段命名 |
| `--radius-md` | `--radius/md` | 斜杠命名 |
| `--size-control-height` | `--sizes-controlHeight` | camelCase |

### 4.2 命名规则

| 规则 | 说明 |
|------|------|
| 全小写 + 短横线分隔 | 符合 CSS 变量惯例 |
| `<group>` 是英文单数名词（不是复数） | `--color-` 不是 `--colors-`；`--radius-` 不是 `--radii-` |
| `<modifier>` 用 `-foreground` / `-collapsed` 等后缀，不嵌套 | `--color-primary-foreground` 不写成 `--color-primary.fg` |
| 数字 / 大小 / 程度 用 `sm/md/lg/xl` 而非数字 | `--radius-md` 不是 `--radius-2` |

### 4.3 为未来升级 JSON 源保留路径

如果 v1.5 决定切换到 JSON 源，转换函数大约 30 行：

```typescript
// 未来 v1.5 的 JSON → CSS 转换器（v1 不实现，仅作示意）
type ThemeJson = Record<string, Record<string, string>>;

function jsonToCssVars(theme: ThemeJson): string {
  const lines: string[] = [];
  for (const [group, items] of Object.entries(theme)) {
    for (const [name, value] of Object.entries(items)) {
      lines.push(`  --${group}-${name}: ${value};`);
    }
  }
  return lines.join('\n');
}
```

JSON 源会是 `{ "color": { "primary": "#0ea5e9", "primary-foreground": "#fff" } }` 这样的形态——和扁平命名一一对应。如果 v1 用了嵌套命名（`--colors-primary-500`），消费侧的 Tailwind preset 和组件代码都依赖了"primary-500"这种段落结构，未来从 JSON 生成反而困难。

---

## 5. 运行时主题模型 [M2+M3]

### 5.1 Style + ColorMode + Customizer 维度

v2 canonical 模型不再使用单一 `theme` 字符串，而拆成 4 个正交维度：

| 维度 | DOM 载体 | 存储 key | 职责 |
|------|---------|---------|------|
| `style` | `<html data-theme-style="classic">` | `mb_style` | 视觉风格预设 |
| `colorMode` | `<html data-theme-color-mode="dark">` | `mb_color_mode` | 浅色 / 深色 |
| `scale` | `<body data-theme-scale="xs">` | `mb_scale` | 密度 / 字号 / 基础间距 |
| `radius` | `<body data-theme-radius="sm">` | `mb_radius` | 全局圆角基准 |

`contentLayout` 等运行时壳层偏好属于 Customizer CSS 维度，与 style 解耦，不进入 `StyleRegistry`。

### 5.2 DOM 属性切换

颜色相关变量挂在 `<html>`：

```html
<html data-theme-style="classic">
  <body>...</body>
</html>

<html data-theme-style="classic" data-theme-color-mode="dark">
  <body>...</body>
</html>
```

Customzier CSS 维度挂在 `<body>`：

```html
<body
  data-theme-scale="xs"
  data-theme-radius="sm"
  data-theme-content-layout="centered"
>
  ...
</body>
```

### 5.3 首帧初始化

React mount 前由 `index.html` 内联脚本同步恢复 `<html>` / `<body>` 的 data attribute，防止首帧闪烁；React 运行后由 `StyleProvider` 接管。

这一步是 v2 对旧“React mount 前主题初始化函数”的替代，不再要求应用入口显式调用 L1 初始化函数。

### 5.4 Style Registry

`packages/ui-tokens/src/style-registry.ts`：

```typescript
// StyleId 是 string，不是 union type——扩展新 style 无需改类型定义
export type StyleId = string;

export interface StyleMeta {
  readonly id: StyleId;
  readonly displayName: string;
  readonly description: string;
  readonly color: string;
  readonly cssFile: string;
}

// styleRegistry 是 StyleRegistry class 实例（非 readonly 数组）
// 支持 .register() / .get() / .getAll() / .map() / .find() 等操作
export const styleRegistry = new StyleRegistry();

// 内置 style 通过 register() 注册；扩展 style 同理（见 §9）
styleRegistry.register({
  id: 'classic',
  displayName: '经典',
  description: '中性基调，适合作为管理后台默认风格',
  color: '#0f172a',
  cssFile: './tokens/semantic-classic.css',
});
```

### 5.5 兼容迁移

迁移期仍需读取旧 `mb-theme` 一次：

| 旧值 | 新值 |
|------|------|
| `default` | `mb_style=classic` |
| `dark` | `mb_style=classic` + `mb_color_mode=dark` |
| `compact` | `mb_style=classic` + `mb_scale=xs` + `mb_radius=sm` |

迁移完成后应删除旧 `mb-theme`，不再把 `compact` 视为独立主题。

---

## 6. 初始风格与迁移 [M2+M3]

### 6.1 canonical style：classic

`packages/ui-tokens/src/tokens/semantic-classic.css` 同时定义 light + dark 两套颜色变量：

```css
:root[data-theme-style='classic'] {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... 全部语义变量 ... */
}

:root[data-theme-style='classic'][data-theme-color-mode='dark'] {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  /* ... 全部语义变量 ... */
}
```

### 6.2 Customizer CSS 维度

`packages/ui-tokens/src/customizer.css` 专门承载运行时可调的 CSS 维度：

```css
[data-theme-scale='xs'] {
  --text-base: 0.875rem;
  --spacing: 0.222222rem;
}

[data-theme-radius='sm'] {
  --radius: 0.3rem;
}

[data-theme-content-layout='centered'] .content-wrapper {
  max-width: var(--size-content-max-width);
  margin-inline: auto;
}
```

这些规则不属于 style 预设，不应写进 `classic.css`。

### 6.3 Compact 废弃策略

`compact` 在 v2 中废弃，不再保留为独立 style。原因见 [ADR-0018](../../adr/0018-废弃compact主题改为style加customizer维度组合.md)。

本次重构只承诺 best-effort 迁移：

- `compact` → `classic + scale=xs + radius=sm`
- 不追求完整复刻旧 compact 的全部尺寸和动效差异

### 6.4 风格入口聚合

`packages/ui-tokens/src/styles/index.css` 采用三层结构（primitive → semantic-* → component），**导入顺序不能错**，否则 semantic 中引用的 primitive 变量尚未定义：

```css
/* Token 三层总入口
 * 导入顺序必须是 primitive → semantic-* → component，
 * 保证下游引用的变量在本文件里已经定义。
 */
@import '../tokens/primitive.css';
@import '../tokens/semantic-classic.css';
@import '../tokens/semantic-lark-console.css';
@import '../tokens/component.css';
```

每新增一套 style（如 `semantic-my-brand.css`），就在 `semantic-classic.css` 之后追加一行 `@import`。

L5 入口 CSS：

```css
@import '@mb/ui-tokens/tailwind-theme.css';
@import '@mb/ui-tokens/styles/index.css';
@import '@mb/ui-tokens/customizer.css';
```

---

## 7. Tailwind CSS v4 配置 [M1]

### 7.1 CSS-first 主题配置（`@theme` 指令）

Tailwind CSS v4 采用 CSS-first 配置，不再需要 `tailwind.config.ts` 中手动映射 CSS 变量。所有 token 通过 `@theme` 指令在 CSS 中声明，Tailwind 自动生成对应的 utility class。

`packages/ui-tokens/src/tailwind-theme.css`——所有层共享的 Tailwind 主题入口：

```css
@import "tailwindcss";

@theme {
  --color-*: initial;  /* 清空 Tailwind 默认调色板，只有语义色可用 */

  /* ============ 语义颜色 ============ */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-success: oklch(0.62 0.19 145);
  --color-success-foreground: oklch(0.985 0 0);
  --color-warning: oklch(0.75 0.18 85);
  --color-warning-foreground: oklch(0.205 0 0);
  --color-info: oklch(0.65 0.15 240);
  --color-info-foreground: oklch(0.985 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);

  /* ============ 圆角 ============ */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* ============ 尺寸 ============ */
  --size-control-height: 2.25rem;
  --size-header-height: 3.5rem;
  --size-sidebar-width: 16rem;
  --size-sidebar-width-collapsed: 4rem;
  --size-content-max-width: 80rem;

  /* ============ 阴影 ============ */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* ============ 动效 ============ */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  /* ============ 字体 ============ */
  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

**关键设计说明**：

| 要点 | 说明 |
|------|------|
| `--color-*: initial` | 清空 Tailwind 默认调色板（blue-500 / red-400 等全部不可用），这本身就是防止硬编码颜色的第一道防线 |
| 不需要 JS 配置文件 | Tailwind v4 的 CSS 文件本身就是配置，不再需要 `tailwind-preset.ts` 或 `tailwind.config.ts` |
| oklch + opacity 修饰符 | `bg-primary/90` 等 opacity 语法在 v4 原生支持 oklch 颜色 |
| `@tailwindcss/vite` | 替代旧版 PostCSS 插件，构建更快 |

### 7.2 各层共享主题入口

每个需要 Tailwind 的 package 在自己的主 CSS 文件中 import 主题 CSS：

```css
/* packages/ui-primitives/src/styles.css */
@import "@mb/ui-tokens/src/tailwind-theme.css";

/* L2 的组件样式由 Tailwind utility class 提供，无额外自定义 CSS */
```

```css
/* apps/web-admin/src/styles.css */
@import "@mb/ui-tokens/src/tailwind-theme.css";
@import "@mb/ui-tokens/src/styles/index.css";
@import "@mb/ui-tokens/src/customizer.css";

/* 应用级自定义样式（如有） */
```

Vite 配置中使用 `@tailwindcss/vite` 插件替代 PostCSS：

```typescript
// apps/web-admin/vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
});
```

### 7.3 消费方式

L2-L5 组件代码**只能**通过 Tailwind 语义 class 消费主题：

```typescript
// ✅ 正确：通过 Tailwind 语义 class
<button className="bg-primary text-primary-foreground rounded-md h-[var(--size-control-height)]">
  Click
</button>

// ❌ 反面教材 1：硬编码颜色（被 --color-*: initial 拦截，编译时直接无对应 class）
<button className="bg-blue-500 text-white rounded-[8px] h-9">Click</button>

// ❌ 反面教材 2：内联 style
<button style={{ background: '#0ea5e9', color: '#fff' }}>Click</button>

// ❌ 反面教材 3：动态拼接 class（生产构建样式丢失的经典坑）
const variant = 'primary';
<button className={`bg-${variant}`}>Click</button>
```

---

## 8. 主题完整性校验脚本 [M2]

### 8.1 脚本职责

| 检查项 | 失败行为 |
|-------|---------|
| 所有风格 CSS 文件都存在（对应 Style Registry 登记的 `cssFile`）| 抛错 + 列出缺失文件 |
| 每个 style block 都定义了**全部核心语义 token**（以 `classic light` 为参考）| 抛错 + 列出每个 block 缺少的变量 |
| 每个 style block 没有定义参考块之外的多余变量（防 typo）| 抛错 + 列出多余变量 |
| 所有变量名符合扁平命名（`--<group>-<name>` 格式，禁止嵌套或点分段）| 抛错 + 列出违规变量 |

### 8.2 脚本结构

> 实际实现见 `client/packages/ui-tokens/scripts/check-theme-integrity.ts`，代码在此不重复——维护单份。

脚本的三层校验逻辑：

| 层 | 校验内容 | 数据来源 |
|----|---------|---------|
| **primitive 层** | `primitive.css` 文件存在且包含 `@theme` 块中的全部 primitive 变量 | `tokens/primitive.css` |
| **semantic 层** | 所有已注册 style 的 semantic CSS 都存在；每个 style 的 light + dark 两个 block 均声明了全部 `TOTAL_TOKENS` 个变量；无多余变量（防 typo） | `styleRegistry` + `tokens/semantic-*.css` |
| **component 层** | `component.css` 文件存在，引用的 semantic token 都在 classic light block 中定义 | `tokens/component.css` |

**`TOTAL_TOKENS` 守护**：`index.ts` 中导出的 `TOTAL_TOKENS = 70` 作为唯一事实源，脚本加载 `TOKEN_NAMES` 后断言长度等于 `TOTAL_TOKENS`，防止 token 新增后常量未更新的 drift。

扁平命名校验：所有 `--` 变量名必须满足 `^--[a-z]+(-[a-z0-9]+)+$`，禁止点分段、斜杠、camelCase。

### 8.3 注册到 package.json

`packages/ui-tokens/package.json`：

```json
{
  "name": "@mb/ui-tokens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "check:theme": "tsx scripts/check-theme-integrity.ts",
    "test": "vitest run"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

根 `client/package.json` 把它聚合到全局命令：

```json
{
  "scripts": {
    "check:theme": "pnpm -F @mb/ui-tokens check:theme"
  }
}
```

### 8.4 CI 集成

`.github/workflows/ci.yml`（节选）：

```yaml
- name: Check theme integrity
  run: pnpm check:theme
```

CI 失败时打印的错误示例：

```
主题完整性校验失败:

[dark] 缺少 2 个变量：
  --duration-slow
  --easing-out

[classic.dark] 包含 1 个参考块之外的变量（可能是 typo）：
  --color-priamry
```

<!-- verify: cd client && pnpm -F @mb/ui-tokens check:theme -->

---

## 9. 使用者扩展新风格的步骤 [M2]

使用者想加一套新风格（例如”lark-console 变种”）需要 **4 步**（其中步骤 4 是 M6 前的临时双维护方案）：

### 步骤 1：定义 semantic token 覆写

在 `packages/ui-tokens/src/tokens/semantic-<id>.css` 创建新文件，参考 `semantic-classic.css` 的结构，按需覆写 70 × 2 mode 的 token：

```css
/* selector specificity 0,2,0，覆盖 :root 的 primitive 默认值 */
:root[data-theme-style='<id>'] {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.2 0 0);
  --color-primary: oklch(0.55 0.2 250);
  --color-primary-foreground: oklch(1 0 0);
  /* ... 全部 70 个语义变量必须声明，否则完整性脚本报错 ... */
}

:root[data-theme-style='<id>'][data-theme-color-mode='dark'] {
  --color-background: oklch(0.18 0.02 250);
  --color-foreground: oklch(0.97 0 0);
  /* ... dark block 同样必须完整声明 ... */
}
```

### 步骤 2：在 styles/index.css 追加 @import

修改 `packages/ui-tokens/src/styles/index.css`，按 `primitive → semantic-* → component` 顺序追加：

```css
@import '../tokens/primitive.css';
@import '../tokens/semantic-classic.css';
@import '../tokens/semantic-<id>.css';  /* 追加在此 */
@import '../tokens/component.css';
```

### 步骤 3：在 style-registry.ts 注册

修改 `packages/ui-tokens/src/style-registry.ts`，追加一行 `styleRegistry.register()`：

```typescript
styleRegistry.register({
  id: '<id>',
  displayName: '...',
  description: '...',
  color: '#...',
  cssFile: './tokens/semantic-<id>.css',
});
```

`styleRegistry` 是 `StyleRegistry` class 实例（非 readonly 数组），`StyleId` 是 `string` 类型（非 union type）——扩展新 style 只需 `register()`，无需改类型定义。

### 步骤 4：应用层白名单同步（M6 前的双维护临时方案）

以下两处需同步追加新 id（白名单单一真源治理推迟到 M6）：

- `client/apps/web-admin/src/main.tsx`：`window.__MB_STYLE_IDS__ = ['classic', ..., '<id>']`
- `client/apps/web-admin/index.html`：inline script 的 `fallback` 数组同步追加 `'<id>'`

说明：当前阶段这三处（`style-registry.ts` / `main.tsx` / `index.html` fallback）必须同步维护，缺一会导致首帧闪烁或 style 不生效。

### 验证

```bash
cd client
pnpm -F @mb/ui-tokens check:theme       # 主题完整性校验（70 × 2 mode token 全量覆盖）
```

完成后在 ThemeCustomizer 的风格下拉框里就会自动出现新风格选项（因为所有 UI 都是从 `styleRegistry.getAll()` 渲染）。

<!-- verify: cd client && pnpm -F @mb/ui-tokens check:theme -->

---

[← 返回 README](./README.md)
