# 06 - 路由与数据

> **关注点**：TanStack Router 文件路由约定 + 路由守卫工厂 `requireAuth` + TanStack Query 全局配置 + `loader` / `beforeLoad` 数据加载模式 + Loading / Error 边界 + 列表-详情数据流 + 404 兜底。
>
> **本文件吸收前端 brainstorming 决策**：路由 = 文件路由（routes/\*\* 是唯一合法位置）、数据 = `loader + TanStack Query` 双层缓存、权限 = `requireAuth({ permission })` 路由级守卫、错误 = 路由级 `errorComponent` + 全局 `ErrorBoundary` 兜底。
>
> **前置阅读**：[05-app-shell.md](./05-app-shell.md)（提供 `useCurrentUser` / `useAuth` / Provider 树）。本文件假定 L4 已经把 `RouterProvider` / `QueryClientProvider` / `I18nProvider` 装好。

---

## 1. 决策结论 [M3]

| # | 维度 | 结论 |
|---|------|------|
| 1 | 路由声明位置 | **`apps/web-admin/src/routes/**/*.tsx` 是唯一合法位置**（MUST NOT #5）。其他位置写 `createFileRoute(...)` = `routeTree.gen.ts` 看不到 = 路由不生效 |
| 2 | 路由树生成 | `@tanstack/router-vite-plugin` 在 `vite dev` / `vite build` 时扫描 `routes/` 自动生成 `apps/web-admin/src/routeTree.gen.ts`，**入 git** |
| 3 | 路由守卫 | 工厂函数 `requireAuth({ permission })` 返回 `beforeLoad` 函数，在 `loader` 之前运行；权限不足 `throw redirect({ to: '/auth/login' })` |
| 4 | 数据加载 | **双层**：路由 `loader` 拿首屏数据（保证 SSR / preload 友好），组件内 `useQuery` 复用同一 `queryKey`（拿到列表后跳详情走缓存） |
| 5 | URL 状态 | `validateSearch: z.object({...})` Zod schema 校验，编译期类型推导，禁止裸 `new URLSearchParams` |
| 6 | TanStack Query 默认值 | `staleTime: 5*60*1000` / `gcTime: 30*60*1000` / `retry: 1` / `refetchOnWindowFocus: false` |
| 7 | 错误边界 | 路由级 `errorComponent` 处理 4xx / 5xx；最外层 `ErrorBoundary`（在 [05 §4.1](./05-app-shell.md#41-errorboundary-最外层)）兜底 React render error |
| 8 | 404 | `routes/__root.tsx` 的 `notFoundComponent` 兜底；TanStack Router 找不到匹配自动落到这里 |

---

## 2. TanStack Router 文件路由 [M3]

### 2.1 routes 目录约定

```
apps/web-admin/src/routes/
├── __root.tsx                      # 根路由（全局 Layout / Outlet / notFoundComponent）
├── index.tsx                       # /                  首页（Dashboard）
├── auth/
│   ├── login.tsx                   # /auth/login        登录页（不需要登录态）
│   └── forgot-password.tsx         # /auth/forgot-password
├── _authed/                        # 布局路由（无 URL 段，约束子路由必须登录）
│   ├── _authed.tsx                 # 布局组件 + beforeLoad: requireAuth()
│   ├── orders/
│   │   ├── index.tsx               # /orders            订单列表
│   │   └── $id.tsx                 # /orders/$id        订单详情
│   ├── customers/
│   │   ├── index.tsx               # /customers
│   │   └── $id.tsx                 # /customers/$id
│   └── settings/
│       ├── index.tsx               # /settings
│       ├── menu.tsx                # /settings/menu     菜单管理
│       └── role.tsx                # /settings/role     角色管理
└── 404.tsx                         # 显式 404（可选；__root 的 notFoundComponent 已兜底）
```

**目录约定（TanStack Router 文件路由的硬规则）**：

| 文件名格式 | 含义 |
|-----------|------|
| `__root.tsx` | 根路由（双下划线前缀），所有路由的祖先 |
| `index.tsx` | 当前目录的"/"路由（如 `orders/index.tsx` → `/orders`） |
| `$param.tsx` | 动态参数（如 `$id.tsx` → `:id`） |
| `_layout/` | 布局段（下划线前缀），不出现在 URL 里，但子路由共享同一个 Layout |
| `_layout.tsx` | 配套的布局组件文件 |

**为什么不允许在其他位置写 `createFileRoute`**：

`@tanstack/router-vite-plugin` 通过文件系统扫描生成 `routeTree.gen.ts`，扫描根目录是 `apps/web-admin/src/routes/`。把 `createFileRoute(...)` 写在 `features/orders/order-route.tsx` 里 → 插件看不到 → `routeTree.gen.ts` 没有这条路由 → 运行时 404。这是 TanStack Router 的硬约定，靠自觉守不住，所以放进 MUST NOT #5（dependency-cruiser 规则禁止非 `routes/**` 文件 import `createFileRoute`）。

### 2.2 routeTree.gen.ts 构建产物

```typescript
// apps/web-admin/src/routeTree.gen.ts —— 由 @tanstack/router-vite-plugin 自动生成
// !!! 不要手动编辑 !!! 改 routes/ 目录下的文件然后让 vite 重新生成

import { Route as rootRoute } from "./routes/__root";
import { Route as IndexRoute } from "./routes/index";
import { Route as OrdersIndexRoute } from "./routes/_authed/orders/index";
import { Route as OrderDetailRoute } from "./routes/_authed/orders/$id";
// ... 其他自动生成的 import

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  // ...
]);

// 自动生成的类型补全（让 useNavigate / Link 能在 IDE 里推导出所有合法路由）
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

**git 策略**：**入 git**。理由：
1. 让 `git diff` 能看到路由结构变化（新增/删除路由的 PR 一目了然）
2. 让没装 vite 的工具（CI 静态扫描、依赖分析）也能读懂路由树
3. 防止某些 IDE 在没运行 dev server 时类型推导失效

### 2.3 根路由 \_\_root.tsx 骨架

```typescript
// apps/web-admin/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import type { CurrentUser } from "@mb/app-shell/auth";
import { GlobalErrorPage } from "@mb/app-shell/error";
import { GlobalNotFoundPage } from "@mb/app-shell/error";
import { GlobalLoading } from "@mb/app-shell/loading";

/**
 * 根路由的 RouterContext。
 * 通过 createRouter({ context: { queryClient, currentUser } }) 注入，
 * 子路由的 beforeLoad / loader 通过 ({ context }) 访问。
 */
export interface RouterContext {
  queryClient: QueryClient;
  /** 由 L4 的 useCurrentUser() 暴露的 currentUser snapshot；未登录时为 null */
  currentUser: CurrentUser | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: GlobalErrorPage,
  notFoundComponent: GlobalNotFoundPage,
  pendingComponent: GlobalLoading,
});

