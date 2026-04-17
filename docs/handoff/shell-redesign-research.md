# App Shell 骨架层重设计 — 调研报告

> **调研日期**：2026-04-16
> **调研范围**：shadcnuikit.com 模板技术逆向 + shadcn/ui 官方文档 + 社区最佳实践 + meta-build 现状深度分析
> **目标**：用 shadcnuikit 的骨架风格（inset 布局 + 毛玻璃 Top Bar + 卡片化内容区 + 运行时 Theme Customizer）重构 meta-build 的 App Shell 层。

---

## 一、shadcnuikit 模板骨架层完整拆解

### 1.1 整体布局架构（variant="inset"）

使用 shadcn/ui 官方 Sidebar 组件的 **`variant="inset"`** 模式：

```
┌───────────────────────────────────────────────────────┐
│ sidebar-wrapper (bg-sidebar, min-h-svh, 满屏铺底)       │
│ ┌────────────┬──────────────────────────────────────┐ │
│ │            │  SidebarInset (白色圆角大卡片)         │ │
│ │  Sidebar   │  margin: 8px 8px 8px 0               │ │
│ │  256px     │  rounded-xl (12px)                    │ │
│ │  bg-sidebar│  shadow-sm                            │ │
│ │  无边框     │  ┌─ Top Bar ───────────────────────┐ │ │
│ │            │  │ sticky + 毛玻璃 + 顶部圆角       │ │ │
│ │            │  ├─────────────────────────────────┤ │ │
│ │            │  │ content area (bg-muted/40)      │ │ │
│ │            │  │  ┌─card─┐ ┌─card─┐ ┌─card─┐   │ │ │
│ │            │  │  │      │ │      │ │      │   │ │ │
│ │            │  │  └──────┘ └──────┘ └──────┘   │ │ │
│ │            │  └─────────────────────────────────┘ │ │
│ └────────────┴──────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

DOM 结构与关键 class：

```html
<!-- sidebar-wrapper -->
<div class="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full">

  <!-- Sidebar（data-variant="inset", data-side="left"） -->
  <div data-slot="sidebar" data-state="expanded" data-variant="inset" data-side="left">
    <div data-slot="sidebar-inner" class="bg-sidebar flex h-full w-full flex-col">
      <!-- inset 模式下无边框无圆角，与 wrapper 背景融为一体 -->
    </div>
  </div>

  <!-- SidebarInset（main 内容区） -->
  <main class="bg-background relative flex w-full flex-1 flex-col
    md:peer-data-[variant=inset]:m-2
    md:peer-data-[variant=inset]:ml-0
    md:peer-data-[variant=inset]:rounded-xl
    md:peer-data-[variant=inset]:shadow-sm
    md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2">

    <!-- Top Bar（毛玻璃） -->
    <header class="bg-background/40 sticky top-0 z-50 ... backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl">
    </header>

    <!-- Content Area -->
    <div class="bg-muted/40 flex flex-1 flex-col">
    </div>

  </main>
</div>
```

### 1.2 半透明毛玻璃 Top Bar

模板最具辨识度的视觉特征：

```css
header {
  background: bg-background/40;     /* 40% 透明度（白/黑取决于 light/dark） */
  backdrop-filter: blur(12px);       /* 毛玻璃模糊 */
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
  height: 56px;
  border-radius: 12px 12px 0 0;     /* 顶部圆角与 SidebarInset 齐平 */
}
```

> **社区对比**：shadcn-admin（11.8k stars）等主流开源模板都用 `bg-background` 纯色 + `border-b`，**不用** glassmorphism。毛玻璃是 shadcnuikit 的差异化卖点，不是社区标准。对 B 端系统是加分项但非必须。

### 1.3 卡片语言

```css
.card {
  background: var(--card);           /* 白/近黑 */
  border-radius: 12px;               /* rounded-xl */
  border: 1px solid var(--border);   /* 细边框，无阴影 */
  box-shadow: none;
  padding: 24px 0;                   /* py-6 */
}
```

设计哲学：**扁平 + 细边框 + 微透明底色分层**。Card 与内容区的对比来自 `bg-muted/40` 底色衬托白色 Card。

### 1.4 Sidebar 折叠交互

| 状态 | data-state | data-collapsible | 宽度 |
|------|-----------|-----------------|------|
| 展开 | `expanded` | `""` | 256px |
| 折叠(icon) | `collapsed` | `icon` | 64px |

折叠后子元素行为通过 `group-data-[collapsible=icon]:` 前缀控制：
- 菜单按钮：`size-8! p-2!`
- 分组标签：`-mt-8 opacity-0`（隐藏但保留空间）
- 内容区：`overflow-hidden`

### 1.5 响应式三形态

| 视口宽度 | Sidebar | Top Bar |
|----------|---------|---------|
| >= 1024px (lg) | 展开 256px | 完整：Search + 所有按钮 |
| 768px (md) | Icon 64px | Search 缩为图标 |
| < 768px (sm) | 隐藏，点击弹出 Sheet（`data-mobile="true"`, 288px, fixed z-50） | 仅图标按钮 |

### 1.6 CSS 变量完整体系

#### 色阶架构（11 级灰度 + 语义引用）

```css
:root {
  /* 基础色阶 */
  --base-50: #fafafb;  --base-100: #f4f4f6;  --base-200: #e4e4e8;
  --base-300: #d4d4da;  --base-400: #9f9fa7;  --base-500: #71717b;
  --base-600: #52525b;  --base-700: #3f3f46;  --base-800: #27272b;
  --base-900: #18181b;  --base-950: #09090b;  --base-1000: #030303;

  /* 语义色 — 引用色阶 */
  --background: var(--color-white);
  --foreground: var(--base-800);
  --card: var(--color-white);
  --primary: var(--base-950);
  --muted: var(--color-neutral-100);
  --accent: var(--base-200);
  --border: var(--base-200);

  /* Sidebar */
  --sidebar: var(--base-100);
  --sidebar-foreground: var(--base-500);
  --sidebar-primary: var(--base-950);
  --sidebar-accent: var(--base-200);

  /* 布局 */
  --radius: .5rem;
  --spacing: .25rem;
}

