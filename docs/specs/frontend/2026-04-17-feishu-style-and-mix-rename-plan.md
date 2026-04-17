# Feishu Style + Mix Layout Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **更新日志**：2026-04-17 后 `registerStyle` 公共 API 已内部化（见 commit 43528836），本文档示例已同步为 `styleRegistry.register()`。

**Goal:** 新增 `feishu` style + 把 `module-switcher` layout 重命名为 `mix` 并让其样式完全 token 驱动，验证 Style × Layout × Component Token 三层正交架构。

**Architecture:** 三块顺序工作（P1 路径）——W1 Layout refactor → W2 Token 新增 → W3 组合验证。所有视觉差异由 CSS 变量表达，JSX 完全静态；`check-theme-integrity.ts` 扩展为 PASS 条件闭环。

**Tech Stack:** React 19 + TypeScript + Tailwind CSS v4 + CSS Custom Properties + shadcn/ui 原子层（不动）+ Vitest

**配套 Spec:** `docs/specs/frontend/2026-04-17-feishu-style-and-mix-rename.md`

---

## 文件结构总览

```
packages/ui-tokens/
├── src/tokens/
│   ├── primitive.css               MODIFY  W2  blue 色板修正（hue 240 → 259，补 50-900）+ font-sans 补 PingFang SC
│   ├── semantic-classic.css        -       （被 primitive 影响但映射不改）
│   ├── semantic-feishu.css         CREATE  W2  54 token × light/dark + W1 结构 token 覆写
│   └── component.css               MODIFY  W1  新增 --sidebar-item-active-* + --nav-tab-* + --sidebar-collapsed-width
├── src/styles/
│   ├── index.css                   MODIFY  W3  加 @import '../tokens/semantic-feishu.css'
│   ├── feishu.md                   CREATE  W2  DESIGN.md 9 章样板
│   └── shadcn-classic.md           MODIFY  W2  第 63 行 blue 值记录更新
├── src/style-registry.ts           MODIFY  W3  styleRegistry.register({ id: 'feishu', ... })
└── scripts/check-theme-integrity.ts MODIFY  W1  componentRequired 扩展 15 个新 tokens

packages/app-shell/
├── package.json                    MODIFY  W1  exports ./presets/module-switcher → ./presets/mix
├── src/presets/
│   ├── module-switcher/            DELETE  W1  （整个目录）
│   └── mix/                        CREATE  W1
│       ├── index.ts                CREATE  W1
│       └── mix-layout.tsx          CREATE  W1  7 处改动后的新文件
├── src/layouts/registry.ts         MODIFY  W1  id 'module-switcher' → 'mix'；import ModuleSwitcherLayout → MixLayout
└── src/i18n/
    ├── zh-CN/shell.json            MODIFY  W1  moduleSwitcher → mix（2 处）
    └── en-US/shell.json            MODIFY  W1  同上

apps/web-admin/
├── src/main.tsx                    MODIFY  W3  __MB_STYLE_IDS__ = ['classic', 'feishu']
└── index.html                      MODIFY  W3  inline script 白名单同步

docs/specs/frontend/
├── 01-layer-structure.md           MODIFY  W1  line 189 module-switcher → mix
├── 05-app-shell.md                 MODIFY  W1  line 17/47/115/127/137/1312/1314
├── 09-customization-workflow.md    MODIFY  W1  line 191/379
└── appendix.md                     MODIFY  W1  line 57

docs/adr/
└── 0017-app-shell从固定布局切换到layout-resolver加preset-registry.md  MODIFY  W1  line 24/27
```

**任务拆解原则**：每个 task 产出一个可独立 commit、可独立 review 的单元；内部 steps 按 2-5 分钟颗粒拆；能 TDD 的（scripts / types）走 red-green-commit，CSS/视觉部分靠 `check:theme` + `pnpm build` + 肉眼回归。

---

## Task 1 · W1 扩展 check-theme-integrity 校验清单（TDD · red）

**目的**：先让校验脚本"预期"见到 W1 新增的 15 个 component tokens；此时还没加 tokens，脚本会 FAIL——这是 TDD red 信号。Task 2 再 green。

**Files:**
- Modify: `client/packages/ui-tokens/scripts/check-theme-integrity.ts:115-156`（`componentRequired` 数组）

### Steps

- [ ] **Step 1: 阅读现有 componentRequired 结构**

Run: `sed -n '115,160p' client/packages/ui-tokens/scripts/check-theme-integrity.ts`

Expected: 看到 `const componentRequired = [ '--button-bg', ..., '--chart-5' ];` 的硬编码数组。

- [ ] **Step 2: 扩展数组，追加 15 个新 required tokens**

在 `'--chart-5',` 之后、`];` 之前插入：

```ts
    // W1 新增 Sidebar 激活态
    '--sidebar-item-active-fg',
    '--sidebar-item-active-font-weight',
    '--sidebar-item-active-indicator-width',
    '--sidebar-item-active-indicator-color',
    // W1 新增 Nav Tab
    '--nav-tab-fg',
    '--nav-tab-hover-fg',
    '--nav-tab-active-fg',
    '--nav-tab-active-bg',
    '--nav-tab-active-radius',
    '--nav-tab-active-underline-width',
    '--nav-tab-active-underline-color',
    '--nav-tab-height',
    '--nav-tab-padding-x',
    '--nav-tab-gap',
    // W1 新增 Sidebar collapsed width
    '--sidebar-collapsed-width',
```

- [ ] **Step 3: 跑 check:theme 验证 FAIL（TDD red）**

Run: `cd client && pnpm -F @mb/ui-tokens check:theme`

Expected: 退出码非 0，输出列出 15 个 `[FAIL] component 层缺少 N 个必需 token` 的条目。

- [ ] **Step 4: 暂不 commit（留到 Task 2 一起 commit，保证 red-green 在同一个 commit 对外可见）**

---

## Task 2 · W1 在 component.css 添加 15 个新 tokens（TDD · green）

**目的**：补齐 Task 1 声明的 tokens 默认值；让 `check:theme` PASS。

**Files:**
- Modify: `client/packages/ui-tokens/src/tokens/component.css`

### Steps

- [ ] **Step 1: 在 `/* ========== Sidebar ========== */` 块末尾追加激活态 tokens**

定位到 `--sidebar-margin-left: 0;` 下方，追加：

```css
  /* W1 新增：Sidebar 激活态（Inset/Mix 共用） */
  --sidebar-item-active-fg: var(--color-primary);
  --sidebar-item-active-font-weight: 500;
  --sidebar-item-active-indicator-width: 0;
  --sidebar-item-active-indicator-color: var(--color-primary);

  /* W1 新增：Sidebar collapsed 宽度 */
  --sidebar-collapsed-width: var(--size-sidebar-width-collapsed);
```

