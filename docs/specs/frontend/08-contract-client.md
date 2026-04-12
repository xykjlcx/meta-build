# 08 - 契约客户端 @mb/api-sdk 消费

> **关注点**：`@mb/api-sdk` 的消费规范 + 契约驱动链路（对称于后端 06-api-and-contract）+ 请求拦截器（Authorization / Accept-Language / X-Request-ID）+ ProblemDetail 错误处理 + PageResult 类型约束 + 认证门面豁免。
>
> **本文件吸收**：brainstorming 决策 2（契约密度务实方案）+ 千人千面 MUST #4（L5 必须通过 @mb/api-sdk 调后端）+ MUST NOT #4（features/** 禁止直接 import @mb/api-sdk/auth 状态接口）。
>
> **关键交叉引用**：[../backend/06-api-and-contract.md](../backend/06-api-and-contract.md)（后端 springdoc / ProblemDetail / PageResult 的权威定义）+ [05-app-shell.md](./05-app-shell.md)（i18n 运行时语言 + 认证门面）+ [07-menu-permission.md](./07-menu-permission.md)（AppPermission 联合类型）。

---

## 1. 决策结论 [M3+M4]

### 1.1 契约驱动的三条铁律

| 铁律 | 具体含义 |
|------|---------|
| **后端是契约的权威** | Controller `@Operation` + DTO 注解驱动 OpenAPI 3.1 → OpenAPI Generator → 前端 `@mb/api-sdk`；前端**不能**手写 DTO 类型，全部从契约生成 |
| **所有 API 调用必须通过 `@mb/api-sdk`** | L5 业务代码禁止手写 `fetch` / `axios`；编译期通过 dependency-cruiser + `no-restricted-imports` 强制 |
| **拦截器是单点** | `Authorization` / `Accept-Language` / `X-Request-ID` 三个 header 的注入在 SDK 工厂层统一完成，业务代码零感知 |

### 1.2 最小集 MVP

v1 只做"契约生成 + 客户端消费 + 拦截器 + 错误处理"的最小闭环；不做：

- ❌ Spectral lint（延后到 M6）
- ❌ oasdiff breaking change 检查（延后到 M6）
- ❌ Mock server（Storybook + msw 够用）
- ❌ 运行时契约校验（zod schema 双写是 YAGNI，TypeScript strict 已经够）

对齐后端决策见 [../backend/06-api-and-contract.md §6.1](../backend/06-api-and-contract.md)。

### 1.3 milestone 分布

| 阶段 | 内容 |
|------|------|
| `[M3]` | `@mb/api-sdk` 包骨架 + 拦截器实现 + L4 `GlobalErrorHandler` + `ProblemDetailError` 异常类型 |
| `[M4]` | 后端 springdoc 配置齐全 + OpenAPI Generator CI 任务 + 首个业务模块（platform-iam）端到端跑通 |
| `[M3+M4]` | 联调 + dependency-cruiser 豁免规则 + 权限清单同步 |

---

## 2. 契约驱动链路（对称于后端 06-api-and-contract）

### 2.1 全链路图

```
┌────────────────────────────────┐
│ 后端 Controller + DTO          │
│ @Operation / @Schema / @ApiResponses │
│ @RequirePermission("xxx")      │
└───────────────┬────────────────┘
                │ springdoc 运行时扫描（maven plugin）
                ▼
┌────────────────────────────────┐
│ OpenAPI 3.1 JSON               │
│ 产物：server/mb-admin/target/  │
│       openapi.json             │
│ 基线：server/api-contract/     │
│       openapi-v1.json（入 git）│
└───────────────┬────────────────┘
                │ OpenAPI Generator (typescript-fetch)
                ▼
┌────────────────────────────────┐
│ @mb/api-sdk                    │
│ client/packages/api-sdk/src/   │
│   ├── generated/ （不入 git）  │
│   │     ├── apis/*.ts          │
│   │     ├── models/*.ts        │
│   │     └── runtime.ts         │
│   ├── index.ts  （手写包装层） │
│   ├── interceptors.ts          │
│   └── errors.ts                │
└───────────────┬────────────────┘
                │ import { orderApi, menuApi, ... }
                ▼
┌────────────────────────────────┐
│ L5 features 业务代码           │
│ apps/web-admin/src/features/** │
│ tsc --noEmit                   │
└────────────────────────────────┘

  后端改 DTO → springdoc 重新扫描 → openapi-v1.json 变化 →
  OpenAPI Generator 重跑 → generated/*.ts 变化 →
  L5 业务代码 tsc 立即报错（字段不同步 → CI 红）
```

