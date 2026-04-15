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
| 2 | `platform-log` | 操作日志（**`@OperationLog` 注解 + AOP + `mb_log_operation`**） | `OperationLogApi` | audit + log |
| 3 | `platform-file` | 文件上传 + 本地/阿里云 OSS 存储 + 附件元数据 | `FileApi`, `FileStorage` | file |
| 4 | `platform-notification` | 通知公告 + 站内信 + 邮件 + 短信 + Webhook | `NotificationApi` | notice（扩展） |
| 5 | `platform-dict` | 字典 + 枚举管理 | `DictApi` | dict |
| 6 | `platform-config` | 运行时配置 + 业务参数 | `ConfigApi` | config |
| 7 | `platform-job` | 定时任务（**Spring `@Scheduled` + ShedLock**）+ 执行历史 | `JobApi` | job + job-log |
| 8 | `platform-monitor` | 服务器资源 + 慢查询监控 + 健康检查 | `MonitorApi` | monitor |

### 2.1 platform-job 的具体技术选择（[P0]）

- **定时调度**：Spring `@Scheduled`（单体应用的最简方案）
- **分布式锁**：[ShedLock](https://github.com/lukas-krecan/ShedLock)（防多实例重复执行）
- **锁存储**：JDBC 表 `shedlock`（由 `platform-job` 通过 Flyway migration 建表，ADR-0008 时间戳命名，例如 `V20260603_005__shedlock.sql`）
- **执行历史**：`mb_job_log` 表，记录每次执行的 trigger_time / duration / status / error_message

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

**可选实现**：`AliyunOssFileStorage`
- 通过 `MB_FILE_STORAGE_TYPE=oss` 启用
- 依赖 `com.aliyun.oss:aliyun-sdk-oss:3.x`
- 环境变量：`MB_FILE_STORAGE_OSS_ENDPOINT` / `MB_FILE_STORAGE_OSS_ACCESS_KEY` / `MB_FILE_STORAGE_OSS_SECRET_KEY` / `MB_FILE_STORAGE_OSS_BUCKET`

**文件限制**：
- 默认最大 **10MB**（`MB_FILE_MAX_SIZE`）
- 默认允许的 MIME：`image/* + application/pdf + application/zip + application/json`
- **双重校验**（扩展名 + MIME type），避免伪装

**元数据表** `mb_file_metadata`：
```sql
CREATE TABLE mb_file_metadata (
    id                BIGINT       PRIMARY KEY,
    tenant_id         BIGINT       NOT NULL DEFAULT 0,
    original_filename VARCHAR(255) NOT NULL,
    content_type      VARCHAR(128) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    sha256            VARCHAR(64)  NOT NULL,
    storage_type      VARCHAR(16)  NOT NULL,  -- local / oss
    storage_path      VARCHAR(512) NOT NULL,
    version           INT          NOT NULL DEFAULT 0,
    created_by        BIGINT       NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by        BIGINT       NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uk_mb_file_tenant_sha256
    ON mb_file_metadata (tenant_id, sha256);
```

### 2.3 platform-log 的具体实现（[P0]）

**定位**：操作日志，记录 Controller 入参/返回值级别的用户操作，不做字段级 before/after 快照。

**AOP 注解驱动**（注解标注在 **Controller 层**，不在 Service 层）：

```java
// platform-log/src/main/java/com/metabuild/platform/oplog/api/OperationLog.java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {
    /** 操作标识（操作日志 action 用点分隔，权限码用冒号分隔），如 "iam.user.create" */
    String action();

    /** 模块名（空则自动推断 Controller 类名前缀） */
    String module() default "";

    /** 是否记录入参（默认 true，密码等敏感字段须在 DTO 上标 @Sensitive 脱敏） */
    boolean recordRequestBody() default true;

    /** 是否记录返回值（默认 false，避免大对象入库） */
    boolean recordResponseBody() default false;
}
```

**Controller 层用法**：
```java
@RestController
@RequestMapping("/api/v1/iam/users")
@RequiredArgsConstructor
public class UserController {

    private final UserApi api;

    @PostMapping
    @RequirePermission("iam:user:create")
    @OperationLog(action = "iam.user.create", module = "iam")
    public UserView create(@RequestBody @Valid UserCreateCommand cmd) {
        return api.create(cmd);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:user:update")
    @OperationLog(action = "iam.user.update", module = "iam")
    public UserView update(@PathVariable Long id, @RequestBody @Valid UserUpdateCommand cmd) {
        return api.update(id, cmd);
    }
}
```

**AOP 实现要点（`OperationLogAspect`）**：
- 在 Controller 层拦截 `@OperationLog` 标注的方法
- 通过 `HttpServletRequest` 获取 IP、User-Agent、URL、HTTP method
- 通过 `CurrentUser` 获取操作人（userId + username）
- 入参脱敏：DTO 字段上标 `@Sensitive` 的通过 JsonMapper 过滤（密码、token 等）
- **异步写入**（提交到 `@Async` 线程池，不阻塞主流程）
- 记录执行耗时（`System.nanoTime()` 差值换算毫秒）
- 捕获方法抛出的异常，status 记为 `FAILURE`，error_message 填异常消息

**操作日志表** `mb_log_operation`：

> 注意：操作日志是只追加不更新的表，**没有 version / updated_by / updated_at 字段**。

```sql
CREATE TABLE mb_log_operation (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    user_id         BIGINT NOT NULL,
    username        VARCHAR(64),
    action          VARCHAR(128) NOT NULL,       -- 操作标识，如 iam.user.create
    module          VARCHAR(64),                 -- 模块名，如 iam
    method          VARCHAR(16),                 -- HTTP method: GET/POST/PUT/DELETE
    url             VARCHAR(512),                -- 请求路径
    request_body    JSONB,                       -- 入参（脱敏后）
    response_body   JSONB,                       -- 返回值摘要（可选，大对象不记）
    status          VARCHAR(16) NOT NULL,        -- SUCCESS / FAILURE
    error_message   TEXT,                        -- 失败时的错误信息
    duration_ms     INT,                         -- 执行耗时（毫秒）
    ip              VARCHAR(64),                 -- 客户端 IP
    user_agent      VARCHAR(512),                -- User-Agent
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mb_log_operation_tenant_user ON mb_log_operation (tenant_id, user_id);
CREATE INDEX idx_mb_log_operation_tenant_action ON mb_log_operation (tenant_id, action);
CREATE INDEX idx_mb_log_operation_created_at ON mb_log_operation (created_at);
```

**`OperationLogWriter`**（异步写入组件）：
```java
// platform-log/src/main/java/com/metabuild/platform/oplog/domain/OperationLogWriter.java
@Component
@RequiredArgsConstructor
public class OperationLogWriter {

    private final OperationLogRepository repository;

    /** 异步写入，不影响主流程事务 */
    @Async
    public void write(OperationLogRecord record) {
        repository.insert(record);
    }
}
```

**保留期**：默认 **90 天**（配置 `mb.oplog.retention-days`），过期数据由 `platform-job` 的清理任务删除。

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
└── web/
    ├── UserController.java
    ├── RoleController.java
    └── ...
```

子领域之间可以自由互相 import（都在同一个 platform-iam Maven 模块内），但跨 iam 模块（例如 audit → iam）时只能通过 `api` 包。

### 3.0 基础 IAM 表 [M4]

`mb_iam_role`、`mb_iam_dept`、`mb_iam_user_role` 是权限双树和数据范围的基础依赖表，在 §3.1 双树表之前建立。

```sql
-- 角色表
CREATE TABLE mb_iam_role (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    code            VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     VARCHAR(512),
    data_scope      VARCHAR(32) NOT NULL DEFAULT 'SELF',  -- SELF / DEPT / DEPT_AND_CHILDREN / ALL / CUSTOM_DEPT
    version         INT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);

-- 部门表（树状结构）
CREATE TABLE mb_iam_dept (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    parent_id       BIGINT,                          -- 自引用，NULL 为顶级
    name            VARCHAR(128) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mb_iam_dept_tenant_parent ON mb_iam_dept (tenant_id, parent_id);

-- 用户-角色关联表
CREATE TABLE mb_iam_user_role (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    user_id         BIGINT NOT NULL,                 -- → mb_iam_user.id
    role_id         BIGINT NOT NULL,                 -- → mb_iam_role.id
    version         INT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id, role_id)
);
```

### 3.1 权限双树表结构 [M4]

iam 模块实现权限双树架构：**路由树**（前端路由扫描产物，只读）+ **菜单树**（运维自由配置）。两棵树通过 `route_ref_id` 关联，角色授权挂在菜单节点上，最终权限点通过 JOIN 路由树的 `code` 字段推导。

```sql
-- 路由树（前端路由扫描产物，只读，由 RouteTreeSyncRunner 启动时同步）
CREATE TABLE mb_iam_route_tree (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    kind            VARCHAR(16) NOT NULL CHECK (kind IN ('menu', 'button')),
    code            VARCHAR(128) NOT NULL,         -- 权限点 code，如 iam.user.create
    default_name    VARCHAR(128) NOT NULL,          -- 默认显示名
    path            VARCHAR(256),                   -- 前端路由路径（仅 menu 类型有）
    parent_code     VARCHAR(128),                   -- 父级 code（仅 button 类型有，指向所属页面）
    description     VARCHAR(512),
    is_stale        BOOLEAN NOT NULL DEFAULT FALSE, -- 前端删除后标记为 stale，不物理删除
    last_seen_at    TIMESTAMPTZ NOT NULL,
    version         INT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);

-- 菜单树（运维自由配置，引用路由树节点）
CREATE TABLE mb_iam_menu (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    parent_id       BIGINT,                         -- 自引用，树状结构
    route_ref_id    BIGINT,                         -- → mb_iam_route_tree.id（directory 节点为 NULL）
    kind            VARCHAR(16) NOT NULL CHECK (kind IN ('directory', 'menu', 'button')),
    name            VARCHAR(128) NOT NULL,           -- 菜单显示名（不走 i18n，普通 VARCHAR）
    icon            VARCHAR(256),
    sort_order      INT NOT NULL DEFAULT 0,
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    version         INT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mb_iam_menu_tenant_parent ON mb_iam_menu (tenant_id, parent_id);
CREATE INDEX idx_mb_iam_menu_tenant_route_ref ON mb_iam_menu (tenant_id, route_ref_id);

-- 角色-菜单关联（关联到菜单节点，不直接关联权限点 code）
CREATE TABLE mb_iam_role_menu (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    role_id         BIGINT NOT NULL,                -- → mb_iam_role.id
    menu_id         BIGINT NOT NULL,                -- → mb_iam_menu.id
    version         INT NOT NULL DEFAULT 0,
    created_by      BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, role_id, menu_id)
);
```

**设计要点**：
- `mb_iam_route_tree` 是只读的，由 `RouteTreeSyncRunner` 启动时从前端路由清单同步
- `mb_iam_menu` 是运维可配置的菜单树，通过 `route_ref_id` 引用路由树节点
- `mb_iam_role_menu` 关联角色到菜单节点（不直接关联权限点 code），运维改菜单层次不影响授权数据
- 最终权限点通过 JOIN `mb_iam_route_tree.code` 推导

### 3.2 RouteTreeSyncRunner（启动时路由树同步）[M4]

应用启动时从 `route-tree.json` 同步路由树到 `mb_iam_route_tree` 表。前端构建产物包含完整路由清单，后端读取后做 upsert。

```java
/**
 * 应用启动时从 route-tree.json 同步路由树到 mb_iam_route_tree 表。
 * 配置项：mb.route-tree.path（默认 classpath:route-tree.json）
 */
@Component
@RequiredArgsConstructor
public class RouteTreeSyncRunner implements ApplicationRunner {

    private final RouteTreeRepository routeTreeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<RouteTreeNodeDto> nodes = loadRouteTreeJson();
        Set<String> seenCodes = new HashSet<>();

        for (RouteTreeNodeDto node : nodes) {
            routeTreeRepository.upsertByCode(node, Instant.now());
            seenCodes.add(node.code());
        }

        // 本次扫描没出现的 code → 标记为 stale（不物理删除，避免菜单悬空引用）
        routeTreeRepository.markStale(seenCodes, Instant.now());
    }
}
```

**upsert 逻辑**：
- code 不存在 → 插入，`is_stale=false`
- code 已存在且 `is_stale=false` → 更新 `default_name/path/parent_code/description/last_seen_at`
- code 已存在且 `is_stale=true`（之前标记为 stale 又加回来）→ 复活：`is_stale=false` + 更新所有字段

### 3.3 MenuApi（跨模块菜单接口）[M4]

```java
/**
 * 菜单模块对外 API（跨模块调用接口）。
 */