.dark {
  --background: var(--base-950);
  --foreground: var(--base-200);
  --primary: var(--base-50);
  --border: var(--base-800);
  --sidebar: var(--base-900);
  --sidebar-foreground: var(--base-200);
  /* ... */
}
```

**关键洞察**：模板用色阶（`--base-50` ~ `--base-1000`）作为底层，语义色引用色阶。Theme Preset 就是替换这套色阶。这比 meta-build 现在的直接定义每个语义色值更有层次。

---

## 二、运行时 Theme Customizer 完整逆向

### 2.1 面板结构

触发方式：Top Bar 右侧调色盘图标 → Radix DropdownMenu（`role="menu"`, `data-side="bottom"`, `data-align="end"`）

6 个配置维度：

| 维度 | 控件 | 可选值 | data 属性位置 |
|------|------|--------|--------------|
| **Theme preset** | Select(combobox) | Default / Underground / Rose Garden / Lake View / Sunset Glow / Forest Whisper / Ocean Breeze / Lavender Dream | `<body data-theme-preset="xxx">` |
| **Scale** | ToggleGroup | ⊘(默认) / XS / LG | `<body data-theme-scale="sm\|lg">` |
| **Radius** | ToggleGroup | ⊘ / SM / MD / LG / XL | `<body data-theme-radius="none\|sm\|md\|lg\|xl">` |
| **Color mode** | ToggleGroup | Light / Dark | `<html class="dark">` |
| **Content layout** | ToggleGroup | Full / Centered | `<body data-theme-content-layout="full\|centered">` |
| **Sidebar mode** | ToggleGroup | Default / Icon | 直接操作 sidebar `data-collapsible` |

> **注意**：Content layout 和 Sidebar mode 在 `<768px` 下被 `hidden lg:flex` 隐藏。

### 2.2 技术实现模式

**核心模式**：`<body>` data 属性 → CSS 属性选择器覆写 CSS 变量 → Tailwind 工具类消费变量

```
用户点击 → JS 修改 <body data-theme-xxx="yyy">
                      ↓
              CSS: [data-theme-xxx=yyy] { --var: value }
                      ↓
              Tailwind: rounded-md → calc(var(--radius) - 2px)
                      ↓
              所有组件同步更新
```

### 2.3 Scale 实现（覆写 `--text-*` 和 `--spacing`）

**不是 CSS `scale()` 变换，也不是 `--scaling` 乘数**。是直接覆写 Tailwind v4 的文本和间距变量：

```css
[data-theme-scale=sm] {
  --text-lg: 1.05rem;     /* 默认 1.125rem，缩小 7% */
  --text-base: .85rem;    /* 默认 1rem，缩小 15% */
  --text-sm: .75rem;      /* 默认 .875rem，缩小 14% */
  --spacing: .222222rem;  /* 默认 .25rem，缩小 11% */
}
[data-theme-scale=lg] {
  --text-lg: 1.55rem;     /* 放大 38% */
  --text-base: 1.35rem;   /* 放大 35% */
  --text-sm: 1rem;        /* 放大 14% */
  --spacing: .262222rem;  /* 放大 5% */
}
```

Tailwind v4 中 `text-sm`、`text-base`、`p-4`（= `calc(var(--spacing) * 4)`）等工具类直接引用这些变量，所以改变量就改了全局。

> **重要发现**：shadcn/ui 官方**没有 `--scaling` 变量**。Scale 是 shadcnuikit 自己用覆写 Tailwind v4 变量的方式实现的。这意味着实现 Scale 不需要改组件源码，只需要加 CSS 规则。

### 2.4 Radius 映射

```css
[data-theme-radius=none] { --radius: 0rem }
[data-theme-radius=sm]   { --radius: .3rem }
[data-theme-radius=md]   { --radius: .5rem }   /* 默认 */
[data-theme-radius=lg]   { --radius: 1rem }
[data-theme-radius=xl]   { --radius: 1.5rem }
```

Tailwind v4 中 `rounded-*` 基于 `--radius` 派生：
- `rounded-sm` = `calc(var(--radius) - 4px)`
- `rounded-md` = `calc(var(--radius) - 2px)`
- `rounded-lg` = `var(--radius)`
- `rounded-xl` = `calc(var(--radius) + 4px)`

改一个 `--radius` 值，全局所有组件圆角联动更新。

### 2.5 Theme Preset

每个 preset 定义三套完整色阶（`--base-*`、`--primary-*`、`--secondary-*`，各 12 级 50~1000），语义色引用色阶。切换 preset = 替换色阶 = 全部语义色联动变化。

8 个内置 preset：Default / Underground / Rose Garden / Lake View / Sunset Glow / Forest Whisper / Ocean Breeze / Lavender Dream。部分 preset 还覆写字体。

### 2.6 Content Layout

```css
/* full 模式（默认） */
data-theme-content-layout="full" → 内容区 w-full

/* centered 模式 */
data-theme-content-layout="centered" → xl:container xl:mx-auto
```

通过 `group-data-[theme-content-layout=centered]/layout:` 前缀在 Tailwind class 中响应。

### 2.7 持久化

**模板只持久化了 dark mode 到 localStorage**（`theme: "dark"`）。Scale/Radius/Content Layout/Sidebar Mode 刷新即丢失——这是演示级实现，不是生产级。

### 2.8 字体切换

预加载 11 种 Google 字体，通过 `<body data-theme-font="inter">` + CSS `[data-theme-font=inter]{--font-sans: var(--font-inter)}` 切换。

---

## 三、shadcn/ui 官方 Sidebar 文档与最佳实践

### 3.1 组件树

```
SidebarProvider                    # 顶层 Context，管理折叠状态
├── Sidebar                        # 主面板（side / variant / collapsible）
│   ├── SidebarHeader              # 顶部固定（Logo / workspace switcher）
│   ├── SidebarContent             # 可滚动导航
│   │   └── SidebarGroup           # 导航分组
│   │       ├── SidebarGroupLabel
│   │       └── SidebarMenu
│   │           └── SidebarMenuItem
│   │               ├── SidebarMenuButton
│   │               ├── SidebarMenuBadge
│   │               └── SidebarMenuSub  # 嵌套子菜单
│   ├── SidebarFooter              # 底部固定（用户信息）
│   └── SidebarRail                # 拖拽手柄
├── SidebarInset                   # 主内容包装器（inset 专用）
└── SidebarTrigger                 # 折叠/展开按钮
```

### 3.2 三种 variant

| variant | 视觉效果 | 社区采用度 |
|---------|---------|-----------|
| `sidebar`（默认） | 传统侧边栏，紧贴左侧 | 标准 |
| `floating` | 浮起式，有圆角+border+shadow | 少见 |
| **`inset`** | **嵌入式，main 区域是浮起圆角卡片** | **官方 blocks 绝大多数用这个** |

### 3.3 三种 collapsible

| 模式 | 行为 | 折叠后宽度 |
|------|------|-----------|
| `offcanvas` | 完全滑出视口 | 0 |
| **`icon`** | **压缩为图标栏** | **`--sidebar-width-icon`（默认 3.5rem）** |
| `none` | 不可折叠 | N/A |

### 3.4 useSidebar Hook

```ts
const {
  state,           // "expanded" | "collapsed"
  open,            // boolean
  setOpen,         // (open: boolean) => void
  openMobile,      // boolean
  setOpenMobile,   // (open: boolean) => void
  isMobile,        // boolean（<1024px）
  toggleSidebar    // () => void
} = useSidebar()
```

### 3.5 CSS 变量

```css
--sidebar-width: 16rem           /* 展开宽度 256px */
--sidebar-width-mobile: 18rem    /* 移动端 Sheet 宽度 */
--sidebar-width-icon: 3.5rem     /* 折叠后宽度 56px */
```

可通过 style prop 覆盖：
```tsx
<SidebarProvider style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
```

### 3.6 状态持久化

内置 cookie 持久化：`sidebar_state` cookie（7 天有效期）。TanStack Router 项目建议用 `js-cookie` 客户端方案。

### 3.7 移动端行为

< 1024px 自动转为 Sheet（抽屉），导航后应调 `setOpenMobile(false)` 关闭。

### 3.8 官方 blocks 关键示例

| Block | 特点 | 参考价值 |
|-------|------|---------|
| **sidebar-07** | **collapsible="icon"** | **icon 折叠的唯一官方示例** |
| sidebar-01~06 | inset + header breadcrumb | 标准模式 |
| **sidebar-16** | **sticky site header** | **与顶部 header 结合** |
| sidebar-08 | 双面板 | 次级导航 |

### 3.9 社区标准 App Shell 结构

```tsx
<SidebarProvider defaultOpen={savedState}>
  <AppSidebar />
  <SidebarInset>
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>...</Breadcrumb>
      {/* 右侧：搜索 / 主题切换 / 通知 / 用户头像 */}
    </header>
    <main className="flex-1 p-4 pt-6">{children}</main>
  </SidebarInset>
