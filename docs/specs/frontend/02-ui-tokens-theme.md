# 02 - L1 设计令牌与主题工程

> **关注点**：L1 `@mb/ui-tokens` + 纯 CSS Variables Only 哲学 + 46 个语义 token + 扁平命名 + Theme Registry + 主题完整性校验脚本 + Tailwind v4 CSS-first 配置 + 使用者扩展新主题。
>
> **本文件吸收**：brainstorming 决策 4（主题工程模型 = 纯 CSS Variables Only + 扁平命名）+ 千人千面硬约束中的 RECOMMENDED #1（硬编码颜色）/ MUST NOT #7（非扁平命名）+ MUST #2（所有主题必须定义全部 token）。

---

## 1. 决策结论 [M1]

### 1.1 核心决策

| 维度 | 决策 |
|------|------|
| 主题源数据 | **纯 CSS 文件**（`packages/ui-tokens/src/themes/*.css`） |
| 命名约定 | **扁平命名**（`--color-primary` / `--radius-md`，禁用嵌套或点分段） |
| 切换机制 | `document.documentElement.dataset.theme = 'dark'` + `localStorage` 持久化 |
| Token 总数 | 46 个语义 token，分 6 组（colors / radii / sizes / shadows / motion / fonts） |
| 完整性保障 | 自写 ~50 行 TypeScript 校验脚本，CI 硬失败 |
| Tailwind 集成 | Tailwind CSS v4 的 `@theme` 指令 CSS-first 配置，L2-L5 共享同一份主题 CSS |
| 初始主题数量 | **3 套**：default（中性基调）/ dark（暗色）/ compact（高密度） |

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

## 3. 语义 token 完整清单（46 个）[M1]

下表是 v1 的全部语义 token。**所有主题文件必须定义全部 token**，否则主题完整性校验脚本（§8）会失败。

### 3.1 颜色（25 个）

| 变量名 | 用途 | 示例值（default 主题） |
|-------|------|---------------------|
| `--color-background` | 全局页面背景 | `oklch(1 0 0)` |
| `--color-foreground` | 全局文字颜色 | `oklch(0.145 0 0)` |
| `--color-primary` | 主品牌色（按钮 / 链接 / 高亮） | `oklch(0.205 0 0)` |
| `--color-primary-foreground` | 主品牌色上的文字 | `oklch(0.985 0 0)` |
| `--color-secondary` | 次要按钮 / 次要操作背景 | `oklch(0.97 0 0)` |
| `--color-secondary-foreground` | 次要按钮上的文字 | `oklch(0.205 0 0)` |
| `--color-muted` | 弱化背景（次要面板 / placeholder） | `oklch(0.97 0 0)` |
| `--color-muted-foreground` | 弱化文字（次要描述 / 占位） | `oklch(0.556 0 0)` |
| `--color-accent` | 强调背景（hover / 选中态） | `oklch(0.97 0 0)` |
| `--color-accent-foreground` | 强调背景上的文字 | `oklch(0.205 0 0)` |
| `--color-destructive` | 危险操作背景（删除 / 错误） | `oklch(0.577 0.245 27.325)` |
| `--color-destructive-foreground` | 危险操作上的文字 | `oklch(0.985 0 0)` |
| `--color-success` | 成功状态背景（表单提交成功、审批通过） | `oklch(0.62 0.19 145)` |
| `--color-success-foreground` | 成功状态上的文字 | `oklch(0.985 0 0)` |
| `--color-warning` | 警告状态背景（库存预警、即将过期） | `oklch(0.75 0.18 85)` |
| `--color-warning-foreground` | 警告状态上的文字 | `oklch(0.205 0 0)` |
| `--color-info` | 信息状态背景（系统通知、辅助提示） | `oklch(0.65 0.15 240)` |
| `--color-info-foreground` | 信息状态上的文字 | `oklch(0.985 0 0)` |
| `--color-card` | 卡片背景（和页面背景有微妙区分，层次感） | `oklch(1 0 0)` |
| `--color-card-foreground` | 卡片上的文字 | `oklch(0.145 0 0)` |
| `--color-popover` | 弹层背景（Dropdown / Tooltip / Popover） | `oklch(1 0 0)` |
| `--color-popover-foreground` | 弹层上的文字 | `oklch(0.145 0 0)` |
| `--color-border` | 边框颜色 | `oklch(0.922 0 0)` |
| `--color-input` | 表单输入框边框 | `oklch(0.922 0 0)` |
| `--color-ring` | 焦点环（focus ring） | `oklch(0.708 0 0)` |

### 3.2 圆角（4 个）

| 变量名 | 用途 |
|-------|------|
| `--radius-sm` | 小圆角（小按钮 / Tag / Badge） |
| `--radius-md` | 中圆角（输入框 / 按钮 / Card） |
| `--radius-lg` | 大圆角（Dialog / Drawer / 大型卡片） |
| `--radius-xl` | 超大圆角（Hero 区 / 装饰块） |

