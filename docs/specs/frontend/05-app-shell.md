# 05 - 应用壳层与 i18n 工程

> **关注点**：L4 `@mb/app-shell` 哲学 + Layout Resolver + Preset Registry + 全局 Provider 树 + 认证门面（`useCurrentUser` / `useAuth` / `requireAuth`）+ 全局 UI 组件（Header / Sidebar / Toast / Dialog / Error）+ **完整 i18n 工程**（8 个子决策的落地实现）。
>
> **本文件吸收前端 brainstorming 的 L4 决策与 i18n 8 个子决策**：L4 隔离 TanStack Router / 菜单 API / 全局状态；认证门面对应后端 `CurrentUser` + `AuthFacade` 双门面；i18n 字典按层分布、JSON 源 + TS module augmentation 类型安全、`Accept-Language` 自动同步、CI 完整性校验。
>
> **前置阅读**：[01-layer-structure.md](./01-layer-structure.md)（5 层依赖方向）→ [02-ui-tokens-theme.md](./02-ui-tokens-theme.md)（主题机制）→ [03-ui-primitives.md](./03-ui-primitives.md) → [04-ui-patterns.md](./04-ui-patterns.md)。
> **后续阅读**：[06-routing-and-data.md](./06-routing-and-data.md)（路由实现细节）+ [07-menu-permission.md](./07-menu-permission.md)（菜单数据源）+ [08-contract-client.md](./08-contract-client.md)（`@mb/api-sdk` 拦截器）。

---

## 1. 决策结论 [M3]

| # | 维度 | 结论 |
|---|------|------|
| 1 | L4 哲学 | **隔离 TanStack Router / 菜单 API / 全局状态管理器**——L4 是"换壳不换业务"的关键层。L5 业务代码不直接 import `@tanstack/react-router` / `i18next`，全部走 L4 暴露的 hook 和工厂函数 |
| 2 | 布局预设 | **认证后布局走 `LayoutResolver + Preset Registry`**。`BasicLayout` 保留给登录页 / 无菜单页；authed preset 共 5 套：`inset`、`mix`（M3 基座），`claude-classic`、`claude-inset`、`claude-rail`（Plan A 新增，见 [ADR frontend-0025 三层导航哲学](../../adr/frontend-0025-three-layer-navigation-philosophy.md)）；默认 preset 为 `claude-inset` |
| 3 | Provider 顺序 | **严格 6 层**：`ErrorBoundary` → `QueryClientProvider` → `I18nProvider` → `StyleProvider` → `RouterProvider` → 全局 Toast/Dialog 容器。顺序错误会导致部分 Provider 拿不到上层 context |
| 4 | 认证门面 | **对称双门面**：`useCurrentUser()` 读 + `useAuth()` 写。对应后端 `CurrentUser` + `AuthFacade`。`features/**` 禁止直调 `@mb/api-sdk/auth/*` 状态接口，必须走门面 |
| 5 | i18n 默认语言 | `zh-CN` 默认 + `zh-CN` fallback；**不做浏览器自动检测**（YAGNI） |
| 6 | i18n 字典归属 | **按层分布**——L4 持 `shell`/`common` namespace；L5 持业务 namespace（`order`/`customer`/...），归属使用方 |
| 7 | i18n 校验 | **CI 硬失败 + 本地手动命令** `pnpm check:i18n`；不做 dev 模式热检查；类型安全由 TypeScript module augmentation 实现（零构建步骤） |
| 8 | i18n 加载策略 | **全量加载**（字典 ~10KB gzip，懒加载是 YAGNI） |

---

## 2. L4 哲学：隔离应用基础设施 [M3]

### 2.1 L4 包裹的 4 类基础设施

