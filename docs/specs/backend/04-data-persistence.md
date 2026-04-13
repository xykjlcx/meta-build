# 04 - 数据访问与持久化

> **关注点**：表/字段命名、Snowflake 主键、软删除/审计自动化、tenant_id 预留、Flyway 脚本组织、jOOQ codegen 流程、jOOQ 不入 Service、事务边界、HikariCP、缓存策略、缓存 key 级失效、时区规范。
>
> **本文件吸收原 backend-architecture.md §7（数据层）+ §5.1（jOOQ 不入 Service）+ §5.4（缓存 key 级失效）+ §13（时区规范）**。三个跨章节主题归位到数据层这个真正的归属。

## 1. 表/字段命名规范 [M1+M4]

#### 表名

- **命名方式**: snake_case，模块前缀 + 领域 + 实体
- **平台表**: `mb_<域>_<实体>`（例: `mb_iam_user`, `mb_iam_role`, `mb_operation_log`）
- **业务表**: `biz_<域>_<实体>`（例: `biz_order_main`, `biz_order_item`，用于 M5 canonical reference）
- **关联表**: `mb_iam_user_role`, `mb_iam_role_menu`

#### 字段名

- 全部 snake_case
- 主键: `id BIGINT NOT NULL`（Snowflake 生成）
- 外键: `<引用实体>_id BIGINT`（例: `user_id`, `role_id`）
- 审计字段（所有表必须有）:
  - `created_by BIGINT NOT NULL`
  - `created_at TIMESTAMP WITH TIME ZONE NOT NULL`
  - `updated_by BIGINT NOT NULL`
  - `updated_at TIMESTAMP WITH TIME ZONE NOT NULL`
- 多租户: `tenant_id BIGINT NOT NULL DEFAULT 0`（ADR-007）
- 乐观锁: `version INT NOT NULL DEFAULT 0`（**按需添加**，仅在需要乐观锁的表上，如订单、余额等并发更新场景；只追加不更新的表（如 `mb_operation_log`）不加此字段；jOOQ Settings 中 `withExecuteWithOptimisticLockingExcludeUnversioned(true)` 确保无 version 字段的表自动跳过乐观锁）
- 数据权限归属: `owner_dept_id BIGINT NOT NULL`（**需要数据权限的表必须添加**，RecordListener INSERT 时自动从 `CurrentUser.deptId()` 填充；创建后不可变，不随人员调岗更新；详见 [05-security.md §7 方案 E](./05-security.md)）

## 2. 主键策略 Snowflake [M1]

借用 nxboot 的 `SnowflakeIdGenerator`，所有 平台/业务表 的 id 用雪花算法，不用数据库 sequence。

```java
// mb-common/src/main/java/com/metabuild/common/id/SnowflakeIdGenerator.java
// 直接从 nxboot-common 借用，41bit 时间戳 + 10bit workerId + 12bit sequence
public class SnowflakeIdGenerator {
    public SnowflakeIdGenerator(long workerId, long datacenterId) { ... }
    public synchronized long nextId() { ... }
}
```

```java
// mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/config/MbIdProperties.java
@ConfigurationProperties(prefix = "mb.id")
@Validated
public record MbIdProperties(
    @Min(0) @Max(31) long worker,
    @Min(0) @Max(31) long datacenter
) {}
```

```java
// mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/IdGeneratorConfig.java
@Configuration
public class IdGeneratorConfig {

    @Bean
    public SnowflakeIdGenerator snowflakeIdGenerator(MbIdProperties idProperties) {
        return new SnowflakeIdGenerator(idProperties.worker(), idProperties.datacenter());
    }
}
```

> `mb.id.worker` / `mb.id.datacenter` 默认值在 `application.yml` 中声明（`mb.id.worker: 1` / `mb.id.datacenter: 1`），不在 record 构造器中硬编码（遵循 §9.1.2 配置管理原则）。

## 3. 审计字段自动化 [M1+M4]

- **软删除**：meta-build 不实现软删除，所有 DELETE 为真删除（详见 §8.8）
- **审计字段自动填充**：
  - `created_at` / `updated_at`：数据库 `DEFAULT CURRENT_TIMESTAMP`（created_at）+ jOOQ `Settings.updateRecordTimestamp=true`（updated_at 单条路径）+ `JooqHelper.batch*/conditional*` 内部填充（批量路径）
  - `created_by` / `updated_by`：单条走 `AuditFieldsRecordListener`（INSERT/UPDATE 事件读 `CurrentUser.userIdOrSystem()` 填充）；批量走 `JooqHelper` 内部读 `CurrentUser`
  - `version`：jOOQ `Settings.executeWithOptimisticLocking + updateRecordVersion`（§8.5）
  - 详见 §8.5-8.7 三节

## 4. tenant_id 预留 [M1]

#### 决策

- **所有表从 V1 起预留** `tenant_id BIGINT NOT NULL DEFAULT 0`
- **v1 不实现多租户路由**，所有数据 `tenant_id = 0`
- **v1.5+ 多租户激活时**：只需在 jOOQ VisitListener 注入 `tenant_id` 条件，不需要 schema migration
- **索引约定**: 所有业务复合索引的**第一列必须是 `tenant_id`**（为将来 partition 做准备）

#### Flyway 模板

完整的 `mb_iam_user` DDL 见 [05-security.md §8.7.1](./05-security.md)（含密码安全字段 `password_updated_at`、`must_change_password` 等），此处只展示字段命名规范示例：

