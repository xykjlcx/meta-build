# Meta-Build 前端缺口分析与交接文档

> **文档目的**：完整记录 meta-build 前端的当前状态、已有资产、缺失部分，供后续 AI 或开发者接手开发。
>
> **写作时间**：2026-04-15
> **状态**：M5 分支（原 `feat/m5-openapi-notice-backend`）已合并到 main（2026-04-15）；本文档列出的 P0-P4 前端缺口仍然有效。
> **上下文**：M1-M5 执行过程中，后端完成度 ~85%，前端已补上 notice / settings 等业务页面，但平台模块页面仍大面积缺失。本文档聚焦这些剩余缺口。

---

## 一、问题总结

按规划文档（`docs/meta-build规划_v1_最终对齐.md`），每个 milestone 都有前端交付件，但从 M3 开始前端部分被跳过：

| Milestone | 规划的前端交付 | 实际交付 | 缺口 |
|-----------|-------------|---------|------|
| M1 | 登录页（mock 接口） | ✅ 登录页 + MSW mock | 无 |
| M2 | L2 原子组件 + Theme | ✅ 42 个 shadcn/ui v4 组件 + 3 主题 | 无 |
| M3 | L3 业务组件 + L4 壳层 + **user 模块前端骨架** | ✅ L3 八组件 + L4 壳 ❌ **user 骨架未做** | user 前端 |
| M4 | **前后端联调 8 个平台模块** | ✅ 后端 8 模块 ❌ **前端 0 页面** | 全部 platform 前端 |
| M5 | **notice/order/approval 完整前后端** | ✅ notice 后端 31 测试 + 前端已合并 ❌ order/approval 未开始 | order + approval |

**下班信号达成情况**：
- M3 下班信号："user 模块完全用 @mb/ui-patterns 拼出" → **未达成**
- M4 下班信号："前后端联调 8 个平台模块的管理操作" → **未达成**
- M5 下班信号："3 个模块全部通过集成测试" → **未达成**

---

## 二、前端架构概览（已就位）

### 2.1 五层 pnpm monorepo

```
client/
├── packages/
│   ├── ui-tokens/        # L1 - 54 个设计 token + 3 主题（default/dark/compact）
│   ├── ui-primitives/    # L2 - 42 个 shadcn/ui v4 原版组件
│   ├── ui-patterns/      # L3 - 8 个业务组件（NxTable/NxForm/NxFilter 等）
│   ├── app-shell/        # L4 - 3 布局 + 认证 + 主题 + i18n + SSE
│   └── api-sdk/          # API 客户端 + OpenAPI 生成代码（orval）
├── apps/
│   └── web-admin/        # L5 - 业务页面（路由 + features）
└── scripts/              # 质量脚本（12 项检查）
```

### 2.2 技术栈

| 维度 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript strict + Vite |
| 路由 | TanStack Router v1（文件路由，`routeTree.gen.ts` 自动生成） |
| 数据 | TanStack Query v5 |
| UI | shadcn/ui v4 原版 + radix-ui 统一包 + Tailwind CSS v4 + CVA |
| 表格/表单 | TanStack Table v8 + React Hook Form + Zod |
| i18n | react-i18next（zh-CN 默认 + en-US） |
| HTTP | @mb/api-sdk（原生 fetch + 4 拦截器，已切 OpenAPI 生成） |
| Toast | Sonner（命令式 `toast()`） |
| Mock | MSW（开发时自动启用） |
| 测试 | Vitest 274 tests + Storybook 8 |
| 代码质量 | Biome + Stylelint + dependency-cruiser（7 条规则） |

### 2.3 依赖方向（严格单向，dependency-cruiser 守护）

```
@mb/ui-tokens → @mb/ui-primitives → @mb/ui-patterns → @mb/app-shell → web-admin
```

---

## 三、已有前端资产详情

### 3.1 L2 原子组件（`@mb/ui-primitives`，42 个）

全部是 shadcn/ui v4 原版源码复制到项目中，通过 `import { Button } from '@mb/ui-primitives'` 使用。

**输入类**：Button, Input, Textarea, Label, Checkbox, RadioGroup, Switch, Slider, Select, Combobox, DatePicker, Calendar

**反馈类**：Dialog, AlertDialog, Drawer, Tooltip, Popover, Sonner (Toast), HoverCard

