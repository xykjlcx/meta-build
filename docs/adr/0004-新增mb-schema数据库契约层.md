# ADR-0004: 新增 mb-schema 数据库契约层（从 4 层 Maven 扩展到 6 层）

- **状态**: 已采纳
- **日期**: 2026-04-11
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: `meta-build规划_v1_最终对齐.md`（决策 2、9、10）、`docs/specs/backend/`（原 `docs/specs/backend-architecture.md` 已拆分）

> **注**：本 ADR 写于 backend-architecture.md 拆分前。文中所有对 `backend-architecture.md §x.y` 的引用，现统一指向 `docs/specs/backend/` 子目录的对应文件，导航见 [backend/README.md](../specs/backend/README.md)。
- **覆盖关系**: 本 ADR 在规划文档"4 层 Maven 结构"基础上**扩展为 6 层**，属于结构性细化，不是翻转

---

## 背景

规划文档决策 2 和决策 10 定义了 4 层 Maven 结构：

```
server/
├── mb-common/       # 零 Spring 工具
├── mb-framework/    # 基础设施（已按 ADR-0002 改为 mb-infra）
├── mb-system/       # 业务领域（已按 ADR-0002 改为 mb-platform）
└── mb-admin/        # 启动入口
```

在写 backend-architecture.md 的"jOOQ 代码生成"部分时，暴露了一个**语义错配**问题。

### 错配的发现过程

最初方案把 jOOQ 生成代码放在 `mb-infra/infra-jooq/src/main/jooq-generated/`，Java 包为 `com.metabuild.infra.jooq.generated`。洋哥的直觉是对的：

> "infra 不是基础设施层么，所有 platform 和 business 生成的表都放在 infra 吗？"

这个问题戳破了原方案的两个核心矛盾：

1. **语义错配**：`infra/jooq` 应该是技术工具类（`JooqHelper` / `SlowQueryListener` / `DataScopeVisitListener`），**不应该**包含业务表映射（`SysIamUserRecord` / `SysAuditLogRecord`）
2. **依赖方向错误**：如果 infra 层包含业务表映射，等于让基础设施反向知道了所有 platform / business 的业务实体——这违反了依赖方向约束（infra 不应知道上层业务）

### 更深层的洞察：jOOQ codegen 的 schema-level 特性

这是一个**技术硬约束**，不是设计选择：

- jOOQ codegen 扫描整个 database schema，生成 **一整套**类（`Tables.SYS_IAM_USER` / `SysIamUserRecord` / `Keys.FK_*` / `DefaultCatalog` / `DefaultSchema`）
- 外键引用、join 关系需要跨表类型引用（`User.BELONGS_TO_DEPT` 引用 `Dept.ID`）
- **不能按业务模块拆分生成**——所有表必须一次性生成到一个命名空间

所以不管有多少业务模块（iam / audit / order / billing），jOOQ 生成的代码都**只能集中在一个地方**。问题是：**放哪里才语义正确？**

### 备选方案的对比

| 方案 | 问题 |
|------|------|
| `mb-common/src/main/jooq-generated/` | mb-common 零 Spring 依赖约定，jOOQ 生成代码依赖 `org.jooq.*`，违反约定 |
| `mb-infra/infra-jooq/src/main/jooq-generated/` | 语义错配（基础设施层不应包含业务表映射） |
| `mb-platform/src/main/jooq-generated/` | mb-platform 是 parent pom，不能包含代码 |
| 每个业务模块各自生成一份 | jOOQ codegen 是 schema-level 的，技术上不可行 |
| `mb-admin/src/main/jooq-generated/` | platform 的 Repository 需要依赖 admin，但依赖方向是 admin → platform，反了 |
| **新增独立模块 `mb-schema/`** | ✅ **语义正确，依赖方向清晰** |

### 类比前端的 `@mb/api-sdk`

这个类比是关键洞察。前后端其实有一对**对称的契约模块**：

| 维度 | 后端 | 前端 |
|------|------|------|
| **契约模块** | `mb-schema` | `@mb/api-sdk` |
| **生成工具** | jOOQ Generator | OpenAPI Generator |
| **输入** | Flyway SQL + DB schema | Spring Controller + springdoc |
| **输出** | Java schema mapping（Tables / Records / Keys） | TypeScript client（API / Model） |
| **独立命名空间** | `com.metabuild.schema.*` | `@mb/api-sdk` |
| **入 git** | 是（`jooq-generated/` 入 git） | 否（CI 重新生成） |
| **本质** | 由工具生成的类型安全契约 | 由工具生成的类型安全契约 |