```sql
-- mb-schema/src/main/resources/db/migration/V20260601_001__iam_user.sql
-- 完整 DDL 见 05-security.md §8.7.1，以下为字段命名规范速览
CREATE TABLE mb_iam_user (
    id            BIGINT       PRIMARY KEY,            -- Snowflake 生成
    tenant_id     BIGINT       NOT NULL DEFAULT 0,     -- 多租户预留
    username      VARCHAR(64)  NOT NULL,               -- snake_case 字段名
    password_hash VARCHAR(128) NOT NULL,               -- bcrypt $2a$12$... 共 60 字节
    email         VARCHAR(255),                        -- 与 05-security.md §8.7.1 一致
    dept_id       BIGINT,                              -- 外键命名: <引用实体>_id
    status        SMALLINT     NOT NULL DEFAULT 1,     -- 枚举用 SMALLINT
    -- ... 完整字段列表见 05-security.md §8.7.1 ...
    created_by    BIGINT       NOT NULL,               -- 审计字段 NOT NULL
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    BIGINT       NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Flyway 脚本组织 [M1+M4]

（ADR-0004：位置在 mb-schema）

#### 位置

**Flyway migration 脚本全部放在 `mb-schema/src/main/resources/db/migration/`**（ADR-0004）。不再放在 `mb-admin`，因为：
- Flyway migration 和 jOOQ 生成代码是"数据库契约的两面"，必须同模块
- jOOQ codegen 需要读 migration 作为输入
- `mb-admin` 通过依赖 `mb-schema` 自动继承 classpath 里的 `db/migration/`，运行时 Flyway 自动发现

#### 命名规范（ADR-0008）

格式：`V<yyyymmdd>_<nnn>__<module>_<table>.sql`

| 字段 | 规则 | 示例 |
|---|---|---|
| `<yyyymmdd>` | 该 migration **首次加入项目的日期**（8 位），`date +%Y%m%d` 生成 | `20260601` |
| `<nnn>` | 同日序号，001-999 零填充 | `001` / `042` |
| `<module>` | 模块归属前缀（见下表） | `iam` / `business_order` |
| `<table>` | 表名或变更描述（snake_case） | `user` / `order_main` / `add_user_phone_idx` |

**module 前缀约定**：

| 模块类型 | 前缀规则 | 示例 |
|---|---|---|
| **platform 模块** | 模块名简写（无 `platform_` 前缀，platform 是 M0 冻结的 8 个，简写不歧义）| `iam_user` / `oplog_operation_log` / `file_metadata` / `notification` / `dict` / `config` / `job` / `monitor` |
| **business 模块** | `business_<模块名>_<表>` | `business_notice` / `business_order_main` / `business_order_item` / `business_approval_flow` |
| **初始化数据** | `init_<类型>` | `init_data` / `init_permission` |
| **基础设施辅助表** | `<用途>` | `shedlock`（由 `platform-job` 创建的分布式锁表）|

**为什么选时间戳**（见 [ADR-0008](../../adr/0008-flyway-migration命名用时间戳.md)）：

- **Flyway 官方对多人团队的推荐**：时间戳版本号是 Flyway 官方文档 + Hasura / Quarkus 等开源主流项目的通用做法
- **ADR-0007 元方法论命中**：V01-V99 数字分段是 nxboot / MyBatis-Plus 生态老习惯，**不是 Flyway 原生范式**
- **AI 友好**：创建 migration 时只需 `date +%Y%m%d` + 自增 001，零心智负担、零"分配表"查询
- **冲突天然更低**：同日同序号才冲突，跨日无冲突；PR merge 时后来者 bump 序号即可
- **模块归属靠文件名前缀不靠版本号**：`ls | grep '__business_order_'` 等价于"列出该模块所有 migration"

**示例目录树**：

```
mb-schema/src/main/resources/db/migration/
├── V20260601_001__iam_user.sql              # platform-iam
├── V20260601_002__iam_role.sql
├── V20260601_003__iam_menu.sql
├── V20260601_004__iam_dept.sql
├── V20260601_005__iam_user_role.sql
├── V20260601_006__iam_role_menu.sql
├── V20260602_001__oplog_operation_log.sql   # platform-oplog
├── V20260602_002__file_metadata.sql         # platform-file
├── V20260603_001__notification.sql          # platform-notification
├── V20260603_002__dict.sql                  # platform-dict
├── V20260603_003__config.sql                # platform-config
├── V20260603_004__job.sql                   # platform-job
├── V20260603_005__shedlock.sql              # ShedLock 分布式锁表
├── V20260603_006__monitor.sql               # platform-monitor
├── V20260605_001__init_data.sql             # 初始化数据（超管/默认角色/基础菜单）
│
│   # ───── M5 canonical reference ─────
├── V20260701_001__business_notice.sql       # business-notice
├── V20260702_001__business_order_main.sql   # business-order（主从表示例）
├── V20260702_002__business_order_item.sql
└── V20260703_001__business_approval_flow.sql  # business-approval
```

**Flyway version 解析的合法性**：

Flyway 把 `_` 和 `.` 都视为版本号分隔符：

- `V20260601_001` → version = `20260601.1`
- `V20260601_002` → version = `20260601.2`
- `V20260602_001` → version = `20260602.1`
- 排序：`20260601.1 < 20260601.2 < 20260602.1` ✓（natural sort 单调递增）

**模块归属查询**（不依赖版本号）：

```bash
# 查 iam 模块的所有 migration
ls mb-schema/src/main/resources/db/migration/ | grep '__iam_'

# 查 business-order 模块的所有 migration
ls mb-schema/src/main/resources/db/migration/ | grep '__business_order_'

# 查某一天新增的所有 migration
ls mb-schema/src/main/resources/db/migration/ | grep '^V20260702_'
```

#### 脚本规则

- 每个脚本只做一件事（一张表或一个变更）
- **禁止修改已发布的 migration 文件**（只能加新的 V 文件；见 5.5 checksum 机制）
- 所有表必须有 `tenant_id / created_by / created_at / updated_by / updated_at` 字段；`version` 按需添加（仅并发更新场景，见 §1）
- **大表变更规则**（见 5.6）
- **冲突管理**：
  - 创建 migration 前先 `git pull` 最新代码
  - 同日多人冲突（两人都选 `V20260611_001`）→ PR review 时后 merge 的一方 bump 序号到 `002` / `003`
  - 本地已跑新时间戳，pull 到更早时间戳 → Flyway 严格模式会报错，开发者 bump 新文件为下一个可用序号
  - **禁止**在生产启用 `flyway.outOfOrder=true`（保持严格顺序）

### 5.5 Flyway checksum 机制和"不能改已提交 migration"

Flyway 在 `flyway_schema_history` 表里记录每个已执行 migration 文件的 **checksum**（SHA 哈希）。启动时校验：
- 如果已执行 migration 的 checksum 和当前文件**不一致** → Flyway 启动失败
- 这是一个**安全机制**：强制"已经执行过的 migration 不能再改"

**正确的做法**：如果 V3 有 bug，不要改 V3 文件，写一个 V6（反向修正）。

**本地开发期的例外**：开发过程中如果需要修改未发布的 migration，可以用 `mvn flyway:repair` 重写 checksum。**仅限本地开发使用**。

### 5.6 大表变更的三步法

PostgreSQL 11+ 的 `ALTER TABLE ADD COLUMN DEFAULT` 是 metadata-only 操作（瞬间完成），但**`NOT NULL DEFAULT`** 在 11 以前会全表重写，锁表几分钟。

**大表加列的正确方法**：分 3 个 V 文件
```sql
-- V20260701_001__iam_add_user_phone_nullable.sql
ALTER TABLE mb_iam_user ADD COLUMN phone VARCHAR(32);

-- V20260701_002__iam_backfill_user_phone.sql
UPDATE mb_iam_user SET phone = '' WHERE phone IS NULL;

-- V20260701_003__iam_make_user_phone_not_null.sql
ALTER TABLE mb_iam_user ALTER COLUMN phone SET NOT NULL;
ALTER TABLE mb_iam_user ALTER COLUMN phone SET DEFAULT '';
```

**大表加索引**：使用 `CREATE INDEX CONCURRENTLY`（PostgreSQL 特性，不锁表但不能在事务里运行）：
```sql
-- V20260701_004__iam_add_user_phone_idx.sql
-- NOTE: 此脚本必须在 flyway.mixed=true 下运行
CREATE INDEX CONCURRENTLY idx_mb_iam_user_tenant_phone
    ON mb_iam_user (tenant_id, phone);