**导航类**：Tabs, Breadcrumb, DropdownMenu, NavigationMenu, Command

**展示类**：Card, Badge, Avatar, Separator, Skeleton, Accordion, Table

**缺失**：**Sidebar 组件**（shadcn/ui v4 有完整的 Sidebar 组件系统，但未添加。当前侧边栏是 L4 手写的 `<aside>`）

### 3.2 L3 业务组件（`@mb/ui-patterns`，8 个）

| 组件 | 用途 | 核心 Props |
|------|------|-----------|
| **NxTable** | 数据表格 | `data`, `columns`, `pagination`, `onPaginationChange`, `sorting`, `rowSelection`, `batchActions` |
| **NxForm** | 表单 | `schema`(Zod), `defaultValues`, `onSubmit`, `submitLabel`, `loading` |
| **NxFilter** | 筛选栏 | `value`, `defaultValue`, `onChange`, `resetLabel`, `applyLabel` |
| **NxDrawer** | 抽屉表单 | 编辑抽屉容器 |
| **NxBar** | 批量操作栏 | 选中行时的底部操作栏 |
| **NxLoading** | 三态容器 | loading / error / empty 三种状态 |
| **ApiSelect** | 异步下拉 | fetcher 注入模式 |
| **NxTree** | 树形组件 | 递归渲染 |

**重要约束**：L3 组件**零业务词汇**——所有文案、权限、API 调用在 L5 注入。

**当前使用情况**：55 个单元测试 + 34 个 Storybook stories 验证通过，但**只有 notice 前端（未合并分支）真正使用了 NxTable**。其余页面均未使用。

### 3.3 L4 应用壳层（`@mb/app-shell`）

**导出项**：

```typescript
// 布局
export { BasicLayout, SidebarLayout, TopLayout } from './layouts';

// 认证
export { useCurrentUser, useAuth, getAccessToken, requireAuth, toCurrentUser } from './auth';
export { ANONYMOUS, ForbiddenError } from './auth';
export type { CurrentUser, RequireAuthOptions } from './auth';

// 主题
export { ThemeProvider, useTheme } from './theme';

// i18n
export { i18n, I18nProvider, registerResource, useLanguage } from './i18n';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './i18n';

// 菜单
export { useMenu } from './menu';
export type { MenuNode, UserMenuPayload } from './menu';

// 数据
export { createQueryClient } from './data';

// SSE
export { useSseConnection, useSseSubscription, sseEventBus } from './sse';

// 错误处理
export { GlobalErrorBoundary, GlobalErrorPage, GlobalNotFoundPage } from './error';

// 反馈
export { ToastContainer, DialogContainer } from './feedback';

// 组件
export { BreadcrumbNav, NotificationBadge } from './components';
```

**侧边栏现状**：手写的 `<aside>` + 基础 Tailwind，**没有**使用 shadcn/ui 的 Sidebar 组件。视觉效果比较简陋。

### 3.4 API SDK（`@mb/api-sdk`）

**当前主干已切换到 OpenAPI 生成**（orval），生成了所有后端 Controller 对应的：
- TanStack Query hooks（`useQuery` / `useMutation`）
- TypeScript 类型定义
- MSW mock handlers

**生成的端点模块**（`api-sdk/src/generated/endpoints/`）：

| 目录名 | 对应后端 Controller |
|--------|-------------------|
| auth-controller | 认证（登录/登出/刷新/当前用户） |
| user-controller | 用户 CRUD + 密码重置 + 角色分配 |
| role-controller | 角色 CRUD + 菜单分配 |
| dept-controller | 部门树 + CRUD |
| menu-controller | 菜单树 + CRUD |
| config-controller | 系统配置 CRUD |
| dict-controller | 字典类型 + 字典数据 CRUD |
| file-controller | 文件上传/下载/删除 |
| job-controller | 定时任务日志查询 |
| monitor-controller | 服务器监控信息 |
| notification-controller | 通知公告 |
| operation-log-controller | 操作日志查询 |
| sse | SSE 连接端点 |
| 公告管理 | Notice CRUD + 状态机 + 导出 |
| 微信绑定 | 微信 MP/Mini 绑定 |
| 通知发送记录 | 通知分发日志 |

**手写的 API 门面**（兼容旧代码 + 补充逻辑）：
- `authApi.login/logout/refresh/getCurrentUser`
- `menuApi.queryCurrentUserMenu/tree/getById`

