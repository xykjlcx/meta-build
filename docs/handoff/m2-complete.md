# M2 完成交接文档

> **说明**：这是历史 milestone 快照，不是当前真相。当前前端状态以 `AGENTS.md`、`docs/specs/frontend/README.md`、`docs/handoff/frontend-gap-analysis.md` 为准。

> 新 session 开始前读这份文档，5 分钟内获得 M2 完整上下文。

---

## 当前状态

- **M2 已完成**，合并到 main（commit `80f8419`）
- L1 主题系统 + L2 原子组件库全部就绪
- 质量门禁全绿：`pnpm build` + `check:types` + `check:theme` + `test`（203 tests）+ `lint` + `lint:css`
- 分支干净，只有 main

## 已有的代码结构

### L1 `@mb/ui-tokens`（主题系统）

```
packages/ui-tokens/
├── src/
│   ├── index.ts              → TOKEN_NAMES（46 token 常量）+ 导出 registry/apply-theme
│   ├── theme-registry.ts     → 3 个主题注册（default/dark/compact），ThemeId 类型
│   ├── apply-theme.ts        → applyTheme() + loadTheme() + initTheme() + localStorage 持久化
│   ├── tailwind-theme.css    → @theme 块（Tailwind v4 CSS-first 方式映射 token）
│   └── themes/
│       ├── index.css         → @import 聚合 + data-theme 属性选择器切换
│       ├── default.css       → 默认主题（46 变量，浅色中性基调）
│       ├── dark.css          → 暗色主题（46 变量）
│       └── compact.css       → 高密度主题（46 变量，缩小间距/圆角）
├── scripts/
│   └── check-theme-integrity.ts  → 校验脚本：3 主题 × 46 变量完整性 + 命名规范
└── package.json              → exports: "." / "./tailwind-theme.css" / "./themes/*"
```

### L2 `@mb/ui-primitives`（原子组件库）

```
packages/ui-primitives/
├── src/
│   ├── index.ts              → barrel export（30 组件 + cn() 工具）
│   ├── lib/utils.ts          → cn() = clsx + tailwind-merge
│   ├── storybook.css         → Storybook 专用样式入口
│   ├── <component>.tsx       → 30 个组件源码
│   ├── <component>.test.tsx  → 31 个测试文件（含 1 个 i18n 隔离测试），203 tests
│   └── <component>.stories.tsx → 30 个 Storybook stories
├── .storybook/
│   ├── main.ts               → viteFinal 注入 @tailwindcss/vite（Storybook 8 + Tailwind v4）
│   └── preview.tsx            → 全局 theme decorator（工具栏切换 3 个主题预览）
└── package.json              → Radix UI + CVA + clsx + tailwind-merge + lucide-react
```

---

## M2 交付物清单

### L1：主题系统

| 交付物 | 数量/说明 |
|--------|----------|
| 主题文件 | 3 套（default / dark / compact） |
| 设计令牌 | 46 个（25 颜色 + 4 圆角 + 5 尺寸 + 4 阴影 + 5 动效 + 3 字体） |
| Theme Registry | `themeRegistry` 数组 + `ThemeId` / `ThemeMeta` 类型 |
| 运行时切换 | `applyTheme()` + `loadTheme()` + `initTheme()` + `isValidTheme()` |
| 完整性校验 | `check-theme-integrity.ts`（CI 硬失败，`pnpm check:theme`） |

### L2：30 个原子组件

| 分类 | 组件 |
|------|------|
| **输入类（11）** | Button, Input, Textarea, Label, Checkbox, RadioGroup, Switch, Slider, Select, Combobox, DatePicker |
| **反馈类（7）** | Dialog, AlertDialog, Drawer, Tooltip, Popover, Toast（+ useToast hook）, HoverCard |
| **导航类（5）** | Tabs, Breadcrumb, DropdownMenu, NavigationMenu, Command |
| **展示类（7）** | Card, Badge, Avatar, Separator, Skeleton, Accordion, Table |

**基础设施**：
- `cn()` 工具函数（clsx + tailwind-merge）
- Storybook 8 + 主题切换 decorator + a11y addon
- Vitest + @testing-library/react，**203 tests 全绿**（含 i18n 隔离测试）
- 每个组件均有对应的 `.stories.tsx` + `.test.tsx`

### web-admin 集成

- `main.tsx`：`initTheme()` 在 React 渲染前调用，避免主题闪烁
- `styles.css`：`@import "tailwindcss"` + `"tw-animate-css"` + L1 token/themes
- `package.json`：依赖 `@mb/ui-tokens` + `@mb/ui-primitives`（workspace:*）

### 质量门禁

| 检查 | 命令 | 状态 |
|------|------|------|
| 生产构建 | `pnpm build` | 全绿 |
| 类型检查 | `pnpm check:types` | 全绿 |
| 主题完整性 | `pnpm check:theme` | 全绿（3 主题 × 46 变量） |
| 单元测试 | `pnpm test` | 全绿（31 文件 / 203 tests） |
| Biome lint | `pnpm lint` | 全绿 |
| CSS lint | `pnpm lint:css` | 全绿 |

---

## 下一阶段：M3

### 目标
L3 业务组件 + L4 App Shell + TanStack Router 文件路由 + i18n 工程

### 具体任务

1. **L3 `@mb/ui-patterns`**（8 个业务复合组件）
   - NxTable / NxForm / NxFilter / NxDrawer / NxBar / NxLoading / ApiSelect / NxTree
   - 底层：TanStack Table v8 + React Hook Form + Zod + date-fns
   - 全部基于 L2 组件组合，不直接引用 Radix
   - 命名前缀 `Nx*`，零业务词汇，零内部 i18n

