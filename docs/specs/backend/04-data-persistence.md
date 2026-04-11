# 04 - 数据访问与持久化

> **关注点**：表/字段命名、Snowflake 主键、软删除/审计自动化、tenant_id 预留、Flyway 脚本组织、jOOQ codegen 流程、jOOQ 不入 Service、事务边界、HikariCP、缓存策略、缓存 key 级失效、时区规范。
>
> **本文件吸收原 backend-architecture.md §7（数据层）+ §5.1（jOOQ 不入 Service）+ §5.4（缓存 key 级失效）+ §13（时区规范）**。三个跨章节主题归位到数据层这个真正的归属。

## 1. 表/字段命名规范 [M1+M4]

#### 表名

- **命名方式**: snake_case，模块前缀 + 领域 + 实体
- **平台表**: `sys_<域>_<实体>`（例: `sys_iam_user`, `sys_iam_role`, `sys_audit_log`）
- **业务表**: `biz_<域>_<实体>`（例: `biz_order_main`, `biz_order_item`，用于 M5 canonical reference）
- **关联表**: `sys_iam_user_role`, `sys_iam_role_menu`

#### 字段名

- 全部 snake_case
- 主键: `id BIGINT NOT NULL`（Snowflake 生成）
- 外键: `<引用实体>_id BIGINT`（例: `user_id`, `role_id`）
- 软删除: `deleted SMALLINT NOT NULL DEFAULT 0`（0=未删, 1=已删）
- 审计字段（所有表必须有）:
  - `created_by BIGINT`
  - `created_at TIMESTAMP WITH TIME ZONE NOT NULL`
  - `updated_by BIGINT`
  - `updated_at TIMESTAMP WITH TIME ZONE NOT NULL`
- 多租户: `tenant_id BIGINT NOT NULL DEFAULT 0`（ADR-007）
- 乐观锁: `version INT NOT NULL DEFAULT 0`

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
// mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/IdGeneratorConfig.java
@Configuration
public class IdGeneratorConfig {
    @Bean
    public SnowflakeIdGenerator snowflakeIdGenerator(
            @Value("${mb.id.worker:1}") long workerId,
            @Value("${mb.id.datacenter:1}") long datacenterId) {
        return new SnowflakeIdGenerator(workerId, datacenterId);
    }
}
```

## 3. 软删除 + 审计字段自动化 [M1+M4]

- jOOQ 查询默认通过 `JooqHelper.softDeletedFilter()` 追加 `deleted = 0` 条件
- 审计字段通过 `JooqHelper.setAuditInsert()` / `setAuditUpdate()` 自动填充 `created_by / created_at / updated_by / updated_at`
- 当前用户 ID 从 `CurrentUser.userId()` 获取（通过 `CurrentUser` 门面，ADR-0005）

## 4. tenant_id 预留 [M1]

#### 决策

- **所有表从 V1 起预留** `tenant_id BIGINT NOT NULL DEFAULT 0`
- **v1 不实现多租户路由**，所有数据 `tenant_id = 0`
- **v1.5+ 多租户激活时**：只需在 jOOQ VisitListener 注入 `tenant_id` 条件，不需要 schema migration
- **索引约定**: 所有业务复合索引的**第一列必须是 `tenant_id`**（为将来 partition 做准备）

#### Flyway 模板

```sql
-- mb-schema/src/main/resources/db/migration/V20260601_001__iam_user.sql
CREATE TABLE sys_iam_user (
    id            BIGINT       PRIMARY KEY,
    tenant_id     BIGINT       NOT NULL DEFAULT 0,
    username      VARCHAR(64)  NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    email         VARCHAR(128),
    dept_id       BIGINT,
    status        SMALLINT     NOT NULL DEFAULT 1,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INT          NOT NULL DEFAULT 0,
    created_by    BIGINT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    BIGINT,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_sys_iam_user_tenant_username
    ON sys_iam_user (tenant_id, username)
    WHERE deleted = 0;

CREATE INDEX idx_sys_iam_user_tenant_dept
    ON sys_iam_user (tenant_id, dept_id);
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
| **platform 模块** | 模块名简写（无 `platform_` 前缀，platform 是 M0 冻结的 8 个，简写不歧义）| `iam_user` / `audit_log` / `file_metadata` / `notification` / `dict` / `config` / `job` / `monitor` |
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
├── V20260602_001__audit_log.sql             # platform-audit
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
- 所有表必须有 `tenant_id / deleted / version / created_by / created_at / updated_by / updated_at` 字段
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
-- V30__add_user_phone_nullable.sql
ALTER TABLE sys_iam_user ADD COLUMN phone VARCHAR(32);

-- V31__backfill_user_phone.sql
UPDATE sys_iam_user SET phone = '' WHERE phone IS NULL;

-- V32__make_user_phone_not_null.sql
ALTER TABLE sys_iam_user ALTER COLUMN phone SET NOT NULL;
ALTER TABLE sys_iam_user ALTER COLUMN phone SET DEFAULT '';
```

**大表加索引**：使用 `CREATE INDEX CONCURRENTLY`（PostgreSQL 特性，不锁表但不能在事务里运行）：
```sql
-- V40__add_idx_user_phone.sql
-- NOTE: 此脚本必须在 flyway.mixed=true 下运行
CREATE INDEX CONCURRENTLY idx_sys_iam_user_tenant_phone
    ON sys_iam_user (tenant_id, phone);
```

<!-- verify: cd server && test -d mb-schema/src/main/resources/db/migration && ls mb-schema/src/main/resources/db/migration/ | grep -E '^V[0-9]{2}_[0-9]{3}__' -->

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
    │   ├── SysIamUser.java
    │   ├── SysAuditLog.java
    │   └── ...
    ├── records/
    │   ├── SysIamUserRecord.java
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
- jOOQ 只允许出现在 `infrastructure` 包（Repository）
- SQL 操作必须通过 Repository 暴露的方法间接调用

#### ArchUnit 规则

```java
// mb-infra/infra-archunit/src/main/java/com/metabuild/infra/archunit/rules/JooqIsolationRule.java
public class JooqIsolationRule {

    public static final ArchRule DOMAIN_MUST_NOT_USE_JOOQ = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("org.jooq..")
        .as("Domain (Service) 层禁止直接依赖 jOOQ，SQL 操作必须走 Repository");

    public static final ArchRule JOOQ_ONLY_IN_INFRASTRUCTURE = classes()
        .that().dependOnClassesThat().resideInAPackage("org.jooq..")
        .should().resideInAnyPackage(
            "..infrastructure..",
            "com.metabuild.infra.jooq..",
            "..admin..test.."
        );
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

审计日志写入是典型的"独立事务"场景——即使业务事务回滚，审计记录也要保留。

```java
@Service
@RequiredArgsConstructor
public class AuditWriter {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeAudit(AuditLog log) {
        // 独立事务，不受调用者事务影响
        auditRepository.save(log);
    }
}
```

**使用场景**：
- 审计日志（业务回滚但审计要保留）
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

---

[← 返回 README](./README.md)
