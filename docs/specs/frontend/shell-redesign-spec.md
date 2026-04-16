# App Shell 重设计 — 设计规范

> **日期**：2026-04-16
> **状态**：待审核
> **范围**：L1 Token 重构 + L4 App Shell 布局注册表 + ThemeCustomizer
> **核心原则**：每个 preset 是一座孤岛，注册表只是码头，业务页面零感知。

---

## 一、目标

将 App Shell 从"一个固定布局"升级为**布局注册表 + 风格注册表 + 运行时定制面板**，使得：

1. 不同项目部署时可以通过切换预设开关，让整个界面大变样
2. 业务页面（订单管理、通知管理等）在任何布局下零修改地工作
3. 布局和风格是独立的两个维度，自由组合
4. 部署时只打包需要的 preset，未引入的不进 bundle

---

## 二、定制维度总览

| 维度 | 控件 | 实现机制 | 持久化 key |
|------|------|---------|-----------|
| **布局** | ToggleGroup | React Context（LayoutPresetProvider） | `mb_layout_preset` |
| **风格** | Select 下拉框 | React Context（StyleProvider）→ `<html data-style>` | `mb_style` |
| **色彩模式** | ToggleGroup | React Context（StyleProvider）→ `<html data-mode>` | `mb_color_mode` |
| **缩放** | ToggleGroup | `<body data-theme-scale>` → CSS 覆写 `--text-*` / `--spacing` | `mb_scale` |
| **圆角** | ToggleGroup | `<body data-theme-radius>` → CSS 覆写 `--radius` | `mb_radius` |
| **内容宽度** | ToggleGroup | `<body data-theme-content-layout>` → CSS 条件 container | `mb_content_layout` |
| **侧边栏模式** | ToggleGroup | shadcn Sidebar API（仅 Inset 布局可用） | `sidebar_state` cookie |

**两类机制**：
- **布局 + 风格 + 色彩模式** → React Context（影响组件树或 DOM 属性，需要 Provider）
- **缩放 / 圆角 / 内容宽度** → body data 属性 + CSS 属性选择器（零 React 重渲染）
- **侧边栏模式** → shadcn Sidebar 自带 API

---

## 三、布局注册表机制

### 3.1 类型定义

```ts
// layouts/types.ts

interface ShellLayoutProps {
  children: ReactNode          // 业务页面（Outlet）
  menuTree: MenuNode[]         // 完整菜单树（后端 API 返回）
  currentUser: CurrentUser     // 当前用户信息
  notificationSlot?: ReactNode // L5 注入的通知组件
}

interface LayoutPresetDef {
  id: string                                    // 'inset' | 'module-switcher'
  name: string                                  // i18n key: 'layout.inset'
  component: ComponentType<ShellLayoutProps>     // 布局组件
}
```

`ShellLayoutProps` 是注册表和布局组件之间的**唯一契约**。

### 3.2 注册表

```ts
// layouts/registry.ts

class LayoutRegistry {
  private presets = new Map<string, LayoutPresetDef>()
  private defaultId: string | null = null

  register(preset: LayoutPresetDef): void    // 第一个注册的自动成为默认值
  get(id: string): LayoutPresetDef           // 找不到时 fallback 到默认
  list(): LayoutPresetDef[]                  // ThemeCustomizer 的下拉列表用
  getDefaultId(): string
}

export const layoutRegistry = new LayoutRegistry()
```

与现有 ThemeRegistry（将变为 StyleRegistry）同构设计。

**容错**：`get()` 找不到时 fallback 到默认布局。对应"部署时只打包 1 套"的场景——localStorage 存了上次用的 preset ID，但该 preset 没被注册（没打包），自动降级。

### 3.3 LayoutPresetProvider + useLayoutPreset

使用 React Context（与 ThemeProvider 同构），包在 LayoutResolver 内部：