public interface MenuApi {

    /** 查询当前用户可见菜单树 + 权限点列表 */
    CurrentUserMenuResult queryCurrentUserMenu(long userId, long tenantId);

    /** 查询完整菜单树（管理端用） */
    List<MenuTreeNode> queryMenuTreeForAdmin(long tenantId);

    /** 查询路由树节点（菜单管理 UI 的路由 picker） */
    List<RouteTreeNodeView> listRouteTreeNodes(String kindFilter, boolean includeStale);
}
```

对应的 HTTP 端点（MenuController）：

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET /api/v1/menus/current-user` | 当前用户菜单 + 权限 | 返回 `CurrentUserMenuResult`（扁平节点列表 + permissions 数组） |
| `GET /api/v1/menus` | 管理端完整菜单树 | `@RequirePermission("iam:menu:list")` |
| `POST /api/v1/menus` | 创建菜单节点 | `@RequirePermission("iam:menu:create")` |
| `PATCH /api/v1/menus/{id}/route-ref` | 重新绑定路由引用 | `@RequirePermission("iam:menu:update")` |
| `GET /api/v1/route-tree-nodes` | 路由树节点列表 | `@RequirePermission("iam:menu:list")` |

`GET /api/v1/menus/current-user` 返回体 DTO 结构：

