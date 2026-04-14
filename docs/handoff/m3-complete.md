# M3 完成交接文档

> 新 session 开始前读这份文档，5 分钟内获得 M3 完整上下文。

---

## 当前状态

- **M3 已完成 + 契约对齐补丁已合入**，在 main 上（commit `701d85a`，含 M4 合流后的契约对齐修复）
- L3 业务组件 + L4 应用壳层 + L5 文件路由 + api-sdk 全部就绪
- 质量门禁 12 项全绿：build / check:types / test（271 = L2:197 + L3:55 + api-sdk:19）/ check:theme（3×54）/ check:i18n / check:business-words / lint / lint:css / check:deps / check:env / storybook:build（L2+L3）/ vite build
- M4 后端已完成，代码已合入 main

---

## M3 新增的代码结构

### `@mb/api-sdk`（HTTP 客户端 + 类型）

```
packages/api-sdk/src/
├── index.ts                    → barrel export（类型 + 错误 + 配置 + API 门面）
├── config.ts                   → configureApiSdk() + getClient()（单例模式，含 tryRefreshToken）
├── http-client.ts              → 基于原生 fetch 的 HttpClient + 拦截器链 + 401 自动 refresh retry
├── errors.ts                   → ProblemDetailError（RFC 9457）+ isProblemDetail 类型守卫
├── interceptors/
│   ├── index.ts                → barrel export
│   ├── auth.ts                 → Authorization: Bearer token
│   ├── language.ts             → Accept-Language header
│   ├── request-id.ts           → X-Request-ID (crypto.randomUUID)
│   └── error.ts                → 401 throw（不直接跳登录）/ 403 / 5xx 错误分发
├── types/
│   ├── index.ts                → barrel export
│   ├── common.ts               → PageResult<T>, ProblemDetail
│   ├── auth.ts                 → LoginCommand, RefreshCommand, LoginView, UserSummary, CurrentUserView
│   ├── menu.ts                 → MenuNodeDto, CurrentUserMenuView
│   └── permission.ts           → AppPermission 联合类型（42 个）+ ALL_APP_PERMISSIONS
├── apis/
│   ├── index.ts                → barrel export
│   ├── auth-api.ts             → authApi（login / logout / refresh / getCurrentUser）
│   └── menu-api.ts             → menuApi（queryCurrentUserMenu / tree / getById）
└── __tests__/
    └── interceptors.test.ts    → 19 tests（含 401 refresh retry 4 个新增）
```

**关键设计**：零运行时依赖，手写类型已对齐后端（M4 契约对齐后），M5 切换 OpenAPI 生成时拦截器代码复用。

### L3 `@mb/ui-patterns`（8 个业务组件）

```
packages/ui-patterns/src/
├── index.ts                    → barrel export 8 个组件 + 全部类型
├── nx-loading.tsx              → 三态容器（loading/error/empty）4 种 variant
├── nx-bar.tsx                  → 批量操作栏（选中计数 + actions slot）
├── nx-table.tsx                → 数据表格（TanStack Table v8 封装，手动分页/排序/多选）
├── nx-form.tsx                 → 表单（React Hook Form + Zod，NxForm + NxFormField）
├── nx-filter.tsx               → 筛选栏（draft 机制，apply/reset，NxFilter + NxFilterField）
├── nx-drawer.tsx               → 抽屉表单（展示/表单双模式 + 脏检查确认）
├── api-select.tsx              → 异步下拉（fetcher 注入，内部 debounce，不用 useQuery）
├── nx-tree.tsx                 → 树组件（递归渲染 + 展开收起 + renderNode slot）
├── *.test.tsx                  → 55 tests（8 个测试文件）
├── *.stories.tsx               → 34 stories（8 个 story 文件）
├── .storybook/                 → Storybook 8 配置（端口 6007，viteFinal 注入 @tailwindcss/vite）
└── vitest.config.ts            → jsdom + v8 coverage（70/70/65/70 阈值）
```

**L3 隔离哲学**：零业务词汇 / 零内部 i18n / 零 API 调用 / 仅从 `@mb/ui-primitives` 导入视觉组件。所有文案通过 props 注入（TypeScript strict 强制 REQUIRED）。

### L4 `@mb/app-shell`（应用壳层）

