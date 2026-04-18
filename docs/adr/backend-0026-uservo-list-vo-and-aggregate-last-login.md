# backend-0026：新增 UserListVo + login_log 聚合 lastLoginAt

- **状态**：已采纳
- **日期**：2026-04-18
- **决策者**：洋哥 + 小灵犀（+ Plan B 前端会话答复）
- **相关文档**：[ADR-0015](0015-分页契约拆分为请求dto与内部query.md)、[ADR-0010](0010-审计日志改操作日志.md)
- **类型**：契约变更（后端 VO 层）

> 编号说明：上一个 ADR 是 `meta-0023`。本批次 Plan A 已占用 `frontend-0024 / frontend-0025`，故本 ADR 取 `backend-0026`。

---

## 背景

Plan B（Claude Design IAM 3 页重写）的 members-page 右侧成员表需要展示"最近登录时间"列，作为管理员识别僵尸账号 / 活跃度的辅助信号。

现状约束：

- `UserVo` 是既有契约，已被 `getById / create / update` 等多处复用，扩字段是全链路影响
- `mb_iam_user` 表**没有** `last_login_at` 冗余字段，登录成功时间只写在 `mb_iam_login_log`（append-only）
- 现有索引 `idx_login_log_user (user_id, created_at DESC)` 已经覆盖聚合查询路径

两种方案可选：

| 方案 | 要点 | 优点 | 缺点 |
|---|---|---|---|
| A. 扩 `UserVo.lastLoginAt` | 在通用 VO 加 nullable 字段，所有返回 UserVo 的场景都带 | 字段统一，消费端无歧义 | create/detail 响应多一次聚合开销；类型定义与"创建场景 0 登录"语义不匹配 |
| **B. 新增 `UserListVo` 分列 VO**（采纳） | `UserVo` 保持精简不变，只在 `PageResult<UserListVo>` 列表场景带 `lastLoginAt` | list 和 detail 语义分离；聚合只在分页上下文发生；未来加"登录次数 / 最近 IP"等活跃度字段也往 UserListVo 扩，零污染核心 VO | 新增一个 VO，orval 生成侧多一个类型 |

---

## 决策

**采纳方案 B**：

1. 新增 `UserListVo` record，字段 = `UserVo` 全字段 + `lastLoginAt: OffsetDateTime (nullable)`
2. `UserService.list(...)` 返回 `PageResult<UserListVo>`（原签名 `PageResult<UserVo>` 翻转）
3. `UserController.list(...)` 响应类型同步为 `PageResult<UserListVo>`
4. 其他 UserVo 返回场景（`GET /users/:id`、`POST /users`、`PUT /users/:id`、`POST /users/{id}/reset-password` 等）**保持 UserVo**，不带 lastLoginAt
5. 聚合查询策略：
   - 用 **LATERAL JOIN**（PostgreSQL）对当前分页切片的用户 ID 批量聚合，**避免 N+1**
   - SQL 语义：`SELECT u.*, ll.last_login_at FROM mb_iam_user u LEFT JOIN LATERAL (SELECT MAX(created_at) AS last_login_at FROM mb_iam_login_log WHERE user_id = u.id AND success = true) ll ON true`
   - 仅在分页查询路径执行；detail/create 响应不触发聚合
6. 前端从未登录用户：返回 `null`，前端按 i18n 显示"从未登录"占位

---

## 为什么不在 user 表加冗余 `last_login_at` 字段

1. 每次登录要写 user 表（变更成本 × N 次登录 × 并发锁）
2. user 表应保持"慢变业务状态"，活跃度类派生数据不该入表（对照 ADR-0010：操作日志独立于业务表）
3. 当前 v1 内部系统（<10k 用户 / 分页 size=20），LATERAL JOIN 的聚合成本可忽略
4. 未来真出现性能瓶颈（分页首屏 P95 > 300ms），再考虑物化视图 / Redis 缓存，到那时走新 ADR 评估，不提前优化（对照 meta-0023 教训）

---

## 为什么不在 UserVo 扩字段（方案 A 被否）

1. `UserVo` 是 create/detail 返回契约，语义是"用户的当前状态"，lastLoginAt 是派生聚合数据，语义不同层
2. 所有 `UserVo` 返回场景都走聚合开销，即便 UI 不消费（例如 POST 创建后不需要 lastLoginAt）
3. orval 生成的前端 hook，`UserVo` 各处消费者都要处理 `lastLoginAt` nullable，增加契约面积

---

## 权衡 / 后果

**正面：**

- `UserVo` 契约零改动，所有现有消费方不受影响
- list 场景的聚合只发生一次，且批量
- `UserListVo` 是未来扩展活跃度字段（登录次数、最近登录 IP、首次登录时间）的天然容器

**负面：**

- orval 前端多一个 `UserListVo` 类型需要处理（members-page 明确消费此类型，其他页面用 UserVo，路径清晰）
- 前端如果要在 detail 页显示 lastLoginAt，要么再发一次 GET `/users/{id}/last-login`，要么接受 detail 不显示此字段（v1 选后者）

---

## 触发重新评估的条件

- 分页首屏 P95 > 300ms → 改物化视图或缓存
- 需要"活跃度筛选"（如 "30 天内未登录"）→ 考虑在 user 表加冗余 `last_login_at` + 对应索引

---

## 实施 checklist

- [x] 新增 `UserListVo` record
- [x] `UserService.list` 签名翻转为 `PageResult<UserListVo>`
- [x] `UserRepository` 新增 `findListPage(...)` 带 LATERAL JOIN
- [x] `UserController.list` 响应类型同步
- [x] 集成测试：无登录记录 → null；有成功登录 → 最新成功时间；有失败登录但无成功 → null
- [x] OpenapiSnapshotTest 通过