### 2.2 api-sdk 入 git 策略

对齐后端决策 [../backend/06-api-and-contract.md §10](../backend/06-api-and-contract.md)：

| 路径 | git 状态 | 说明 |
|------|---------|------|
| `client/packages/api-sdk/src/index.ts` | ✅ 入 git | 手写的包装层（导出 + 拦截器 + 错误类型） |
| `client/packages/api-sdk/src/interceptors.ts` | ✅ 入 git | 拦截器实现 |
| `client/packages/api-sdk/src/errors.ts` | ✅ 入 git | `ProblemDetailError` 定义 |
| `client/packages/api-sdk/src/generated/` | ❌ **不入 git** | CI 重新生成，`.gitignore` 排除 |
| `client/packages/api-sdk/package.json` | ✅ 入 git | 包元信息 |
| `server/api-contract/openapi-v1.json` | ✅ 入 git | 契约基线（后端 commit 时一起更新） |

**为什么 generated 不入 git**：

1. 避免 PR diff 噪音（DTO 改一个字段，generated 会变成百行 diff）
2. 强制 CI 重新生成，保证"契约和代码一致"是构建行为而非人工维护
3. 后端改 DTO → CI fail（因为 generated 变化和 openapi-v1.json 不匹配）

### 2.3 构建时 vs 启动时生成

| 场景 | 行为 |
|------|------|
| 后端开发 | 本地 `mvn springdoc:generate` 生成 `target/openapi.json`，自测接口 |
| 后端 commit 前 | `cp target/openapi.json ../api-contract/openapi-v1.json && git add` |
| 前端开发 | `pnpm generate:api-sdk` 基于 `server/api-contract/openapi-v1.json` 生成 `generated/` |
| CI | `pnpm generate:api-sdk && pnpm -F web-admin tsc --noEmit`（类型不一致立即失败） |
| 前端运行时 | ❌ 不做运行时契约生成或校验 |

---

## 3. @mb/api-sdk 使用规范

### 3.1 所有 API 调用必须通过 @mb/api-sdk

**禁止**：

```ts
// ❌ L5 features 里手写 fetch，违反 MUST #4
import { useQuery } from '@tanstack/react-query';

export function useOrderList(): ReturnType<typeof useQuery> {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/orders');          // ❌
      return res.json();
    }
  });
}
```

**正确**：

```ts
// ✅ L5 features 通过 @mb/api-sdk 调用
import { useQuery } from '@tanstack/react-query';
import { orderApi, type OrderView, type PageResult } from '@mb/api-sdk';

export function useOrderList(
  page: number,
  size: number
): ReturnType<typeof useQuery<PageResult<OrderView>, Error>> {
  return useQuery<PageResult<OrderView>, Error>({
    queryKey: ['orders', 'list', page, size],
    queryFn: () => orderApi.list({ page, size })
  });
}
```

### 3.2 禁止手写 fetch / axios 的工具守护

| 守护层 | 工具 | 配置位置 | 拦截的违反 |
|-------|------|---------|----------|
| Biome | `noRestrictedGlobals` + `noRestrictedImports` | `biome.json` + `apps/web-admin/biome.json` | `fetch(...)` 全局调用、`import axios from 'axios'` |
| dependency-cruiser | `forbidden` 规则 | `.dependency-cruiser.cjs` | L5 import `axios` / `ky` / `got` 等 HTTP 库 |
| pnpm workspace | package.json `dependencies` 不包含 axios | `apps/web-admin/package.json` | 根本没法 install |

```json
// apps/web-admin/biome.json（节选）
{
  "linter": {
    "rules": {
      "nursery": {
        "noRestrictedGlobals": {
          "level": "error",
          "options": {
            "deniedGlobals": ["fetch", "XMLHttpRequest"]
          }
        }
      },
      "correctness": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "axios": "Use @mb/api-sdk; see docs/specs/frontend/08-contract-client.md",
              "ky": "Use @mb/api-sdk; see docs/specs/frontend/08-contract-client.md",
              "got": "Use @mb/api-sdk; see docs/specs/frontend/08-contract-client.md"
            }
          }
        }
      }
    }
  }
}
```