### 3.5 已有页面（web-admin/src/routes/）

**main 分支上的页面**：

| 路由 | 文件 | 行数 | 内容 |
|------|------|------|------|
| `/` | `index.tsx` | 8 | 重定向到 /dashboard |
| `/auth/login` | `auth/login.tsx` | 64 | 登录表单（Input + Button） |
| `/auth/forgot-password` | `auth/forgot-password.tsx` | 26 | 占位 |
| `/_authed/dashboard` | `_authed/dashboard.tsx` | 27 | **3 个占位 Card，无实际内容** |

**M5 新增的页面**（+2900 行，已合并到 main）：

| 路由 | 文件 | 行数 | 内容 |
|------|------|------|------|
| `/_authed/notices/` | `notices/index.tsx` | 8 | 路由定义 → NoticeListPage |
| `/_authed/notices/$id` | `notices/$id.tsx` | 8 | 路由定义 → NoticeDetailPage |
| `/_authed/settings/` | `settings/index.tsx` | 36 | 设置入口（微信绑定卡片） |
| `/_authed/settings/wechat-bind` | `settings/wechat-bind.tsx` | 156 | 微信绑定管理 |

**Notice 前端组件**（`features/notice/`，共 2105 行）：

| 文件 | 行数 | 功能 |
|------|------|------|
| `pages/notice-list-page.tsx` | 667 | 公告列表（NxTable + 筛选 + 批量操作 + 状态机） |
| `pages/notice-detail-page.tsx` | 349 | 公告详情（Tabs: 基本信息 + 接收人 + 发送记录） |
| `components/notice-dialog.tsx` | 354 | 新建/编辑对话框（NxForm + 富文本 + 附件） |
| `components/file-upload-field.tsx` | 160 | 文件上传字段 |
| `components/notification-log-tab.tsx` | 90 | 发送记录标签页 |
| `components/target-selector.tsx` | 83 | 通知范围选择器（全部/部门/角色/指定用户） |
| `components/recipients-tab.tsx` | 81 | 接收人标签页（已读/未读状态） |
| `components/sse-handlers.tsx` | 77 | SSE 实时推送处理 |
| `components/batch-confirm-dialog.tsx` | 59 | 批量操作确认对话框 |
| `components/tiptap-field.tsx` | 44 | 富文本编辑器字段 |
| `components/notice-status-badge.tsx` | 29 | 状态徽章（草稿/已发布/已撤回） |
| `constants.ts` | 37 | 常量定义 |
| `schemas.ts` | 12 | Zod 验证 schema |
| `utils/sanitize.ts` | 63 | HTML 清理工具 |

### 3.6 MSW Mock 数据

**main 分支已 mock 的端点**：
- `POST /api/v1/auth/login` — 登录（支持 error/locked 用户名触发错误）
- `POST /api/v1/auth/logout` — 登出
- `POST /api/v1/auth/refresh` — 刷新 token
- `GET /api/v1/auth/me` — 当前用户信息
- `GET /api/v1/menus/current-user` — 当前用户菜单 + 权限
- `GET /api/v1/menus` — 菜单树

**M5 新增**：
- `GET /api/v1/notices/unread-count` — 未读数
- `GET /api/v1/notices` — 公告列表（含分页 mock）
- `GET /api/v1/notices/:id` — 公告详情

**Mock 菜单树结构**：
```
系统管理 (DIRECTORY, id=1)
├── 用户管理 (MENU, id=2, permission=iam:user:list)
│   ├── 新增用户 (BUTTON, id=20, permission=iam:user:create)
│   ├── 编辑用户 (BUTTON, id=21, permission=iam:user:update)
│   └── 删除用户 (BUTTON, id=22, permission=iam:user:delete)
├── 角色管理 (MENU, id=3, permission=iam:role:list)
├── 菜单管理 (MENU, id=4, permission=iam:menu:list)
└── 用户详情 (MENU, id=5, permission=iam:user:detail, visible=false)
```

### 3.7 权限码（47 个）

完整定义在 `api-sdk/src/types/permission.ts`：