```

<!-- verify: cd server && test -d mb-schema/src/main/resources/db/migration && ls mb-schema/src/main/resources/db/migration/ | grep -E '^V[0-9]{8}_[0-9]{3}__' -->

## 6. jOOQ 代码生成流程 [M1+M4]

（ADR-0004：codegen 在 mb-schema）

#### 位置

**jOOQ 生成代码放在 `mb-schema/src/main/jooq-generated/`**（ADR-0004），Java 根包 `com.metabuild.schema.*`。

#### codegen 流程

```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```

Profile 做的事：
1. 用 Testcontainers 启动临时 PostgreSQL 容器
2. 用 Flyway 跑 `mb-schema/src/main/resources/db/migration/*.sql` 建表
3. 用 jOOQ Generator 连到这个 PG，扫描 schema 生成代码
4. 输出到 `mb-schema/src/main/jooq-generated/com/metabuild/schema/`
5. **生成代码入 git**（类型安全 + 编译期检查 + IDE 补全）

#### 生成物的包结构

```
mb-schema/src/main/jooq-generated/
└── com/metabuild/schema/
    ├── DefaultCatalog.java
    ├── DefaultSchema.java
    ├── tables/
    │   ├── MbIamUser.java
    │   ├── MbOperationLog.java
    │   └── ...
    ├── records/
    │   ├── MbIamUserRecord.java
    │   └── ...
    ├── keys/
    │   └── Keys.java
    └── indexes/
        └── Indexes.java
```

#### CI 流程

- `mvn verify` 时：检查生成代码与 migration 一致
- 不一致 → fail，提示开发者"重新运行 `mvn -Pcodegen generate-sources -pl mb-schema`"
- 使用者加新 migration → 本地重新生成 → commit 生成代码 → PR 合并

<!-- verify: cd server && test -d mb-schema/src/main/jooq-generated/com/metabuild/schema && find mb-schema/src/main/jooq-generated -name "*.java" | head -5 -->

## 7. jOOQ 不入 Service 层 [M1+M4]

#### 问题

nxboot 50 个文件里有 `import org.jooq.*`，包括 `RoleService` 直接注入 `DSLContext` 写 SQL。业务逻辑和数据访问混杂，Service 无法单元测试，SQL 变更牵一发动全身。

#### 修复

- Service 层（`domain` 包）**禁止** `import org.jooq.*`
- jOOQ 只允许出现在 Repository 类中（`domain/<aggregate>/` 包下的 `*Repository` 类）
- SQL 操作必须通过 Repository 暴露的方法间接调用

#### ArchUnit 规则

```java
// mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/rules/JooqIsolationRule.java
public class JooqIsolationRule {

    public static final ArchRule DOMAIN_MUST_NOT_USE_JOOQ = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("org.jooq..")
        .as("Domain (Service) 层禁止直接依赖 jOOQ，SQL 操作必须走 Repository");

    // 已被 N3 精化规则替代（见 08-archunit-rules.md §6：DSLCONTEXT_ONLY_IN_REPOSITORY + SERVICE_JOOQ_WHITELIST）
    // @Deprecated
    // public static final ArchRule JOOQ_ONLY_IN_INFRASTRUCTURE = classes()
    //     .that().dependOnClassesThat().resideInAPackage("org.jooq..")
    //     .should().resideInAnyPackage(
    //         "..infrastructure..",
    //         "com.metabuild.infra.jooq..",
    //         "..admin..test.."
    //     );
    // 现行规则见 08-archunit-rules.md §6 N3 精化规则
}
```

<!-- verify: cd server && mvn test -Dtest=JooqIsolationTest -pl mb-admin -->

## 8. 事务边界规范 [M4]

#### 决策

- **`@Transactional` 只放在 Service 层**（`domain` 包）
- **Controller 和 Repository 禁用 `@Transactional`**
- **默认 propagation**: `REQUIRED`
- **只读查询**: 必须用 `@Transactional(readOnly = true)`（jOOQ 会走只读连接）
- **长事务（超过 3 秒）**: 必须显式声明 `timeout`

#### 代码模板

```java
@Service
public class UserService implements UserApi {

    @Transactional(readOnly = true)
    public UserView findById(Long id) {
        return userRepository.findById(id)
            .map(UserView::from)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound"));
    }

    @Transactional
    public User create(UserCreateCommand cmd) {
        // 默认 propagation = REQUIRED
        return userRepository.save(new User(cmd));
    }

    @Transactional(timeout = 5)
    public void batchSync(List<User> users) {
        // 显式超时
    }
}
```

#### ArchUnit 规则

```java
public static final ArchRule TRANSACTIONAL_ONLY_IN_SERVICE = classes()
    .that().areAnnotatedWith(Transactional.class)
    .or().containAnyMethodsThat().areAnnotatedWith(Transactional.class)
    .should().resideInAPackage("..domain..")
    .as("@Transactional 只允许在 Service/Domain 层使用");
```

<!-- verify: cd server && grep -rn "@Transactional" --include="*.java" mb-platform mb-business | grep -vE "domain|test|import" | wc -l -->

#### 高级传播场景 [P1]

##### REQUIRES_NEW —— 独立事务

操作日志写入是典型的"独立事务"场景——即使业务事务回滚，操作记录也要保留。

```java
@Service
@RequiredArgsConstructor
public class OperationLogWriter {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(OperationLog log) {
        // 独立事务，不受调用者事务影响
        operationLogRepository.insert(log);
    }
}
```

**使用场景**：
- 操作日志（业务回滚但操作记录要保留）
- 异常时的错误日志写入
- 计数器 / 统计类更新（不应因为业务失败而回滚）

**警告**：`REQUIRES_NEW` 会真正打开新的物理连接，过度使用会耗尽连接池。

##### 回滚规则

Spring 默认只对 `RuntimeException` 和 `Error` 自动回滚，`checked Exception` 不自动回滚：

```java
// ❌ 错误：抛 IOException 不会回滚
@Transactional
public void process() throws IOException {
    repository.save(data);
    throw new IOException("disk full");  // 事务已提交！
}

// ✅ 正确：显式声明回滚规则
@Transactional(rollbackFor = Exception.class)
public void process() throws IOException { ... }

// ✅ 或者：让 MetaBuildException 继承 RuntimeException（推荐）
// meta-build 的业务异常基类继承 RuntimeException，自动回滚
```

**meta-build 约定**：
- 所有业务异常（`MetaBuildException` 及子类）继承 `RuntimeException`，自动回滚
- Service 方法**不抛出 checked Exception**；如必须处理（如 `IOException`），在方法内转换为 `SystemException`

##### 嵌套事务（NESTED）

PostgreSQL 支持 savepoint，但 v1 **不使用** `NESTED` 传播。理由：增加复杂度，且常见需求都能通过 `REQUIRES_NEW` 或业务拆分解决。

##### 分布式事务

v1 **不做**分布式事务。单体应用下所有事务都是本地事务。如果将来拆微服务再评估（Seata / TCC 等）。

### 8.5 乐观锁：jOOQ 原生 Settings [M1+M4]

> **决策**：乐观锁走 jOOQ 原生 `executeWithOptimisticLocking + updateRecordVersion` 全局开关（Settings 配置在 `DSLContextConfig`），业务代码零样板。详见 ADR-0007 元方法论（本次是第三次应用）。

#### 8.5.1 jOOQ 原生乐观锁机制

jOOQ 在 Configuration 层提供两种乐观锁模式：

| 模式 | 条件 | 执行方式 |
|---|---|---|
| **优化模式** | 有 `version` 字段（通过 codegen 配置识别）| UPDATE 的 WHERE 子句自动加 `version = <fetched>`，一条 SQL 完成 |
| 标准模式 | 无 version 字段 | UPDATE 前先 `SELECT ... FOR UPDATE` 对比所有字段 |

**meta-build 对有 `version` 字段的表使用优化模式**（`version` 按需添加，仅并发更新场景；无 `version` 字段的表通过 `ExcludeUnversioned` 配置自动跳过乐观锁，见 §1）。

#### 8.5.2 Settings 配置（`DSLContextConfig`）

```java
// infra-jooq/src/main/java/com/metabuild/infra/jooq/DSLContextConfig.java
@Configuration
public class DSLContextConfig {

    @Bean
    public DSLContext dslContext(
        DataSource dataSource,
        DataScopeVisitListener dataScopeVisitListener,
        AuditFieldsRecordListener auditFieldsRecordListener,
        SlowQueryListener slowQueryListener
    ) {
        Settings settings = new Settings()
            // 乐观锁
            .withExecuteWithOptimisticLocking(true)
            .withExecuteWithOptimisticLockingExcludeUnversioned(true)  // 无 version 字段的表不触发
            .withUpdateRecordVersion(true)                              // version 自动 +1
            // 审计字段
            .withUpdateRecordTimestamp(true);                           // updated_at 自动更新

        Configuration cfg = new DefaultConfiguration()
            .set(SQLDialect.POSTGRES)
            .set(new DataSourceConnectionProvider(dataSource))
            .set(settings)
            // Listener 链
            .set(new DefaultRecordListenerProvider(auditFieldsRecordListener))  // RecordListener 填 created_by/updated_by
            .set(new DefaultVisitListenerProvider(dataScopeVisitListener))       // VisitListener 方案 E 数据权限
            .set(new DefaultExecuteListenerProvider(slowQueryListener));         // ExecuteListener 慢查询日志

        return DSL.using(cfg);
    }
}
```

#### 8.5.3 jOOQ codegen 配置（`mb-schema/pom.xml`）

```xml
<database>
    <name>org.jooq.meta.postgres.PostgresDatabase</name>
    <inputSchema>public</inputSchema>
    <!-- 约定:所有表的 version 字段名都叫 "version",updated_at 字段名都叫 "updated_at" -->
    <recordVersionFields>version</recordVersionFields>
    <recordTimestampFields>updated_at</recordTimestampFields>
</database>
```

一次性配置，所有业务表的 `version` / `updated_at` 自动被 jOOQ 识别，零表级配置。

#### 8.5.4 业务层使用（单条路径）

```java
// UserService.updateEmail（N3 修正：Service 通过 Repository 访问，不直接持有 DSLContext）
@Transactional
public UserView updateEmail(Long userId, UserUpdateEmailCommand cmd) {
    MbIamUserRecord record = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("iam.user.notFound"));
    record.setEmail(cmd.newEmail());
    MbIamUserRecord saved = userRepository.save(record);  // Repository 内部调 record.store()
    return UserView.from(saved);
    // Repository.save() 内部执行:
    //   UPDATE mb_iam_user
    //   SET email=?, version=version+1, updated_at=CURRENT_TIMESTAMP, updated_by=?
    //   WHERE id=? AND version=?
    //
    // 冲突时抛 org.jooq.exception.DataChangedException
}
```

**关键：Service 不直接调 `record.store()` / `record.insert()`**。通过 `userRepository.save(record)` 调用，Repository 内部走 M4.2 原生路径。这是为了遵守 §4.2 Service 层禁止 import `DSLContext` 的职责划分（N3）。

**关键特征**：
- 业务代码零样板（不写 WHERE version、不写 SET version + 1、不写 updated_at、不写 updated_by）
- 全局 Settings 开启 → 强制覆盖所有 UpdatableRecord 操作（不是 opt-in）
- 冲突异常自动抛出，`GlobalExceptionHandler` 映射到 HTTP 409

#### 8.5.5 `DataChangedException` 异常映射

在 `infra-exception/GlobalExceptionHandler` 新增：

```java
@ExceptionHandler(DataChangedException.class)
public ProblemDetail handleDataChanged(DataChangedException e, Locale locale) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(
        HttpStatus.CONFLICT,
        messageSource.getMessage("common.optimisticLock", null, locale)
    );
    pd.setType(URI.create("https://errors.metabuild.com/common/optimistic-lock"));
    pd.setProperty("errorCode", "common.optimisticLock");
    return pd;
}
```

i18n key `common.optimisticLock` 在 `mb-common/src/main/resources/messages/common_zh_CN.properties`：

```properties
common.optimisticLock=数据已被他人修改,请刷新后重试
```

### 8.6 审计字段自动填充：RecordListener [M4]

> **决策**：`created_by / updated_by` 单条路径通过 jOOQ `RecordListener` 的 `insertStart` / `updateStart` 钩子读 `CurrentUser.userIdOrSystem()` 自动填充；批量路径由 `JooqHelper` 内部处理（§8.7）。

#### 8.6.1 `CurrentUser.userIdOrSystem()` 扩展

在 `mb-common.security.CurrentUser` 接口新增常量 + 默认方法：

```java
public interface CurrentUser {
    Long SYSTEM_USER_ID = 0L;

    boolean isAuthenticated();
    Long userId();
    // ... 其他原有方法

    /**
     * 当前用户 ID,无认证上下文时返回 SYSTEM_USER_ID (0).
     * 用于 @Scheduled / @Async 或其他无 HTTP 请求上下文的场景,
     * 使审计字段填充不依赖是否有当前用户.
     */
    default Long userIdOrSystem() {
        return isAuthenticated() ? userId() : SYSTEM_USER_ID;
    }
}
```

Snowflake 不会产生 ID = 0，所以 `0` 可以作为"系统动作"的保留 ID。审计日志里 `created_by = 0` 就代表"定时任务 / 启动初始化 / 数据迁移"这类系统动作。

#### 8.6.2 `AuditFieldsRecordListener`

```java
// infra-jooq/src/main/java/com/metabuild/infra/jooq/AuditFieldsRecordListener.java
@Component
@RequiredArgsConstructor
public class AuditFieldsRecordListener implements RecordListener {