```ts
// layouts/layout-preset-provider.tsx

interface LayoutPresetContextValue {
  presetId: string
  setPreset: (id: string) => void
}

// 从 localStorage 读取初始值，切换时同步写入
// LayoutResolver 内部包裹此 Provider
```

### 3.4 LayoutResolver

```tsx
// layouts/layout-resolver.tsx
// _authed.tsx 唯一需要用的组件

function LayoutResolver({ children, notificationSlot }: Props) {
  const { presetId } = useLayoutPreset()
  const { data } = useMenu()
  const { data: currentUser } = useCurrentUser()
  const preset = layoutRegistry.get(presetId)
  const Layout = preset.component

  return (
    <Layout
      menuTree={data?.tree ?? []}
      currentUser={currentUser}
      notificationSlot={notificationSlot}
    >
      {children}
    </Layout>
  )
}
```

### 3.5 Preset 注册方式

```ts
// presets/inset/index.ts
import { layoutRegistry } from '../../registry'
import { InsetLayout } from './inset-layout'

layoutRegistry.register({
  id: 'inset',
  name: 'layout.inset',
  component: InsetLayout,
})
```

**import 即注册**：在 `_authed.tsx` 中 import preset 的 index.ts，注册自动发生。删掉 import 行，该 preset 就不打包（Vite tree-shaking）。

### 3.6 消费方（_authed.tsx）

```tsx
// 注册布局（import 即注册，顺序 = 默认优先级）
import '@mb/app-shell/layouts/presets/inset'
import '@mb/app-shell/layouts/presets/module-switcher'

import { LayoutResolver } from '@mb/app-shell/layouts'

function AuthedLayout() {
  useSseConnection()
  return (
    <LayoutResolver notificationSlot={<NotificationBadge ... />}>
      <SseHandlers />
      <Outlet />
    </LayoutResolver>
  )
}
```

### 3.7 Provider 树位置

```
GlobalErrorBoundary
└─ QueryClientProvider
   └─ I18nProvider
      └─ StyleProvider          ← 替代 ThemeProvider，在 Router 之上（登录页也需要）
         └─ RouterProvider
            ├─ /auth/login → BasicLayout（保留）
            └─ /_authed → AuthedLayout
               └─ LayoutResolver（内含 LayoutPresetProvider）
                  └─ InsetLayout 或 ModuleSwitcherLayout
                     └─ {children} (Outlet)
```

### 3.8 数据流

```
localStorage (mb_layout_preset)
      │ 读/写
      ▼
useLayoutPreset() ──────────────────┐
      │                             │
      ▼                             ▼
LayoutResolver              ThemeCustomizer
  registry.get(id)           registry.list()
  → render Layout            → 布局切换 UI
      │
   ┌──┴──┐
   ▼     ▼
Inset   ModuleSwitcher
（孤岛）  （孤岛）
```

---

## 四、L1 Token 重构

### 4.1 概念模型变化

**现在**：3 个 "theme" 平铺（default / dark / compact），dark 不是风格而是色彩模式，compact 不是风格而是缩放。

**重构后**：

- **StyleRegistry**（替代 ThemeRegistry）：N 个风格预设（classic / ocean / forest / ...），每个风格同时定义 light 和 dark 两套色值
- **ColorMode**：独立维度（light / dark），任何风格都支持
- **compact**：删除，归入 Scale XS

### 4.2 StyleRegistry

```ts
// ui-tokens/src/style-registry.ts

interface StylePresetDef {
  id: string          // 'classic' | 'ocean' | 'forest' | ...
  name: string        // i18n key: 'style.classic'
  color: string       // 彩色圆点颜色（Select 下拉框标识用）
  cssFile: string     // CSS 文件路径（构建时参考）
}

class StyleRegistry {
  register(style: StylePresetDef): void
  get(id: string): StylePresetDef
  list(): StylePresetDef[]
  getDefaultId(): string
}

export const styleRegistry = new StyleRegistry()
```

### 4.3 风格 CSS 文件结构