```java
/**
 * 当前用户菜单 + 权限（前端 useMenu() 消费）。
 * 返回扁平节点列表（前端自己 buildMenuTree）+ 权限 code 数组。
 */
public record CurrentUserMenuResult(
    List<MenuNodeView> nodes,       // 扁平菜单节点列表
    List<String> permissions        // 权限点 code 列表（用于构造 Set<AppPermission>）
) {}

public record MenuNodeView(
    long id,
    Long parentId,                  // NULL 为顶级
    String name,
    String icon,
    String path,                    // 前端路由路径（仅 menu 类型有）
    String kind,                    // directory / menu / button
    String permissionCode,          // 对应 mb_iam_route_tree.code（button 类型有）
    boolean isOrphan                // route_ref 指向的 route_tree 节点 is_stale=true
) {}
```

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
│   ├── domain/                           # 业务逻辑（Service + Repository，不拆 infrastructure）
│   │   ├── <Name>Service.java            # implements <Name>Api
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
    @RequirePermission("<layer>:<name>:view")
    public <Name>View getById(@PathVariable Long id) {
        return api.findById(id);
    }

    @PostMapping
    @Operation(summary = "创建")
    @RequirePermission("<layer>:<name>:create")
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
mkdir -p server/mb-business/business-order/src/main/java/com/metabuild/business/order/{api,domain,web}
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
        <dependency><groupId>com.metabuild</groupId><artifactId>infra-web</artifactId></dependency>
        <!-- 跨模块依赖：需要 iam 的 UserApi 和 file 的 FileApi -->
        <dependency><groupId>com.metabuild</groupId><artifactId>platform-iam</artifactId></dependency>
        <dependency><groupId>com.metabuild</groupId><artifactId>platform-file</artifactId></dependency>
        <!-- 需要操作日志？依赖 platform-log 的 api -->
        <dependency><groupId>com.metabuild</groupId><artifactId>platform-log</artifactId></dependency>
    </dependencies>