### 3.3 尺寸（5 个）

| 变量名 | 用途 |
|-------|------|
| `--size-control-height` | 表单控件统一高度（Input / Button / Select） |
| `--size-header-height` | 顶部导航栏高度 |
| `--size-sidebar-width` | 侧边栏展开宽度 |
| `--size-sidebar-width-collapsed` | 侧边栏折叠宽度 |
| `--size-content-max-width` | 主内容区最大宽度 |

### 3.4 阴影（4 个）

| 变量名 | 用途 |
|-------|------|
| `--shadow-sm` | 小阴影（hover 提升 / Tag） |
| `--shadow-md` | 中阴影（Dropdown / Tooltip / Popover） |
| `--shadow-lg` | 大阴影（Dialog / Drawer） |
| `--shadow-xl` | 超大阴影（全屏 Modal / 浮层） |

### 3.5 动效（5 个）

| 变量名 | 用途 |
|-------|------|
| `--duration-fast` | 快速过渡（hover / 焦点切换，~150ms） |
| `--duration-normal` | 常规过渡（开关 / Tab，~250ms） |
| `--duration-slow` | 慢速过渡（Drawer / Dialog 进场，~400ms） |
| `--easing-in` | 进场缓动函数 |
| `--easing-out` | 出场缓动函数 |

### 3.6 字体（3 个）

| 变量名 | 用途 |
|-------|------|
| `--font-sans` | 全局正文字体（系统 sans-serif 栈） |
| `--font-mono` | 等宽字体（代码 / 数字表格） |
| `--font-heading` | 标题字体（默认与 sans 相同，使用者可覆盖） |

**总计**：25 + 4 + 5 + 4 + 5 + 3 = **46 个语义 token**。

### 3.7 未来版本待补 token（文档标注，v1 不实现）

| 分组 | token | 时机 | 说明 |
|------|-------|------|------|
| 侧边栏配色 | sidebar/fg, sidebar-primary/fg, sidebar-accent/fg, sidebar-border, sidebar-ring（8 个） | M3 | 侧边栏深色/浅色独立于主内容区 |
| 图表色 | chart-1 到 chart-5（5 个） | M5+ | 仪表盘/图表场景 |
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

## 5. 主题切换机制 [M2]

### 5.1 data-theme 属性切换

主题切换通过 **设置 `<html>` 元素的 `data-theme` 属性** 实现：

```html
<!-- 默认主题 -->
<html data-theme="default">
  <body>...</body>
</html>

<!-- 切换到暗色 -->
<html data-theme="dark">
  <body>...</body>
</html>
```

每个主题 CSS 文件用 `[data-theme="..."]` 选择器定义自己的变量值：

```css
/* packages/ui-tokens/src/themes/default.css */
[data-theme='default'] {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... 全部 46 个变量 ... */
}

/* packages/ui-tokens/src/themes/dark.css */
[data-theme='dark'] {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  /* ... 全部 46 个变量 ... */
}
```

### 5.2 切换函数

`packages/ui-tokens/src/apply-theme.ts`：

```typescript
import type { ThemeId } from './theme-registry';

const STORAGE_KEY = 'mb-theme';

/** 设置当前主题，并持久化到 localStorage */
export function applyTheme(themeId: ThemeId): void {
  document.documentElement.dataset.theme = themeId;
  try {
    window.localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // localStorage 不可用（隐私模式 / SSR），忽略
  }
}

/** 从 localStorage 恢复主题；无则返回默认主题 */
export function loadTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'default';
}

/** 验证字符串是否是已注册的主题 ID */
export function isValidTheme(value: string): value is ThemeId {
  return value === 'default' || value === 'dark' || value === 'compact';
}

/** 应用启动时调用：从 localStorage 恢复并应用 */
export function initTheme(): void {
  applyTheme(loadTheme());
}
```

### 5.3 初始化时机

在 `apps/web-admin/src/main.tsx` 应用启动时调用：

```typescript
import { initTheme } from '@mb/ui-tokens';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

// 在 React 渲染前应用主题，避免闪烁
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

React 运行后由 `ThemeProvider` 接管主题切换交互，详见 05-app-shell.md §4-§5。

### 5.4 Theme Registry

`packages/ui-tokens/src/theme-registry.ts`——主题元数据集中登记：

```typescript
/** 已注册的主题 ID 联合类型 */
export type ThemeId = 'default' | 'dark' | 'compact';

export interface ThemeMeta {
  readonly id: ThemeId;
  readonly displayName: string;
  readonly description: string;
  readonly cssFile: string;
}