- [ ] **Step 2: 在 Chart 块之前（或 Header 之后）新增 Nav Tab 分组**

```css
  /* ========== Nav Tab（W1 新增；顶部导航 tab；Mix Layout 使用；Inset 若未来加也可用）========== */
  --nav-tab-fg: var(--color-muted-foreground);
  --nav-tab-hover-fg: var(--color-foreground);
  --nav-tab-active-fg: var(--color-primary);
  --nav-tab-active-bg: transparent;
  --nav-tab-active-radius: 0;
  --nav-tab-active-underline-width: 2px;
  --nav-tab-active-underline-color: var(--color-primary);
  --nav-tab-height: var(--size-control-h-md);
  --nav-tab-padding-x: 0.25rem;
  --nav-tab-gap: 1.5rem;
```

- [ ] **Step 3: 跑 check:theme 验证 PASS（TDD green）**

Run: `cd client && pnpm -F @mb/ui-tokens check:theme`

Expected: `[PASS] 三层 token 完整性通过：1 个 style，2 个 semantic block，每个 54 个变量；primitive + component 层必需 token 全部存在`

- [ ] **Step 4: Commit red + green 一起**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
git add client/packages/ui-tokens/scripts/check-theme-integrity.ts client/packages/ui-tokens/src/tokens/component.css
git commit -m "feat(tokens): 新增 Mix Layout 需要的 15 个 structural tokens

- --sidebar-item-active-{fg,weight,indicator-width,indicator-color}
- --nav-tab-* 一组（10 个，覆盖 fg/hover/active + underline/pill 切换）
- --sidebar-collapsed-width
- check-theme-integrity.ts 的 componentRequired 同步扩展

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 · W1 Rename module-switcher → mix（骨架层，无视觉改动）

**目的**：一次性完成目录 / 文件 / 类型 / i18n / package.json / registry 的 rename，保证 `pnpm build` 通过但视觉不变——把骨架层的改动和视觉改动解耦。

**Files:**
- Delete: `client/packages/app-shell/src/presets/module-switcher/` 整个目录
- Create: `client/packages/app-shell/src/presets/mix/mix-layout.tsx`（内容从 module-switcher-layout.tsx 移植并 rename 类型）
- Create: `client/packages/app-shell/src/presets/mix/index.ts`
- Modify: `client/packages/app-shell/package.json`（exports）
- Modify: `client/packages/app-shell/src/layouts/registry.ts`
- Modify: `client/packages/app-shell/src/i18n/zh-CN/shell.json`
- Modify: `client/packages/app-shell/src/i18n/en-US/shell.json`

### Steps