function RootComponent() {
  return <Outlet />;
}
```

### 2.4 布局路由 \_authed.tsx 骨架

布局路由用下划线前缀（`_authed`），不出现在 URL 里，但所有子路由都被它包裹：

```typescript
// apps/web-admin/src/routes/_authed/_authed.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarLayout } from "@mb/app-shell/layouts";
import { authApi } from "@mb/api-sdk";

export const Route = createFileRoute("/_authed")({
  // 布局路由统一守卫：未登录跳转 /auth/login
  // 使用 ensureQueryData 保证缓存中有用户数据（异步，首次会发请求）
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: ['auth', 'me'],
      queryFn: () => authApi.getCurrentUser(),
      staleTime: 5 * 60_000,
    })
    if (!user) {
      throw redirect({ to: '/auth/login' })
    }
    return { currentUser: user }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
}
```

**Why 布局路由**：把 `ensureQueryData` 认证守卫 / `<SidebarLayout>` 写在一个地方，子路由（`orders` / `customers` / `settings`）零样板代码就能享受统一布局和登录态守卫。子路由的 `requireAuth({ permission })` 只做权限检查，不再负责登录态判断。

---

## 3. 路由守卫工厂 requireAuth [M3]

### 3.1 工厂函数定义

```typescript
// packages/app-shell/src/auth/require-auth.ts
import { redirect } from "@tanstack/react-router";
import type { ParsedLocation } from "@tanstack/react-router";
import type { RouterContext } from "../router/context";
import type { AppPermission } from "@mb/api-sdk";