### 3.3 类型强制（请求 + 响应）

生成出来的 DTO 类型约束：

```ts
// client/packages/api-sdk/src/generated/models/OrderView.ts （生成产物，示意）
export interface OrderView {
  id: number;
  orderNo: string;
  amount: string;                 // 后端 BigDecimal → string 避免精度损失
  status: 'DRAFT' | 'PAID' | 'SHIPPED' | 'CANCELLED';
  customerId: number;
  createdAt: string;              // Instant → ISO-8601 string
}

export interface OrderCreateCommand {
  customerId: number;
  amount: string;
  remark?: string;
}
```

字段拼错、类型写错时 `tsc --noEmit` 立即失败：

```ts
// features/orders/use-create-order.ts
import { useMutation } from '@tanstack/react-query';
import { orderApi, type OrderCreateCommand, type OrderView } from '@mb/api-sdk';

export function useCreateOrder(): ReturnType<
  typeof useMutation<OrderView, Error, OrderCreateCommand>
> {
  return useMutation<OrderView, Error, OrderCreateCommand>({
    mutationFn: (cmd) => orderApi.create(cmd)
  });
}
```

---

## 4. 请求拦截器

### 4.1 拦截器工厂和注册

`@mb/api-sdk` 在包入口暴露一个 `configureApiSdk` 函数，L4 `@mb/app-shell` 在应用启动时调用一次：

```ts
// client/packages/api-sdk/src/index.ts
import { Configuration, type ConfigurationParameters, type Middleware } from './generated/runtime';
import { OrderApi } from './generated/apis/OrderApi';
import { IamUserApi } from './generated/apis/IamUserApi';
import { MenuApi } from './generated/apis/MenuApi';
import { AuthApi } from './generated/apis/AuthApi';
import { createAuthorizationMiddleware } from './interceptors/authorization';
import { createAcceptLanguageMiddleware } from './interceptors/accept-language';
import { createRequestIdMiddleware } from './interceptors/request-id';
import { createErrorMiddleware } from './interceptors/error';

export type { OrderView, OrderCreateCommand } from './generated/models/OrderView';
export type { UserView, UserQuery } from './generated/models/UserView';
export type { MenuNodeDto, RouteTreeNodeDto } from './generated/models/MenuNodeDto';
export type { PageResult } from './generated/models/PageResult';
export type { ProblemDetail } from './generated/models/ProblemDetail';
export type { AppPermission, ALL_APP_PERMISSIONS } from './generated/permissions';
export { ProblemDetailError } from './errors';

export interface ApiSdkConfig {
  basePath: string;                               // 例：'/api'
  getToken: () => string | null;                  // 由 @mb/app-shell 提供
  getLanguage: () => string;                      // 由 @mb/app-shell 提供
  onUnauthenticated: () => void;                  // 401 时触发跳登录页
  onForbidden: (err: ProblemDetailError) => void; // 403 时 toast
  onServerError: (err: ProblemDetailError) => void; // 500 时 dialog
  generateRequestId: () => string;                // 默认 crypto.randomUUID
}

let orderApiInstance: OrderApi | null = null;
let iamUserApiInstance: IamUserApi | null = null;
let menuApiInstance: MenuApi | null = null;
let authApiInstance: AuthApi | null = null;

export function configureApiSdk(config: ApiSdkConfig): void {
  const middleware: Middleware[] = [
    createAuthorizationMiddleware(config.getToken),
    createAcceptLanguageMiddleware(config.getLanguage),
    createRequestIdMiddleware(config.generateRequestId),
    createErrorMiddleware({
      onUnauthenticated: config.onUnauthenticated,
      onForbidden: config.onForbidden,
      onServerError: config.onServerError
    })
  ];
  const sdkConfig = new Configuration({
    basePath: config.basePath,
    middleware
  } as ConfigurationParameters);

  orderApiInstance = new OrderApi(sdkConfig);
  iamUserApiInstance = new IamUserApi(sdkConfig);
  menuApiInstance = new MenuApi(sdkConfig);
  authApiInstance = new AuthApi(sdkConfig);
}

function mustBeConfigured<T>(instance: T | null, name: string): T {
  if (instance == null) {
    throw new Error(`@mb/api-sdk not configured. Call configureApiSdk() in @mb/app-shell before use. Missing: ${name}`);
  }
  return instance;
}

export const orderApi = new Proxy({} as OrderApi, {
  get: (_target, prop) => Reflect.get(mustBeConfigured(orderApiInstance, 'orderApi') as object, prop)
});
export const iamUserApi = new Proxy({} as IamUserApi, {
  get: (_target, prop) => Reflect.get(mustBeConfigured(iamUserApiInstance, 'iamUserApi') as object, prop)
});
export const menuApi = new Proxy({} as MenuApi, {
  get: (_target, prop) => Reflect.get(mustBeConfigured(menuApiInstance, 'menuApi') as object, prop)
});
// authApi 有专用导出路径，features/** 通过 dependency-cruiser 被禁止引用，见 §6
export const authApi = new Proxy({} as AuthApi, {
  get: (_target, prop) => Reflect.get(mustBeConfigured(authApiInstance, 'authApi') as object, prop)
});
```