```
packages/app-shell/src/
├── index.ts                    → barrel export（全子模块聚合）
├── i18n/
│   ├── i18n-instance.ts        → i18next 实例（zh-CN 默认 + en-US，全量加载）
│   ├── i18n-provider.tsx       → I18nProvider wrapper
│   ├── use-language.ts         → useLanguage() hook（切换 + localStorage 持久化）
│   ├── types.ts                → SupportedLanguage, LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE
│   ├── zh-CN/shell.json        → 壳层中文字典（sidebar/header/theme/language/auth）
│   ├── zh-CN/common.json       → 通用中文字典（action/status/empty/error/pagination/table）
│   ├── en-US/shell.json        → 壳层英文字典
│   └── en-US/common.json       → 通用英文字典
├── theme/
│   ├── theme-provider.tsx      → ThemeProvider（Phase 2 运行时切换）
│   └── use-theme.ts            → useTheme() hook（React 19 use()）
├── auth/
│   ├── types.ts                → CurrentUser 接口 + ANONYMOUS 常量
│   ├── use-current-user.ts     → useCurrentUser()（TanStack Query + 5min stale）
│   ├── use-auth.ts             → useAuth()（login/logout + token 管理 + redirect）
│   └── require-auth.ts         → requireAuth() 工厂 + ForbiddenError
├── data/
│   └── query-client.ts         → createQueryClient()（4xx 不重试 + 5min stale）
├── menu/
│   ├── types.ts                → MenuNode + UserMenuPayload
│   └── use-menu.ts             → useMenu()（1h stale）
├── layouts/
│   ├── sidebar-layout.tsx      → 侧边栏布局（Sidebar + Header + main）
│   ├── top-layout.tsx          → 顶部导航布局（TopNav + main）
│   └── basic-layout.tsx        → 最小布局（login/error/全屏页面）
├── components/
│   ├── header.tsx              → 顶栏（LanguageSwitcher + ThemeSwitcher + 用户 + 退出）
│   ├── sidebar.tsx             → 侧边栏（useMenu 菜单树 + useNavigate 导航）
│   ├── top-nav.tsx             → 水平导航（一级菜单）
│   ├── breadcrumb-nav.tsx      → 面包屑导航
│   ├── language-switcher.tsx   → 语言切换下拉
│   └── theme-switcher.tsx      → 主题切换下拉
├── error/
│   ├── global-error-boundary.tsx → React ErrorBoundary（内联样式，不依赖 CSS 变量）
│   ├── global-error-page.tsx   → 通用错误页（内联样式）
│   └── global-not-found-page.tsx → 404 页面（内联样式）
└── feedback/
    ├── toast-container.tsx     → Sonner <Toaster /> 封装
    └── dialog-container.tsx    → M3 占位（M5 实现命令式 confirm）
```

### L5 `web-admin`（路由 + 集成）

```
apps/web-admin/src/
├── main.tsx                    → 入口（6 层 Provider 树 + configureApiSdk + MSW）
├── router.ts                   → createAppRouter + Register 类型注册
├── routeTree.gen.ts            → TanStack Router 自动生成（提交到 git）
├── routes/
│   ├── __root.tsx              → Root route（errorComponent + notFoundComponent）
│   ├── index.tsx               → / → redirect to /dashboard
│   ├── _authed.tsx             → 认证 layout（ensureQueryData + SidebarLayout）
│   ├── _authed/dashboard.tsx   → 仪表盘占位
│   ├── auth/login.tsx          → 登录页（i18n + useAuth + BasicLayout）
│   └── auth/forgot-password.tsx → 忘记密码占位
├── i18n/
│   ├── register.ts             → registerBusinessResources()（import.meta.glob）
│   └── i18next.d.ts            → TypeScript module augmentation（shell + common）
├── mock/
│   ├── browser.ts              → MSW setupWorker（dev only）
│   └── handlers.ts             → 6 个 mock handler（login/logout/refresh/me/menus·current-user/menus）
└── styles.css                  → Tailwind + tokens + themes（M2 不变）
```

### L1 补丁

- 8 个 sidebar color token 追加到 3 套主题 + tailwind-theme.css
- TOTAL_TOKENS: 46 → 54
- `components.json` 创建在 `ui-primitives/`（shadcn CLI 生态配置）

### 质量脚本

