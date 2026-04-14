# M3: L3 Patterns + L4 App Shell + L5 Routing 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 M2（L1 主题系统 + L2 30 个原子组件）之上，构建 L3 业务组件（8 个）、L4 应用壳层（布局 + Provider + i18n + 认证门面）、L5 TanStack Router 文件路由，交付可运行的前端应用骨架。

**Architecture:**
- L3 封装 TanStack Table / React Hook Form / Zod，通过 props 注入文案和数据，对上层屏蔽基础设施 API
- L4 组装 6 层 Provider 树 + 3 种布局预设 + 认证/菜单双门面 + react-i18next 完整 i18n
- L5 使用 TanStack Router 文件路由 + 路由守卫 + Zod URL 验证，消费 L3/L4 构建页面
- api-sdk 提供 HTTP 客户端 + 拦截器 + 类型定义（M3 手写类型，M5 切换 OpenAPI 生成）

**Tech Stack:**
- `@tanstack/react-table` v8, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`
- `@tanstack/react-router` v1, `@tanstack/router-vite-plugin`, `@tanstack/react-query` v5
- `i18next` v23, `react-i18next` v14
- `msw` v2（dev mock）, `playwright`（E2E）, `vitest`（unit）

**分支:** `feature/m3-patterns-and-shell`（基于 main，M2 已合并）

---

## 文件结构总览

```
client/
├── packages/
│   ├── api-sdk/src/                          # ★ Task 3: 全新实现
│   │   ├── index.ts                          # facade 导出
│   │   ├── config.ts                         # configureApiSdk() + 单例状态
│   │   ├── http-client.ts                    # fetch 封装 + 拦截器链
│   │   ├── errors.ts                         # ProblemDetailError
│   │   ├── interceptors/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts                       # Authorization header
│   │   │   ├── language.ts                   # Accept-Language header
│   │   │   ├── request-id.ts                 # X-Request-ID header
│   │   │   └── error.ts                      # 错误分发 (401/403/5xx)
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── common.ts                     # PageResult, ProblemDetail
│   │   │   ├── auth.ts                       # LoginCommand, LoginResult, CurrentUserDto
│   │   │   ├── menu.ts                       # MenuNodeDto, UserMenuPayload
│   │   │   └── permission.ts                 # AppPermission 联合类型
│   │   └── apis/
│   │       ├── index.ts
│   │       ├── auth-api.ts                   # authApi
│   │       └── menu-api.ts                   # menuApi
│   │
│   ├── ui-patterns/                          # ★ Tasks 1, 4-11: L3 业务组件
│   │   ├── package.json                      # 加 TanStack Table, RHF, Zod, date-fns
│   │   ├── tsconfig.json                     # 不变
│   │   ├── vitest.config.ts                  # 新建
│   │   ├── .storybook/
│   │   │   ├── main.ts                       # 新建
│   │   │   └── preview.tsx                   # 新建
│   │   └── src/
│   │       ├── index.ts                      # barrel export 8 个组件
│   │       ├── nx-loading.tsx                # + .test.tsx + .stories.tsx
│   │       ├── nx-bar.tsx                    # + .test.tsx + .stories.tsx
│   │       ├── nx-table.tsx                  # + .test.tsx + .stories.tsx
│   │       ├── nx-form.tsx                   # + .test.tsx + .stories.tsx
│   │       ├── nx-filter.tsx                 # + .test.tsx + .stories.tsx
│   │       ├── nx-drawer.tsx                 # + .test.tsx + .stories.tsx
│   │       ├── api-select.tsx                # + .test.tsx + .stories.tsx
│   │       └── nx-tree.tsx                   # + .test.tsx + .stories.tsx
│   │
│   └── app-shell/                            # ★ Tasks 2, 12-18: L4 应用壳层
│       ├── package.json                      # 加 i18next, react-i18next, @tanstack/react-query
│       ├── tsconfig.json                     # 不变
│       ├── vitest.config.ts                  # 新建
│       └── src/
│           ├── index.ts                      # barrel export
│           ├── i18n/
│           │   ├── i18n-instance.ts
│           │   ├── use-language.ts
│           │   ├── types.ts
│           │   ├── zh-CN/shell.json + common.json
│           │   └── en-US/shell.json + common.json
│           ├── theme/
│           │   ├── theme-provider.tsx
│           │   └── use-theme.ts
│           ├── auth/
│           │   ├── use-current-user.ts
│           │   ├── use-auth.ts
│           │   ├── require-auth.ts
│           │   └── types.ts
│           ├── data/
│           │   └── query-client.ts
│           ├── menu/
│           │   ├── use-menu.ts
│           │   └── types.ts
│           ├── layouts/
│           │   ├── sidebar-layout.tsx
│           │   ├── top-layout.tsx
│           │   └── basic-layout.tsx
│           ├── components/
│           │   ├── header.tsx
│           │   ├── sidebar.tsx
│           │   ├── language-switcher.tsx
│           │   └── theme-switcher.tsx
│           ├── feedback/
│           │   ├── toast-container.tsx
│           │   └── dialog-container.tsx
│           └── error/
│               ├── global-error-boundary.tsx
│               ├── global-error-page.tsx
│               └── global-not-found-page.tsx
│
├── apps/web-admin/                           # ★ Tasks 19-22: L5 路由 + 集成
│   ├── vite.config.ts                        # 加 @tanstack/router-vite-plugin
│   ├── package.json                          # 加大量 deps
│   ├── playwright.config.ts                  # 新建
│   └── src/
│       ├── main.tsx                          # 重写（Provider 树 + MSW）
│       ├── router.ts                         # createRouter
│       ├── i18n/
│       │   ├── register.ts                   # registerBusinessResources()
│       │   ├── i18next.d.ts                  # TypeScript module augmentation
│       │   ├── zh-CN/                        # M3 为空，M5 加业务 JSON
│       │   └── en-US/
│       ├── routes/
│       │   ├── __root.tsx
│       │   ├── index.tsx                     # / → redirect to /_authed
│       │   ├── auth/
│       │   │   ├── login.tsx
│       │   │   └── forgot-password.tsx
│       │   └── _authed/
│       │       ├── _authed.tsx               # layout: auth guard + SidebarLayout
│       │       └── index.tsx                 # 仪表盘占位
│       ├── routeTree.gen.ts                  # 自动生成，提交到 git
│       ├── mock/
│       │   ├── browser.ts                    # MSW setupWorker
│       │   └── handlers.ts                   # auth + menu mock handlers
│       └── e2e/
│           ├── login.spec.ts
│           └── navigation.spec.ts
│
├── scripts/
│   ├── check-i18n.ts                         # ★ Task 23
│   └── check-business-words.ts               # ★ Task 23
│
├── package.json                              # 加 scripts
├── .dependency-cruiser.cjs                   # 加 M3 规则
└── biome.json                                # 加 M3 lint 规则
```

---

## 依赖关系图

```
Phase 1（并行）:
  Task 1 (L3 config) ──┐
  Task 2 (L4 config) ──┼── 无依赖，并行执行
  Task 3 (api-sdk)   ──┘

Phase 2（L3 组件，顺序 TDD）:
  Task 4-11 ← 依赖 Task 1

Phase 3（L4 壳层，顺序构建）:
  Task 12-18 ← 依赖 Task 2 + Task 3 + Task 11（L3 完成）

Phase 4（L5 路由）:
  Task 19-21 ← 依赖 Task 18（L4 完成）

Phase 5（集成与质量）:
  Task 22-24 ← 依赖 Task 21

注意：Phase 2（L3）和 Task 3（api-sdk）可并行，它们无依赖关系。
```

---

## Phase 1: 基础设施（并行）

### Task 1: L3 `@mb/ui-patterns` 包配置

**Files:**
- Modify: `packages/ui-patterns/package.json`
- Create: `packages/ui-patterns/vitest.config.ts`
- Create: `packages/ui-patterns/.storybook/main.ts`
- Create: `packages/ui-patterns/.storybook/preview.tsx`

- [ ] **Step 1: 更新 package.json 添加依赖**

```json
{
  "name": "@mb/ui-patterns",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "storybook": "storybook dev -p 6007",
    "storybook:build": "storybook build"
  },
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "@mb/ui-primitives": "workspace:*",
    "@tanstack/react-table": "^8.20.0",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.24.0",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@storybook/react": "^8.4.0",
    "@storybook/react-vite": "^8.4.0",
    "@storybook/addon-essentials": "^8.4.0",
    "@storybook/addon-a11y": "^8.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.1.0",
    "storybook": "^8.4.0"
  }
}
```

- [ ] **Step 2: 创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 70, functions: 70, branches: 65, statements: 70 },
    },
  },
});
```

