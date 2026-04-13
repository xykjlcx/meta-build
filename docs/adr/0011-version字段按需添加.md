# ADR-0011: version 字段按需添加（不再强制所有表）

- **状态**: 已采纳
- **日期**: 2026-04-12
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: [`docs/specs/backend/04-data-persistence.md §1 表/字段命名规范`](../specs/backend/04-data-persistence.md#1-表字段命名规范-m1m4)、[`§8.5 乐观锁`](../specs/backend/04-data-persistence.md)
- **类型**: 具体技术决策（硬约束放松）

> **注**：本 ADR 写于 `backend-architecture.md` 已拆分到 `docs/specs/backend/` 子目录结构之后，所有对 backend 文档的引用直接指向子目录文件。

---

## 背景

### 原规范：所有表必须有 version 字段

M0 初始设计中，MUST #3 要求：

> 所有表必须有 `tenant_id / created_by / created_at / updated_by / updated_at / version` 字段。

即 `version INT NOT NULL DEFAULT 0` 是**强制字段**，每张表都有。

### M0 Review 中的质疑

Review 讨论中发现这条规则过于粗暴：

1. **只追加不更新的表不需要乐观锁**：`mb_operation_log`（操作日志）、`mb_iam_password_history`（密码历史）等表只做 INSERT，从不 UPDATE——version 字段永远是 0，浪费存储且误导读者
2. **并非所有可更新的表都有并发更新场景**：`mb_dict`（字典配置）由管理员低频更新，并发冲突概率极低，加 version 是过度防御
3. **jOOQ 原生支持按需乐观锁**：`withExecuteWithOptimisticLockingExcludeUnversioned(true)` 让无 version 字段的表自动跳过乐观锁检查，无需代码适配

---

## 决策

**`version` 字段从强制改为按需添加**，仅在有并发更新风险的表上使用。

### 判断标准

| 场景 | 是否加 version | 示例 |
|------|---------------|------|
| 多用户可能同时更新同一行 | **加** | `biz_order_main`（订单状态变更）、`mb_iam_user`（管理员修改用户信息） |
| 涉及金额/数量等关键数值 | **加** | 余额表、库存表 |
| 只追加不更新 | **不加** | `mb_operation_log`、`mb_iam_password_history` |
| 低频管理配置 | **一般不加**，按需评估 | `mb_dict`、`mb_config` |

### MUST #3 修订后

> 所有表必须有 `tenant_id / created_by / created_at / updated_by / updated_at` 字段；`version` 字段**按需添加**（仅需要乐观锁的表）。

### jOOQ 配置保障

```java
new Settings()
    .withExecuteWithOptimisticLocking(true)
    .withExecuteWithOptimisticLockingExcludeUnversioned(true)  // 无 version 字段的表不触发
```

- 有 version 字段的表：`store(record)` 时自动 `WHERE version = ?` + `SET version = version + 1`
- 无 version 字段的表：正常执行，不触发乐观锁检查
- **零代码适配**：业务层不需要 `if (hasVersion)` 分支

---

## 连带影响

### 文档修订（本次 Review 已完成）

- `04-data-persistence.md`：§1 命名规范中 version 字段说明改为"按需添加"；§8.5 乐观锁章节补充 `ExcludeUnversioned` 配置
- `README.md`：MUST #3 措辞从"所有表必须有 version"改为"version 按需添加"

### 对已有 DDL 的影响

- `mb_iam_user`：**保留** version（管理员并发修改用户信息）
- `mb_operation_log`：**去除** version（只追加）
- `mb_iam_password_history`：**不加** version（只追加）
- `biz_order_main`（M5 canonical reference）：**保留** version（订单并发更新）
- 新建表时由开发者按上述判断标准决定

---

## 成本与风险

| 维度 | 评估 |
|------|------|
| 决策成本 | 极低（每张表建表时多想 3 秒：这张表有并发更新吗？） |
| 遗漏风险 | 低——漏加 version 最多导致 last-write-wins（无乐观锁），不会崩溃；发现后加字段 + 写 Flyway migration 即可补救 |
| 过度防御成本 | 避免了（不再给只追加的表白加 version） |

---

## 验证方式

- ✅ `04-data-persistence.md` §1 中 version 描述为"按需添加"
- ✅ `README.md` MUST #3 措辞已更新
- ✅ `mb_operation_log` DDL 无 version 字段
- ⏳ M1 建表时按判断标准决定 version 字段