    private final CurrentUser currentUser;

    @Override
    public void insertStart(RecordContext ctx) {
        Record record = ctx.record();
        Long currentUserId = currentUser.userIdOrSystem();
        trySetField(record, "created_by", currentUserId);
        trySetField(record, "updated_by", currentUserId);
        // created_at / updated_at 不在这里填:
        //   - created_at 由 DB DEFAULT CURRENT_TIMESTAMP 填
        //   - updated_at 由 Settings.updateRecordTimestamp 填
        //   - version 由 DB DEFAULT 0 初始化
    }

    @Override
    public void updateStart(RecordContext ctx) {
        Record record = ctx.record();
        Long currentUserId = currentUser.userIdOrSystem();
        trySetField(record, "updated_by", currentUserId);
        // updated_at / version 由 Settings 处理,created_by 不改
    }

    /**
     * 反射式字段设置:如果 record 有指定字段就 set,否则静默跳过.
     * 允许某些表没有全部审计字段(比如 mb_operation_log 本身不需要 updated_by).
     */
    private void trySetField(Record record, String fieldName, Object value) {
        Field<?> field = record.field(fieldName);
        if (field != null) {
            @SuppressWarnings({"unchecked", "rawtypes"})
            Field<Object> typed = (Field<Object>) field;
            record.set(typed, value);
        }
    }
}
```

#### 8.6.3 `owner_dept_id` 自动填充

**owner_dept_id 自动填充**：INSERT 时从 `CurrentUser.deptId()` 获取当前用户所属部门 ID 并写入。该字段写入后不可变（UPDATE 时不修改），语义为"数据创建时的归属部门"，不随创建人调岗更新。无认证上下文时（系统任务），由业务层显式指定。

RecordListener INSERT 时从 `CurrentUser.deptId()` 获取部门 ID。如果 `deptId()` 返回 null（不应发生——用户部门为必填字段），**抛出 `IllegalStateException`** 而非静默写入 0。

`AuditFieldsRecordListener.insertStart` 中追加：

```java
// owner_dept_id：数据权限归属部门，INSERT 时写入后不可变
if (currentUser.isAuthenticated()) {
    Long deptId = currentUser.deptId();
    if (deptId == null) {
        throw new IllegalStateException(
            "当前用户 deptId 为 null，无法填充 owner_dept_id。用户部门为必填字段，出现此异常说明是 bug。");
    }
    trySetField(record, "owner_dept_id", deptId);
}
// 无认证上下文（系统任务）不自动填充，由业务层显式指定
```

> **注意**：不是所有表都有 `owner_dept_id`，`trySetField` 的静默跳过机制保证无该字段的表不受影响。仅**需要数据权限的业务表**添加此字段（如 `biz_order_main`），平台基础表（如 `mb_iam_user`）不需要。

#### 8.6.4 重要限制：只对 Record API 生效

jOOQ 的 `RecordListener` **只拦截** `UpdatableRecord.store()/insert()/update()/delete()/merge()` 方法调用，**不拦截** `dsl.update(Table).set(...).execute()` 等纯 DSL。

**所以**：

| 场景 | 审计字段填充方式 |
|---|---|
| 单条 CRUD（走 Record API）| `AuditFieldsRecordListener` 自动填 |
| 批量 N 条已知 record | `jooqHelper.batch*()` 内部填（§8.7）|
| 业务场景条件更新/删除 | `jooqHelper.conditional*()` 内部填（§8.7）|
| `infra-*` / `platform-job` 系统维护 | 原生 DSL + 手动填 `SYSTEM_USER_ID`（§8.7 基础设施层例外）|

**业务层硬约束**（ArchUnit `WRITE_OPS_ONLY_VIA_RECORD_OR_HELPER` 强制）：不允许直接调用 `dsl.update(Table)` 等纯 DSL，必须走二元路径之一。

### 8.7 批量操作规范：JooqHelper 二元路径 [M4]

> **决策**：批量操作统一走 `JooqHelper`，该 helper 是 `@Component` 形态（非静态工具），注入 `DSLContext` + `CurrentUser`，内部统一填充审计字段。业务层除了单条 Record API 之外的所有写操作都必须经过 helper。

#### 8.7.1 `JooqHelper` 组件定义

```java
// infra-jooq/src/main/java/com/metabuild/infra/jooq/JooqHelper.java
@Component
@RequiredArgsConstructor
public class JooqHelper {