</SidebarProvider>
```

### 3.10 社区关键最佳实践

1. **SidebarProvider 放 Root Layout**：页面切换时折叠状态不丢失
2. **导航配置驱动**：菜单项存配置文件，`usePathname()` / `useRouterState()` 高亮当前路由
3. **Header 高度固定 `h-16`（4rem）**：`sticky top-0 shrink-0`
4. **移动端导航后自动关闭 Sheet**
5. **shadcn-admin（11.8k stars）**：Vite + TanStack Router，社区最热门，可作为参考

### 3.11 shadcn/ui v4 新功能（2026 年）

- **Preset 系统**（2026-03）：`npx shadcn@latest init --preset [CODE]`，包含 colors + fonts + radius + icons
- **shadcn apply**（2026-04）：在已有项目上切换 preset
- **shadcn/create**（`ui.shadcn.com/create`）：可视化设计系统构建器
- **shadcn/skills**：给 AI agent 的组件上下文
- **`--radius` 派生体系**已内置：改一个值全局联动
- **`--scaling` 不存在**：官方无此功能

---

## 四、meta-build App Shell 现状深度分析

### 4.1 文件结构

```
client/packages/app-shell/src/
├── layouts/
│   ├── sidebar-layout.tsx    # 主布局
│   ├── basic-layout.tsx      # 登录页用
│   ├── top-layout.tsx        # 未使用
│   └── index.ts
├── components/
│   ├── sidebar.tsx           # 自定义 Sidebar
│   ├── header.tsx            # Header
│   ├── theme-switcher.tsx    # 主题切换下拉
│   └── ...
├── theme/
│   ├── theme-provider.tsx    # ThemeProvider
│   └── use-theme.ts          # useTheme hook
├── menu/
│   ├── types.ts              # MenuNode 类型
│   └── use-menu.ts           # useMenu hook（API 驱动）
├── auth/
│   ├── require-auth.ts       # 路由守卫
│   └── ...
├── sse/                      # SSE 实时推送
├── i18n/                     # 国际化
├── data/                     # QueryClient
├── error/                    # 错误边界
├── feedback/                 # Toast/Dialog
└── index.ts                  # 主导出
```

### 4.2 SidebarLayout 当前实现

```tsx
// sidebar-layout.tsx
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex flex-1 flex-col">
    <Header notificationSlot={notificationSlot} />
    <main className="flex-1 overflow-auto p-6">{children}</main>
  </div>
</div>
```

### 4.3 Sidebar 当前实现

- **完全自定义**，不基于 shadcn 官方组件
- **折叠状态**：本地 `useState(false)`，无 Context，无持久化
- **宽度**：展开 `var(--size-sidebar-width)` 16rem / 折叠 `var(--size-sidebar-width-collapsed)` 4rem，`transition-[width] duration-200`
- **菜单**：后端 API 驱动（`useMenu()` → `/api/v1/menus/current-user`），递归 `MenuTreeItem` 渲染
- **MenuNode 类型**：`{ id, parentId, name, permissionCode, menuType('DIRECTORY'/'MENU'/'BUTTON'), icon, sortOrder, visible, children }`
- **子菜单**：本地 `expanded` state，`paddingLeft = collapsed ? 8 : 12 + depth * 16`
- **响应式**：**无 mobile 处理**
- **无 SidebarProvider / SidebarRail**

### 4.4 Header 当前实现

```tsx
<header className="flex h-[var(--size-header-height)] shrink-0 items-center justify-between border-b bg-background px-4">
  {/* 左：空 div */}
  {/* 右：LanguageSwitcher + ThemeSwitcher + notificationSlot + Separator + Avatar + 退出按钮 */}
</header>
```

- **无 `sticky`**
- **无 `backdrop-blur`**
- **无 SidebarTrigger**
- **无 Breadcrumb**
- 实色 `bg-background`

### 4.5 主题系统

- **自定义实现**（不依赖 next-themes）
- **ThemeProvider**：`useState<ThemeId>` + `applyTheme()` + `localStorage` 持久化
- **ThemeSwitcher**：Dropdown menu，遍历 `themeRegistry` 切换
- **三个主题**：default / dark / compact

### 4.6 L1 Token 体系

| 类别 | 数量 | 关键值 |
|------|------|--------|
| 颜色 | 33 个 | background/foreground/primary/secondary/muted/accent/destructive/success/warning/info + sidebar 8个 |
| 圆角 | 4 个 | sm=0.25rem, md=0.5rem, lg=0.75rem, xl=1rem（compact: 各减 0.25rem） |
| 尺寸 | 5 个 | header-height=3.5rem, sidebar-width=16rem, sidebar-collapsed=4rem, content-max-width=80rem, control-height=2.25rem |
| 阴影 | 4 个 | sm/md/lg/xl |
| 动画 | 5 个 | duration-fast=150ms/normal=250ms/slow=400ms, easing-in/out |
| 字体 | 3 个 | sans/mono/heading |

色值格式：**oklch**（如 `oklch(0.985 0 0)`）

### 4.7 Provider 树

```
App()
└─ GlobalErrorBoundary
    └─ QueryClientProvider
        └─ I18nProvider
            └─ ThemeProvider
                └─ RouterProvider
                    ├─ ToastContainer
                    └─ DialogContainer
```

### 4.8 路由集成

```
__root.tsx
├── auth/login.tsx（BasicLayout）
└── _authed.tsx（SidebarLayout + beforeLoad 认证守卫）
    ├── dashboard/
    ├── notices/
    └── settings/
