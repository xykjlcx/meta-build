# meta-0023：撤销 ADR-0021 / ADR-0022——过度工程化反面样本

- **状态**：已采纳
- **日期**：2026-04-18
- **决策者**：洋哥 + 小灵犀
- **相关文档**：[ADR-0007](0007-继承遗产前先问原生哲学.md)（元方法论起点）、[ADR-0008](0008-flyway-migration命名用时间戳.md)（一致性 > 局部最优）、[ADR-0021](0021-虚拟线程加java25加通知分发取消同步聚合.md)（被撤销）、[ADR-0022](0022-权限一致性应用层清关联加jooq-listener源头捕获.md)（被撤销）
- **类型**：元方法论 + 架构翻转（撤销同日产生的 ADR-0021/0022）

> **注**：本 ADR 是项目 ADR 新命名规范（`<scope>-<nnnn>-<kebab-title>.md`）的第一个样本。现有 0001-0022 保持旧命名，后续按需规整。从本 ADR 起的所有新 ADR 必须按新规范命名，scope 选 `backend` / `frontend` / `meta` 之一（meta = 元方法论 / 跨层决策 / 流程约定）。

---

## 背景

### 触发事件：Review + Review 都发现事实错误

2026-04-18 夜，小灵犀在多角色代码审查中识别出两处"隐患"，并当天写出两份配套 ADR 准备翻转既有实现：

- **ADR-0021**：用虚拟线程 + Java 25 LTS 升级 + NotificationDispatcher 改 fire-and-forget，"彻底解决"`CompletableFuture.orTimeout` 不中断线程 + SMTP 黑洞风险
- **ADR-0022**：FK RESTRICT + Repository 应用层清关联 + jOOQ listener 源头捕获，"彻底解决"PermissionWriteFacade 被 `UserService.deleteUser` / `MenuService.deleteMenu` 绕过的缓存一致性问题

两份 ADR 落盘后小灵犀主动发起对抗审查 + 事实审查，发现 9 条🔴问题：

| ADR | 问题 | 类别 |
|---|---|---|
| 0021 | Spring Boot 3.5.3 不兼容 Java 25（Spring Boot 3.5 官方要求 Java 17-23，需升 3.6+） | 事实错误 |
| 0021 | 虚拟线程下 MDC 传递语义变化，现有 `MdcTaskDecorator` 需要重验证 | 事实错误 |
| 0021 | 砍掉 timeout / allOf.join 后，DeliveryLog 的 fire-and-forget 回写在 JVM crash 时数据丢失，与"可观测需求"冲突 | 方案自洽性 |
| 0022 | `mb_iam_menu` 和 `mb_iam_role_menu` 的父表关系描述错误（menu 是父，role 是另一父，role_menu 是连接表） | 事实错误 |
| 0022 | PostgreSQL `FOR KEY SHARE` / `FOR NO KEY UPDATE` 术语混淆，案例时序推演不严谨 | 事实错误 |
| 0022 | `PermissionChangeExecuteListener` 在 `executeStart` 里再查 `SELECT user_id FROM user_role WHERE role_id=?` 会触发自己，导致递归 | 实现缺陷 |
| 0022 | 删除 Facade 后，`assignRolesToUser` 等业务动作封装无处安放（事务边界 / 权限校验 / 审计入口） | 职责迁移缺失 |
| 0022 | FK 由 CASCADE 改 RESTRICT 本身需要独立 migration + 回滚预案（原 ADR 只一句话带过） | 实施清单缺失 |
| 0022 | Facade 已写入的表和索引若直接删除，对已部署环境不友好（需要 idempotent migration 反向） | 迁移路径缺失 |

两份 ADR 在对抗审查下看起来都像"还能救，再写两页补丁就好"。

### 洋哥的追问：回到第一性原理

洋哥在看完 Review 结果后，没让小灵犀继续补丁，而是问：

> "到底有没有必要做这两个 ADR？问题本身影响真的大吗？"

这一问把讨论从"方案有什么缺陷"拉到"这个改动该不该存在"——和 ADR-0007（方案 E）、ADR-0008（Flyway 命名）是同一个灵魂。