</project>
```

**步骤 3：创建 Java 包和 `api / domain / web` 三层子包**
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
 * - platform-log::api （需要 OperationLog 注解记录操作日志）
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
    owner_dept_id BIGINT       NOT NULL,            -- 数据权限关联列（DataScopeRegistry 按此字段过滤）
    status        SMALLINT     NOT NULL DEFAULT 0,
    total_amount  DECIMAL(18,2) NOT NULL,
    version       INT          NOT NULL DEFAULT 0,
    created_by    BIGINT       NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by    BIGINT       NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_biz_order_tenant_no
    ON biz_order_main (tenant_id, order_no);
CREATE INDEX idx_biz_order_tenant_user    ON biz_order_main (tenant_id, user_id);
CREATE INDEX idx_biz_order_tenant_dept    ON biz_order_main (tenant_id, owner_dept_id);
CREATE INDEX idx_biz_order_tenant_created ON biz_order_main (tenant_id, created_at DESC);
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

**步骤 3.5：明确一个业务实体的完整类清单**（此步骤概念上属于步骤 3 的补充，在开始写任何 Java 文件之前确认清单）

每个业务实体对应以下文件（详见 [01-module-structure.md §4](01-module-structure.md)）：

| 文件 | 位置 | 角色 |
|---|---|---|
| `<Entity>View.java` | `api/dto/` | API 响应 DTO（record + `from()` 静态工厂）|
| `<Entity>CreateCommand.java` | `api/dto/` | API 创建请求（record）|
| `<Entity>Update<Action>Command.java` | `api/dto/` | API 更新/业务动作请求（按业务语义命名，record）|
| `<Entity>Query.java` | `api/dto/` | API 查询条件（record）|
| `<Entity>CreatedEvent.java` | `api/event/` | 领域事件（record）|
| `<Entity>Api.java` | `api/` | 跨模块调用接口 |
| `<Entity>Service.java` | `domain/<aggregate>/` | `implements <Entity>Api`，业务编排 |
| `<Entity>Repository.java` | `domain/<aggregate>/` | 持久化 class（唯一持有 DSLContext）|
| `<Entity>Controller.java` | `web/` | HTTP 入口（`@RequirePermission` 放这里）|

**不需要** `<Entity>` 独立领域 record——Service 直接用 `<Entity>Record`（jOOQ 生成）。

**步骤 10：写 Service / Repository / Controller**

按 [01-module-structure.md §4](01-module-structure.md) 的层次职责划分写代码。关键约束：
- Service 对 `org.jooq` 的依赖仅限 `Record` / `Result` / `exception` 白名单（ArchUnit 规则 `SERVICE_JOOQ_WHITELIST` 强制，`DSLContext` / `DSL` / `Field` / `Condition` 等一律禁止）
- Service 不直接调 `record.store()`，通过 `orderRepository.save(record)` 包装（N3 §4.2）
- Controller 不 `import cn.dev33.satoken.*`（ArchUnit 强制，通过 `CurrentUser` / `AuthFacade` 门面）
- Repository 是**普通类**——方案 E 不再需要继承任何基类。数据权限由 `DataScopeVisitListener` 在 jOOQ 层单点拦截，**前提是在 `DataScopeConfig` 里把新表注册到 `DataScopeRegistry`**（见步骤 10.1）
- Repository 禁止使用 jOOQ 的 `@PlainSQL` API（`fetch(String)` 等），由 ArchUnit 规则 `NO_RAW_SQL_FETCH` 强制
- Controller 每个方法标注 `@RequirePermission("business:order:<action>")`（**权限只能在 Controller 层，不在 Service 层**，详见 [05-security.md §2.5](05-security.md)）

**步骤 10.1（新加业务表时的必补步骤）**：在 `mb-admin/src/main/java/com/metabuild/admin/config/DataScopeConfig.java` 里添加：

```java
registry.register("biz_order_main", "owner_dept_id");
```

**漏注册的后果**：表可以正常读写，但数据权限**不会生效**（超权风险）。`NO_RAW_SQL_FETCH` 规则挡不住这个漏洞——它只挡原始 SQL 绕过。这是方案 E 需要使用者心智参与的唯一地方，通过 canonical reference 示范 + code review 强化。

**步骤 10.2**：确认业务表 DDL 包含 `owner_dept_id BIGINT NOT NULL` 字段 + 索引 `idx_xxx_tenant_dept (tenant_id, owner_dept_id)`。RecordListener 会在 INSERT 时自动从 `CurrentUser.deptId()` 填充。

**步骤 11：写集成测试**

集成测试必须放在 `mb-admin/src/test/java/` 下，原因：`@SpringBootTest` 需要完整应用上下文（含所有 platform-* 模块），而 `business-order` 自身没有 Spring Boot starter，无法独立启动。

```java
// mb-admin/src/test/java/com/metabuild/admin/order/OrderServiceIntegrationTest.java
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
        currentUser.asUser(100L, "alice", "business:order:create");
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

**额外步骤（如需权限控制）**：在 `iam` 模块里通过 SQL 初始化或管理界面登记 `business:order:create / view / update / delete / submit / cancel` 权限点，绑定到相应角色。

<!-- verify: test -f server/mb-business/business-order/pom.xml && ls server/mb-schema/src/main/resources/db/migration/V[0-9]*__business_order_main.sql >/dev/null && cd server && mvn -pl business-order verify -->

---

[← 返回 README](./README.md)
