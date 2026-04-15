# 2026-04-15 M5 Plan B + Plan C 实施 + Notice UI 打磨

## 概述

M5 canonical reference 第二、三份计划（Plan B + Plan C）的完整实施，包括 SSE 实时推送基础设施、多渠道通知系统、Notice 前端页面、SSE 前端集成、E2E 测试，以及 Notice 页面 UI 打磨。

---

## 第一阶段：Plan B + Plan C 功能实施

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

### Review 与修复

**计划 Review（实施前）**
- Plan B: 4 Critical + 9 Important → 全部修复到计划中
- Plan C: 3 Critical + 6 Important → 全部修复到计划中

**中期 Review（Plan B + Plan C 前半段实施后）**
- 后端：rate-limit 桶无限增长 → Caffeine cache 修复；platform 参数校验 → 新增
- 前端：详情路由权限码 list → detail 修复

**最终 Review（全量实施后）**
- C1: 微信绑定页 API 路径和响应类型全错 → 修复
- C2: 未读计数恒为 0（response shape 错误）→ 修复

---

## 第二阶段：Notice UI 打磨

### 背景
Plan B+C 功能完成后，洋哥启动 dev server 检查——发现页面"功能可用但视觉简陋"。对标飞书管理后台，决定做 Notice 页面 UI 打磨。

### 设计决策（通过 brainstorming visual companion 确认）
- **列表页**：筛选面板式（飞书风格）—— 面包屑 → 标题+操作 → 横排即时筛选 → Card 包裹表格+分页
- **编辑表单**：全屏 Dialog 双栏布局（左侧表单 + 右侧设置面板），替代原来的右侧 NxDrawer
- **详情页**：独立路由页，Card 包裹内容 + 元信息区
- **行操作**：主操作文字外露 + ⋯ DropdownMenu 收纳次要操作

### 实施（5 Tasks）
| Task | 内容 | Commit |
|------|------|--------|
| 1 | i18n 补充 + 状态 Badge 颜色修正 | `a43f1bb` |
| 2 | 列表页重写（去 NxFilter → L2 即时筛选 + Card 表格 + DropdownMenu + 新分页 + 进度条） | `8f29070` |
| 3 | 编辑弹窗重写（NxDrawer → 全屏 Dialog + 双栏 + 手动 RHF + 脏检查） | `8cbbcb4` |
| 4 | 详情页重构（Card 包裹 + 元信息区 + Header + Tab Card） | `43f1ae4` |
| 5 | MSW mock 数据对齐 + 全量验证 | `0e553e5` |

### 技术要点
- NxFilter 被替换为 L2 直接组合（即时筛选 + debounce 300ms），NxTable 和 NxBar 保留
- NxDrawer 被替换为 Dialog（max-w-5xl h-[90vh]），表单用手动 useForm + FormProvider
- 分页栏从 NxTable 内置分页改为 Card 底部自定义栏（每页条数选择 + 选中统计）
- Checkbox + RHF 用 Controller 桥接（Radix Checkbox API 不兼容 register）
- TipTapField/FileUploadField 的 control prop 用 `as never` 绕过类型不兼容

---

## 第三阶段的 Bug 修复（dev 启动后发现）

| Bug | 根因 | 修复 |
|-----|------|------|
| 登录后立即跳回登录页 | MSW 没有 notice 相关 handler，请求穿透后端 401 → onUnauthenticated 重定向 | 新增 unread-count/列表/详情 mock handler |
| SSE connect 不断 401 重连 | fetchEventSource 不经过 MSW service worker | MSW 模式下 `__msw_enabled__` 标记跳过 SSE |
| Radix Select 崩溃 | `<SelectItem value="">` 空字符串被 Radix 禁止 | 改为 `value="ALL"` |
| 侧边栏菜单点不了 | M3 侧边栏只做了渲染，MENU 类型没有路由导航 | 不属于 M5 范围，直接 URL 访问 |

---

## 数据