export interface RequireAuthOptions {
  /**
   * 需要的权限点。不传 = 仅检查"是否登录"，不检查具体权限。
   * 类型来自 @mb/api-sdk 同步的 AppPermission 联合类型，IDE 自动补全所有合法权限点。
   */
  permission?: AppPermission;
}

/**
 * 路由守卫工厂。返回一个 beforeLoad 函数，在 loader 之前同步执行。
 *
 * 用法（在 routes/_authed/_authed.tsx 或单个路由文件里）：
 *   beforeLoad: requireAuth({ permission: 'order.read' })
 *
 * 决策来源：brainstorming 阶段确认"前端 requireAuth ↔ 后端 @RequirePermission" 共享同一份 AppPermission 清单。
 * 详见 docs/specs/frontend/07-menu-permission.md §6（权限一致性）和
 *       docs/specs/backend/05-security.md §2（@RequirePermission）。
 */
export function requireAuth(options: RequireAuthOptions = {}) {
  return ({ context, location }: { context: RouterContext; location: ParsedLocation }) => {
    const { currentUser } = context;

    // 第 1 道：未登录 → 跳登录页（带 redirect 参数）
    if (!currentUser || !currentUser.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }

    // 第 2 道：登录但没权限 → 403 页面（throw 一个 ForbiddenError，errorComponent 接住）
    if (options.permission && !currentUser.permissions.has(options.permission)) {
      throw new ForbiddenError(options.permission);
    }
  };
}

export class ForbiddenError extends Error {
  readonly code = "auth.permissionDenied" as const;
  constructor(public readonly permission: string) {
    super(`Permission denied: ${permission}`);
    this.name = "ForbiddenError";
  }
}
```

### 3.2 与 useCurrentUser 的关系

- `requireAuth` 在**路由层**运行（`beforeLoad` 是路由生命周期的一部分），通过 `RouterContext.currentUser` 拿到当前用户的快照
- `useCurrentUser()` 在**组件层**运行（详见 [05 §5.1](./05-app-shell.md#51-usecurrentuser-hook)），从 `QueryClient` 缓存里读同一份数据
- 数据源是统一的：`_authed.tsx` 的 `beforeLoad` 通过 `await queryClient.ensureQueryData({ queryKey: ['auth', 'me'] })` 拿到当前用户快照并传入子路由 context，每次登录/登出后调用 `router.invalidate()` 刷新

**Why 不在 beforeLoad 里直接调 hook**：`beforeLoad` 不是 React 组件，不能调 hook。必须通过 RouterContext 把数据"端"进去。

### 3.3 权限检查失败的 fallback

| 场景 | 抛出 | 谁接住 | 用户看到 |
|------|------|--------|---------|
| 未登录 | `redirect({ to: '/auth/login' })` | TanStack Router 内置 | 自动 302 到登录页，URL 带 `?redirect=<原路径>` |
| 已登录但缺权限 | `new ForbiddenError(permission)` | 路由的 `errorComponent`（默认是 `__root` 的 `GlobalErrorPage`） | 403 页面 + "联系管理员"按钮 |
| 后端返回 401（token 过期） | `@mb/api-sdk` 拦截器（详见 `08-contract-client.md` §5） | 全局 `GlobalErrorHandler` | 自动跳登录页 + Toast 提示"会话已过期" |

---

## 4. 数据加载模式 [M3]

### 4.1 loader 模式

TanStack Router 的 `loader` 在路由匹配时（导航开始前）运行，**保证**首屏数据已经准备好：

```typescript
// apps/web-admin/src/routes/_authed/orders/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAuth } from "@mb/app-shell/auth";
import { ordersApi } from "@mb/api-sdk";

const orderListSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  size: z.number().int().min(10).max(100).default(20),
  status: z.enum(["all", "pending", "shipped", "delivered"]).default("all"),
  q: z.string().optional(),
});

export const Route = createFileRoute("/_authed/orders/")({
  // 1. URL search 参数类型校验（编译期 + 运行时）
  validateSearch: orderListSearchSchema,

  // 2. 路由级权限守卫（早于 loader 运行）
  beforeLoad: requireAuth({ permission: "order.read" }),

  // 3. loader 依赖 search 的哪些字段（变化时重新跑 loader）
  loaderDeps: ({ search }) => ({
    page: search.page,
    size: search.size,
    status: search.status,
    q: search.q,
  }),

  // 4. 数据加载（首屏 + 翻页/筛选都会触发）
  loader: async ({ context, deps }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["orders", "list", deps],
      queryFn: () =>
        ordersApi.list({
          page: deps.page,
          size: deps.size,
          status: deps.status === "all" ? undefined : deps.status,
          q: deps.q,
        }),
    });
  },

  component: OrderListPage,
});

