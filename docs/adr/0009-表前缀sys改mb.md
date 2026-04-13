# ADR-0009: 平台表前缀从 sys_ 切换到 mb_

- **状态**: 已采纳
- **日期**: 2026-04-12
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: [`docs/specs/backend/04-data-persistence.md §1 表/字段命名规范`](../specs/backend/04-data-persistence.md#1-表字段命名规范-m1m4)、[`03-platform-modules.md §3.0 基础 IAM 表 DDL`](../specs/backend/03-platform-modules.md)
- **类型**: 具体技术决策

> **注**：本 ADR 写于 `backend-architecture.md` 已拆分到 `docs/specs/backend/` 子目录结构之后，所有对 backend 文档的引用直接指向子目录文件。

---

## 背景

### 触发事件：M0 Review 阶段 4 个 Opus agent 交叉审查

M0 后端架构文档全面 Review 中，检查发现所有平台表使用 `sys_` 前缀（如 `sys_iam_user`、`sys_iam_role`、`sys_operation_log`）。

`sys_` 前缀直接继承自 nxboot——nxboot 把自己的基础设施表称为"系统表"（system tables），这是传统 Java 企业后台管理项目的惯例。

### 问题

meta-build 不是"某个系统的管理后台"，而是一个**独立产品/底座**。用 `sys_` 前缀存在两个问题：

1. **语义不准确**：`sys_` 暗示"系统级/内部基础设施"，但 `mb_iam_user` 是业务核心表，不是数据库系统表。使用 `sys_` 会和 PostgreSQL 自身的 `pg_*` / `information_schema` 等真正的系统表概念混淆
2. **品牌辨识度**：meta-build 的 Maven 模块用 `mb-` 前缀、TypeScript 包用 `@mb/` 前缀，表名用 `sys_` 是唯一不一致的命名空间

---

## 决策

**平台表前缀统一从 `sys_` 切换到 `mb_`**。业务表前缀 `biz_` 不变。

### 命名规则

| 表类型 | 前缀 | 示例 |
|--------|------|------|
| 平台表（`mb-platform` 模块） | `mb_<域>_<实体>` | `mb_iam_user`、`mb_iam_role`、`mb_operation_log` |
| 业务表（`mb-business` 模块） | `biz_<域>_<实体>` | `biz_order_main`、`biz_order_item` |
| 关联表 | 跟随主表前缀 | `mb_iam_user_role`、`mb_iam_role_menu` |

### 为什么不全用 `mb_`

`biz_` 保留是因为**问题本身有内在差异**（ADR-0008 次级元原则"一致性 > 局部优化"的合理例外）：

- 平台表由 meta-build 底座维护，使用者不应修改——`mb_` 前缀传达"这是底座的表"
- 业务表由使用者自建——`biz_` 前缀传达"这是你的表"
- 两者的生命周期、维护者、变更频率完全不同，前缀区分有实际价值

---

## 连带影响

### 文档修订（本次 Review 已全部完成）

- `04-data-persistence.md`：§1 命名规范表、所有 DDL 示例
- `03-platform-modules.md`：§3.0 基础 IAM 表 DDL、§3.1-3.3 双树 DDL
- `05-security.md`：§7 方案 E 代码骨架中的表名引用、§8 密码安全 DDL
- `06-api-and-contract.md`：§13 AppPermission 示例
- `08-archunit-rules.md`：示例代码中的表名
- `09-config-management.md`：配置示例中的表名
- `appendix.md`：术语表中的表名示例
- `README.md`：MUST #3 等引用

### 代码影响（M1 阶段）

- Flyway migration SQL 文件中的 `CREATE TABLE` 语句使用 `mb_` 前缀
- jOOQ codegen 生成的类名自动跟随表名（`MbIamUser` 而非 `SysIamUser`）
- 无需额外配置

---

## 成本与风险

| 维度 | 评估 |
|------|------|
| 文档替换成本 | 低（全局搜索替换，本次已完成） |
| 代码影响 | 无（M0 阶段无代码） |
| 风险 | 极低（纯命名变更，无行为变化） |
| 放弃的能力 | 无（`sys_` 前缀没有功能意义） |

---

## 验证方式

- ✅ 全仓 `sys_` 搜索零残留（已通过 verify-docs.sh 92/92 全绿验证）
- ⏳ M1 Flyway migration 文件使用 `mb_` 前缀