| 维度 | 数量 |
|------|------|
| 总 commits（本 session） | ~45 |
| 文件变更 | ~120 files |
| 新增代码行 | ~9000 |
| 后端测试 | 96（+18 新增：9 SSE + 9 通知渠道） |
| 前端测试 | 274（单元）+ 19（E2E） |
| ArchUnit 规则 | 24/24 通过 |
| 前端质量 | check:types ✅ build ✅ check:i18n ✅ |

---

## 关键决策

1. **ForceLogoutCheckInterceptor 放 infra-security 而非 infra-sse** — ArchUnit Sa-Token 隔离规则
2. **Caffeine 替代 ConcurrentHashMap** 管理限流桶 — 防生产内存泄漏
3. **NotificationBadge L4 通用化** — queryFn 注入，L4 不依赖业务 API
4. **模板插值统一双括号** — i18next 先插值再传 L3 组件
5. **Excel 导出用 window.open** — fetch 不支持 responseType: 'blob'
6. **列表页去 NxFilter 改 L2 即时筛选** — 对标飞书筛选面板式
7. **编辑从 NxDrawer 改全屏 Dialog** — 富文本编辑需要宽屏空间

---

## 当前分支状态

- 分支：`feat/m5-openapi-notice-backend`
- 状态：所有代码已 commit，**未 push**
- 后端 `mvn verify`：96 tests, 0 failures, BUILD SUCCESS
- 前端 `pnpm check:types + build`：全绿
- 待洋哥决定：push / 创建 PR / 合并到 main

---

## 待办（下次 session 继续）

### 已知问题（非阻塞，可后续修复）
1. **侧边栏菜单不可点击**：M3 遗留，MENU 类型没有路由导航逻辑
2. **orval 生成的 hook 名称不友好**：`useList4`/`useCreate3` 等，需要后端加 `@Operation(operationId=...)` 或 orval override
3. **微信绑定页未用 orval hooks**：手写 customInstance 调用，应该切到 orval 生成的 hooks
4. **Zod 校验消息硬编码中文**：需要运行时 i18n 方案
5. **FileUploadField 编辑模式不显示已有附件**：files state 和 field.value 不同步
6. **响应类型 `as` 强转问题**：orval mutator 的返回值类型与实际响应结构不匹配，多处用 `as { data?: ... }` 强转

### 下一步工作
1. **M5 收尾**：push 分支 + 创建 PR + merge to main
2. **侧边栏升级**：菜单路由导航 + 菜单高亮当前路由
3. **L3 组件升级**（可选）：如果要让所有页面受益，升级 NxTable/NxFilter 内部实现
4. **M6 规划**：验证层完整版 + 主题样本库

---

## 规则库复盘

### 已有规则执行情况
- `plan-review-before-execution`: 严格执行，Plan B + C 都经过 Review 后再实施
- `plan-code-snippets-must-verify`: 最终 Review 验证了 Plan C 的代码片段——微信绑定页全部 API 路径写错
- `parallel-subagent`: Plan B（server/）和 Plan C（client/）完全隔离，并行无冲突
- `cross-review-residual-scan`: 最终 Review 做了残留扫描，均为历史文档合法引用
- `template-propagation-risk`: 计划中的 customInstance 响应类型错误被 2 个前端文件复制

### 新增规则候选
1. **hand-written API 调用必须与 orval 生成的 hooks 交叉验证**：微信绑定页手写了 3 个 customInstance 调用，全部路径/响应错误。orval 生成的 hooks 是 OpenAPI 契约的 type-safe 映射，手写调用绕过了契约保障。
2. **MSW mock 必须覆盖所有前端会调用的 API**：登录后 unread-count 穿透导致 401 循环。新增 L5 页面后，MSW handler 必须同步补全。
3. **Radix 组件不接受空字符串 value**：Select/RadioGroup 等 Radix 组件的 `value=""` 会崩溃，用 "ALL"/"NONE" 等占位值。

### 已有规则修正
- 无

---

