# M2: 前端 L1 主题系统 + L2 原子组件 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 L1 主题系统（3 套主题 + 运行时切换 + 完整性校验）和 L2 原子组件库（30 个 shadcn/Radix 风格组件 + Storybook + Vitest）。

**Architecture:** L1 `@mb/ui-tokens` 提供纯 CSS 变量主题 + Theme Registry + 切换函数；L2 `@mb/ui-primitives` 用 CVA + Radix UI 封装 30 个原子组件，通过 Tailwind v4 语义 class 消费 L1 token。所有组件遵循 shadcn 模式（源码持有、文案 props 注入、零 i18n 依赖）。

**Tech Stack:** React 19 + TypeScript strict + Tailwind CSS v4 + tw-animate-css + Radix UI + CVA + clsx + tailwind-merge + Storybook 8 + Vitest + @testing-library/react

**Branch:** `feature/m2-theme-and-primitives`（已创建）

**关键约束（做之前必读）：**
- Tailwind v4 CSS-first，`@import "tailwindcss"` 只在 app 入口和 Storybook CSS 入口
- L1/L2 包不声明 tailwindcss 为 runtime 依赖（dependencies/peerDependencies）；devDependencies 中用于 Storybook 构建是可以的
- 动画用 `tw-animate-css`（shadcn/ui 官方指定的 v4 动画方案），通过 `@import "tw-animate-css"` 引入
- 主题 CSS 用 `[data-theme='xxx']` 选择器（不是 `:root`）
- L2 组件零 i18n 依赖，文案通过 props 传入
- React 19 ref-as-prop，不用 `forwardRef`
- 所有颜色走语义 token，禁止硬编码

---

## 并行策略

```
Batch 1 (L1 主题 + 校验脚本) ──┐
                                 ├─→ Batch 3 (主题集成到 web-admin) ──→ Batch 6 (质量门禁)
Batch 2 (L2 基础设施) ──────────┤
                                 └─→ Batch 4 (30 个 L2 组件，内部 4 组可并行)
                                       └─→ Batch 5 (Storybook stories + Vitest tests)
                                             └─→ Batch 6 (质量门禁)
```

- Batch 1 和 Batch 2 目录隔离（ui-tokens/ vs ui-primitives/），**可并行**
- Batch 4 内部 4 个组件组（输入/反馈/导航/展示）**可并行**
- 注意：并行 Batch 的 pnpm install 步骤需串行（共享 pnpm-lock.yaml），安装完依赖后再分头开发

---

## 文件结构总览

### L1 @mb/ui-tokens（修改 + 新增）

```
packages/ui-tokens/
├── src/
│   ├── index.ts                    ← 修改：增加 re-export theme-registry + apply-theme
│   ├── theme-registry.ts           ← 新增：ThemeId 类型 + themeRegistry 元数据
│   ├── apply-theme.ts              ← 新增：applyTheme / loadTheme / initTheme
│   ├── tailwind-theme.css          ← 不动
│   └── themes/
│       ├── default.css             ← 修改：:root → [data-theme='default']
│       ├── dark.css                ← 新增：46 变量暗色版
│       ├── compact.css             ← 新增：46 变量紧凑版
│       └── index.css               ← 新增：聚合 import
├── scripts/
│   └── check-theme-integrity.ts    ← 新增：~90 行完整性校验
├── package.json                    ← 修改：加 scripts + devDeps
└── tsconfig.json                   ← 可能修改：确保 include scripts/
```

### L2 @mb/ui-primitives（大量新增）