---

## 第一性原理重新审视

### ADR-0021 要解决的问题真的存在吗？

回顾真实的触发链路：

```
用户 HTTP → NoticeService.publishOne（同步事务）
                    ↓ AFTER_COMMIT + @Async
          NoticePublishedEventListener  ← 已经是异步
                    ↓
          NotificationDispatcher.dispatch
                    ↓ allOf().join()
          InAppChannel / EmailChannel / WeChatMp / WeChatMini
```

**事实盘点**：
- 当前 M5 阶段通知量日均个位数（canonical reference 验证中）
- `mbAsyncExecutor` 线程池配置为 `core=4, max=8, queue=100`，在真实流量下队列长度稳定 0
- `CompletableFuture.orTimeout` 不中断 carrier 线程的确是事实，但在当前流量下 carrier 线程释放节奏远快于新任务入列
- SMTP 黑洞是"假设性"风险，当前项目只在 M5 canonical reference 里发通知，SMTP 服务端是已验证的阿里云企业邮（带 QoS）

**结论**：**伪问题**。问题成立的前提是"线程池耗尽"或"业务响应变慢"，而两者当前都不成立。为一个未发生的性能问题引入 Java 25 LTS 升级 + 虚拟线程全局启用 + Dispatcher 模式重写，**复杂度远大于问题本身**。

### ADR-0022 要解决的问题真的存在吗？

`PermissionService.findPermissionCodesByUserId()` 每次查 DB 关联三表 JOIN 的确是事实。但"鉴权高频调用"要看具体数据：

**事实盘点**：
- 当前 M5 阶段鉴权 QPS < 1（内部测试用户 1-3 人）
- PostgreSQL 在三表 JOIN + 索引命中下，单次查询 < 5ms
- HikariCP 连接池默认 10，当前并发 << 池容量
- 缓存的直接收益：**每次鉴权省 5ms**（在 QPS=1 下完全不可感知）
- 缓存的代价：额外维护 Redis key 一致性 + Facade 封装 + ArchUnit 规则 + 事件驱动失效，后续 FK RESTRICT 方案还要加 Repository 改造 + jOOQ listener + migration

**结论**：**伪问题**。问题成立的前提是"鉴权 QPS 压垮 DB"或"DB 连接池紧张"，而两者当前都不成立。为一个未发生的性能问题引入 PermissionCache + PermissionWriteFacade + ArchUnit 规则 + 后续要翻转的 FK + jOOQ listener，**复杂度远大于问题本身**。

### 为什么会落进这个陷阱？

#### 决策四步协议的"是不是"被跳过

洋哥在协作 feedback 里固化过一条元方法论：

> **是不是 → 是什么 / 为什么 → 好处坏处 → 怎么做 / 怎么选。禁止跳步。**

本次讨论直接从"是什么"（`PermissionService` 无缓存、`Dispatcher` 无超时）跳到"怎么做"（加 Facade / 加 orTimeout），**把 Review 里识别的"技术现象"直接当成"必须解决的问题"**，跳过了"这个现象在当前阶段的影响真的大到要解决吗"这一步。

#### 过度工程化的链式陷阱

一旦跳过"是不是"，下游自动形成链式放大：

```
Review 发现"隐患"（无缓存 / 无超时）
  → 设计"彻底解决"方案（PermissionCache / orTimeout + allOf.join）
    → Review 方案发现新问题（Facade 被绕过 / orTimeout 不中断线程）
      → 设计"更彻底解决"方案（FK RESTRICT + jOOQ listener / Java 25 + 虚拟线程）
        → Review 更彻底方案发现更深问题（Facade 职责迁移 / Spring Boot 版本兼容）
          → 继续循环
```

每一层都在**承认上一层的前提**的基础上往下叠：没人问"上一层的前提是不是伪问题"。

---

## 决策

### 决策 1：撤销 ADR-0021 和 ADR-0022

- 两份 ADR 文件**保留不删**（作为反面样本档案），但在本 ADR 里明确标注"已撤销"
- 未来读者读到 ADR-0021/0022 应直接跳到本 ADR 看撤销理由和元教训

