# Feishu Style + Mix Layout Rename 设计

> 日期：2026-04-17
> 状态：Design（待实施）
> 关联 ADR：ADR-0019（待创建）— 正交三层契约（Layout × Style × Component Token）的正式落地
> 工作量估算：≈3.5 天（W1 1.5d + W2 1.2d + W3 0.7d）
>
> **更新日志**：2026-04-17 后 `registerStyle` 公共 API 已内部化（见 commit 43528836），本文档示例已同步为 `styleRegistry.register()`。注册只需调用 `style-registry.ts` 末尾的 `styleRegistry.register({...})`，无需从公共 API 导入 `registerStyle`。

---

## 1. 背景与目标

### 1.1 来源
2026-04-16 P0-P4 完成后，meta-build 前端已具备"Style × Layout 正交注册 + 3 层 Token"的架构基础。目标是**做一个飞书主题**来**实战验证架构扩展性**。

### 1.2 目标
1. **Style 扩展**：新增 `feishu` style，视觉整体对标 [飞书管理后台](https://g05t3iydj2i.feishu.cn/admin/contacts/departmentanduser)
2. **Layout 正交性落实**：把现有 `module-switcher` layout 改名为 `mix`（Ant Design Pro 术语），同时将其内部硬编码视觉完全抽成 component tokens，让 **所有 Layout × 所有 Style 的组合都正确渲染**
3. **Primitive 层债务清理**：修正 primitive 的 blue 色板到 tailwind 官方值（hue 259）

### 1.3 非目标（明示排除）
- **不**复刻飞书的工作台、Quick Launcher、多应用聚合等**功能**
- **不**做飞书管理后台的深色模式精细复刻（飞书本身没深色；本项目只保证 feishu dark 能用不崩）
- **不**修改 `@mb/ui-primitives` 组件层（component 层稳定性是底座硬约束）
- **不**改动业务页面（`features/**`）

---

## 2. 形态与约束

### 2.1 形态（洋哥确认）

> Layout 是 Layout 的事 · 主题是主题的事 · 其他是其他的事。三者完全独立，所有组合都合理。

对应到架构：

```
Layout     = 结构契约（有没有顶部 Tab、Sidebar 位置、是否 Inset、是否折叠）
Style      = 视觉语言（配色、字号、圆角、阴影、tab/sidebar 激活态细节）
Shell 行为 = 共享基础设施（权限、菜单数据、i18n、路由、slot）
```

所有 Layout × Style 组合：
- `inset × classic`（现状）
- `inset × feishu`（浮起卡片 + 飞书蓝）
- `mix × classic`（顶 Tab + 侧栏 + 冷灰语言）
- `mix × feishu`（= 飞书管理后台观感，本次**核心目标**）

### 2.2 约束
- 改动**收敛**到 `@mb/ui-tokens` + `@mb/app-shell/presets/mix/` + `apps/web-admin` 入口白名单
- 不碰 `@mb/ui-primitives`
- `check:theme` 三层完整性校验必须通过（新 style 要提供 light+dark 两套 54 token）
- 既有 274 tests 全绿，不新增强制测试

---

## 3. 架构全景

```
client/
├── packages/
│   ├── ui-tokens/
│   │   ├── src/tokens/
│   │   │   ├── primitive.css           ← W2 改：blue 色板修正 + font-sans 补 PingFang
│   │   │   ├── semantic-classic.css    ← 不动（info 色视觉因 primitive 修正而变化，token 映射不变）
│   │   │   ├── semantic-feishu.css     ← W2 新建：54 × 2 + W1 结构 token 覆写
│   │   │   └── component.css           ← W1 改：新增 --nav-tab-* + 扩展 --sidebar-item-active-*
│   │   ├── src/styles/
│   │   │   ├── shadcn-classic.md       ← 不动
│   │   │   └── feishu.md               ← W2 新建：DESIGN.md 9 章样板
│   │   └── src/style-registry.ts      ← W3 改：追加 styleRegistry.register({ id: 'feishu', ... })
│   │
│   └── app-shell/
│       ├── src/presets/
│       │   ├── inset/                  ← 不动
│       │   └── mix/                    ← W1 重命名：module-switcher/ → mix/
│       │       ├── mix-layout.tsx      ← W1 改：7 处改动（rename + icon + token 化 + header 对齐）
│       │       └── index.ts
│       ├── src/layouts/registry.ts     ← W1 改：id 'module-switcher' → 'mix'
│       └── src/i18n/
│           ├── zh-CN/shell.json        ← W1 改：moduleSwitcher → mix（2 处）
│           └── en-US/shell.json        ← W1 改：同上
│
└── apps/web-admin/
    ├── src/main.tsx                    ← W3 改：__MB_STYLE_IDS__ 加 'feishu'
    └── index.html                      ← W3 改：inline script 白名单加 'feishu'
```

---

## 4. W1 · Mix Layout 改造（≈1.5 天）

### 4.1 重命名清单（代码层）

| 位置 | 旧 | 新 |
|---|---|---|
| 目录 | `presets/module-switcher/` | `presets/mix/` |
| 文件 | `module-switcher-layout.tsx` | `mix-layout.tsx` |
| 类型/函数 | `ModuleSwitcherLayout` | `MixLayout` |
| Registry id | `'module-switcher'` | `'mix'` |
| i18n key（label） | `layout.moduleSwitcher` | `layout.mix` |
| i18n key（desc） | `layout.module-switcherDesc` | `layout.mixDesc` |
| i18n namespace | `moduleSwitcher.*` | `mix.*` |
| package.json 子路径导出 | `"./presets/module-switcher": "./src/presets/module-switcher/index.ts"` | `"./presets/mix": "./src/presets/mix/index.ts"` |

**兼容策略**：不做双写。旧 localStorage 值 `mb_layout_preset='module-switcher'` 查不到时自然回落到 registry default `inset`（已有逻辑；**实际 key 是 `mb_layout_preset`，不是 `mb_layout`**——style/colorMode 才用 `mb_style` / `mb_color_mode`）。

### 4.1.1 Rename 同步改动面（文档侧，必改）

以下文件含 `module-switcher` / `moduleSwitcher` 字样，rename 后必须同步更新：

| 文件 | 位置 |
|---|---|
| `docs/specs/frontend/01-layer-structure.md` | line 189 目录示例 |
| `docs/specs/frontend/05-app-shell.md` | line 17/47/115/127/137/1312/1314 多处引用 |
| `docs/specs/frontend/09-customization-workflow.md` | line 191/379 |
| `docs/specs/frontend/appendix.md` | line 57 |
| `docs/adr/0017-app-shell从固定布局切换到layout-resolver加preset-registry.md` | line 24/27 |

漏掉任何一处都会造成 doc drift（AI 读到旧名称，下次改动时复用错名）。这是"上游杠杆定律 + cross-review-residual-scan"的核心——rename **必须一次到位**。

### 4.2 Token 契约新增

#### 4.2.1 扩展现有 Sidebar component tokens（`component.css`）

```css
/* 已有：--sidebar-item-active-bg: var(--color-sidebar-accent); */

/* 新增：让激活态的视觉差异全部参数化 */
--sidebar-item-active-fg: var(--color-primary);
--sidebar-item-active-font-weight: 500;               /* feishu 覆写为 600 */
--sidebar-item-active-indicator-width: 0;        /* feishu 可覆写为 2px（左侧竖线） */
--sidebar-item-active-indicator-color: var(--color-primary);
```

#### 4.2.2 新增顶部 Nav Tab 一组（`component.css`）

命名用 `--nav-tab-*`（标准语义，不绑定 layout）：

```css
/* ========== Nav Tab（顶部导航 tab，Mix Layout 使用；Inset 若未来加也可用）========== */
--nav-tab-fg: var(--color-muted-foreground);
--nav-tab-hover-fg: var(--color-foreground);
--nav-tab-active-fg: var(--color-primary);
--nav-tab-active-bg: transparent;                /* classic: transparent; feishu: color-mix(primary, 12%) */
--nav-tab-active-radius: 0;                      /* classic: 0; feishu: var(--radius-md) */
--nav-tab-active-underline-width: 2px;           /* classic: 2px; feishu: 0 */
--nav-tab-active-underline-color: var(--color-primary);
--nav-tab-height: var(--size-control-h-md);
--nav-tab-padding-x: 0.25rem;                    /* classic 现在是 px-1 = 0.25rem */
--nav-tab-gap: 1.5rem;                           /* tab 之间的间距 */
```

#### 4.2.3 Sidebar 宽度去硬编码（`component.css` + 消费 `primitive.css` 已有尺寸）

```css
/* primitive.css 已有 */
--size-sidebar-width: 16rem;                 /* 默认 expanded 宽度 */
--size-sidebar-width-collapsed: 4rem;        /* 默认 collapsed 宽度 */

/* component.css 已有 */
--sidebar-width: var(--size-sidebar-width);

/* component.css 新增 */
--sidebar-collapsed-width: var(--size-sidebar-width-collapsed);
```

mix-layout.tsx 中的两处硬编码必须同时 token 化：
- `MODULE_SWITCHER_SIDEBAR_WIDTH = '15rem'` → 删除常量，使用 `var(--sidebar-width)`（值从 15rem → 16rem，**与 Inset 统一**）
- `MODULE_SWITCHER_SIDEBAR_COLLAPSED = '3.125rem'` → 删除常量，使用 `var(--sidebar-collapsed-width)`（值从 3.125rem → 4rem，**与 Inset 统一**）

**视觉后果**：classic × mix 下 expanded sidebar 宽 +16px、collapsed +14px。属于"正交层级的统一回归"——Inset 和 Mix 共享 sidebar 宽度 token，未来想让 mix 更窄可以新开 `--sidebar-width-mix` 类 token，但不在本次范围。

### 4.3 `mix-layout.tsx` 的 7 处改动

1. **Rename**：文件名、类型名、i18n 引用全部按 §4.1 改

2. **Sidebar folded 态消费 `node.icon`**（删除当前 `node.name.slice(0,1)` 独占路径）。**复用 `inset-layout.tsx` 已有的 `resolveMenuIcon()` 辅助**（不要自己再实现 icon string → component 映射）。

   **关键契约事实**：`resolveMenuIcon(iconName: string | null): ElementType` **永远返回非空值**（未匹配时 fallback 到 `FileText`）。这意味着 `Icon ? ... : <首字母>` 的三元永远走 Icon 分支——首字母 fallback **是死代码**。
   
   正确写法（与 Inset 一致，不做首字母 fallback，缺失 icon 时统一显示 `FileText`）：
   ```tsx
   import { resolveMenuIcon } from '../../menu';
   const Icon = resolveMenuIcon(node.icon);
   // folded 态：
   <Icon className="size-4" />
   ```

3. **Sidebar expanded 态统一预留 icon 位**（16px width + 0.5rem gap，所有菜单项对齐）：
   ```tsx
   <span className="w-4 shrink-0">
     <Icon className="size-4" />
   </span>
   <span className="flex-1 truncate">{node.name}</span>
   ```
   **视觉后果**：classic × mix 下每项左缩进多 `w-4 + gap = 24px`。这是"对齐标准侧栏设计"的回归型改动，PASS 条件相应放宽（见 §4.4）。

4. **顶部 Tab 激活样式 token 化**：把现状 `border-b-2 border-primary` 改为 `data-active` class + 一条统一 CSS rule 消费 `--nav-tab-*`
   ```tsx
   <button data-active={active} className="nav-tab">{node.name}</button>
   ```
   对应 CSS **放在 `component.css` 末尾**（`.nav-tab` 是语义 class，不绑定 mix preset；未来 Inset 若加顶部 tab 也能复用）：
   ```css
   .nav-tab { color: var(--nav-tab-fg); height: var(--nav-tab-height); }
   .nav-tab:hover { color: var(--nav-tab-hover-fg); }
   .nav-tab[data-active='true'] {
     color: var(--nav-tab-active-fg);
     background: var(--nav-tab-active-bg);
     border-radius: var(--nav-tab-active-radius);
     border-bottom: var(--nav-tab-active-underline-width) solid var(--nav-tab-active-underline-color);
   }
   ```

5. **Sidebar item 激活样式 token 化**：同上原则，CSS 同样放 `component.css` 末尾
   ```tsx
   <button data-active={isActiveLeaf} className="sidebar-item">...</button>
   ```
   对应 CSS 消费 `--sidebar-item-active-*`。

6. **Sidebar 宽度两处硬编码去除**：
   - `MODULE_SWITCHER_SIDEBAR_WIDTH = '15rem'` → `var(--sidebar-width)`（值 15rem → 16rem）
   - `MODULE_SWITCHER_SIDEBAR_COLLAPSED = '3.125rem'` → `var(--sidebar-collapsed-width)`（值 3.125rem → 4rem）

7. **Header 补齐与 Inset 对等**（自审 A2 新增）：
   - 加入 `<GlobalSearchPlaceholder />`（桌面端居中）
   - 加入 `<DarkModeToggle />`（右侧）
   - Avatar 区改为带 `DropdownMenu`（Settings + Logout），参考 inset-layout.tsx 的实现
   - 移动端 MoreVertical overflow menu 收纳（Language / Dark / Theme / Logout）
   - 保留 module Tab 区（水平滚动）

### 4.4 PASS 条件

- ✅ `pnpm build` 全绿
- ✅ `pnpm test` 274 tests 全绿
- ✅ `pnpm check:types` + `pnpm lint` + `pnpm lint:css` + `pnpm check:deps` 全绿
- ✅ **`pnpm -F @mb/ui-tokens check:theme` 全绿，且校验脚本已扩展到覆盖 W1 新增的全部 structural tokens**（见 §4.4.1）
- ✅ `apps/web-admin` 切到 `mix × classic`，视觉与重命名前对齐，**除以下三点**可见差异：
  - Sidebar 菜单项左侧多 icon 预留位（符合飞书/标准侧栏设计）
  - Sidebar expanded 宽度 15rem → 16rem、collapsed 宽度 3.125rem → 4rem（与 Inset 统一）
  - Header 补齐 search / dark / avatar 控件（与 Inset 体验对齐）
- ✅ localStorage 存旧 `mb_layout_preset='module-switcher'` 的用户，页面不崩，自动落到 inset

**测试覆盖说明**：当前 274 tests 主要覆盖 `ui-primitives` (197) + `ui-patterns` (55) + `api-sdk` (22)，**`app-shell/presets/mix/` 没有 unit test 覆盖**。W1 的行为正确性主要依赖 `apps/web-admin` 的肉眼视觉回归，自动化测试只保证"不破坏其他包"。

### 4.4.1 `check-theme-integrity.ts` 必须扩展（闭环 PASS）

当前脚本的 `componentRequired` 列表是硬编码（只管 `--button-*`/`--card-*`/`--sidebar-*`/`--header-*`/`--chart-*` 等现有 token）。W1 新增的以下 structural tokens **必须一并加入 `componentRequired`**，否则 feishu semantic 如果漏写覆盖，`check:theme` 仍会 PASS（false positive）：

```ts
// scripts/check-theme-integrity.ts 的 componentRequired 补丁
const componentRequired = [
  // ... 现有列表
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
];
```

脚本扩展后才能让 W3 的 PASS 条件真正证明"结构 token 正交"——Codex 对抗审查发现的 false positive 窟窿就此堵上。

---

## 5. W2 · Feishu Style（≈1.2 天）

### 5.1 Primitive 层修正（`primitive.css`）

#### 5.1.1 Blue 色板修正到 tailwind 标准（hue 240 → 259）+ 补 50/100

```css
/* 完整 10 阶，对齐 tailwind v4 官方 blue（hue 259, chroma ~0.214） */
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

**已知影响**：
- `semantic-classic.css` 的 `--color-info: var(--color-blue-500)` 视觉从"冷蓝 hue 240"变为"tailwind 正蓝 hue 259"（语义"中性提示"不变，颜色可感知偏正/偏紫一点）
- `shadcn-classic.md` 第 63 行的 blue 值记录需要同步更新数值
- 业务代码里 `.bg-blue-500` / `.text-blue-500` 等 utility 消费者会同步变化（已知：`e2e/notice.spec.ts` 有 `.bg-blue-500` 作为 selector，class 名不变所以选择器不受影响）

**决策依据**：上游杠杆定律——primitive 的"伪 blue"（hue 240）是历史债务，现在修正成本 = 3 处文档更新 + 1 处可感知视觉小变；拖到后面每加新 style 都要权衡"用旧 blue 还是新 sky"。

#### 5.1.2 字体栈补 PingFang SC（所有 style 共用）

```css
--font-sans: 'PingFang SC', 'Hiragino Sans GB', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
```

对 classic 是增益（中文下显示 PingFang 比 system-ui 更合适），非破坏变更。

### 5.2 Semantic 层（`semantic-feishu.css`）

结构照 `semantic-classic.css` 的模板（54 token × light/dark 两个 block）。关键映射：

#### 5.2.1 Light block

```css
[data-theme-style='feishu'] {
  /* ===== Surface ===== */
  --color-background: var(--color-white);
  --color-foreground: var(--color-gray-900);
  --color-card: var(--color-white);
  --color-card-foreground: var(--color-gray-900);
  --color-popover: var(--color-white);
  --color-popover-foreground: var(--color-gray-900);

  /* ===== Primary（飞书蓝）===== */
  --color-primary: var(--color-blue-500);
  --color-primary-foreground: var(--color-white);
  --color-secondary: var(--color-gray-100);
  --color-secondary-foreground: var(--color-gray-800);
  --color-accent: var(--color-blue-100);          /* 激活态浅蓝底（#e1ecff 附近） */
  --color-accent-foreground: var(--color-blue-700);

  /* ===== Muted ===== */
  --color-muted: var(--color-gray-50);
  --color-muted-foreground: var(--color-gray-500);

  /* ===== Status ===== */
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
  --color-sidebar: var(--color-gray-50);          /* #f5f6f7 */
  --color-sidebar-foreground: var(--color-gray-800);
  --color-sidebar-primary: var(--color-blue-500);
  --color-sidebar-primary-foreground: var(--color-white);
  --color-sidebar-accent: var(--color-blue-100);
  --color-sidebar-accent-foreground: var(--color-blue-700);
  --color-sidebar-border: var(--color-gray-200);
  --color-sidebar-ring: var(--color-blue-500);

  /* ... 其余 54 个核心 semantic token 全部齐全
   * 实施时**必须**对照 `ui-tokens/src/index.ts` 的 `TOKEN_NAMES` 逐项枚举，
   * 不允许用 "..." 省略——`check:theme` 会强制校验齐全性 */

  /* ===== W1 新增 structural tokens 的 feishu 覆写 ===== */
  --nav-tab-active-bg: color-mix(in oklch, var(--color-primary) 12%, transparent);
  --nav-tab-active-radius: var(--radius-md);
  --nav-tab-active-underline-width: 0;
  --sidebar-item-active-bg: var(--color-accent);
  --sidebar-item-active-fg: var(--color-accent-foreground);
  --sidebar-item-active-font-weight: 600;
  --card-shadow: none;                             /* 飞书整体扁平 */
  --button-shadow: none;
}
```

#### 5.2.2 Dark block

```css
[data-theme-style='feishu'][data-theme-color-mode='dark'] {
  /* 54 token 全部齐全，策略：
     - 背景反相到 gray-900 / gray-800
     - primary 保持 blue-400（稍提亮以保证深色下对比度）
     - accent 用 color-mix(blue-500, 20%) 保持浅蓝底感
     - 不追求 1:1 复刻飞书（飞书没深色），目标是"能用不崩"
  */
  ...
}
```

**完整 54 token 映射清单**：写实现时参考 `scripts/check-theme-integrity.ts` 里的 `TOKEN_NAMES`，按 classic 的结构逐一对位。

### 5.3 DESIGN.md（`src/styles/feishu.md`）

按 `shadcn-classic.md` 的 9 章样板（P1 已建立标准）：

1. 简介与参考
2. 色板映射表
3. Token 映射决策
4. 典型组件视觉示意
5. 结构特征（扁平、无阴影、浅蓝激活）
6. 字体与密度
7. 深色模式态度
8. 扩展性与混搭
9. 与 classic 的差异速查表

### 5.4 PASS 条件

- ✅ `pnpm -F @mb/ui-tokens check:theme`：2 style × 2 mode × 54 token = 216 个齐全，以 `classic.light` 为基准无缺少/多余
- ✅ `pnpm build` 全绿
- ✅ `feishu.md` 存在，9 章样板齐全

---

## 6. W3 · 组合验证（≈0.7 天）

### 6.1 注册入口改动

#### 6.1.1 `styles/index.css`（**critical，不改 feishu 不会加载**）

这是 web-admin + 两个 storybook 真正吃 token CSS 的总入口。必须加 feishu 的 @import：

```css
/* packages/ui-tokens/src/styles/index.css */
@import '../tokens/primitive.css';
@import '../tokens/semantic-classic.css';
@import '../tokens/semantic-feishu.css';   /* ← 新增这一行 */
@import '../tokens/component.css';
```

**导入顺序铁律**：`primitive → semantic-* → component`，保证 semantic 使用到的 primitive 变量已定义、component 使用到的 semantic 变量已定义。

#### 6.1.2 `packages/ui-tokens/src/style-registry.ts`（JS 注册）

在文件末尾 `styleRegistry.register({ id: 'classic', ... })` 之后追加：

```ts
// 注意：不要在 src/index.ts 里 import semantic-feishu.css —— CSS 入口走 styles/index.css
// registerStyle 公共 API 已内部化（commit 43528836），使用 styleRegistry.register() 直接注册
styleRegistry.register({
  id: 'feishu',
  displayName: '飞书',
  description: '对标飞书管理后台的品牌主题（扁平 + 浅蓝激活）',
  color: '#3370ff',
  cssFile: './tokens/semantic-feishu.css',
});
```

**签名说明**：`StyleMeta = { id, displayName, description, color, cssFile }`（5 字段；`displayNameLocalized` **不存在**，不要编造）。`displayName` 直接写中文，与 `classic` 的现状（'经典'）对齐；不做 i18n 分离（现状没有）。

#### 6.1.3 `apps/web-admin` 白名单

**`apps/web-admin/src/main.tsx`**（改）：
```ts
window.__MB_STYLE_IDS__ = ['classic', 'feishu'];
```

**`apps/web-admin/index.html`**（改）：
```html
<script>window.__MB_STYLE_IDS__ = ['classic', 'feishu'];</script>
```

#### 6.1.4 ThemeCustomizer 与 Storybook preview

- `ThemeCustomizer`（`app-shell/src/components/theme-customizer.tsx:147`）调用 `styleRegistry.getAll()`（**不是 `.list()`**——那是 LayoutRegistry 的方法，别搞混），**无需改动**
- Storybook preview 有两处：`client/packages/ui-primitives/.storybook/preview.tsx` + `client/packages/ui-patterns/.storybook/preview.tsx`。都调用 `styleRegistry.getAll()` 动态读列表，**无需改动**——只要 6.1.1 的 CSS 入口改了、6.1.2 的 `styleRegistry.register('feishu')` 在 `style-registry.ts` 里加了，两个 storybook 的 toolbar switcher 会自动出现"飞书"选项。

### 6.2 验证矩阵

| # | 组合 | 验证重点 |
|---|---|---|
| 1 | `classic × inset` | 跟 M1 Review Fix 后的 HEAD（`1309b1f4`）对比，像素级一致或仅 info 色可感知差异 |
| 2 | `classic × mix` | 除 "sidebar 预留 icon 位" + "info 色视觉" + "Header 补齐控件" 外一致 |
| 3 | `feishu × inset` | 新增合理（浮起卡片 + 飞书蓝 primary + 蓝底 accent），不求 1:1 飞书感 |
| 4 | `feishu × mix` | **核心目标**，对照 §6.3 清单 10 项全 ✅ |

### 6.3 `feishu × mix` 视觉关键点清单（10 项，全 ✅ 才 PASS）

对照飞书管理后台真实站：

```
□ Sidebar 菜单项：icon + 文字布局正确
□ Sidebar 激活子菜单：浅蓝整行底 + 蓝字加粗
□ Sidebar 折叠态：显示 icon（无 icon 时 fallback 为 FileText，与 Inset 一致）
□ 顶部 Tab 激活态：蓝色 pill（无下划线）
□ 顶部 Tab 非激活：灰字，hover 颜色微变
□ Header 高度/padding/搜索栏位置贴近飞书
□ Card / Table：无阴影扁平
□ Button primary：飞书蓝 (oklch(0.62 0.214 259) ≈ #3370ff)
□ 圆角：4-6px（radius-md = 0.5rem - 2px = 0.375rem = 6px）
□ 字体：PingFang SC（macOS 下能看到）
```

### 6.4 CI 全绿命令（按全局 rule `~/.claude/rules/verify-all-modes.md`）

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

### 6.5 PASS 条件

- ✅ 上述 10 项质量命令全绿
- ✅ 4 组合矩阵视觉回归（1 对齐现状 / 2-3 变化可控 / 4 清单 10 项全 ✅）
- ✅ 截图存到 `docs/handoff/feishu-style-visual-check.md`（作为 handoff 资料）

---

## 7. Known Limitations（本次不解决）

### 7.1 首屏闪烁

`apps/web-admin/index.html` 的 inline script 先于 module script 执行。用户 localStorage 存 `mb_style='feishu'` 时，首屏会先显示 classic，然后 React 挂载后闪变 feishu。

**成因**：feishu 的 `styleRegistry.register(...)` 是 `style-registry.ts` 被 import 时同步执行，但 import 发生在 module script 里，晚于 inline script。inline script 无法直接访问 `styleRegistry`（它是 ES module export，需要 `import`）。

**缓解**：inline script 改读 `window.__MB_STYLE_IDS__` 这份**静态白名单**（由 `main.tsx` 和 `index.html` 双维护），这样 inline script 能在 React 挂载前就判断 localStorage `mb_style` 值是否合法、并设置正确的 `data-theme-style`。但 CSS 文件的加载仍跟 module script 同批次，所以首屏仍会看到 `classic` 样式闪一下再切到 feishu。

**彻底修复**：M6 任务（runtime cssFile 加载 + inline 初始化脚本重构）。

### 7.2 `__MB_STYLE_IDS__` 双维护

每加一个 style 要在 `main.tsx` 和 `index.html` 两处都更新白名单。本次接受现状，M6 统一治理。

---

## 8. 独立问题记录（不本次做，新 ADR 讨论）

### 8.1 Mix Layout 的 shell 层越权

`mix-layout.tsx` 当前在主内容区（Hero 区）渲染"预设 label"和"模块名 H1"——这是**shell 层对业务 UI 的越权**。应该由业务页面通过 `heroSlot` 注入。

**本次决策**：仅 rename i18n key（`moduleSwitcher.*` → `mix.*`），保留结构。独立开 ADR 讨论 slot 化方案。

### 8.2 Mix Header 品牌名硬编码

`mix-layout.tsx` 有 `<div>Meta Build</div>` + `<LayoutGrid>` icon 硬编码品牌区。应该通过 `brandSlot` 或 `--brand-name` / `--brand-icon` token 驱动。

**本次决策**：不改，记在上面同一份 ADR。

---

## 9. ADR 关联

- **ADR-0016**（已有）：前端主题系统从 Theme 切换到 Style + ColorMode + Customizer
- **ADR-0017**（已有）：App Shell 从固定布局切换到 Layout Resolver + Preset Registry
- **ADR-0019**（待创建）：正交三层契约（Layout × Style × Component Token）的正式落地——应记录：
  - Mix rename 的决策
  - primitive blue 修正为 tailwind 标准的决策
  - "值类 + 结构类都走 CSS var" 的 token 表达策略
  - Mix shell 层越权（§8.1）和品牌硬编码（§8.2）的独立治理计划

---

## 10. 工作量估算

| Work | 内容 | 估算 |
|------|------|------|
| W1 | Mix Layout 改造（rename + 7 处 tsx 改动 + tokens 新增 + check-theme-integrity 扩展 + 7 处文档 rename 同步）| **1.5 天** |
| W2 | Feishu Style（primitive 修正 + semantic-feishu + DESIGN.md）| **1.2 天** |
| W3 | 组合验证（styles/index.css @import + 注册 + 白名单 + 4 组合肉眼回归 + CI 全绿 + 截图 handoff）| **0.7 天** |
| **合计** |  | **≈3.5 天** |

---

## 附录 A：命名决策记录

| 决策点 | 选择 | 理由 |
|---|---|---|
| Layout 新名 | `mix` | Ant Design Pro 术语；中性不绑品牌 |
| Nav Tab token 前缀 | `--nav-tab-*` | 贴语义；不跟 shadcn/radix/MUI 冲突；未来 Inset 加顶部 tab 也能复用 |
| Blue 色板 | 修正现有（不开 sky） | 上游杠杆定律 + 对齐 tailwind 标准 |
| Token 表达策略 | 值类 + 结构类都走 CSS var | JSX 保持静态；semantic-*.css 覆写单一来源；无 attr selector 特化 |
| Icon 兜底 | **与 Inset 一致用 `resolveMenuIcon` 的 `FileText` fallback**，不做首字母 fallback | `resolveMenuIcon` 永远返回组件（Codex 对抗审查发现），首字母三元是死代码 |
| Sidebar 宽度 | Mix 和 Inset **共用** `--sidebar-width` / `--sidebar-collapsed-width` | 消除 mix 内部 15rem / 3.125rem 硬编码；未来想分化可新开 `--sidebar-width-mix` |
| CSS 入口 | semantic-feishu.css 在 **`styles/index.css`** 里 @import，不在 `src/index.ts` 里 JS import | `styles/index.css` 是 web-admin + storybook 的真正 CSS 入口；JS 侧在 `style-registry.ts` 里 `styleRegistry.register(...)` 做 meta 登记 |
| localStorage key | Layout 用 `mb_layout_preset`（现状），Style 用 `mb_style`，ColorMode 用 `mb_color_mode` | 不是 `mb_layout`——事实为准 |
| 旧 id 兼容 | 不双写 | 项目零外部用户；自然回落已存在 |

## 附录 B：对抗审查纳入记录

本 spec 在落盘后经过两轮 review：

1. **Claude 自审**（brainstorming skill step 7）发现并修正 5 处：`StyleMeta` 签名编造、`resolveMenuIcon` 使用方式、CSS rule 位置歧义、`cssFile` 路径格式、`__MB_STYLE_IDS__` 缓解措辞。
2. **Codex 对抗性审查**（2026-04-17）发现 6 处 Claude 自审漏检：
   - 🔴 Icon fallback 死代码
   - 🔴 `check-theme-integrity` PASS false positive（未覆盖新增 structural tokens）
   - 🔴 CSS 入口遗漏（`styles/index.css` 未更新）
   - 🟡 localStorage key 错（`mb_layout` → `mb_layout_preset`）
   - 🟡 rename 改动面漏 7 处（package.json exports + 4 份 spec/ADR）
   - 🟡 `styleRegistry.list()` → `styleRegistry.getAll()`
   - 🟡 expanded sidebar 宽度未 token 化（15rem 硬编码）

全部已合并到本 spec。工作量从初版 2.5 天 → Claude 自审后 3 天 → Codex 对抗审查后 **3.5 天**，主要增量是 B 档改动面扩大 + C 档 PASS 条件收紧。