## 晚间追记 — 项目状态快照 + Step 0 文档对齐

### 背景

Plan B+C 和 UI 打磨完成后,洋哥提出"多 worktree/多分支并行开发后文档和代码混乱,需要一份'唯一可信文档'作为后续开发基线"。本次会话完整产出了这份校准文档 + 落地了第一轮文档对齐。

### 产出一:项目状态快照

- 位置:`~/.claude/plans/effervescent-brewing-valiant.md`(当前 session plan 文件,未落地为 handoff)
- 方法:3 个 Explore agent 并行考古(git/worktree + 后端代码 vs specs + 前端代码 vs specs + 全部 handoff/日志/ADR)
- 关键发现:
  1. **只有 main + claude/wonderful-jackson 两个分支**,HEAD 完全一致。所谓"M5 待 merge"是文档/memory 描述的 drift — **M5 代码早已合并并 push 到 origin/main**
  2. **M3/M4/M5 三个 milestone 的"下班信号"都未达成**,共同症状:后端推进快 + 前端除组件库外 0 业务页面。洋哥当天产出的 `frontend-gap-analysis.md`(618 行)已完整盘点这一缺口
  3. **规划文档(2026-04-10 基线)**与后续 ADR 的多次翻转形成视觉 drift

### 产出二:Step 0 文档对齐(本 session 内执行)

按项目状态快照 Step 0 的 1-4 项,并补做 P0-P2 残留清理:

1. **CLAUDE.md(6 处 drift)**:M5 🔄 进行中 → ✅ 已完成;M3/M4 标注 ⚠️ 下班信号未达成;L2 组件 30→42 个(2 处);ADR 数量 13→14 份(2 处);handoff 清单补齐(m1/m4/frontend-gap-analysis);"最近一次大修·下一次"改为"补前端缺口"
2. **规划文档对照表**:新增 4 条翻转(sys_→mb_ / audit→log / WebSocket→SSE / Flyway 时间戳),补充 ADR-0011/0012 新增规范
3. **memory 清理 4 条过期记录**:
   - `project_m5_status.md`(M5 待 merge — 已过期)
   - `project_m5_plan_structure.md`(Plan A/B/C 结构 — 已履行)
   - `project_m2_m4_parallel.md`(M4 worktree — 已合并且目录已不存在)
   - `project_orval_decision.md`(待洋哥复审 — M5 已全面落地)
4. **handoff 残留 drift**:`frontend-gap-analysis.md` 两处"当前分支未合并"描述修正为"已合并"
5. **specs 残留 drift**:`docs/specs/frontend/03-ui-primitives.md` 两处 "30 个" → "42 个"
6. **补 `m5-complete.md`**:对齐 m1~m4-complete 格式,记录 M5 完整交付物
7. **push**:6d5059e(前端缺口分析) + 6e85f95(Step 0 对齐 part 1)已 push 到 origin/main;本日志 + P2 补全将在下一个 commit

### 规则库复盘(Step 0 part)

**已有规则执行情况**
- `cross-review-residual-scan`:Step 0 做了全项目 grep 残留扫描(feat 分支名/30 个/13 份/M5 进行中等关键词),发现 P0-3 处再清理
- `verify-block-discipline`:Step 0 CLAUDE.md 和规划文档对照表都属于"状态校准",不涉及新约束,无需新增 verify 块

**新增规则候选**
- **memory 的生命周期纪律**:memory 类 type=project 的条目容易过期(M5 status / 分支状态 / worktree 架构 / 决策"待审查"类)。应在 milestone 完成时做一次 memory 扫描,删除过期条目。候选规则名:`memory-milestone-cleanup`,待未来类似情况再发生一次再固化

**已有规则修正**
- `auto memory` 的"What NOT to save" 列表可补充一条具体指引:**"Milestone 状态 / 分支状态 / 待审查标记"属于易过期,优先写到 handoff 或 CLAUDE.md,而不是 memory**(本次 4 条过期 memory 都是这一类)
