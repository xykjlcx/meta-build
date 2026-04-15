# M5 完成交接文档

> 新 session 开始前读这份文档,5 分钟内获得 M5 完整上下文。本文档与 [frontend-gap-analysis.md](frontend-gap-analysis.md) 配套使用:本文档描述 M5 **已交付**的内容,gap-analysis 描述 M5 **未覆盖**的前端缺口(P0-P4)。

---

## 当前状态

- **M5 已完成并合并到 main**(2026-04-15,commit 区间 `50db465..e58aa3b`,共 29 commits,+6671/-631 行)
- **后端**:`mvn verify` 全绿，ArchitectureTest 28 条 ArchUnit 规则通过
- **前端**:`pnpm build` + `pnpm check:types` + `pnpm test`(274 单元)+ `pnpm playwright test`(19 E2E,15 可执行 + 4 fixme)全绿
- **交付范围**:business-notice canonical reference + SSE 基础设施 + 4 通道通知分发 + OpenAPI 驱动的 api-sdk + 前端 Notice 全量 + SSE 集成 + 微信绑定页
- **未交付**:order / approval 两个 canonical reference(M5 规划但未开始)、8 个平台模块前端页面(见 gap-analysis)

---

## M5 新增的代码结构

### business-notice(新增 business 层,首个 canonical reference)

位置:`server/mb-business/business-notice/`(25 Java 文件,~2110 行)

```
├── api/                          [12 DTO]
│   ├── NoticeCreateCommand / NoticeUpdateCommand / NoticePublishCommand
│   ├── NoticeView / NoticeDetailView / AttachmentView / RecipientView / NoticeTargetView
│   ├── NoticeQuery / BatchIdsCommand / BatchResultView / NoticeTarget
├── domain/
│   ├── NoticeService                 [业务核心]
│   ├── NoticeRepository              [jOOQ 查询]
│   ├── NoticeRecipientRepository     [收件人表]
│   ├── NoticeTargetRepository        [目标范围]
│   ├── NoticeStatus                  [状态机: DRAFT→PUBLISHED→REVOKED]
│   ├── NoticePublishedEvent          [领域事件]
│   ├── NoticePublishedEventListener  [发布 → NotificationDispatcher 分发]
│   ├── NoticeExportService           [Excel 导出]
│   └── FormulaInjectionHandler       [Excel 公式注入防护]
├── config/
│   └── NoticeDataScopeConfig         [数据权限绑定]
└── web/
    └── NoticeController              [REST API + @RequirePermission + @OperationLog]
```

**关键设计**:
- 状态机完整:发布/撤回/复制/批量都走状态转移
- 事件驱动:`publish` 触发 `NoticePublishedEvent` → `NotificationDispatcher` 多通道分发
- 安全:DOMPurify XSS 清理 + FormulaInjectionHandler 防 Excel 公式注入
- 数据权限:`NoticeDataScopeConfig` 注册到 `DataScopeRegistry`,SQL 渲染时自动过滤

### infra-sse(新增 infra 子模块,ADR-0014 WebSocket 的替代)

位置:`server/mb-infra/infra-sse/`(8 个 Java 类)

| 类 | 职责 |
|----|------|
| `SseMessageSender` / `SseMessageSenderImpl` | 业务层接口:`sendToUser` / `broadcast` / `forceLogout` / `getOnlineUserIds` |
| `SseConnectionController` | HTTP 端点 `/api/v1/sse/connect` + Bucket4j 5/min/user 限流 |
| `SseSessionRegistry` | `ConcurrentHashMap<userId, SseEmitter>` + 多 tab 处理(旧连接收 `session-replaced` 后关闭) |
| `SseHeartbeatScheduler` | 30s 心跳保活 |
| `SseProperties` / `SseAutoConfiguration` | 配置与自动装配 |

`ForceLogoutCheckInterceptor` 放在 `infra-security`(ArchUnit 要求 StpUtil 只能在此包),SSE 踢人走双保险:SSE `force-logout` 事件 + Redis `mb:kicked:{userId}` 标记。

### platform-notification 扩展(4 通道 + 微信绑定)