```
packages/ui-primitives/
├── src/
│   ├── lib/
│   │   └── utils.ts                ← 新增：cn() 工具函数
│   ├── index.ts                    ← 修改：barrel export 全部组件
│   ├── storybook.css               ← 新增：Storybook CSS 入口（tailwindcss + tw-animate-css + theme）
│   │
│   │  ── 输入类（11 个）──
│   ├── button.tsx / button.test.tsx / button.stories.tsx
│   ├── input.tsx / input.test.tsx / input.stories.tsx
│   ├── textarea.tsx / textarea.test.tsx / textarea.stories.tsx
│   ├── label.tsx / label.test.tsx / label.stories.tsx
│   ├── checkbox.tsx / checkbox.test.tsx / checkbox.stories.tsx
│   ├── radio-group.tsx / radio-group.test.tsx / radio-group.stories.tsx
│   ├── switch.tsx / switch.test.tsx / switch.stories.tsx
│   ├── slider.tsx / slider.test.tsx / slider.stories.tsx
│   ├── select.tsx / select.test.tsx / select.stories.tsx
│   ├── combobox.tsx / combobox.test.tsx / combobox.stories.tsx
│   ├── date-picker.tsx / date-picker.test.tsx / date-picker.stories.tsx
│   │
│   │  ── 反馈类（7 个）──
│   ├── dialog.tsx / dialog.test.tsx / dialog.stories.tsx
│   ├── alert-dialog.tsx / alert-dialog.test.tsx / alert-dialog.stories.tsx
│   ├── drawer.tsx / drawer.test.tsx / drawer.stories.tsx
│   ├── tooltip.tsx / tooltip.test.tsx / tooltip.stories.tsx
│   ├── popover.tsx / popover.test.tsx / popover.stories.tsx
│   ├── toast.tsx / toast.test.tsx / toast.stories.tsx
│   ├── hover-card.tsx / hover-card.test.tsx / hover-card.stories.tsx
│   │
│   │  ── 导航类（5 个）──
│   ├── tabs.tsx / tabs.test.tsx / tabs.stories.tsx
│   ├── breadcrumb.tsx / breadcrumb.test.tsx / breadcrumb.stories.tsx
│   ├── dropdown-menu.tsx / dropdown-menu.test.tsx / dropdown-menu.stories.tsx
│   ├── navigation-menu.tsx / navigation-menu.test.tsx / navigation-menu.stories.tsx
│   ├── command.tsx / command.test.tsx / command.stories.tsx
│   │
│   │  ── 展示类（7 个）──
│   ├── card.tsx / card.test.tsx / card.stories.tsx
│   ├── badge.tsx / badge.test.tsx / badge.stories.tsx
│   ├── avatar.tsx / avatar.test.tsx / avatar.stories.tsx
│   ├── separator.tsx / separator.test.tsx / separator.stories.tsx
│   ├── skeleton.tsx / skeleton.test.tsx / skeleton.stories.tsx
│   ├── accordion.tsx / accordion.test.tsx / accordion.stories.tsx
│   └── table.tsx / table.test.tsx / table.stories.tsx
│   │
│   └── __tests__/
│       └── no-i18n-dependency.test.tsx  ← 新增：i18n 隔离验证
│
├── .storybook/
│   ├── main.ts                     ← 新增：Storybook 配置
│   └── preview.tsx                 ← 新增：主题装饰器 + CSS import
├── package.json                    ← 修改：加依赖 + scripts
├── tsconfig.json                   ← 修改：include .storybook/
└── vitest.config.ts                ← 新增
```

### web-admin（修改）

```
apps/web-admin/
├── src/
│   ├── main.tsx                    ← 修改：加 initTheme() + import themes/index.css
│   └── styles.css                  ← 修改：加 import themes/index.css
└── package.json                    ← 修改：加 @mb/ui-primitives 依赖
```

### 根级

```
client/
├── package.json                    ← 修改：加 check:theme + storybook + test scripts
└── .github/workflows/client.yml    ← 修改：加 check:theme + test steps
```

---

## Batch 1: L1 主题系统完善

### Task 1.1: 修改 default.css 选择器

**Files:**
- Modify: `client/packages/ui-tokens/src/themes/default.css`

**背景:** M1 用 `:root` 选择器定义默认主题变量。M2 需要切换到 `[data-theme='default']` 选择器以支持 data-theme 属性切换。

- [ ] **Step 1: 修改选择器**

将 `default.css` 的 `:root` 选择器改为 `[data-theme='default']`：

```css
/* packages/ui-tokens/src/themes/default.css */
[data-theme='default'] {
  /* Colors (25) */
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

  /* Radius (4) */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Sizes (5) */
  --size-control-height: 2.25rem;
  --size-header-height: 3.5rem;
  --size-sidebar-width: 16rem;
  --size-sidebar-width-collapsed: 4rem;
  --size-content-max-width: 80rem;

  /* Shadows (4) */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Motion (5) */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  /* Fonts (3) */
  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

- [ ] **Step 2: 验证构建不坏**

Run: `cd client && pnpm build`
Expected: 构建通过（此时页面变量会丢失因为 html 没有 data-theme 属性，这是预期的，Task 1.6 会修复）

### Task 1.2: 创建 dark.css

**Files:**
- Create: `client/packages/ui-tokens/src/themes/dark.css`

- [ ] **Step 1: 创建暗色主题文件**

内容完整复制自 spec（02-ui-tokens-theme.md §6.2），全部 46 个变量：

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

  /* ============ 阴影（暗色加重）============ */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);

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

### Task 1.3: 创建 compact.css

**Files:**
- Create: `client/packages/ui-tokens/src/themes/compact.css`

- [ ] **Step 1: 创建紧凑主题文件**

内容完整复制自 spec（02-ui-tokens-theme.md §6.3）。颜色同 default，尺寸/圆角更紧凑，动效更快：

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

  /* 阴影与 default 相同 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* 动效更快 */
  --duration-fast: 100ms;
  --duration-normal: 180ms;
  --duration-slow: 300ms;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  /* 字体与 default 相同 */
  --font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
  --font-heading: var(--font-sans);
}
```