### 4.2 Authorization header（Sa-Token）

Sa-Token 配置的 `token-name: Authorization` + `token-prefix: Bearer`（见 [../backend/05-security.md §1](../backend/05-security.md)），前端拦截器按该格式注入：

```ts
// client/packages/api-sdk/src/interceptors/authorization.ts
import type { Middleware, RequestContext, FetchParams } from '../generated/runtime';

export function createAuthorizationMiddleware(
  getToken: () => string | null
): Middleware {
  return {
    pre: async (ctx: RequestContext): Promise<FetchParams | void> => {
      const token = getToken();
      if (token == null || token.length === 0) {
        return;
      }
      const headers = new Headers(ctx.init.headers);
      headers.set('Authorization', `Bearer ${token}`);
      return {
        url: ctx.url,
        init: { ...ctx.init, headers }
      };
    }
  };
}
```

**token 来源**：登录成功后写入 `localStorage`（key: `mb_token`），`getToken` 直接读取 `localStorage.getItem('mb_token')`。

### 4.3 Accept-Language（和 i18n 运行时语言同步）

```ts
// client/packages/api-sdk/src/interceptors/accept-language.ts
import type { Middleware, RequestContext, FetchParams } from '../generated/runtime';

export function createAcceptLanguageMiddleware(
  getLanguage: () => string
): Middleware {
  return {
    pre: async (ctx: RequestContext): Promise<FetchParams | void> => {
      const lang = getLanguage();
      const headers = new Headers(ctx.init.headers);
      headers.set('Accept-Language', lang);       // 例：'zh-CN' / 'en-US'
      return {
        url: ctx.url,
        init: { ...ctx.init, headers }
      };
    }
  };
}
```

`getLanguage()` 由 `@mb/app-shell` 实现，返回 `useLanguage()` hook 内部的运行时语言（见 [05-app-shell.md §7.4](./05-app-shell.md)）。运行时切换语言后，**下一次**请求自动带新的 Accept-Language——拦截器每次 pre 都重新读取当前值。

后端 `LocaleResolver: AcceptHeaderLocaleResolver` 接收并选择对应的 `MessageSource` locale（见 [../backend/06-api-and-contract.md §4](../backend/06-api-and-contract.md)），ProblemDetail 的 `title` / `detail` 自动翻译。

### 4.4 X-Request-ID（前端注入 traceId）

```ts
// client/packages/api-sdk/src/interceptors/request-id.ts
import type { Middleware, RequestContext, FetchParams } from '../generated/runtime';

export function createRequestIdMiddleware(
  generateRequestId: () => string
): Middleware {
  return {
    pre: async (ctx: RequestContext): Promise<FetchParams | void> => {
      const headers = new Headers(ctx.init.headers);
      headers.set('X-Request-ID', generateRequestId());
      return {
        url: ctx.url,
        init: { ...ctx.init, headers }
      };
    }
  };
}
```

**默认实现**：