```
scripts/
├── check-i18n.ts               → zh-CN / en-US key 完整性对比
└── check-business-words.ts     → L3 层禁止业务词汇扫描
```

---

## M3 交付物清单

### api-sdk

| 交付物 | 说明 |
|--------|------|
| HTTP 客户端 | 基于原生 fetch + 拦截器链 + 401 自动 refresh retry（零运行时依赖） |
| 4 个拦截器 | auth / language / request-id / error |
| ProblemDetailError | RFC 9457 + isProblemDetail 类型守卫 |
| 类型定义 | PageResult / ProblemDetail / LoginCommand / RefreshCommand / LoginView / UserSummary / CurrentUserView / MenuNodeDto / CurrentUserMenuView / AppPermission（42 个权限码） |
| API 门面 | authApi（4 方法：login / logout / refresh / getCurrentUser）+ menuApi（3 方法：queryCurrentUserMenu / tree / getById） |
| 单元测试 | 19 tests（含 refresh retry / refresh failure / concurrent refresh / no-refresh-configured） |

### L3：8 个业务组件

| 组件 | 底层封装 | 核心 Props |
|------|---------|-----------|
| NxLoading | 纯 React + L2 Skeleton | variant / loadingText / errorText / emptyText |
| NxBar | 纯 React + L2 Button | selectedCount / selectedTemplate / actions |
| NxTable | TanStack Table v8 | data / columns / pagination / sorting / rowSelection |
| NxForm | React Hook Form + Zod | schema / onSubmit / submitLabel |
| NxFilter | 纯 React（draft 机制） | value / onChange / resetLabel / applyLabel |
| NxDrawer | L2 Drawer + RHF + Zod | schema / onSubmit / dirtyConfirmText |
| ApiSelect | 纯 React（useState + debounce） | fetcher / loadingText / emptyText |
| NxTree | 纯 React（递归渲染） | data / renderNode / expandedIds |

**基础设施**：55 tests / 34 Storybook stories / Vitest coverage 70% 门槛

### L4：应用壳层

| 子模块 | 交付物 |
|--------|--------|
| i18n | i18next 实例 + 双语字典（shell+common）+ useLanguage + I18nProvider + registerResource |
| theme | ThemeProvider + useTheme |
| auth | useCurrentUser + useAuth + requireAuth 工厂 + ForbiddenError + getAccessToken |
| data | createQueryClient（4xx 不重试）|
| menu | useMenu + MenuNode 类型 |
| layouts | SidebarLayout + TopLayout + BasicLayout |
| components | Header + Sidebar + TopNav + BreadcrumbNav + LanguageSwitcher + ThemeSwitcher |
| error | GlobalErrorBoundary + GlobalErrorPage + GlobalNotFoundPage（内联样式） |
| feedback | ToastContainer（Sonner）+ DialogContainer（M3 占位）|

### L5：路由

| 交付物 | 说明 |
|--------|------|
| TanStack Router | 文件路由 + routeTree.gen.ts + Register 类型 |
| Provider 树 | 6 层严格顺序（ErrorBoundary → QueryClient → I18n → Theme → Router → Toast） |
| 认证守卫 | _authed layout route + ensureQueryData |
| 页面 | login + forgot-password + dashboard（占位） |
| MSW mock | 6 handler（login / logout / refresh / me / menus/current-user / menus，含错误场景 mock） |
| i18n 注册 | registerBusinessResources + i18next.d.ts 类型增强 |

### 质量门禁

| 检查 | 命令 | 状态 |
|------|------|------|
| 生产构建 | `pnpm build` | ✅（545KB JS + 16KB CSS） |
| 类型检查 | `pnpm check:types` | ✅ 零错误 |
| 单元测试 | `pnpm test` | ✅ 271 tests（L2=197, L3=55, api-sdk=19） |
| 主题完整性 | `pnpm check:theme` | ✅ 3×54 |
| i18n 完整性 | `pnpm check:i18n` | ✅ |
| 业务词汇 | `pnpm check:business-words` | ✅ |
| Biome lint | `pnpm lint` | ✅ 227 files |
| CSS lint | `pnpm lint:css` | ✅ |
| 依赖方向 | `pnpm check:deps` | ✅ 248 modules, 661 deps, 0 violations |
| 环境变量 | `pnpm check:env` | ✅ |

---

## 下一阶段：M5（前后端汇合）