### Task 1.4: 创建 themes/index.css

**Files:**
- Create: `client/packages/ui-tokens/src/themes/index.css`

- [ ] **Step 1: 创建聚合入口**

```css
@import './default.css';
@import './dark.css';
@import './compact.css';
```

### Task 1.5: 创建 theme-registry.ts

**Files:**
- Create: `client/packages/ui-tokens/src/theme-registry.ts`

- [ ] **Step 1: 创建主题元数据注册表**

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

### Task 1.6: 创建 apply-theme.ts

**Files:**
- Create: `client/packages/ui-tokens/src/apply-theme.ts`

- [ ] **Step 1: 创建主题切换函数**

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

### Task 1.7: 更新 ui-tokens/src/index.ts

**Files:**
- Modify: `client/packages/ui-tokens/src/index.ts`

- [ ] **Step 1: 增加 re-export**

在现有 `TOKEN_NAMES` 和 `TOTAL_TOKENS` 导出之后追加：

```typescript
// 在文件末尾追加
export { themeRegistry, type ThemeId, type ThemeMeta } from './theme-registry';
export { applyTheme, loadTheme, initTheme, isValidTheme } from './apply-theme';
```

### Task 1.8: 更新 ui-tokens/package.json

**Files:**
- Modify: `client/packages/ui-tokens/package.json`

- [ ] **Step 1: 加 scripts 和 devDependencies**

```json
{
  "name": "@mb/ui-tokens",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tailwind-theme.css": "./src/tailwind-theme.css",
    "./themes/*": "./src/themes/*"
  },
  "scripts": {
    "check:theme": "tsx scripts/check-theme-integrity.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

注意：`tsx` 已在根 devDependencies 中，但作为独立包需要也声明（pnpm strict 模式）。

- [ ] **Step 2: 确保 tsconfig 包含 scripts 目录**

检查 `client/packages/ui-tokens/tsconfig.json`，确保 `include` 覆盖 `scripts/` 目录。如果 tsconfig 没有 include 字段（默认包含全部），则无需修改。

- [ ] **Step 3: Commit**

```bash
cd client && git add packages/ui-tokens/
git commit -m "feat(L1): 3 套主题 CSS + Theme Registry + 主题切换函数"
```

---

## Batch 2: 主题完整性校验脚本

### Task 2.1: 创建校验脚本

**Files:**
- Create: `client/packages/ui-tokens/scripts/check-theme-integrity.ts`

**前置依赖:** Task 1.5（theme-registry.ts 必须存在）

- [ ] **Step 1: 创建校验脚本**

```typescript
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themeRegistry } from '../src/theme-registry';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

- [ ] **Step 2: 注册到根 package.json**

在 `client/package.json` 的 scripts 中加：

```json
"check:theme": "pnpm -F @mb/ui-tokens check:theme"
```

- [ ] **Step 3: 运行校验确认通过**

Run: `cd client && pnpm check:theme`
Expected: `主题完整性校验通过 (3 个主题，每个主题 46 个变量)`

- [ ] **Step 4: Commit**

```bash
git add client/packages/ui-tokens/scripts/ client/package.json
git commit -m "feat(L1): 主题完整性校验脚本"
```

---

## Batch 3: 主题集成到 web-admin

### Task 3.1: 更新 web-admin 的 CSS 和 JS 入口

**Files:**
- Modify: `client/apps/web-admin/src/styles.css`
- Modify: `client/apps/web-admin/src/main.tsx`

**前置依赖:** Task 1.1-1.6

- [ ] **Step 1: 更新 styles.css — 引入 tw-animate-css + themes**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@mb/ui-tokens/tailwind-theme.css";
@import "@mb/ui-tokens/themes/index.css";

body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

注意：`tw-animate-css` 放在 `tailwindcss` 之后、`@theme` 之前。web-admin 的 devDependencies 需要加 `tw-animate-css`。