function OrderListPage() {
  // 组件内可以直接拿 loader 的结果（编译期类型推导）
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div>
      {/* 列表渲染 + 分页 + 筛选交互（NxTable 详见 04-ui-patterns.md） */}
      {data.content.map((order) => (
        <a key={order.id} href={`/orders/${order.id}`}>
          {order.orderNo}
        </a>
      ))}
    </div>
  );
}
```

### 4.2 beforeLoad vs loader 的执行顺序

| 阶段 | 作用 | 失败后果 |
|------|------|---------|
| `validateSearch` | URL 参数解析 + 类型校验 | 抛 ZodError → 路由 errorComponent |
| `beforeLoad` | 鉴权 / 全局准备 | 抛 redirect / Error → 路由 errorComponent |
| `loaderDeps` | 计算 loader 依赖（决定是否重跑 loader） | 不抛错（纯函数） |
| `loader` | 数据加载 | 抛 Error → 路由 errorComponent |
| `component` | 渲染 | React render error → errorComponent / 全局 ErrorBoundary |

**关键**：`beforeLoad` 早于 `loader`，所以**没权限的情况下根本不会发起 API 调用**——这避免了"先 fetch 拿到 401 再跳登录页"的浪费。

### 4.3 loaderDeps + validateSearch 的协作

**问题**：URL 是 `/orders?page=2&status=pending`，用户点了"下一页"变成 `?page=3&status=pending`。能不能只重跑 loader 不重新挂载组件？

**答案**：用 `loaderDeps`。TanStack Router 会对比前后两次的 `loaderDeps` 返回值（深比较），不一致才重跑 `loader`。组件实例不重新挂载，只是 `useLoaderData()` 拿到新数据。

```typescript
// 切换页码时，TanStack Router 自动：
// 1. 重新解析 URL search → orderListSearchSchema 校验
// 2. 重新计算 loaderDeps → { page: 3, size: 20, status: 'pending', q: undefined }
// 3. 对比上次 deps：page 不同 → 重跑 loader
// 4. ensureQueryData 检查 queryKey ['orders', 'list', { page: 3, ... }]：
//    - cache hit 且未 stale → 直接返回缓存（5 分钟内翻页是即时的）
//    - cache miss / stale → 发起 API
// 5. component 不重新挂载，只是 useLoaderData() 拿到新值
```

**Why 不直接用 `useQuery`**：`useQuery` 在组件 render 后才发起 API，导致首屏先 loading 后内容（"loading flash"）。`loader + ensureQueryData` 让导航在数据 ready 后才发生，无 loading flash（默认行为；想要 progressive 也可以 `defer`）。

---

## 5. TanStack Query 全局配置 [M3]

```typescript
// packages/app-shell/src/data/query-client.ts
import { QueryClient } from "@tanstack/react-query";
import { isProblemDetail } from "@mb/api-sdk";

