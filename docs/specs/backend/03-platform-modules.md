# 03 - 平台业务层与 mb-business

> **关注点**：8 个 `mb-platform` 平台模块、`mb-business` 使用者扩展位的定位、新增业务模块的 12 步清单。
>
> **本文件吸收原 backend-architecture.md §4 全文**（8 个平台模块 + iam 子领域 + 业务模块标准骨架 + 12 步清单）。

## 1. 决策结论（platform vs business）[M4]

- `mb-platform`：meta-build **官方提供的稳定平台能力**，8 个模块（iam/audit/file/notification/dict/config/job/monitor）。收敛 nxboot 的 14 个分散领域，大模块 `iam` 合并 7 个身份访问管理相关领域
- `mb-business`：**使用者扩展位 + M5 canonical reference**。v1 的 M1-M4 阶段是空目录 + 占位 pom；M5 填入 3 个业务示例（notice/order/approval）；使用者加自己业务时也在这个层
- **mb-platform vs mb-business 的区别**：platform 是 meta-build 维护团队负责、使用者不应随意修改的稳定能力；business 是使用者自己的业务（包括 meta-build 提供的可删除示例）

## 2. 8 个平台业务模块清单 [M4]

| # | 模块 | 职责 | 对外 api 接口 | nxboot 对应 |
|---|------|------|--------------|------------|
| 1 | `platform-iam` | 用户/角色/菜单/部门/权限/数据范围/在线用户/认证/登录日志 | `UserApi`, `RoleApi`, `MenuApi`, `DeptApi`, `AuthApi`, `PermissionApi` | user + role + menu + dept + auth + online + login-log |
| 2 | `platform-audit` | 业务审计日志 + 操作日志（**`@Audit` 注解 + AOP + `sys_audit_log`**） | `AuditApi` | audit + log |
| 3 | `platform-file` | 文件上传 + 本地/MinIO 存储 + 附件元数据 | `FileApi`, `FileStorage` | file |
| 4 | `platform-notification` | 通知公告 + 站内信 + 邮件 + 短信 + Webhook | `NotificationApi` | notice（扩展） |
| 5 | `platform-dict` | 字典 + 枚举管理 | `DictApi` | dict |
| 6 | `platform-config` | 运行时配置 + 业务参数 | `ConfigApi` | config |
| 7 | `platform-job` | 定时任务（**Spring `@Scheduled` + ShedLock**）+ 执行历史 | `JobApi` | job + job-log |
| 8 | `platform-monitor` | 服务器资源 + 慢查询监控 + 健康检查 | `MonitorApi` | monitor |

### 2.1 platform-job 的具体技术选择（[P0]）