创建 `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: 创建 .storybook/main.ts**

复用 L2 的 Storybook 配置模式（M2 踩坑经验：必须在 viteFinal 注入 @tailwindcss/vite）：

```ts
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
};

export default config;
```

- [ ] **Step 4: 创建 .storybook/preview.tsx**

```tsx
import type { Preview } from '@storybook/react';
import { themeRegistry } from '@mb/ui-tokens';
import '../src/storybook.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '主题切换',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themeRegistry.map((t) => ({ value: t.id, title: t.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'default' },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'default');
      return <Story />;
    },
  ],
};

export default preview;
```

创建 `src/storybook.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "@mb/ui-tokens/tailwind-theme.css";
@import "@mb/ui-tokens/themes/index.css";
```

- [ ] **Step 5: 运行 pnpm install 验证依赖解析**

```bash
cd client && pnpm install
```

- [ ] **Step 6: 提交**

```
feat(l3): 初始化 @mb/ui-patterns 包配置（vitest + storybook）
```

---

### Task 2: L4 `@mb/app-shell` 包配置

**Files:**
- Modify: `packages/app-shell/package.json`
- Create: `packages/app-shell/vitest.config.ts`
- Create: `packages/app-shell/vitest.setup.ts`

- [ ] **Step 1: 更新 package.json 添加依赖**

```json
{
  "name": "@mb/app-shell",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth/index.ts",
    "./i18n": "./src/i18n/index.ts",
    "./theme": "./src/theme/index.ts",
    "./menu": "./src/menu/index.ts",
    "./layouts": "./src/layouts/index.ts",
    "./error": "./src/error/index.ts",
    "./feedback": "./src/feedback/index.ts",
    "./data": "./src/data/index.ts",
    "./i18n/zh-CN/*": "./src/i18n/zh-CN/*",
    "./i18n/en-US/*": "./src/i18n/en-US/*"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch"
  },
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "@mb/ui-primitives": "workspace:*",
    "@mb/ui-patterns": "workspace:*",
    "@mb/api-sdk": "workspace:*",
    "@tanstack/react-query": "^5.62.0",
    "@tanstack/react-router": "^1.95.0",
    "i18next": "^23.16.0",
    "react-i18next": "^14.1.0",
    "lucide-react": "^0.468.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: 创建 vitest.config.ts + vitest.setup.ts**

同 Task 1 相同配置，调整 include 路径为 `src/**/*.test.{ts,tsx}`。

- [ ] **Step 3: 运行 pnpm install 验证**

```bash
cd client && pnpm install
```

- [ ] **Step 4: 提交**

```
feat(l4): 初始化 @mb/app-shell 包配置（vitest + 依赖）
```

---

### Task 3: `@mb/api-sdk` 核心实现

> M3 阶段后端尚未交付 OpenAPI 契约，api-sdk 手写类型 + HTTP 客户端 + 拦截器链。M5 集成时切换为 OpenAPI 生成，拦截器代码复用。

**Files:**
- Modify: `packages/api-sdk/package.json`
- Create: `packages/api-sdk/src/` 下全部文件（见文件结构）

- [ ] **Step 1: 更新 package.json**

```json
{
  "name": "@mb/api-sdk",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/apis/auth-api.ts"
  },
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

注意：api-sdk 零运行时依赖，仅使用原生 `fetch`。

- [ ] **Step 2: 创建类型定义**

`src/types/common.ts`:
```ts
export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number; // 1-indexed
  size: number;
}

export interface ProblemDetail {
  type: string;
  status: number;
  title?: string;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  errors?: Array<{ field: string; message: string }>;
}
```

`src/types/auth.ts`:
```ts
export interface LoginCommand {
  username: string;
  password: string;
  captchaCode?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserDto {
  userId: number;
  username: string;
  permissions: string[];
  roles: string[];
  isAdmin: boolean;
}
```

`src/types/menu.ts`:
```ts
export interface MenuNodeDto {
  id: number;
  parentId: number | null;
  name: string;
  icon: string | null;
  path: string | null;
  kind: 'directory' | 'menu' | 'button';
  permissionCode: string | null;
  isOrphan: boolean;
  children: MenuNodeDto[];
}

export interface UserMenuPayload {
  tree: MenuNodeDto[];
  permissions: string[];
}
```

`src/types/permission.ts`:
```ts
// M3 最小权限集，M4/M5 按模块扩展
export type AppPermission =
  | 'iam.user.list' | 'iam.user.create' | 'iam.user.update' | 'iam.user.delete'
  | 'iam.role.list' | 'iam.role.assignPermission'
  | 'iam.menu.read' | 'iam.menu.write';

export const ALL_APP_PERMISSIONS: readonly AppPermission[] = [
  'iam.user.list', 'iam.user.create', 'iam.user.update', 'iam.user.delete',
  'iam.role.list', 'iam.role.assignPermission',
  'iam.menu.read', 'iam.menu.write',
] as const;
```

`src/types/index.ts`: barrel export 上述所有类型。

- [ ] **Step 3: 创建 ProblemDetailError**

`src/errors.ts`:
```ts
import type { ProblemDetail } from './types/common';

export class ProblemDetailError extends Error {
  readonly status: number;
  readonly type: string;
  readonly title: string | null;
  readonly detail: string | null;
  readonly instance: string | null;
  readonly code: string | null;
  readonly traceId: string | null;
  readonly validationErrors: ReadonlyArray<{ field: string; message: string }>;

  constructor(payload: ProblemDetail) {
    super(payload.detail ?? payload.title ?? `HTTP ${payload.status}`);
    this.name = 'ProblemDetailError';
    this.status = payload.status ?? 0;
    this.type = payload.type ?? 'about:blank';
    this.title = payload.title ?? null;
    this.detail = payload.detail ?? null;
    this.instance = payload.instance ?? null;
    this.code = (payload as Record<string, unknown>).code as string | null ?? null;
    this.traceId = (payload as Record<string, unknown>).traceId as string | null ?? null;
    this.validationErrors = (payload.errors as ReadonlyArray<{ field: string; message: string }>) ?? [];
  }
}
```

- [ ] **Step 4: 创建 HTTP 客户端 + 拦截器链**

`src/http-client.ts`:
```ts
export interface RequestInterceptor {
  (url: string, init: RequestInit): Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };
}

export interface ResponseInterceptor {
  (response: Response): Promise<Response> | Response;
}

export interface HttpClient {
  request<T>(url: string, init?: RequestInit): Promise<T>;
}

export function createHttpClient(
  basePath: string,
  requestInterceptors: RequestInterceptor[],
  responseInterceptors: ResponseInterceptor[],
): HttpClient {
  return {
    async request<T>(url: string, init: RequestInit = {}): Promise<T> {
      let finalUrl = `${basePath}${url}`;
      let finalInit = { ...init };

      for (const interceptor of requestInterceptors) {
        const result = await interceptor(finalUrl, finalInit);
        finalUrl = result.url;
        finalInit = result.init;
      }

      let response = await fetch(finalUrl, finalInit);

      for (const interceptor of responseInterceptors) {
        response = await interceptor(response);
      }

      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    },
  };
}
```

`src/interceptors/auth.ts`:
```ts
import type { RequestInterceptor } from '../http-client';

export function createAuthInterceptor(
  getToken: () => string | null,
): RequestInterceptor {
  return (url, init) => {
    const token = getToken();
    if (!token) return { url, init };
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return { url, init: { ...init, headers } };
  };
}
```

`src/interceptors/language.ts`:
```ts
import type { RequestInterceptor } from '../http-client';

export function createLanguageInterceptor(
  getLanguage: () => string,
): RequestInterceptor {
  return (url, init) => {
    const headers = new Headers(init.headers);
    headers.set('Accept-Language', getLanguage());
    return { url, init: { ...init, headers } };
  };
}
```

`src/interceptors/request-id.ts`:
```ts
import type { RequestInterceptor } from '../http-client';