| 模块 | 权限码 |
|------|--------|
| iam:user | list, detail, create, update, delete, resetPassword, assignRole |
| iam:role | list, detail, create, update, delete, assignMenu |
| iam:dept | list, detail, create, delete |
| iam:menu | list, detail, create, delete |
| config:config | list, detail, set, delete |
| dict:type | list, detail, create, delete |
| dict:data | list, create, delete |
| notification:notification | list, create, read, delete |
| job:log | list |
| monitor:server | list |
| oplog:log | list |
| file:file | upload, download, delete |
| notice:notice | list, detail, create, update, delete, publish, export |

### 3.8 i18n 资源

**L4 层**（`app-shell/src/i18n/`）：
- `shell.json` — Header/Sidebar/Lang/Theme 文案
- `common.json` — 通用动作（确认/取消/保存）+ 通用错误

**L5 层**（`web-admin/src/i18n/`）：
- `notice.json` — 公告模块完整文案（已合并）
- **缺失**：user / role / menu / dept / dict / config / log / monitor / file 的 i18n 资源

### 3.9 已修复的 CSS 问题

2026-04-15 发现并修复：Tailwind v4 的 `@source` 指令缺失，导致 monorepo workspace 包中的 Tailwind class 未被编译。已在 `styles.css` 中添加：

```css
@source "../../../packages/ui-primitives/src";
@source "../../../packages/ui-patterns/src";
@source "../../../packages/app-shell/src";
@source "../../../packages/api-sdk/src";
```

修复后 CSS 从 16.59 KB → 80.98 KB。**该修改已在 main。**

---

## 四、后端 API 完整清单（前端需要对接的）

### 4.1 IAM — 认证（已有前端对接）

| HTTP | 路径 | 功能 | 前端状态 |
|------|------|------|---------|
| POST | `/api/v1/auth/login` | 登录 | ✅ 已实现 |
| POST | `/api/v1/auth/logout` | 登出 | ✅ 已实现 |
| POST | `/api/v1/auth/refresh` | 刷新 token | ✅ 已实现（拦截器自动） |
| GET | `/api/v1/auth/me` | 当前用户 | ✅ 已实现 |

### 4.2 IAM — 用户管理（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/users` | 分页列表 | `iam:user:list` |
| GET | `/api/v1/users/{id}` | 用户详情 | `iam:user:detail` |
| POST | `/api/v1/users` | 创建 | `iam:user:create` |
| PUT | `/api/v1/users/{id}` | 更新 | `iam:user:update` |
| DELETE | `/api/v1/users/{id}` | 删除 | `iam:user:delete` |
| PUT | `/api/v1/users/me/password` | 改密码 | 登录即可 |
| POST | `/api/v1/users/{id}/reset-password` | 重置密码 | `iam:user:resetPassword` |
| PUT | `/api/v1/users/{id}/roles` | 分配角色 | `iam:user:assignRole` |

### 4.3 IAM — 角色管理（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/roles` | 分页列表 | `iam:role:list` |
| GET | `/api/v1/roles/{id}` | 角色详情 | `iam:role:detail` |
| POST | `/api/v1/roles` | 创建 | `iam:role:create` |
| PUT | `/api/v1/roles/{id}` | 更新 | `iam:role:update` |
| DELETE | `/api/v1/roles/{id}` | 删除 | `iam:role:delete` |
| PUT | `/api/v1/roles/{id}/menus` | 分配菜单 | `iam:role:assignMenu` |

### 4.4 IAM — 菜单管理（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/menus/current-user` | 当前用户菜单 | 登录即可 |
| GET | `/api/v1/menus` | 菜单树 | `iam:menu:list` |
| GET | `/api/v1/menus/{id}` | 菜单详情 | `iam:menu:detail` |
| POST | `/api/v1/menus` | 创建 | `iam:menu:create` |
| DELETE | `/api/v1/menus/{id}` | 删除 | `iam:menu:delete` |

### 4.5 IAM — 部门管理（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/depts` | 部门树 | `iam:dept:list` |
| GET | `/api/v1/depts/{id}` | 部门详情 | `iam:dept:detail` |
| POST | `/api/v1/depts` | 创建 | `iam:dept:create` |
| DELETE | `/api/v1/depts/{id}` | 删除 | `iam:dept:delete` |