```

`_authed.tsx` 的 `beforeLoad` 调 `authApi.getCurrentUser()` 校验登录态，失败 redirect `/auth/login`。

### 4.9 导出体系

app-shell 通过 12 个 subpath 导出：

```json
{
  ".": "./src/index.ts",
  "./auth": "./src/auth/index.ts",
  "./i18n": "./src/i18n/index.ts",
  "./theme": "./src/theme/index.ts",
  "./menu": "./src/menu/index.ts",
  "./layouts": "./src/layouts/index.ts",
  "./error": "./src/error/index.ts",
  "./feedback": "./src/feedback/index.ts",
  "./data": "./src/data/index.ts",
  "./sse": "./src/sse/index.ts",
  "./i18n/zh-CN/*": "...",
  "./i18n/en-US/*": "..."
}
```

---

## 五、差距分析

### 5.1 骨架层差距

| 维度 | shadcnuikit 模板 | meta-build 现状 | 改造量 |
|------|-----------------|----------------|--------|
| Sidebar 实现 | shadcn 官方 `<Sidebar>` 组件 | 完全自定义 | **重写** |
| 布局模式 | `variant="inset"`（main 浮起圆角卡片） | 传统 flex 平铺 | **重写** |
| Top Bar | sticky + 毛玻璃 + 顶部圆角 | 静态 + 实色 + 无圆角 | **改造** |
| 内容区底色 | `bg-muted/40` 微灰底 | 无显式背景 | 1 行 class |
| 折叠模式 | `collapsible="icon"` + useSidebar + cookie 持久化 | 本地 state，无持久化 | 切组件后自带 |
| Mobile | < 1024px 自动转 Sheet | 无处理 | 切组件后自带 |
| Breadcrumb | Top Bar 左侧标配 | 无 | **新增** |
| SidebarTrigger | Top Bar 内，联动折叠 | 折叠按钮在 Sidebar 内部 | 切组件后自带 |

### 5.2 Theme Customizer 差距

| 功能 | shadcnuikit 实现 | meta-build 现有 | 改造量 |
|------|-----------------|----------------|--------|
| Theme preset | 8 个预设，body data 属性切换色阶 | L1 Theme Registry 3 主题 | 扩展 Registry + 加 UI |
| Scale | 覆写 `--text-*` 和 `--spacing` | 无 | **新增** CSS 规则 |
| Radius | 修改 `--radius` | L1 有 `--radius-*` token | 加运行时切换 UI |
| Color mode | class-based light/dark | 已有（自定义 ThemeProvider） | 无需改 |
| Content layout | `data-theme-content-layout` + container/mx-auto | `--size-content-max-width` 存在但未用 | **新增** |
| Sidebar mode | 操作 sidebar data-collapsible | 无 | 切官方组件后自带 |
| 持久化 | 仅 dark mode 到 localStorage | 主题持久化已有 | 扩展到所有维度 |

### 5.3 关键差异说明

1. **Scale 不需要改组件源码**：shadcnuikit 的做法是覆写 Tailwind v4 的 `--text-*` 和 `--spacing` 变量。meta-build 已经用 Tailwind v4，只需要加几行 CSS 属性选择器规则。
2. **Radius 已经有基础**：L1 有 `--radius-sm/md/lg/xl`，但不是 shadcn v4 的 `--radius` 单值派生模式。需要对齐到 shadcn v4 的 `--radius` + `calc()` 派生体系。
3. **菜单数据保持不变**：后端 API 驱动的 `MenuNode` 结构不需要改，只需要适配到 shadcn Sidebar 的 `SidebarMenu` → `SidebarMenuItem` → `SidebarMenuButton` 组件树。

---

## 六、改造方案设计

### 6.1 总体策略

**切换到 shadcn 官方 Sidebar 组件 + 新增 Theme Customizer**。改动封闭在 L4（app-shell），不影响 L1-L3 和业务页面。

### 6.2 Sidebar 组件安装

```bash
cd client
pnpm dlx shadcn@latest add sidebar -c packages/ui-primitives
```

依赖组件：`sheet.tsx`（mobile drawer）、`separator.tsx`、`tooltip.tsx`（可能已有）。

### 6.3 Layout 改造

```tsx
// sidebar-layout.tsx 改造后
export function SidebarLayout({ children, notificationSlot }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background/40 sticky top-0 z-50 flex h-[var(--size-header-height)] shrink-0 items-center gap-2 border-b backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <BreadcrumbNav />  {/* 已有组件 */}
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <ThemeCustomizer />  {/* 新增 */}
            {notificationSlot}
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-4" />
            <UserMenu />
          </div>
        </header>
        <div className="bg-muted/40 flex flex-1 flex-col">
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### 6.4 AppSidebar 改造

```tsx
function AppSidebar() {
  const { data: menuTree } = useMenu()  // 保持现有 API 驱动

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Logo />
              <span>Meta-Build</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* 递归渲染 menuTree → SidebarGroup/Menu/MenuItem */}
        <MenuTreeRenderer nodes={menuTree} />
      </SidebarContent>
      <SidebarFooter>
        <UserFooter />  {/* 头像+名称+退出，从 Header 移到这里 */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
```

### 6.5 Theme Customizer 实现

```tsx
// theme-customizer.tsx（新增，放 app-shell/src/components/）
function ThemeCustomizer() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Theme preset: Select */}
        {/* Scale: ToggleGroup ⊘/XS/LG */}
        {/* Radius: ToggleGroup ⊘/SM/MD/LG/XL */}
        {/* Color mode: ToggleGroup Light/Dark */}
        {/* Content layout: ToggleGroup Full/Centered */}
        {/* Sidebar mode: ToggleGroup Default/Icon */}
        {/* Reset to Default */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

实现方式与模板一致：修改 `<body>` 的 `data-theme-*` 属性 + CSS 属性选择器覆写变量。所有设置持久化到 `localStorage`。

### 6.6 Scale/Radius CSS 规则（加到全局 CSS）

```css
/* Scale */
[data-theme-scale=sm] {
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
[data-theme-radius=md]   { --radius: .5rem }
[data-theme-radius=lg]   { --radius: 1rem }
[data-theme-radius=xl]   { --radius: 1.5rem }
```

### 6.7 Radius 体系对齐

meta-build L1 现在用 `--radius-sm/md/lg/xl` 四个独立 token，需要对齐到 shadcn v4 的单值派生体系：

```css
/* 对齐方案：保留 --radius 基准值，其他由 Tailwind v4 自动派生 */
:root {
  --radius: 0.625rem;  /* 基准值，Tailwind v4 的 rounded-lg 直接用这个 */
  /* rounded-sm = calc(var(--radius) - 4px) */
  /* rounded-md = calc(var(--radius) - 2px) */
  /* rounded-lg = var(--radius) */
  /* rounded-xl = calc(var(--radius) + 4px) */
}
```

需要确认 Tailwind v4 配置是否已经用了 `--radius` 派生。如果是，L1 的 `--radius-sm/md/lg/xl` 四个 token 可以简化为一个 `--radius`。

---

## 七、改造优先级

| 优先级 | 改造项 | 预估工作量 | 收益 |
|-------|--------|-----------|------|
| **P0** | Sidebar 切官方组件 + inset 布局 + SidebarInset | 1-2 天 | 骨架焕然一新，折叠/响应/mobile 全自带 |
| **P0** | Top Bar 改造（sticky + 毛玻璃 + SidebarTrigger） | 半天 | 视觉辨识度最高的改动 |
| **P0** | 内容区 `bg-muted/40` 底色 | 5 分钟 | 一行 class，卡片立刻有层次 |
| **P1** | ThemeCustomizer 面板（Radius + Color mode + Sidebar mode） | 半天-1天 | "千人千面"的直观体现 |
| **P1** | Theme Preset 切换 UI | 半天 | 已有 L1 Theme Registry，加 UI 入口 |
| **P1** | Breadcrumb 集成（菜单树 + 当前路径匹配） | 半天 | 导航体验提升 |
| **P1** | 菜单图标渲染（icon name → Lucide 组件映射） | 2 小时 | 侧边栏视觉完整 |
| **P1** | Content layout（Full/Centered） | 1 小时 | 宽屏实用 |
| **P2** | Scale（全局缩放） | 半天 | 加几行 CSS 规则即可，不改组件 |
| **P2** | 设置 localStorage 持久化 | 2 小时 | 生产级体验 |

---

## 八、需要改动的文件清单

### 先决条件（安装缺失组件）

```bash
cd client
pnpm dlx shadcn@latest add sheet -c packages/ui-primitives
pnpm dlx shadcn@latest add toggle toggle-group -c packages/ui-primitives
pnpm dlx shadcn@latest add sidebar -c packages/ui-primitives
# separator / tooltip 已存在，CLI 会跳过或提示 --overwrite
```

### 需要改的（集中在 L4 app-shell + L5 web-admin）

| 文件 | 动作 |
|------|------|
| `app-shell/src/layouts/sidebar-layout.tsx` | **重写**：SidebarProvider + Sidebar variant="inset" + SidebarInset |
| `app-shell/src/components/sidebar.tsx` | **重写**：用官方 SidebarHeader/Content/Footer/Group/Menu + UserFooter（从 Header 迁移） |
| `app-shell/src/components/header.tsx` | **改造**：sticky + 毛玻璃 + SidebarTrigger；移除 Avatar/退出按钮（移到 SidebarFooter） |
| `app-shell/src/components/theme-customizer.tsx` | **新建**：DropdownMenu + ToggleGroup 面板（**替代** ThemeSwitcher） |
| `app-shell/src/components/theme-switcher.tsx` | **废弃**：功能合并到 ThemeCustomizer |
| `web-admin/src/routes/_authed.tsx` | **适配**：layout 接口微调 |
| 全局 CSS（globals.css 或 tailwind-theme.css） | **新增**：Scale/Radius 的 CSS 属性选择器规则 |

### 可能需要微调的

| 文件 | 动作 |
|------|------|
| `ui-tokens/src/index.ts` | 确认 `--radius` 体系是否需要对齐到 shadcn v4 单值派生 |
| `ui-tokens/src/themes/*.css` | 微调 sidebar token 值以匹配 inset 视觉效果 |
| `app-shell/src/theme/theme-provider.tsx` | 扩展支持 Scale/Radius/ContentLayout 状态管理 |
| `app-shell/src/index.ts` | 新增 ThemeCustomizer 导出 |

### 不需要改的

- **L2 ui-primitives** — 组件不变（可能需要加 sidebar 组件）
- **L3 ui-patterns** — NxTable/NxForm 等不感知 Shell 变化
- **业务页面** — 纯 Shell 层改动
- **后端** — 菜单 API 不变
- **api-sdk** — 不涉及

---

## 九、注意事项

1. **SidebarProvider 放在 _authed.tsx 的最顶层**，确保页面切换时折叠状态不丢失
2. **菜单数据从 `MenuNode[]` 映射到 SidebarMenu 组件树**：`DIRECTORY` → `Collapsible` + `SidebarMenuSub`，`MENU` → `SidebarMenuButton` + `<Link>`，`BUTTON` → 不渲染
3. **毛玻璃 Top Bar 兼容性**：`backdrop-filter: blur()` 现代浏览器 97%+ 支持，B 端无需担心
4. **Scale 不需要改组件源码**：覆写 Tailwind v4 的 `--text-*` 和 `--spacing` 即可，所有用了 `text-sm`、`p-4` 等 Tailwind class 的组件自动响应
5. **Radius 体系对齐**：确认 Tailwind v4 配置中 `rounded-*` 是否已基于 `--radius` 派生。如果是，L1 的 4 个 radius token 可简化
6. **inset 模式下 sidebar 折叠**：`ml-0` → `ml-2`，官方 CSS 已处理
7. **移动端测试**：切换到官方 Sidebar 后，< 1024px 自动转 Sheet，需要验证菜单点击后 Sheet 关闭行为
8. **设置持久化方案**：所有 Customizer 设置持久化到 `localStorage`（key 如 `mb_theme_settings`），页面加载时从 localStorage 恢复到 `<body>` data 属性

---

## 十、Review 修正（Critical + Important）

> 以下问题由 superpowers:code-reviewer 在交叉审查中发现，已验证属实。实施者必须参考本节。

### C1. Radius 体系：meta-build 用四个独立 token，不是 shadcn v4 的单值派生

**现状**：`ui-tokens/src/tailwind-theme.css` 的 `@theme` 块定义了四个独立 token：
```css
@theme {
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```
Tailwind v4 中 `rounded-lg` 直接映射到 `var(--radius-lg)`，**不存在从单一 `--radius` 加 calc() 派生的行为**。

**影响**：第 2.4 节和第 6.6 节中 `[data-theme-radius=sm] { --radius: .3rem }` 的方案在当前配置下**不会生效**。

**修正方案（二选一）**：

| 方案 | 做法 | 改动量 | 优缺点 |
|------|------|--------|--------|
| **A: 保持四个 token** | Radius Customizer 同时修改四个变量值 | CSS 规则多写几行 | 改动最小，但不够优雅 |
| **B: 迁移到单值 --radius** | 修改 `@theme` 块，用 `--radius` + calc 派生四个值；同步改三个 theme CSS + TOKEN_NAMES + check-theme 脚本 | 较大但一次性 | 与 shadcn v4 标准对齐，后续维护简单 |

方案 A 的 CSS：
```css
[data-theme-radius=none] {
  --radius-sm: 0; --radius-md: 0; --radius-lg: 0; --radius-xl: 0;
}
[data-theme-radius=sm] {
  --radius-sm: 0.1rem; --radius-md: 0.2rem; --radius-lg: 0.3rem; --radius-xl: 0.5rem;
}
/* ... */
```

方案 B 的 `@theme` 块改造：
```css
@theme {
  --radius: 0.625rem;  /* 基准值 */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

建议实施者评估后选择。**方案 B 更推荐**，因为与 shadcn v4 标准对齐，且 Radius Customizer 只改一个变量。

### C2. Sheet 组件缺失

L2 ui-primitives **没有 Sheet 组件**（只有 Drawer，基于 Vaul）。shadcn Sidebar 移动端依赖 Sheet（基于 Radix Dialog）。

**修正**：安装 Sidebar 前先安装 Sheet：
```bash
cd client
pnpm dlx shadcn@latest add sheet -c packages/ui-primitives
pnpm dlx shadcn@latest add sidebar -c packages/ui-primitives
```

Sheet 和 Drawer 是独立组件（Sheet = Radix Dialog 侧滑变体，Drawer = Vaul 底部抽屉），不冲突。

### C3. ToggleGroup 组件缺失

L2 ui-primitives **没有 ToggleGroup 和 Toggle 组件**。ThemeCustomizer 面板大量使用。

**修正**：
```bash
pnpm dlx shadcn@latest add toggle toggle-group -c packages/ui-primitives
```

### C4. BreadcrumbNav 数据源未解决

`BreadcrumbNav` 组件存在但从未使用，它需要外部传入 `items: BreadcrumbEntry[]`。TanStack Router 没有内置 breadcrumb 方案。

**修正**：Breadcrumb 降级为 **P1**，不纳入 P0 骨架改造。P0 阶段 header 左侧先放 SidebarTrigger + 页面标题即可。P1 再实现从菜单树 + 当前路径匹配构建 breadcrumb items 的逻辑。

### I1. Sidebar 折叠宽度冲突

现有 `--size-sidebar-width-collapsed: 4rem`（64px），shadcn 官方 `--sidebar-width-icon` 默认 `3.5rem`（56px）。

**修正**：切换到官方组件后，`--size-sidebar-width-collapsed` token **废弃**，改用 shadcn 的 `--sidebar-width-icon`。如需自定义，通过 SidebarProvider 的 style prop 覆盖。compact theme 的折叠宽度值也需要相应调整或移除。

### I2. Dark mode 机制差异（关键）

meta-build 用 `<html data-theme="dark">` + CSS `[data-theme='dark'] { ... }` 切换 dark mode。**不是** `<html class="dark">`。

**影响**：shadcn/ui 官方 Sidebar 组件内部使用 Tailwind 的 `dark:` 变体。如果 Tailwind v4 的 dark mode 选择器不是 `[data-theme='dark']`，Sidebar 的 dark 样式不会生效。

**修正**：需要确认 Tailwind v4 配置中 dark mode 的 selector。如果 meta-build 的 Tailwind 配置已经把 dark mode selector 设为 `[data-theme='dark']`（通过 `@variant dark` 或 `@custom-variant`），则无需改动。否则需要添加配置或迁移到 class-based dark mode。

**实施者操作**：先执行 `grep -r "dark" client/packages/ui-tokens/src/` 和 `grep -r "@variant\|@custom-variant\|darkMode" client/` 确认 dark mode 配置。

### I3. SidebarProvider 位置表述修正

第九节说"放在 _authed.tsx 最顶层"容易误解。

**修正**：SidebarProvider 包裹在 `SidebarLayout` 组件内部。`_authed.tsx` 调用 `<SidebarLayout>`，Provider 跟着 layout 走。这样确保所有认证后页面共享折叠状态。

### I4. 菜单图标渲染策略

`MenuNode.icon` 字段存在但当前未使用。切换到官方 Sidebar 后，`SidebarMenuButton` 应渲染图标。

**修正**：标记为 **P1**。需要建立 icon name → Lucide React component 的映射表（如 `{ user: User, settings: Settings, ... }`）。P0 阶段可以先用通用图标（如 `CircleDot`）作为 fallback。

### I5. Header → SidebarFooter 的迁移清单

从 Header 迁移到 SidebarFooter 的功能：
- Avatar + username 显示（需 `useCurrentUser()`）
- 退出按钮（需 `useAuth()`）

保留在 Header 的功能：
- LanguageSwitcher
- ThemeSwitcher / ThemeCustomizer
- notificationSlot
- SidebarTrigger（新增）

### I6. ThemeSwitcher 与 ThemeCustomizer 的关系

**修正**：**ThemeCustomizer 替代 ThemeSwitcher**。Theme preset 切换纳入 Customizer 面板的一个维度（替代原有的 ThemeSwitcher dropdown）。ThemeSwitcher 组件在改造后废弃。

---

## 十一、参考资源

### 官方文档
- [Sidebar 组件文档](https://ui.shadcn.com/docs/components/base/sidebar)
- [Sidebar Blocks 示例](https://ui.shadcn.com/blocks/sidebar)（重点看 sidebar-07 和 sidebar-16）
- [Theming 文档](https://ui.shadcn.com/docs/theming)
- [shadcn/create 构建器](https://ui.shadcn.com/create)

### 社区参考
- [shadcn-admin（11.8k stars）](https://github.com/satnaing/shadcn-admin) — Vite + TanStack Router，最热门
- [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) — Next.js + 完整功能
- [Building Admin Skeleton with shadcn/ui](https://eastondev.com/blog/en/posts/dev/20260327-shadcn-ui-sidebar-layout/)

### 调研来源
- shadcnuikit.com/dashboard/real-estate — Playwright 技术逆向（CSS 变量 + DOM 结构 + data 属性完整提取）
- shadcnuikit.com/generator — Theme Generator 面板探索

---

## 十二、飞书管理后台 App Shell 逆向分析

> **调研日期**：2026-04-16
> **调研对象**：`https://g05t3iydj2i.feishu.cn/admin/index`（飞书管理后台）
> **调研方式**：Playwright 浏览器自动化（截图 + DOM snapshot + JS evaluate 提取计算样式）
> **目标**：逆向分析飞书"子系统切换"布局模式（Header 顶部通栏 + 模块切换 Tab + Sidebar 随模块动态变化），作为 meta-build 的一个 Shell 预设候选。

### 12.1 整体布局架构

```
┌──────────────────────────────────────────────────────────────────────┐
│ <section.js-layout-container>  flex-col, 100vw × 100vh              │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ <header>  h=56px, flex-row, z-index=100, bg=#fff                │ │
│ │ ┌──────┬──────────┬─────────────────────┬────────────────┐      │ │
│ │ │ Logo │ Tab 区域  │     搜索框           │   右侧操作区    │      │ │
│ │ │240px │ 284px    │  flex:1              │   493px        │      │ │
│ │ └──────┴──────────┴─────────────────────┴────────────────┘      │ │
│ ├──────────────────────────────────────────────────────────────────┤ │
│ │ <section>  flex-row, flex:1, overflow:hidden                    │ │
│ │ ┌──────────────┬───────────────────────────────────────────────┐ │ │
│ │ │ <section>    │ <section>  flex:1, bg=#f2f3f5                │ │ │
│ │ │  w=244px     │  ┌────────────────────────────────────┐      │ │ │
│ │ │ ┌──────────┐ │  │ <section> 顶部间距 h=12px           │      │ │ │
│ │ │ │ <aside>  │ │  ├────────────────────────────────────┤      │ │ │
│ │ │ │ w=236px  │ │  │ <section> 主内容区 flex:1           │      │ │ │
│ │ │ │bg=#f2f3f5│ │  │  ┌──────────┐ overflow:auto        │      │ │ │
│ │ │ │overflow-y│ │  │  │ 实际滚动   │                     │      │ │ │
│ │ │ │ :auto    │ │  │  │ 容器       │                     │      │ │ │
│ │ │ │          │ │  │  │ (flex-col) │                     │      │ │ │
│ │ │ │ [菜单树] │ │  │  │ ┌───────────────┬─────────────┐ │      │ │ │
│ │ │ │          │ │  │  │ │ 主内容 flex:1  │ 右侧面板     │ │      │ │ │
│ │ │ │          │ │  │  │ │               │ w=406px     │ │      │ │ │
│ │ │ │[收起导航]│ │  │  │ └───────────────┴─────────────┘ │      │ │ │
│ │ │ └──────────┘ │  │  └──────────┘                     │      │ │ │
│ │ └──────────────┘  └───────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**DOM 层级关系**：

```
section.js-layout-container          // 根容器, flex-col, position:relative
├── header[role="app-header"]        // 顶部通栏, flex-row, h=56px, z=100
│   ├── div (Logo 区, w=240px, flex:0)
│   ├── div (模块切换 Tab 区, w=284px, flex:0)
│   ├── div (搜索框, flex:1)
│   └── div (右侧操作区, w=493px, flex:0)
└── section                          // body 区域, flex-row, flex:1, overflow:hidden
    ├── section (sidebar wrapper, w=244px, flex:0)
    │   └── aside (实际 sidebar, w=236px, overflow-y:auto, bg:#f2f3f5)
    │       ├── div (菜单树滚动区)
    │       └── div ("收起导航" 按钮, h=44px, 在 aside 内部底部)
    └── section (内容包装器, flex:1, bg:#f2f3f5)
        ├── section (顶部间距, h=12px)
        └── section (主内容区, flex:1)
            └── div (滚动容器, overflow:auto, flex-col)
                └── div.container (页面内容, flex-row)
                    ├── 主内容 (flex:1)
                    └── 右侧面板 (w=406px, 如"企业管理小助手")
```

### 12.2 Header 详细分析

| 属性 | 值 |
|------|-----|
| **标签** | `<header role="app-header">` |
| **高度** | 56px |
| **宽度** | 100%（全宽通栏） |
| **定位** | `position: relative`（**不是 sticky/fixed**，Header 不随页面滚动固定） |
| **背景色** | `rgb(255, 255, 255)` 纯白 |
| **底部边框** | 无 border-bottom、无 box-shadow |
| **z-index** | 100 |
| **布局** | `display: flex; flex-direction: row` |

**Header 内部四区域**（从左到右）：

| 区域 | 宽度 | 内容 | flex |
|------|------|------|------|
| **Logo** | 240px | 飞书管理后台 Logo + 文字 | flex:0 |
| **模块切换 Tab** | 284px | "企业管理" + "产品设置" | flex:0 |
| **搜索框** | 弹性 | 搜索图标 + placeholder 文字 + 搜索输入框 | **flex:1** |
| **右侧操作区** | 493px | 客服、工单、消息、帮助中心、应用入口(九宫格)、用户信息(公司名+角色+头像) | flex:0 |

**关键发现**：Header 和 Body 之间**没有任何视觉分隔**（无 border、无 shadow、无 gap）。分隔感完全来自 Sidebar 和 Content 的背景色 `#f2f3f5` 与 Header 白色的色差。

### 12.3 模块切换 Tab 详细分析

这是飞书管理后台最核心的交互模式。Header 中有两个"子系统"级别的入口：

#### Tab 结构

| Tab | 标签 | 激活状态 | 非激活状态 |
|-----|------|---------|-----------|
| **企业管理** | `<a href="/admin/index">` | color:`rgb(51,112,255)`, fontWeight:500, bg:`rgba(51,112,255,0.08)`, borderRadius:4px | color:`rgb(0,0,0)`, fontWeight:400, bg:transparent |
| **产品设置** | `<div>`（非链接） | 同上蓝色 + 文字变成当前产品名 | color:`rgb(0,0,0)`, fontWeight:400, bg:transparent |

- 尺寸：h=36px, padding=7px 12px
- fontSize: 14px
- 每个 Tab 前有一个产品图标（img）
- 容器 `display: flex`，无 gap

#### "企业管理" Tab

- 点击直接跳转 `/admin/index`
- 激活时：蓝色文字 + 浅蓝色背景填充 + class `active`
- 是一个 `<a>` 标签

#### "产品设置" Tab（关键交互）

**不是直接跳转，是弹出下拉面板**：

- 是一个 `<div>`（不是链接）
- 右侧有一个下拉箭头 `img`
- 点击后弹出一个宽大的下拉面板（Dropdown Panel），分四列展示产品入口：

| 列 | 产品 |
|----|------|
| **飞书 Office** | 知识库、云文档、邮箱、视频会议、服务台、即时消息、日历、搜索管理、飞书OKR、多维表格 |
| **飞书 People** | 飞书人事(标准版) |
| **业务工具** | 词典、集成平台、飞书审批 |
| **发现更多** | 飞书 aPaaS(NEW)、飞书项目(高效管理) |

每个产品入口都是 `<a>` 标签，带图标和产品名。部分有标签（如"标准版"、"NEW"、"高效管理"）。

#### 模块切换后的变化（核心发现）

点击"产品设置"下拉面板中的"知识库"后（跳转到 `/admin/drive/wiki`）：

| 维度 | 企业管理模式 | 知识库模式 |
|------|-------------|-----------|
| **Header Tab[0]** | "企业管理"(active, 蓝色) | "企业管理"(inactive, 黑色) |
| **Header Tab[1]** | "产品设置"(文字) | **"知识库"(active, 蓝色, 带下拉箭头)** |
| **Sidebar 菜单** | 14 个分组, 62 个链接 | **1 个链接("企业知识库管理")** |
| **URL** | `/admin/index` | `/admin/drive/wiki` |

**模块切换的本质**：
1. Tab[1] 的文本从"产品设置"变成当前产品名（"知识库"），变成蓝色激活态
2. Tab[1] 保留下拉箭头，可以再次展开面板切换到其他产品
3. **Sidebar 完全替换为该产品专属的菜单树**
4. Tab[0] "企业管理" 变为非激活态，点击可回到企业管理首页

### 12.4 Sidebar 详细分析

| 属性 | 值 |
|------|-----|
| **标签** | `<aside>`（在 `<section>` wrapper 内） |
| **展开宽度** | 236px（wrapper 244px，含 8px 左 padding） |
| **折叠宽度** | 50px（wrapper 58px） |
| **高度** | 与 body 区域等高（viewport - header 56px） |
| **定位** | `position: relative` |
| **背景色** | `rgb(242, 243, 245)` = `#f2f3f5`（与内容区背景相同） |
| **滚动** | `overflow-y: auto`（菜单超出时垂直滚动） |
| **右边框** | 无 border、无 shadow |

#### 菜单结构（企业管理模式）

三级菜单树，14 个一级分组：

```
企业概览          ← 独立链接（无子菜单，带图标）
组织架构 ▼        ← 可折叠分组（带图标 + 展开箭头）
  ├── 成员与部门
  ├── 角色管理
  ├── 单位管理
  ├── 用户组管理
  ├── 字段管理
  └── 人事企业版配置
对外协作 ▼
  └── 关联组织
会议室 ▼
  ├── 会议室管理
  └── 设备与运维
工作台 ▼
  ├── 应用审核
  ├── 应用管理
  ├── 工作台设置
  ├── 定制工作台 [增值版本]
  └── API 用量情况 ▼      ← 三级菜单
      └── 基础 API 调用次数
费用中心 ▼
AI 使用管理 ▼
存储空间 ▼
安全 ▼
  ├── 策略中心 ▼          ← 三级菜单
  │   └── 策略管理
  ├── 安全中心 ▼
  │   ├── 安全概览
  │   ├── 成员异常
  │   └── 文档异常
  ├── 成员权限
  ├── 账号安全
  ...
合规 ▼
数据报表 ▼
  ├── 数据概览
  ├── 成员活跃数据
  └── 功能使用情况 ▼      ← 三级菜单
企业文化 ▼
企业设置 ▼
```

每个一级分组带图标（img），二级/三级菜单带缩进但无图标。

#### "收起导航"按钮

- 位置：Sidebar 内部最底部
- 高度：44px
- 距底部：8px
- 在 aside 标签内部
- cursor: pointer
- 包含一个图标 + "收起导航" 文字

#### 折叠行为

- 折叠后 Sidebar 变为**纯图标模式**（只显示一级分组的图标）
- 展开 236px → 折叠 50px
- 文字全部隐藏，只保留图标
- 底部按钮变为纯图标（双箭头）

### 12.5 内容区分析

| 属性 | 值 |
|------|-----|
| **背景色** | `rgb(242, 243, 245)` = `#f2f3f5`（与 Sidebar 相同） |
| **flex** | `flex: 1 1 0%`（占满剩余空间） |
| **内部滚动** | 真正的滚动容器在内部的 `div`（`overflow: auto`），不是 section 本身 |
| **内边距** | 0px（间距由内部元素的 margin 实现） |
| **与 Sidebar 的分隔** | **无 border、无 shadow、无 gap**（仅靠左侧有 8px padding 的 sidebar wrapper 产生视觉间距） |

概览页（`/admin/index`）内部是 flex-row 两栏：
- 左侧主内容（flex:1）：企业信息卡片 + 快捷入口 + 功能使用情况
- 右侧面板（w=406px）：企业管理小助手 + 数字资产预警 + 应用管理

### 12.6 滚动行为

```
layout-container (100vh, overflow:visible)
├── header (56px, 不滚动, 不 sticky)
└── body-section (flex:1, overflow:hidden)  ← 裁剪边界
    ├── sidebar (overflow-y:auto)           ← Sidebar 独立滚动
    └── content-wrapper
        └── scroll-container (overflow:auto) ← 内容区独立滚动
```

**关键**：Header 不 sticky，但因为 body-section 设了 `overflow:hidden` + `flex:1`，Header 天然固定在顶部（body 区域占满剩余空间并内部滚动），效果等同于 sticky。

### 12.7 响应式行为

**飞书管理后台没有真正的响应式设计**。

- 缩小到 768px 时，Header 实际宽度仍为 1024px（body.scrollWidth=1024）
- Sidebar 在窄视口下自动折叠为图标模式（50px）
- 搜索框在窄视口下被隐藏（Header 右侧操作区收缩，部分按钮隐藏）
- 但页面内容不会重排，会出现横向滚动或裁剪
- **这是纯桌面端 B 端系统的典型做法** -- 不投入 mobile 适配

### 12.8 色彩体系

| 区域 | 颜色 |
|------|------|
| Header 背景 | `#ffffff`（纯白） |
| Sidebar 背景 | `#f2f3f5`（浅灰） |
| 内容区背景 | `#f2f3f5`（同 Sidebar） |
| 激活 Tab 文字 | `rgb(51, 112, 255)` = `#3370ff`（飞书蓝） |
| 激活 Tab 背景 | `rgba(51, 112, 255, 0.08)`（8% 透明蓝） |
| 非激活 Tab 文字 | `rgb(0, 0, 0)` |
| 普通文字 | `rgb(31, 35, 41)` = `#1f2329` |
| Header/Sidebar 分隔 | 无显式分隔，靠背景色差 |

### 12.9 与 meta-build 的适配分析

#### 飞书模式的核心特征

1. **Header 全宽通栏**：Logo + 模块切换 Tab + 搜索 + 操作区，水平四段式
2. **模块切换 Tab 在 Header 中**：非 Sidebar 内，而是 Header 级别的顶层导航
3. **Sidebar 随模块动态替换**：不同模块有完全不同的菜单树
4. **无 inset 布局**：传统平铺式（Sidebar + Content 同级，无圆角卡片包裹）
5. **无 border/shadow 分隔**：纯靠背景色分层（白色 Header vs 灰色 Body）
6. **Header 不 sticky**：通过 flex 布局 + overflow:hidden 实现等效固定
7. **桌面端 only**：无真正的 mobile 响应式

#### 适配到 meta-build 的映射方案

| 飞书特征 | meta-build 实现建议 |
|---------|-------------------|
| 模块切换 Tab | 作为 Shell 的 **variant="feishu"** 预设，Header 中增加 `ModuleSwitcher` 组件 |
| Sidebar 动态菜单 | 菜单 API 按 `moduleId` 返回不同菜单树，Tab 切换时重新请求 |
| Header 四段式 | Header 组件增加 `left / center / right` slot，模块 Tab 放 left slot |
| 无 inset 布局 | `variant="default"` 传统平铺（与 inset 模式并列为两个预设） |
| 纯色背景无毛玻璃 | feishu 预设不加 `backdrop-blur`，保持 `bg-background` 纯色 |

#### 与 shadcnuikit 模式的对比

| 维度 | shadcnuikit (inset) | 飞书管理后台 | 建议 |
|------|-------------------|-------------|------|
| 布局核心 | Sidebar + 浮起圆角卡片(main) | Header 通栏 + 平铺(Sidebar + Content) | **两个预设并存** |
| 子系统切换 | Sidebar 内 workspace switcher | **Header Tab + 下拉面板** | 飞书方案适合多子系统场景 |
| Sidebar 定位 | 与 main 平级 | 在 Header 下方 body 区域内 | 两种都是 flex-row |
| Top Bar 风格 | 毛玻璃 sticky | 纯白无分隔 | 按预设走 |
| 折叠模式 | icon 模式 64px | icon 模式 50px | 可配置 |
| 分隔方式 | border + shadow + 圆角 | 纯背景色差 | 飞书更克制 |
| 内容区 | bg-muted/40 + Card 浮起 | 同色背景 + Card 可选 | 按预设走 |

### 12.10 截图索引

| 文件 | 内容 |
|------|------|
| `feishu-admin-01-full-page.png` | 企业管理首页全貌 |
| `feishu-admin-02-product-settings.png` | 点击"产品设置"后的下拉面板 |
| `feishu-admin-03-wiki-page.png` | 切换到"知识库"产品后的页面（Sidebar 变化） |
| `feishu-admin-04-sidebar-collapsed.png` | Sidebar 折叠为图标模式 |
| `feishu-admin-05-responsive-768.png` | 768px 视口下的表现 |
