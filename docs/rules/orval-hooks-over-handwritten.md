---
title: 优先使用 orval 生成的 hooks，手写 API 调用必须交叉验证
type: pitfall
triggers: [customInstance, api-sdk, fetch, 手写, API, 端点, endpoint]
scope: [前端]
---

# 优先使用 orval 生成的 hooks，手写 API 调用必须交叉验证

## 规则
前端调用后端 API 时，**必须优先使用 orval 生成的 type-safe hooks**。如果不得不手写 `customInstance` 调用（如 orval 未覆盖的端点），必须与后端 Controller 的实际路径和响应类型交叉验证。

## Why
2026-04-15 M5 Plan C 实施，微信绑定页手写了 3 个 `customInstance` 调用：
- `GET /api/v1/wechat/mp/auth-url` → 实际是 `/api/v1/wechat/mp/oauth-state`
- `DELETE /api/v1/wechat/unbind?platform=MP` → 实际是 `/api/v1/wechat/unbind/MP`（path variable）
- 响应类型 `{ data: WechatBinding[] }` → 实际是 `WechatBinding[]`（直接体）

orval 已生成了正确的 hooks（`useMyBindings`, `useGenerateMpOAuthState`, `useUnbind`），但实现者选择了手写。所有 3 个 bug 都会被 orval hooks 的编译时类型检查自动拦截。

## How to apply
- 新增前端 API 调用时，先检查 orval 是否已生成对应 hook（在 `api-sdk/src/generated/endpoints/` 下搜索）
- 有生成的 hook → 直接用，不要手写
- 没有生成的 hook → 手写时必须 grep 后端 Controller 确认路径和响应类型
- Code review 时对所有 `customInstance` 调用重点审查