export function createRequestIdInterceptor(): RequestInterceptor {
  return (url, init) => {
    const headers = new Headers(init.headers);
    headers.set('X-Request-ID', crypto.randomUUID());
    return { url, init: { ...init, headers } };
  };
}
```

`src/interceptors/error.ts`:
```ts
import type { ResponseInterceptor } from '../http-client';
import type { ProblemDetail } from '../types/common';
import { ProblemDetailError } from '../errors';

export interface ErrorHandlerOptions {
  onUnauthenticated: () => void;
  onForbidden: (err: ProblemDetailError) => void;
  onServerError: (err: ProblemDetailError) => void;
}

export function createErrorInterceptor(options: ErrorHandlerOptions): ResponseInterceptor {
  return async (response) => {
    if (response.ok) return response;

    const contentType = response.headers.get('Content-Type') ?? '';
    let payload: ProblemDetail;

    if (contentType.includes('application/problem+json') || contentType.includes('application/json')) {
      payload = await response.clone().json();
    } else {
      payload = {
        type: 'about:blank',
        status: response.status,
        title: response.statusText,
        detail: `Unexpected error: ${response.status} ${response.statusText}`,
      };
    }

    const err = new ProblemDetailError(payload);

    if (err.status === 401) { options.onUnauthenticated(); throw err; }
    if (err.status === 403) { options.onForbidden(err); throw err; }
    if (err.status >= 500) { options.onServerError(err); throw err; }

    throw err; // 4xx 交给调用方处理
  };
}
```

- [ ] **Step 5: 创建 config.ts + API 门面**

`src/config.ts`:
```ts
import { createHttpClient, type HttpClient } from './http-client';
import { createAuthInterceptor } from './interceptors/auth';
import { createLanguageInterceptor } from './interceptors/language';
import { createRequestIdInterceptor } from './interceptors/request-id';
import { createErrorInterceptor, type ErrorHandlerOptions } from './interceptors/error';

export interface ApiSdkConfig extends ErrorHandlerOptions {
  basePath: string;
  getToken: () => string | null;
  getLanguage: () => string;
}

let client: HttpClient | null = null;

export function configureApiSdk(config: ApiSdkConfig): void {
  client = createHttpClient(
    config.basePath,
    [
      createAuthInterceptor(config.getToken),
      createLanguageInterceptor(config.getLanguage),
      createRequestIdInterceptor(),
    ],
    [
      createErrorInterceptor(config),
    ],
  );
}

export function getClient(): HttpClient {
  if (!client) throw new Error('@mb/api-sdk not configured. Call configureApiSdk() first.');
  return client;
}
```

`src/apis/auth-api.ts`:
```ts
import { getClient } from '../config';
import type { LoginCommand, LoginResult, CurrentUserDto } from '../types/auth';

export const authApi = {
  login(cmd: LoginCommand): Promise<LoginResult> {
    return getClient().request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
  },
  logout(): Promise<void> {
    return getClient().request('/api/v1/auth/logout', { method: 'POST' });
  },
  getCurrentUser(): Promise<CurrentUserDto> {
    return getClient().request('/api/v1/auth/me');
  },
};
```

`src/apis/menu-api.ts`:
```ts
import { getClient } from '../config';
import type { UserMenuPayload } from '../types/menu';

export const menuApi = {
  queryCurrentUserMenu(): Promise<UserMenuPayload> {
    return getClient().request('/api/v1/menu/current');
  },
};
```

- [ ] **Step 6: 创建 index.ts barrel export**

```ts
// 类型
export type { PageResult, ProblemDetail } from './types/common';
export type { LoginCommand, LoginResult, CurrentUserDto } from './types/auth';
export type { MenuNodeDto, UserMenuPayload } from './types/menu';
export type { AppPermission } from './types/permission';
export { ALL_APP_PERMISSIONS } from './types/permission';

// 错误
export { ProblemDetailError } from './errors';

// 配置
export { configureApiSdk, type ApiSdkConfig } from './config';