两者在各自生态里的定位完全对称。后端缺少一个"契约层"恰好是对称性上的缺失。

---

## 决策

**新增 `mb-schema` 独立 Maven 模块**作为**数据库契约层**。Flyway migration 和 jOOQ 生成代码都集中在这里。同时**新增 `mb-business`** 作为使用者扩展位（兼 M5 canonical reference）。

### 6 层 Maven 结构

```
server/
├── pom.xml                          # parent pom + BOM 版本管理
│
├── mb-common/                       # 零 Spring 工具
│   └── com.metabuild.common.*
│
├── mb-schema/                       # ★ 新增: 数据库契约层
│   ├── src/main/
│   │   ├── resources/db/migration/  # Flyway SQL（从 mb-admin 搬过来）
│   │   │   ├── V01_001__iam_user.sql          # ADR-0008 后命名已改为时间戳 V<yyyymmdd>_<nnn>__iam_user.sql
│   │   │   ├── V02_001__audit_log.sql         # ADR-0008 后改为 V<yyyymmdd>_<nnn>__audit_log.sql
│   │   │   └── ...
│   │   └── jooq-generated/          # jOOQ 生成代码（入 git）
│   │       └── com/metabuild/schema/
│   │           ├── tables/
│   │           │   ├── SysIamUser.java
│   │           │   ├── SysAuditLog.java
│   │           │   └── ...
│   │           ├── records/
│   │           │   ├── SysIamUserRecord.java
│   │           │   └── ...
│   │           ├── keys/
│   │           └── indexes/
│   └── pom.xml                      # 包含 codegen profile
│
├── mb-infra/                        # 基础设施能力（ADR-0002 命名）
│   ├── infra-security/
│   ├── infra-cache/
│   ├── infra-jooq/                  # ★ 只放技术工具（JooqHelper/SlowQueryListener/DataScopeVisitListener）
│   ├── infra-exception/
│   ├── infra-i18n/
│   ├── infra-async/
│   ├── infra-rate-limit/
│   ├── infra-websocket/             # v1 留空
│   ├── infra-observability/
│   └── infra-archunit/
│
├── mb-platform/                     # 平台业务能力（ADR-0002 命名）
│   ├── platform-iam/
│   ├── platform-audit/
│   ├── platform-file/
│   ├── platform-notification/
│   ├── platform-dict/
│   ├── platform-config/
│   ├── platform-job/
│   └── platform-monitor/
│
├── mb-business/                     # ★ 新增: 使用者扩展位 + M5 canonical reference
│   ├── (v1 M1-M4 阶段: 空目录 + 占位 pom)
│   └── (M5 阶段填入):
│       ├── business-notice/
│       ├── business-order/
│       └── business-approval/
│
└── mb-admin/                        # 启动入口
    └── com.metabuild.admin.*
```

### Java 包命名规范（6 个根命名空间）

| Maven 模块 | Java 根包 | 用途 |
|-----------|---------|------|
| `mb-common` | `com.metabuild.common.*` | 通用工具 |
| `mb-schema` | `com.metabuild.schema.*` | 数据库契约（jOOQ 生成） |
| `mb-infra` | `com.metabuild.infra.*` | 基础设施能力 |
| `mb-platform` | `com.metabuild.platform.*.*` | 平台业务（iam/audit/...） |
| `mb-business` | `com.metabuild.business.*.*` | 使用者业务扩展 |
| `mb-admin` | `com.metabuild.admin.*` | 启动入口 + 集成测试基类 |

### 依赖方向

```
mb-common    ← 零 mb-* 依赖（零 Spring / jOOQ / JJWT）
mb-schema    ← 零 mb-* 依赖（只依赖 org.jooq runtime）
mb-infra     ← 依赖 mb-common
mb-platform  ← 依赖 mb-common + mb-infra + mb-schema
mb-business  ← 依赖 mb-common + mb-infra + mb-schema + mb-platform::api
mb-admin     ← 依赖所有上层模块（启动聚合 + ArchUnit 测试基地）
```

**关键约束**：
- `mb-infra/infra-jooq` 只装工具类，**不依赖** `mb-schema`（工具类用 jOOQ 的泛型 API，不需要具体表类型）
- `mb-platform` 和 `mb-business` 的 Repository 层通过 `import com.metabuild.schema.tables.*` 拿到类型安全的 jOOQ 映射
- `mb-admin` 本来就需要依赖所有模块（Spring Boot 启动聚合），ArchUnit 测试放在这里顺便享受 classpath 聚合