    private final DSLContext dsl;
    private final CurrentUser currentUser;

    /**
     * 批量插入 N 条 record.
     * - 自动填 created_by / updated_by = CurrentUser.userIdOrSystem()
     * - created_at / updated_at 依赖 DB DEFAULT CURRENT_TIMESTAMP
     * - version 由 record 初始值 0
     * - 不做行级乐观锁(批量 INSERT 本来就不需要)
     *
     * [M1 集成测试验证]：dsl.batchInsert(records) 是否触发 RecordListener
     * （jOOQ 3.3.0+ 应当触发，见 https://github.com/jOOQ/jOOQ/issues/2770）。
     * 验证通过后此方法可简化为薄包装，去掉手动审计字段填充。
     */
    public <R extends UpdatableRecord<R>> int[] batchInsert(Collection<R> records) {
        Long currentUserId = currentUser.userIdOrSystem();
        for (R record : records) {
            // 手动填充审计字段；待 M1 验证 RecordListener 是否自动触发（可能冗余）
            trySetField(record, "created_by", currentUserId);
            trySetField(record, "updated_by", currentUserId);
        }
        return dsl.batchInsert(records).execute();
    }

    /**
     * 批量更新 N 条已知 record.
     * - 自动填 updated_at = now() + updated_by = CurrentUser.userIdOrSystem()
     * - **不做乐观锁检查**(批量 UPDATE 和行级 version 矛盾;要乐观锁用单条 record.store())
     *
     * [M1 集成测试验证]：dsl.batchUpdate(records) 是否触发 RecordListener
     * （jOOQ 3.3.0+ 应当触发，见 https://github.com/jOOQ/jOOQ/issues/2770）。
     * 验证通过后此方法可简化为薄包装，去掉手动审计字段填充。
     */
    public <R extends UpdatableRecord<R>> int[] batchUpdate(Collection<R> records) {
        Long currentUserId = currentUser.userIdOrSystem();
        OffsetDateTime now = OffsetDateTime.now();
        for (R record : records) {
            // 手动填充审计字段；待 M1 验证 RecordListener 是否自动触发（可能冗余）
            trySetField(record, "updated_at", now);
            trySetField(record, "updated_by", currentUserId);
        }
        return dsl.batchUpdate(records).execute();
    }

    /**
     * 批量删除 N 条已知 record(真删除,meta-build 不做软删除).
     *
     * [M1 集成测试验证]：dsl.batchDelete(records) 是否触发 RecordListener
     * （DELETE 无审计字段，验证仅供参考）。
     */
    public <R extends UpdatableRecord<R>> int[] batchDelete(Collection<R> records) {
        return dsl.batchDelete(records).execute();
    }

    /**
     * 业务场景条件更新:UPDATE t SET ... WHERE <条件>.
     * - 业务层:通过此方法更新,自动补 updated_at / updated_by
     * - infra / platform-job 的系统级清理任务:允许直接用 dsl.update(Table),手动填 SYSTEM_USER_ID
     * - 条件更新不做乐观锁(集合级 DML 与行级 version 检查语义矛盾)
     *
     * setter 只负责 set 字段(返回 UpdateSetMoreStep),helper 追加审计字段后加 WHERE 执行。
     *
     * 示例用法:
     * <pre>
     * int rows = jooqHelper.conditionalUpdate(
     *     ORDER_MAIN,
     *     step -> step.set(ORDER_MAIN.STATUS, "CLOSED"),
     *     ORDER_MAIN.CREATED_AT.lt(cutoff).and(ORDER_MAIN.STATUS.eq("PENDING"))
     * );
     * </pre>
     */
    public <R extends UpdatableRecord<R>> int conditionalUpdate(
        Table<R> table,
        Function<UpdateSetFirstStep<R>, UpdateSetMoreStep<R>> setter,
        Condition condition
    ) {
        // setter 只负责 set 业务字段；审计字段由 helper 追加，避免 UpdateConditionStep 无 set() 的编译错误
        return setter.apply(dsl.update(table))
            .set(DSL.field("updated_by", Long.class), currentUser.userIdOrSystem())
            .set(DSL.field("updated_at", OffsetDateTime.class), DSL.currentOffsetDateTime())
            .where(condition)
            .execute();
    }

    /**
     * 业务场景条件删除:DELETE FROM t WHERE <条件>.
     * - meta-build 不做软删除,此方法执行真删除
     * - 基础设施层允许直接用 dsl.deleteFrom(Table)
     */
    public <R extends Record> int conditionalDelete(
        Table<R> table,
        Function<DeleteUsingStep<R>, DeleteConditionStep<R>> builder
    ) {
        DeleteUsingStep<R> firstStep = dsl.deleteFrom(table);
        DeleteConditionStep<R> conditionStep = builder.apply(firstStep);
        return conditionStep.execute();
    }

    @SuppressWarnings("unchecked")
    private void trySetField(Record record, String fieldName, Object value) {
        Field<?> field = record.field(fieldName);
        if (field != null) {
            record.set((Field<Object>) field, value);
        }
    }
}
```

#### 8.7.2 业务层使用示例

```java
// 单条:直接 Record API(最常用)
@Transactional
public UserView createUser(UserCreateCommand cmd) {
    MbIamUserRecord record = dsl.newRecord(MB_IAM_USER);
    record.setId(snowflake.nextId());
    record.setUsername(cmd.username());
    record.setEmail(cmd.email());
    record.setPasswordHash(passwordEncoder.encode(cmd.password()));
    record.setVersion(0);
    record.insert();
    //   触发 AuditFieldsRecordListener.insertStart → 填 created_by/updated_by
    //   created_at/updated_at 由 DB DEFAULT 填
    return UserView.from(record);
}

// 批量 N 条:走 helper
@Transactional
public void importUsers(List<UserCreateCommand> cmds) {
    List<MbIamUserRecord> records = cmds.stream()
        .map(this::buildRecord)
        .collect(toList());
    jooqHelper.batchInsert(records);
}