| 基础设施 | L4 包裹方式 | L5 看到的 API |
|---------|------------|------------|
| **TanStack Router** | L5 直接调用 `createRouter()` + `RouterProvider` | `routes/**/*.tsx` 文件路由（详见 [06 §2](./06-routing-and-data.md#2-tanstack-router-文件路由-m3)） |
| **TanStack Query** | `createQueryClient()` 工厂 + `QueryClientProvider` | `useQuery` / `useMutation` 自由使用；默认配置由 L4 注入 |
| **react-i18next** | `createI18nInstance()` 工厂 + `I18nProvider` | `useTranslation('order')` 直接用 |
| **菜单 API** | `useMenu()` hook（内部用 `useQuery` 拉 `/api/v1/menus/current-user`） | 渲染 mb_iam_menu 树（详见 [07 §8](./07-menu-permission.md#8-前端-usemenu-hook)） |
| **认证状态** | `useCurrentUser()` / `useAuth()` 双门面 | `if (currentUser.isAuthenticated) {...}` |

### 2.2 L4 是换壳不换业务的关键层

```
变换壳（改 L4） ────► 同样的 L5 业务代码
                       │
   ├ inset           │
   │  侧边栏 + 卡片式内容 │
   │                    │
   ├ mix              ├──── routes/orders/index.tsx 不变
   │  模块 Tab + 子侧栏   │
   │                    │
   └ 自定义 preset      │
      （使用者新增）      │
```

L5 业务代码（`apps/web-admin/src/routes/_authed/orders/index.tsx`）只关心**渲染什么**，L4 决定**渲染在哪儿**。使用者可以把侧边栏换成顶栏，所有业务路由零改动。

### 2.3 L4 白名单依赖

```jsonc
// packages/app-shell/package.json
{
  "name": "@mb/app-shell",
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "@mb/ui-primitives": "workspace:*",
    "@mb/ui-patterns": "workspace:*",
    "@mb/api-sdk": "workspace:*",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-router": "^1.x",
    "i18next": "^23.x",
    "react-i18next": "^14.x",
    "react": "^19.x"
  }
}
```

**允许**：依赖 `@mb/api-sdk`——L4 需要调用 auth/menu/permission 等应用基础设施 API（`useCurrentUser` 内部调 `/api/v1/auth/me`、`useMenu` 内部调 `/api/v1/menus/current-user`），这些是应用壳层的固有职责，不属于"具体业务 API"。

---

## 3. 布局预设 [M3]

### 3.1 canonical 结构

认证后布局不再直接由 L5 import 某个固定 layout，而统一走：

```typescript
interface ShellLayoutProps {
  children: ReactNode;
  menuTree: MenuNode[];
  currentUser: CurrentUser;
  notificationSlot?: ReactNode;
}

interface LayoutPresetDef {
  id: string;
  name: string;
  component: ComponentType<ShellLayoutProps>;
}
```

```typescript
// _authed.tsx 只消费一个入口
<LayoutResolver notificationSlot={<NotificationBadge ... />}>
  <Outlet />
</LayoutResolver>
```

### 3.2 Preset Registry

authed layout 通过 `PresetRegistry` 显式注册：

- canonical 默认值：`defaultLayoutId = 'claude-inset'`（Plan A 切换；历史默认为 `inset`）
- 正式 preset（共 5 套）：
  - `inset`（M3 基座，卡片式内容 + 侧边栏）
  - `mix`（M3 基座，顶部一级 tab + 二级侧边栏）
  - `claude-classic`（Plan A，顶部 HeaderTab + 传统侧栏；见 [ADR frontend-0025](../../adr/frontend-0025-three-layer-navigation-philosophy.md)）
  - `claude-inset`（Plan A，HeaderTab + 卡片式内容，默认 preset）
  - `claude-rail`（Plan A，左侧 icon rail + 模块级二级侧栏）
- `BasicLayout` 保留为无菜单布局，不进入 authed preset 列表

**禁止** 通过“第一个 import 即默认 preset”的 side-effect 顺序定义默认值。默认布局必须显式配置，避免 AI 和 bundler 推理失真。

**三层导航哲学**：`claude-*` 三套 preset 共享"九宫格系统切换 → HeaderTab 模块切换 → Sidebar 菜单"的三层导航模型，不同 preset 只在视觉密度和侧栏形态上差异（详见 [ADR frontend-0025](../../adr/frontend-0025-three-layer-navigation-philosophy.md)）。`inset` / `mix` 仍使用 M3 两层模型（sidebar + 内容），保持向后兼容。

### 3.3 Phase D 清理完成

Phase D 后，旧兼容壳已从源码导出中移除：

| 当前状态 | 说明 |
|------|------|
| `LayoutResolver` | 认证后布局唯一入口 |
| `inset` / `mix` / `claude-classic` / `claude-inset` / `claude-rail` | 5 套正式 preset（inset + mix 为 M3 基座；claude-* 为 Plan A 新增） |
| `BasicLayout` | 保留给登录页 / 无菜单页 |

旧固定布局兼容壳与旧单 theme API 均已下线，不再作为 public API。

### 3.4 布局选择对照表

| 场景 | 用哪个 |
|------|-------|
| 业务管理后台（当前默认） | `claude-inset` |
| 多模块 SaaS 导航（M3 基座） | `mix` |
| 仅 sidebar 的传统后台（M3 基座） | `inset` |
| HeaderTab + 传统侧栏（Claude Design） | `claude-classic` |
| icon rail + 模块级二级侧栏 | `claude-rail` |
| 登录 / 注册 / 忘记密码 | `BasicLayout` |
| 全屏数据大屏 | `BasicLayout` |
| 嵌入式（去掉外部 chrome） | `BasicLayout` |

布局仍通过 TanStack Router 的布局路由装配（详见 [06 §2.4](./06-routing-and-data.md#24-布局路由-_authedtsx-骨架)），L5 业务路由继续零样板。

### 3.5 扩展新 layout preset

使用者可通过 `@mb/app-shell` 公开导出的 `registerLayout()` 注册自定义 preset。四步流程：

#### 步骤 1：实现 preset 组件

在应用或独立包中实现符合 `ShellLayoutProps` 的 React 组件。参考 `client/packages/app-shell/src/presets/inset/inset-layout.tsx`（最小完整实现）。

必须消费的 props：`children`、`menuTree`、`currentUser`、`notificationSlot`。
可选 props（`heroSlot` / `sidebarHeaderSlot` / `sidebarFooterSlot` / `sidebarAboveFooterSlot`）根据 preset 形态选择性渲染。

#### 步骤 2：声明支持的 Customizer 维度

通过 `LayoutPresetDef.supportedDimensions` 声明支持哪些 Customizer 维度（目前仅 `'contentLayout'` / `'sidebarMode'` 两个）。未声明的维度在 ThemeCustomizer UI 里对该 preset 自动 disabled。

`inset` 声明了 `['contentLayout', 'sidebarMode']`；`mix` 自带二级结构不消费这两个维度，声明 `[]`。

#### 步骤 3：注册

在应用入口（`main.tsx`，`RouterProvider` 之前）调用：

```typescript
import { registerLayout } from '@mb/app-shell';
import { MyLayout } from './presets/my-layout';

registerLayout({
  id: 'my-layout',
  name: 'layout.myLayout',           // i18n key
  description: 'layout.myLayoutDesc',
  component: MyLayout,
  supportedDimensions: ['contentLayout'],
});
```

#### 步骤 4：补 i18n

在 `apps/web-admin/src/i18n/zh-CN/shell.json` 和 `en-US/shell.json` 添加 `layout.myLayout` / `layout.myLayoutDesc` key。

注册后 ThemeCustomizer 的 preset 下拉自动出现新选项（因为 UI 读 `layoutRegistry.list()`，动态渲染）。

> **注意**：内置 5 套 preset（`inset` / `mix` / `claude-classic` / `claude-inset` / `claude-rail`）由 `packages/app-shell/src/layouts/registry.ts` 在模块加载时注册。使用者的自定义 preset 需要在应用入口显式注册，不能依赖 side-effect import 顺序。

---

## 4. 全局 Provider 树 [M3]

### 4.1 严格 6 层顺序

**主题初始化两阶段机制（v2）**：
1. **React 渲染前**：`index.html` 内联脚本从 localStorage 读 `mb_style` / `mb_color_mode` / `mb_scale` / `mb_radius` → 设 `<html>` / `<body>` data attribute → 防止首帧闪烁
2. **React 运行后**：`StyleProvider` 接管，提供 `useStyle()` hook 给组件切换 style 与 color mode

```typescript
// L5: apps/web-admin/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { GlobalErrorBoundary } from "@mb/app-shell/error";
import { I18nProvider } from "@mb/app-shell/i18n";
import { StyleProvider } from "@mb/app-shell/theme";
import { ToastContainer, DialogContainer } from "@mb/app-shell/feedback";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <StyleProvider>
            <RouterProvider router={router} />
            <ToastContainer />
            <DialogContainer />
          </StyleProvider>
        </I18nProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
```

**Why `createRouter` 在 L5 直接调用**：`createRouter` 是 TanStack Router 的标准 API，它需要 `routeTree`（由 `@tanstack/router-vite-plugin` 在 L5 生成），放在 L4 封装会导致 L4 反向依赖 L5 的生成产物。路由创建是应用入口的职责，归 L5。

### 4.2 ErrorBoundary 最外层

```typescript
// packages/app-shell/src/error/global-error-boundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * 兜底 ErrorBoundary——React render 阶段的异常都被它接住，避免白屏。
 * 路由级 errorComponent（详见 06 §6.2）已经接住绝大部分异常；
 * 这里只处理 Provider 树本身崩溃的极端情况。
 */
export class GlobalErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // M3 时补：上报到监控（Sentry / 自建 traceId 链路）
    console.error("[GlobalErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "1rem",
            fontFamily: "system-ui",
          }}
        >
          <h1 style={{ fontSize: "1.5rem" }}>应用启动失败</h1>
          <p style={{ color: "#666" }}>{this.state.error.message}</p>
          <button type="button" onClick={() => location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Why 用纯 inline style 不用 Tailwind**：ErrorBoundary 接住异常时 StyleProvider 可能尚未接管运行时主题，Tailwind class 可能拿不到预期的 CSS 变量值。inline style 是兜底中的兜底，必须 self-contained。

### 4.3 各 Provider 的职责对照表

| Provider | 职责 | 失败影响 |
|---------|------|---------|
| `GlobalErrorBoundary` | React render error 兜底，避免白屏 | 整个 App 白屏 |
| `QueryClientProvider` | TanStack Query 缓存上下文 | `useQuery` / `useMutation` 不可用 |
| `I18nextProvider` | i18n 上下文 | `useTranslation` 不可用，所有 `t(...)` 返回 key 字面量 |
| `StyleProvider` | style / color mode 运行时上下文 + `useStyle()` hook（两阶段第 2 阶段，详见 §4.1） | `useStyle` 不可用，页面只能停留在首帧内联脚本恢复的属性状态 |
| `RouterProvider` | TanStack Router | 路由不可用（白屏） |
| `ToastContainer` | 全局 Toast 渲染目标 | `toast.success(...)` 不显示 |
| `DialogContainer` | 全局 Dialog 渲染目标 | `confirm(...)` 不显示 |

---

## 5. 认证门面 [M3]

**对应后端**：[backend/05-security.md §6](../backend/05-security.md#6-currentuser-门面层设计adr-0005)（`CurrentUser`）和 [§6.6](../backend/05-security.md#66-authfacade登录登出技术门面)（`AuthFacade`）。

前端门面是后端门面的对称镜像：**读用 `useCurrentUser()`，写用 `useAuth()`**。`features/**` 业务代码禁止跳过门面直接调 `@mb/api-sdk/auth/*` 的状态接口（MUST NOT #4），路由 `routes/auth/**`（登录/登出）豁免，因为这些路由本身是登录态的建立者。

### 5.1 useCurrentUser hook

```typescript
// packages/app-shell/src/auth/use-current-user.ts
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@mb/api-sdk";
import type { CurrentUserSnapshot, AppPermission } from "@mb/api-sdk";

export interface CurrentUser {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  permissions: ReadonlySet<AppPermission>;
  roles: ReadonlySet<string>;
  hasPermission(code: AppPermission): boolean;
  hasAnyPermission(...codes: AppPermission[]): boolean;
  hasAllPermissions(...codes: AppPermission[]): boolean;
  isAdmin: boolean;
}

const ANONYMOUS: CurrentUser = {
  isAuthenticated: false,
  userId: null,
  username: null,
  permissions: new Set(),
  roles: new Set(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isAdmin: false,
};

/**
 * 当前用户的读门面——读当前登录用户信息和权限判断。
 *
 * 内部用 useQuery + queryKey ['auth', 'me'] 拉 `/api/v1/auth/me`，
 * staleTime 5 分钟，登录/登出后由 useAuth 主动 invalidate。
 *
 * 对应后端 CurrentUser 接口（mb-common.security.CurrentUser）。
 */
export function useCurrentUser(): CurrentUser {
  const { data } = useQuery<CurrentUserSnapshot>({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    // 401 时不当作错误，返回 null（未登录）
    throwOnError: false,
  });

  if (!data) return ANONYMOUS;

  const permissions = new Set(data.permissions) as ReadonlySet<AppPermission>;
  const roles = new Set(data.roles);

  return {
    isAuthenticated: true,
    userId: data.userId,
    username: data.username,
    permissions,
    roles,
    hasPermission: (code) => permissions.has(code),
    hasAnyPermission: (...codes) => codes.some((c) => permissions.has(c)),
    hasAllPermissions: (...codes) => codes.every((c) => permissions.has(c)),
    isAdmin: roles.has("admin") || permissions.has("*:*:*" as AppPermission),
  };
}
```

### 5.2 useAuth hook

```typescript
// packages/app-shell/src/auth/use-auth.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "@mb/api-sdk";
import type { LoginCmd } from "@mb/api-sdk";

/**
 * 认证写门面——执行登录/登出/刷新等会改变认证状态的操作。
 *
 * 对应后端 AuthFacade（接口在 mb-common.security.AuthFacade，实现在 infra-security.SaTokenAuthFacade）。
 *
 * 注意：本 hook 内部直接调 @mb/api-sdk/auth 的写接口，
 * 由 dependency-cruiser 规则豁免（只在 packages/app-shell/src/auth/** 允许）。
 * features/** 必须通过本 hook 调用，禁止直接 import authApi（MUST NOT #4）。
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: (cmd: LoginCmd) => authApi.login(cmd),
    onSuccess: async (result) => {
      // 1. 双 token 存到 localStorage（access token 由 @mb/api-sdk 拦截器读取，详见 08-contract-client.md §4.1）
      localStorage.setItem("mb_access_token", result.accessToken);
      localStorage.setItem("mb_refresh_token", result.refreshToken);
      // 2. 让 useCurrentUser 重新拉数据
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      // 3. 跳转到原路径或首页
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect") ?? "/";
      navigate({ to: redirect });
    },
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      localStorage.removeItem("mb_access_token");
      localStorage.removeItem("mb_refresh_token");
      // 清空所有 query cache（避免下次登录看到上个用户的数据）
      queryClient.clear();
      navigate({ to: "/auth/login" });
    },
    // 即使后端调用失败也要清前端状态（避免"卡死在登录态")
    onError: () => {
      localStorage.removeItem("mb_access_token");
      localStorage.removeItem("mb_refresh_token");
      queryClient.clear();
      navigate({ to: "/auth/login" });
    },
  });

  return {
    login: login.mutate,
    loginAsync: login.mutateAsync,
    isLoggingIn: login.isPending,
    logout: logout.mutate,
    logoutAsync: logout.mutateAsync,
    isLoggingOut: logout.isPending,
  };
}
```

### 5.3 requireAuth 路由守卫

完整实现见 [06 §3.1](./06-routing-and-data.md#31-工厂函数定义)。本节只强调它和 `useCurrentUser` 的关系：

- `useCurrentUser()` 在**组件层**运行（hook，需要 React context）
- `requireAuth` 的 `beforeLoad` 函数在**路由层**运行（不是 React 组件，不能用 hook）
- 桥梁：`createRouter({ routeTree, context: { queryClient } })` 把 `queryClient` 注入 RouterContext，`beforeLoad` 通过 `await context.queryClient.ensureQueryData(...)` 异步获取用户数据

**关键**：使用 `ensureQueryData` 而不是 `getQueryData`——前者在缓存过期或不存在时会发起请求并等待结果，后者只读缓存（可能拿到 undefined 导致首次访问被错误重定向到登录页）。

```typescript
// routes/_authed.tsx（L5 入口布局路由）
import { createFileRoute, redirect } from "@tanstack/react-router";
import { authApi } from "@mb/api-sdk";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ context }) => {
    // ensureQueryData：缓存有效直接返回；缓存过期或不存在则发请求等结果
    const user = await context.queryClient.ensureQueryData({
      queryKey: ["auth", "me"],
      queryFn: () => authApi.getCurrentUser(),
      staleTime: 5 * 60_000,
    });
    if (!user) {
      throw redirect({ to: "/auth/login", search: { redirect: location.pathname } });
    }
    return { currentUser: user };
  },
  // ...
});
```

### 5.4 features 禁止直调 api-sdk auth 状态接口

**MUST NOT #4** 的精确边界（dependency-cruiser 规则在 [10 §4.4](./10-quality-gates.md)，本节给出语义说明）：

```typescript
// ❌ 禁止：apps/web-admin/src/features/orders/order-detail.tsx
import { authApi } from "@mb/api-sdk";
const me = await authApi.getCurrentUser();  // ❌ dependency-cruiser 报错

// ✅ 正确：apps/web-admin/src/features/orders/order-detail.tsx
import { useCurrentUser } from "@mb/app-shell/auth";
const me = useCurrentUser();

// ✅ 豁免：apps/web-admin/src/routes/auth/login.tsx
import { authApi } from "@mb/api-sdk";  // ✅ routes/auth/** 是登录态的建立者，必须直调
```

**Why 这个豁免**：登录页本身是"还没登录的用户在用"，它就是在调用登录 API 把"未登录态"变成"登录态"。把它强制走 `useAuth` 也行，但 `useAuth` 内部本来就是调 `authApi.login`，多一层包装无意义。明确把 `routes/auth/**` 列为豁免，让规则简单。

---

## 6. 全局 UI 组件 [M3]

### 6.1 Header

Header 不再是独立的全局组件，而是由各 layout preset 自管（见 §4 Layout Resolver 章节）。每个 preset（InsetLayout / MixLayout 等）内部各自实现 header，不对外暴露独立的 `Header` 组件，但所有 preset 的 header 都必须包含以下元素（通过 app-shell 提供的通用组件组装）：

- **品牌链接**：`<Link to="/">`，显示 `t('brand.name')`（InsetLayout 默认；MixLayout 可能用模块切换代替）
- **面包屑**（仅限 InsetLayout）：`<BreadcrumbNav />`，从 `@mb/app-shell` 导出。**当前阶段注意**：`BreadcrumbNav` 作为 app-shell 提供的底座组件已导出，但当前 M3/M4 阶段业务页面（如 Notice 模块）仍用原始 `<Breadcrumb>` 组件手撸面包屑。统一接入方案（如通过 TanStack Router meta 自动生成）推迟到 M6。在此之前业务页面可二选一：(1) 手撸原始 `<Breadcrumb>`（当前做法）；(2) 手动传 `items` 给 `<BreadcrumbNav />`
- **全局搜索占位**：`<GlobalSearchPlaceholder />`（M3 placeholder，真实搜索在 v1.5+）
- **Dark 模式切换**：`<DarkModeToggle />`
- **语言切换**：`<LanguageSwitcher />`
- **主题定制**：`<ThemeCustomizer />`
- **通知徽章**：`<NotificationBadge />`
- **用户菜单**：用户头像 + 下拉菜单（含登出），用 `@mb/ui-primitives` 的 Avatar + DropdownMenu 组装

扩展新 layout preset 时，参考 `packages/app-shell/src/presets/inset/inset-layout.tsx` 的 header JSX 结构。5 套内置 preset 之间的 header 子组件（如 MixUserMenu / MixMobileOverflowMenu / HeaderTabSwitcher）公用部分已抽取到 `components/header-*.tsx`（`claude-*` 三套 preset 共享 HeaderTabSwitcher，详见 [ADR frontend-0025](../../adr/frontend-0025-three-layer-navigation-philosophy.md)）。

### 6.2 Sidebar

Sidebar 不再是独立的全局组件，而是由各 layout preset 自管（见 §4 Layout Resolver 章节）。每个 preset 按自己的骨架渲染菜单树（InsetLayout 有单列 sidebar；MixLayout 有顶部 tab + 二级 sidebar 的两层结构），内部消费 `useMenu()` 拉取 `mb_iam_menu` 树（双树架构的前端消费点，详见 [07-menu-permission.md](./07-menu-permission.md)）。

所有 preset 的 sidebar 渲染都必须遵守：

- **数据来源**：`useMenu()` 内部用 `useQuery` 拉 `/api/v1/menus/current-user`，返回当前用户有权限的菜单子树
- **节点文案**：`node.name` 直接渲染，**不走 `t(...)`**（精确边界：菜单 name 是数据库运维数据，不是代码静态文案，详见 [§7.10](#710-i18n-边界-代码静态文案-vs-数据库数据)）
- **图标解析**：通过 `resolveMenuIcon(node.icon)` 从图标映射表取 Lucide icon
- **路由导航**：叶子节点用 TanStack Router 的 `<Link to={node.path}>`，非叶子节点是分组不可点击
- **折叠态**：InsetLayout 支持 `sidebar-mode='icon'` 只显图标；MixLayout 一级 tab 不折叠、二级 sidebar 的折叠策略由 preset 自定

扩展新 layout preset 时，参考 `packages/app-shell/src/presets/inset/inset-layout.tsx` 与 `packages/app-shell/src/presets/mix/mix-layout.tsx` 的 sidebar JSX 结构。

### 6.3 GlobalLoading 与 GlobalToast 容器

```typescript
// packages/app-shell/src/feedback/toast-container.tsx
import { Toaster } from "@mb/ui-primitives";

/**
 * 全局 Toast 容器——挂在 Provider 树根部，所有 toast.success(...) 调用渲染到这里。
 * 内部基于 @mb/ui-primitives 的 Toast 组件（Radix Toast 封装）。
 */
export function ToastContainer() {
  return <Toaster position="top-right" />;
}
```

```typescript
// packages/app-shell/src/feedback/dialog-container.tsx
import { ConfirmDialogHost } from "@mb/ui-primitives";

/**
 * 全局 Dialog 容器——支持 confirm() / alert() 命令式调用。
 * 内部基于 @mb/ui-primitives 的 AlertDialog 组件。
 */
export function DialogContainer() {
  return <ConfirmDialogHost />;
}
```

### 6.4 GlobalErrorPage 与 GlobalNotFoundPage

详见 [06 §6.2](./06-routing-and-data.md#62-路由级-errorcomponent) 和 [06 §8.1](./06-routing-and-data.md#81-__roottsx-的-notfoundcomponent)。本节只强调：这两个组件**必须**走 i18n（MUST #6），文案 key 在 `packages/app-shell/src/i18n/{zh-CN,en-US}/common.json`。

### 6.5 LanguageSwitcher

```typescript
// packages/app-shell/src/components/language-switcher.tsx
import { DropdownMenu, Button } from "@mb/ui-primitives";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../i18n/use-language";
import { SUPPORTED_LANGUAGES } from "../i18n/i18n-instance";

export function LanguageSwitcher() {
  const { t } = useTranslation("shell");
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("action.switchLanguage")}>
          {SUPPORTED_LANGUAGES[language]?.label ?? language}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
          <DropdownMenu.Item key={code} onClick={() => setLanguage(code as keyof typeof SUPPORTED_LANGUAGES)}>
            {info.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
```

---

## 7. i18n 完整工程 [M2 基础 + M3 完整]

本章完整覆盖 brainstorming 的 8 个 i18n 子决策。i18n 是脚手架的基础设施，**必须在 M2 阶段就搭好骨架**（让 L4 自己的 `shell`/`common` 字典先工作），M3 阶段补完 L5 业务字典注册和 LanguageSwitcher。

### 7.1 初始化 i18n-instance.ts [M2]

**子决策 1**：完整 i18next 实例配置。

```typescript
// packages/app-shell/src/i18n/i18n-instance.ts
import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

// 静态导入 L4 持有的字典（编译期 tree-shake）
import zhCNShell from "./zh-CN/shell.json";
import zhCNCommon from "./zh-CN/common.json";
import enUSShell from "./en-US/shell.json";
import enUSCommon from "./en-US/common.json";

/**
 * 支持的语言清单——使用者扩展新语言时在这里加一行。
 * label 是该语言"自身的名字"（不走 i18n，避免循环）。
 */
export const SUPPORTED_LANGUAGES = {
  "zh-CN": { label: "简体中文" },
  "en-US": { label: "English" },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/** localStorage 的 key（写死，避免和其他 key 冲突） */
export const LANGUAGE_STORAGE_KEY = "mb_i18n_lng";

/** 默认语言（决策 i4：zh-CN 默认 + zh-CN fallback，不做浏览器自动检测） */
export const DEFAULT_LANGUAGE: SupportedLanguage = "zh-CN";

function resolveInitialLanguage(): SupportedLanguage {
  if (typeof localStorage === "undefined") return DEFAULT_LANGUAGE;
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && saved in SUPPORTED_LANGUAGES) {
    return saved as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * 创建 i18n 实例——在 packages/app-shell 入口处导出，
 * apps/web-admin 在 main.tsx 用 <I18nextProvider i18n={i18n}> 装配。
 *
 * 决策对齐：
 * - 子决策 1：react-i18next + 初始化时从 localStorage 恢复 + 不做浏览器检测
 * - 子决策 2：默认 zh-CN，fallback zh-CN（不做 en-US fallback）
 * - 子决策 8：全量加载（resources 一次性 import，无懒加载）
 */
export const i18n: I18nInstance = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  ns: ["shell", "common"],
  resources: {
    "zh-CN": {
      shell: zhCNShell,
      common: zhCNCommon,
    },
    "en-US": {
      shell: enUSShell,
      common: enUSCommon,
    },
  },
  interpolation: {
    escapeValue: false, // React 已经做 XSS escape
  },
  react: {
    useSuspense: false, // 同步加载（全量），不需要 Suspense
  },
});

/**
 * 注册 L5 业务字典的入口（详见 §7.3）。
 * 由 apps/web-admin/src/main.tsx 在创建 root 之前调用。
 */
export function registerResource(
  language: SupportedLanguage,
  namespace: string,
  resource: Record<string, unknown>,
): void {
  i18n.addResourceBundle(language, namespace, resource, true, true);
}
```

### 7.2 字典目录结构 [M2]

**子决策 3**：按层分布 + 按业务模块 namespace。

```
packages/app-shell/src/i18n/                # L4 持有的字典（框架级）
├── i18n-instance.ts
├── use-language.ts
├── zh-CN/
│   ├── shell.json                          # Header / Sidebar / LanguageSwitcher 等 L4 自身文案
│   └── common.json                         # 通用动作（确认/取消/保存）+ 通用错误（404/500/forbidden）
└── en-US/
    ├── shell.json
    └── common.json

apps/web-admin/src/i18n/                    # L5 持有的字典（业务级）
├── zh-CN/
│   ├── order.json                          # 订单业务模块的所有文案
│   ├── customer.json                       # 客户业务模块
│   ├── product.json                        # 商品业务模块
│   └── settings.json                       # 设置页面
└── en-US/
    ├── order.json
    ├── customer.json
    ├── product.json
    └── settings.json
```

**字典内容样例**：

```jsonc
// packages/app-shell/src/i18n/zh-CN/shell.json
{
  "brand": {
    "name": "Meta-Build"
  },
  "auth": {
    "guest": "未登录"
  },
  "action": {
    "logout": "退出登录",
    "switchLanguage": "切换语言",
    "switchTheme": "切换主题"
  }
}
```

```jsonc
// packages/app-shell/src/i18n/zh-CN/common.json
{
  "action": {
    "confirm": "确认",
    "cancel": "取消",
    "save": "保存",
    "delete": "删除",
    "edit": "编辑",
    "create": "新建",
    "search": "搜索",
    "reset": "重置",
    "backToHome": "返回首页",
    "retry": "重试"
  },
  "error": {
    "pageNotFound": "页面不存在",
    "permissionDenied": "无权访问",
    "loadFailed": "加载失败",
    "networkError": "网络错误"
  },
  "validation": {
    "required": "{{field}} 不能为空",
    "tooShort": "{{field}} 长度不能少于 {{min}} 个字符",
    "tooLong": "{{field}} 长度不能超过 {{max}} 个字符"
  }
}
```

```jsonc
// apps/web-admin/src/i18n/zh-CN/order.json
{
  "title": {
    "list": "订单列表",
    "detail": "订单详情 {{orderNo}}"
  },
  "columns": {
    "orderNo": "订单号",
    "customerName": "客户名称",
    "amount": "金额",
    "status": "状态",
    "createdAt": "创建时间"
  },
  "status": {
    "pending": "待发货",
    "shipped": "已发货",
    "delivered": "已签收"
  },
  "action": {
    "backToList": "返回订单列表",
    "ship": "发货",
    "cancel": "取消订单"
  }
}
```

**Why 按层分布**：字典归属"使用方"。L4 的 Header 用到的"退出登录"放在 `packages/app-shell/src/i18n/.../shell.json`；L5 的订单页用到的"订单号"放在 `apps/web-admin/src/i18n/.../order.json`。这样使用者删一个业务模块就连带删它的字典文件，零孤儿文案。

### 7.3 L5 业务字典注册 [M2]

**子决策 4**：用 `import.meta.glob` 批量注册。

```typescript
// apps/web-admin/src/i18n/register.ts
import { registerResource } from "@mb/app-shell/i18n";
import type { SupportedLanguage } from "@mb/app-shell/i18n";

/**
 * 在 main.tsx 创建 root 之前调用，把 L5 业务字典批量注入 i18n 实例。
 *
 * 用 import.meta.glob({ eager: true }) 同步导入所有 JSON——
 * Vite 构建时静态展开为 import 语句（编译期可知，无运行时反射）。
 *
 * 命名约定：
 * - 文件路径：./zh-CN/order.json
 * - namespace：order（文件名去掉 .json）
 * - language：zh-CN（目录名）
 */
export function registerBusinessResources(): void {
  // Vite 静态分析能识别这两个 glob，在 build 时展开为具体的 import
  const zhCNModules = import.meta.glob<{ default: Record<string, unknown> }>(
    "./zh-CN/*.json",
    { eager: true },
  );
  const enUSModules = import.meta.glob<{ default: Record<string, unknown> }>(
    "./en-US/*.json",
    { eager: true },
  );

  registerLanguage("zh-CN", zhCNModules);
  registerLanguage("en-US", enUSModules);
}

function registerLanguage(
  language: SupportedLanguage,
  modules: Record<string, { default: Record<string, unknown> }>,
): void {
  for (const [filePath, mod] of Object.entries(modules)) {
    // ./zh-CN/order.json → order
    const namespace = filePath.replace(/^\.\/[a-zA-Z-]+\//, "").replace(/\.json$/, "");
    registerResource(language, namespace, mod.default);
  }
}
```

```typescript
// apps/web-admin/src/main.tsx 调用方式
import { registerBusinessResources } from "./i18n/register";

registerBusinessResources();   // 必须在 createRoot 之前
// ... 后续 Provider 树装配
```

**Why eager 全量加载**：所有业务字典加起来约 10KB gzip（10 个业务模块 × 1KB），压缩后比一张图标还小。懒加载会引入 fetch 闪烁、code split 复杂度、路由切换时的等待感——典型的 YAGNI。

**业务模块重命名**：使用者把 `order.json` 改名 `sales-order.json`，namespace 自动变成 `sales-order`，所有 `t('order:...')` 调用要同步改成 `t('sales-order:...')`。这是 grep-friendly 的重构，IDE 全局替换即可。

### 7.4 运行时切换 useLanguage hook [M2]

**子决策 5**：localStorage 持久化 + 不 reload + react-i18next 自动 re-render。

```typescript
// packages/app-shell/src/i18n/use-language.ts
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { LANGUAGE_STORAGE_KEY, type SupportedLanguage, SUPPORTED_LANGUAGES } from "./i18n-instance";

/**
 * 运行时语言切换 hook。
 *
 * 决策：
 * - localStorage 持久化（key: mb_i18n_lng）
 * - 不 reload 页面（i18n.changeLanguage 触发 react-i18next 自动 re-render 所有 useTranslation 的组件）
 * - api-sdk 拦截器通过回调读取当前语言同步 Accept-Language（详见 §7.6 + 08 §4.3）
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (!(lang in SUPPORTED_LANGUAGES)) {
        console.warn(`[useLanguage] unsupported language: ${lang}`);
        return;
      }
      // 1. 持久化到 localStorage（下次刷新页面恢复）
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      // 2. 切换 i18n 实例语言（react-i18next 自动 re-render）
      await i18n.changeLanguage(lang);
      // 3. @mb/api-sdk 拦截器通过回调读取当前语言注入 Accept-Language（详见 08 §4.3）
    },
    [i18n],
  );

  return {
    language: i18n.language as SupportedLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
```

### 7.5 LanguageSwitcher 组件

完整代码见 [§6.5](#65-languageswitcher)。这里强调一点：**LanguageSwitcher 内部用 `SUPPORTED_LANGUAGES[lang].label` 作为显示文本，不走 `t(...)`**——每种语言用它"自身的名字"显示（中文显示"简体中文"，英文显示"English"），避免切换时菜单项跟着变化的视觉抖动。

### 7.6 API Accept-Language 自动同步 [M2]

**子决策 6**：`@mb/api-sdk` 的请求拦截器自动从当前语言读取并注入 `Accept-Language` header。

Accept-Language 拦截器通过回调注入获取当前语言（避免 `@mb/api-sdk` 反向依赖 `@mb/app-shell` 形成循环依赖），详见 [08-contract-client.md §4.3](./08-contract-client.md)。

**完整链路**：

```
用户切换语言 → useLanguage().setLanguage('en-US')
              ↓
        localStorage.setItem('mb_i18n_lng', 'en-US')
              ↓
        i18n.changeLanguage('en-US')
              ↓
        react-i18next 重新渲染所有 useTranslation 的组件 → 前端文案变 English
              ↓
        下一次 ordersApi.list() 调用
              ↓
        api-sdk 拦截器 → 回调读取当前语言 → headers.set('Accept-Language', 'en-US')
              ↓
        后端 AcceptHeaderLocaleResolver 识别 → MessageSource 返回 en-US 字符串
              ↓
        ProblemDetail.title / detail 是英文，业务字典数据（菜单 name）也是英文
```

完整 api-sdk 拦截器配置详见 [08-contract-client.md §4.3](./08-contract-client.md)。

### 7.7 TypeScript 类型安全（module augmentation） [M2]

**子决策 7**：通过 i18next 内置的 TypeScript module augmentation 实现类型安全，零额外依赖、零构建步骤。

#### 原理

TypeScript 直接从 JSON 文件推导类型（需要 `tsconfig.json` 的 `resolveJsonModule: true`），通过 `declare module 'i18next'` 扩展 `CustomTypeOptions`，`t('key')` 自动获得类型校验和补全。

#### 类型声明

类型声明收敛到 L5（`apps/web-admin/src/i18n/i18next.d.ts`），统一 import L4 的 `common`/`shell` + L5 自己的业务 JSON。L4 不单独声明——避免 TypeScript interface merge 时 `resources` 属性冲突。

```typescript
// apps/web-admin/src/i18n/i18next.d.ts
// ——唯一的 i18next 类型声明入口，L4 不单独声明 declare module "i18next"

// L4 框架字典
import type common from "@mb/app-shell/i18n/zh-CN/common.json";
import type shell from "@mb/app-shell/i18n/zh-CN/shell.json";

// L5 业务字典
import type order from "./zh-CN/order.json";
import type customer from "./zh-CN/customer.json";
import type product from "./zh-CN/product.json";
import type settings from "./zh-CN/settings.json";

/**
 * 扩展 i18next 的 CustomTypeOptions，让 t('shell:action.logout') / t('order:columns.orderNo')
 * 这类调用获得类型补全。
 *
 * 机制：TypeScript module augmentation——
 * - 直接从 zh-CN JSON 文件推导类型（resolveJsonModule: true）
 * - 注入 i18next 的 CustomTypeOptions
 * - 零额外依赖、零构建步骤
 *
 * L4 的 common/shell 和 L5 的业务字典在此统一声明，
 * 避免 L4/L5 各写一份 declare module 导致 interface merge 时 resources 属性冲突。
 * 新增业务模块字典时在此加一行 import + 一行 resources 声明。
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      // L4 框架字典
      common: typeof common;
      shell: typeof shell;
      // L5 业务字典
      order: typeof order;
      customer: typeof customer;
      product: typeof product;
      settings: typeof settings;
    };
  }
}
```

#### tsconfig 配置

```jsonc
// client/tsconfig.json 局部
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

#### 使用示例

```typescript
// 编译期类型安全：
import { useTranslation } from "react-i18next";

function OrderList() {
  const { t } = useTranslation("order");
  // ✅ 类型推导：t('columns.orderNo') 是合法 key
  return <th>{t("columns.orderNo")}</th>;
  // ❌ 编译失败：t('columns.notExist') 类型推导出错
}
```

**Why 不用 `i18next-resources-for-ts`**：module augmentation 是 i18next 官方推荐的类型安全方案，零额外依赖、零构建步骤、零 generated 文件。TypeScript 直接从源 JSON 推导，改了字典 IDE 立即报错，不需要跑任何生成命令。

### 7.8 完整性校验脚本 [M2]

**子决策 7（继续）**：CI 硬失败 + 本地手动命令 `pnpm check:i18n`。不做 dev 模式热检查（YAGNI）。

```typescript
// client/scripts/check-i18n.ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, basename, extname } from "node:path";

/**
 * i18n 完整性校验脚本（~40 行核心逻辑）。
 *
 * 职责：对比每对语言下相同 namespace 的 key 集合，任一缺失即失败。
 *
 * 触发时机：
 * - CI: pnpm check:i18n  → 硬失败（缺 key 阻断 PR 合入）
 * - 本地: pnpm check:i18n  → 开发者手动跑（例如改完字典之后）
 *
 * 不做的事：
 * - 不做 dev 模式热检查（开发时频繁加 key 的过程会被噪音打断）
 * - 不检查值的格式（如 {{var}} 数量是否一致），M6 时再补
 */

interface Dictionary {
  language: string;
  namespace: string;
  filePath: string;
  keys: Set<string>;
}

const DICT_DIRS = [
  resolve(__dirname, "../packages/app-shell/src/i18n"),
  resolve(__dirname, "../apps/web-admin/src/i18n"),
];

function loadDicts(rootDir: string): Dictionary[] {
  const result: Dictionary[] = [];
  for (const lang of readdirSync(rootDir)) {
    const langDir = resolve(rootDir, lang);
    if (!statSync(langDir).isDirectory()) continue;
    for (const file of readdirSync(langDir)) {
      if (extname(file) !== ".json") continue;
      const filePath = resolve(langDir, file);
      const data = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
      result.push({
        language: lang,
        namespace: basename(file, ".json"),
        filePath,
        keys: collectKeys(data, ""),
      });
    }
  }
  return result;
}

function collectKeys(obj: unknown, prefix: string): Set<string> {
  const keys = new Set<string>();
  if (typeof obj !== "object" || obj === null) return keys;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      for (const sub of collectKeys(v, path)) keys.add(sub);
    } else {
      keys.add(path);
    }
  }
  return keys;
}

function compare(dicts: Dictionary[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  // 按 namespace 分组对比每对语言
  const byNs = new Map<string, Dictionary[]>();
  for (const d of dicts) {
    const arr = byNs.get(d.namespace) ?? [];
    arr.push(d);
    byNs.set(d.namespace, arr);
  }
  for (const [ns, group] of byNs) {
    if (group.length < 2) {
      errors.push(`namespace "${ns}" 只有一种语言: ${group.map((d) => d.language).join(", ")}`);
      continue;
    }
    const reference = group[0];
    for (const other of group.slice(1)) {
      const missing = [...reference.keys].filter((k) => !other.keys.has(k));
      const extra = [...other.keys].filter((k) => !reference.keys.has(k));
      if (missing.length > 0) {
        errors.push(`[${ns}] ${other.language} 缺少 key（参照 ${reference.language}）: ${missing.join(", ")}`);
      }
      if (extra.length > 0) {
        errors.push(`[${ns}] ${other.language} 多出 key（参照 ${reference.language}）: ${extra.join(", ")}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

function main(): void {
  const allDicts = DICT_DIRS.flatMap((dir) => loadDicts(dir));
  const { ok, errors } = compare(allDicts);
  if (!ok) {
    console.error("[check:i18n] 字典 key 不一致：");
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`[check:i18n] OK，校验了 ${allDicts.length} 个字典文件`);
}

main();
```

**package.json 脚本**：

```jsonc
// client/package.json 局部
{
  "scripts": {
    "check:i18n": "tsx scripts/check-i18n.ts",
    "check:env": "tsx scripts/check-env.ts",
    "check:theme": "tsx scripts/check-theme.ts",
    "lint": "biome check . && stylelint \"**/*.css\""
  }
}
```

**CI 集成**：

```yaml
# .github/workflows/ci.yml 局部
- name: Check i18n integrity
  run: pnpm -C client check:i18n
```

### 7.9 使用者扩展新语言的 3 步 [M3]

| 步骤 | 操作 |
|------|------|
| **1. 加目录和字典** | `mkdir packages/app-shell/src/i18n/fr-FR && cp packages/app-shell/src/i18n/zh-CN/*.json packages/app-shell/src/i18n/fr-FR/` 然后翻译；同样在 `apps/web-admin/src/i18n/fr-FR/` 复制业务字典并翻译 |
| **2. 注册到 SUPPORTED_LANGUAGES** | 编辑 `packages/app-shell/src/i18n/i18n-instance.ts`，在 `SUPPORTED_LANGUAGES` 加 `'fr-FR': { label: 'Français' }`；在 `i18n.init({ resources })` 加 `'fr-FR': { shell: frFRShell, common: frFRCommon }` |
| **3. 跑校验脚本** | `pnpm -C client check:i18n` 验证所有 namespace 在三种语言下 key 一致；如果想改默认语言，改 `DEFAULT_LANGUAGE` 常量 |

**复杂度**：约 30 分钟（不含翻译时间）。后端的 `messages_fr_FR.properties` 同步增加（详见 [backend/06-api-and-contract.md §4](../backend/06-api-and-contract.md#4-i18n-国际化-m4)）。

### 7.10 i18n 边界 代码静态文案 vs 数据库数据

这是 MUST #6 的精确边界，也是 brainstorming 阶段反复讨论后的明确结论：

| 类型 | 例子 | 是否走 i18n |
|------|------|-----------|
| **代码中的静态文案** | 按钮"保存"、表格列头"订单号"、Toast"操作成功"、错误提示 | ✅ **必须**走 `t('...')`（MUST #6） |
| **数据库存储的运维数据** | `mb_iam_menu.name`（菜单名"订单管理"）、`mb_dict_item.label`（字典选项"待处理"）、用户输入的业务数据 | ❌ **永不**走 i18n，直接渲染 |
| **后端返回的错误消息** | `ProblemDetail.title` / `detail` | ⚠ 走后端 i18n（`Accept-Language` 协商，由 `MessageSource` 渲染），前端拿到的已经是目标语言的字符串，前端**不**做二次 `t(...)` |

**Why 数据库数据不走 i18n**：

1. **i18n 是开发者写的字典**——key 在代码里，value 在 JSON 里，CI 校验 key 一致性。运维改菜单名是改数据库，绕开了所有这些机制
2. **多语言的运维数据需要 `mb_iam_menu_i18n` 这种专门的副表**——v1 阶段不做（YAGNI），v1.5+ 如果有需求再加
3. **菜单名是面向"运维人员"的，不是面向"终端用户"的**——运维设置中文菜单名"订单管理"，所有用户（包括看 English UI 的）都看到"订单管理"是合理的（运维语境一致）

具体例子（错误示范）：

```typescript
// ❌ 错误：试图把数据库数据走 i18n
function SidebarItem({ node }: { node: MenuTreeNode }) {
  const { t } = useTranslation("menu");
  return <span>{t(node.name)}</span>;  // ❌ node.name 是数据库字段，不是 i18n key
}

// ✅ 正确：直接渲染
function SidebarItem({ node }: { node: MenuTreeNode }) {
  return <span>{node.name}</span>;  // ✅ 数据库数据直接显示
}
```

具体例子（正确示范）：

```typescript
// ✅ 正确：按钮文案走 i18n
function SaveButton() {
  const { t } = useTranslation("common");
  return <button>{t("action.save")}</button>;
}

// ✅ 正确：表格列头走 i18n（业务模块 namespace）
function OrderTable() {
  const { t } = useTranslation("order");
  const columns = [{ accessorKey: "orderNo", header: t("columns.orderNo") }];
  return <NxTable columns={columns} data={[]} />;
}
```

### 7.11 8 个子决策的落地对照表

| # | 子决策 | 落地章节 | 落地代码 |
|---|--------|---------|---------|
| 1 | 初始化（react-i18next + lng 从 localStorage 恢复 + fallback zh-CN） | §7.1 | `i18n-instance.ts` |
| 2 | 默认 zh-CN + fallback zh-CN，不做浏览器自动检测 | §7.1 | `DEFAULT_LANGUAGE` 常量 + `resolveInitialLanguage()` |
| 3 | 字典按层分布 + 按业务模块 namespace | §7.2 | 目录结构 + 文件命名 |
| 4 | L5 业务字典通过 `import.meta.glob` 批量注册 | §7.3 | `register.ts` + `registerBusinessResources` |
| 5 | localStorage 持久化 + 不 reload + react-i18next 自动 re-render | §7.4 | `useLanguage` hook |
| 6 | api-sdk 拦截器自动注入 `Accept-Language`（回调注入，避免循环依赖） | §7.6 | 详见 08-contract-client.md §4.3 |
| 7 | TypeScript module augmentation 类型安全 + CI 完整性校验 + 不做 dev 热检查 | §7.7 + §7.8 | `i18next.d.ts` + `check-i18n.ts` |
| 8 | 全量加载（约 10KB gzip） | §7.1 静态 import + §7.3 eager glob | （无懒加载代码） |

---

## 8. L4 文件清单 [M3]

```
packages/app-shell/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                        # 总导出
    ├── auth/
    │   ├── index.ts
    │   ├── types.ts
    │   ├── use-current-user.ts         # §5.1
    │   ├── use-auth.ts                 # §5.2
    │   └── require-auth.ts             # §5.3 工厂（详见 06 §3）
    ├── data/
    │   ├── index.ts
    │   └── query-client.ts             # createQueryClient（详见 06 §5）
    ├── theme/
    │   ├── index.ts
    │   ├── style-provider.tsx          # data-style / data-mode 切换
    │   └── use-style.ts
    ├── i18n/
    │   ├── index.ts
    │   ├── i18n-instance.ts            # §7.1
    │   ├── i18n-provider.tsx
    │   ├── types.ts
    │   ├── use-language.ts             # §7.4
    │   ├── zh-CN/                      # §7.7 类型声明已收敛到 L5（apps/web-admin/src/i18n/i18next.d.ts）
    │   │   ├── shell.json              # §7.2
    │   │   └── common.json
    │   └── en-US/
    │       ├── shell.json
    │       └── common.json
    ├── menu/
    │   ├── index.ts
    │   ├── use-menu.ts                 # 详见 07-menu-permission §8
    │   ├── types.ts
    │   └── icon-resolver.ts            # 详见 07-menu-permission §8.4（实际文件名 icon-resolver.ts）
    ├── layouts/
    │   ├── index.ts
    │   ├── layout-resolver.tsx         # §3.1
    │   ├── layout-preset-context.ts
    │   ├── layout-preset-provider.tsx
    │   ├── registry-core.ts            # LayoutRegistry class（无循环依赖）
    │   ├── registry-core.test.ts
    │   ├── registry.ts                 # §3.2 side-effect 入口（注册默认 preset）
    │   ├── types.ts                    # ShellLayoutProps / LayoutPresetDef
    │   ├── use-layout-preset.ts
    │   └── basic-layout.tsx            # §3.4
    ├── presets/
    │   ├── inset/
    │   │   ├── index.ts
    │   │   └── inset-layout.tsx        # header + sidebar 合并在单文件（无独立 inset-header/inset-sidebar）
    │   └── mix/
    │       ├── index.ts
    │       └── mix-layout.tsx          # header + tabs + sidebar 合并在单文件
    ├── components/                     # 通用 header 组件（由各 preset 自行组合）
    │   ├── breadcrumb-nav.tsx          # BreadcrumbNav（见 §6.1 当前阶段注意）
    │   ├── dark-mode-toggle.tsx
    │   ├── global-search-placeholder.tsx
    │   ├── language-switcher.tsx       # §6.5
    │   ├── notification-badge.tsx
    │   └── theme-customizer.tsx        # ThemeCustomizer（在 components/ 下，无独立 customizer/ 目录）
    ├── sse/
    │   ├── index.ts
    │   ├── event-bus.ts
    │   ├── use-sse-connection.ts
    │   └── use-sse-subscription.ts
    ├── feedback/
    │   ├── index.ts
    │   ├── toast-container.tsx         # §6.3
    │   └── dialog-container.tsx        # §6.3
    └── error/
        ├── index.ts
        ├── global-error-boundary.tsx   # §4.2
        ├── global-error-page.tsx
        └── global-not-found-page.tsx   # §6.4
```

---

## 9. L4 与后端的对应关系 [M3+M4]

| 前端 L4 | 后端 |
|---------|------|
| `useCurrentUser()` | `CurrentUser` 接口（[backend/05-security.md §6](../backend/05-security.md#6-currentuser-门面层设计adr-0005)） |
| `useAuth().login()` / `useAuth().logout()` | `AuthFacade` 接口（[backend/05-security.md §6.6](../backend/05-security.md#66-authfacade登录登出技术门面)） |
| `useMenu()` | `mb_iam_menu` 表 + `MenuApi`（详见 [07-menu-permission.md §8](./07-menu-permission.md#8-前端-usemenu-hook)） |
| i18n `Accept-Language` 拦截器 | `MessageSource` + `AcceptHeaderLocaleResolver`（[backend/06-api-and-contract.md §4](../backend/06-api-and-contract.md#4-i18n-国际化-m4)） |
| `GlobalErrorBoundary` 接 React render error | 后端 `GlobalExceptionHandler` 接 Java exception（[backend/06-api-and-contract.md §2](../backend/06-api-and-contract.md#2-globalexceptionhandler-处理范围-m4)） |
| `AppPermission` 联合类型（来自 `@mb/api-sdk`） | `@RequirePermission` + 权限点字符串清单（[backend/05-security.md §2.1](../backend/05-security.md#21-权限点命名规范)） |

---

<!-- verify: cd client && pnpm -F @mb/app-shell tsc --noEmit -->
<!-- verify: cd client && pnpm -F @mb/app-shell test -->
<!-- verify: cd client && pnpm check:i18n -->

[← 返回 README](./README.md)