```ts
// apps/web-admin/src/app/setup-api-sdk.ts
import { configureApiSdk } from '@mb/api-sdk';

configureApiSdk({
  basePath: '/api',
  getToken: () => localStorage.getItem('mb_token'),
  getLanguage: () => i18nStore.getState().language,
  onUnauthenticated: () => router.navigate({ to: '/auth/login' }),
  onForbidden: (err) => toast.error(err.title ?? 'Forbidden'),
  onServerError: (err) => openErrorDialog(err),
  generateRequestId: () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`
});
```

后端把 `X-Request-ID` 透传到 `MDC.traceId`，出现在日志和 5xx ProblemDetail 的 `traceId` 字段里——线上问题排查时能从前端控制台直接跳到后端日志。

---

## 5. 错误处理

### 5.1 ProblemDetailError 类型定义

后端错误响应遵循 RFC 9457 ProblemDetail（[../backend/06-api-and-contract.md §2-§5](../backend/06-api-and-contract.md)）。前端把它包装成一个具体的 Error 子类：

```ts
// client/packages/api-sdk/src/errors.ts
import type { ProblemDetail } from './generated/models/ProblemDetail';

export class ProblemDetailError extends Error {
  readonly status: number;
  readonly type: string;
  readonly title: string | null;
  readonly detail: string | null;
  readonly instance: string | null;
  readonly code: string | null;              // 扩展字段：业务错误码
  readonly traceId: string | null;           // 扩展字段：traceId
  readonly validationErrors: ReadonlyArray<{ field: string; message: string }>;

  constructor(payload: ProblemDetail) {
    super(payload.detail ?? payload.title ?? `HTTP ${payload.status}`);
    this.name = 'ProblemDetailError';
    this.status = payload.status ?? 0;
    this.type = payload.type ?? 'about:blank';
    this.title = payload.title ?? null;
    this.detail = payload.detail ?? null;
    this.instance = payload.instance ?? null;
    this.code = (payload as ProblemDetail & { code?: string }).code ?? null;
    this.traceId = (payload as ProblemDetail & { traceId?: string }).traceId ?? null;
    const errors = (payload as ProblemDetail & {
      errors?: ReadonlyArray<{ field: string; message: string }>;
    }).errors;
    this.validationErrors = errors ?? [];
  }
}
```

### 5.2 错误中间件：按 type/status 分发

```ts
// client/packages/api-sdk/src/interceptors/error.ts
import type { Middleware, ResponseContext } from '../generated/runtime';
import type { ProblemDetail } from '../generated/models/ProblemDetail';
import { ProblemDetailError } from '../errors';

export interface ErrorMiddlewareOptions {
  onUnauthenticated: () => void;
  onForbidden: (err: ProblemDetailError) => void;
  onServerError: (err: ProblemDetailError) => void;
}

export function createErrorMiddleware(options: ErrorMiddlewareOptions): Middleware {
  return {
    post: async (ctx: ResponseContext): Promise<Response | void> => {
      const { response } = ctx;
      if (response.ok) {
        return response;
      }
      const contentType = response.headers.get('Content-Type') ?? '';
      if (!contentType.includes('application/problem+json')) {
        const err = new ProblemDetailError({
          status: response.status,
          type: 'about:blank',
          title: response.statusText,
          detail: `Unexpected error: ${response.status} ${response.statusText}`
        } as ProblemDetail);
        dispatch(err, options);
        throw err;
      }
      const payload = (await response.clone().json()) as ProblemDetail;
      const err = new ProblemDetailError(payload);
      dispatch(err, options);
      throw err;
    }
  };
}