```
ui-tokens/src/
├── tailwind-theme.css    ← @theme 默认值（= classic light）
├── customizer.css        ← Scale/Radius data 属性规则
└── styles/
    ├── index.css          ← @import all
    ├── classic.css        ← light + dark 两套色值
    ├── ocean.css          ← light + dark（预留，v1 先做 classic）
    └── ...
```

**单个风格文件结构**：

```css
/* classic.css */

/* ===== Light ===== */
[data-style='classic'] {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... 33 个颜色 token ... */
}

/* ===== Dark ===== */
[data-style='classic'][data-mode='dark'] {
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  /* ... 33 个颜色 token ... */
}
```

**选择器位置**：`data-style` 和 `data-mode` 放在 `<html>` 上。

### 4.4 StyleProvider（替代 ThemeProvider）

```ts
// app-shell/src/theme/style-provider.tsx

type ColorMode = 'light' | 'dark'

interface StyleContextValue {
  styleId: string
  setStyle: (id: string) => void
  colorMode: ColorMode
  setColorMode: (m: ColorMode) => void
}

// 切换时操作 DOM：
function applyStyleAndMode(styleId: string, mode: ColorMode) {
  const el = document.documentElement
  el.setAttribute('data-style', styleId)
  mode === 'dark'
    ? el.setAttribute('data-mode', 'dark')
    : el.removeAttribute('data-mode')
}

// localStorage keys: mb_style / mb_color_mode
```

### 4.5 Tailwind dark: 兼容（I2 修正）

```css
/* styles.css — 在 @import 之后加一行 */
@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *));
```

让 Tailwind 的 `dark:` 前缀匹配 `data-mode="dark"`，shadcn 组件源码里的 `dark:xxx` class 正常工作。

### 4.6 Radius 迁移（C1 修正）

**现在**：四个独立 token，Customizer 改 `--radius` 不会生效。