- [ ] **Step 1: 创建 mix/ 目录并移植文件**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client/packages/app-shell/src/presets
mkdir mix
cp module-switcher/module-switcher-layout.tsx mix/mix-layout.tsx
cp module-switcher/index.ts mix/index.ts
```

- [ ] **Step 2: 在 `mix-layout.tsx` 里把 `ModuleSwitcherLayout` 全部改为 `MixLayout`**

用编辑器的 replace-all 把这些一起改：
- `export function ModuleSwitcherLayout(` → `export function MixLayout(`
- `function useModuleSwitcherModules(` → `function useMixModules(`
- `useModuleSwitcherModules(` → `useMixModules(`
- `function ModuleSwitcherHeader(` → `function MixHeader(`
- `<ModuleSwitcherHeader` → `<MixHeader`
- `function ModuleSwitcherSidebar(` → `function MixSidebar(`
- `<ModuleSwitcherSidebar` → `<MixSidebar`
- `const MODULE_SWITCHER_SIDEBAR_WIDTH` → 暂时保留常量名（Task 4 统一删除改 token）
- `const MODULE_SWITCHER_SIDEBAR_COLLAPSED` → 同上

i18n key 引用也改：
- `t('moduleSwitcher.moduleFallback')` → `t('mix.moduleFallback')`
- `t('moduleSwitcher.workspaceLabel')` → `t('mix.workspaceLabel')`
- `t('moduleSwitcher.presetLabel')` → `t('mix.presetLabel')`
- `t('moduleSwitcher.title')` → `t('mix.title')`
- `t('moduleSwitcher.moduleSidebarHint')` → `t('mix.moduleSidebarHint')`

- [ ] **Step 3: 更新 `mix/index.ts`**

```ts
export { MixLayout } from './mix-layout';
```

- [ ] **Step 4: 删除旧目录**

```bash
rm -rf /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client/packages/app-shell/src/presets/module-switcher
```

- [ ] **Step 5: 更新 `app-shell/package.json` 的 exports**

打开 `client/packages/app-shell/package.json`，找到 `"exports"` 字段里的 `"./presets/module-switcher"` 条目，改为：

```json
    "./presets/mix": "./src/presets/mix/index.ts",
```

- [ ] **Step 6: 更新 `layouts/registry.ts`**

```ts
// 改 import
import { MixLayout } from '../presets/mix';

// 改 registry 条目
export const layoutRegistry = new LayoutRegistry('inset', [
  { id: 'inset', name: 'layout.inset', description: 'layout.insetDesc', component: InsetLayout },
  { id: 'mix', name: 'layout.mix', description: 'layout.mixDesc', component: MixLayout },
]);
```

- [ ] **Step 7: 更新 `i18n/zh-CN/shell.json` 和 `en-US/shell.json`**

在两个文件里把：
- `"moduleSwitcher": "Module Switcher"` → `"mix": "Mix（顶栏+侧栏）"` （zh-CN） / `"mix": "Mix (Top + Side)"` （en-US）
- `"module-switcherDesc": "..."` → `"mixDesc": "..."` （两边）
- 整个 `"moduleSwitcher": { ... }` 命名空间 → `"mix": { ... }`（内部 key 不变）

- [ ] **Step 8: 跑 pnpm build 和 pnpm check:types 验证**

```bash
cd client
pnpm check:types
pnpm build
```

Expected: 两个命令都退出 0。若有 "Cannot find module './presets/module-switcher'" 类错误，说明漏改了某处 import——用 `grep -rn "module-switcher\|moduleSwitcher\|ModuleSwitcher" client/packages/app-shell/src` 兜底自查。

- [ ] **Step 9: 跑 pnpm test 验证 274 tests 全绿**

```bash
cd client && pnpm test
```

Expected: 274 tests passed。

- [ ] **Step 10: Commit**

```bash
git add -A client/packages/app-shell/
git commit -m "refactor(app-shell): Rename module-switcher preset → mix

- presets/module-switcher/ → presets/mix/
- ModuleSwitcherLayout → MixLayout（含所有内部 function/prop 重命名）
- i18n namespace moduleSwitcher.* → mix.*
- package.json exports 子路径 ./presets/module-switcher → ./presets/mix
- Registry id 'module-switcher' → 'mix'（不双写兼容；旧 localStorage 值自然回落 inset）

视觉等价，7 处硬编码改造留到 Task 4。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 · W1 mix-layout.tsx 视觉 token 化 + icon + Header 补齐（7 处改动）

**目的**：让 mix 的样式完全由 component tokens 驱动，不再硬编码任何视觉决策；Header 补齐与 Inset 对等。

**Files:**
- Modify: `client/packages/app-shell/src/presets/mix/mix-layout.tsx`
- Modify: `client/packages/ui-tokens/src/tokens/component.css`（追加 `.nav-tab` / `.sidebar-item` 全局 class 规则）

### Steps

- [ ] **Step 1: 在 component.css 末尾追加 `.nav-tab` 和 `.sidebar-item` 的 class 规则**

这两条 class 是语义 class，不绑定 mix preset（未来 Inset 若加顶部 tab 也能用）。

```css

/* ========== Class-based rules（W1 新增，消费上面的 component tokens）========== */
.nav-tab {
  color: var(--nav-tab-fg);
  height: var(--nav-tab-height);
  padding-left: var(--nav-tab-padding-x);
  padding-right: var(--nav-tab-padding-x);
  display: inline-flex;
  align-items: center;
  background: transparent;
  border-bottom: 0 solid transparent;
  border-radius: 0;
  transition: color var(--duration-fast) var(--easing-out), background var(--duration-fast) var(--easing-out);
}
.nav-tab:hover { color: var(--nav-tab-hover-fg); }
.nav-tab[data-active='true'] {
  color: var(--nav-tab-active-fg);
  background: var(--nav-tab-active-bg);
  border-radius: var(--nav-tab-active-radius);
  border-bottom: var(--nav-tab-active-underline-width) solid var(--nav-tab-active-underline-color);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  color: var(--sidebar-fg);
  background: transparent;
  font-weight: 400;
  transition: background var(--duration-fast) var(--easing-out), color var(--duration-fast) var(--easing-out);
  box-shadow: inset var(--sidebar-item-active-indicator-width) 0 0 0 transparent;
}
.sidebar-item:hover { background: color-mix(in oklch, var(--sidebar-fg) 8%, transparent); }
.sidebar-item[data-active='true'] {
  color: var(--sidebar-item-active-fg);
  background: var(--sidebar-item-active-bg);
  font-weight: var(--sidebar-item-active-font-weight);
  box-shadow: inset var(--sidebar-item-active-indicator-width) 0 0 0 var(--sidebar-item-active-indicator-color);
}
```

- [ ] **Step 2: 在 mix-layout.tsx 顶部 import `resolveMenuIcon`**

```ts
import { resolveMenuIcon } from '../../menu';
```

- [ ] **Step 3: 删除 MODULE_SWITCHER_SIDEBAR_WIDTH / COLLAPSED 常量，Sidebar style 改用 CSS 变量**

```tsx
// 删除 line 20-21 的两个 const

// 在 MixSidebar 组件里
<aside
  className={cn(
    'fixed inset-y-(--size-header-height) left-0 z-40 flex border-r border-border bg-muted ...',
    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  )}
  style={{
    width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
  }}
>
```

- [ ] **Step 4: ModuleNavItem → MixNavItem：消费 resolveMenuIcon，统一 icon 渲染**

找到 `function ModuleNavItem(...)`（Task 3 应已改成 `MixNavItem`）。在函数顶部加：

```tsx
const Icon = resolveMenuIcon(node.icon);
```

把 folded 态的 `<span className="text-[11px] ...">{node.name.slice(0,1).toUpperCase()}</span>` 替换为：

```tsx
<Icon className="size-4" />
```

把 expanded 态的文字前加 icon 占位：

```tsx
<span className="w-4 shrink-0">
  <Icon className="size-4" />
</span>
<span className="min-w-0 flex-1 truncate">{node.name}</span>
{hasChildren && (isExpanded ? <ChevronDown ... /> : <ChevronRight ... />)}
```

- [ ] **Step 5: Mix sidebar item 激活样式改用 `.sidebar-item` class + data-active**

把原来的 `<button ... className={cn('flex w-full items-center rounded-md px-3 py-2 ...', isActiveLeaf && !hasChildren && 'bg-background font-medium text-primary', ...)}>` 简化为：

```tsx
<button
  type="button"
  data-active={isActiveLeaf && !hasChildren ? 'true' : 'false'}
  className={cn(
    'sidebar-item w-full text-left text-sm',
    collapsed && 'justify-center px-0',
  )}
  style={{ paddingLeft: collapsed ? undefined : `${0.75 + depth * 0.75}rem` }}
  ...
>
```

- [ ] **Step 6: Mix 顶部 module Tab 改用 `.nav-tab` class + data-active**

找到 `<nav className="hidden min-w-0 flex-1 items-stretch gap-6 ...">` 块内的 `<button>`，把：

```tsx
<button
  key={node.id}
  type="button"
  onClick={() => onSelectModule(node.id)}
  className={cn(
    'relative flex h-full items-center border-b-2 border-transparent px-1 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground',
    active && 'border-primary text-primary',
  )}
>
  {node.name}
</button>
```

改为：

```tsx
<button
  key={node.id}
  type="button"
  onClick={() => onSelectModule(node.id)}
  data-active={active ? 'true' : 'false'}
  className="nav-tab text-sm font-medium"
>
  {node.name}
</button>
```

顶层 `<nav>` 的 `gap-6` 也改用 token 驱动：

```tsx
<nav className="hidden min-w-0 flex-1 items-stretch overflow-x-auto lg:flex" style={{ gap: 'var(--nav-tab-gap)' }}>
```

- [ ] **Step 7: Header 补齐 GlobalSearchPlaceholder / DarkModeToggle / Avatar DropdownMenu**

参考 `inset-layout.tsx` 里的 `InsetHeader`，把 `MixHeader` 内的右侧控件区从：

```tsx
{notificationSlot}
<LanguageSwitcher />
<ThemeCustomizer />
<div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1.5 md:flex">
  <Avatar size="sm">...</Avatar>
  <span className="max-w-24 truncate text-sm font-medium">{currentUserName ?? t('header.profile')}</span>
</div>
<Button variant="ghost" size="sm" onClick={onLogout} ...><LogOut className="size-4" /></Button>
```

改为（按 inset-layout.tsx §400+ 的模式）：

```tsx
<GlobalSearchPlaceholder className="hidden md:block" />
{notificationSlot}
<LanguageSwitcher />
<ThemeCustomizer />
<DarkModeToggle />
<UserAvatarMenu currentUser={currentUser} onLogout={onLogout} />
```

**注意**：`UserAvatarMenu` 如果 inset-layout.tsx 内部是 private function，要么提取到 `components/` 共用，要么 mix 内部复刻。本 plan 不强制提取（记作独立问题，不本次做），**先复刻最小 DropdownMenu 版本**到 mix-layout.tsx 内。桌面端：Avatar + DropdownMenu（Settings + Logout）；移动端：MoreVertical overflow（Language / Dark / Theme / Logout）。

需要的新 import：
```ts
import { GlobalSearchPlaceholder } from '../../components/global-search-placeholder';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@mb/ui-primitives';
import { MoreVertical, Settings, Sun, Moon } from 'lucide-react';
```

- [ ] **Step 8: 跑 pnpm build + check:types + lint + test 全绿**

```bash
cd client
pnpm check:types && pnpm lint && pnpm lint:css && pnpm build && pnpm test
```

Expected: 全部退出码 0；274 tests 全绿。

- [ ] **Step 9: 启动 dev 肉眼回归 classic × mix**

```bash
cd client && pnpm dev
```

打开 http://localhost:5173 → 登录 → ThemeCustomizer 切换到 Mix layout。

Expected（除以下可见差异外，视觉和 commit 前一致）：
- Sidebar 菜单项左侧多了 icon 预留位
- Sidebar expanded 宽度从 15rem → 16rem；collapsed 从 3.125rem → 4rem
- Header 右侧多了 GlobalSearchPlaceholder / DarkModeToggle / Avatar DropdownMenu

- [ ] **Step 10: Commit**

```bash
git add -A client/packages/ui-tokens/src/tokens/component.css client/packages/app-shell/src/presets/mix/
git commit -m "feat(mix): 样式完全 token 驱动 + icon 消费 + Header 与 Inset 对齐

W1 七处改动：
1. Sidebar 宽度硬编码去除（15rem/3.125rem → var(--sidebar-width)/var(--sidebar-collapsed-width)）
2. resolveMenuIcon 消费 node.icon（与 inset 一致，缺失时 fallback FileText）
3. Sidebar expanded 预留 16px icon 位，所有菜单项对齐
4. Nav tab 激活态改用 .nav-tab class + data-active 消费 --nav-tab-*
5. Sidebar item 激活态改用 .sidebar-item class + data-active 消费 --sidebar-item-active-*
6. component.css 末尾新增 .nav-tab / .sidebar-item 全局 class 规则
7. Header 补 GlobalSearchPlaceholder / DarkModeToggle / Avatar DropdownMenu

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 · W1 文档侧 rename 同步（5 份 spec + 1 份 ADR）

**目的**：防止 doc drift。按 Codex 审查发现的 7 处同步改到位。

**Files:**
- Modify: `docs/specs/frontend/01-layer-structure.md`（line 189）
- Modify: `docs/specs/frontend/05-app-shell.md`（line 17/47/115/127/137/1312/1314）
- Modify: `docs/specs/frontend/09-customization-workflow.md`（line 191/379）
- Modify: `docs/specs/frontend/appendix.md`（line 57）
- Modify: `docs/adr/0017-app-shell从固定布局切换到layout-resolver加preset-registry.md`（line 24/27）
- Modify: `scripts/verify-frontend-docs.sh`（line 328: `shell_v2_keywords` 数组里的 `"module-switcher"` → `"mix"`；这是 CI 守护脚本，不改会 false-positive）

**已在 T3 提前做掉**（不要重复改）：
- `client/packages/app-shell/src/i18n/zh-CN/shell.json` 和 `en-US/shell.json` 里的 `customizer.contentLayoutHint` + `customizer.sidebarModeHint` 文案（共 4 处 "module-switcher" → "Mix"）

### Steps

- [ ] **Step 1: 批量 replace 5 份 docs + ADR**

对每个文件做 `module-switcher` → `mix`、`ModuleSwitcherLayout` → `MixLayout`、`moduleSwitcher` → `mix`。

可以逐个打开用编辑器 replace-all，也可以一条 `sed` 命令处理（macOS sed 需要 `-i ''`）：

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
for f in \
  docs/specs/frontend/01-layer-structure.md \
  docs/specs/frontend/05-app-shell.md \
  docs/specs/frontend/09-customization-workflow.md \
  docs/specs/frontend/appendix.md \
  "docs/adr/0017-app-shell从固定布局切换到layout-resolver加preset-registry.md"; do
  sed -i '' \
    -e 's/module-switcher/mix/g' \
    -e 's/ModuleSwitcherLayout/MixLayout/g' \
    -e 's/moduleSwitcher/mix/g' \
    "$f"
done
```

⚠️ 注意：这会把 `module-switcher-layout.tsx` 字符串也改成 `mix-layout.tsx`——这是对的（对齐 Task 3 的文件重命名）。

- [ ] **Step 1b: 更新 CI 守护脚本 keyword 列表**

`scripts/verify-frontend-docs.sh` line 328 的 `shell_v2_keywords` 数组里有 `"module-switcher"`——这是 CI 跑的守护脚本，要求文档必须出现某些关键词。rename 后这个关键词已经不存在了，守护会失败。更新成新关键词：

```bash
sed -i '' 's/"module-switcher"/"mix"/' scripts/verify-frontend-docs.sh
```

验证：
```bash
grep -n "shell_v2_keywords" -A 10 scripts/verify-frontend-docs.sh
```
Expected: `"mix"` 代替了 `"module-switcher"`。

- [ ] **Step 2: 验证 grep 归零**

```bash
grep -rn "module-switcher\|moduleSwitcher\|ModuleSwitcherLayout" docs/specs/frontend docs/adr scripts/verify-frontend-docs.sh | grep -v "2026-04-17-feishu-style"
```

Expected: 无输出（本次新建的 spec 和 plan 引用这些名词是"历史原貌"不改）。

- [ ] **Step 2b: 跑 verify-frontend-docs.sh 确认守护不 regress**

```bash
bash scripts/verify-frontend-docs.sh
```
Expected: 退出 0。若 FAIL，根据 log 补齐漏改的文件。

- [ ] **Step 3: Commit**

```bash
git add -A docs/specs/frontend/ "docs/adr/0017-app-shell从固定布局切换到layout-resolver加preset-registry.md" scripts/verify-frontend-docs.sh
git commit -m "docs: Rename module-switcher → mix 同步到 specs + ADR-0017 + CI 守护脚本

按 cross-review-residual-scan rule：批量替换后 grep 归零验证，防 doc drift。
scripts/verify-frontend-docs.sh 的 shell_v2_keywords 同步更新（CI 守护不 regress）。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 · W2 Primitive 层修正（blue 色板 + font-sans）

**目的**：blue 色板从 hue 240 的"伪 blue"修正到 tailwind 标准 hue 259；字体补 PingFang SC。

**Files:**
- Modify: `client/packages/ui-tokens/src/tokens/primitive.css:31-35, 91`
- Modify: `client/packages/ui-tokens/src/styles/shadcn-classic.md:63`

### Steps

- [ ] **Step 1: 修正 primitive.css 的 blue 色板（补完 10 阶 + 修正 hue 240 → 259）**

定位到 `--color-blue-400: oklch(0.72 0.14 240);` 一带，整组替换为：

```css
  /* Blue（对齐 Tailwind v4 官方 blue，hue 259 ± chroma 0.214） */
  --color-blue-50:  oklch(0.98 0.014 259);
  --color-blue-100: oklch(0.93 0.04 259);
  --color-blue-200: oklch(0.87 0.08 259);
  --color-blue-300: oklch(0.80 0.13 259);
  --color-blue-400: oklch(0.72 0.17 259);
  --color-blue-500: oklch(0.62 0.214 259);    /* ≈ #3370ff */
  --color-blue-600: oklch(0.55 0.21 259);
  --color-blue-700: oklch(0.48 0.19 259);
  --color-blue-800: oklch(0.42 0.16 259);
  --color-blue-900: oklch(0.35 0.12 259);
```

- [ ] **Step 2: 更新 font-sans 补 PingFang SC / Hiragino Sans GB**

把 `--font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;` 改为：

```css
  --font-sans: 'PingFang SC', 'Hiragino Sans GB', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
```

- [ ] **Step 3: 更新 shadcn-classic.md line 63 的 blue 值记录**

打开 `client/packages/ui-tokens/src/styles/shadcn-classic.md`，定位第 63 行：

```md
| `--color-info` | `var(--color-blue-500)` | 中性提示 |
```

替换为：

```md
| `--color-info` | `var(--color-blue-500)` | 中性提示（2026-04-17 随 primitive 修正 hue 240 → 259 对齐 tailwind 标准） |
```

- [ ] **Step 4: 跑全量验证**

```bash
cd client && pnpm check:types && pnpm -F @mb/ui-tokens check:theme && pnpm build && pnpm test
```

Expected: 全部退出 0，check:theme PASS，274 tests 全绿。

- [ ] **Step 5: 启动 dev 肉眼验证 classic 视觉（重点看 info 色）**

```bash
cd client && pnpm dev
```

Expected: Notice 模块里的"信息提示"类色值（如 `.bg-info` / `.text-info`）从冷蓝肉眼可感知地变为 tailwind 正蓝（偏紫）。其他区域无感。

- [ ] **Step 6: Commit**

```bash
git add client/packages/ui-tokens/src/tokens/primitive.css client/packages/ui-tokens/src/styles/shadcn-classic.md
git commit -m "feat(tokens): primitive blue 色板修正到 tailwind 标准 + font-sans 补 PingFang

- blue 色板补齐 50-900 完整 10 阶
- hue 240 → 259，chroma 0.15 → 0.214（对齐 tailwind v4 标准）
- classic 的 --color-info 视觉从冷蓝变为正蓝（语义不变）
- font-sans 首位加 PingFang SC / Hiragino Sans GB（macOS/iOS 中文优先）

上游杠杆定律：primitive 命名错误是历史债务，修正成本 = 3 处文档更新 + 1 处可感视觉变化；
拖到后面每加新 style 都要权衡旧 blue vs 新 sky。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 · W2 创建 semantic-feishu.css（light + dark + W1 结构 token 覆写）

**目的**：新 style 的 54 + 15 个 token 覆写齐全；`check:theme` 为 feishu 校验 PASS（注意此时 feishu 还没 `styleRegistry.register`，所以不被校验——校验要等 W3 Task 9 完成后才真正发生）。

**Files:**
- Create: `client/packages/ui-tokens/src/tokens/semantic-feishu.css`

### Steps

- [ ] **Step 1: 创建文件，粘贴 light block 骨架**

```css
/* Layer 2 — Semantic tokens for Feishu style
 * 对标飞书管理后台（g05t3iydj2i.feishu.cn/admin）
 *
 * 约定：
 *   - 色类 token 引 primitive 色板（blue/gray 等）
 *   - 尺寸/阴影/动效/字体直接引 primitive
 *   - 扁平设计：shadow 基本清零；激活态靠色块 + 粗字
 *
 * Selector 命名：
 *   Light: [data-theme-style='feishu']
 *   Dark:  [data-theme-style='feishu'][data-theme-color-mode='dark']
 */

[data-theme-style='feishu'] {
  /* ===== Surface ===== */
  --color-background: var(--color-white);
  --color-foreground: var(--color-gray-900);
  --color-card: var(--color-white);
  --color-card-foreground: var(--color-gray-900);
  --color-popover: var(--color-white);
  --color-popover-foreground: var(--color-gray-900);

  /* ===== Primary / Secondary / Accent ===== */
  --color-primary: var(--color-blue-500);
  --color-primary-foreground: var(--color-white);
  --color-secondary: var(--color-gray-100);
  --color-secondary-foreground: var(--color-gray-800);
  --color-accent: var(--color-blue-100);
  --color-accent-foreground: var(--color-blue-700);

  /* ===== Muted ===== */
  --color-muted: var(--color-gray-50);
  --color-muted-foreground: var(--color-gray-500);

  /* ===== Semantic status ===== */
  --color-destructive: var(--color-red-500);
  --color-destructive-foreground: var(--color-white);
  --color-success: var(--color-green-500);
  --color-success-foreground: var(--color-white);
  --color-warning: var(--color-amber-500);
  --color-warning-foreground: var(--color-gray-900);
  --color-info: var(--color-blue-500);

  /* ===== Border / Input / Ring ===== */
  --color-border: var(--color-gray-200);
  --color-input: var(--color-gray-200);
  --color-ring: var(--color-blue-500);

  /* ===== Sidebar ===== */
  --color-sidebar: var(--color-gray-50);
  --color-sidebar-foreground: var(--color-gray-800);
  --color-sidebar-primary: var(--color-blue-500);
  --color-sidebar-primary-foreground: var(--color-white);
  --color-sidebar-accent: var(--color-blue-100);
  --color-sidebar-accent-foreground: var(--color-blue-700);
  --color-sidebar-border: var(--color-gray-200);
  --color-sidebar-ring: var(--color-blue-500);

  /* ===== Chart（对齐飞书偏好的冷色数据可视化） ===== */
  --color-chart-1: var(--color-blue-500);
  --color-chart-2: var(--color-gray-500);
  --color-chart-3: var(--color-blue-300);
  --color-chart-4: var(--color-gray-300);
  --color-chart-5: var(--color-blue-700);

  /* ===== 其余核心 54 token =====
   * 实施时对照 ui-tokens/src/index.ts 的 TOKEN_NAMES 逐项枚举。
   * 预期字段：radius、shadow、font、ring-offset、overlay 等
   */

  /* ===== W1 结构 token 覆写（扁平 + 浅蓝激活）===== */
  --nav-tab-active-bg: color-mix(in oklch, var(--color-primary) 12%, transparent);
  --nav-tab-active-radius: var(--radius-md);
  --nav-tab-active-underline-width: 0;
  --sidebar-item-active-bg: var(--color-accent);
  --sidebar-item-active-fg: var(--color-accent-foreground);
  --sidebar-item-active-font-weight: 600;
  --card-shadow: none;
  --button-shadow: none;
}

[data-theme-style='feishu'][data-theme-color-mode='dark'] {
  /* Dark block：策略"能用不崩"，不追求 1:1 复刻（飞书本身没深色） */
  --color-background: var(--color-gray-950);
  --color-foreground: var(--color-gray-100);
  --color-card: var(--color-gray-900);
  --color-card-foreground: var(--color-gray-100);
  --color-popover: var(--color-gray-900);
  --color-popover-foreground: var(--color-gray-100);

  --color-primary: var(--color-blue-400);
  --color-primary-foreground: var(--color-gray-950);
  --color-secondary: var(--color-gray-800);
  --color-secondary-foreground: var(--color-gray-100);
  --color-accent: color-mix(in oklch, var(--color-blue-500) 20%, var(--color-gray-900));
  --color-accent-foreground: var(--color-blue-200);

  --color-muted: var(--color-gray-800);
  --color-muted-foreground: var(--color-gray-400);

  --color-destructive: var(--color-red-500);
  --color-destructive-foreground: var(--color-white);
  --color-success: var(--color-green-500);
  --color-success-foreground: var(--color-white);
  --color-warning: var(--color-amber-500);
  --color-warning-foreground: var(--color-gray-900);
  --color-info: var(--color-blue-400);

  --color-border: var(--color-gray-800);
  --color-input: var(--color-gray-800);
  --color-ring: var(--color-blue-400);

  --color-sidebar: var(--color-gray-900);
  --color-sidebar-foreground: var(--color-gray-100);
  --color-sidebar-primary: var(--color-blue-400);
  --color-sidebar-primary-foreground: var(--color-gray-950);
  --color-sidebar-accent: color-mix(in oklch, var(--color-blue-500) 20%, var(--color-gray-900));
  --color-sidebar-accent-foreground: var(--color-blue-200);
  --color-sidebar-border: var(--color-gray-800);
  --color-sidebar-ring: var(--color-blue-400);

  --color-chart-1: var(--color-blue-400);
  --color-chart-2: var(--color-gray-400);
  --color-chart-3: var(--color-blue-200);
  --color-chart-4: var(--color-gray-600);
  --color-chart-5: var(--color-blue-700);

  /* 其余 54 token 齐全 */

  /* W1 结构 token 覆写（深色下仍保持 flat 和浅蓝激活） */
  --nav-tab-active-bg: color-mix(in oklch, var(--color-primary) 20%, transparent);
  --nav-tab-active-radius: var(--radius-md);
  --nav-tab-active-underline-width: 0;
  --sidebar-item-active-bg: var(--color-accent);
  --sidebar-item-active-fg: var(--color-accent-foreground);
  --sidebar-item-active-font-weight: 600;
  --card-shadow: none;
  --button-shadow: none;
}
```

- [ ] **Step 2: 对照 `ui-tokens/src/index.ts` 的 `TOKEN_NAMES`，把 54 个核心 semantic token 全部补齐**

Run: `grep -A 80 "TOKEN_NAMES" client/packages/ui-tokens/src/index.ts | head -80`

拿到完整清单后，确保 light + dark 两个 block 内每个 token 都有值。**不允许用 "..." 省略**——check:theme 会强制校验。

- [ ] **Step 3: 暂不跑 check:theme**（feishu 此时没 styleRegistry.register，校验不会走到它）

手动 grep 检查自己补全没：
```bash
grep -c "\-\-color-" client/packages/ui-tokens/src/tokens/semantic-feishu.css
```

Expected: 54 × 2 = 108，加上 W1 覆写 × 2 = 16，再加 `--card-shadow` / `--button-shadow` × 2 = 4，总数应在 128 左右。如果远少于 100，说明漏了很多——补齐。

- [ ] **Step 4: Commit**

```bash
git add client/packages/ui-tokens/src/tokens/semantic-feishu.css
git commit -m "feat(tokens): 新增 semantic-feishu.css（light + dark + W1 结构覆写）

- 飞书蓝 primary = blue-500（≈ #3370ff）
- accent = blue-100（激活态浅蓝底）
- sidebar 背景 = gray-50（#f5f6f7 附近）
- Dark block 策略 '能用不崩'（飞书本身没深色，不追求 1:1）
- nav-tab/sidebar-item 结构 token 覆写：pill + 浅蓝底 + 粗字 + 扁平

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8 · W2 创建 feishu.md DESIGN 样板

**目的**：按 `shadcn-classic.md` 的 9 章样板，给 feishu 补齐同等深度的设计文档。

**Files:**
- Create: `client/packages/ui-tokens/src/styles/feishu.md`

### Steps

- [ ] **Step 1: 读 shadcn-classic.md 作为参考**

Run: `wc -l client/packages/ui-tokens/src/styles/shadcn-classic.md`

Expected: ≈420 行。9 章结构：1. 简介与参考；2. 色板映射表；3. Token 映射决策；4. 典型组件视觉示意；5. 结构特征；6. 字体与密度；7. 深色模式态度；8. 扩展性与混搭；9. 与其他 style 的差异速查表。

- [ ] **Step 2: 创建 feishu.md，按 9 章填充**

重点章节内容提示：

**第 1 章 简介与参考**：飞书管理后台 URL、品牌定位、适用场景（企业后台、SaaS 多模块）。

**第 2 章 色板映射表**：
| Feishu | 值 | 来源 | 用途 |
|---|---|---|---|
| Primary | `--color-blue-500` | oklch(0.62 0.214 259) | Button / Link / Tab 激活 |
| Accent  | `--color-blue-100` | oklch(0.93 0.04 259) | Sidebar 激活底 / Tab pill 底 |
| Sidebar | `--color-gray-50`  | oklch(0.985 0 0)    | 左侧 module sidebar 背景 |
| ...（补齐其他 8-10 个关键色） | | | |

**第 3 章 Token 映射决策**：为什么 primary 用 blue-500 而不是 blue-600；为什么 accent 用 blue-100 而不是 color-mix；为什么 chart-1 用 primary blue。

**第 4 章 典型组件视觉示意**：Button / Tab / Sidebar Item / Card / Input 的 ASCII 图示或截图引用。

**第 5 章 结构特征**：
- 扁平（card-shadow: none, button-shadow: none）
- 浅蓝激活（accent-based）
- 无 tab 下划线（pill 样式）
- Sidebar item 整行高亮

**第 6 章 字体与密度**：
- 字体栈首位 PingFang SC（primitive 层已配，全 style 共用）
- 密度：保持现有 scale 不调（customizer 可切）

**第 7 章 深色模式态度**：飞书没深色；本 style 提供 dark block 是为了满足框架要求，不求 1:1 复刻；维持蓝调 + 深灰反相。

**第 8 章 扩展性与混搭**：feishu style 可以和任何 layout 搭（inset × feishu / mix × feishu 都合理）；layout 和 style 完全正交。

**第 9 章 与 classic 的差异速查表**：
| 维度 | classic | feishu |
|---|---|---|
| Primary | gray-950 （纯黑）| blue-500 （飞书蓝）|
| Tab 激活 | border-bottom | pill（浅蓝底）|
| Sidebar 激活 | bg-background + primary 字 | 浅蓝整行底 + 加粗 |
| Card shadow | shadow-sm | none |
| Button shadow | shadow-sm | none |
| 字体 | 共用（PingFang 首选） | 共用（PingFang 首选）|

- [ ] **Step 3: Commit**

```bash
git add client/packages/ui-tokens/src/styles/feishu.md
git commit -m "docs(tokens): 新增 feishu.md DESIGN 样板（9 章）

对齐 shadcn-classic.md 的 9 章结构：
1 简介 / 2 色板 / 3 Token 映射 / 4 组件示意 / 5 结构特征
6 字体密度 / 7 深色态度 / 8 扩展性 / 9 与 classic 差异

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9 · W3 注册 feishu（CSS 入口 + JS 注册 + web-admin 白名单）

**目的**：把 Task 6/7/8 的 token + DESIGN.md 正式注册进 registry 和 CSS 入口；此后 `check:theme` 会把 feishu 纳入校验——这是真正的闭环 PASS 时刻。

**Files:**
- Modify: `client/packages/ui-tokens/src/styles/index.css`
- Modify: `client/packages/ui-tokens/src/index.ts`（在 styleRegistry 默认注册 classic 之后，追加 feishu 注册）
- Modify: `client/apps/web-admin/src/main.tsx`
- Modify: `client/apps/web-admin/index.html`

### Steps

- [ ] **Step 1: 更新 `styles/index.css` 的 @import 列表**

打开 `client/packages/ui-tokens/src/styles/index.css`，在 `semantic-classic.css` 下面、`component.css` 上面加一行：

```css
@import '../tokens/primitive.css';
@import '../tokens/semantic-classic.css';
@import '../tokens/semantic-feishu.css';   /* 新增 */
@import '../tokens/component.css';
```

顺序铁律：primitive → semantic-* → component。

- [ ] **Step 2: 更新 `ui-tokens/src/style-registry.ts` 追加 styleRegistry.register**

> **注意**：`registerStyle` 公共 API 已内部化（commit 43528836）。直接操作 `styleRegistry.register()`，不要 import `registerStyle`。

在 `ui-tokens/src/style-registry.ts` 的 `styleRegistry.register({ id: 'classic', ... })` 之后追加：

```ts
// 注意：不要在 src/index.ts 里 import semantic-feishu.css —— CSS 入口走 styles/index.css
styleRegistry.register({
  id: 'feishu',
  displayName: '飞书',
  description: '对标飞书管理后台的品牌主题（扁平 + 浅蓝激活）',
  color: '#3370ff',
  cssFile: './tokens/semantic-feishu.css',
});
```

**注意**：不要在 `index.ts` 里 `import './tokens/semantic-feishu.css'`——CSS 入口走 `styles/index.css`，JS 侧只做 meta 注册。

- [ ] **Step 3: 更新 `apps/web-admin/src/main.tsx` 的 `__MB_STYLE_IDS__`**

找到 `window.__MB_STYLE_IDS__ = [...]` 行，改为：

```ts
window.__MB_STYLE_IDS__ = ['classic', 'feishu'];
```

- [ ] **Step 4: 更新 `apps/web-admin/index.html` 的 inline script 白名单**

找到 `<script>window.__MB_STYLE_IDS__ = ...</script>` 行，改为：

```html
<script>window.__MB_STYLE_IDS__ = ['classic', 'feishu'];</script>
```

- [ ] **Step 5: 跑 check:theme，这次 feishu 会被真正校验**

```bash
cd client && pnpm -F @mb/ui-tokens check:theme
```

Expected: `[PASS] 三层 token 完整性通过：2 个 style，4 个 semantic block（classic.light/dark + feishu.light/dark），每个 54 个变量；primitive + component 层必需 token 全部存在`

如果 FAIL（"feishu.light 缺少 N 个变量" 类），**回到 Task 7 补齐 semantic-feishu.css**。这是本 plan 最关键的 gate。

- [ ] **Step 6: 跑全量验证**

```bash
cd client
pnpm check:types
pnpm check:i18n
pnpm build
pnpm test
pnpm lint
pnpm lint:css
pnpm check:deps
pnpm check:env
pnpm check:business-words
```

Expected: 全部退出 0。

- [ ] **Step 7: Commit**

```bash
git add client/packages/ui-tokens/src/styles/index.css client/packages/ui-tokens/src/style-registry.ts client/apps/web-admin/src/main.tsx client/apps/web-admin/index.html
git commit -m "feat(tokens): 注册 feishu style + web-admin 白名单

- styles/index.css 新增 @import semantic-feishu.css（critical）
- style-registry 默认注册条目新增 feishu（displayName: 飞书）
- web-admin main.tsx + index.html 白名单加 'feishu'
- check:theme 现在校验 2 style × 2 mode = 4 block 齐全

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10 · W3 4 组合视觉回归 + 截图 handoff

**目的**：启动 dev server，4 个组合逐个切换、肉眼对比视觉关键点，截图归档。这是 W3 PASS 的终极闭环。

**Files:**
- Create: `docs/handoff/feishu-style-visual-check.md`（截图归档）

### Steps

- [ ] **Step 1: 启动 dev + 打开浏览器**

```bash
cd client && pnpm dev
```

等待 `ready in ...` 出现后，打开 `http://localhost:5173`，登录。

- [ ] **Step 2: 切到 `inset × classic`，截图**

ThemeCustomizer → Style: 经典 + Layout: Inset。

Run:
```bash
mkdir -p /tmp/mb-visual-check
agent-browser --auto-connect screenshot /tmp/mb-visual-check/01-inset-classic.png
```

对比 git HEAD `1309b1f4`（M1 Review Fix 后的状态），Expected: **像素级一致或仅 info 色（如 Notice 列表 `.bg-info` 点状标记）可感知差异**（primitive blue 修正的合理副作用）。

- [ ] **Step 3: 切到 `mix × classic`，截图**

ThemeCustomizer → Style: 经典 + Layout: Mix。

Run: `agent-browser --auto-connect screenshot /tmp/mb-visual-check/02-mix-classic.png`

Expected（除以下三点外视觉与重命名前一致）：
- Sidebar 菜单项左侧有 icon 预留位
- Sidebar 宽度 16rem / collapsed 4rem（比原 15rem/3.125rem 大一点）
- Header 右侧有 GlobalSearchPlaceholder / DarkModeToggle / Avatar DropdownMenu

- [ ] **Step 4: 切到 `inset × feishu`，截图**

ThemeCustomizer → Style: 飞书 + Layout: Inset。

Run: `agent-browser --auto-connect screenshot /tmp/mb-visual-check/03-inset-feishu.png`

Expected: Inset 的浮起卡片结构保持；配色变飞书蓝 + 浅蓝激活 + 扁平（card 去阴影）。**不求 1:1 飞书感**，只求"组合渲染正确无崩溃"。

- [ ] **Step 5: 切到 `mix × feishu`，截图——核心验收**

ThemeCustomizer → Style: 飞书 + Layout: Mix。

Run: `agent-browser --auto-connect screenshot /tmp/mb-visual-check/04-mix-feishu.png`

同时打开飞书管理后台作对比：`agent-browser --auto-connect open "https://g05t3iydj2i.feishu.cn/admin/contacts/departmentanduser"`（复用洋哥已登录态）。

Run: `agent-browser --auto-connect screenshot /tmp/mb-visual-check/00-feishu-reference.png`

**对照 spec §6.3 的 10 项清单逐项过**：

```
□ Sidebar 菜单项：icon + 文字布局正确
□ Sidebar 激活子菜单：浅蓝整行底 + 蓝字加粗
□ Sidebar 折叠态：显示 icon（无 icon 时 fallback FileText）
□ 顶部 Tab 激活态：蓝色 pill（无下划线）
□ 顶部 Tab 非激活：灰字，hover 颜色微变
□ Header 高度/padding/搜索栏位置贴近飞书
□ Card / Table：无阴影扁平
□ Button primary：飞书蓝 (oklch(0.62 0.214 259) ≈ #3370ff)
□ 圆角：4-6px
□ 字体：PingFang SC
```

**10 项全 ✅ 才算 PASS**。任一项 ❌ 回到对应 Task 修（通常是 W2 Task 7 的 semantic-feishu.css 覆写值需要微调）。

- [ ] **Step 6: 写 handoff 文档**

创建 `docs/handoff/feishu-style-visual-check.md`，内容结构：

```markdown
# Feishu Style 视觉回归归档

日期：YYYY-MM-DD
Plan: docs/specs/frontend/2026-04-17-feishu-style-and-mix-rename-plan.md

## 4 组合截图

### 1. inset × classic
![](../../../../../../../tmp/mb-visual-check/01-inset-classic.png)
PASS：像素级一致（除 info 色略偏正蓝）

### 2. mix × classic
...

### 3. inset × feishu
...

### 4. mix × feishu（核心验收）
![](../../../../../../../tmp/mb-visual-check/04-mix-feishu.png)
飞书真实站参考：![](../../../../../../../tmp/mb-visual-check/00-feishu-reference.png)

10 项视觉清单逐项 ✅/❌ 记录：
- [x] Sidebar 菜单项：icon + 文字布局正确
- [x] ...
```

（`/tmp/mb-visual-check/` 的图不随仓库走；需要永久化的话可以复制到 `docs/handoff/images/`——本 plan 不强制，洋哥决定。）

- [ ] **Step 7: 跑最终全绿 CI 命令清单**

```bash
cd client
pnpm check:types
pnpm -F @mb/ui-tokens check:theme
pnpm check:i18n
pnpm build
pnpm test
pnpm lint
pnpm lint:css
pnpm check:deps
pnpm check:env
pnpm check:business-words
```

Expected: 10 项全部退出 0。

- [ ] **Step 8: Commit handoff 文档**

```bash
git add docs/handoff/feishu-style-visual-check.md
git commit -m "docs(handoff): Feishu style × Mix layout 4 组合视觉回归归档

10 项关键视觉点对照飞书管理后台真实站验收，全项 ✅。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9（可选）: Push 到 origin/main**

```bash
git push origin main
```

（按洋哥惯例，push 前确认）

---

## 附录 · 任务依赖图

```
Task 1 (TDD red: 扩展 check:theme)
   ↓
Task 2 (TDD green: 补 15 tokens)
   ↓
Task 3 (Rename 骨架) ──────┐
                            ↓
                        Task 4 (mix-layout.tsx 视觉 token 化)
                            ↓
Task 5 (文档 rename 同步) ──┘   （并行 OK，但建议紧跟骨架 commit 防漏）
   ↓
Task 6 (primitive blue 修正 + font-sans)
   ↓
Task 7 (semantic-feishu.css)
   ↓
Task 8 (feishu.md DESIGN)
   ↓
Task 9 (注册 styles/index.css + styleRegistry.register + white-list)
   ↓
Task 10 (4 组合视觉回归 + handoff)
```

## 附录 · 风险和回滚

| 阶段 | 如果失败 | 回滚策略 |
|---|---|---|
| Task 3 rename 后 build 挂 | 很可能漏改 import | grep "module-switcher" 兜底找漏；或 `git stash` 一次重新来 |
| Task 4 mix-layout 改完视觉崩 | 某处 className 写错 / style 属性拼写错 | 分 step commit 便于二分定位 |
| Task 6 blue 修正后 classic 视觉不可接受 | 可能饱和度过头或 chroma 偏差 | 回归 hue 259 但 chroma 调低到 0.18（保守版） |
| Task 7 semantic-feishu 漏 token | Task 9 的 check:theme 会报错 | 根据 error log 补齐，每个漏项 1 分钟 |
| Task 9 白名单没加 feishu | 首屏会立刻闪变，刷新可能出白屏 | 快速加回白名单即可 |
| Task 10 视觉不达标 | 10 项清单某项 ❌ | 调 semantic-feishu.css 对应 token 值 |

---

## 附录 · 已知本次不做的事

- ADR-0019（记录本次 3 个架构决策：正交三层 + 命名迁移 + blue 修正）— 建议另起 commit
- Mix shell 层越权 Hero 的 slot 化重构（spec §8.1）
- Mix 品牌名硬编码移除（spec §8.2）
- 首屏闪烁彻底修复（spec §7.1，M6 任务）
- `__MB_STYLE_IDS__` 单一真源治理（spec §7.2，M6 任务）
- app-shell/presets/mix/ 的 unit test 覆盖（独立工作，不阻塞本 plan）

### T4 code review follow-up（记 T10 handoff 跟进清单）

- **I1（Important）提取 Header 子组件到公共层**：`MixUserMenu` / `MixMobileOverflowMenu` 与 Inset 的同名组件逐行同构（复制粘贴）。建议在后续 milestone 合并到 `app-shell/src/components/header-user-menu.tsx` + `header-overflow-menu.tsx`，Inset 和 Mix 都消费，避免分叉维护。成本 < 维护分叉成本。不阻塞本 plan。