function dispatch(err: ProblemDetailError, options: ErrorMiddlewareOptions): void {
  if (err.status === 401) {
    options.onUnauthenticated();
    return;
  }
  if (err.status === 403) {
    options.onForbidden(err);
    return;
  }
  if (err.status >= 500) {
    options.onServerError(err);
    return;
  }
  // 4xx（非 401/403）由调用方处理：表单错误、Toast 等
}
```

**分发规则**：

| HTTP Status | 默认行为 | 业务代码额外可做的 |
|-------------|---------|-------------------|
| `2xx` | 返回业务对象 / `PageResult<T>` | — |
| `400`（validation） | 抛 `ProblemDetailError`，`validationErrors` 有值 | 业务代码 catch 后映射到表单 error |
| `400`（业务） | 抛 `ProblemDetailError`，`code` 有值 | 业务代码 catch 后展示业务提示 |
| `401` | 拦截器调 `onUnauthenticated()` → 跳 `/auth/login` | 清 token |
| `403` | 拦截器调 `onForbidden()` → Toast | 业务代码可以再 catch 降级 |
| `404` | 抛 `ProblemDetailError` | 业务代码 catch 后渲染"不存在"空状态 |
| `409` / `422` | 抛 `ProblemDetailError` | 业务代码 catch 后展示冲突 |
| `5xx` | 拦截器调 `onServerError()` → Dialog 展示 `traceId` | — |

### 5.3 L5 业务代码的错误处理示例

```tsx
// apps/web-admin/src/features/orders/order-create-form.tsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { orderApi, ProblemDetailError, type OrderCreateCommand, type OrderView } from '@mb/api-sdk';
import { NxForm, NxInput, NxButton } from '@mb/ui-patterns';

const schema = z.object({
  customerId: z.number().int().positive(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  remark: z.string().optional()
});

export const OrderCreateForm: React.FC = () => {
  const { t } = useTranslation('order');
  const form = useForm<OrderCreateCommand>({ resolver: zodResolver(schema) });

  const mutation = useMutation<OrderView, ProblemDetailError, OrderCreateCommand>({
    mutationFn: (cmd) => orderApi.create(cmd),
    onError: (err) => {
      if (err.validationErrors.length > 0) {
        for (const v of err.validationErrors) {
          form.setError(v.field as keyof OrderCreateCommand, { message: v.message });
        }
        return;
      }
      if (err.code === 'order.duplicate') {
        form.setError('customerId', { message: t('duplicateOrder') });
        return;
      }
      // 401/403/5xx 已由拦截器处理
    }
  });

  return (
    <NxForm onSubmit={form.handleSubmit((cmd) => mutation.mutate(cmd))}>
      <NxInput name="customerId" control={form.control} label={t('fields.customerId')} />
      <NxInput name="amount" control={form.control} label={t('fields.amount')} />
      <NxInput name="remark" control={form.control} label={t('fields.remark')} optional />
      <NxButton type="submit" loading={mutation.isPending}>
        {t('actions.create')}
      </NxButton>
    </NxForm>
  );
};
```

### 5.4 PageResult 类型约束

对称于后端 [../backend/06-api-and-contract.md §3](../backend/06-api-and-contract.md)：

```ts
// client/packages/api-sdk/src/generated/models/PageResult.ts （生成产物，示意）
export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;            // 从 1 开始
  size: number;
}
```

L5 使用：

```ts
import { orderApi, type PageResult, type OrderView } from '@mb/api-sdk';
import { useQuery } from '@tanstack/react-query';