/**
 * 全局 QueryClient 单例配置。
 *
 * 决策来源：brainstorming 确认"务实方案"——5 分钟 staleTime 覆盖大部分业务场景，
 * 不开启 windowFocus refetch（避免切回 tab 时的请求风暴），retry 1 次（避免对错误请求重试 3 次）。
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 5 分钟内复用缓存（翻页/详情返回不重新请求）
        staleTime: 5 * 60 * 1000,
        // 30 分钟后清除内存缓存
        gcTime: 30 * 60 * 1000,
        // 失败重试 1 次（4xx 不重试，5xx 重试 1 次）
        retry: (failureCount, error) => {
          if (isProblemDetail(error) && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
        // 切回 tab 不自动 refetch（避免请求风暴）
        refetchOnWindowFocus: false,
        // 网络重连不自动 refetch
        refetchOnReconnect: false,
      },
      mutations: {
        // mutation 失败不重试（写操作必须用户主动重试）
        retry: false,
      },
    },
  });
}
```

**与 loader 的配合**：`loader` 内部用 `context.queryClient.ensureQueryData(...)`，本质上是"如果 cache 里有未 stale 的数据就直接用，否则发起请求"。`useQuery` 用同样的 `queryKey` 拿到的就是 loader 注入的缓存——**列表 → 详情 → 返回列表** 的整个流程零冗余请求。

### 5.1 DevTools 集成

```typescript
// apps/web-admin/src/main.tsx —— 仅 dev 模式加载
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// 在 ReactQuery Provider 内挂载（详见 05-app-shell.md §4）
{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
```

---

## 6. Loading 与 Error 边界 [M3]

### 6.1 路由级 pendingComponent

`loader` 异步执行时（数据还没到），TanStack Router 渲染该路由的 `pendingComponent`：

```typescript
// apps/web-admin/src/routes/_authed/orders/index.tsx 局部
import { createFileRoute } from "@tanstack/react-router";
import { NxLoading } from "@mb/ui-patterns";

export const Route = createFileRoute("/_authed/orders/")({
  // ... validateSearch / beforeLoad / loader / component
  pendingComponent: () => <NxLoading variant="skeleton-table" rows={10} />,
  // 等待 loader 超过 200ms 才展示 pendingComponent（避免一闪而过的骨架屏）
  pendingMs: 200,
  // 至少展示 500ms 避免抖动
  pendingMinMs: 500,
});
```

### 6.2 路由级 errorComponent

`loader` 抛错或组件 render error → 渲染 `errorComponent`：

```typescript
import { ErrorComponentProps } from "@tanstack/react-router";
import { ProblemDetailError } from "@mb/api-sdk";
import { ForbiddenError } from "@mb/app-shell/auth";

export const Route = createFileRoute("/_authed/orders/")({
  // ...
  errorComponent: OrderListErrorPage,
});

function OrderListErrorPage({ error, reset }: ErrorComponentProps) {
  // 区分错误类型给出不同 UI
  if (error instanceof ForbiddenError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">无权访问该页面</h2>
        <p className="mt-2 text-muted-foreground">缺少权限：{error.permission}</p>
      </div>
    );
  }

  if (error instanceof ProblemDetailError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">{error.title}</h2>
        <p className="mt-2 text-muted-foreground">{error.detail}</p>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={reset}
        >
          重试
        </button>
      </div>
    );
  }

  // 兜底：未识别的 error
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-destructive">加载失败</h2>
      <button
        type="button"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        onClick={reset}
      >
        重试
      </button>
    </div>
  );
}
```

### 6.3 全局 ErrorBoundary 兜底

最外层 `ErrorBoundary`（在 `@mb/app-shell` 的 Provider 树最外层，详见 [05 §4.1](./05-app-shell.md#41-errorboundary-最外层)）兜底**所有路由 errorComponent 都没接住的 React render error**。这是 React 的硬规则：组件 render 阶段抛错只能被 ErrorBoundary 接，不能被 try-catch 接。

```
异常分发链路：
  loader 抛错
    → 路由 errorComponent（如果有）
    → 父路由 errorComponent（如果有）
    → __root.tsx 的 errorComponent (GlobalErrorPage)

  组件 render 抛错
    → 路由 errorComponent（如果有）
    → __root.tsx 的 errorComponent
    → 最外层 ErrorBoundary（@mb/app-shell 的 GlobalErrorBoundary）→ 白屏防御
```

---

## 7. 列表路由 + 详情路由的数据流 [M3]

### 7.1 routes/\_authed/orders/$id.tsx（详情）

```typescript
// apps/web-admin/src/routes/_authed/orders/$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAuth } from "@mb/app-shell/auth";
import { ordersApi } from "@mb/api-sdk";

export const Route = createFileRoute("/_authed/orders/$id")({
  // 路径参数校验（"id" 必须是数字字符串）
  parseParams: ({ id }) => ({ id: z.coerce.number().int().parse(id) }),
  stringifyParams: ({ id }) => ({ id: String(id) }),

  beforeLoad: requireAuth({ permission: "order.read" }),

  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["orders", "detail", params.id],
      queryFn: () => ordersApi.getById(params.id),
    });
  },

  component: OrderDetailPage,
  errorComponent: OrderDetailErrorPage,
  pendingComponent: () => <NxLoading variant="skeleton-detail" />,
});

function OrderDetailPage() {
  const order = Route.useLoaderData();
  return <div>订单号：{order.orderNo}</div>;
}

function OrderDetailErrorPage({ error }: { error: Error }) {
  return <div>加载订单失败：{error.message}</div>;
}
```

### 7.2 列表 → 详情 → 返回列表的缓存复用

```
1. 用户访问 /orders?page=1 → loader 发起 API → 缓存 ['orders', 'list', { page: 1, size: 20, status: 'all' }]
2. 用户点击订单 #123 → 导航到 /orders/123 → loader 发起新 API → 缓存 ['orders', 'detail', 123]
3. 用户点"返回" → 浏览器 history.back() → URL 回到 /orders?page=1
4. TanStack Router 重新跑 loader：
   - validateSearch 解析 → page=1
   - loaderDeps: { page: 1, size: 20, status: 'all', q: undefined }
   - ensureQueryData 检查 cache：5 分钟内未过期 → 直接返回（零网络请求）
5. 组件渲染 → 用户看到列表，零延迟（无 loading flash）
```

**Why 这样设计**：90% 的"列表 → 详情 → 返回"用户行为发生在 5 分钟内，零冗余请求。后端不需要为这个场景做缓存；前端 staleTime 已经覆盖。

### 7.3 mutation 后的缓存失效

```typescript
// 在详情页改完订单后保存
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ordersApi } from "@mb/api-sdk";

function OrderEditForm({ orderId }: { orderId: number }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateMutation = useMutation({
    mutationFn: (patch: { remark: string }) => ordersApi.update(orderId, patch),
    onSuccess: async () => {
      // 1. 失效详情缓存（下次访问拿新数据）
      await queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      // 2. 失效列表缓存（用户回到列表会看到更新后的列）
      await queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
      // 3. router invalidate：让所有匹配路由重跑 loader
      await router.invalidate();
    },
  });

  return (
    <button type="button" onClick={() => updateMutation.mutate({ remark: "更新备注" })}>
      保存
    </button>
  );
}
```

---

## 8. 404 兜底 [M3]

### 8.1 \_\_root.tsx 的 notFoundComponent

```typescript
// packages/app-shell/src/error/global-not-found-page.tsx
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function GlobalNotFoundPage() {
  const { t } = useTranslation("common");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">{t("error.pageNotFound")}</p>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        {t("action.backToHome")}
      </Link>
    </div>
  );
}
```

### 8.2 显式 throw notFound

业务代码也可以主动抛 `notFound()`：

```typescript
import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/orders/$id")({
  loader: async ({ context, params }) => {
    const order = await context.queryClient
      .ensureQueryData({
        queryKey: ["orders", "detail", params.id],
        queryFn: () => ordersApi.getById(params.id),
      })
      .catch((err) => {
        if (err.status === 404) throw notFound();
        throw err;
      });
    return order;
  },
});
```

---

## 9. 完整代码示例 订单列表加详情 [M3]

把前面所有片段串成一个完整可运行的最小示例：

### 9.1 routes/\_authed/orders/index.tsx

```typescript
// apps/web-admin/src/routes/_authed/orders/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { ordersApi } from "@mb/api-sdk";
import { requireAuth } from "@mb/app-shell/auth";
import { NxTable, NxLoading } from "@mb/ui-patterns";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrderView } from "@mb/api-sdk";

const orderListSearchSchema = z.object({
  page: z.number().int().min(1).default(1),
  size: z.number().int().min(10).max(100).default(20),
  status: z.enum(["all", "pending", "shipped", "delivered"]).default("all"),
  q: z.string().optional(),
});

export const Route = createFileRoute("/_authed/orders/")({
  validateSearch: orderListSearchSchema,
  beforeLoad: requireAuth({ permission: "order.read" }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return context.queryClient.ensureQueryData({
      queryKey: ["orders", "list", deps],
      queryFn: () =>
        ordersApi.list({
          page: deps.page,
          size: deps.size,
          status: deps.status === "all" ? undefined : deps.status,
          q: deps.q,
        }),
    });
  },
  pendingComponent: () => <NxLoading variant="skeleton-table" rows={10} />,
  pendingMs: 200,
  component: OrderListPage,
});

function OrderListPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t } = useTranslation("order");

  // 列定义：所有文案走 i18n（MUST #6）
  const columns: ColumnDef<OrderView>[] = [
    { accessorKey: "orderNo", header: t("columns.orderNo") },
    { accessorKey: "customerName", header: t("columns.customerName") },
    { accessorKey: "amount", header: t("columns.amount") },
    { accessorKey: "status", header: t("columns.status") },
    { accessorKey: "createdAt", header: t("columns.createdAt") },
  ];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("title.list")}</h1>
      <NxTable<OrderView>
        columns={columns}
        data={data.content}
        totalElements={data.totalElements}
        page={search.page}
        size={search.size}
        onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
        onRowClick={(order) => navigate({ to: "/orders/$id", params: { id: order.id } })}
      />
    </div>
  );
}
```

### 9.2 routes/\_authed/orders/$id.tsx

```typescript
// apps/web-admin/src/routes/_authed/orders/$id.tsx
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { ordersApi, isProblemDetail } from "@mb/api-sdk";
import { requireAuth } from "@mb/app-shell/auth";
import { NxLoading } from "@mb/ui-patterns";

export const Route = createFileRoute("/_authed/orders/$id")({
  parseParams: ({ id }) => ({ id: z.coerce.number().int().parse(id) }),
  stringifyParams: ({ id }) => ({ id: String(id) }),
  beforeLoad: requireAuth({ permission: "order.read" }),
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.ensureQueryData({
        queryKey: ["orders", "detail", params.id],
        queryFn: () => ordersApi.getById(params.id),
      });
    } catch (error) {
      if (isProblemDetail(error) && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  pendingComponent: () => <NxLoading variant="skeleton-detail" />,
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const order = Route.useLoaderData();
  const { t } = useTranslation("order");

  return (
    <div className="space-y-4 p-6">
      <Link to="/orders" search={{ page: 1, size: 20, status: "all" }} className="text-primary hover:underline">
        {t("action.backToList")}
      </Link>
      <h1 className="text-2xl font-semibold text-foreground">
        {t("title.detail", { orderNo: order.orderNo })}
      </h1>
      <dl className="grid grid-cols-2 gap-4">
        <dt className="text-muted-foreground">{t("columns.customerName")}</dt>
        <dd className="text-foreground">{order.customerName}</dd>
        <dt className="text-muted-foreground">{t("columns.amount")}</dt>
        <dd className="text-foreground">{order.amount}</dd>
        <dt className="text-muted-foreground">{t("columns.status")}</dt>
        <dd className="text-foreground">{t(`status.${order.status}`)}</dd>
      </dl>
    </div>
  );
}
```

---

## 10. 与后端的对应关系 [M3+M4]

| 前端 | 后端 |
|------|------|
| `requireAuth({ permission: 'order.read' })` | `@RequirePermission("order.read")`（详见 [backend/05-security.md §2](../backend/05-security.md#2-权限模型-currentuser--requirepermission)） |
| `RouterContext.currentUser`（来自 `useCurrentUser`） | `CurrentUser` 门面（详见 [backend/05-security.md §6](../backend/05-security.md#6-currentuser-门面层设计adr-0005)） |
| `ordersApi.list({ page: 1, size: 20 })` | `GET /api/v1/orders?page=1&size=20`，返回 `PageResult<OrderView>`（详见 [backend/06-api-and-contract.md §3](../backend/06-api-and-contract.md#3-响应格式混合方案-m4)） |
| `errorComponent` 接 `ProblemDetailError` | 后端 `RFC 9457 ProblemDetail`（详见 [backend/06-api-and-contract.md §3](../backend/06-api-and-contract.md#3-响应格式混合方案-m4)） |
| `notFound()` 触发 `notFoundComponent` | 后端 `NotFoundException` → `404 ProblemDetail`（详见 [backend/06-api-and-contract.md §1](../backend/06-api-and-contract.md#1-异常基类层次-m4)） |
| `Accept-Language` header（由 `@mb/api-sdk` 拦截器同步 `i18n.language`） | `AcceptHeaderLocaleResolver`（详见 [backend/06-api-and-contract.md §4](../backend/06-api-and-contract.md#4-i18n-国际化-m4)） |

---

<!-- verify: cd client && pnpm -F web-admin tsc --noEmit -->
<!-- verify: cd client && pnpm -F web-admin vite build && test -f apps/web-admin/src/routeTree.gen.ts -->

[← 返回 README](./README.md)