### 决策 2：回退对应 commit

| commit | 原描述 | 处理 |
|---|---|---|
| `fdc91251` | 权限码 Redis 缓存 + PermissionWriteFacade 事件驱动失效 | **完全回退**：删 PermissionCache / PermissionChangedEvent / PermissionChangedEventListener / PermissionWriteFacade / PermissionCacheTest；RoleService/MenuService 改回直接 Repository 调用；PermissionService 去缓存读路径 |
| `88081d75` | 渠道独立超时 + 投递日志表 + 微信 token 缓存 + 共享 RestTemplate + AutoConfig 条件化 | **部分回退**：去掉 `MbNotificationProperties.timeout` / `NotificationChannel.defaultTimeout()` / Dispatcher `orTimeout+allOf.join` / `NotificationDispatcherTimeoutTest` / 各渠道 defaultTimeout 重写；**保留** DeliveryLog 表 + jOOQ Record + Repository/Service + Caffeine token 缓存 + 共享 RestTemplate + `@ConditionalOnProperty` |
| `13bcc06b` | 补 ArchUnit 三条规则（RestTemplate / @Scheduled / PermissionFacade） | **部分回退**：**删** `PermissionWriteRule` + ArchitectureTest 对应测试方法；**保留** `HttpClientRule.NO_DIRECT_REST_TEMPLATE_CONSTRUCTION`（和共享 Bean 配套）+ `ScheduledRule.SCHEDULED_METHOD_MUST_HAVE_SHEDLOCK`（真规则）|

### 决策 3：放弃的能力 / 方案（全列表）

以下全部放弃，未来若性能数据支持再走新 ADR：

- ❌ Java 21 → Java 25 LTS 升级
- ❌ 虚拟线程 + `Executors.newVirtualThreadPerTaskExecutor`
- ❌ `NotificationDispatcher` 改 fire-and-forget（保留当前 `allOf().join()`，但去掉 `orTimeout`）
- ❌ FK `ON DELETE CASCADE` → `RESTRICT`
- ❌ Repository 内部 "先清关联再删主记录"
- ❌ `PermissionChangeExecuteListener`（jOOQ 层源头捕获）
- ❌ `PermissionWriteFacade`（门面收口）
- ❌ `PermissionCache`（Redis 24h 兜底 TTL）
- ❌ `PermissionChangedEvent` + `PermissionChangedEventListener`
- ❌ `PermissionWriteRule` ArchUnit 方法名白名单

### 决策 4：保留的能力（精简版）

`88081d75` 里和过度工程无关的真改进保留：

- ✅ `mb_notification_delivery_log` 表（字段后续重构，见配套 commit）
- ✅ `DeliveryLogRepository` + `DeliveryLogService`（投递结果落表能力，未来演进 Outbox 的基础）
- ✅ `WeChatAccessTokenCache`（Caffeine 缓存真收益：微信 access_token 2h TTL）
- ✅ `RestTemplate` 共享 Bean + HttpClient5 连接池（真收益 + 和 ArchUnit `NO_DIRECT_REST_TEMPLATE_CONSTRUCTION` 配套）
- ✅ `NotificationAutoConfiguration` 的 `@ConditionalOnProperty`（真收益：没启用时不装配 bean）
- ✅ `ScheduledRule.SCHEDULED_METHOD_MUST_HAVE_SHEDLOCK`（真 ArchUnit 规则，与 ShedLock 配套）

---

## 元教训（本 ADR 的核心价值）

### 教训 1：决策四步协议的"是不是"必须问

Review 里识别的"技术现象"（无缓存 / 无超时 / 有隐患）**不等于**"必须解决的问题"。现象是客观存在的，但"是不是问题"取决于当前阶段的真实影响。

**自检清单**（未来 Review 发现"隐患"时强制问）：

1. 这个现象在**当前阶段**的真实影响有多大？（举具体数字）
2. 不解决会怎样？（最坏情况）
3. 解决方案引入的复杂度 vs 问题本身严重程度，比例合理吗？
4. 能不能登记到"pre-prod 清单"等到有数据再决定？