// 条件更新:走 helper（setter 只传 set 链，WHERE 条件独立参数传入）
@Transactional
public int deactivateInactiveUsers(OffsetDateTime cutoff) {
    return jooqHelper.conditionalUpdate(
        MB_IAM_USER,
        step -> step.set(MB_IAM_USER.STATUS, 0),
        MB_IAM_USER.LAST_LOGIN_AT.lt(cutoff)
    );
}
```

#### 8.7.3 基础设施层例外（允许原生 DSL）

**允许直接使用 `dsl.update(Table) / dsl.insertInto(Table) / dsl.deleteFrom(Table)` 的包**：
- `mb-infra.*`（所有 infra 子模块）
- `mb-platform.job.*`（定时任务模块，典型场景是审计日志清理 / 过期 token 清理）

**要求**：
- 手动在 SET 子句里填 `updated_by = CurrentUser.SYSTEM_USER_ID`（或通过 helper 的 `conditionalUpdate` 也可以）
- 文档注释说明"这是基础设施/系统动作，使用 SYSTEM_USER_ID 作为审计身份"

**示例**：

```java
// platform-job/src/main/java/com/metabuild/platform/job/oplog/OperationLogCleanupJob.java
@Component
@RequiredArgsConstructor
public class OperationLogCleanupJob {

    private final DSLContext dsl;