- [ ] **Step 2: 更新 main.tsx — 初始化主题**

在 `createRoot` 之前调用 `initTheme()`：

```tsx
import { initTheme } from '@mb/ui-tokens';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// 在 React 渲染前应用主题，避免闪烁
initTheme();

function LoginPage() {
  // ... 现有代码不动 ...
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <LoginPage />
    </StrictMode>,
  );
}
```

- [ ] **Step 3: 验证 dev + build 均通过**

Run: `cd client && pnpm build`
Expected: 构建通过

Run: `cd client && pnpm check:types`
Expected: 类型检查通过

- [ ] **Step 4: Commit**

```bash
git add client/apps/web-admin/src/styles.css client/apps/web-admin/src/main.tsx
git commit -m "feat(web-admin): 集成主题系统 + initTheme"
```

---

## Batch 4: L2 基础设施搭建

### Task 4.1: 安装 L2 依赖

**Files:**
- Modify: `client/packages/ui-primitives/package.json`

- [ ] **Step 1: 安装全部运行时依赖**

```bash
cd client
pnpm -F @mb/ui-primitives add \
  @radix-ui/react-slot \
  @radix-ui/react-label \
  @radix-ui/react-checkbox \
  @radix-ui/react-radio-group \
  @radix-ui/react-switch \
  @radix-ui/react-slider \
  @radix-ui/react-select \
  @radix-ui/react-popover \
  @radix-ui/react-dialog \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-tooltip \
  @radix-ui/react-toast \
  @radix-ui/react-hover-card \
  @radix-ui/react-tabs \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-navigation-menu \
  @radix-ui/react-accordion \
  @radix-ui/react-avatar \
  @radix-ui/react-separator \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  cmdk \
  react-day-picker
```

- [ ] **Step 2: 安装开发依赖**

```bash
cd client
pnpm -F @mb/ui-primitives add -D \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  jsdom \
  tailwindcss \
  @tailwindcss/vite \
  tw-animate-css \
  @storybook/react \
  @storybook/react-vite \
  @storybook/addon-essentials \
  @storybook/addon-a11y \
  @storybook/addon-interactions \
  @storybook/blocks \
  storybook \
  @types/react \
  @types/react-dom \
  typescript
```

注意：`tailwindcss` + `@tailwindcss/vite` + `tw-animate-css` 是 Storybook 构建必需的 devDep（不污染 runtime）。`addon-a11y` + `addon-interactions` 是 spec 10-quality-gates.md §4.7 要求的。

同时安装 web-admin 的 tw-animate-css：

```bash
pnpm -F web-admin add -D tw-animate-css
```

- [ ] **Step 3: 验证 pnpm install 无报错**

Run: `cd client && pnpm install`
Expected: 无 peer dependency 严重冲突

### Task 4.2: 创建 cn() 工具函数

**Files:**
- Create: `client/packages/ui-primitives/src/lib/utils.ts`

- [ ] **Step 1: 创建 utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind class，处理冲突 class 自动去重。
 * 用法：cn('px-2', condition && 'px-4') → 'px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Task 4.3: 创建 Vitest 配置

**Files:**
- Create: `client/packages/ui-primitives/vitest.config.ts`

- [ ] **Step 1: 创建 vitest 配置**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    css: false,
  },
});
```

### Task 4.4: 创建 Storybook 配置

**Files:**
- Create: `client/packages/ui-primitives/.storybook/main.ts`
- Create: `client/packages/ui-primitives/.storybook/preview.tsx`

- [ ] **Step 1: 创建 main.ts**

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    config.plugins = [...(config.plugins || []), tailwindcss()];
    return config;
  },
};

export default config;
```

关键：`viteFinal` 注入 `@tailwindcss/vite` 插件，否则 Storybook 中 Tailwind class 不会被处理。

- [ ] **Step 2: 创建 preview.tsx — 含主题切换装饰器**

```tsx
import type { Preview } from '@storybook/react';
import '../src/storybook.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: '主题切换',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: '默认' },
          { value: 'dark', title: '暗色' },
          { value: 'compact', title: '高密度' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'default',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'default';
      document.documentElement.dataset.theme = theme;
      return <Story />;
    },
  ],
};

export default preview;
```

- [ ] **Step 3: 创建 Storybook CSS 入口**

Create: `client/packages/ui-primitives/src/storybook.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@mb/ui-tokens/tailwind-theme.css";
@import "@mb/ui-tokens/themes/index.css";
```

注意：Storybook 需要自己的 CSS 入口来初始化 Tailwind + 动画（因为它不走 web-admin 的构建链路）。import 顺序：tailwindcss → tw-animate-css → @theme → themes。