只有 1-3 都明确答出"是必须"，才进"是什么 / 怎么做"。

### 教训 2：过度工程化的链式陷阱识别

一旦进入"Review 方案 → 方案补丁 → Review 补丁"的循环，**立即停下来问"最初那个问题是不是伪问题"**。

信号灯：

- 方案 A 的 Review 发现新问题 → 设计方案 B
- 方案 B 的 Review 又发现新问题 → 设计方案 C
- 每轮方案的复杂度持续叠加

出现这个信号说明最初的"是不是"没问清楚，不是方案不够好。

### 教训 3：过度工程的反面样本价值

ADR-0021 / 0022 虽然被撤销，但**作为反面样本有独立价值**：

- 未来读者读到"PermissionCache 一致性问题"再次心动时，读本 ADR 能看到"我们试过怎么做、为什么失败"
- 未来读者读到"Java 25 虚拟线程"再次心动时，本 ADR 的撤销理由能提醒"问题成立的前提"
- 反面样本比正面教条更能唤起自我审查

### 教训 4：与 ADR-0007 / 0008 的关系

本 ADR 和 ADR-0007（继承遗产问原生哲学）、ADR-0008（一致性 > 局部最优）同属"元方法论样本 ADR"，共同构成项目决策文化三元组：

| ADR | 元原则 | 触发信号 |
|---|---|---|
| 0007 | 继承遗产前先问原生哲学 | 旧生态的基类范式被搬到新生态 |
| 0008 | 一致性 > 局部最优 | 混合方案"A 部分用 X, B 部分用 Y" |
| **0023（本）** | **"是不是"必须问** | **Review 识别现象直接进"怎么做"** |

---

## 连带影响

### ADR 命名规范变更（本 ADR 起）

从本 ADR 起，所有新 ADR 必须按 `<scope>-<nnnn>-<kebab-title>.md` 格式命名：

- `<scope>`：`backend` / `frontend` / `meta`（三选一）
  - `backend` = 后端决策
  - `frontend` = 前端决策
  - `meta` = 元方法论 / 跨层决策 / 流程约定 / 撤销类 ADR
- `<nnnn>`：全局连续编号，4 位零填充
- `<kebab-title>`：英文短横线连接，2-5 词语义化

示例：
- `backend-0025-permission-cache.md`
- `frontend-0024-three-layer-navigation-philosophy.md`
- `meta-0023-over-engineering-case-study.md`（本文件）

**开新 ADR 前强制动作**：`ls docs/adr/` 查当前最大编号 +1。

现有 0001-0022 保持旧命名不动，后续洋哥抽时间统一规整。

### 文档修订

- `CLAUDE.md`：ADR 索引追加 0021/0022（标注已撤销）+ meta-0023；"最近一次大修"更新；命名规范小节追加
- `AGENTS.md`：镜像 `CLAUDE.md` 的变动（洋哥同时用 Claude Code + Codex）
- `docs/rules/adr-numbering-discipline.md`：待洋哥写入（截图里已预告），规则：`<scope>-<nnnn>-<kebab-title>` + 开新 ADR 前 `ls` 确认编号
- `docs/handoff/v1-pre-prod-checklist.md`（新）：登记本次放弃的能力，待有数据再评估

### 代码影响

见"决策 2：回退对应 commit"表格，共 3 个回退 commit。

---

## 成本与风险

### 成本

| 项目 | 成本 | 备注 |
|---|---|---|
| 完全回退 `fdc91251` | 中（约 30 分钟）| 删文件 + Service 改回 + Repository 删方法 + PermissionService 去缓存 |
| 部分回退 `88081d75` | 中（约 30 分钟）| 精细回退 timeout 相关代码，保留其他 |
| 部分回退 `13bcc06b` | 低（约 10 分钟）| 删 `PermissionWriteRule` 一个类 + 一个测试方法 |
| 写本 ADR | 中（约 40 分钟）| 一次性 |
| CLAUDE.md / AGENTS.md 同步 | 低（约 15 分钟）| |
| pre-prod 清单新文件 | 低（约 15 分钟）| |