    /** 每天清理 180 天前的操作日志. */
    @Scheduled(cron = "0 0 2 * * *", zone = "UTC")
    @SchedulerLock(name = "operationLogCleanup", lockAtMostFor = "PT10M")
    public void cleanupOldLogs() {
        // 基础设施层例外:允许原生 DSL,无需审计字段(DELETE 本身没有 updated_by)
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(180);
        int deleted = dsl.deleteFrom(MB_OPERATION_LOG)
            .where(MB_OPERATION_LOG.CREATED_AT.lt(cutoff))
            .execute();
        log.info("Cleaned up {} operation log entries older than {}", deleted, cutoff);
    }
}
```

#### 8.7.4 二元路径总结表

| 场景 | 写法 | 触发的机制 | 审计字段填充 | 乐观锁 |
|---|---|---|---|---|
| 单条 CRUD（业务层）| `record.store() / insert() / update() / delete()` | `AuditFieldsRecordListener` + `Settings.updateRecordVersion` + `Settings.updateRecordTimestamp` | 全自动 | version 检查 + 自增 |
| 批量 N 条已知 record（业务层）| `jooqHelper.batchInsert/batchUpdate/batchDelete(records)` | helper 内部填 + `dsl.batch*`（**[M1 验证]** RecordListener 是否自动触发，见 #2770）| helper 填（M1 后可能简化）| 批量不做 |
| 业务条件更新/删除 | `jooqHelper.conditionalUpdate(table, setter, condition)` / `conditionalDelete(table, builder)` | conditionalUpdate：helper 内 DSL 手动补 `updated_at / updated_by`（setter 只负责 set 字段，审计字段由 helper 追加后加 WHERE）| helper 填（DSL 路径，RecordListener 不生效）| 条件更新不做 |
| 基础设施系统动作（`infra-*` / `platform-job`）| `dsl.update(Table).set(...).where(...).execute()` | 无 listener | 手动填 `SYSTEM_USER_ID`（或走 helper）| 无 |
| 业务层直接 DSL（`dsl.update(Table)` 等）| **禁止** | — | — | — |

**业务层禁止的 4 条 ArchUnit 规则见 [08-archunit-rules.md](./08-archunit-rules.md)。**

### 8.8 软删除：不做 [M4]

> **决策**：meta-build **不实现软删除**。所有 DELETE 为真删除。

#### 8.8.1 为什么不做

- **jOOQ 无原生支持**：jOOQ 官方 issue #2683 计划在 v3.22+ 添加原生软删除，当前版本（3.19+）不可用
- **自建成本**：自建 `SoftDeleteVisitListener` + `@BypassSoftDelete` 切面等，复杂度约等于方案 E 数据权限，但业务价值不如数据权限高
- **数据保留的替代方案**：
  - 操作日志（`@OperationLog` 注解）记录所有删除动作 + 入参快照
  - 定期 DB 备份（运维层面）
  - 重要业务数据的"归档表"（业务模块自行设计）
- **外键策略**：默认 `ON DELETE RESTRICT` 防止孤儿数据，级联删除只在显式声明 `ON DELETE CASCADE` 时发生

#### 8.8.2 使用者如何替代软删除

如果使用者业务确实需要软删除（比如订单取消但保留历史），**业务模块自行实现**：

- 在自己的表上加 `cancelled_at TIMESTAMPTZ NULL` / `status ENUM('ACTIVE','CANCELLED')` 等业务字段
- 业务代码里自己写 `WHERE status = 'ACTIVE'` 过滤
- **不引入"统一软删除"的框架层机制**

#### 8.8.3 v1.5+ 预留

如果未来使用者反馈强烈，v1.5 可以：
- 等 jOOQ 3.22+ 原生软删除落地
- 或者引入 `SoftDeleteVisitListener`（方案 E 同构）+ `SoftDeleteRegistry`

v1 明确不做。

---

---

## 9. 数据库连接池基线 HikariCP [P0] [M1]

**HikariCP 是 Spring Boot 默认的连接池**，无需额外引入。关键参数：

```yaml
# mb-admin/src/main/resources/application.yml
spring:
  datasource:
    url: ${MB_DB_URL}
    username: ${MB_DB_USERNAME}
    password: ${MB_DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      pool-name: MetaBuildHikariPool
      maximum-pool-size: 20              # 最大连接数
      minimum-idle: 5                    # 最小空闲连接
      connection-timeout: 30000          # 30s: 获取连接的超时
      idle-timeout: 600000               # 10min: 空闲连接的保留时间
      max-lifetime: 1800000              # 30min: 连接的最大生命周期
      leak-detection-threshold: 60000    # 60s: 连接泄漏检测阈值
      validation-timeout: 5000           # 5s: 连接有效性验证超时
      keepalive-time: 120000             # 2min: keepalive 间隔
```

**参数 rationale**：
- `maximum-pool-size: 20`：中小规模应用的合理起点。参考公式 `connections = ((core_count * 2) + effective_spindle_count)`，典型 4 核 VPS 约 10-20 个
- `leak-detection-threshold: 60000`：开发期必开，生产也建议开启，帮助发现忘记释放的连接
- `max-lifetime: 1800000`：30 分钟，避免数据库的长连接超时断开（通常 `wal_sender_timeout = 60min`）
- `validation-timeout: 5000`：防止连接活性检查阻塞太久

**不同环境的调整**：
- 开发环境：`maximum-pool-size: 10, minimum-idle: 2`
- 生产环境：按压测结果调整（通常 20-50 之间）
- 测试环境（Testcontainers）：`maximum-pool-size: 10, minimum-idle: 1`

**验证**：启动时检查 HikariCP metrics 暴露到 `/actuator/metrics/hikaricp.connections.*`。

<!-- verify: curl -s http://localhost:8080/actuator/metrics/hikaricp.connections | jq .name -->

---

## 10. 缓存策略完整规范 [P0] [M4]

**底层**：Spring Cache Abstraction + Redis（生产）/ Caffeine（开发可选）。

### 10.1 缓存 key 命名规范

格式：`mb:<模块>:<实体或业务>:<参数>`

```
mb:iam:user:123                    # 用户详情
mb:iam:user-perms:123              # 用户权限列表
mb:iam:user-roles:123              # 用户角色列表
mb:iam:dept-tree:0                 # 部门树（按租户）
mb:dict:by-code:gender             # 字典按 code 查询
mb:dict:by-type:user_status        # 字典按 type 查询
mb:config:key:site.name            # 系统配置
mb:file:metadata:sha256:abc...     # 文件秒传缓存
```

**关键约定**：
- **必须有 `mb:` 前缀**：区分 meta-build 的 key 和使用者自己的 key
- **模块名小写**：`iam / audit / file / dict / ...`
- **参数在最后**：方便按前缀通配删除（`mb:iam:user:*`）
- **禁止在 key 里放 tenantId**：tenantId 通过 Redis database 或通过前缀（`mb:t<tenantId>:iam:user:123`）实现，v1 暂不做

### 10.2 TTL 策略

| 数据类型 | 默认 TTL | 备注 |
|---------|---------|------|
| **用户详情** | 1 小时 | 变动不频繁 |
| **用户权限** | 30 分钟 | 权限变更需要稍快感知 |
| **角色配置** | 30 分钟 | 同上 |
| **字典** | 24 小时 | 几乎不变（+ `@CachePut` 改动时主动更新） |
| **系统配置** | 10 分钟 | 平衡变更感知和命中率 |
| **热点业务数据** | 5-15 分钟 + 随机抖动 ±20% | 防雪崩 |
| **文件 SHA256 秒传** | 永久（+ 按需清理） | 秒传场景 |
| **短临时数据**（验证码） | 5 分钟 | 业务约束 |

### 10.3 防护机制

##### 穿透（key 不存在被频繁查询）

```java
@Cacheable(value = "user", key = "#id", unless = "#result == null")
public User findById(Long id) {
    User user = repository.findById(id).orElse(null);
    // 即使返回 null，也缓存一个占位（短 TTL，防止同 key 频繁查询 DB）
    if (user == null) {
        cacheManager.getCache("user").put(id, NULL_USER);
    }
    return user;
}
```

**替代方案**：布隆过滤器（v1.5 评估）。

##### 雪崩（大量 key 同时失效）

在 TTL 上加 **随机抖动 ±20%**：

```java
// 在 RedisCacheConfiguration 里配置
@Bean
public RedisCacheConfiguration cacheConfiguration() {
    return RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(jitteredTtl(Duration.ofMinutes(30), 0.2))   // ±20% 抖动
        .serializeKeysWith(...)
        .serializeValuesWith(...);
}

private static Duration jitteredTtl(Duration base, double jitterRatio) {
    double jitter = ThreadLocalRandom.current().nextDouble(-jitterRatio, jitterRatio);
    return Duration.ofMillis((long)(base.toMillis() * (1 + jitter)));
}
```

##### 击穿（热点 key 失效瞬间的并发查询）

热点 key 用 **Redis 分布式锁**（Redisson `RLock`）包住数据库查询：

```java
public User findHotUserById(Long id) {
    String cacheKey = "mb:iam:user:" + id;
    User cached = cache.get(cacheKey, User.class);
    if (cached != null) return cached;

    String lockKey = "mb:lock:iam:user:" + id;
    RLock lock = redissonClient.getLock(lockKey);
    try {
        lock.lock(3, TimeUnit.SECONDS);
        // 双重检查
        cached = cache.get(cacheKey, User.class);
        if (cached != null) return cached;

        User fresh = repository.findById(id).orElseThrow();
        cache.put(cacheKey, fresh);
        return fresh;
    } finally {
        if (lock.isHeldByCurrentThread()) lock.unlock();
    }
}
```

v1 只在明确的热点场景（如首页数据、高频访问的字典）使用，默认 CRUD 不做击穿防护。

### 10.4 本地缓存 vs Redis 缓存的选择

| 场景 | 推荐 | 理由 |
|------|-----|------|
| **字典** | 本地（Caffeine）+ 事件刷新 | 几乎不变，本地零延迟 |
| **用户权限（高频）** | 本地（短 TTL）+ Redis（长 TTL） | 二级缓存 |
| **用户详情** | Redis | 跨实例一致性更重要 |
| **系统配置** | 本地 + 事件刷新 | 极少变化 |
| **临时数据（验证码 / 限流）** | Redis | 必须跨实例 |

v1 **默认用 Redis**，本地缓存作为优化手段在 M5 canonical reference 里示范。

## 11. 缓存 key 级失效（禁用 allEntries=true） [M4]

#### 问题

nxboot 的 4 个 Service 使用 `@CacheEvict(allEntries = true)`——改一个用户状态 = 所有用户缓存全部作废。现在 14 个模块不明显，规模上去后缓存形同虚设。

#### 修复

- **一律 key 级失效**，`allEntries = true` 全部禁用（ArchUnit 拦截）
- **级联失效必须显式**：用 `CacheEvictSupport.afterCommit()` 在事务提交后失效多个 key
- `CacheEvictSupport` 直接借用 nxboot，验证过的事务同步机制

#### 代码骨架

```java
// infra-cache/src/main/java/com/metabuild/infra/cache/CacheEvictSupport.java
@Component
public class CacheEvictSupport {
    /**
     * 在当前事务提交后执行失效，避免事务内 evict 导致脏读
     */
    public void afterCommit(Runnable evictAction) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        evictAction.run();
                    }
                }
            );
        } else {
            evictAction.run();
        }
    }
}
```

```java
// 使用示例
@Service
public class UserService implements UserApi {
    @CacheEvict(value = "user", key = "#user.id")
    @Transactional
    public User update(User user) {
        User saved = userRepository.save(user);
        // 级联失效 user-roles 和 user-perms 缓存
        cacheEvictSupport.afterCommit(() -> {
            cacheManager.getCache("user-roles").evict(user.getId());
            cacheManager.getCache("user-perms").evict(user.getId());
        });
        return saved;
    }
}
```

#### ArchUnit 规则

```java
public static final ArchRule NO_EVICT_ALL_ENTRIES = noMethods()
    .should(new ArchCondition<JavaMethod>("not use @CacheEvict(allEntries=true)") {
        @Override
        public void check(JavaMethod method, ConditionEvents events) {
            method.tryGetAnnotationOfType(CacheEvict.class)
                .ifPresent(annotation -> {
                    if (annotation.allEntries()) {
                        events.add(SimpleConditionEvent.violated(method,
                            method.getFullName() + " 使用了 @CacheEvict(allEntries=true)，禁止"));
                    }
                });
        }
    });
```

<!-- verify: cd server && grep -rn "allEntries = true\|allEntries=true" --include="*.java" mb-platform mb-infra | wc -l -->

（预期输出: `0`）

## 12. 时区规范 [M1]

（ADR-008）

### 12.1 决策

- **数据库存储**: UTC（PostgreSQL `TIMESTAMP WITH TIME ZONE`）
- **Java 处理**: `java.time.Instant`（UTC 时间戳）
- **API 边界**: ISO 8601 字符串（例: `2026-04-11T10:30:00Z`）
- **客户端展示**: 客户端自己转本地时区，**后端不转**

### 12.2 配置

```yaml
# application.yml
spring:
  jackson:
    time-zone: UTC
    date-format: yyyy-MM-dd'T'HH:mm:ss.SSSXXX
    serialization:
      write-dates-as-timestamps: false
  jpa:
    properties:
      hibernate:
        jdbc:
          time_zone: UTC

# JVM 启动参数（Dockerfile ENTRYPOINT）
# -Duser.timezone=UTC
```

### 12.3 DTO 字段约定

```java
// ✅ 正确：使用 Instant
public record UserView(
    Long id,
    String username,
    Instant createdAt,       // 序列化为 "2026-04-11T10:30:00Z"
    Instant updatedAt
) {}