// API 门面
export { authApi } from './apis/auth-api';
export { menuApi } from './apis/menu-api';
```

- [ ] **Step 7: 写拦截器单元测试**

`src/__tests__/interceptors.test.ts`：测试 4 个拦截器的行为：
- auth: 有 token 时注入 header，无 token 时跳过
- language: 注入 Accept-Language
- request-id: 注入 X-Request-ID（UUID 格式）
- error: 401 → onUnauthenticated, 403 → onForbidden, 5xx → onServerError, 4xx → throw

- [ ] **Step 8: 运行测试验证**

```bash
cd client && pnpm -F @mb/api-sdk test
```

- [ ] **Step 9: 提交**

```
feat(api-sdk): HTTP 客户端 + 拦截器链 + 类型定义（M3 手写版）
```

---

## Phase 2: L3 业务组件（顺序 TDD）

> **隔离哲学**：L3 组件零业务词汇、零内部 i18n、零 API 调用。所有文案通过 props 注入（TypeScript strict 强制 REQUIRED）。
>
> **TDD 流程**：每个组件先写测试 → 确认失败 → 实现 → 确认通过 → 写 stories → 提交。
>
> **L2 依赖**：所有视觉元素来自 `@mb/ui-primitives`，禁止直接引用 `@radix-ui/*`。

### Task 4: NxLoading（建立模式）

**Files:**
- Create: `packages/ui-patterns/src/nx-loading.tsx`
- Create: `packages/ui-patterns/src/nx-loading.test.tsx`
- Create: `packages/ui-patterns/src/nx-loading.stories.tsx`

- [ ] **Step 1: 写测试**

```tsx
// nx-loading.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NxLoading } from './nx-loading';

const TEXT = {
  loadingText: 'Loading...',
  errorText: 'Something went wrong',
  emptyText: 'No data',
  retryLabel: 'Retry',
};

describe('NxLoading', () => {
  it('renders children when not loading/error/empty', () => {
    render(<NxLoading {...TEXT}><p>content</p></NxLoading>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders loading state with skeleton variant', () => {
    render(<NxLoading {...TEXT} loading variant="skeleton" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders loading state with spinner variant', () => {
    render(<NxLoading {...TEXT} loading variant="spinner" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn();
    render(<NxLoading {...TEXT} error={new Error('fail')} retryLabel="Retry" onRetry={onRetry} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders empty state', () => {
    render(<NxLoading {...TEXT} empty />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('priority: error > loading > empty', () => {
    render(<NxLoading {...TEXT} error={new Error()} loading empty />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd client && pnpm -F @mb/ui-patterns test -- --run src/nx-loading.test.tsx
```

- [ ] **Step 3: 实现 NxLoading**

Props 接口（严格遵循 spec §4）：

```tsx
import type { ReactNode } from 'react';
import { Button, Skeleton } from '@mb/ui-primitives';
import { cn } from '@mb/ui-primitives';

export interface NxLoadingProps {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  loadingText: ReactNode;    // REQUIRED — 零默认文案
  errorText: ReactNode;      // REQUIRED
  emptyText: ReactNode;      // REQUIRED
  retryLabel?: ReactNode;
  onRetry?: () => void;
  variant?: 'skeleton' | 'spinner' | 'skeleton-table' | 'skeleton-detail';
  rows?: number;
  children?: ReactNode;
  className?: string;
}

export function NxLoading({
  loading, error, empty,
  loadingText, errorText, emptyText,
  retryLabel, onRetry,
  variant = 'skeleton', rows = 5,
  children, className,
}: NxLoadingProps) {
  // 优先级：error > loading > empty
  if (error) {
    return (
      <div role="alert" className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
        <p className="text-destructive">{errorText}</p>
        {onRetry && retryLabel && (
          <Button variant="outline" onClick={onRetry}>{retryLabel}</Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('py-8', className)}>
        {variant === 'spinner' ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        ) : variant === 'skeleton-table' ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : variant === 'skeleton-detail' ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            {Array.from({ length: rows }, (_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: rows }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <p className="text-center text-sm text-muted-foreground">{loadingText}</p>
          </div>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-muted-foreground', className)}>
        <p>{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd client && pnpm -F @mb/ui-patterns test -- --run src/nx-loading.test.tsx
```

- [ ] **Step 5: 写 Storybook stories**

```tsx
// nx-loading.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NxLoading } from './nx-loading';

const meta = {
  title: 'Patterns/NxLoading',
  component: NxLoading,
  args: {
    loadingText: '加载中...',
    errorText: '加载失败',
    emptyText: '暂无数据',
    retryLabel: '重试',
  },
} satisfies Meta<typeof NxLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: <p>内容已加载</p> } };
export const Loading: Story = { args: { loading: true, variant: 'skeleton' } };
export const Spinner: Story = { args: { loading: true, variant: 'spinner' } };
export const SkeletonTable: Story = { args: { loading: true, variant: 'skeleton-table', rows: 5 } };
export const Error: Story = { args: { error: new Error('Network error'), onRetry: () => alert('重试') } };
export const Empty: Story = { args: { empty: true } };
```

- [ ] **Step 6: 更新 index.ts 导出**

```ts
export { NxLoading, type NxLoadingProps } from './nx-loading';
```

- [ ] **Step 7: 提交**

```
feat(l3): NxLoading 三态容器组件（loading/error/empty）
```

---

### Task 5: NxBar

**Files:** `packages/ui-patterns/src/nx-bar.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口：**
```ts
export interface NxBarProps {
  selectedCount: number;
  selectedTemplate: string;  // 必须包含 {count} 占位符
  actions: ReactNode;
  onClear?: () => void;
  clearLabel?: ReactNode;
  fixed?: boolean;
  className?: string;
}
```

**关键测试用例：**
- selectedCount=0 时不渲染（或渲染为隐藏）
- selectedCount>0 时显示计数文案（template 替换 `{count}`）
- onClear 回调触发
- fixed=true 时有 `fixed bottom-0` 类名
- actions slot 渲染

**提交：** `feat(l3): NxBar 批量操作栏`

---

### Task 6: NxTable（核心复杂组件）

**Files:** `packages/ui-patterns/src/nx-table.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口（严格遵循 spec）：**
```ts
import type { ColumnDef, SortingState, RowSelectionState } from '@tanstack/react-table';

export interface NxTablePagination {
  page: number;           // 1-based
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NxTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  loading?: boolean;
  emptyText?: ReactNode;
  onRowClick?: (row: TData) => void;
  pagination?: NxTablePagination;
  onPaginationChange?: (next: NxTablePagination) => void;
  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (next: RowSelectionState) => void;
  batchActions?: ReactNode;
  className?: string;
}
```

**实现要点：**
- 内部使用 `useReactTable` + `getCoreRowModel` + `getSortedRowModel` + `getPaginationRowModel`
- 手动分页模式（`manualPagination: true`）— 后端分页
- 手动排序模式（`manualSorting: true`）— 后端排序
- 渲染使用 L2 `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` 组件
- loading 状态显示 `NxLoading` variant="skeleton-table"
- 空状态显示 `emptyText`

**关键测试用例：**
- 渲染列和数据行
- onPaginationChange 回调（翻页）
- onSortingChange 回调（点击列头排序）
- rowSelection + onRowSelectionChange（多选）
- loading 状态渲染 skeleton
- empty 状态渲染空文案
- onRowClick 回调

**L2 依赖：** Table, TableHeader, TableBody, TableRow, TableCell, TableHead, Button, Checkbox, Skeleton

**Storybook stories：** Default, Loading, Empty, WithSorting, WithSelection, WithBatchActions（6 个）

**提交：** `feat(l3): NxTable 数据表格组件（TanStack Table 封装）`

---

### Task 7: NxForm + NxFormField

**Files:** `packages/ui-patterns/src/nx-form.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口：**
```ts
import type { FieldValues, DefaultValues, SubmitHandler } from 'react-hook-form';
import type { ZodSchema } from 'zod';

export interface NxFormProps<TFormValues extends FieldValues> {
  schema: ZodSchema<TFormValues>;
  defaultValues?: DefaultValues<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  children: ReactNode;
  submitLabel: ReactNode;     // REQUIRED
  cancelLabel?: ReactNode;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export interface NxFormFieldProps {
  name: string;
  label: ReactNode;
  description?: ReactNode;
  children: ReactElement;     // L2 Input/Select/Checkbox 等
  required?: boolean;         // 仅视觉星号，验证由 schema 决定
}
```

**实现要点：**
- 内部使用 `useForm` + `zodResolver`
- `FormProvider` 包裹子组件
- `NxFormField` 内部使用 `useFormContext` + `useController`
- 错误信息从 Zod schema 自动获取

**关键测试用例：**
- 正常提交（schema 验证通过）
- 验证失败显示错误信息
- loading 状态禁用提交按钮
- onCancel 回调
- required 星号显示

**提交：** `feat(l3): NxForm 表单组件（React Hook Form + Zod）`

---

### Task 8: NxFilter + NxFilterField

**Files:** `packages/ui-patterns/src/nx-filter.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口：**
```ts
export type NxFilterValue = Record<string, unknown>;

export interface NxFilterProps<TFilter extends NxFilterValue> {
  value: TFilter;
  onChange: (next: TFilter) => void;
  resetLabel: ReactNode;     // REQUIRED
  applyLabel: ReactNode;     // REQUIRED
  children: ReactNode;
  className?: string;
}

export interface NxFilterFieldProps {
  name: string;
  label: ReactNode;
  children: ReactElement;
}
```

**关键测试用例：**
- 受控值变更
- 重置按钮清空所有字段
- 应用按钮触发 onChange

**提交：** `feat(l3): NxFilter 筛选栏组件`

---

### Task 9: NxDrawer

**Files:** `packages/ui-patterns/src/nx-drawer.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口：**
```ts
export interface NxDrawerProps<TFormValues extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  schema?: ZodSchema<TFormValues>;
  defaultValues?: Partial<TFormValues>;
  onSubmit?: SubmitHandler<TFormValues>;
  submitLabel?: ReactNode;
  cancelLabel?: ReactNode;
  closeLabel: string;        // ARIA label, REQUIRED
  dirtyConfirmText?: ReactNode;
  children: ReactNode;
}
```

**实现要点：**
- 基于 L2 Drawer 组件
- 可选表单模式（有 schema 时启用 React Hook Form）
- 脏检查：关闭前检查表单是否修改，修改了显示确认弹窗

**提交：** `feat(l3): NxDrawer 抽屉表单组件`

---

### Task 10: ApiSelect

**Files:** `packages/ui-patterns/src/api-select.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口：**
```ts
export interface ApiSelectOption<TValue = string> {
  value: TValue;
  label: ReactNode;
  searchText?: string;
  disabled?: boolean;
}

export interface ApiSelectFetchParams {
  keyword: string;
  page: number;
  size: number;
}

export interface ApiSelectFetchResult<TValue = string> {
  options: ApiSelectOption<TValue>[];
  totalElements: number;
}

export interface ApiSelectProps<TValue = string> {
  value: TValue | null;
  onChange: (next: TValue | null) => void;
  fetcher: (params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult<TValue>>;
  placeholder?: ReactNode;
  loadingText: ReactNode;    // REQUIRED
  emptyText: ReactNode;      // REQUIRED
  size?: number;
  debounceMs?: number;
  disabled?: boolean;
}
```

**实现要点：**
- 基于 L2 Combobox
- 内部使用 useState + useEffect + debounce（**不用 useQuery**）
- fetcher 由调用方注入（L5 通过 api-sdk 实现）
- 搜索关键词变化时 debounce 后调用 fetcher

**提交：** `feat(l3): ApiSelect 异步下拉选择组件`

---

### Task 11: NxTree

**Files:** `packages/ui-patterns/src/nx-tree.tsx` + `.test.tsx` + `.stories.tsx`

**Props 接口：**
```ts
export interface NxTreeNode {
  id: string;
  children?: NxTreeNode[];
}

export interface NxTreeProps<TNode extends NxTreeNode> {
  data: TNode[];
  renderNode: (node: TNode, depth: number) => ReactNode;
  expandedIds?: Set<string>;
  onExpandedChange?: (next: Set<string>) => void;
  draggable?: boolean;
  onDrop?: (dragId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  emptyText: ReactNode;     // REQUIRED
  className?: string;
}
```

**实现要点：**
- 递归渲染树节点
- 展开/收起状态（受控）
- 可选拖拽排序（v1 基础版：HTML5 drag & drop）
- 渲染由调用方自定义（renderNode slot）

**提交：** `feat(l3): NxTree 树组件`

---

### L3 Phase 完成验证

```bash
cd client && pnpm -F @mb/ui-patterns test          # 全部测试通过
cd client && pnpm -F @mb/ui-patterns storybook:build  # Storybook 构建通过
cd client && pnpm check:types                        # 类型检查通过
cd client && pnpm check:deps                         # 依赖方向检查通过
```

---

## Phase 3: L4 应用壳层

### Task 12: i18n 系统

**Files:**
- Create: `packages/app-shell/src/i18n/i18n-instance.ts`
- Create: `packages/app-shell/src/i18n/use-language.ts`
- Create: `packages/app-shell/src/i18n/types.ts`
- Create: `packages/app-shell/src/i18n/zh-CN/shell.json`
- Create: `packages/app-shell/src/i18n/zh-CN/common.json`
- Create: `packages/app-shell/src/i18n/en-US/shell.json`
- Create: `packages/app-shell/src/i18n/en-US/common.json`
- Create: `packages/app-shell/src/i18n/index.ts`

- [ ] **Step 1: 定义类型**

`src/i18n/types.ts`:
```ts
export const SUPPORTED_LANGUAGES = {
  'zh-CN': { label: '简体中文' },
  'en-US': { label: 'English' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const LANGUAGE_STORAGE_KEY = 'mb_i18n_lng';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN';
```

- [ ] **Step 2: 创建字典文件**

`zh-CN/shell.json`:
```json
{
  "sidebar": { "collapse": "收起侧边栏", "expand": "展开侧边栏" },
  "header": { "profile": "个人信息", "logout": "退出登录" },
  "theme": { "switch": "切换主题", "default": "默认", "dark": "暗色", "compact": "紧凑" },
  "language": { "switch": "切换语言" }
}
```

`zh-CN/common.json`:
```json
{
  "action": { "confirm": "确定", "cancel": "取消", "save": "保存", "delete": "删除", "edit": "编辑", "create": "新增", "search": "搜索", "reset": "重置", "retry": "重试", "back": "返回", "close": "关闭", "export": "导出", "import": "导入" },
  "status": { "loading": "加载中...", "saving": "保存中...", "success": "操作成功", "failed": "操作失败" },
  "empty": { "data": "暂无数据", "search": "未找到匹配结果" },
  "error": { "network": "网络错误，请稍后重试", "server": "服务器异常", "forbidden": "无权限访问", "notFound": "页面不存在", "unknown": "未知错误" },
  "pagination": { "total": "共 {{total}} 条", "page": "第 {{page}} / {{pages}} 页" },
  "table": { "selectedCount": "已选择 {{count}} 项", "clearSelection": "清除选择" }
}
```

`en-US/shell.json` 和 `en-US/common.json`：上述 JSON 的英文翻译版本，key 结构完全一致。

- [ ] **Step 3: 创建 i18n 实例**

`src/i18n/i18n-instance.ts`:
```ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';

import zhCNShell from './zh-CN/shell.json';
import zhCNCommon from './zh-CN/common.json';
import enUSShell from './en-US/shell.json';
import enUSCommon from './en-US/common.json';

function resolveInitialLanguage(): SupportedLanguage {
  if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && saved in SUPPORTED_LANGUAGES) return saved as SupportedLanguage;
  return DEFAULT_LANGUAGE;
}

export const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: ['shell', 'common'],
  resources: {
    'zh-CN': { shell: zhCNShell, common: zhCNCommon },
    'en-US': { shell: enUSShell, common: enUSCommon },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});
```

**注意**：不使用浏览器语言自动检测（MUST NOT #7），始终默认 zh-CN。

- [ ] **Step 4: 创建 useLanguage hook**

`src/i18n/use-language.ts`:
```ts
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';

export function useLanguage() {
  const { i18n } = useTranslation();

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (!(lang in SUPPORTED_LANGUAGES)) return;
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      await i18n.changeLanguage(lang);
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

- [ ] **Step 5: 创建 registerResource 函数（供 L5 注册业务字典）**

`src/i18n/i18n-instance.ts` 底部追加：
```ts
export function registerResource(language: SupportedLanguage, namespace: string, data: Record<string, unknown>): void {
  i18n.addResourceBundle(language, namespace, data, true, true);
}
```

- [ ] **Step 6: barrel export**

`src/i18n/index.ts`:
```ts
export { i18n, registerResource } from './i18n-instance';
export { useLanguage } from './use-language';
export { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE, type SupportedLanguage } from './types';
```

- [ ] **Step 7: 写测试**

测试 `resolveInitialLanguage`（localStorage 有值/无值/无效值）和 `useLanguage` hook（切换语言后 localStorage 更新）。

- [ ] **Step 8: 提交**

```
feat(l4): i18n 系统（react-i18next + 双语字典 + useLanguage hook）
```

---

### Task 13: 主题 Provider

**Files:**
- Create: `packages/app-shell/src/theme/theme-provider.tsx`
- Create: `packages/app-shell/src/theme/use-theme.ts`
- Create: `packages/app-shell/src/theme/index.ts`

- [ ] **Step 1: 实现 ThemeProvider + useTheme**

两阶段机制：
- Phase 1（React 渲染前）：`initTheme()` 已在 L1 实现
- Phase 2（React 运行时）：`ThemeProvider` 提供 `useTheme()` hook

```tsx
// theme-provider.tsx
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, loadTheme } from '@mb/ui-tokens';

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, defaultTheme = 'default' }: { children: ReactNode; defaultTheme?: string }) {
  const [theme, setThemeState] = useState(() => loadTheme() ?? defaultTheme);

  const setTheme = useCallback((next: string) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

```ts
// use-theme.ts
import { use } from 'react';
import { ThemeContext } from './theme-provider';

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: 测试 + 提交**

```
feat(l4): ThemeProvider + useTheme hook
```

---

### Task 14: 认证门面

**Files:**
- Create: `packages/app-shell/src/auth/types.ts`
- Create: `packages/app-shell/src/auth/use-current-user.ts`
- Create: `packages/app-shell/src/auth/use-auth.ts`
- Create: `packages/app-shell/src/auth/require-auth.ts`
- Create: `packages/app-shell/src/auth/index.ts`

- [ ] **Step 1: 定义 CurrentUser 接口**

```ts
// auth/types.ts
import type { AppPermission } from '@mb/api-sdk';

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

export const ANONYMOUS: CurrentUser = {
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
```

- [ ] **Step 2: 实现 useCurrentUser**

```ts
// auth/use-current-user.ts
import { useQuery } from '@tanstack/react-query';
import { authApi, type CurrentUserDto } from '@mb/api-sdk';
import { ANONYMOUS, type CurrentUser } from './types';

function toCurrentUser(dto: CurrentUserDto): CurrentUser {
  const permissions = new Set(dto.permissions) as ReadonlySet<string>;
  const roles = new Set(dto.roles);
  return {
    isAuthenticated: true,
    userId: dto.userId,
    username: dto.username,
    permissions: permissions as CurrentUser['permissions'],
    roles,
    hasPermission: (code) => permissions.has(code),
    hasAnyPermission: (...codes) => codes.some((c) => permissions.has(c)),
    hasAllPermissions: (...codes) => codes.every((c) => permissions.has(c)),
    isAdmin: dto.isAdmin,
  };
}

export function useCurrentUser(): CurrentUser {
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
  return data ? toCurrentUser(data) : ANONYMOUS;
}
```

- [ ] **Step 3: 实现 useAuth**

```ts
// auth/use-auth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginCommand } from '@mb/api-sdk';
import { useNavigate } from '@tanstack/react-router';

const ACCESS_TOKEN_KEY = 'mb_access_token';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (cmd: LoginCommand) => authApi.login(cmd),
    onSuccess: (result) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate({ to: '/' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      queryClient.clear();
      navigate({ to: '/auth/login' });
    },
  });

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
```

- [ ] **Step 4: 实现 requireAuth（路由守卫工厂）**

```ts
// auth/require-auth.ts
import type { AppPermission } from '@mb/api-sdk';

export interface RequireAuthOptions {
  permission?: AppPermission;
}

// 使用方式见 Task 21 的 _authed.tsx
// beforeLoad 中调用 ensureQueryData 检查登录状态
// 权限检查在 ensureQueryData 返回后进行
export { type RequireAuthOptions };
```

注意：`requireAuth` 的实际逻辑在路由的 `beforeLoad` 中实现（Task 21），这里只导出类型。

- [ ] **Step 5: barrel export + 测试 + 提交**

```
feat(l4): 认证门面（useCurrentUser + useAuth + token 管理）
```

---

### Task 15: 数据层（QueryClient + useMenu）

**Files:**
- Create: `packages/app-shell/src/data/query-client.ts`
- Create: `packages/app-shell/src/data/index.ts`
- Create: `packages/app-shell/src/menu/types.ts`
- Create: `packages/app-shell/src/menu/use-menu.ts`
- Create: `packages/app-shell/src/menu/index.ts`

- [ ] **Step 1: createQueryClient**

```ts
// data/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { ProblemDetailError } from '@mb/api-sdk';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ProblemDetailError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });
}
```

- [ ] **Step 2: useMenu hook**

```ts
// menu/types.ts
import type { AppPermission } from '@mb/api-sdk';

export interface MenuNode {
  id: number;
  parentId: number | null;
  name: string;
  icon: string | null;
  path: string | null;
  kind: 'directory' | 'menu' | 'button';
  permissionCode: AppPermission | null;
  isOrphan: boolean;
  children: MenuNode[];
}

export interface UserMenuPayload {
  tree: MenuNode[];
  permissions: ReadonlySet<AppPermission>;
}
```

```ts
// menu/use-menu.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { menuApi, type MenuNodeDto } from '@mb/api-sdk';
import type { MenuNode, UserMenuPayload } from './types';

function toMenuNode(dto: MenuNodeDto): MenuNode {
  return {
    ...dto,
    permissionCode: dto.permissionCode as MenuNode['permissionCode'],
    children: dto.children.map(toMenuNode),
  };
}

export function useMenu(): UseQueryResult<UserMenuPayload, Error> {
  return useQuery({
    queryKey: ['app-shell', 'menu', 'current-user'],
    queryFn: async () => {
      const payload = await menuApi.queryCurrentUserMenu();
      return {
        tree: payload.tree.map(toMenuNode),
        permissions: new Set(payload.permissions) as ReadonlySet<string>,
      } as UserMenuPayload;
    },
    staleTime: 60 * 60 * 1000, // 1 小时
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
```

- [ ] **Step 3: 测试 + 提交**

```
feat(l4): QueryClient 配置 + useMenu hook
```

---

### Task 16: 错误处理

**Files:**
- Create: `packages/app-shell/src/error/global-error-boundary.tsx`
- Create: `packages/app-shell/src/error/global-error-page.tsx`
- Create: `packages/app-shell/src/error/global-not-found-page.tsx`
- Create: `packages/app-shell/src/error/index.ts`

- [ ] **Step 1: GlobalErrorBoundary（class 组件）**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <GlobalErrorPage error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: GlobalErrorPage + GlobalNotFoundPage**

使用**内联样式**（ErrorBoundary 触发时 ThemeProvider 可能未初始化，Tailwind 类无法解析 CSS 变量）。

```tsx
// global-error-page.tsx
export function GlobalErrorPage({ error }: { error?: Error | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>出错了</h1>
      <p style={{ color: '#666' }}>{error?.message ?? '页面渲染异常'}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        刷新页面
      </button>
    </div>
  );
}

// global-not-found-page.tsx — 同理，显示 404 信息
```

注意：这两个页面的文案是硬编码的（不走 i18n），因为它们在 Provider 树之外渲染。

- [ ] **Step 3: 提交**

```
feat(l4): 全局错误边界 + 错误/404 页面
```

---

### Task 17: 布局 + Shell 组件

**Files:**
- Create: `packages/app-shell/src/layouts/sidebar-layout.tsx`
- Create: `packages/app-shell/src/layouts/top-layout.tsx`
- Create: `packages/app-shell/src/layouts/basic-layout.tsx`
- Create: `packages/app-shell/src/layouts/index.ts`
- Create: `packages/app-shell/src/components/header.tsx`
- Create: `packages/app-shell/src/components/sidebar.tsx`
- Create: `packages/app-shell/src/components/language-switcher.tsx`
- Create: `packages/app-shell/src/components/theme-switcher.tsx`

- [ ] **Step 1: BasicLayout（最简单）**

```tsx
import type { ReactNode } from 'react';

export function BasicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
```

- [ ] **Step 2: SidebarLayout**

```tsx
import type { ReactNode } from 'react';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';

export function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TopLayout**

水平导航栏 + 内容区。结构类似 SidebarLayout 但导航在顶部。

- [ ] **Step 4: Header 组件**

包含：logo/面包屑区域 + 右侧工具栏（LanguageSwitcher + ThemeSwitcher + 用户头像 + 退出按钮）。
使用 `useTranslation('shell')` 获取文案。

- [ ] **Step 5: Sidebar 组件**

消费 `useMenu()` 渲染菜单树。菜单项点击使用 `useNavigate()` 导航。
支持展开/收起。

- [ ] **Step 6: LanguageSwitcher**

```tsx
import { useLanguage } from '../i18n';
import { DropdownMenu, Button } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation('shell');

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm">{supportedLanguages[language].label}</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {Object.entries(supportedLanguages).map(([key, { label }]) => (
          <DropdownMenu.Item key={key} onClick={() => setLanguage(key as typeof language)}>
            {label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
```

- [ ] **Step 7: ThemeSwitcher**

同 LanguageSwitcher 模式，消费 `useTheme()` + `themeRegistry`。

- [ ] **Step 8: 提交**

```
feat(l4): 3 种布局预设 + Header/Sidebar/LanguageSwitcher/ThemeSwitcher
```

---

### Task 18: Provider 树组装 + Feedback 容器 + barrel export

**Files:**
- Create: `packages/app-shell/src/feedback/toast-container.tsx`
- Create: `packages/app-shell/src/feedback/dialog-container.tsx`
- Create: `packages/app-shell/src/feedback/index.ts`
- Modify: `packages/app-shell/src/index.ts`（barrel export 全部模块）

- [ ] **Step 1: Toast 和 Dialog 容器**

Toast 容器：消费 L2 的 `Toast` 组件 + `useToast` hook。
Dialog 容器：全局命令式 Dialog（`confirm()`）。

- [ ] **Step 2: barrel export**

`src/index.ts`：
```ts
// i18n
export { i18n, registerResource, useLanguage, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, type SupportedLanguage } from './i18n';

// theme
export { ThemeProvider, useTheme } from './theme';

// auth
export { useCurrentUser, useAuth, getAccessToken, ANONYMOUS, type CurrentUser, type RequireAuthOptions } from './auth';

// data
export { createQueryClient } from './data';

// menu
export { useMenu, type MenuNode, type UserMenuPayload } from './menu';

// layouts
export { SidebarLayout, TopLayout, BasicLayout } from './layouts';

// error
export { GlobalErrorBoundary, GlobalErrorPage, GlobalNotFoundPage } from './error';

// feedback
export { ToastContainer, DialogContainer } from './feedback';
```

- [ ] **Step 3: L4 全量测试**

```bash
cd client && pnpm -F @mb/app-shell test
cd client && pnpm check:types
cd client && pnpm check:deps
```

- [ ] **Step 4: 提交**

```
feat(l4): Provider 树组件 + Feedback 容器 + barrel export
```

---

## Phase 4: L5 路由

### Task 19: TanStack Router 配置

**Files:**
- Modify: `apps/web-admin/package.json`（加依赖）
- Modify: `apps/web-admin/vite.config.ts`（加 router 插件）
- Create: `apps/web-admin/src/routes/__root.tsx`
- Create: `apps/web-admin/src/routes/index.tsx`
- Create: `apps/web-admin/src/router.ts`

- [ ] **Step 1: 更新 web-admin package.json**

新增依赖：
```json
{
  "dependencies": {
    "@mb/app-shell": "workspace:*",
    "@mb/ui-patterns": "workspace:*",
    "@mb/api-sdk": "workspace:*",
    "@tanstack/react-router": "^1.95.0",
    "@tanstack/react-query": "^5.62.0",
    "react-i18next": "^14.1.0",
    "i18next": "^23.16.0"
  },
  "devDependencies": {
    "@tanstack/router-vite-plugin": "^1.95.0",
    "msw": "^2.6.0",
    "@playwright/test": "^1.49.0"
  }
}
```

- [ ] **Step 2: 更新 vite.config.ts**

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
```

- [ ] **Step 3: 创建 root route**

```tsx
// routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { GlobalErrorPage, GlobalNotFoundPage } from '@mb/app-shell';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: ({ error }) => <GlobalErrorPage error={error instanceof Error ? error : null} />,
  notFoundComponent: () => <GlobalNotFoundPage />,
});
```

- [ ] **Step 4: 创建 index route（重定向）**

```tsx
// routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/_authed' });
  },
});
```

注意：这是临时方案，M5 实际业务后可改为仪表盘直接渲染。

- [ ] **Step 5: 创建 router.ts**

```ts
// router.ts
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type { RouterContext } from './routes/__root';

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
  });
}

// 类型注册（TanStack Router 类型推导需要）
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
```

- [ ] **Step 6: 运行 pnpm dev 生成 routeTree.gen.ts**

```bash
cd client/apps/web-admin && npx vite --force 2>&1 | head -5
# 确认 routeTree.gen.ts 已生成
ls -la src/routeTree.gen.ts
```

- [ ] **Step 7: 提交（含 routeTree.gen.ts）**

```
feat(l5): TanStack Router 配置 + root route + router 工厂
```

---

### Task 20: 认证路由

**Files:**
- Create: `apps/web-admin/src/routes/auth/login.tsx`
- Create: `apps/web-admin/src/routes/auth/forgot-password.tsx`

- [ ] **Step 1: 登录页**

```tsx
// routes/auth/login.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@mb/app-shell';
import { BasicLayout } from '@mb/app-shell';
import { Button, Input, Label } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useState } from 'react';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/auth/login')({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation('common');
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <BasicLayout>
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-card-foreground">Meta-Build</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4 space-y-2">
              <Label htmlFor="username">{t('action.search')}</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="mb-6 space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? t('status.loading') : t('action.confirm')}
            </Button>
          </form>
        </div>
      </div>
    </BasicLayout>
  );
}
```

注意：登录页文案使用 `t()` i18n（MUST #6），login 路由豁免 auth guard。

- [ ] **Step 2: 忘记密码占位页**

```tsx
// routes/auth/forgot-password.tsx
import { createFileRoute } from '@tanstack/react-router';
import { BasicLayout } from '@mb/app-shell';

export const Route = createFileRoute('/auth/forgot-password')({
  component: () => (
    <BasicLayout>
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">忘记密码功能 — 待实现</p>
      </div>
    </BasicLayout>
  ),
});
```

- [ ] **Step 3: 提交**

```
feat(l5): 认证路由（登录 + 忘记密码）
```

---

### Task 21: 受保护路由 + 仪表盘

**Files:**
- Create: `apps/web-admin/src/routes/_authed/_authed.tsx`
- Create: `apps/web-admin/src/routes/_authed/index.tsx`

- [ ] **Step 1: _authed 布局路由（认证守卫）**

```tsx
// routes/_authed/_authed.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authApi } from '@mb/api-sdk';
import { SidebarLayout } from '@mb/app-shell';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    // ensureQueryData：有缓存用缓存，过期了发请求等结果
    const user = await context.queryClient.ensureQueryData({
      queryKey: ['auth', 'me'],
      queryFn: () => authApi.getCurrentUser(),
      staleTime: 5 * 60_000,
    });
    if (!user) {
      throw redirect({ to: '/auth/login', search: { redirect: location.pathname } });
    }
    return { currentUser: user };
  },
  component: () => (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  ),
});
```

关键点：
- 使用 `ensureQueryData` 而非 `getQueryData`（后者在首次访问时返回 undefined，错误重定向到登录）
- `_authed` 前缀 = layout route，不出现在 URL 中
- 认证成功后 `{ currentUser }` 注入到子路由 context

- [ ] **Step 2: 仪表盘占位页**

```tsx
// routes/_authed/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useCurrentUser } from '@mb/app-shell';
import { useTranslation } from 'react-i18next';
import { Card } from '@mb/ui-primitives';

export const Route = createFileRoute('/_authed/')({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation('common');
  const user = useCurrentUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {user.username ?? 'User'} — Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">M3 占位卡片 1</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">M3 占位卡片 2</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">M3 占位卡片 3</p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 运行 vite dev 确认路由生成 + 页面渲染**

```bash
cd client/apps/web-admin && npx vite --force
# 确认 routeTree.gen.ts 更新
# 浏览器访问 localhost:5173 → 应重定向到 /auth/login
```

- [ ] **Step 4: 提交**

```
feat(l5): 受保护路由（_authed layout + 仪表盘占位）
```

---

## Phase 5: 集成与质量门禁

### Task 22: web-admin 入口重写 + MSW mock

**Files:**
- Rewrite: `apps/web-admin/src/main.tsx`
- Create: `apps/web-admin/src/i18n/register.ts`
- Create: `apps/web-admin/src/i18n/i18next.d.ts`
- Create: `apps/web-admin/src/mock/browser.ts`
- Create: `apps/web-admin/src/mock/handlers.ts`

- [ ] **Step 1: i18n 注册 + 类型声明**

```ts
// i18n/register.ts
import { registerResource, type SupportedLanguage } from '@mb/app-shell';

export function registerBusinessResources(): void {
  // M3 阶段无业务字典，M5 时用 import.meta.glob 加载 zh-CN/*.json + en-US/*.json
  const zhCNModules = import.meta.glob<{ default: Record<string, unknown> }>(
    './zh-CN/*.json',
    { eager: true },
  );
  const enUSModules = import.meta.glob<{ default: Record<string, unknown> }>(
    './en-US/*.json',
    { eager: true },
  );

  registerLanguage('zh-CN', zhCNModules);
  registerLanguage('en-US', enUSModules);
}

function registerLanguage(
  language: SupportedLanguage,
  modules: Record<string, { default: Record<string, unknown> }>,
): void {
  for (const [filePath, mod] of Object.entries(modules)) {
    const namespace = filePath.replace(/^\.\/[a-zA-Z-]+\//, '').replace(/\.json$/, '');
    registerResource(language, namespace, mod.default);
  }
}
```

```ts
// i18n/i18next.d.ts
import type common from '@mb/app-shell/i18n/zh-CN/common.json';
import type shell from '@mb/app-shell/i18n/zh-CN/shell.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      shell: typeof shell;
      // M5 时添加业务 namespace：order, customer, product, settings
    };
  }
}
```

- [ ] **Step 2: MSW mock handlers（仅 dev 模式）**

```ts
// mock/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' }),
  ),
  http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return HttpResponse.json(null, { status: 401 });
    return HttpResponse.json({
      userId: 1, username: 'admin',
      permissions: ['iam.user.list', 'iam.role.list', 'iam.menu.read', 'iam.menu.write'],
      roles: ['admin'], isAdmin: true,
    });
  }),
  http.get('/api/v1/menu/current', () =>
    HttpResponse.json({
      tree: [
        { id: 1, parentId: null, name: '系统管理', icon: 'settings', path: null, kind: 'directory', permissionCode: null, isOrphan: false, children: [
          { id: 2, parentId: 1, name: '用户管理', icon: 'users', path: '/settings/users', kind: 'menu', permissionCode: 'iam.user.list', isOrphan: false, children: [] },
          { id: 3, parentId: 1, name: '角色管理', icon: 'shield', path: '/settings/roles', kind: 'menu', permissionCode: 'iam.role.list', isOrphan: false, children: [] },
          { id: 4, parentId: 1, name: '菜单管理', icon: 'menu', path: '/settings/menu', kind: 'menu', permissionCode: 'iam.menu.read', isOrphan: false, children: [] },
        ]},
      ],
      permissions: ['iam.user.list', 'iam.role.list', 'iam.menu.read', 'iam.menu.write'],
    }),
  ),
];
```

```ts
// mock/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

- [ ] **Step 3: main.tsx 重写**

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { initTheme } from '@mb/ui-tokens';
import {
  i18n, createQueryClient, ThemeProvider,
  GlobalErrorBoundary, ToastContainer, DialogContainer,
} from '@mb/app-shell';
import { configureApiSdk } from '@mb/api-sdk';
import { getAccessToken } from '@mb/app-shell';
import { createAppRouter } from './router';
import { registerBusinessResources } from './i18n/register';
import './styles.css';

// Phase 1: 同步初始化（React 渲染前）
initTheme();
registerBusinessResources();

// api-sdk 配置
configureApiSdk({
  basePath: '',
  getToken: () => getAccessToken(),
  getLanguage: () => i18n.language,
  onUnauthenticated: () => { window.location.href = '/auth/login'; },
  onForbidden: (err) => { console.error('[403]', err.message); },
  onServerError: (err) => { console.error('[5xx]', err.message); },
});

// QueryClient + Router
const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

// MSW（仅 dev 模式）
async function enableMocking() {
  if (import.meta.env.PROD) return;
  const { worker } = await import('./mock/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  createRoot(rootEl).render(
    <StrictMode>
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <ThemeProvider>
              <RouterProvider router={router} />
              <ToastContainer />
              <DialogContainer />
            </ThemeProvider>
          </I18nextProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </StrictMode>,
  );
});
```

Provider 树 6 层严格顺序：
1. `GlobalErrorBoundary` — 兜底
2. `QueryClientProvider` — TanStack Query 上下文
3. `I18nextProvider` — i18n
4. `ThemeProvider` — 主题
5. `RouterProvider` — 路由
6. `ToastContainer` + `DialogContainer` — 全局反馈

- [ ] **Step 4: 运行 dev server 验证完整流程**

```bash
cd client && pnpm dev
# 1. 访问 localhost:5173 → 重定向到 /auth/login
# 2. 输入任意用户名密码 → 登录 → 跳转到仪表盘
# 3. 侧边栏显示 mock 菜单
# 4. 主题切换、语言切换正常工作
```

- [ ] **Step 5: 提交**

```
feat(l5): 入口重写（6 层 Provider 树 + MSW mock + i18n 注册）
```

---

### Task 23: 质量脚本

**Files:**
- Create: `client/scripts/check-i18n.ts`
- Create: `client/scripts/check-business-words.ts`
- Modify: `client/package.json`（加 scripts）

- [ ] **Step 1: check-i18n.ts**

遍历 `packages/app-shell/src/i18n/` 和 `apps/web-admin/src/i18n/` 下的 JSON 文件，按 namespace 分组，比较 zh-CN 和 en-US 的 key 集合。不一致则 `process.exit(1)`。

核心逻辑（~40 行）：
```ts
import fs from 'node:fs';
import path from 'node:path';

const I18N_DIRS = [
  'packages/app-shell/src/i18n',
  'apps/web-admin/src/i18n',
];

interface Dict { language: string; namespace: string; keys: Set<string> }

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null ? flattenKeys(v as Record<string, unknown>, key) : [key];
  });
}

// ...遍历目录、加载 JSON、按 namespace 比较 key 集合
// 不一致时打印缺失/多余的 key，exit(1)
```

- [ ] **Step 2: check-business-words.ts**

扫描 `packages/ui-patterns/src/*.tsx`（排除 `.test.tsx` 和 `.stories.tsx`），检查是否包含业务词汇。

```ts
const FORBIDDEN_WORDS = [
  'Order', 'Customer', 'Product', 'Sku',
  '订单', '客户', '商品', '库存',
];
// 逐文件扫描，发现违禁词 exit(1)
```

- [ ] **Step 3: 更新 package.json scripts**

```json
{
  "scripts": {
    "check:i18n": "tsx scripts/check-i18n.ts",
    "check:business-words": "tsx scripts/check-business-words.ts",
    "test": "pnpm -F @mb/ui-primitives test && pnpm -F @mb/ui-patterns test && pnpm -F @mb/app-shell test",
    "storybook": "pnpm -F @mb/ui-primitives storybook"
  }
}
```

- [ ] **Step 4: 运行验证**

```bash
cd client && pnpm check:i18n && pnpm check:business-words
```

- [ ] **Step 5: 提交**

```
feat: check:i18n + check:business-words 质量脚本
```

---

### Task 24: 依赖规则 + Biome + E2E 配置 + 全量验证

**Files:**
- Modify: `client/.dependency-cruiser.cjs`（加 M3 规则）
- Modify: `client/biome.json`（加限制规则）
- Create: `apps/web-admin/playwright.config.ts`
- Create: `apps/web-admin/e2e/login.spec.ts`

- [ ] **Step 1: 更新 dependency-cruiser 规则**

新增 MUST NOT #4 和 #5 规则：

```js
// features 不能直接导入 @mb/api-sdk 的 auth 模块
{
  name: 'features-no-api-sdk-auth',
  severity: 'error',
  comment: 'MUST NOT #4: features/** 禁止直接导入 authApi',
  from: { path: '^apps/web-admin/src/features' },
  to: { path: '.*api-sdk.*auth' },
},
// routes/auth/** 豁免
{
  name: 'auth-routes-may-import-auth-api',
  severity: 'ignore',
  from: { path: '^apps/web-admin/src/routes/auth/' },
  to: { path: '.*api-sdk.*auth' },
},
// L3 不能导入 @tanstack/react-query, @tanstack/react-router, i18next
{
  name: 'l3-no-forbidden-deps',
  severity: 'error',
  comment: 'L3 隔离：禁止导入路由/查询/i18n',
  from: { path: '^packages/ui-patterns/src' },
  to: { path: '@tanstack/react-query|@tanstack/react-router|i18next|react-i18next' },
},
```

- [ ] **Step 2: Playwright 配置**

```ts
// apps/web-admin/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: 基础 E2E 测试**

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('未登录重定向到登录页', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('登录后跳转到仪表盘', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[id="username"]', 'admin');
  await page.fill('input[id="password"]', 'admin');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/_authed/);
});
```

- [ ] **Step 4: 全量验证（M3 完成标准）**

```bash
cd client && pnpm install

# 1. 构建
pnpm build

# 2. 类型检查
pnpm check:types

# 3. 单元测试
pnpm test

# 4. 主题完整性
pnpm check:theme

# 5. i18n 完整性
pnpm check:i18n

# 6. 业务词汇扫描
pnpm check:business-words

# 7. 代码规范
pnpm lint

# 8. CSS 规范
pnpm lint:css

# 9. 依赖方向
pnpm check:deps

# 10. Storybook 构建（L2 + L3）
pnpm -F @mb/ui-primitives storybook:build
pnpm -F @mb/ui-patterns storybook:build

# 11. E2E（需要 dev server）
cd apps/web-admin && npx playwright test
```

全部通过 = M3 交付标准达成。

- [ ] **Step 5: 提交**

```
feat: M3 质量门禁（dep-cruiser 规则 + Playwright + 全量验证通过）
```

---

## 质量检查点汇总

| 阶段 | 验证命令 | 预期 |
|------|---------|------|
| Phase 1 完成 | `pnpm install && pnpm check:types` | 零错误 |
| Phase 2 完成（L3） | `pnpm -F @mb/ui-patterns test && storybook:build` | 全绿 |
| Phase 3 完成（L4） | `pnpm -F @mb/app-shell test && pnpm check:types` | 全绿 |
| Phase 4 完成（L5） | `pnpm build && pnpm dev`（手动验证登录流程） | 可运行 |
| Phase 5 完成（M3） | 全量 11 项检查 | 全绿 |

---

## 风险与注意事项

1. **api-sdk M3 临时方案**：M3 手写类型 + HTTP 客户端。M5 集成时切换为 OpenAPI 生成，拦截器代码复用。手写类型的字段必须与后端 spec 一致（参考 `docs/specs/backend/06-contract-api.md`）。

2. **MSW 仅 dev 模式**：`import.meta.env.PROD` 时跳过 MSW。生产构建不包含 mock 代码（dynamic import + tree shaking）。

3. **routeTree.gen.ts 必须提交到 git**：TanStack Router 的类型推导依赖此文件。每次修改 routes/ 后重新生成。

4. **L3 组件 Story 中可以使用中文字面量**（展示用），但组件源码禁止中文业务词汇。

5. **ErrorBoundary 和 NotFound 页面使用内联样式**：因为它们可能在 ThemeProvider 初始化之前渲染。

6. **useNavigate 在 L4 中的使用**：L4 的 Sidebar、Header 等组件需要 `useNavigate`，而 `@tanstack/react-router` 是 L4 的允许依赖。

7. **L3 ApiSelect 不使用 useQuery**：内部用 useState + useEffect + debounce 实现异步状态，fetcher 由调用方注入。

8. **Phase 2（L3）和 Task 3（api-sdk）可并行执行**：它们之间无依赖关系。