### jOOQ codegen 流程

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

Profile 做的事：
1. 用 Testcontainers 启动一个临时的 PostgreSQL 容器（ephemeral）
2. 用 Flyway 跑 `mb-schema/src/main/resources/db/migration/*.sql` 建表
3. 用 jOOQ Generator 连到这个 PG，扫描 schema 生成代码
4. 输出到 `mb-schema/src/main/jooq-generated/com/metabuild/schema/`
5. 生成代码**入 git**（类型安全 + 编译期检查 + IDE 补全）

**CI 流程**：PR 里改了 migration → 开发者本地重新生成 → commit 生成代码 → CI 验证 `mvn compile` 通过 + 生成代码和 migration 一致。

### Flyway 运行时行为

- `mb-admin` 通过依赖 `mb-schema` 引入其 classpath 资源
- Spring Boot Flyway 默认从 classpath 的 `db/migration/` 读取
- `mb-schema/src/main/resources/db/migration/` 会被打包到 `mb-schema-{version}.jar` 的 `db/migration/` 下
- `mb-admin` 启动时 Flyway 自动发现并执行

**关键**：Flyway migration 和 jOOQ generated 在同一个模块里维护，语义内聚。改 migration → 跑 codegen → 生成代码 → commit 三件事一气呵成。

---

## 对 backend-architecture.md 的影响

| 章节 | 变更 |
|------|------|
| 1.2 4 层 Maven 模块 | **改为 6 层**（加 mb-schema + mb-business） |
| 1.3 包命名规范 | **4 行改 6 行**（加 schema / business 两行） |
| 1.4 server/ 完整目录树 | 加 mb-schema 和 mb-business 的完整目录 |
| 1.5 单向依赖硬约束 | 更新依赖关系描述 |
| 7.4 tenant_id 预留规范 | 示例 SQL 位置改到 mb-schema |
| 7.5 Flyway 脚本组织 | 脚本位置从 mb-admin 改到 mb-schema |
| 7.6 jOOQ 代码生成流程 | 改到 mb-schema，Java 包 `com.metabuild.schema.*` |
| 附录 A 借用清单 | nxboot 组件的 meta-build 落地位置更新（如 Flyway 初始化脚本） |
| 附录 B infra 模块实施清单 | 增加 mb-schema 的实施清单节 |
| 附录 D 术语表 | 新增 mb-schema、mb-business 条目 |

---

## 成本和风险

### 成本

| 项目 | 成本 |
|------|------|
| 多 2 个 Maven 模块 | 低（每个模块就一个 pom.xml） |
| mb-schema 的 codegen profile 配置 | 中（首次配置 1-2 小时） |
| mb-business 的占位 pom | 零（空目录） |
| 6 层 Maven 的认知负担 | 低-中（比 4 层略重，但每层语义清晰） |

### 风险

| 风险 | 严重度 | 缓解 |
|------|-------|------|
| codegen 需要启动临时 PG，CI 时间增加 | 低 | 只在 `-Pcodegen` profile 时启动，日常 `mvn verify` 不触发 |
| mb-schema 和 Flyway migration 的版本一致性 | 中 | 生成代码入 git，PR 时能 diff 看到是否忘记重新生成 |
| 6 层对使用者的认知负担 | 低 | backend-architecture.md 开头用 mermaid 图一次性讲清 6 层的职责 |

---

## 验证方式

- ✅ `server/mb-schema/pom.xml` 存在且继承 parent pom
- ✅ `mvn dependency:tree -pl mb-schema` 只显示 `org.jooq`、`org.postgresql`、`org.flywaydb` 等技术栈依赖，**不显示任何 `mb-*` 模块依赖**
- ✅ `mb-platform/platform-iam` 的 Repository 能正常 `import com.metabuild.schema.tables.SysIamUser`
- ✅ `mvn compile` 在 PR 阶段能发现"migration 改了但 jOOQ 代码没重新生成"的不一致
- ✅ 应用启动时 Flyway 正确读取 `mb-schema` 的 migration
- ✅ `mb-business` 目录存在（v1 阶段只有占位 pom）

---

## 与规划文档的关系

规划文档决策 2 和决策 10 定义的"4 层 Maven 结构"原文保留不动。本 ADR 是对这个结构的**细化扩展**——从 4 层扩展到 6 层，新增 `mb-schema`（数据库契约层）和 `mb-business`（使用者扩展位）。

未来规划文档重新对齐时可以把 6 层写进新版本。