### 4.6 字典管理（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/dict/types` | 字典类型列表 | `dict:type:list` |
| GET | `/api/v1/dict/types/{id}` | 类型详情 | `dict:type:detail` |
| POST | `/api/v1/dict/types` | 创建类型 | `dict:type:create` |
| DELETE | `/api/v1/dict/types/{id}` | 删除类型 | `dict:type:delete` |
| GET | `/api/v1/dict/types/{typeId}/data` | 字典数据列表 | `dict:data:list` |
| POST | `/api/v1/dict/data` | 创建数据 | `dict:data:create` |
| DELETE | `/api/v1/dict/data/{id}` | 删除数据 | `dict:data:delete` |

### 4.7 系统配置（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/configs` | 配置列表 | `config:config:list` |
| GET | `/api/v1/configs/{key}` | 按 key 获取 | `config:config:detail` |
| PUT | `/api/v1/configs` | 设置值 | `config:config:set` |
| DELETE | `/api/v1/configs/{key}` | 删除 | `config:config:delete` |

### 4.8 文件管理（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| POST | `/api/v1/files` | 上传 | `file:file:upload` |
| GET | `/api/v1/files/{id}/download` | 下载 | `file:file:download` |
| DELETE | `/api/v1/files/{id}` | 删除 | `file:file:delete` |

### 4.9 操作日志（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/oplog` | 分页查询 | `oplog:log:list` |

### 4.10 定时任务日志（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/jobs/logs` | 分页查询 | `job:log:list` |

### 4.11 服务监控（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/monitor/server-info` | 服务器信息 | `monitor:server:list` |

### 4.12 通知公告 — platform 层（❌ 缺前端页面）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/notifications` | 通知列表 | `notification:notification:list` |
| POST | `/api/v1/notifications` | 创建 | `notification:notification:create` |
| POST | `/api/v1/notifications/{id}/read` | 标记已读 | `notification:notification:read` |
| DELETE | `/api/v1/notifications/{id}` | 删除 | `notification:notification:delete` |

### 4.13 公告管理 — business 层（✅ 前端已合并）