export function useOrderPage(page: number, size: number) {
  return useQuery<PageResult<OrderView>, Error>({
    queryKey: ['orders', page, size],
    queryFn: () => orderApi.list({ page, size })
  });
}
```

**约定**：所有分页查询用 `PageResult<T>`，非分页查询直接返回对象或数组（和后端一致）。

---

## 6. 认证门面豁免

### 6.1 features/** 禁止直接 import @mb/api-sdk/auth 状态接口

千人千面 MUST NOT #4：

> `apps/web-admin/src/features/**` 直接 import `@mb/api-sdk/auth/*` 的状态管理接口（`routes/auth/**` 豁免）

**为什么要禁**：

- 如果 `features/orders/...` 直接调 `authApi.getMe()`，就绕过了 `useCurrentUser()` 门面——同一份"当前用户"可能在多个业务点被独立拉取，缓存不一致，且难以统一切换认证框架（例如 Sa-Token → SSO）
- `features/iam/user/...` 直接调 `authApi.refreshToken()`，意味着业务代码持有"技术操作的钥匙"，违反认证门面单一入口

**正确姿势**：

| 场景 | 正确做法 |
|------|---------|
| 要读当前用户 | `const user = useCurrentUser()` |
| 要判断权限 | `const { hasPermission } = useCurrentUser(); hasPermission('order.delete')` |
| 要登录 | `const { login } = useAuth(); await login(form)` |
| 要登出 | `const { logout } = useAuth(); await logout()` |
| 要刷新 token | `useAuth().refresh()` |
| **要直接调 `authApi.login()`** | ❌ 禁止，除非在 `routes/auth/**` |

### 6.2 dependency-cruiser 子路径规则

```js
// client/.dependency-cruiser.cjs（节选）
module.exports = {
  forbidden: [
    {
      name: 'features-must-not-import-auth-api',
      severity: 'error',
      comment:
        'apps/web-admin/src/features/** 禁止直接 import @mb/api-sdk 的 auth 接口。' +
        '应该通过 @mb/app-shell 提供的 useCurrentUser() / useAuth() 门面调用。' +
        '详见 docs/specs/frontend/08-contract-client.md §6',
      from: {
        path: '^apps/web-admin/src/features/'
      },
      to: {
        path: '^packages/api-sdk/src/(index\\.ts|.*)$',
        pathNot: [
          // 允许 import 非 auth 的 API 和类型
          '^packages/api-sdk/src/(generated/apis/(Order|Menu|IamUser|Audit)|generated/models/|errors\\.ts)'
        ],
        dependencyTypes: ['local', 'npm'],
        // 精确匹配：禁止从 api-sdk 入口 re-export 的 authApi / AuthApi 类型
        reachable: false
      }
    }
  ]
};
```

**豁免**：

```js
// 豁免白名单：routes/auth/** 可以直接 import authApi
{
  name: 'auth-routes-may-import-auth-api',
  severity: 'info',
  from: {
    path: '^apps/web-admin/src/routes/auth/'
  },
  to: {
    path: '^packages/api-sdk/src/generated/apis/AuthApi'
  }
}
```

### 6.3 豁免路径 routes/auth/**

登录页 / 忘记密码 / 注册页是"登录态建立者"，它们必须直接调用 `authApi`，因为此时 `useCurrentUser()` 还没数据：

```tsx
// apps/web-admin/src/routes/auth/login.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { authApi, type LoginCommand } from '@mb/api-sdk';  // 豁免：routes/auth/** 可以直调

function LoginPage(): React.ReactElement {
  const form = useForm<LoginCommand>();
  const router = useRouter();

  const onSubmit = form.handleSubmit(async (cmd) => {
    const result = await authApi.login(cmd);
    localStorage.setItem('mb_token', result.token);
    // 刷新路由（触发 _authed beforeLoad 重新 ensureQueryData）
    await router.invalidate();
  });

  return (/* ... */);
}

export const Route = createFileRoute('/auth/login')({
  component: LoginPage
});
```

**对照**（错误示范）：

```tsx
// ❌ features/profile/profile-page.tsx 里直接调 authApi
import { authApi } from '@mb/api-sdk';

export function ProfilePage() {
  const [me, setMe] = React.useState(null);
  React.useEffect(() => {
    authApi.getMe().then(setMe);  // ❌ dependency-cruiser 报错
  }, []);
  return <div>{me?.username}</div>;
}
```

正确姿势：

```tsx
// ✅ 通过门面
import { useCurrentUser } from '@mb/app-shell';

export function ProfilePage() {
  const me = useCurrentUser();
  return <div>{me.username}</div>;
}
```

---

## 7. 完整代码示例：一次 API 调用的全链路

场景：用户在订单列表页点击"删除"按钮，前端调用 `DELETE /api/v1/orders/:id`。

### 7.1 后端 Controller 声明

```java
// mb-business/business-order/.../web/OrderController.java
@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order", description = "订单管理")
@RequiredArgsConstructor
public class OrderController {

    private final OrderApi orderApi;

