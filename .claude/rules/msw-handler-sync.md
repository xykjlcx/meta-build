---
title: 新增前端页面必须同步补全 MSW mock handler
type: pitfall
triggers: [MSW, mock, handler, 前端页面, 新增页面, dev server, 401]
scope: [前端]
---

# 新增前端页面必须同步补全 MSW mock handler

## 规则
新增 L5 业务页面后，必须在 `client/apps/web-admin/src/mock/handlers.ts` 同步补全该页面会调用的所有 API endpoint 的 MSW handler。特别是会在页面挂载时（useEffect / beforeLoad / useQuery）自动发起的请求。

## Why
2026-04-15 M5 Plan C，Notice 页面实现后启动 dev server——登录成功后立即被重定向回登录页。根因：`NotificationBadge` 在 `_authed` layout 挂载时自动请求 `/api/v1/notices/unread-count`，但 MSW 没有这个 handler → `onUnhandledRequest: 'bypass'` 让请求穿透到真实后端 → mock token 被拒 401 → `onUnauthenticated` 回调触发重定向到登录页。

同样，`fetchEventSource('/api/v1/sse/connect')` 不经过 MSW service worker（SSE 不是标准 fetch），导致无限 401 重连。

## How to apply
- 新增页面后，列出该页面及其 layout 会自动发起的所有 API 请求
- 每个请求都在 handlers.ts 中加对应的 MSW handler
- 特别注意 layout 级别的请求（如 `_authed.tsx` 中的 NotificationBadge）——影响所有 authed 页面
- 对于 SSE/WebSocket 等不经过 service worker 的长连接，在 dev 模式下跳过（参考 `__msw_enabled__` 标记）