- `domain/InAppChannel` — SSE 广播
- `domain/EmailChannel` — SMTP(JavaMailSender)
- `domain/WeChatMpChannel` — 微信公众号模板消息
- `domain/WeChatMiniChannel` — 微信小程序订阅消息
- `domain/NotificationDispatcher` — 并行分发 + 单渠道容错(某通道失败不影响其他)
- `domain/NotificationLogRepository` + `NotificationLogService` — 记录发送历史
- `domain/WeChatBindingRepository` + `WeChatBindingService` — 微信 MP/Mini 绑定 + OAuth state CSRF 防护
- `web/NotificationLogController` + `WeChatBindingController`

### mb-schema 新增 DDL(时间戳命名,ADR-0008)

- `V20260615_001__notice.sql` — notice 主表 + notice_recipient
- `V20260615_003__notification_log.sql` — 通知发送记录
- `V20260615_004__wechat_binding.sql` — 微信绑定表

(002 编号未使用,属 Flyway 允许的编号跳跃)

### 前端 Notice 模块

位置:`client/apps/web-admin/src/features/notice/`(14 文件,2105 行)

| 文件 | 行数 | 功能 |
|------|-----|------|
| `pages/notice-list-page.tsx` | 667 | 筛选面板式列表(L2 即时筛选 + NxTable + NxBar + 导出 + 批量) |
| `pages/notice-detail-page.tsx` | 349 | Tabs(基本信息 / 接收人 / 发送记录)+ Card 包裹 + SSE |
| `components/notice-dialog.tsx` | 354 | 全屏 Dialog 双栏(左表单 + 右设置)+ 手动 RHF + 脏检查 |
| `components/file-upload-field.tsx` | 160 | 文件上传 |
| `components/target-selector.tsx` | 83 | 通知范围(全部/部门/角色/用户，已接入真实选择器) |
| `components/recipients-tab.tsx` | 81 | 接收人列表(已读/未读) |
| `components/sse-handlers.tsx` | 77 | SSE 事件处理 |
| `components/notification-log-tab.tsx` | 90 | 发送记录(已接入 notification-log API) |
| `components/batch-confirm-dialog.tsx` | 59 | 批量操作确认 |
| `components/tiptap-field.tsx` | 44 | 富文本编辑器 |
| `components/notice-status-badge.tsx` | 29 | 状态徽章 |
| `utils/sanitize.ts` / `schemas.ts` / `constants.ts` | 112 | 工具 + Zod + 常量 |

### 前端 L4 SSE 集成(`@mb/app-shell`)

- `sse/sseEventBus` / `useSseConnection` / `useSseSubscription`
- `_authed` layout 全局订阅:notice 推送 Toast、`force-logout` 登出、权限刷新
- `components/NotificationBadge`(queryFn 注入,L4 不直接依赖业务 API)

### 前端微信绑定页

- `routes/_authed/settings/index.tsx`(设置入口)
- `routes/_authed/settings/wechat-bind.tsx`(MP + Mini 绑定管理 + OAuth)

### api-sdk OpenAPI 生成管线

- `server/api-contract/openapi-v1.json`(43.5KB)
- `client/packages/api-sdk/src/generated/endpoints/`(15 Controller → 33 .ts 文件,TanStack Query hooks + MSW handlers)
- `client/orval.config.ts` + CI drift 检测(.github/workflows/ 已配)
- 原手写的 4 拦截器链通过 orval `mutator` 兼容

### dep-cruiser 新增规则(L5 SSE 隔离)

禁止 L5(web-admin)直接 import 底层 SSE API(`fetchEventSource` 等),必须走 L4 的 `useSseConnection` / `useSseSubscription`。

---

## M5 交付物清单

| 交付物 | 证据 |
|-------|------|
| business-notice | 25 Java / 2110 行 / 31 集成测试(NoticeIntegrationTest 单个 31 条) |
| infra-sse | 8 Java / 9 集成测试(SseIntegrationTest) |
| 4 通知渠道 | InApp / Email / WeChatMp / WeChatMini / Dispatcher / 9 渠道集成测试 |
| 前端 Notice | 14 文件 / 2105 行 / 19 E2E 场景(notice.spec.ts) |
| 前端 SSE | sseEventBus + useSseConnection + useSseSubscription + 全局事件处理 |
| 微信绑定页 | 设置入口 + OAuth + wx.login |
| OpenAPI 管线 | openapi-v1.json + orval + drift 检测 |
| UI 打磨(后置阶段)| 列表筛选面板式 + 编辑全屏 Dialog 双栏 + 详情 Card 重构 |

---

## 关键技术决策