```css
/* 现在 */
@theme {
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

**迁移后**：单值 `--radius` + calc 派生，改一个值全局联动。

```css
/* 迁移后 */
@theme {
  --radius: 0.625rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

**L2/L3 组件零改动**——它们用的是 Tailwind 的 `rounded-sm/md/lg/xl`，映射关系不变。

### 4.7 Compact 迁移说明

删除 compact.css 后，旧 compact 行为的等效配置：

| compact 原有效果 | 新系统等效 |
|-----------------|----------|
| 小字号 + 小间距 | Scale XS |
| 小圆角（`--radius-lg: 0.5rem`） | Radius SM |

旧 compact ≈ Scale XS + Radius SM。需在迁移文档中记录。

### 4.8 CSS 属性选择器规则（customizer.css）

```css
/* Scale */
[data-theme-scale=xs] {
  --text-lg: 1.05rem;
  --text-base: .85rem;
  --text-sm: .75rem;
  --spacing: .222222rem;
}
[data-theme-scale=lg] {
  --text-lg: 1.55rem;
  --text-base: 1.35rem;
  --text-sm: 1rem;
  --spacing: .262222rem;
}

/* Radius */
[data-theme-radius=none] { --radius: 0rem }
[data-theme-radius=sm]   { --radius: .3rem }
/* 'default' 不需要规则——移除 data 属性回到 @theme 默认值 */
[data-theme-radius=lg]   { --radius: 1rem }
[data-theme-radius=xl]   { --radius: 1.5rem }
```

---

## 五、ThemeCustomizer 面板

### 5.1 UI 结构

触发方式：Header 右侧齿轮图标 → DropdownMenu（参考 shadcnuikit Customizer 面板）。

| 维度 | 控件 | 说明 |
|------|------|------|
| 风格 | **Select 下拉框**（每项带彩色圆点） | 从 styleRegistry.list() 动态获取 |
| 缩放 | ToggleGroup（XS / 默认 / LG） | |
| 圆角 | ToggleGroup（⊘ / SM / MD / LG / XL） | |
| 色彩模式 | ToggleGroup（Light / Dark） | |
| 内容宽度 | ToggleGroup（全宽 / 居中） | |
| 布局 | ToggleGroup | 从 layoutRegistry.list() 动态获取，仅注册 2+ 种时显示 |
| 侧边栏模式 | ToggleGroup（展开 / 图标） | 运行时检测 SidebarProvider 是否存在，有则渲染，无则隐藏 |
| 重置为默认值 | Button | 重置 Scale/Radius/ContentLayout，不重置布局/风格/色彩模式 |

### 5.2 状态管理

```ts
// customizer/use-customizer-settings.ts

type ScaleValue = 'default' | 'xs' | 'lg'
type RadiusValue = 'default' | 'none' | 'sm' | 'md' | 'lg' | 'xl'
type ContentLayoutValue = 'full' | 'centered'

interface CustomizerSettings {
  scale: ScaleValue
  radius: RadiusValue
  contentLayout: ContentLayoutValue
}

// update() 同时做三件事：
// 1. setState（面板 UI 高亮）
// 2. applyToBody（body data 属性，CSS 立刻响应）
// 3. persistToLocalStorage
```

CSS 维度（Scale/Radius/ContentLayout）走 body data 属性 + CSS 覆写，**不走 React Context**——消费方是 CSS，不是 React 组件，零重渲染。

### 5.3 ThemeSwitcher 废弃

主题切换合并进 Customizer 面板的"风格"维度。`components/theme-switcher.tsx` 删除。

### 5.4 防闪烁

index.html 内联脚本，在 React mount 之前读 localStorage 设置 DOM 属性：

```html
<script>
  ;(function() {
    var el = document.documentElement
    var style = localStorage.getItem('mb_style') || 'classic'
    var mode = localStorage.getItem('mb_color_mode')
    el.setAttribute('data-style', style)
    if (mode === 'dark') el.setAttribute('data-mode', 'dark')

    var b = document.body
    var s = localStorage.getItem('mb_scale')
    var r = localStorage.getItem('mb_radius')
    var c = localStorage.getItem('mb_content_layout')
    if (s && s !== 'default') b.setAttribute('data-theme-scale', s)
    if (r && r !== 'default') b.setAttribute('data-theme-radius', r)
    if (c) b.setAttribute('data-theme-content-layout', c)
  })()
</script>
```

---

## 六、Inset Layout Preset

### 6.1 视觉特征

- Sidebar wrapper（`bg-sidebar`）铺底 + 内容区浮起圆角白卡片
- 毛玻璃 Top Bar（`bg-background/40` + `backdrop-blur-md` + `sticky top-0`）
- 内容区 `bg-muted/40` 微灰底，衬托白色 Card 层次感
- Sidebar 折叠：256px → 48px 图标模式
- Mobile < 1024px：Sidebar 自动转 Sheet（shadcn 内置）

### 6.2 组件结构

```tsx
function InsetLayout({ children, menuTree, currentUser, notificationSlot }: ShellLayoutProps) {
  return (
    <SidebarProvider>
      <InsetSidebar menuTree={menuTree} currentUser={currentUser} />
      <SidebarInset>
        <InsetHeader notificationSlot={notificationSlot} />
        <div className="bg-muted/40 flex flex-1 flex-col">
          <main className="flex-1 p-4 ...">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### 6.3 文件清单

```
presets/inset/
├── index.ts              ← layoutRegistry.register()
├── inset-layout.tsx      ← SidebarProvider + Sidebar(variant=inset) + SidebarInset
├── inset-sidebar.tsx     ← 完整菜单树递归渲染 + SidebarHeader/Content/Footer/Rail
└── inset-header.tsx      ← sticky + 毛玻璃 + SidebarTrigger + Breadcrumb + 工具栏
```

### 6.4 菜单渲染

- depth 0 → `SidebarGroup` + `SidebarGroupLabel`
- depth 1+ → `SidebarMenuItem` + `SidebarMenuButton`
- `DIRECTORY` → `Collapsible` + `SidebarMenuSub`
- `MENU` → 渲染为菜单项（本次不做路由导航，保持纯展示）
- `BUTTON` → 不渲染

### 6.5 关键依赖

shadcn 官方 Sidebar 组件（`variant="inset"`, `collapsible="icon"`），需先安装到 L2。

---

## 七、Module Switcher Layout Preset

### 7.1 视觉特征

- 全宽白色 Header 通栏 + 模块切换 Tab
- Sidebar 在 Header 下方，只显示当前模块的子菜单
- 扁平视觉，Sidebar 和内容区同色背景（`#f2f3f5`），border 分割
- Sidebar 折叠：240px → 50px 图标模式
- 底部"收起导航"按钮

### 7.2 组件结构

```tsx
function ModuleSwitcherLayout({ children, menuTree, currentUser, notificationSlot }: ShellLayoutProps) {
  const modules = menuTree.filter(n => n.menuType !== 'BUTTON')
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id)
  const activeModule = modules.find(m => m.id === activeModuleId)
  const sidebarMenu = activeModule?.children ?? []

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader
        modules={modules}
        activeModuleId={activeModuleId}
        onModuleChange={setActiveModuleId}
        notificationSlot={notificationSlot}
      />
      <div className="flex flex-1">
        <ModuleSidebar menuTree={sidebarMenu} currentUser={currentUser} />
        <main className="flex-1 p-4 ...">{children}</main>
      </div>
    </div>
  )
}
```

### 7.3 文件清单

```
presets/module-switcher/
├── index.ts                    ← layoutRegistry.register()
├── module-switcher-layout.tsx  ← 主组件 + 模块切换状态
├── global-header.tsx           ← 全宽通栏 + Logo + ModuleTabs + Search + 工具栏
├── module-tabs.tsx             ← depth 0 菜单 → Tab + 激活态
└── module-sidebar.tsx          ← 当前模块子菜单 + 折叠 + 用户信息
```

### 7.4 模块切换

- depth 0 菜单节点 → Header Tab
- 点击 Tab → `setActiveModuleId` → Sidebar 菜单完全替换为该模块的 children
- 当前激活 Tab：蓝色文字 + 底部 2px 蓝线
- **本次不做自动路由导航**（依赖 MenuNode.path，推迟解决）

### 7.5 不使用 shadcn Sidebar

Module Switcher 的 Sidebar 不基于 shadcn 官方 Sidebar 组件——它不需要 SidebarProvider / variant / SidebarInset 等机制，用自定义的简单 `<aside>` + 状态管理即可。

---

## 八、两个 Preset 的隔离边界

| 维度 | Inset | Module Switcher | 共享？ |
|------|-------|-----------------|--------|
| shadcn Sidebar | ✅ 使用 | ❌ 不使用 | 否 |
| SidebarProvider | ✅ 需要 | ❌ 不需要 | 否 |
| Header 位置 | SidebarInset 内部 | 最顶层 | 否 |
| Header 样式 | 毛玻璃 + sticky + 圆角 | 纯白 + border-bottom | 否 |
| 菜单消费 | 完整树 → Sidebar | depth 0 → Tab, depth 1+ → Sidebar | 否 |
| Mobile | Sheet（shadcn 内置） | Sidebar 折叠/隐藏（自行实现） | 否 |
| 数据（menu/user） | 通过 props 接收 | 通过 props 接收 | 是（LayoutResolver 注入） |
| ThemeCustomizer | 各自 Header 内渲染 | 各自 Header 内渲染 | 同一个组件，各自 import |

**ThemeCustomizer** 放在 `app-shell/src/customizer/`（公共位置），两个 preset 都可以 import。这不违反孤岛原则——Customizer 是基础设施（像 useMenu、useAuth 一样），不是某个 preset 的内部组件。

---

## 九、完整文件改动清单

### L1 @mb/ui-tokens

| 文件 | 动作 | 说明 |
|------|------|------|
| `tailwind-theme.css` | 改 | Radius 单值派生 |
| `customizer.css` | 新建 | Scale/Radius data 属性选择器规则 |
| `styles/classic.css` | 新建 | 从 default.css + dark.css 合并 |
| `styles/index.css` | 新建 | @import all |
| `themes/default.css` | 删 | 合并到 styles/classic.css |
| `themes/dark.css` | 删 | 合并到 styles/classic.css |
| `themes/compact.css` | 删 | 归入 Scale XS |
| `themes/index.css` | 删 | 被 styles/index.css 替代 |
| `src/index.ts` | 改 | TOKEN_NAMES 新增 radius 基准值 |
| `src/theme-registry.ts` | 删 | 被 style-registry.ts 替代 |
| `src/style-registry.ts` | 新建 | StylePresetDef + StyleRegistry |

### L2 @mb/ui-primitives

| 文件 | 动作 | 说明 |
|------|------|------|
| `sheet.tsx` | 新建 | shadcn CLI 安装 |
| `sidebar.tsx` | 新建 | shadcn CLI 安装 |
| `toggle.tsx` | 新建 | shadcn CLI 安装 |
| `toggle-group.tsx` | 新建 | shadcn CLI 安装 |

### L4 @mb/app-shell

| 文件 | 动作 | 说明 |
|------|------|------|
| **layouts/** | | |
| `layouts/types.ts` | 新建 | ShellLayoutProps + LayoutPresetDef |
| `layouts/registry.ts` | 新建 | LayoutRegistry class + 单例 |
| `layouts/layout-preset-provider.tsx` | 新建 | Context + Provider + useLayoutPreset |
| `layouts/layout-resolver.tsx` | 新建 | 从注册表取组件 + 注入 props + 包 Provider |
| `layouts/index.ts` | 改 | 导出 LayoutResolver + useLayoutPreset + registry |
| **presets/inset/** | | |
| `presets/inset/index.ts` | 新建 | layoutRegistry.register() |
| `presets/inset/inset-layout.tsx` | 新建 | SidebarProvider + Sidebar(inset) + SidebarInset |
| `presets/inset/inset-sidebar.tsx` | 新建 | 完整菜单树递归渲染 |
| `presets/inset/inset-header.tsx` | 新建 | sticky + 毛玻璃 + 工具栏 |
| **presets/module-switcher/** | | |
| `presets/module-switcher/index.ts` | 新建 | layoutRegistry.register() |
| `presets/module-switcher/module-switcher-layout.tsx` | 新建 | GlobalHeader + Sidebar + 模块切换 |
| `presets/module-switcher/global-header.tsx` | 新建 | 全宽通栏 |
| `presets/module-switcher/module-tabs.tsx` | 新建 | depth 0 → Tab |
| `presets/module-switcher/module-sidebar.tsx` | 新建 | 当前模块子菜单 |
| **customizer/** | | |
| `customizer/types.ts` | 新建 | ScaleValue / RadiusValue / ContentLayoutValue |
| `customizer/use-customizer-settings.ts` | 新建 | 状态 + body 属性同步 + localStorage |
| `customizer/theme-customizer.tsx` | 新建 | DropdownMenu 面板 |
| `customizer/init-customizer.ts` | 新建 | 防闪烁初始化 |
| **theme/** | | |
| `theme/style-provider.tsx` | 新建 | 替代 ThemeProvider |
| `theme/use-style.ts` | 新建 | 替代 useTheme |
| `theme/theme-provider.tsx` | 删 | 被 style-provider 替代 |
| `theme/use-theme.ts` | 删 | 被 use-style 替代 |
| **废弃文件** | | |
| `components/theme-switcher.tsx` | 删 | 合并进 ThemeCustomizer |
| `components/sidebar.tsx` | 删 | 被各 preset 内的 sidebar 替代 |
| `components/header.tsx` | 删 | 被各 preset 内的 header 替代 |
| `layouts/sidebar-layout.tsx` | 删 | 被 LayoutResolver + presets 替代 |
| `layouts/top-layout.tsx` | 删 | 未使用，删除 |

### L5 web-admin

| 文件 | 动作 | 说明 |
|------|------|------|
| `src/routes/_authed.tsx` | 改 | SidebarLayout → LayoutResolver + preset import |
| `src/styles.css` | 改 | import 路径更新 + @custom-variant dark + @import customizer.css |
| `index.html` | 改 | body 内联防闪烁脚本 |

### 质量脚本 + i18n

| 文件 | 动作 | 说明 |
|------|------|------|
| `scripts/check-theme.ts` | 改 | 适配 StyleRegistry |
| `i18n/zh-CN/shell.json` | 改 | 新增 customizer.* / layout.* / style.* 文案 |
| `i18n/en-US/shell.json` | 改 | 同上英文版 |

### 统计

- 新建：~25 文件
- 删除：~10 文件
- 修改：~7 文件
- **L2/L3 组件改动：0**

---

## 十、实施顺序

| Phase | 内容 | 前置依赖 | 验证 |
|-------|------|---------|------|
| **1** | L1 基础层重构：Radius 单值迁移 + styles/ 文件重组 + StyleRegistry + customizer.css + @custom-variant dark | 无 | pnpm build + check-theme + 现有测试全过 |
| **2** | L2 组件安装（Sheet/Sidebar/Toggle/ToggleGroup）+ L4 注册表机制（registry + types + Provider + Resolver）+ StyleProvider 替代 ThemeProvider | Phase 1 | pnpm build + 类型检查 |
| **3** | Inset Layout Preset + 注册 + _authed.tsx 切换到 LayoutResolver + 删除旧 sidebar-layout/sidebar/header | Phase 2 | pnpm dev，Inset 布局正常 + 折叠 + Mobile Sheet |
| **4** | Module Switcher Layout Preset + 注册 + 模块 Tab + 动态 Sidebar | Phase 2 | 切换到 Module Switcher，Tab 切换 + Sidebar 动态加载 |
| **5** | ThemeCustomizer 面板 + 删除旧 ThemeSwitcher + index.html 防闪烁 + i18n | Phase 3+4 | 面板所有维度可切换，刷新后设置保持 |
| **6** | 收尾：清理废弃文件 + check-theme 适配 + 导出体系更新 + 全量验证 | Phase 5 | CI 等效全量检查（12 项） |

**Phase 3 和 Phase 4 可以并行**——两个布局 preset 在不同子文件夹，零文件交叉。Phase 2 先建立 LayoutResolver 骨架，Phase 3/4 各自往 presets/ 下加文件夹。

---

## 十一、已知限制

1. **菜单不导航**：MenuNode 没有 path 字段，所有布局的菜单项暂时纯展示，不做路由跳转。Module Switcher 的 Tab 切换只更新 Sidebar 内容，不自动导航。path 字段作为独立增强单独排期。
2. **v1 只做 classic 风格**：StyleRegistry 机制就位，但 v1 只注册 classic 一个风格（从现有 default + dark 合并）。ocean / forest 等新风格推迟。
3. **Sidebar mode 控件**：ThemeCustomizer 中的侧边栏模式切换，运行时检测 SidebarProvider 是否存在。Inset 布局下可用，Module Switcher 下隐藏。

---

## 十二、明确不改的

| 层级 | 原因 |
|------|------|
| L2 ui-primitives 现有组件 | 消费 Tailwind class / CSS 变量，不感知布局或风格切换 |
| L3 ui-patterns | NxTable/NxForm 等业务组件，不感知 Shell 层变化 |
| L4 auth / menu / i18n / sse / error / feedback / data | 纯逻辑模块，与布局/主题无关 |
| L5 业务页面 | 是 Layout 的 children，不知道自己被哪个壳包裹 |
| 后端 | 菜单 API 不变 |
| api-sdk | HTTP 层，与 UI 无关 |