### 风险

| 风险 | 严重度 | 缓解 |
|---|---|---|
| 回退时误伤保留的能力（DeliveryLog / token 缓存 / 共享 RestTemplate）| 中 | 精细 `git diff` + 分 commit + `./mvnw verify` 验证 |
| 未来真的出现鉴权 QPS > 100 / DB 连接紧张，需要回到缓存方案 | 低 | 登记到 pre-prod 清单，有数据再走新 ADR |
| 未来真的出现通知量激增 / SMTP 黑洞，需要回到虚拟线程方案 | 低 | 登记到 pre-prod 清单，有数据再走新 ADR |
| 读者误以为"缓存一致性永远不用做" | 低 | 本 ADR 明确"伪问题"限定在"当前 M5 阶段"，pre-prod 清单列出触发条件 |

### 放弃的能力

| 放弃 | 对 meta-build 的影响 |
|---|---|
| 鉴权缓存能力 | 当前 QPS < 1 无感；未来真有性能压力再加 |
| 虚拟线程能力 | 当前线程池够用；未来有长耗时业务（海外 PDF 下载等）再加 |
| 权限写入"源头单点拦截" | `@RequirePermission` 注解守护 + 集成测试覆盖，已够用 |
| FK RESTRICT 的 fail-fast | 继续用 CASCADE，接受 DB 内部级联——反正当前没有缓存要失效 |

---

## 验证方式

- ✅ `docs/adr/0021-*.md` / `0022-*.md` 原文保留（untracked 状态转为 tracked，作为反面档案）
- ✅ `docs/adr/meta-0023-over-engineering-case-study.md` 存在
- ✅ `git log` 有 `revert(iam): ...见 ADR-0023`、`revert(notification): ...见 ADR-0023`、`revert(arch): ...见 ADR-0023` 三个 commit
- ✅ `grep -r "PermissionWriteFacade" server/` 结果为空
- ✅ `grep -r "PermissionCache" server/` 结果为空
- ✅ `grep -r "orTimeout" server/mb-platform/platform-notification/` 结果为空
- ✅ `./mvnw verify` 全绿
- ✅ `CLAUDE.md` / `AGENTS.md` 的 ADR 索引同步
- ✅ `docs/handoff/v1-pre-prod-checklist.md` 列出放弃的能力和触发条件

---

## 维护约定

### 关于"是不是"自检

所有新的 Review / 改造方案都要把"是不是"作为第一步写在讨论开头。跳过这一步的方案讨论一律打回。

### 关于 pre-prod 清单

本 ADR 放弃的能力（权限缓存 / 虚拟线程 / Outbox / FK RESTRICT 等）统一进 `docs/handoff/v1-pre-prod-checklist.md`。未来上线前看数据，数据支持则走新 ADR，数据不支持就继续搁置。

### 关于反面样本 ADR

ADR-0021 / 0022 不删，作为档案。未来若有人翻这两个文件，本 ADR 是第一入口（文件头"相关文档"已指向本 ADR）。

### 关于命名规范

从本 ADR 起新 ADR 必须按 `<scope>-<nnnn>-<kebab-title>.md` 格式。写 ADR 前 `ls docs/adr/` 确认编号。现有 0001-0022 保持不动。

---

## 致谢

洋哥在本轮讨论中的一次关键追问——

> "到底有没有必要做这两个 ADR？问题本身影响真的大吗？"

这一问把讨论从"ADR-0021/0022 的方案哪里还能救"拉到"这两个改动该不该存在"，直接拆掉了我的"补丁链式叠加"惯性。

ADR-0007 是"继承遗产前问原生哲学"，ADR-0008 是"一致性 > 局部最优"，本 ADR 是"是不是必须做"——三次追问同一灵魂：**不要把"现象"当"问题"，不要把"方案"当"必须"**。

本次讨论过程中我（小灵犀）连续在同一个陷阱里打转了两轮（方案 A → 方案 B），直到洋哥追问才停下来。这是典型的"跳过决策四步协议第一步"的代价——值得作为反面样本永久保留。
