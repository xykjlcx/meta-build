# 2026-04-15 M5 Plan B + Plan C 实施

## 概述

M5 canonical reference 第二、三份计划（Plan B + Plan C）的完整实施，包括 SSE 实时推送基础设施、多渠道通知系统、Notice 前端页面、SSE 前端集成和 E2E 测试。

## 完成内容

### Plan B: SSE 基础设施 + 通知渠道系统（17 Tasks）

**Phase 3 — SSE 基础设施（Tasks 1-6）**
- infra-sse 模块：SseSessionRegistry + SseMessageSender + SseConnectionController + SseHeartbeatScheduler
- ForceLogoutCheckInterceptor 放在 infra-security（ArchUnit 要求只有该包可用 StpUtil）
- SSE 建连限流：Bucket4j 5 次/分钟/用户，Caffeine cache 防内存泄漏
- 9 个集成测试

**Phase 4 — 多渠道通知系统（Tasks 7-17）**
- NotificationChannel 策略模式 + NotificationDispatcher 异步分发
- 4 个渠道实现：InAppChannel / EmailChannel / WeChatMpChannel / WeChatMiniChannel
- notification_log + wechat_binding DDL（2 个 Flyway migration）
- Notice publish → NotificationDispatcher 串联（替换 Plan A 的简单通知）
- 微信绑定/解绑 API + OAuth state CSRF 防护
- 通知发送记录查询 API
- 9 个渠道集成测试
- openapi.json 更新

### Plan C: Notice 前端 + SSE 集成 + E2E（15 Tasks）

**前半段（Tasks 1-8）— 与 Plan B 并行**
- api-sdk 重新生成 + exports map 更新
- i18n 字典（zh-CN + en-US，142 行）
- 列表页（NxTable + NxFilter + NxBar + 导出 + 批量操作）
- 新增/编辑抽屉（NxDrawer + TipTap 富文本 + FileUpload + TargetSelector）
- 详情页（DOMPurify + 附件下载 + 状态操作 + Tab）
- NotificationBadge 通用组件（L4，queryFn 注入）

**后半段（Tasks 9-15）— 依赖 Plan B**
- SSE 前端集成：sseEventBus + useSseConnection + useSseSubscription（L4 app-shell）
- _authed layout 集成 SSE + 实时事件处理（notice toast + force-logout + 权限刷新）
- 微信绑定页
- dep-cruiser 新增 2 条 SSE 隔离规则
- CI 更新（api-sdk 生成 + drift 检测）
- Playwright E2E 测试 19 场景（15 可执行 + 4 fixme）

## 数据

| 维度 | 数量 |
|------|------|
| 总 commits | 35 |
| 文件变更 | ~100 files |
| 新增代码行 | ~7000 |
| 后端测试 | 96（+18 新增：9 SSE + 9 通知渠道） |
| 前端测试 | 274（单元） + 19（E2E） |
| ArchUnit 规则 | 24/24 通过 |

## Review 与修复

### 计划 Review（实施前）
- Plan B: 4 Critical + 9 Important → 全部修复到计划中
- Plan C: 3 Critical + 6 Important → 全部修复到计划中

### 中期 Review（Plan B + Plan C 前半段实施后）
- 后端：I-1 rate-limit 桶无限增长 → Caffeine cache 修复；I-4 platform 参数校验 → 新增
- 前端：I-1 详情路由权限码 list → detail 修复

### 最终 Review（全量实施后）
- C1: 微信绑定页 API 路径和响应类型全错（hand-written customInstance vs orval 生成的 hooks）→ 修复
- C2: 未读计数恒为 0（response shape 错误）→ 修复
- I1: E2E 文件 lint formatting → auto-fix

## 关键决策

1. **ForceLogoutCheckInterceptor 放 infra-security 而非 infra-sse** — ArchUnit Sa-Token 隔离规则
2. **Caffeine 替代 ConcurrentHashMap** 管理限流桶 — 防生产内存泄漏
3. **NotificationBadge L4 通用化** — queryFn 注入，L4 不依赖业务 API
4. **模板插值统一双括号** — i18next 先插值再传 L3 组件
5. **Excel 导出用 window.open** — fetch 不支持 responseType: 'blob'

## 规则库复盘

### 已有规则执行情况
- `plan-review-before-execution`: 严格执行，Plan B + C 都经过 Review 后再实施
- `plan-code-snippets-must-verify`: 最终 Review 验证了 Plan C 的代码片段——微信绑定页全部 API 路径写错，证明这条规则的价值
- `parallel-subagent`: Plan B（server/）和 Plan C（client/）完全隔离，并行无冲突
- `cross-review-residual-scan`: 最终 Review 做了残留扫描（platform-oplog / sys_iam），均为历史文档合法引用
- `template-propagation-risk`: 计划中的 customInstance 响应类型错误被 2 个前端文件复制，修复成本 O(2)

### 新增规则候选
- **hand-written API 调用必须与 orval 生成的 hooks 交叉验证**：微信绑定页手写了 3 个 customInstance 调用，全部路径/响应错误。如果用了 orval 生成的 hooks，这些 bug 不会存在。orval 生成的 hooks 是 OpenAPI 契约的 type-safe 映射，手写调用绕过了契约保障。

### 已有规则修正
- 无