2. **L4 `@mb/app-shell`**（应用壳层）
   - 3 种布局预设：SidebarLayout / TopLayout / BasicLayout
   - Provider 树（6 层严格顺序）：ErrorBoundary → QueryClient → I18n → Theme → Router → Toast/Dialog
   - 认证门面：`useCurrentUser()`（读）+ `useAuth()`（写），对称后端双门面

3. **TanStack Router 文件路由**（L5 `web-admin` 中）
   - 类型安全路由 + 路由守卫
   - 菜单数据源 `useMenu()` hook

4. **i18n 工程**
   - react-i18next + TypeScript module augmentation 类型安全
   - 按层分布字典：L4 持 shell/common，L5 持业务 namespace
   - `pnpm check:i18n` CI 硬失败

5. **Storybook + Vitest 延伸**
   - L3 组件 3-5 个 story（默认 / 空 / loading / error / 批量）

### 关键 spec

| 文件 | 内容 |
|------|------|
| `docs/specs/frontend/04-ui-patterns.md` | L3 八大组件 props API + 隔离哲学 |
| `docs/specs/frontend/05-app-shell.md` | L4 布局/Provider/认证门面 + i18n 8 子决策 |
| `docs/specs/frontend/06-routing-and-data.md` | TanStack Router 文件路由 + Query |
| `docs/specs/frontend/07-menu-permission.md` | 菜单数据源 + 权限守卫 |
| `docs/specs/frontend/08-contract-client.md` | `@mb/api-sdk` 拦截器 |
| `docs/specs/frontend/10-quality-gates.md` | M3 阶段质量门禁 |

### M3 对 M2 的依赖

- L3 组件全部基于 L2 `@mb/ui-primitives` 组合（Button, Input, Dialog, Select, Table, Tabs 等）
- L4 ThemeProvider 消费 L1 `applyTheme()` + `themeRegistry`
- L4 布局组件使用 L1 尺寸 token（`--size-header-height` / `--size-sidebar-width`）
- 所有组件继续使用 `cn()` 工具函数

---

## M4 并行状态

- M4 在独立 worktree `../06-meta-build-m4` 中开发（纯后端）
- M3 和 M4 **零依赖**，可完全并行
- **M5 是汇合点**——需要 M3 的前端组件 + M4 的后端 API 都就绪后联调

---

## 关键技术决策备忘

| 决策 | 结论 | 备注 |
|------|------|------|
| Tailwind 版本 | **v4**（CSS-first，@theme 指令） | 没有 tailwind.config.js |
| 动画方案 | **tw-animate-css**（非 tailwindcss-animate） | Tailwind v4 兼容，纯 CSS 方案 |
| 主题切换机制 | `data-theme` 属性 + CSS 变量覆盖 | 非 class-based，非 media query |
| Storybook 8 + Tailwind v4 | `viteFinal` 注入 `@tailwindcss/vite` 插件 | Storybook 默认 Vite 不含 Tailwind 插件，必须手动注入 |
| React 19 ref 透传 | 直接在 props 上传 `ref`（ref-as-prop） | 不用 `forwardRef`，React 19 原生支持 |
| L2 i18n 隔离 | 组件零内部文案，所有文案通过 props 传入 | 有专门的 i18n 隔离测试守护 |
| `@import "tailwindcss"` 位置 | 只在 app 入口 CSS 和 Storybook CSS 中 | L1/L2 包不声明 tailwindcss 依赖 |
| 组件导出方式 | barrel export（`src/index.ts`） | 消费方 `import { Button } from '@mb/ui-primitives'` |

### M2 踩坑记录

- **Storybook + Tailwind v4**：Storybook 8 的 Vite 配置不会自动读取项目 vite.config.ts，必须在 `.storybook/main.ts` 的 `viteFinal` 中手动加 `@tailwindcss/vite` 插件
- **web-admin 跨包 import 类型错误**：`tsconfig.json` 设了 `rootDir: "src"` 导致 workspace 包的 .ts 源码被 tsc 拒绝，移除 `rootDir` 解决
- **Dialog a11y 警告**：Radix Dialog 要求 `DialogTitle` 存在，不需要可见标题时需包裹 `VisuallyHidden`

---

## 常用命令

```bash
# 前端开发
cd client && pnpm install                                 # 安装依赖
cd client && pnpm dev                                     # 启动 dev server（localhost:5173）
cd client && pnpm build                                   # 生产构建（含 tsc --noEmit）

# 测试
cd client && pnpm test                                    # L2 单元测试（203 tests）
cd client && pnpm -F @mb/ui-primitives test:watch         # 监听模式

# Storybook
cd client && pnpm storybook                               # 启动 Storybook（localhost:6006）
cd client && pnpm -F @mb/ui-primitives storybook:build    # 构建静态 Storybook

# 质量检查
cd client && pnpm check:types                             # TypeScript 类型检查（全包）
cd client && pnpm check:theme                             # 主题完整性校验（3×46）
cd client && pnpm lint                                    # Biome 代码检查
cd client && pnpm lint:css                                # Stylelint CSS 检查
cd client && pnpm check:env                               # 环境变量 .env.example 检查
cd client && pnpm check:deps                              # 依赖方向检查（dependency-cruiser）

# 全量验证（CI 等效）
cd client && pnpm build && pnpm test && pnpm check:theme && pnpm lint && pnpm lint:css

# 后端（不变，参考 M1 交接文档）
cd server && mvn verify                                   # 全量验证
cd server && mvn spring-boot:run -pl mb-admin             # 启动

# Docker
docker compose up -d                                      # PG(15432) + Redis(16379)
```