/** 所有已注册主题的元数据 */
export const themeRegistry: readonly ThemeMeta[] = [
  {
    id: 'default',
    displayName: '默认',
    description: '中性基调，适合大部分场景',
    cssFile: './themes/default.css',
  },
  {
    id: 'dark',
    displayName: '暗色',
    description: '深色背景，适合长时间工作',
    cssFile: './themes/dark.css',
  },
  {
    id: 'compact',
    displayName: '高密度',
    description: '紧凑布局，适合数据密集场景',
    cssFile: './themes/compact.css',
  },
] as const;
```

---

## 6. 初始 3 套主题 [M2]

### 6.1 default 主题（中性基调，参考主题）

`packages/ui-tokens/src/themes/default.css`：

```css
[data-theme='default'] {
  /* ============ 颜色 ============ */
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

### 6.2 dark 主题（暗色）

`packages/ui-tokens/src/themes/dark.css`（只展示与 default 不同的部分；圆角 / 尺寸 / 阴影 / 动效 / 字体保持一致，但**仍然必须重复声明全部 46 个变量**）：

```css
[data-theme='dark'] {
  /* ============ 颜色（暗色反转）============ */
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.985 0 0);
  --color-primary-foreground: oklch(0.205 0 0);
  --color-secondary: oklch(0.269 0 0);
  --color-secondary-foreground: oklch(0.985 0 0);
  --color-muted: oklch(0.269 0 0);
  --color-muted-foreground: oklch(0.708 0 0);
  --color-accent: oklch(0.269 0 0);
  --color-accent-foreground: oklch(0.985 0 0);
  --color-destructive: oklch(0.704 0.191 22.216);
  --color-destructive-foreground: oklch(0.985 0 0);
  --color-success: oklch(0.55 0.17 145);
  --color-success-foreground: oklch(0.985 0 0);
  --color-warning: oklch(0.70 0.16 85);
  --color-warning-foreground: oklch(0.145 0 0);
  --color-info: oklch(0.60 0.13 240);
  --color-info-foreground: oklch(0.985 0 0);
  --color-card: oklch(0.205 0 0);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.205 0 0);
  --color-popover-foreground: oklch(0.985 0 0);
  --color-border: oklch(1 0 0 / 10%);
  --color-input: oklch(1 0 0 / 15%);
  --color-ring: oklch(0.556 0 0);

  /* 圆角 / 尺寸 / 阴影 / 动效 / 字体 与 default 相同，但完整性脚本要求全部声明 */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  --size-control-height: 2.25rem;
  --size-header-height: 3.5rem;
  --size-sidebar-width: 16rem;
  --size-sidebar-width-collapsed: 4rem;
  --size-content-max-width: 80rem;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);

  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

### 6.3 compact 主题（高密度）

`packages/ui-tokens/src/themes/compact.css`（与 default 颜色相同，但**尺寸更紧凑**）：

```css
[data-theme='compact'] {
  /* 颜色与 default 相同 */
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

  /* 圆角更小 */
  --radius-sm: 0.125rem;
  --radius-md: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* 尺寸更紧凑 */
  --size-control-height: 1.75rem;
  --size-header-height: 2.75rem;
  --size-sidebar-width: 13rem;
  --size-sidebar-width-collapsed: 3rem;
  --size-content-max-width: 80rem;

  /* 阴影 / 动效 / 字体 与 default 相同 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  --duration-fast: 100ms;
  --duration-normal: 180ms;
  --duration-slow: 300ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

### 6.4 主题入口聚合

`packages/ui-tokens/src/themes/index.css`（被 L5 应用入口 import 一次即可）：

```css
@import './default.css';
@import './dark.css';
@import './compact.css';
```

L5 入口文件 `apps/web-admin/src/main.tsx` 顶部：

```typescript
import '@mb/ui-tokens/themes/index.css';
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
@import "@mb/ui-tokens/src/themes/index.css";

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
| 所有主题 CSS 文件都存在（对应 Theme Registry 登记的 `cssFile`）| 抛错 + 列出缺失文件 |
| 每个主题都定义了**全部 46 个**语义 token（以 default 为参考）| 抛错 + 列出每个主题缺少的变量 |
| 每个主题没有定义参考主题之外的多余变量（防 typo）| 抛错 + 列出多余变量 |
| 所有变量名符合扁平命名（`--<group>-<name>` 格式，禁止嵌套或点分段）| 抛错 + 列出违规变量 |

### 8.2 脚本骨架

`packages/ui-tokens/scripts/check-theme-integrity.ts`：

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { themeRegistry } from '../src/theme-registry';

const PACKAGE_ROOT = resolve(__dirname, '..');
const REFERENCE_THEME = 'default';
const FLAT_NAME_PATTERN = /^--[a-z]+(-[a-z0-9]+)+$/;

interface ParsedTheme {
  readonly id: string;
  readonly variables: ReadonlySet<string>;
}

/** 从 CSS 文件中提取所有 --xxx 变量名 */
function parseTheme(id: string, cssPath: string): ParsedTheme {
  const content = readFileSync(cssPath, 'utf-8');
  const variables = new Set<string>();
  const matches = content.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g);
  for (const match of matches) {
    const name = match[1];
    if (name) {
      variables.add(name);
    }
  }
  return { id, variables };
}

/** 校验单个变量名是否符合扁平命名 */
function checkFlatNaming(name: string): boolean {
  return FLAT_NAME_PATTERN.test(name);
}

function main(): void {
  const errors: string[] = [];

  // 1. 加载所有主题
  const themes = themeRegistry.map((meta) => {
    const cssPath = resolve(PACKAGE_ROOT, 'src', meta.cssFile);
    return parseTheme(meta.id, cssPath);
  });

  // 2. 找参考主题
  const reference = themes.find((t) => t.id === REFERENCE_THEME);
  if (!reference) {
    errors.push(`参考主题 "${REFERENCE_THEME}" 未在 theme-registry 中注册`);
    console.error(errors.join('\n'));
    process.exit(1);
  }

  // 3. 校验每个变量名符合扁平命名
  for (const theme of themes) {
    for (const name of theme.variables) {
      if (!checkFlatNaming(name)) {
        errors.push(`[${theme.id}] 变量 "${name}" 不符合扁平命名规则 --<group>-<name>`);
      }
    }
  }

  // 4. 校验每个主题包含参考主题的全部变量（缺失检测）
  for (const theme of themes) {
    if (theme.id === REFERENCE_THEME) continue;
    const missing = [...reference.variables].filter((v) => !theme.variables.has(v));
    if (missing.length > 0) {
      errors.push(
        `[${theme.id}] 缺少 ${missing.length} 个变量：\n  ${missing.join('\n  ')}`,
      );
    }
  }

  // 5. 校验每个主题没有参考主题之外的变量（多余检测）
  for (const theme of themes) {
    if (theme.id === REFERENCE_THEME) continue;
    const extra = [...theme.variables].filter((v) => !reference.variables.has(v));
    if (extra.length > 0) {
      errors.push(
        `[${theme.id}] 包含 ${extra.length} 个参考主题之外的变量（可能是 typo）：\n  ${extra.join('\n  ')}`,
      );
    }
  }

  // 6. 输出结果
  if (errors.length > 0) {
    console.error('主题完整性校验失败:\n');
    console.error(errors.join('\n\n'));
    process.exit(1);
  }
  console.log(
    `主题完整性校验通过 (${themes.length} 个主题，每个主题 ${reference.variables.size} 个变量)`,
  );
}

main();
```

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

[compact] 包含 1 个参考主题之外的变量（可能是 typo）：
  --color-priamry
```

<!-- verify: cd client && pnpm -F @mb/ui-tokens check:theme -->

---

## 9. 使用者扩展新主题的步骤 [M2]

使用者想加一套新主题（例如"飞书风格"）只需 **3 步**：

### 步骤 1：新建主题 CSS 文件

在 `packages/ui-tokens/src/themes/feishu.css` 创建新文件，复制 `default.css` 的全部 46 个变量声明，把选择器改成 `[data-theme='feishu']`，按需修改值：

```css
[data-theme='feishu'] {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.2 0 0);
  --color-primary: oklch(0.55 0.2 250);  /* 飞书蓝 */
  --color-primary-foreground: oklch(1 0 0);
  /* ... 全部 46 个变量必须声明，否则完整性脚本报错 ... */
}
```

### 步骤 2：注册到 Theme Registry

修改 `packages/ui-tokens/src/theme-registry.ts`，添加新主题元数据：

```typescript
export type ThemeId = 'default' | 'dark' | 'compact' | 'feishu';

export const themeRegistry: readonly ThemeMeta[] = [
  // ... 原有 3 个主题 ...
  {
    id: 'feishu',
    displayName: '飞书',
    description: '飞书品牌色调',
    cssFile: './themes/feishu.css',
  },
] as const;
```

### 步骤 3：在 themes/index.css 引入

修改 `packages/ui-tokens/src/themes/index.css`：

```css
@import './default.css';
@import './dark.css';
@import './compact.css';
@import './feishu.css';
```

### 验证

```bash
cd client
pnpm -F @mb/ui-tokens check:theme       # 主题完整性校验
pnpm -r tsc --noEmit                    # ThemeId 联合类型更新后所有消费方编译通过
```

完成后在 ThemeSwitcher UI 里就会自动出现"飞书"选项（因为所有 UI 都是从 `themeRegistry` 渲染）。

<!-- verify: cd client && pnpm -F @mb/ui-tokens check:theme && pnpm -r tsc --noEmit -->

---

[← 返回 README](./README.md)