| HTTP | 路径 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/notices` | 分页列表 | `notice:notice:list` |
| GET | `/api/v1/notices/{id}` | 详情 | `notice:notice:detail` |
| POST | `/api/v1/notices` | 创建 | `notice:notice:create` |
| PUT | `/api/v1/notices/{id}` | 更新 | `notice:notice:update` |
| DELETE | `/api/v1/notices/{id}` | 删除 | `notice:notice:delete` |
| POST | `/api/v1/notices/{id}/publish` | 发布 | `notice:notice:publish` |
| POST | `/api/v1/notices/{id}/revoke` | 撤回 | `notice:notice:publish` |
| POST | `/api/v1/notices/{id}/duplicate` | 复制 | `notice:notice:create` |
| POST | `/api/v1/notices/batch-publish` | 批量发布 | `notice:notice:publish` |
| DELETE | `/api/v1/notices/batch` | 批量删除 | `notice:notice:delete` |
| PUT | `/api/v1/notices/{id}/read` | 标记已读 | 登录即可 |
| GET | `/api/v1/notices/unread-count` | 未读数 | 登录即可 |
| GET | `/api/v1/notices/{id}/recipients` | 接收人列表 | `notice:notice:detail` |
| GET | `/api/v1/notices/export` | 导出 Excel | `notice:notice:export` |

---

## 五、待开发清单（按优先级排序）

### P0：核心 CRUD 页面（对应已完成的后端模块）

| 序号 | 页面 | 路由 | 复杂度 | 涉及组件 | 说明 |
|------|------|------|--------|---------|------|
| 1 | **用户管理** | `/_authed/system/users` | 高 | NxTable + NxForm + NxDrawer + NxFilter + NxBar + ApiSelect | 分页列表 + 新增/编辑抽屉 + 角色分配 + 重置密码 + 批量操作。最复杂的 CRUD 页面，建议第一个做（作为模板） |
| 2 | **角色管理** | `/_authed/system/roles` | 中 | NxTable + NxForm + NxDrawer + NxTree | 分页列表 + 新增/编辑 + **菜单树选择**（NxTree 勾选菜单） |
| 3 | **菜单管理** | `/_authed/system/menus` | 中 | NxTree + NxForm + NxDrawer | **树形展示**（非分页表格）+ 新增/编辑抽屉。注意菜单有 DIRECTORY/MENU/BUTTON 三种类型 |
| 4 | **部门管理** | `/_authed/system/depts` | 低 | NxTree + NxForm + NxDrawer | **树形展示** + 新增/编辑抽屉 |
| 5 | **字典管理** | `/_authed/system/dict` | 中 | NxTable + NxForm + NxDrawer | 主从结构：左侧字典类型列表，右侧字典数据列表 |

### P1：辅助管理页面

| 序号 | 页面 | 路由 | 复杂度 | 涉及组件 | 说明 |
|------|------|------|--------|---------|------|
| 6 | **操作日志** | `/_authed/system/oplog` | 低 | NxTable + NxFilter | 只读分页列表 + 筛选，无增删改 |
| 7 | **系统配置** | `/_authed/system/config` | 低 | NxTable + NxForm + NxDrawer | 简单 CRUD（key-value） |
| 8 | **定时任务日志** | `/_authed/system/job-logs` | 低 | NxTable + NxFilter | 只读分页列表 |

### P2：监控与文件

| 序号 | 页面 | 路由 | 复杂度 | 涉及组件 | 说明 |
|------|------|------|--------|---------|------|
| 9 | **服务监控** | `/_authed/system/monitor` | 中 | Card + 自定义可视化 | 展示 JVM/DB 指标，非表格页面，需要数据可视化 |
| 10 | **文件管理** | `/_authed/system/files` | 中 | NxTable + 文件上传 | 列表 + 上传 + 下载 + 删除 |
| 11 | **通知管理** | `/_authed/system/notifications` | 低 | NxTable | platform 层的通知列表（与 business 层 notice 不同） |

### P3：壳层优化

| 序号 | 任务 | 说明 |
|------|------|------|
| 12 | **Sidebar 重构** | 把手写 `<aside>` 替换为 shadcn/ui v4 的 Sidebar 组件系统。需要先在 ui-primitives 添加 Sidebar 组件 |
| 13 | **Dashboard 充实** | 用 Card 组件展示统计数据（用户数、在线数、公告数等），调用各模块的统计 API |
| 14 | **面包屑导航** | Header 左侧已预留位置，用 BreadcrumbNav 组件（app-shell 已导出）填充 |

### P4：M5 规划中的其他业务模块

| 序号 | 模块 | 复杂度 | 说明 |
|------|------|--------|------|
| 15 | **order + order-item** | 高 | 主从表 + 状态机（DRAFT→SUBMITTED→APPROVED→REJECTED→CANCELLED）。后端未开始 |
| 16 | **approval** | 高 | 审批流程，跨模块协调。后端未开始 |

---

## 六、开发一个页面的标准流程

以用户管理为例：

### 6.1 创建路由文件

```
client/apps/web-admin/src/routes/_authed/system/users/
├── index.tsx       # /system/users → UserListPage
└── $id.tsx         # /system/users/:id → UserDetailPage（如需要）
```

路由文件只负责定义路由 + 权限守卫，实际组件放在 features：

```typescript
// routes/_authed/system/users/index.tsx
import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { UserListPage } from '../../../../features/user/pages/user-list-page';

export const Route = createFileRoute('/_authed/system/users/')({
  beforeLoad: requireAuth({ permission: 'iam:user:list' }),
  component: UserListPage,
});
```

### 6.2 创建 feature 目录

```
client/apps/web-admin/src/features/user/
├── pages/
│   ├── user-list-page.tsx      # 列表页
│   └── user-detail-page.tsx    # 详情页（可选）
├── components/
│   ├── user-form-drawer.tsx    # 新增/编辑抽屉
│   ├── assign-role-dialog.tsx  # 角色分配对话框
│   └── reset-password-dialog.tsx
├── schemas.ts                  # Zod 验证 schema
└── constants.ts                # 常量
```

### 6.3 API 调用方式

**方式 A：使用 OpenAPI 生成的 hooks**（推荐，主干已生成）

```typescript
// 直接使用生成的 hooks
import { useList } from '@mb/api-sdk/generated/endpoints/user-controller/user-controller';

function UserListPage() {
  const { data, isLoading } = useList({ page: 1, size: 20 });
  // ...
}
```

**方式 B：使用 TanStack Query + 生成的 API 函数**

```typescript
import { useQuery } from '@tanstack/react-query';
import { list } from '@mb/api-sdk/generated/endpoints/user-controller/user-controller';

function UserListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'list', { page, size }],
    queryFn: () => list({ page, size }),
  });
}
```

### 6.4 i18n 资源

创建 `client/apps/web-admin/src/i18n/zh-CN/user.json` 和 `en-US/user.json`：

```json
{
  "title": { "list": "用户管理", "create": "新增用户", "edit": "编辑用户" },
  "columns": { "username": "用户名", "nickname": "昵称", "email": "邮箱", "status": "状态", "createdAt": "创建时间" },
  "action": { "create": "新增", "edit": "编辑", "delete": "删除", "resetPassword": "重置密码", "assignRole": "分配角色" },
  "confirm": { "delete": "确定删除用户 {name} 吗？", "resetPassword": "确定重置 {name} 的密码吗？" },
  "status": { "enabled": "启用", "disabled": "禁用" }
}
```

**注册方式**：i18n 资源文件放到对应目录即可，`register.ts` 使用 `import.meta.glob` 自动扫描注册。

### 6.5 MSW Mock 数据

在 `client/apps/web-admin/src/mock/handlers.ts` 中添加对应 handler。也可以使用 OpenAPI 生成的 MSW handlers（在 `api-sdk/src/generated/endpoints/*/xxx.msw.ts`）。

### 6.6 菜单配置

侧边栏菜单是**后端动态返回**的（`GET /api/v1/menus/current-user`），不是前端硬编码。开发时需要在 MSW mock 的菜单树中添加新的菜单项。

---

## 七、关键约束（必须遵守）

### 7.1 架构约束

1. **依赖方向严格单向**：ui-tokens → ui-primitives → ui-patterns → app-shell → web-admin。dependency-cruiser 守护，违反直接 CI 失败
2. **L3 零业务词汇**：NxTable/NxForm 等不允许出现任何业务词汇、i18n key、API 调用
3. **API 必须走 @mb/api-sdk**：禁止手写 fetch/axios
4. **权限三层守卫**：路由级 `requireAuth` + 菜单过滤 + 按钮级 `useCurrentUser().permissions`
5. **i18n 分层**：L4 框架级（shell/common）+ L5 业务级。数据库存储的文案不走 i18n

### 7.2 代码风格

- 代码：英文。注释：中文。文档：中文
- TypeScript strict 模式
- Biome lint + Stylelint
- 组件使用函数式声明（`function Component()` 不用 `const Component = () =>`）

### 7.3 质量门禁（12 项，必须全绿）

```bash
cd client
pnpm build                   # 生产构建
pnpm check:types             # TypeScript 类型检查
pnpm test                    # 单元测试
pnpm check:theme             # 主题完整性（3 × 54 token）
pnpm check:i18n              # i18n 双语 key 一致性
pnpm check:business-words    # L3 业务词汇扫描
pnpm lint                    # Biome 代码检查
pnpm lint:css                # Stylelint CSS 检查
pnpm check:deps              # 依赖方向检查（7 条规则）
pnpm check:env               # 环境变量一致性
```

---

## 八、参考文件索引

| 文件 | 内容 |
|------|------|
| `CLAUDE.md` | 项目全局索引（AI 契约入口） |
| `docs/specs/frontend/README.md` | 前端设计规范总入口 |
| `docs/specs/backend/README.md` | 后端设计规范总入口 |
| `docs/handoff/m3-complete.md` | M3 交接文档（L3+L4+L5 交付详情） |
| `docs/handoff/m4-complete.md` | M4 交接文档（后端 8 模块详情） |
| `server/api-contract/openapi-v1.json` | OpenAPI 3.1 完整规范（43.5KB） |
| `client/packages/api-sdk/src/generated/` | OpenAPI 生成的全部 API 代码 |
| `client/apps/web-admin/src/features/notice/` | **Notice 前端完整实现（2105 行），可作为开发其他页面的参考模板** |

---

## 九、建议执行顺序

1. **以已经合并的 notice 前端为模板，开发用户管理页面**（最复杂的 CRUD，做完后其他页面可以复制模式）
2. 角色管理 → 菜单管理 → 部门管理 → 字典管理（按复杂度递减）
3. 操作日志 → 系统配置 → 定时任务日志（只读/简单页面）
4. Sidebar 重构 + Dashboard 充实（壳层优化）
5. 服务监控 + 文件管理（需要特殊 UI）
6. order + approval（M5 剩余业务模块，后端也要先做）