### Task 4.5: 更新 ui-primitives/package.json scripts

**Files:**
- Modify: `client/packages/ui-primitives/package.json`

- [ ] **Step 1: 加 scripts**

在 package.json 中确保有以下 scripts：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

### Task 4.6: 更新根 package.json scripts

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: 加聚合 scripts**

```json
{
  "scripts": {
    "test": "pnpm -F @mb/ui-primitives test",
    "storybook": "pnpm -F @mb/ui-primitives storybook"
  }
}
```

（追加到现有 scripts 中，不覆盖已有的 dev / build / lint 等）

### Task 4.7: 更新 web-admin package.json

**Files:**
- Modify: `client/apps/web-admin/package.json`

- [ ] **Step 1: 加 @mb/ui-primitives 依赖**

在 dependencies 中加：

```json
"@mb/ui-primitives": "workspace:*"
```

- [ ] **Step 2: Commit**

```bash
cd client && git add .
git commit -m "feat(L2): 基础设施搭建 — 依赖安装 + Vitest + Storybook 配置"
```

---

## Batch 5: 30 个 L2 原子组件

**重要约定（每个组件都必须遵守）：**
1. CVA 定义 variants + defaultVariants（必须显式声明）
2. React 19 ref-as-prop（不用 forwardRef）
3. `cn()` 合并 className
4. 零 i18n — 所有文案通过 props 传入
5. 颜色只用语义 token（bg-primary，不用 bg-blue-500）
6. 导出到 index.ts
7. 每个组件一个 `.test.tsx` + 一个 `.stories.tsx`

**以下只列出关键组件的完整代码。其余组件遵循同样模式，实施者参考 spec（03-ui-primitives.md §7）和 shadcn/ui 源码。**

### Task 5.1: Button（参考实现，含 test + story）

**Files:**
- Create: `client/packages/ui-primitives/src/button.tsx`
- Create: `client/packages/ui-primitives/src/button.test.tsx`
- Create: `client/packages/ui-primitives/src/button.stories.tsx`

- [ ] **Step 1: 创建 button.tsx**

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 是否将按钮渲染为子元素（多态模式） */
  asChild?: boolean;
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLButtonElement>;
}