### 前置条件

M5 需要 M3（前端）+ M4（后端）都完成：
- M3 ✅ 已完成
- M4 ✅ 已完成（已合入 main，含契约对齐修复）

### M5 核心任务

1. **api-sdk 切换 OpenAPI 生成**
   - 后端 `springdoc:generate` → `server/api-contract/openapi-v1.json`
   - 前端 `pnpm generate:api-sdk` 从 JSON 生成 TypeScript
   - M3 手写类型 → `generated/` 自动生成
   - 拦截器代码复用（不在 generated/ 中）

2. **3 个 canonical reference 业务模块**
   - business-notice / business-order / business-approval
   - 前后端贯通（L5 页面 + L4 hooks + api-sdk + 后端 Controller/Service/Repository）
   - 每个模块遵循 12 步清单

3. **MSW mock → 真实 API**
   - 移除 `src/mock/` 或保留为测试专用
   - configureApiSdk 的 basePath 指向真实后端

4. **E2E 测试**
   - Playwright 配置已就绪（M3 未写用例）
   - M5 补齐 login → dashboard → CRUD → logout 流程

5. **权限验证**
   - route-tree.json 生成（Vite 扫描插件）
   - check:permissions 脚本
   - 后端 RouteTreeSyncRunner 启动同步

### M5 对 M3 的依赖

- L3 组件（NxTable/NxForm/NxDrawer 等）构建 CRUD 页面
- L4 hooks（useCurrentUser/useMenu/useAuth）消费后端 API
- api-sdk 拦截器链（auth token / Accept-Language / error 分发）
- Provider 树 + 路由守卫已就绪
- i18n 框架已就绪，M5 添加业务 namespace（order.json 等）

---

## 关键技术决策备忘

| 决策 | 结论 | 备注 |
|------|------|------|
| api-sdk HTTP 客户端 | 原生 fetch（零依赖）+ 401 自动 refresh retry | M5 切换 OpenAPI 生成后用 typescript-fetch，拦截器+refresh 逻辑复用 |
| L3 隔离 | 零业务/零 i18n/零 API | check:business-words + dep-cruiser 双重守护 |
| Toast 方案 | Sonner（命令式 `toast()`） | L2 导出 `<Toaster />`，L5 `import { toast } from 'sonner'` |
| Dialog 命令式 | M3 占位（DialogContainer = null） | M5 按需实现 ConfirmDialogHost |
| 路由 | TanStack Router 文件路由 | routeTree.gen.ts 提交到 git |
| 认证守卫 | _authed layout + ensureQueryData | requireAuth 工厂用于子路由权限检查 |
| ErrorBoundary | 内联样式 | CSS 变量在其渲染时可能不可用 |
| Provider 树 | 6 层严格顺序 | ErrorBoundary → QueryClient → I18n → Theme → Router → Toast |
| i18n 默认语言 | zh-CN（无浏览器检测） | YAGNI — 用户手动切换 |
| i18n 加载策略 | 全量加载（~10KB gzip） | 无懒加载，无 route 切换延迟 |
| sidebar tokens | 8 个 color token（54 总量） | shadcn Sidebar 组件依赖 |
| validateSearch | 手动函数（非 Zod） | M5 标准化为 Zod（当前功能等价） |

### M3 踩坑记录

- **pnpm strict 不提升 @types/react**：L3 和 L4 的 `devDependencies` 必须显式声明 `@types/react` + `@types/react-dom`
- **tsconfig rootDir 阻止跨包 .ts 解析**：移除 `rootDir: "./src"`（M2 已踩过，M3 又踩了一次）
- **Storybook stories 中 required props 的 StoryObj 类型**：`meta` 必须提供 default `args` 覆盖所有 required props，否则 tsc 报错
- **React 19 override 关键字**：ErrorBoundary class 组件的 `render`/`componentDidCatch`/`state` 需要 `override` 修饰符
- **TanStack Router pathless layout 与 index route 冲突**：`_authed/index.tsx` 和 `routes/index.tsx` 都解析到 `/`，改为 `_authed/dashboard.tsx` + root redirect

---

## 契约对齐补丁（M4 合流后）

> M3 完成后与 M4 后端做了一轮 4 角色联合审查（API 契约官 / 安全架构师 / 全栈集成者 / DBA），发现并修复了 4 Critical + 5 Important 问题。以下是对 M3 交付物的增量变更。