- **定时调度**：Spring `@Scheduled`（单体应用的最简方案）
- **分布式锁**：[ShedLock](https://github.com/lukas-krecan/ShedLock)（防多实例重复执行）
- **锁存储**：JDBC 表 `shedlock`（由 `platform-job` 通过 Flyway migration 建表，ADR-0008 时间戳命名，例如 `V20260603_005__shedlock.sql`）
- **执行历史**：`sys_job_log` 表，记录每次执行的 trigger_time / duration / status / error_message

```java
@Service
@RequiredArgsConstructor
public class DailyReportJob {

    @Scheduled(cron = "0 0 2 * * *")       // 每天凌晨 2 点
    @SchedulerLock(
        name = "dailyReportJob",
        lockAtMostFor = "10m",              // 最多持锁 10 分钟
        lockAtLeastFor = "1m"               // 至少持锁 1 分钟（防多实例竞争）
    )
    public void run() {
        // 任务逻辑
    }
}
```

**Cron 表达式规范**：遵循 Spring Cron 语法（6 位，秒-分-时-日-月-周）。禁止使用秒级触发（v1 不支持）。

### 2.2 platform-file 的具体技术选择（[P0]）

**存储抽象**：`FileStorage` 接口 + 多实现。

```java
// infra-file/src/main/java/com/metabuild/platform/file/api/FileStorage.java
public interface FileStorage {
    /** 上传文件，返回元数据 */
    FileMetadata upload(String filename, InputStream stream, String contentType);

    /** 下载文件 */
    InputStream download(String fileId);

    /** 删除文件 */
    void delete(String fileId);

    /** 秒传：通过 SHA-256 查已存在文件 */
    Optional<FileMetadata> findBySha256(String sha256);
}
```

**v1 默认实现**：`LocalFileStorage`
- 路径：`${MB_FILE_STORAGE_PATH:/var/lib/meta-build/files}`
- 按 SHA-256 哈希分 2 级目录（`files/ab/cd/abcdef1234...`）
- 秒传：上传前校验哈希，命中直接返回已有 metadata

**可选实现**：`MinioFileStorage`（S3 兼容）
- 通过 `MB_FILE_STORAGE_TYPE=minio` 启用
- 依赖 `io.minio:minio:8.x`
- 环境变量：`MB_MINIO_ENDPOINT` / `MB_MINIO_ACCESS_KEY` / `MB_MINIO_SECRET_KEY` / `MB_MINIO_BUCKET`

**文件限制**：
- 默认最大 **10MB**（`MB_FILE_MAX_SIZE`）
- 默认允许的 MIME：`image/* + application/pdf + application/zip + application/json`
- **双重校验**（扩展名 + MIME type），避免伪装

**元数据表** `sys_file_metadata`：
```sql
CREATE TABLE sys_file_metadata (
    id                BIGINT       PRIMARY KEY,
    tenant_id         BIGINT       NOT NULL DEFAULT 0,
    original_filename VARCHAR(255) NOT NULL,
    content_type      VARCHAR(128) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    sha256            VARCHAR(64)  NOT NULL,
    storage_type      VARCHAR(16)  NOT NULL,  -- local / minio
    storage_path      VARCHAR(512) NOT NULL,
    deleted           SMALLINT     NOT NULL DEFAULT 0,
    created_by        BIGINT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by        BIGINT,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_sys_file_tenant_sha256
    ON sys_file_metadata (tenant_id, sha256) WHERE deleted = 0;
```

### 2.3 platform-audit 的具体实现（[P0]）

**AOP 注解驱动**：

```java
// platform-audit/src/main/java/com/metabuild/platform/audit/api/Audit.java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audit {
    /** 动作标识，例如 "iam.user.update" */
    String action();

    /** 目标实体类型 */
    String targetType();

    /** 目标 ID 的 SpEL 表达式，例如 "#cmd.userId" */
    String targetIdExpr() default "";

    /** 是否记录 before/after 快照 */
    boolean recordSnapshot() default true;
}
```

**业务层用法**：
```java
@Service
public class UserService implements UserApi {
    @Audit(action = "iam.user.update", targetType = "User", targetIdExpr = "#user.id")
    @Transactional
    public User update(User user) {
        // 业务逻辑
    }
}
```

**AOP 实现要点**：
- 方法执行前：通过 Repository 查询当前快照（before）
- 方法执行后：再次查询新快照（after）
- **异步写入** `sys_audit_log`（Spring `@Async + @EventListener`）
- **敏感字段脱敏**：密码、token 等字段通过 `@Sensitive` 注解或 JsonMapper 过滤

**审计日志表** `sys_audit_log`：
```sql
CREATE TABLE sys_audit_log (
    id             BIGINT       PRIMARY KEY,
    tenant_id      BIGINT       NOT NULL DEFAULT 0,
    user_id        BIGINT,                              -- 操作人（匿名时 NULL）
    username       VARCHAR(64),
    action         VARCHAR(128) NOT NULL,               -- iam.user.update
    target_type    VARCHAR(64)  NOT NULL,               -- User
    target_id      VARCHAR(64),                         -- 目标 ID
    before_json    JSONB,                               -- 变更前快照
    after_json     JSONB,                               -- 变更后快照
    client_ip      VARCHAR(45),                         -- IPv6 兼容
    user_agent     VARCHAR(512),
    trace_id       VARCHAR(64),                         -- 关联日志
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_audit_log_tenant_action_time
    ON sys_audit_log (tenant_id, action, created_at DESC);
CREATE INDEX idx_sys_audit_log_tenant_target
    ON sys_audit_log (tenant_id, target_type, target_id);
```

**保留期**：默认 **90 天**（配置 `mb.audit.retention-days`），过期数据由 `platform-job` 的清理任务删除。

## 3. iam 大模块的内部子领域 [M4]

iam 有意收敛，内部按子领域组织：

```
com.metabuild.platform.iam/
├── api/                  # 整个 iam 模块的对外 API 出口
│   ├── UserApi.java
│   ├── RoleApi.java
│   ├── MenuApi.java
│   ├── DeptApi.java
│   ├── AuthApi.java
│   ├── PermissionApi.java
│   └── dto/
├── domain/
│   ├── user/             # 用户管理
│   ├── role/             # 角色管理
│   ├── menu/             # 菜单（动态）
│   ├── dept/             # 部门树
│   ├── permission/       # 权限点
│   ├── datascope/        # 数据范围规则
│   ├── auth/             # 认证 / 登录
│   └── session/          # 在线用户 + 登录日志
├── infrastructure/
│   └── [镜像 domain 结构]
└── web/
    ├── UserController.java
    ├── RoleController.java
    └── ...
```

子领域之间可以自由互相 import（都在同一个 platform-iam Maven 模块内），但跨 iam 模块（例如 audit → iam）时只能通过 `api` 包。

## 4. 业务模块的标准骨架 [M4]

每个新增的 platform / business 模块都要有以下文件：

```
platform-<name>/  (或 business-<name>/)
├── pom.xml                               # 继承 mb-platform/mb-business parent
├── src/main/java/com/metabuild/<layer>/<name>/
│   ├── api/                              # 对外契约
│   │   ├── <Name>Api.java                # 接口
│   │   └── dto/
│   │       ├── <Name>View.java
│   │       ├── <Name>CreateCommand.java
│   │       └── <Name>Query.java
│   ├── domain/                           # 业务逻辑
│   │   └── <Name>Service.java            # implements <Name>Api
│   ├── infrastructure/                   # 数据访问
│   │   └── <Name>Repository.java         # 普通类（方案 E：数据权限在 jOOQ VisitListener 层拦截，Repository 零继承）
│   └── web/                              # Controller
│       └── <Name>Controller.java         # @RequirePermission
├── src/main/resources/
│   ├── messages/
│   │   ├── <name>_zh_CN.properties       # 错误消息 + i18n key
│   │   └── <name>_en_US.properties
│   └── META-INF/spring/
│       └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
└── src/test/java/com/metabuild/<layer>/<name>/
    ├── <Name>ServiceTest.java            # 单元测试（mock Repository 和 CurrentUser）
    └── <Name>IntegrationTest.java        # 集成测试（继承 BaseIntegrationTest + TestSecurityConfig）
```

**Controller 的标准骨架**（展示 Sa-Token 零感知 + 审计 + 权限）：

```java
@RestController
@RequestMapping("/api/v1/<layer>/<name>s")
@RequiredArgsConstructor
@Tag(name = "<Name>")
public class <Name>Controller {

    private final <Name>Api api;

    @GetMapping("/{id}")
    @Operation(summary = "查询详情")
    @RequirePermission("<layer>.<name>.view")
    public <Name>View getById(@PathVariable Long id) {
        return api.findById(id);
    }

    @PostMapping
    @Operation(summary = "创建")
    @RequirePermission("<layer>.<name>.create")
    public <Name>View create(@RequestBody @Valid <Name>CreateCommand cmd) {
        return api.create(cmd);
    }
}
```

**Service 的标准骨架**（展示 CurrentUser 门面 + 审计 + 事件发布）：

```java
@Service
@RequiredArgsConstructor
public class <Name>Service implements <Name>Api {

    private final <Name>Repository repository;
    private final CurrentUser currentUser;              // Sa-Token 门面
    private final ApplicationEventPublisher events;

    @Override
    @Transactional(readOnly = true)
    public <Name>View findById(Long id) {
        return repository.findById(id)
            .map(<Name>View::from)
            .orElseThrow(() -> new NotFoundException("<layer>.<name>.notFound"));
    }

    @Override
    @Audit(action = "<layer>.<name>.create", targetType = "<Name>", targetIdExpr = "#result.id")
    @Transactional
    public <Name>View create(<Name>CreateCommand cmd) {
        Long currentUserId = currentUser.userId();      // 通过门面获取，零 Sa-Token 引用
        <Name> entity = new <Name>(cmd, currentUserId);
        entity = repository.save(entity);
        events.publishEvent(new <Name>CreatedEvent(entity.id(), currentUserId));
        return <Name>View.from(entity);
    }
}
```

## 5. 新增业务模块的完整操作流程（12 步清单）[P0]

这是 meta-build 最核心的"使用者故事"。一个陌生开发者按下面的 12 步应该能从零到一加一个业务模块。

### 示例：加一个 `business-order` 订单模块

**步骤 1：在 `server/mb-business/` 下新建 `business-order/` 目录**
```bash
mkdir -p server/mb-business/business-order/src/main/java/com/metabuild/business/order/{api,domain,infrastructure,web}
mkdir -p server/mb-business/business-order/src/main/resources/messages
mkdir -p server/mb-business/business-order/src/test/java/com/metabuild/business/order
```

**步骤 2：写 `business-order/pom.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.metabuild</groupId>
        <artifactId>mb-business</artifactId>
        <version>${revision}</version>
    </parent>
    <artifactId>business-order</artifactId>

    <dependencies>
        <!-- 必备基础 -->
        <dependency><groupId>com.metabuild</groupId><artifactId>mb-common</artifactId></dependency>
        <dependency><groupId>com.metabuild</groupId><artifactId>mb-schema</artifactId></dependency>
        <!-- 需要的 infra 能力 -->
        <dependency><groupId>com.metabuild</groupId><artifactId>infra-security</artifactId></dependency>
        <dependency><groupId>com.metabuild</groupId><artifactId>infra-jooq</artifactId></dependency>
        <dependency><groupId>com.metabuild</groupId><artifactId>infra-cache</artifactId></dependency>
        <dependency><groupId>com.metabuild</groupId><artifactId>infra-exception</artifactId></dependency>
        <!-- 跨模块依赖：需要 iam 的 UserApi 和 file 的 FileApi -->
        <dependency><groupId>com.metabuild</groupId><artifactId>platform-iam</artifactId></dependency>
        <dependency><groupId>com.metabuild</groupId><artifactId>platform-file</artifactId></dependency>
        <!-- 需要审计？依赖 platform-audit 的 api -->
        <dependency><groupId>com.metabuild</groupId><artifactId>platform-audit</artifactId></dependency>
    </dependencies>
</project>
```

**步骤 3：创建 Java 包和 `api / domain / infrastructure / web` 四层子包**
（目录已在步骤 1 创建，这步只需要写 Java 文件）

**步骤 4：写 `OrderApi` 接口放 `api` 子包**
```java
// business-order/src/main/java/com/metabuild/business/order/api/OrderApi.java
package com.metabuild.business.order.api;

public interface OrderApi {
    OrderView findById(Long id);
    PageResult<OrderView> page(OrderQuery query);
    OrderView create(OrderCreateCommand cmd);
    OrderView submit(Long orderId);
    OrderView cancel(Long orderId, String reason);
}
```

**步骤 5：写 Java 包的 package-info.java（文档层约定）**
```java
// business-order/src/main/java/com/metabuild/business/order/package-info.java
/**
 * 订单业务模块（canonical reference 示例）。
 *
 * 跨模块依赖（由 pom.xml 和 ArchUnit 规则双保险）：
 * - platform-iam::api   （需要 UserApi 查询用户）
 * - platform-file::api  （需要 FileApi 存储订单附件）
 * - platform-audit::api （需要 Audit 注解记录操作日志）
 *
 * 发布的领域事件：
 * - OrderCreatedEvent
 * - OrderSubmittedEvent
 * - OrderCancelledEvent
 */
package com.metabuild.business.order;
```

**步骤 6：在 `mb-schema/src/main/resources/db/migration/` 加 Flyway SQL**

> **命名规范**（ADR-0008）：使用时间戳命名 `V<yyyymmdd>_<nnn>__<module>_<table>.sql`。`business-order` 的 module 前缀是 `business_order_`，用 `date +%Y%m%d` 生成当日日期，同日第 N 个 migration 用三位序号 `001` / `002`。完整规范见 [04-data-persistence.md §5 Flyway 脚本组织](04-data-persistence.md#5-flyway-脚本组织-m1m4)。

```sql
-- V20260702_001__business_order_main.sql
CREATE TABLE biz_order_main (
    id            BIGINT       PRIMARY KEY,
    tenant_id     BIGINT       NOT NULL DEFAULT 0,
    order_no      VARCHAR(64)  NOT NULL,
    user_id       BIGINT       NOT NULL,
    status        SMALLINT     NOT NULL DEFAULT 0,
    total_amount  DECIMAL(18,2) NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INT          NOT NULL DEFAULT 0,
    created_by    BIGINT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    BIGINT,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_biz_order_tenant_no
    ON biz_order_main (tenant_id, order_no) WHERE deleted = 0;
CREATE INDEX idx_biz_order_tenant_user ON biz_order_main (tenant_id, user_id);
```

**步骤 7：在 `mb-business/pom.xml` 注册新 module**
```xml
<modules>
    <module>business-order</module>
    <!-- 其他模块 -->
</modules>
```

**步骤 8：在 `mb-admin/pom.xml` 添加对 `business-order` 的依赖**
```xml
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>business-order</artifactId>
</dependency>
```

**步骤 9：运行 jOOQ codegen 重新生成 schema 类型**
```bash
cd server && mvn -Pcodegen generate-sources -pl mb-schema
```
生成的 `com.metabuild.schema.tables.BizOrderMain` 和 `BizOrderMainRecord` 进入 `mb-schema/src/main/jooq-generated/`，**commit 到 git**。

**步骤 10：写 Service / Repository / Controller**

按 4.4 节的标准骨架写代码。关键约束：
- Service 不 `import org.jooq.*`（ArchUnit 强制）
- Controller 不 `import cn.dev33.satoken.*`（ArchUnit 强制，通过 `CurrentUser` / `AuthFacade` 门面）
- Repository 是**普通类**——方案 E 不再需要继承任何基类。数据权限由 `DataScopeVisitListener` 在 jOOQ 层单点拦截，**前提是在 `DataScopeConfig` 里把新表注册到 `DataScopeRegistry`**（见步骤 10.1）
- Repository 禁止使用 jOOQ 的 `@PlainSQL` API（`fetch(String)` 等），由 ArchUnit 规则 `NO_RAW_SQL_FETCH` 强制
- Controller 每个方法标注 `@RequirePermission("business.order.<action>")`

**步骤 10.1（新加业务表时的必补步骤）**：在 `mb-admin/src/main/java/com/metabuild/admin/config/DataScopeConfig.java` 里添加：

```java
registry.register("biz_order_main", "owner_dept_id");
```

**漏注册的后果**：表可以正常读写，但数据权限**不会生效**（超权风险）。`NO_RAW_SQL_FETCH` 规则挡不住这个漏洞——它只挡原始 SQL 绕过。这是方案 E 需要使用者心智参与的唯一地方，通过 canonical reference 示范 + code review 强化。

**步骤 11：写集成测试**
```java
// business-order/src/test/java/com/metabuild/business/order/OrderServiceIntegrationTest.java
@SpringBootTest
@Import(TestSecurityConfig.class)
class OrderServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private OrderApi orderApi;
    @Autowired private MockCurrentUser currentUser;

    @BeforeEach
    void setup() {
        currentUser.clear();
    }

    @Test
    void user_with_permission_can_create_order() {
        currentUser.asUser(100L, "alice", "business.order.create");
        OrderView view = orderApi.create(new OrderCreateCommand(...));
        assertThat(view.id()).isNotNull();
    }

    @Test
    void user_without_permission_fails_to_create() {
        currentUser.asUser(100L, "alice");  // 没有任何权限
        assertThatThrownBy(() ->
            orderApi.create(new OrderCreateCommand(...))
        ).isInstanceOf(ForbiddenException.class);
    }
}
```

**步骤 12：运行 `mvn verify` 确认所有测试通过**
```bash
cd server && mvn -pl mb-admin verify
```

这会触发：
- `business-order` 的单元测试和集成测试
- `mb-admin` 里的 `ArchitectureTest`（确认 Sa-Token 隔离、jOOQ 隔离、跨模块规则等全部通过）
- `mb-admin` 里的 `BaseIntegrationTest` 继承者（包括 `business-order` 的集成测试）

**额外步骤（如需权限控制）**：在 `iam` 模块里通过 SQL 初始化或管理界面登记 `business.order.create / view / update / delete / submit / cancel` 权限点，绑定到相应角色。

<!-- verify: test -f server/mb-business/business-order/pom.xml && ls server/mb-schema/src/main/resources/db/migration/V[0-9]*__business_order_main.sql >/dev/null && cd server && mvn -pl business-order verify -->

---

[← 返回 README](./README.md)