| 决策 | 结论 | 原因 |
|-----|------|------|
| 实时推送 | **SSE 替代 WebSocket**(ADR-0014) | 单向推送足够,浏览器原生 EventSource,单实例简单 |
| ForceLogout 位置 | 放 `infra-security` 而非 `infra-sse` | ArchUnit Sa-Token 隔离规则要求 |
| 限流桶容器 | Caffeine 缓存 | 替代 ConcurrentHashMap,防生产内存泄漏(中期 Review 修复) |
| NotificationBadge 位置 | L4 `app-shell`(queryFn 注入) | L4 不直接依赖业务 API,遵守分层 |
| i18n 插值 | 双括号 `{{}}` | i18next 先插值再传 L3 组件 |
| Excel 导出 | `window.open` | fetch 不支持 `responseType: 'blob'` |
| Notice 列表筛选(打磨阶段) | 去 NxFilter 改 L2 即时筛选 | 对标飞书筛选面板式 |
| Notice 编辑(打磨阶段) | NxDrawer → 全屏 Dialog 双栏 | 富文本编辑需要宽屏 |

---

## M5 踩坑记录(对应新增的 3 条规则)

- **登录后 401 循环** — MSW 未覆盖 `/api/v1/notices/unread-count`,穿透后端 401 触发重定向 → 规则 [`msw-handler-sync`](../../.claude/rules/msw-handler-sync.md)
- **SSE connect 不断 401 重连** — `fetchEventSource` 不经过 MSW service worker → MSW 模式下 `__msw_enabled__` 标记跳过 SSE
- **Radix Select 崩溃** — `<SelectItem value="">` 被 Radix 禁止 → 规则 [`radix-no-empty-value`](../../.claude/rules/radix-no-empty-value.md)
- **微信绑定页 3 处 API 全错** — 手写 customInstance 绕过了 orval 契约(路径错 + 响应类型错) → 规则 [`orval-hooks-over-handwritten`](../../.claude/rules/orval-hooks-over-handwritten.md)
- **Caffeine 缓存修复** — SSE 限流桶原用 ConcurrentHashMap,中期 Review 发现无限增长风险 → 改 Caffeine + expireAfterAccess

---

## 已知遗留(本 milestone 未处理)

详见 [frontend-gap-analysis.md](frontend-gap-analysis.md) §5 清单:

- **侧边栏菜单不可点击**(M3 遗留)— MENU 类型没有路由导航逻辑
- **orval hook 命名不友好** — `useList4` / `useCreate3`,需要后端 `@Operation(operationId)` 或 orval override
- **Zod 校验消息硬编码中文** — 需要运行时 i18n 方案
- **FileUploadField 编辑模式** — files state 与 field.value 不同步
- **响应类型多处 `as` 强转** — orval mutator 返回类型与实际响应 shape 不一致

---

## 下一阶段

**首要选择**:补完 M3/M4 的"下班信号"——8 个平台模块前端页面(user/role/menu/dept/dict/config/oplog/job-logs),建议按 gap-analysis §9 的顺序(用户管理先做,作为模板)。

**M6 规划路径**(待洋哥决策 A/B/C):
- 选项 A:延续 v1 规划 → 补 order + approval + 验证层完整版 + 主题样本库
- 选项 B:优先 v1 可演示性 → 完成 P0 前端页面 + 侧边栏升级 + 8 套主题样本
- 选项 C:跳到 Spec 引擎预研 → Notice 作为反向提炼样本

详见 [项目状态快照 plan 文档](../../../.claude/plans/effervescent-brewing-valiant.md)(当前 session 产出)。

---

## 常用命令

```bash
# 后端
cd server && mvn verify                                         # 96 tests
cd server && mvn test -pl mb-admin -Dtest=ArchitectureTest      # 28 ArchUnit 规则
cd server && mvn spring-boot:run -pl mb-admin                   # 启动应用(产出 openapi.json)

# jOOQ codegen(DDL 变更后)
cd server && mvn -Pcodegen generate-sources -pl mb-schema

# 前端
cd client && pnpm dev                                           # MSW mock 模式(localhost:5173)
cd client && pnpm generate:api-sdk                              # orval 从 openapi.json 生成
cd client && pnpm test                                          # 274 单元
cd client && pnpm playwright test                               # 19 E2E

# Docker
docker compose up -d                                            # PG(15432) + Redis(16379)
```