function Button({ className, variant, size, asChild = false, type, ref, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      type={asChild ? undefined : type ?? 'button'}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

- [ ] **Step 2: 创建 button.test.tsx**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('应该渲染默认 variant', () => {
    render(<Button>点我</Button>);
    const btn = screen.getByRole('button', { name: '点我' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('bg-primary');
  });

  it('应该应用 destructive variant', () => {
    render(<Button variant="destructive">删除</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-destructive');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>带 ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('应该响应 onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>点击</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('asChild 模式应该渲染为子元素', () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: '链接按钮' });
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('bg-primary');
  });

  it('默认 type 应该是 button 而非 submit', () => {
    render(<Button>普通按钮</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });
});
```

- [ ] **Step 3: 创建 button.stories.tsx**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: '默认按钮' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: '危险操作' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: '描边按钮' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: '次要按钮' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: '幽灵按钮' },
};

export const Link: Story = {
  args: { variant: 'link', children: '链接按钮' },
};

export const Small: Story = {
  args: { size: 'sm', children: '小按钮' },
};

export const Large: Story = {
  args: { size: 'lg', children: '大按钮' },
};

export const IconOnly: Story = {
  args: { size: 'icon', 'aria-label': '设置', children: '⚙' },
};

export const Disabled: Story = {
  args: { disabled: true, children: '禁用按钮' },
};
```

- [ ] **Step 4: 运行测试**

Run: `cd client && pnpm -F @mb/ui-primitives test`
Expected: 全部通过

- [ ] **Step 5: Commit**

```bash
git add client/packages/ui-primitives/src/button*
git commit -m "feat(L2): Button 组件 + test + stories"
```

### Task 5.2: Input + Textarea + Label

**Files:**
- Create: `client/packages/ui-primitives/src/input.tsx`
- Create: `client/packages/ui-primitives/src/input.test.tsx`
- Create: `client/packages/ui-primitives/src/input.stories.tsx`
- Create: `client/packages/ui-primitives/src/textarea.tsx`
- Create: `client/packages/ui-primitives/src/textarea.test.tsx`
- Create: `client/packages/ui-primitives/src/textarea.stories.tsx`
- Create: `client/packages/ui-primitives/src/label.tsx`
- Create: `client/packages/ui-primitives/src/label.test.tsx`
- Create: `client/packages/ui-primitives/src/label.stories.tsx`

- [ ] **Step 1: 创建 input.tsx**

```tsx
import * as React from 'react';
import { cn } from './lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

function Input({ className, type, ref, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Input };
```

- [ ] **Step 2: 创建 textarea.tsx**

```tsx
import * as React from 'react';
import { cn } from './lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: React.Ref<HTMLTextAreaElement>;
}

function Textarea({ className, ref, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Textarea };
```

- [ ] **Step 3: 创建 label.tsx**

```tsx
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>;
}

function Label({ className, ref, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
}

export { Label };
```

- [ ] **Step 4: 为三个组件各创建 test 和 stories 文件**

每个组件的 test 至少覆盖：渲染、ref 转发、className 合并。
每个组件的 stories 至少覆盖：默认态、disabled 态、placeholder 态。

（具体代码遵循 Button 的模式。test 验证渲染 + ref + disabled 状态。stories 展示各变体。）

- [ ] **Step 5: 运行测试 + Commit**

Run: `cd client && pnpm -F @mb/ui-primitives test`

```bash
git add client/packages/ui-primitives/src/input* client/packages/ui-primitives/src/textarea* client/packages/ui-primitives/src/label*
git commit -m "feat(L2): Input + Textarea + Label 组件"
```

### Task 5.3: Checkbox + RadioGroup + Switch + Slider

**Files:** 每个组件 3 文件（tsx + test + stories），共 12 文件。

遵循模式：
- 每个 wrap 对应的 `@radix-ui/react-*` primitive
- CVA 定义 variants（如果有的话）
- ref-as-prop
- className 用 cn() 合并
- test: 渲染 + 受控 onChange/onCheckedChange + ref 转发
- stories: 各状态展示

关键实现提示：
- **Checkbox**: wrap `@radix-ui/react-checkbox`，支持三态（checked / unchecked / indeterminate），`onCheckedChange` 回调
- **RadioGroup**: wrap `@radix-ui/react-radio-group`，导出 `RadioGroup` + `RadioGroupItem`
- **Switch**: wrap `@radix-ui/react-switch`，`onCheckedChange` 回调
- **Slider**: wrap `@radix-ui/react-slider`，支持单值和区间，`onValueChange` 回调

- [ ] **Step 1-4: 逐个实现组件 + test + stories**
- [ ] **Step 5: 运行测试 + Commit**

```bash
git commit -m "feat(L2): Checkbox + RadioGroup + Switch + Slider 组件"
```

### Task 5.4: Select + Combobox + DatePicker

**Files:** 3 × 3 = 9 文件。

关键实现提示：
- **Select**: wrap `@radix-ui/react-select`，导出 `Select` / `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem` / `SelectGroup` / `SelectLabel` / `SelectSeparator`
- **Combobox**: wrap `@radix-ui/react-popover` + `cmdk`，导出 `Combobox` / `ComboboxInput` / `ComboboxList` / `ComboboxItem` / `ComboboxEmpty`
- **DatePicker**: wrap `@radix-ui/react-popover` + `react-day-picker`，导出 `DatePicker`（单日期选择，范围版在 L3）

- [ ] **Step 1-4: 逐个实现**
- [ ] **Step 5: 运行测试 + Commit**

```bash
git commit -m "feat(L2): Select + Combobox + DatePicker 组件"
```

### Task 5.5: Dialog + AlertDialog + Drawer

**Files:** 3 × 3 = 9 文件。

- [ ] **Step 1: 创建 dialog.tsx**

完整代码见 spec（03-ui-primitives.md §7.2）。关键：
- 导出 `Dialog` / `DialogTrigger` / `DialogPortal` / `DialogOverlay` / `DialogClose` / `DialogContent` / `DialogHeader` / `DialogFooter` / `DialogTitle` / `DialogDescription`
- `DialogContent` 有 `closeLabel: string` prop（i18n 由调用方负责）
- 动画用 `data-[state=open]:animate-in data-[state=closed]:animate-out`

- [ ] **Step 2: 创建 alert-dialog.tsx**

wrap `@radix-ui/react-alert-dialog`，导出 `AlertDialog` / `AlertDialogTrigger` / `AlertDialogContent` / `AlertDialogHeader` / `AlertDialogFooter` / `AlertDialogTitle` / `AlertDialogDescription` / `AlertDialogAction` / `AlertDialogCancel`

- [ ] **Step 3: 创建 drawer.tsx**

wrap `@radix-ui/react-dialog` + 自定义侧边滑入动画，支持 `side: 'left' | 'right' | 'top' | 'bottom'` prop

- [ ] **Step 4-5: test + stories + commit**

```bash
git commit -m "feat(L2): Dialog + AlertDialog + Drawer 组件"
```

### Task 5.6: Tooltip + Popover + Toast + HoverCard

**Files:** 4 × 3 = 12 文件。

关键实现提示：
- **Tooltip**: wrap `@radix-ui/react-tooltip`，需要 `TooltipProvider` 在应用层包裹
- **Popover**: wrap `@radix-ui/react-popover`
- **Toast**: wrap `@radix-ui/react-toast`，导出 `Toast` / `ToastAction` / `ToastClose` / `ToastDescription` / `ToastProvider` / `ToastTitle` / `ToastViewport` + `useToast` hook + `Toaster` 组件
- **HoverCard**: wrap `@radix-ui/react-hover-card`

- [ ] **Step 1-4: 逐个实现**
- [ ] **Step 5: commit**

```bash
git commit -m "feat(L2): Tooltip + Popover + Toast + HoverCard 组件"
```

### Task 5.7: Tabs + Breadcrumb + DropdownMenu + NavigationMenu + Command

**Files:** 5 × 3 = 15 文件。

关键实现提示：
- **Tabs**: wrap `@radix-ui/react-tabs`，导出 `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- **Breadcrumb**: 纯语义 HTML（`<nav>` + `<ol>`），无 Radix 依赖
- **DropdownMenu**: wrap `@radix-ui/react-dropdown-menu`，导出全套子组件
- **NavigationMenu**: wrap `@radix-ui/react-navigation-menu`
- **Command**: wrap `cmdk`，导出 `Command` / `CommandDialog` / `CommandInput` / `CommandList` / `CommandEmpty` / `CommandGroup` / `CommandItem` / `CommandSeparator`

- [ ] **Step 1-5: 逐个实现 + commit**

```bash
git commit -m "feat(L2): Tabs + Breadcrumb + DropdownMenu + NavigationMenu + Command 组件"
```

### Task 5.8: Card + Badge + Avatar + Separator + Skeleton + Accordion + Table

**Files:** 7 × 3 = 21 文件。

关键实现提示：
- **Card**: 纯语义 HTML，导出 `Card` / `CardHeader` / `CardContent` / `CardFooter` / `CardTitle` / `CardDescription`
- **Badge**: `cva` 定义 5 variants（default / secondary / destructive / outline / success）
- **Avatar**: wrap `@radix-ui/react-avatar`，导出 `Avatar` / `AvatarImage` / `AvatarFallback`
- **Separator**: wrap `@radix-ui/react-separator`，支持 `orientation: 'horizontal' | 'vertical'`
- **Skeleton**: 纯 `<div>` + pulse 动画
- **Accordion**: wrap `@radix-ui/react-accordion`，导出 `Accordion` / `AccordionItem` / `AccordionTrigger` / `AccordionContent`
- **Table**: 纯语义 HTML，导出 `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` / `TableCaption` / `TableFooter`

- [ ] **Step 1-7: 逐个实现 + commit**

```bash
git commit -m "feat(L2): Card + Badge + Avatar + Separator + Skeleton + Accordion + Table 组件"
```

### Task 5.9: 更新 index.ts barrel export

**Files:**
- Modify: `client/packages/ui-primitives/src/index.ts`

- [ ] **Step 1: 替换为完整 barrel export**

```typescript
// packages/ui-primitives/src/index.ts
export * from './lib/utils';

// 输入类
export * from './button';
export * from './input';
export * from './textarea';
export * from './label';
export * from './checkbox';
export * from './radio-group';
export * from './switch';
export * from './slider';
export * from './select';
export * from './combobox';
export * from './date-picker';

// 反馈类
export * from './dialog';
export * from './alert-dialog';
export * from './drawer';
export * from './tooltip';
export * from './popover';
export * from './toast';
export * from './hover-card';

// 导航类
export * from './tabs';
export * from './breadcrumb';
export * from './dropdown-menu';
export * from './navigation-menu';
export * from './command';

// 展示类
export * from './card';
export * from './badge';
export * from './avatar';
export * from './separator';
export * from './skeleton';
export * from './accordion';
export * from './table';
```

### Task 5.10: i18n 隔离测试

**Files:**
- Create: `client/packages/ui-primitives/src/__tests__/no-i18n-dependency.test.tsx`

- [ ] **Step 1: 创建 i18n 隔离测试**

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button, Dialog, DialogContent, DialogTrigger, Input, Badge } from '../index';

describe('L2 i18n 隔离', () => {
  it('Button 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Button>测试</Button>)).not.toThrow();
  });

  it('Input 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Input placeholder="请输入" />)).not.toThrow();
  });

  it('Badge 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Badge>状态</Badge>)).not.toThrow();
  });

  it('Dialog 文案 props 应该按字面量渲染（不查 i18n）', () => {
    const { getByText } = render(
      <Dialog open>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭弹窗">
          <div>正文</div>
        </DialogContent>
      </Dialog>,
    );
    expect(getByText('打开')).toBeDefined();
  });
});
```

- [ ] **Step 2: 运行全部测试**

Run: `cd client && pnpm -F @mb/ui-primitives test`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add client/packages/ui-primitives/src/
git commit -m "feat(L2): 30 个原子组件 + i18n 隔离测试"
```

---

## Batch 5 续: Storybook stories + Vitest tests

**说明：** stories 和 test 文件在 Batch 5（30 个 L2 组件）中与组件一起创建，每个组件的 Task 包含 tsx + test + stories 三件套。此处不再单独成 Batch。

---

## Batch 6: 质量门禁 + 全量验证

### Task 6.1: 更新 CI workflow

**Files:**
- Modify: `.github/workflows/client.yml`

- [ ] **Step 1: 加入新的 CI 步骤**

在现有的 `lint` / `check:types` 步骤之后加：

```yaml
      - name: Check theme integrity
        run: cd client && pnpm check:theme

      - name: Run L2 tests
        run: cd client && pnpm test

      - name: Build Storybook
        run: cd client && pnpm -F @mb/ui-primitives storybook:build
```

### Task 6.2: 全量验证

- [ ] **Step 1: 跑完整验证清单**

```bash
cd client
pnpm install          # 依赖安装
pnpm build            # 生产构建（验证 module resolution）
pnpm lint             # Biome 检查
pnpm lint:css         # stylelint 检查
pnpm check:types      # TypeScript 类型检查
pnpm check:env        # .env.example 一致性
pnpm check:theme      # 主题完整性
pnpm test             # Vitest 单元测试
pnpm -F @mb/ui-primitives storybook:build  # Storybook 构建
```

Expected: 全部通过

注意事项（toolchain-compat-check rule）：
- stylelint + Tailwind v4 组合可能有误报，参考 M1 踩坑经验
- 如果 `pnpm build` 失败但 `pnpm dev` 通过，检查 module resolution 问题（verify-all-modes rule）

- [ ] **Step 2: Final Commit**

```bash
git add .
git commit -m "feat(M2): 质量门禁升级 + CI 集成"
```

---

## 验收检查清单

完成全部 Task 后，逐项检查：

| 检查项 | 命令 | 预期 |
|-------|------|------|
| 3 套主题 CSS | 目视检查 `themes/` 目录 | default.css + dark.css + compact.css |
| Theme Registry | 读 `theme-registry.ts` | 3 个主题元数据 |
| 主题切换函数 | 读 `apply-theme.ts` | applyTheme + loadTheme + initTheme |
| 主题完整性校验 | `pnpm check:theme` | 通过（3 主题 × 46 变量） |
| L2 组件数量 | `ls src/*.tsx \| wc -l` | 30（不含 test/stories） |
| Vitest 通过 | `pnpm test` | 全部绿 |
| Storybook 构建 | `pnpm -F @mb/ui-primitives storybook:build` | 成功 |
| TypeScript 通过 | `pnpm check:types` | 无错误 |
| 生产构建 | `pnpm build` | 成功 |
| lint 通过 | `pnpm lint && pnpm lint:css` | 无错误 |
| i18n 隔离 | 测试文件 `no-i18n-dependency.test.tsx` | 通过 |
| web-admin 集成 | `initTheme()` 在 main.tsx | 已调用 |

---

## 规则库索引（实施前扫描）

以下 rules 与 M2 相关，实施者做事前应读：

| 规则 | 适用场景 |
|------|---------|
| `~/.claude/rules/toolchain-compat-check.md` | 安装 Storybook / Vitest / Radix 后立刻跑验证 |
| `~/.claude/rules/verify-all-modes.md` | dev + build + lint 三态都要跑 |
| `.claude/rules/template-propagation-risk.md` | 30 个组件都复制 Button 模式，模板 bug 会传播 |
| `.claude/rules/cross-review-residual-scan.md` | 批量创建组件后做残留扫描 |