    @Operation(summary = "删除订单", description = "删除订单")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "删除成功"),
        @ApiResponse(responseCode = "403", description = "缺少权限",
            content = @Content(mediaType = "application/problem+json",
                schema = @Schema(implementation = ProblemDetail.class))),
        @ApiResponse(responseCode = "404", description = "订单不存在")
    })
    @DeleteMapping("/{id}")
    @RequirePermission("order.delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderApi.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 7.2 OpenAPI 扫描产物（节选）

```json
{
  "paths": {
    "/api/v1/orders/{id}": {
      "delete": {
        "tags": ["Order"],
        "summary": "删除订单",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "integer", "format": "int64" }
          }
        ],
        "responses": {
          "204": { "description": "删除成功" },
          "403": {
            "description": "缺少权限",
            "content": {
              "application/problem+json": {
                "schema": { "$ref": "#/components/schemas/ProblemDetail" }
              }
            }
          }
        }
      }
    }
  }
}
```

### 7.3 api-sdk 生成产物（节选）

```ts
// client/packages/api-sdk/src/generated/apis/OrderApi.ts（生成产物示意）
export class OrderApi extends runtime.BaseAPI {
  async delete(requestParameters: { id: number }): Promise<void> {
    await this.request({
      path: `/api/v1/orders/${encodeURIComponent(requestParameters.id)}`,
      method: 'DELETE'
    });
  }
}
```

### 7.4 L5 业务代码调用

```tsx
// apps/web-admin/src/features/orders/order-delete-button.tsx
import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { orderApi, ProblemDetailError } from '@mb/api-sdk';
import { NxButton, NxConfirmDialog, useToast } from '@mb/ui-patterns';

export interface OrderDeleteButtonProps {
  orderId: number;
  orderNo: string;
}

export const OrderDeleteButton: React.FC<OrderDeleteButtonProps> = ({ orderId, orderNo }) => {
  const { t } = useTranslation('order');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const deleteMutation = useMutation<void, ProblemDetailError, number>({
    mutationFn: (id) => orderApi.delete({ id }),
    onSuccess: () => {
      toast.success(t('actions.deleteSucceeded', { orderNo }));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => {
      // 401/403/5xx 已由拦截器兜底；这里只处理业务 4xx
      if (err.status === 404) {
        toast.error(t('errors.notFound'));
      } else if (err.code === 'order.alreadyPaid') {
        toast.error(t('errors.cannotDeletePaid'));
      }
    }
  });

  return (
    <>
      <NxButton variant="destructive" onClick={() => setConfirmOpen(true)}>
        {t('actions.delete')}
      </NxButton>
      <NxConfirmDialog
        open={confirmOpen}
        title={t('confirmDelete.title')}
        message={t('confirmDelete.message', { orderNo })}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteMutation.mutate(orderId);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};
```

### 7.5 请求的完整 HTTP 报文

点击"删除" → 拦截器注入 header → 最终发出：

```
DELETE /api/v1/orders/12345 HTTP/1.1
Host: meta-build.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept-Language: zh-CN
X-Request-ID: 018f9b2a-73ef-7d2c-bf9f-d4c8a1e7f2c9
Accept: application/json, application/problem+json
Content-Type: application/json
```

后端路径：

1. `TraceIdFilter` 读 `X-Request-ID` → `MDC.put("traceId", ...)`
2. `LocaleResolver` 读 `Accept-Language` → `LocaleContextHolder.setLocale(Locale.SIMPLIFIED_CHINESE)`
3. Sa-Token 拦截器读 `Authorization` → 解 JWT → 注入 `CurrentUser`
4. `RequirePermissionAspect` 读注解 `@RequirePermission("order.delete")` → 校验 → 通过
5. Controller.delete() → Service 层 → 删除成功 → 返回 204

如果校验失败（比如 token 过期），后端返回：

```
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json

{
  "type": "https://meta-build.dev/errors/iam.auth.tokenExpired",
  "title": "令牌已过期",
  "status": 401,
  "detail": "当前登录凭证已过期，请重新登录",
  "instance": "/api/v1/orders/12345",
  "code": "iam.auth.tokenExpired",
  "traceId": "018f9b2a-73ef-7d2c-bf9f-d4c8a1e7f2c9"
}
```

前端拦截器：

1. `createErrorMiddleware.post` 发现 `!response.ok`
2. 解析 ProblemDetail → 构造 `ProblemDetailError`
3. `dispatch(err)` 看到 `status === 401` → 调 `onUnauthenticated()`
4. `@mb/app-shell` 的 `onUnauthenticated` 实现：清 `localStorage.removeItem('mb_token')` + `router.navigate({ to: '/auth/login' })`
5. `throw err`，上层 `useMutation` 进入 error 状态（但不触发 `onError`，因为已经在跳转）

<!-- verify: cd client && pnpm generate:api-sdk && pnpm -F web-admin tsc --noEmit && pnpm dlx dependency-cruiser --config .dependency-cruiser.cjs packages apps -->

---

[← 返回 README](./README.md)