// ❌ 错误：LocalDateTime 丢失时区信息
public record UserView(
    Long id,
    String username,
    LocalDateTime createdAt  // 禁止在 api 包使用
) {}
```

### 12.4 ArchUnit 规则

```java
public static final ArchRule NO_LOCALDATETIME_IN_API = noClasses()
    .that().resideInAPackage("..api..")
    .should().dependOnClassesThat().haveFullyQualifiedName("java.time.LocalDateTime")
    .as("api 包禁用 LocalDateTime，必须用 Instant");
```

<!-- verify: cd server && grep -rn "LocalDateTime" --include="*.java" mb-platform/*/src/main/java/com/metabuild/platform/*/api/ mb-business/*/src/main/java/com/metabuild/business/*/api/ 2>/dev/null | wc -l -->

（预期输出: `0`）

### 12.5 全局时间策略

#### Java 业务代码

统一通过注入 `Clock` Bean 获取当前时间，**禁止**调用无参的静态时间方法：

```java
// ✅ 推荐：注入 Clock，通过 Clock 获取时间
@Service
@RequiredArgsConstructor
public class OrderService implements OrderApi {
    private final Clock clock;

    public OrderView create(OrderCreateCommand cmd) {
        Instant now = Instant.now(clock);   // 可在测试中冻结时间
        // ...
    }
}

// ✅ 生产环境 Clock Bean（定义在 mb-infra/infra-jooq 或 mb-admin）
@Bean
public Clock clock() {
    return Clock.systemUTC();
}

// ✅ 测试环境：冻结时间
Clock fixedClock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
```

#### SQL / 审计字段

统一用 `CURRENT_TIMESTAMP`（Flyway DDL）或 jOOQ `DSL.currentOffsetDateTime()`（业务条件更新）。

#### 禁止的方式

```java
// ❌ 全部禁止：
Instant.now()                // 无参，测试无法冻结
OffsetDateTime.now()         // 无参
LocalDateTime.now()          // 无参
new Date()                   // 旧 API
System.currentTimeMillis()   // 旧 API
```

**编码规范**（文档引导 + 模板示范，不做 ArchUnit 硬约束）：
- 业务代码统一通过注入的 `Clock` Bean 获取时间：`Instant.now(clock)`
- `infra-jooq` 或 `mb-admin` 提供 `Clock` Bean（生产 `Clock.systemUTC()`，测试 `Clock.fixed(...)`）
- 禁止的方式在 canonical reference 和 12 步清单模板中明确标注
- 详见 [08-archunit-rules.md §7.8](./08-archunit-rules.md)（编码建议，非硬规则）

---

## 13. jOOQ 分页查询模板 [M4]

> **关注点**：业务 Repository 如何用 jOOQ 原生 API 实现 offset 分页 + sort 白名单。本节是代码模板，直接复制到业务 Repository 里改字段名即可。
>
> **上游契约**：`PageQuery` / `PageResult` / `SortParser` 定义在 `mb-common.pagination` 包（详见 [06-api-and-contract.md §12](./06-api-and-contract.md)）。

### 13.1 标准分页查询模板

```java
// platform-iam/src/main/java/com/metabuild/platform/iam/domain/user/UserRepository.java
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;

    public PageResult<UserView> page(PageQuery query) {
        // 1. 解析 sort 白名单 + 默认排序
        List<SortField<?>> orderBy = SortParser.builder()
            .forTable(MB_IAM_USER)                         // 自动：id/createdAt/updatedAt
            .allow("username",  MB_IAM_USER.USERNAME)       // 业务字段显式列举
            .allow("email",     MB_IAM_USER.EMAIL)
            .defaultSort(MB_IAM_USER.CREATED_AT.desc())     // 默认创建时间倒序
            .parse(query.sort());

        // 2. COUNT 总数
        long total = dsl.selectCount()
            .from(MB_IAM_USER)
            .fetchOne(0, long.class);

        // 3. 分页查询
        List<MbIamUserRecord> records = dsl.selectFrom(MB_IAM_USER)
            .orderBy(orderBy)
            .limit(query.size())
            .offset(query.offset())
            .fetch();

        // 4. 映射到 View + 封装结果
        return PageResult.of(
            records.stream().map(UserView::from).toList(),
            total,
            query
        );
    }
}
```

### 13.2 带 WHERE 条件的分页

```java
public PageResult<UserView> pageByStatus(PageQuery query, int status) {
    List<SortField<?>> orderBy = SortParser.builder()
        .forTable(MB_IAM_USER)
        .allow("username", MB_IAM_USER.USERNAME)
        .defaultSort(MB_IAM_USER.CREATED_AT.desc())
        .parse(query.sort());

    Condition where = MB_IAM_USER.STATUS.eq(status);

    long total = dsl.selectCount()
        .from(MB_IAM_USER)
        .where(where)
        .fetchOne(0, long.class);

    List<MbIamUserRecord> records = dsl.selectFrom(MB_IAM_USER)
        .where(where)
        .orderBy(orderBy)
        .limit(query.size())
        .offset(query.offset())
        .fetch();

    return PageResult.of(
        records.stream().map(UserView::from).toList(),
        total,
        query
    );
}
```

### 13.3 复杂 JOIN 查询的分页

```java
public PageResult<UserWithDeptView> pageWithDept(PageQuery query) {
    // JOIN 查询的 SortParser 需要显式列举所有允许字段
    // （forTable 只识别单表的 id/createdAt/updatedAt，不跨表）
    List<SortField<?>> orderBy = SortParser.builder()
        .allow("id",         MB_IAM_USER.ID)
        .allow("username",   MB_IAM_USER.USERNAME)
        .allow("deptName",   MB_IAM_DEPT.NAME)
        .allow("createdAt",  MB_IAM_USER.CREATED_AT)
        .defaultSort(MB_IAM_USER.CREATED_AT.desc())
        .parse(query.sort());

    // count 的 JOIN 通常可以简化（只 count user.id）
    long total = dsl.selectCount()
        .from(MB_IAM_USER)
        .fetchOne(0, long.class);

    List<Record> records = dsl.select(MB_IAM_USER.asterisk(), MB_IAM_DEPT.NAME.as("dept_name"))
        .from(MB_IAM_USER)
        .leftJoin(MB_IAM_DEPT).on(MB_IAM_USER.DEPT_ID.eq(MB_IAM_DEPT.ID))
        .orderBy(orderBy)
        .limit(query.size())
        .offset(query.offset())
        .fetch();

    return PageResult.of(
        records.stream().map(UserWithDeptView::from).toList(),
        total,
        query
    );
}
```

### 13.4 为什么不抽 JooqHelper 分页方法

meta-build **不**提供 `JooqHelper.paginate(...)` 之类的辅助方法。理由：

- 每个查询的 WHERE / JOIN / SELECT 列完全不同
- 辅助方法要接受高阶函数 `Function<DSLContext, SelectLimitPercentStep<?>>` ，AI 生成代码时容易出错
- 直接写 jOOQ 的 3 步（count + limit/offset + PageResult.of）一眼看清楚 SQL 结构
- M4.2 的 `JooqHelper` 二元路径只覆盖**写操作**（batch 和 conditional），SELECT 不入 helper

### 13.5 性能建议

- **索引**：分页表建议加 `(tenant_id, <排序字段> DESC)` 复合索引
- **避免深度分页**：offset 分页在深页性能差，v1 不提供 seek/游标分页，海量导出用独立异步接口
- **COUNT(*) 优化**：大表可以考虑估算行数（`pg_class.reltuples`）或缓存总数，v1 不做

---

[← 返回 README](./README.md)