### api-sdk 类型变更

| 变更 | 旧 | 新 |
|------|----|-----|
| 权限码分隔符 | 点号 `iam.user.list` | **冒号** `iam:user:list` |
| 权限码数量 | 8 个（仅 IAM） | **42 个**（覆盖全部后端模块） |
| LoginResult | `{ accessToken, refreshToken }` | **LoginView** `{ accessToken, refreshToken, expiresInSeconds, user: UserSummary }` |
| CurrentUserDto | 手写估计 | **CurrentUserView**（对齐后端 `GET /auth/me` 响应） |
| MenuNodeDto.kind | `'directory' \| 'menu' \| 'button'` | **menuType** `'DIRECTORY' \| 'MENU' \| 'BUTTON'` |
| MenuNodeDto.path / isOrphan | 存在 | **移除**（后端无此字段） |
| MenuNodeDto 新增 | — | **sortOrder** + **visible** |
| UserMenuPayload | `{ tree, permissions }` 在 api-sdk | **CurrentUserMenuView** `{ tree, permissions }` 在 api-sdk |

### 新增 API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/v1/auth/me` | 获取当前用户信息（后端 M4 后补） |
| `GET /api/v1/menus/current-user` | 获取当前用户菜单树 + 权限列表（后端 M4 后补） |
| `POST /api/v1/auth/refresh` | Token 刷新（前端 api-sdk 新增调用） |

### 401 自动 refresh 机制

- http-client 层捕获 401 → 调 `tryRefreshToken()` → 成功用新 token 重试原请求 → 失败才跳登录
- `tryRefreshToken` 用原生 fetch 直接调 `/auth/refresh`，绕过 http-client 避免死锁
- 并发 401 共享同一个 refresh Promise 防止重复刷新
- 配置在 `main.tsx` 的 `configureApiSdk({ tryRefreshToken: ... })`

### useCurrentUser 恢复为 API 调用模式

- 不再依赖登录时的缓存注入
- 直接调 `GET /auth/me`，5 分钟 staleTime
- `_authed.tsx` 的 `ensureQueryData` 使用同一 queryKey `['auth', 'me']`

### MSW mock 增强

- 登录失败（username='error' → 401）、账户锁定（'locked' → 423）
- Refresh token 过期（'expired-refresh-token' → 401）
- 403 权限不足（`X-Mock-Forbidden` header）
- 菜单数据：三层嵌套 + BUTTON 类型 + visible:false 节点

### 测试变更

- api-sdk tests: 15 → **19**（新增 refresh retry / refresh failure / concurrent refresh / no-refresh-configured 4 个测试）

---

## 常用命令

```bash
# 前端开发
cd client && pnpm install                                 # 安装依赖
cd client && pnpm dev                                     # dev server（localhost:5173 + MSW mock）
cd client && pnpm build                                   # 生产构建

# 测试
cd client && pnpm test                                    # 全量测试（271 tests）
cd client && pnpm -F @mb/ui-primitives test               # L2 单元测试（197 tests）
cd client && pnpm -F @mb/ui-patterns test                 # L3 单元测试（55 tests）
cd client && pnpm -F @mb/api-sdk test                     # api-sdk 测试（19 tests）

# Storybook
cd client && pnpm storybook                               # L2 Storybook（localhost:6006）
cd client && pnpm -F @mb/ui-patterns storybook            # L3 Storybook（localhost:6007）

# 质量检查（12 项）
cd client && pnpm build                                   # 生产构建
cd client && pnpm check:types                             # TypeScript 类型检查
cd client && pnpm test                                    # 单元测试
cd client && pnpm check:theme                             # 主题完整性（3×54）
cd client && pnpm check:i18n                              # i18n 完整性
cd client && pnpm check:business-words                    # L3 业务词汇扫描
cd client && pnpm lint                                    # Biome 代码检查
cd client && pnpm lint:css                                # Stylelint CSS 检查
cd client && pnpm check:deps                              # 依赖方向检查
cd client && pnpm check:env                               # 环境变量一致性

# 后端（不变）
cd server && mvn verify                                   # 全量验证
cd server && mvn spring-boot:run -pl mb-admin             # 启动

# Docker
docker compose up -d                                      # PG(15432) + Redis(16379)
```
