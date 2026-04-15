# 05 - 安全模型

> **关注点**：Sa-Token JWT Simple 模式 + Refresh Token Rotation、`CurrentUser` 读门面、`AuthFacade` 写门面、`@RequirePermission` 注解、CORS、Web 安全基线（XSS/CSRF）、敏感配置、**方案 E 数据权限**（DataScopeRegistry + DataScopeVisitListener + BypassDataScopeAspect）。
>
> **本文件吸收原 backend-architecture.md §8（安全模型）+ §5.3（数据权限方案 E）**。这是本目录最长的文件，因为安全相关的所有概念高度内聚，硬拆会让交叉引用爆炸。
>
> **关键 ADR**：[ADR-0005 Sa-Token + CurrentUser 门面](../../adr/0005-认证框架切换到sa-token加currentuser门面层.md)、[ADR-0007 继承遗产前先问原生哲学](../../adr/0007-继承遗产前先问原生哲学.md)（方案 E 触发点）。

> **ADR-0005**：本章是对规划文档决策 4 的翻转——从 Spring Security + JJWT 切换到 Sa-Token + CurrentUser 门面层 + `@RequirePermission` 自定义注解。

## 1. Sa-Token JWT Simple 模式

**选择 JWT Simple 模式**：JWT 格式 token + Redis 完整会话管理。每次请求查 Redis 验证 token 有效性和会话数据。支持全部 Sa-Token 能力（踢人下线、会话管理、账号封禁等）。

| Token 类型 | 有效期 | 载体 | 存储 |
|-----------|------|------|------|
| **access** | 30 分钟（可配置） | JWT（自签） | Redis 会话 |
| **refresh** | 30 天（可配置） | JWT | Redis（一次性，rotation） |
| **黑名单** | token 过期时长 | Redis | `sa-token:black:tokenValue` |

- **签名算法**: HS256
- **密钥来源**: 环境变量 `MB_JWT_SECRET`（**无默认值**，缺失时启动失败）
- **token 传递**: HTTP header `Authorization: Bearer <jwt>`

**Sa-Token 配置**（`application.yml`）：
```yaml
sa-token:
  token-name: Authorization
  token-prefix: Bearer
  timeout: 1800                    # access token 30 分钟
  active-timeout: -1               # 由 refresh 机制管理续期
  is-concurrent: true
  is-share: false                  # Simple 模式强制 false
  is-log: false
  jwt-secret-key: ${MB_JWT_SECRET}
```

**JWT 模式启用方式**（不是通过 `token-style` 配置，而是注册 StpLogic Bean）：

```java
@Configuration
public class SaTokenJwtConfig {
    @Bean
    public StpLogic getStpLogicJwt() {
        return new StpLogicJwtForSimple();
    }
}
```

**Maven 依赖**：`sa-token-jwt`（在 `mb-infra/infra-security/pom.xml` 中引入）。

### 1.0.1 Token 刷新机制（Refresh Token Rotation）

v1 采用 access token（30 分钟）+ refresh token（30 天）+ rotation 机制：

1. **登录时**：`AuthFacade.doLogin()` 签发 access token + refresh token，refresh token 存入 Redis（key: `mb:auth:refresh:{tokenValue}`，TTL 30 天）
2. **正常请求**：携带 access token，Sa-Token 从 Redis 验证会话
3. **access 过期时**：前端拿 refresh token 调 `/api/auth/refresh`
4. **refresh 端点行为**：
   - 验证 refresh token 有效
   - **作废旧 refresh token**（Redis 删除）
   - 签发新 access token + 新 refresh token
   - 返回给前端
5. **Rotation 入侵检测**：如果一个已作废的 refresh token 被再次使用，说明该 token 已泄漏 → 立即吊销该用户所有 token（`AuthFacade.kickoutAll()`）→ 记录安全告警日志

**配置项**：

| 配置 | 默认值 | 说明 |
|------|--------|------|
| `mb.auth.access-timeout` | `1800`（30 分钟） | Access token 有效期（秒） |
| `mb.auth.refresh-timeout` | `2592000`（30 天） | Refresh token 有效期（秒） |
| `mb.auth.refresh-rotation` | `true` | 是否启用 rotation（强烈建议不要关闭） |

**AuthFacade 接口扩展**：

```java
public interface AuthFacade {
    LoginResult doLogin(Long userId, SessionData sessionData);  // 签发 access + refresh
    LoginResult refresh(String refreshToken);                    // 刷新 token（rotation），返回新的双 token
    void logout();
    void kickoutAll(Long userId);
    // ...
}
```

**安全要点**：
- Refresh token **不随普通 API 请求发送**，仅在 `/api/auth/refresh` 端点使用
- v1 前端将 access token 和 refresh token 均存储在 `localStorage`。v1.5+ 视安全需求可将 refresh token 升级为 httpOnly cookie 存储（届时需同步引入 CSRF 防护机制）
- Rotation 检测到入侵时，除了吊销 token，还应通过 `@OperationLog` 记录安全事件

**登录代码**(业务层零 Sa-Token 引用，通过 `AuthFacade` 门面完成技术操作，详见 [§6.6](#66-authfacade登录登出技术门面))：

```java
// platform-iam/.../domain/auth/AuthService.java
@Service
@RequiredArgsConstructor
public class AuthService implements AuthApi {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DeptRepository deptRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthFacade authFacade;                // mb-common 接口，SaTokenAuthFacade 实现在 infra-security

    @Transactional(readOnly = true)
    public LoginResult login(LoginCmd cmd) {
        User user = userRepository.findByUsername(cmd.username())
            .orElseThrow(() -> new UnauthorizedException("iam.auth.invalidCredentials"));
        if (!passwordEncoder.matches(cmd.password(), user.passwordHash())) {
            throw new UnauthorizedException("iam.auth.invalidCredentials");
        }

        // 登录时算好数据范围（角色 → 部门展开），一次性存入 session
        DataScope dataScope = DataScopeLoader.load(user, roleRepository, deptRepository);

        // 通过 AuthFacade 颁发 token，业务层完全不 import cn.dev33.satoken.*
        return authFacade.doLogin(user.id(),
            new SessionData(user.id(), user.username(), user.tenantId(), dataScope, false));
    }
}
```

**关键约束**：
- `StpUtil` / `cn.dev33.satoken.*` 只能在 `infra-security` 模块内部出现（由 ArchUnit 规则 `ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN` 强制）
- 业务层（包括 `platform-iam`）要做"登录/登出/强制注销/刷新 token"等技术操作，**必须**通过 `AuthFacade` 门面（由 ArchUnit 规则 `BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN` 强制）
- `AuthFacade` 和 `CurrentUser` 是**对称的**一对门面：读取当前用户信息用 `CurrentUser`，执行认证技术操作用 `AuthFacade`

## 1.1 Sa-Token 异常处理

Sa-Token 抛出自己的异常类型，未显式处理时会落入 `GlobalExceptionHandler`（[06-api-and-contract.md §2](./06-api-and-contract.md)）的通用 `Exception` 兜底，返回 `500 Internal Server Error`——而不是语义正确的 `401 / 403`。

**`GlobalExceptionHandler` 中必须显式处理以下 Sa-Token 异常**：

```java
// mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/GlobalExceptionHandler.java
// （以下处理器需加入 §2 的 GlobalExceptionHandler）

@ExceptionHandler(cn.dev33.satoken.exception.NotLoginException.class)
public ProblemDetail handleNotLogin(NotLoginException ex, HttpServletRequest request) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
    detail.setTitle("Unauthorized");
    detail.setDetail("请先登录");
    detail.setProperty("code", "auth.notAuthenticated");
    return detail;
}

@ExceptionHandler(cn.dev33.satoken.exception.NotPermissionException.class)
public ProblemDetail handleNotPermission(NotPermissionException ex, HttpServletRequest request) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
    detail.setTitle("Forbidden");
    detail.setDetail("权限不足");
    detail.setProperty("code", "auth.permissionDenied");
    return detail;
}

@ExceptionHandler(cn.dev33.satoken.exception.NotRoleException.class)
public ProblemDetail handleNotRole(NotRoleException ex, HttpServletRequest request) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
    detail.setTitle("Forbidden");
    detail.setDetail("角色不满足");
    detail.setProperty("code", "auth.roleDenied");
    return detail;
}

@ExceptionHandler(cn.dev33.satoken.exception.DisableServiceException.class)
public ProblemDetail handleDisabled(DisableServiceException ex, HttpServletRequest request) {
    ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
    detail.setTitle("Forbidden");
    detail.setDetail("账户已被禁用");
    detail.setProperty("code", "auth.accountDisabled");
    return detail;
}
```

**注意**：`GlobalExceptionHandler` 定义在 `infra-exception` 模块（不在 `infra-security`），因此这些处理器需要声明对 `cn.dev33.satoken:sa-token-spring-boot3-starter` 的 `compileOnly` 或 `provided` 依赖，或者通过 `infra-security` 统一 re-export。具体依赖方式 [M1 时补]。

---

## 2. 权限模型 CurrentUser + @RequirePermission

### 2.1 权限点命名规范

格式: **冒号分隔字符串，三段式** `<module>:<resource>:<action>`（小驼峰 action，语义清晰即可）。与错误码格式有意区分——错误码用点分隔，权限码用冒号分隔，避免混淆。

AppPermission 生成链路（§13）保证前后端一致——后端 `@RequirePermission` 标什么字符串，前端联合类型就生成什么。

例:
- `iam:user:list`
- `iam:user:create`
- `iam:user:update`
- `iam:user:delete`
- `iam:role:assignPermission`
- `audit:log:export`
- `file:upload`
- `business:order:create`（业务模块用 `business` 前缀）

### 2.2 @RequirePermission 注解定义

```java
// mb-infra/infra-security/src/main/java/com/metabuild/infra/security/RequirePermission.java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {

    /** 需要的权限点，支持多个 */
    String[] value();

    /** 多个权限点的逻辑关系 */
    LogicType logic() default LogicType.AND;

    enum LogicType { AND, OR }
}
```

### 2.3 AOP 实现（委托给 CurrentUser）

```java
// mb-infra/infra-security/src/main/java/com/metabuild/infra/security/RequirePermissionAspect.java
@Aspect
@Component
@RequiredArgsConstructor
public class RequirePermissionAspect {

    private final CurrentUser currentUser;

    @Before("@annotation(annotation)")
    public void check(RequirePermission annotation) {
        if (!currentUser.isAuthenticated()) {
            throw new UnauthorizedException("auth.notAuthenticated");
        }
        boolean pass = annotation.logic() == RequirePermission.LogicType.AND
            ? currentUser.hasAllPermissions(annotation.value())
            : currentUser.hasAnyPermission(annotation.value());
        if (!pass) {
            throw new ForbiddenException("auth.permissionDenied");
        }
    }
}
```

### 2.4 Controller 使用示例（零 Sa-Token 引用）

```java
@RestController
@RequestMapping("/api/v1/iam/users")
@RequiredArgsConstructor
public class UserController {

    private final UserApi userApi;

    @GetMapping
    @RequirePermission("iam:user:list")
    public PageResult<UserVo> list(UserQry query) {
        return userApi.page(query);
    }

    @PostMapping
    @RequirePermission("iam:user:create")
    public UserVo create(@RequestBody @Valid UserCreateCmd cmd) {
        return userApi.create(cmd);
    }

    @PutMapping("/{id}")
    @RequirePermission("iam:user:update")
    public UserVo update(@PathVariable Long id, @RequestBody @Valid UserUpdateCmd cmd) {
        return userApi.update(id, cmd);
    }
}
```

**关键**：Controller 代码里**零 Sa-Token 引用**，完全通过 `@RequirePermission` + `CurrentUser` 门面访问认证能力。

### 2.5 @RequirePermission 位置规范（N3 修订）

**硬规则**：`@RequirePermission` 注解**必须放在 Controller 层的方法上**，不能放在 Service 层。

**理由**（Clean Architecture 官方立场）：
- 权限是"用户业务意图"的属性，对应 HTTP endpoint
- Service 是"业务规则的执行工具"，被 Controller / 其他 Service / 定时任务 / 事件处理器调用
- 如果权限放 Service 层，Service 间调用时会造成混乱（调用方有权限但被调用方没权限，反之亦然）
- 跨模块 API 可见性应该通过 `<Module>Api` 接口 + ArchUnit `CROSS_PLATFORM_ONLY_VIA_API` 编译期保护，不是运行时权限注解

```java
// ✅ 正确：@RequirePermission 在 Controller 层
@RestController
public class UserController {
    @PostMapping("/users")
    @RequirePermission("iam:user:create")
    public UserVo create(@RequestBody @Valid UserCreateCmd cmd) {
        return userService.create(cmd);
    }
}

@Service
public class UserService {
    // 没有 @RequirePermission
    public UserVo create(UserCreateCmd cmd) { ... }
}

// ❌ 错误：@RequirePermission 在 Service 层（禁止！）
@Service
public class UserService {
    // @RequirePermission("iam:user:create")  ← 禁止！
    public UserVo create(UserCreateCmd cmd) { ... }
}
```

**动态权限检查**：如果权限判断依赖运行时数据（如"只能改自己的邮箱"），在 Service 层用 `currentUser.hasPermission(String)` 程序性调用：

```java
// Service 层的动态权限检查（不是注解）
public UserVo updateEmail(Long userId, UserUpdateEmailCmd cmd) {
    if (!currentUser.userId().equals(userId) && !currentUser.hasPermission("iam:user:update")) {
        throw new BusinessException("iam.user.cannotUpdate");
    }
    // ...
}
```

**完整权限模型**：

| 权限类型 | 机制 | 层 |
|---|---|---|
| 静态用户权限（"能创建用户吗"）| `@RequirePermission` 注解 | Controller 层 |
| 动态用户权限（"能改这条订单吗"）| `currentUser.hasPermission()` 程序性调用 | Service 层 |
| 跨模块 API 可见性 | `<Module>Api` 接口 + ArchUnit 编译期 | 模块契约层 |
| 行级数据权限 | `DataScopeVisitListener`（方案 E）| Repository（jOOQ 查询拦截）|
| 系统动作（定时任务/异步/事件）| 无 Controller，无 `@RequirePermission`，通过 `currentUser.isSystem()` 或 `SYSTEM_USER_ID` | 天然适配 |

**每种权限需求有唯一对应的机制，不重叠、不混淆、不遗漏**。

## 3. DataScope opt-out 实现细节

（数据权限的完整机制在 [§7 数据权限方案 E](#7-数据权限方案-e)，本节只强调与认证模型的集成）

**数据流**：

```
登录时（platform-iam.domain.auth.AuthService）
    ↓
DataScopeLoader.load(user, roleService, deptService)
    ↓（读 mb_iam_role.data_scope 字段 + 展开部门树）
DataScope(type=OWN_DEPT_AND_CHILD, deptIds={1,2,3,4})
    ↓
AuthFacade.doLogin(userId, new SessionData(userId, username, dataScope, mustChangePassword))
    ↓
Sa-Token session 持久化

───────────────────────────

请求处理时（任何业务 Service / Repository）
    ↓
DSLContext 构建查询 → jOOQ AST
    ↓
DataScopeVisitListener.visitStart(ctx)
    ↓（读 CurrentUser.dataScopeType() / dataScopeDeptIds()，查 DataScopeRegistry）
注入 where 条件
```

**关键点**：
- 用户的数据范围规则存在 `mb_iam_role.data_scope` 字段
- 登录时**一次性**展开为具体 `Set<Long> deptIds`，存入 session（后续请求零查询）
- 业务层**只通过** `CurrentUser.dataScopeType()` / `CurrentUser.dataScopeDeptIds()` 读取（不直接访问 Sa-Token session）
- `DataScopeVisitListener` 在 jOOQ SQL 构建层自动注入条件，Repository 是普通类**零继承、零数据权限代码**

## 4. 强制敏感配置

所有敏感配置**必须通过环境变量**提供，无默认值（缺失启动失败）。

| 环境变量 | 必填 | 默认值 | 用途 |
|---------|------|--------|------|
| `MB_JWT_SECRET` | ✓ | （无，fail fast） | Sa-Token JWT 签名密钥（至少 32 字节） |
| `MB_DB_PASSWORD` | ✓ | （无） | PostgreSQL 密码 |
| `MB_DB_URL` | ✓ | （无） | PostgreSQL 连接 URL |
| `MB_DB_USERNAME` | ✓ | （无） | PostgreSQL 用户 |
| `MB_REDIS_PASSWORD` | 生产必填 | `""` | Redis 密码（Sa-Token 黑名单 + 缓存） |
| `MB_REDIS_HOST` | 生产必填 | `localhost` | Redis 主机 |
| `MB_CORS_ALLOWED_ORIGINS` | 跨域必填 | `""` | CORS 白名单（逗号分隔，完整清单见 09-config-management.md §9.2.10）|
| `MB_ID_WORKER` | 集群必填 | `1` | Snowflake workerId |
| `MB_SWAGGER_ENABLED` | - | `false` | 生产禁用 Swagger UI |
| `MB_FILE_STORAGE_PATH` | - | `/var/lib/meta-build/files` | 本地文件存储路径 |
| `MB_FILE_MAX_SIZE` | - | `10485760` | 文件上传大小限制（10MB） |

### application.yml 引用方式

```yaml
spring:
  datasource:
    url: ${MB_DB_URL}          # 无默认，缺失启动失败
    username: ${MB_DB_USERNAME}
    password: ${MB_DB_PASSWORD}

sa-token:
  jwt-secret-key: ${MB_JWT_SECRET}   # 无默认
```

`[M1 时补: 完整 application.yml 模板 + 所有 env var 的清单与默认值]`

## 5. CORS 规范

### 决策

- 白名单管理: `MB_CORS_ALLOWED_ORIGINS` 逗号分隔（例: `https://admin.meta-build.dev,https://app.meta-build.dev`），通过 `MbCorsProperties` 注入（见 [09-config-management.md §9.2.10](./09-config-management.md#9210-cors白名单)）
- **默认禁止跨域**（空列表 = 仅同源）
- **禁止** `Access-Control-Allow-Origin: *` + `Allow-Credentials: true` 组合（浏览器标准拒绝）
- 配置位置: `infra-security/src/main/java/com/metabuild/infra/security/CorsConfig.java`

```java
@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    private final MbCorsProperties corsProperties;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        if (!corsProperties.allowedOrigins().isEmpty()) {
            config.setAllowedOrigins(corsProperties.allowedOrigins());
            config.setAllowCredentials(corsProperties.allowCredentials());
        }
        config.setAllowedMethods(corsProperties.allowedMethods());
        config.setAllowedHeaders(corsProperties.allowedHeaders());
        config.setMaxAge(corsProperties.maxAgeSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

## 5.1 Web 安全基线声明

### XSS 防护

v1 所有 API 返回 `application/json`，浏览器不会将 JSON 渲染为 HTML，这是天然的 XSS 防线。

补充防御（`infra-exception` 的 `SecurityHeaderFilter`）：
- `X-Content-Type-Options: nosniff` — 禁止浏览器嗅探 MIME 类型
- `Content-Security-Policy: default-src 'self'` — 限制资源加载来源
- `X-Frame-Options: DENY` — 禁止 iframe 嵌入（防 clickjacking）

> **注意**：如果未来有富文本字段（公告内容、通知模板等）需要渲染 HTML，必须在写入时做 input sanitization（如 jsoup clean），不能信任前端。

### CSRF 防护

v1 token 通过 `Authorization: Bearer` header 传递，不使用 Cookie 存储 token。浏览器不会在跨域请求中自动附带自定义 header，因此**天然免疫 CSRF 攻击**，无需额外 CSRF token 机制。

> **⚠️ 架构约束**：如果未来切换到 Cookie-based token 传递（如 SSR 场景），**必须**同时引入 CSRF token 机制（如 Spring Security 的 `CsrfFilter`）。此约束记录在此，防止架构变更时遗漏。

## 6. CurrentUser 门面层设计（ADR-0005）

这是本章最重要的一节。**meta-build 的业务层（platform / business / schema）零感知认证框架**，通过 `CurrentUser` 门面访问所有认证相关能力。

### 6.1 为什么要门面层

| 问题 | 不用门面 | 用门面 |
|------|---------|-------|
| 业务代码耦合 Sa-Token | 到处 `StpUtil.xxx` | 零 `StpUtil` 引用 |
| 切换认证框架 | 改每一处 `StpUtil` 调用 | 只改 1 个实现类 |
| 单元测试 | `mockStatic(StpUtil.class)` + `mockito-inline` | `@MockBean CurrentUser` 或 `MockCurrentUser` |
| AI 生成代码风险 | 高（静态方法难推理） | 低（接口方法清晰） |

### 6.2 CurrentUser 接口（在 mb-common.security）

**关键：接口定义放在 `mb-common.security`**，不是 `infra-security`。这是方案 E 的连带决策——让 `infra-jooq` 的 `DataScopeVisitListener` 可以直接依赖 `CurrentUser` 而不破坏 §1.5 的"infra 子模块不互相依赖"约束。

```java
// mb-common/src/main/java/com/metabuild/common/security/CurrentUser.java
package com.metabuild.common.security;

import java.util.Set;

/**
 * 当前登录用户的门面接口。
 *
 * 业务层（platform/business）必须通过此接口获取用户信息和权限判断，
 * 禁止直接依赖 Sa-Token、Spring Security 等认证框架的 API（由 ArchUnit 强制）。
 *
 * 接口本身放 mb-common.security（零 Spring / 零 Sa-Token 依赖，纯抽象），
 * Sa-Token 的实现类 {@link com.metabuild.infra.security.SaTokenCurrentUser} 在 infra-security。
 */
public interface CurrentUser {

    /** 当前是否已登录 */
    boolean isAuthenticated();

    /** 当前用户 ID（未登录抛 UnauthorizedException） */
    Long userId();

    /** 当前用户名 */
    String username();

    /** 当前用户所属部门 ID */
    Long deptId();

    /** 当前租户 ID（v1 总是返回 0L） */
    Long tenantId();

    /** 权限点集合 */
    Set<String> permissions();

    /** 角色集合 */
    Set<String> roles();

    /** 数据范围类型 */
    DataScopeType dataScopeType();

    /** 可访问的部门 ID 集合（数据范围用） */
    Set<Long> dataScopeDeptIds();

    // 权限判断
    boolean hasPermission(String permissionCode);
    boolean hasAnyPermission(String... permissionCodes);
    boolean hasAllPermissions(String... permissionCodes);

    // 角色判断
    boolean hasRole(String roleCode);

    /** 超管快捷判断 */
    boolean isAdmin();

    /** 完整快照（对外 DTO） */
    CurrentUserInfo snapshot();
}
```

**关键约束**：接口**不暴露任何 Sa-Token 特有概念**（`SaSession` / `StpLogic` / `StpUtil` 等），便于未来切换到 Spring Security 等其他实现。

### 6.3 Sa-Token 实现

```java
// mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaTokenCurrentUser.java
package com.metabuild.infra.security;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.CurrentUserInfo;
import com.metabuild.common.security.DataScopeType;
import cn.dev33.satoken.stp.StpUtil;
import org.springframework.stereotype.Component;

@Component
public class SaTokenCurrentUser implements CurrentUser {

    @Override
    public boolean isAuthenticated() {
        return StpUtil.isLogin();
    }

    @Override
    public Long userId() {
        if (!StpUtil.isLogin()) {
            throw new UnauthorizedException("auth.notAuthenticated");
        }
        return StpUtil.getLoginIdAsLong();
    }

    @Override
    public Long tenantId() {
        Long tenantId = StpUtil.getSession().getLong("tenantId");
        return tenantId != null ? tenantId : 0L;
    }

    @Override
    public Set<String> permissions() {
        return Set.copyOf(StpUtil.getPermissionList());
    }

    @Override
    public boolean hasPermission(String code) {
        return StpUtil.hasPermission(code);
    }

    @Override
    public boolean isAdmin() {
        return hasRole("admin") || permissions().contains("*.*.*");
    }

    // ... 其他方法
}
```

### 6.4 测试时替换 Bean（MockCurrentUser）

```java
// mb-admin/src/test/java/com/metabuild/TestSecurityConfig.java
package com.metabuild;

import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.CurrentUser;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestSecurityConfig {

    @Bean @Primary
    public CurrentUser testCurrentUser() {
        return new MockCurrentUser();
    }

    @Bean @Primary
    public AuthFacade testAuthFacade() {
        return new MockAuthFacade();
    }
}
```

```java
// mb-admin/src/test/java/com/metabuild/MockCurrentUser.java
package com.metabuild;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.exception.UnauthorizedException;
import java.util.Set;

public class MockCurrentUser implements CurrentUser {
    private Long userId;
    private String username;
    private Set<String> permissions = Set.of();
    private boolean admin;

    public MockCurrentUser asUser(long userId, String username, String... perms) {
        this.userId = userId;
        this.username = username;
        this.permissions = Set.of(perms);
        this.admin = false;
        return this;
    }

    public MockCurrentUser asAdmin() {
        this.userId = 1L;
        this.username = "admin";
        this.permissions = Set.of("*.*.*");
        this.admin = true;
        return this;
    }

    public void clear() {
        this.userId = null;
        this.username = null;
        this.permissions = Set.of();
        this.admin = false;
    }

    @Override
    public boolean isAuthenticated() { return userId != null; }

    @Override
    public Long userId() {
        if (userId == null) throw new UnauthorizedException("auth.notAuthenticated");
        return userId;
    }

    // ... 其他方法实现
}
```

**测试用法**：
```java
@SpringBootTest
@Import(TestSecurityConfig.class)
class UserServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private MockCurrentUser currentUser;
    @Autowired private UserService userService;

    @BeforeEach void setup() { currentUser.clear(); }

    @Test
    void admin_creates_user() {
        currentUser.asAdmin();
        UserVo user = userService.create(new UserCreateCmd("alice", "password"));
        assertThat(user.id()).isNotNull();
    }

    @Test
    void normal_user_without_permission_fails() {
        currentUser.asUser(100L, "bob");  // 没有 create 权限
        assertThatThrownBy(() -> userService.create(...))
            .isInstanceOf(ForbiddenException.class);
    }
}
```

### 6.5 未来切换到 Spring Security 的成本

因为有 CurrentUser 门面层，切换成本**只有半天**：
1. 改 2 个实现类（`SaTokenCurrentUser` → `SpringSecurityCurrentUser`；`SaTokenAuthFacade` → `SpringSecurityAuthFacade`）：4 小时
2. 改 `application.yml` 配置：1 小时
3. 改 `RequirePermissionAspect`（委托 Spring Security 的 `PermissionEvaluator`）：1 小时
4. 业务代码（Controller / Service / Repository）：**不需要改**
5. 测试代码：**不需要改**（`MockCurrentUser` / `MockAuthFacade` 不变）

### 6.6 AuthFacade：登录/登出技术门面

`CurrentUser` 解决了"**读取当前用户**"的业务层隔离，但"**执行登录/登出/强制注销**"这类**认证技术操作**还是会让业务层不得不调 `StpUtil.login()`——这就破坏了"业务层零 Sa-Token 引用"的原则。

解法是为**写操作**再提供一个对称的门面：`AuthFacade`。

#### 6.6.1 为什么要第二个门面

| 方向 | 门面接口 | 典型调用方 | 语义 |
|------|---------|-----------|------|
| **读**（当前用户是谁、有什么权限） | `CurrentUser` | `RequirePermissionAspect` / 业务 `Service` / Controller | 请求处理中无状态地查询当前主体 |
| **写**（登录、登出、强制注销、续期） | `AuthFacade` | `platform-iam.domain.auth.AuthService` 等极少数位置 | 改变当前会话的认证状态 |

两个门面**共同构成业务层与认证框架的唯一边界**，业务层完全不 import `cn.dev33.satoken.*`。

#### 6.6.2 AuthFacade 接口定义

```java
// mb-common/src/main/java/com/metabuild/common/security/AuthFacade.java
package com.metabuild.common.security;

import java.util.Map;

/**
 * 认证技术门面——封装登录/登出/强制注销等"改变认证状态"的操作。
 *
 * 与 {@link CurrentUser} 对称，同放 mb-common.security：
 * - CurrentUser：读当前用户信息和权限（请求处理中使用）
 * - AuthFacade： 写认证状态（登录/登出/续期等）
 *
 * 接口放 mb-common（零 Spring / 零 Sa-Token 依赖，纯抽象），
 * Sa-Token 的实现类 {@link com.metabuild.infra.security.SaTokenAuthFacade} 在 infra-security。
 *
 * 业务层（platform/business）要做登录等技术操作时必须通过此接口，
 * 禁止直接依赖 Sa-Token、Spring Security 等认证框架 API（由 ArchUnit 强制）。
 *
 * 未来切换认证框架时，只需提供 {@link com.metabuild.infra.security.SaTokenAuthFacade} 的替代实现，
 * 业务代码完全不需要修改。
 */
public interface AuthFacade {

    /**
     * 签发 access + refresh 双 token 并把 session 数据写入认证框架。
     *
     * @param userId      登录成功的用户 ID
     * @param sessionData 要写入 session 的数据对象
     * @return access token + refresh token + 各自过期时间
     */
    LoginResult doLogin(Long userId, SessionData sessionData);

    /**
     * 用 refresh token 刷新 access token（Rotation 模式）。
     * 旧 refresh token 立即作废，签发新的 access + refresh。
     *
     * @param refreshToken 客户端持有的 refresh token
     * @return 新的 access + refresh token 对
     */
    LoginResult refresh(String refreshToken);

    /** 当前会话登出，token 加入黑名单 */
    void logout();

    /**
     * 强制注销指定用户的所有会话（封禁 / 管理员踢出 / 修改密码场景）。
     *
     * @param userId 目标用户 ID
     */
    void kickoutAll(Long userId);

    /** 延长当前 token 的有效期 */
    void renewTimeout();
}
```

`LoginResult` 是纯数据记录，放 `mb-common`。与 §1.0.1 双 token 机制一致，返回 access + refresh 双 token：

```java
// mb-common/src/main/java/com/metabuild/common/security/LoginResult.java
package com.metabuild.common.security;

public record LoginResult(
    String accessToken,
    long accessTimeoutSeconds,
    String refreshToken,
    long refreshTimeoutSeconds
) {}
```

#### 6.6.3 Sa-Token 实现

```java
// mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaTokenAuthFacade.java
@Component
@RequiredArgsConstructor
public class SaTokenAuthFacade implements AuthFacade {

    private final MbAuthProperties authProperties;   // mb.auth.access-timeout / refresh-timeout
    private final StringRedisTemplate redisTemplate;

    @Override
    public LoginResult doLogin(Long userId, SessionData sessionData) {
        // 1. 签发 access token（Sa-Token 管理）
        StpUtil.login(userId, SaLoginConfig.create()
            .setTimeout(authProperties.getAccessTimeout()));  // 30 分钟
        SaSession session = StpUtil.getSession();
        // sessionData 由业务层传入的 record 类型，通过反射或约定字段写入 session
        // [M4 时补：约定 sessionData 实现 SessionDataProvider 接口，由 SaTokenAuthFacade 统一写入]
        String accessToken = StpUtil.getTokenValue();

        // 2. 签发 refresh token（自管 Redis）
        String refreshToken = UUID.randomUUID().toString();
        long refreshTimeout = authProperties.getRefreshTimeout();  // 30 天
        String redisKey = "mb:auth:refresh:" + refreshToken;
        redisTemplate.opsForValue().set(redisKey, String.valueOf(userId), Duration.ofSeconds(refreshTimeout));

        return new LoginResult(accessToken, authProperties.getAccessTimeout(), refreshToken, refreshTimeout);
    }

    @Override
    public LoginResult refresh(String refreshToken) {
        String redisKey = "mb:auth:refresh:" + refreshToken;
        String userIdStr = redisTemplate.opsForValue().get(redisKey);
        if (userIdStr == null) {
            // Rotation 入侵检测：已作废的 refresh token 被再次使用
            // [M4 时补：解析 token 对应的 userId，调 kickoutAll() 吊销所有 session]
            throw new UnauthorizedException("iam.auth.refreshTokenInvalid");
        }
        // 作废旧 refresh token
        redisTemplate.delete(redisKey);
        Long userId = Long.valueOf(userIdStr);
        // 重新签发 access + refresh
        return doLogin(userId, null);  // [M4 时补：从 session 恢复 sessionData]
    }

    @Override
    public void logout() {
        StpUtil.logout();
    }

    @Override
    public void kickoutAll(Long userId) {
        StpUtil.kickout(userId);
    }

    @Override
    public void renewTimeout() {
        StpUtil.renewTimeout(StpUtil.getTokenTimeout());
    }
}
```

这个类是**整个 meta-build 项目里除 `SaTokenCurrentUser` 之外唯一允许 import `cn.dev33.satoken.*` 的地方**。所有其他业务代码通过 `AuthFacade` 接口调用。

#### 6.6.4 ArchUnit 规则（无新增）

`BUSINESS_MUST_NOT_DEPEND_ON_SA_TOKEN` 和 `ONLY_INFRA_SECURITY_DEPENDS_ON_SA_TOKEN` 已经覆盖——业务层任何 `import cn.dev33.satoken.*` 都会编译失败。`AuthFacade` 是"在规则内提供出路"，不需要新规则，也不需要白名单豁免。

#### 6.6.5 测试时的 MockAuthFacade

和 `MockCurrentUser` 对称，`mb-admin/src/test/java/com/metabuild/MockAuthFacade.java`：

```java
public class MockAuthFacade implements AuthFacade {

    private final List<Long> loggedInUsers = new ArrayList<>();
    private final List<Long> kickedOutUsers = new ArrayList<>();

    @Override
    public LoginResult doLogin(Long userId, SessionData sessionData) {
        loggedInUsers.add(userId);
        return new LoginResult("mock-access-" + userId, 1800L, "mock-refresh-" + userId, 2592000L);
    }

    @Override
    public LoginResult refresh(String refreshToken) {
        return new LoginResult("mock-access-refreshed", 1800L, "mock-refresh-new", 2592000L);
    }

    @Override public void logout() {}
    @Override public void kickoutAll(Long userId) { kickedOutUsers.add(userId); }
    @Override public void renewTimeout() {}

    // 测试断言辅助方法
    public boolean wasUserLoggedIn(long userId) { return loggedInUsers.contains(userId); }
    public boolean wasUserKickedOut(long userId) { return kickedOutUsers.contains(userId); }
    public void clear() { loggedInUsers.clear(); kickedOutUsers.clear(); }
}
```

`TestSecurityConfig` 同时注册两个 mock Bean：

```java
@TestConfiguration
public class TestSecurityConfig {

    @Bean @Primary
    public CurrentUser testCurrentUser() { return new MockCurrentUser(); }

    @Bean @Primary
    public AuthFacade testAuthFacade() { return new MockAuthFacade(); }
}
```

<!-- verify: cd server && grep -rn "StpUtil\." --include="*.java" mb-platform mb-business | grep -v "/test/" && echo "FAIL: 业务层出现 StpUtil 引用" || echo "OK" -->

## 7. 数据权限方案 E（VisitListener 单点 + 零基类） [M1+M4]

### 7.1 问题（安全级别高）

nxboot 的 `@DataScope` 是 **opt-in 注解**：只有显式标注了 `@DataScope` 的方法才会拦截数据范围，忘加就返回全部数据。新开发者抄一个模块、忘贴注解 = 静默数据泄漏。nxboot 的继承惯性（MyBatis-Plus 的 `extends ServiceImpl` 范式）还带来另一个坑——所有 Repository 都要绑在一个基类上，行为不透明，AI 读代码必须追父类。

### 7.2 决策：方案 E（详见 ADR-0007）

**拦截点只有一个**：`DataScopeVisitListener`（jOOQ 全局 VisitListener）。它在 SQL AST 构建过程中，对**所有**注册过的业务表自动注入 `dept_id IN (...)` 条件。不依赖 Repository 继承、不依赖 Service 主动调用，**是真正的 opt-out 本体**。

**设计铁律（方案 E 四原则）**：

1. **没有 `DataScopedRepository` 基类** —— nxboot 的基类是 MyBatis 继承惯性的残留，在 jOOQ 世界里 VisitListener 已经是业界标准答案，基类的所有拦截能力都是 VisitListener 的子集，纯粹冗余（详见 ADR-0007）
2. **没有 `DataScopeContext` ThreadLocal** —— DataScope 的数据真相已经在 `CurrentUser` 里（登录时写入 Sa-Token session），`CurrentUser` 就是单一数据源
3. **受保护表显式注册** —— 使用者在 `DataScopeConfig` 里集中声明"哪些表要拦截 + 部门字段叫什么"，一眼就能看到 meta-build 项目的数据权限全景
4. **`@BypassDataScope` 走窄范围 AOP 标记** —— 只持有一个 `boolean` 的 `ThreadLocal`，try-finally 保证清理，比原 `DataScopeContext` 的"全局业务态容器"简洁得多
5. **`owner_dept_id` 必须有值** —— 需要数据权限的表 `owner_dept_id` 字段为 `NOT NULL`。不允许 0 或特殊值——操作者必然有部门（用户表部门字段必填），拿不到部门说明是 bug，RecordListener 应抛异常而非静默写入默认值

### 7.3 三层职责划分

| 层 | 职责 | 所在模块 | 关键类 |
|---|------|--------|-------|
| **类型定义** | `DataScope` / `DataScopeType` / `BypassDataScope` / `CurrentUser` 抽象接口 | `mb-common.security` | `CurrentUser` / `DataScope` / `DataScopeType` |
| **规则查询** | 登录时查角色-部门规则，展开成 `DataScope` 存入 session | `platform-iam.domain.auth` | `AuthService` / `DataScopeLoader` |
| **SQL 注入** | 运行时拦截 jOOQ 查询，从 `CurrentUser` 读 DataScope，注入 `where` 条件 | `infra-jooq` | `DataScopeRegistry` / `DataScopeVisitListener` / `BypassDataScopeAspect` |

### 7.4 类型定义代码骨架（mb-common.security）

```java
// mb-common/src/main/java/com/metabuild/common/security/DataScopeType.java
package com.metabuild.common.security;

public enum DataScopeType {
    ALL,                    // 全部数据（超管）
    CUSTOM_DEPT,            // 自定义部门集
    OWN_DEPT,               // 本部门
    OWN_DEPT_AND_CHILD,     // 本部门及下级
    SELF                    // 仅本人
}
```

```java
// mb-common/src/main/java/com/metabuild/common/security/DataScope.java
package com.metabuild.common.security;

import java.util.Set;

/**
 * 数据范围值对象。纯数据，无 Spring / jOOQ 依赖。
 *
 * 由登录流程计算得出，存入认证框架 session，运行时通过 CurrentUser 读取。
 */
public record DataScope(DataScopeType type, Set<Long> deptIds) {
    public static DataScope all() {
        return new DataScope(DataScopeType.ALL, Set.of());
    }
    public static DataScope self() {
        return new DataScope(DataScopeType.SELF, Set.of());
    }
}
```

```java
// mb-common/src/main/java/com/metabuild/common/security/BypassDataScope.java
package com.metabuild.common.security;

import java.lang.annotation.*;

/**
 * 显式跳过数据范围拦截的注解。限管理员 / 系统级查询使用。
 *
 * 实现机制见 {@code com.metabuild.infra.jooq.BypassDataScopeAspect}。
 * 使用此注解的方法**必须**在 reason 里说明"为什么可以 bypass"，code review 会检查。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface BypassDataScope {
    String reason();  // 必填：bypass 的业务理由
}
```

### 7.5 SQL 注入代码骨架（infra-jooq）

```java
// mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/DataScopeRegistry.java
package com.metabuild.infra.jooq;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 数据权限受保护表的集中注册中心。
 *
 * 使用者通过 @Configuration 在启动时集中声明"哪些表受数据权限保护 + 部门字段叫什么"。
 * 整个 meta-build 项目的数据权限全景在一个 Registry 里一目了然。
 */
@Component
public class DataScopeRegistry {

    /** 表名（小写） → 部门字段名 */
    private final Map<String, String> protectedTables = new ConcurrentHashMap<>();

    /**
     * 注册一个受数据权限保护的表。
     *
     * @param tableName      表名（如 "mb_iam_user"）
     * @param deptColumnName 部门字段名（如 "dept_id"）
     */
    public void register(String tableName, String deptColumnName) {
        protectedTables.put(tableName.toLowerCase(), deptColumnName);
    }

    public Optional<String> getDeptColumn(String tableName) {
        return Optional.ofNullable(protectedTables.get(tableName.toLowerCase()));
    }

    public int size() {
        return protectedTables.size();
    }
}
```

```java
// mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/DataScopeVisitListener.java
package com.metabuild.infra.jooq;

import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.DataScopeType;
import org.jooq.*;
import org.jooq.impl.DSL;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/**
 * 数据权限的唯一拦截点（方案 E）。
 *
 * 作为 jOOQ 全局 VisitListener 注册到 Configuration，在 SQL AST 构建过程中：
 * 1. 识别当前访问的表是否在 {@link DataScopeRegistry} 中受保护
 * 2. 如果是，从 {@link CurrentUser} 读取 DataScopeType / deptIds
 * 3. 注入对应的 where 条件（ALL 不注入，SELF 按 created_by，其他按 dept_id IN (...)）
 *
 * 被 @BypassDataScope 注解的方法调用链整体跳过，由 {@link BypassDataScopeAspect} 配合。
 */
@Component
public class DataScopeVisitListener implements VisitListener {

    private final DataScopeRegistry registry;
    private final ObjectProvider<CurrentUser> currentUserProvider;  // 延迟解析，避免启动循环

    public DataScopeVisitListener(
            DataScopeRegistry registry,
            ObjectProvider<CurrentUser> currentUserProvider) {
        this.registry = registry;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public void visitStart(VisitContext context) {
        // [M4 时补: 完整 AST 访问 + Condition 注入逻辑]
        //
        // 设计原则：数据权限只在查询主表（FROM 子句的主表）上注入 WHERE 条件，
        // JOIN 表和子查询中的关联表不单独注入。原因：
        // 1. JOIN 表是主表的附属数据，主表已过滤则结果安全
        // 2. 对 JOIN 表也注入会导致跨部门关联数据丢失（如 dept=1 的订单 owner 是 dept=99 的用户，JOIN 匹配不到）
        // 3. 大幅降低 VisitListener 实现复杂度（不需要处理 JOIN/子查询/UNION 嵌套）
        //
        // 伪代码骨架：
        // if (BypassDataScopeAspect.isBypassed()) return;
        // CurrentUser user = currentUserProvider.getIfAvailable();
        // if (user == null || !user.isAuthenticated()) return;
        // if (user.dataScopeType() == DataScopeType.ALL) return;
        //
        // QueryPart part = context.queryPart();
        // if (part instanceof Table<?> t) {
        //     registry.getDeptColumn(t.getName()).ifPresent(deptCol -> {
        //         Condition injection = switch (user.dataScopeType()) {
        //             case SELF -> DSL.field("created_by", Long.class).eq(user.userId());
        //             default   -> DSL.field(deptCol, Long.class).in(user.dataScopeDeptIds());
        //         };
        //         context.queryPart(injectCondition(t, injection));
        //     });
        // }
    }
}
```

```java
// mb-infra/infra-jooq/src/main/java/com/metabuild/infra/jooq/BypassDataScopeAspect.java
package com.metabuild.infra.jooq;

import com.metabuild.common.security.BypassDataScope;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * @BypassDataScope 的 AOP 实现——窄范围 ThreadLocal 标记，try-finally 保证清理。
 *
 * 这是 meta-build 唯一为数据权限专用的 ThreadLocal，且只持有一个 boolean，
 * 不是"业务态容器"。VisitListener 在注入 SQL 前检查 {@link #isBypassed()}。
 */
@Aspect
@Component
public class BypassDataScopeAspect {

    private static final ThreadLocal<Boolean> BYPASS = new ThreadLocal<>();

    /** 供 VisitListener 检查 */
    public static boolean isBypassed() {
        return Boolean.TRUE.equals(BYPASS.get());
    }

    @Around("@annotation(bypass)")
    public Object around(ProceedingJoinPoint pjp, BypassDataScope bypass) throws Throwable {
        BYPASS.set(Boolean.TRUE);
        try {
            return pjp.proceed();
        } finally {
            BYPASS.remove();
        }
    }
}
```

### 7.6 规则查询代码骨架（platform-iam.domain.auth）

```java
// platform-iam/src/main/java/com/metabuild/platform/iam/domain/auth/DataScopeLoader.java
package com.metabuild.platform.iam.domain.auth;

import com.metabuild.common.security.DataScope;
import com.metabuild.common.security.DataScopeType;
import com.metabuild.platform.iam.domain.dept.DeptService;
import com.metabuild.platform.iam.domain.role.RoleService;
import com.metabuild.platform.iam.domain.user.User;

/**
 * 登录时从用户的角色集合展开出 DataScope。纯业务计算，无副作用。
 *
 * 由 AuthService.login() 调用，结果通过 AuthFacade.doLogin() 存入 session。
 */
public final class DataScopeLoader {

    public static DataScope load(User user, RoleService roles, DeptService depts) {
        // [M4 时补: 按角色的 data_scope 字段聚合，展开 OWN_DEPT_AND_CHILD 为具体 deptIds]
        // 伪代码：
        // if (user.isAdmin()) return DataScope.all();
        // Set<Role> userRoles = roles.findByUserId(user.id());
        // DataScopeType highest = pickHighestScope(userRoles);
        // Set<Long> deptIds = switch (highest) {
        //     case ALL -> Set.of();
        //     case SELF -> Set.of();
        //     case OWN_DEPT -> Set.of(user.deptId());
        //     case OWN_DEPT_AND_CHILD -> depts.findSelfAndDescendants(user.deptId());
        //     case CUSTOM_DEPT -> collectCustomDeptIds(userRoles);
        // };
        // return new DataScope(highest, deptIds);
        return DataScope.all();  // 占位
    }
}
```

### 7.7 使用者注册受保护表（集中声明）

```java
// mb-admin/src/main/java/com/metabuild/admin/config/DataScopeConfig.java
@Configuration
public class DataScopeConfig {

    @Bean
    ApplicationRunner dataScopeInit(DataScopeRegistry registry) {
        return args -> {
            // === platform 层受保护表 ===
            registry.register("mb_iam_user",       "dept_id");
            registry.register("mb_iam_dept",       "parent_id");  // 部门树自身按 parent_id 受限
            registry.register("mb_log_operation",  "dept_id");

            // === canonical reference（M5 填入）===
            registry.register("biz_order_main", "owner_dept_id");

            // === 使用者自己的业务表在这里继续注册 ===
            // registry.register("biz_xxx", "dept_id");
        };
    }
}
```

**设计哲学**：整个 meta-build 项目的数据权限全景一个文件就能看完。AI 或新人想知道"哪些表受数据权限保护"，grep `DataScopeRegistry.register` 或看 `DataScopeConfig` 即可，**无需追任何继承链或切面**。

### 7.8 Repository 写起来是普通类（零魔法）

```java
// platform-iam/src/main/java/com/metabuild/platform/iam/domain/user/UserRepository.java
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final DSLContext dsl;

    public Optional<User> findById(Long id) {
        // 就是普通 jOOQ 查询。
        // mb_iam_user 在 DataScopeRegistry 注册过，VisitListener 会自动在 SELECT 上注入 dept_id 过滤。
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.ID.eq(id))
            .fetchOptional(this::toDomain);
    }

    public List<User> findByStatus(int status) {
        // 同样，零数据权限相关代码，自动受保护
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.STATUS.eq(status))
            .fetch(this::toDomain);
    }

    @BypassDataScope(reason = "登录流程需要跨部门按用户名查用户")
    public Optional<User> findByUsernameForLogin(String username) {
        // 这个方法调用期间整个 AOP 切面把 bypass 标记置 true，
        // VisitListener 跳过注入，用于登录等系统级查询
        return dsl.selectFrom(MB_IAM_USER)
            .where(MB_IAM_USER.USERNAME.eq(username))
            .fetchOptional(this::toDomain);
    }

    private User toDomain(MbIamUserRecord r) { /* ... */ return null; }
}
```

**注意**：
- `UserRepository` **没有继承任何基类**，没有 `@Autowired CurrentUser`，没有 `DataScopeContext.current()`
- 数据权限拦截发生在 jOOQ 的 SQL 构建层，Repository 代码对它零感知
- 唯一需要 Repository 作者知道的事："我的方法默认会被过滤，如果要绕过就打 `@BypassDataScope`"

### 7.9 ArchUnit 规则 NO_RAW_SQL_FETCH

方案 E 的 ArchUnit 规则有两条——一条守护 `DataScopeRegistry` 一定要被用到，另一条**禁止原始 SQL 绕过**：

```java
// infra-archunit/src/main/java/com/metabuild/infra/archunit/rules/DataScopeRule.java
public class DataScopeRule {

    /**
     * 业务 Repository 不得使用 DSLContext 的字符串 SQL API（fetch(String) / execute(String) 等）。
     * 这些 API 会完全绕过 jOOQ 的 VisitListener 机制，导致 DataScopeVisitListener 失效。
     *
     * 如果真的需要执行原生 SQL（如 DDL / 性能敏感查询），必须在 infra-jooq 或 mb-admin 里明确声明。
     */
    public static final ArchRule NO_RAW_SQL_FETCH = noClasses()
        .that().resideInAnyPackage("com.metabuild.platform..", "com.metabuild.business..")
        .should().callMethodWhere(JavaCall.Predicates.target(
            CanBeAnnotated.Predicates.annotatedWith("org.jooq.PlainSQL")
        ))
        .as("业务层禁止使用原始 SQL API（会绕过 DataScopeVisitListener 数据权限拦截）");
}
```

> **注意**：jOOQ 给所有"接受字符串 SQL"的 DSLContext API 都打了 `@PlainSQL` 注解（`fetch(String)` / `execute(String)` / `resultQuery(String)` 等），直接用 ArchUnit 按注解匹配即可，不需要枚举每个方法签名。

### 7.10 方案 E 作为 "jOOQ 横切关注点原生拦截" 的第一个样本

方案 E 把"数据权限"这一横切关注点从业务代码抽到 jOOQ `VisitListener` 单点拦截。这是 meta-build 内部"jOOQ 原生拦截机制吞掉横切关注点"的第一个样本。

后续 M4.2（[04-data-persistence.md §8.5-§8.8](04-data-persistence.md)）把**乐观锁** / **审计字段** / **`updated_at` 自动**也全部收敛到 jOOQ 原生拦截（`Settings` + `RecordListener`），砍掉了 nxboot 的 `JooqHelper` 聚合范式。

两次落地共享同一套哲学：**横切关注点用 jOOQ 原生拦截（`VisitListener` / `RecordListener` / `ExecuteListener` / `Settings`），业务层零感知**。详见 ADR-0007 元方法论。

### 7.11 测试策略

```java
// platform-iam/.../UserRepositoryDataScopeTest.java
@SpringBootTest
@Import(TestSecurityConfig.class)
class UserRepositoryDataScopeTest extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private MockCurrentUser currentUser;
    @Autowired private DataScopeRegistry registry;

    @BeforeEach void setup() {
        registry.register("mb_iam_user", "dept_id");
    }

    @Test
    void normal_user_sees_only_own_dept() {
        currentUser.asUser(100L, "alice",
            DataScopeType.OWN_DEPT, Set.of(1L));  // 只看部门 1
        List<User> users = userRepository.findByStatus(1);
        assertThat(users).allSatisfy(u -> assertThat(u.deptId()).isEqualTo(1L));
    }

    @Test
    void admin_sees_all_users() {
        currentUser.asAdmin();
        List<User> users = userRepository.findByStatus(1);
        assertThat(users.size()).isGreaterThan(1);
    }

    @Test
    void bypassed_method_ignores_data_scope() {
        currentUser.asUser(100L, "alice",
            DataScopeType.OWN_DEPT, Set.of(1L));
        // findByUsernameForLogin 标了 @BypassDataScope
        // 所以即使用户数据范围只到部门 1，也能查到部门 999 的 bob
        Optional<User> bob = userRepository.findByUsernameForLogin("bob");
        assertThat(bob).isPresent();
    }
}
```

<!-- verify: cd server && mvn test -Dtest=UserRepositoryDataScopeTest -pl mb-admin -->
<!-- verify: cd server && grep -rn "extends DataScopedRepository" --include="*.java" mb-platform mb-business && echo "FAIL: 方案 E 已废弃 DataScopedRepository 基类" || echo "OK" -->
<!-- verify: cd server && grep -rn "DataScopeContext" --include="*.java" mb-platform mb-business mb-infra && echo "FAIL: 方案 E 已废弃 DataScopeContext" || echo "OK" -->

---

## 8. 密码与账户安全 [M4]

> **关注点**：密码哈希选型、密码策略、登录保护（渐进延迟 + 滑块验证码）、忘密流程、首次改密、Schema 扩展、AuthService 代码骨架。
>
> **定位**：Sa-Token **不管密码哈希**（只管认证后的 token / session / 权限），密码策略是 `platform-iam` 自己的职责。本节设计独立于 Sa-Token，但通过 `AuthFacade.kickoutAll()` 等 Sa-Token 原生能力和 §6 门面层集成。

### 8.1 设计概览

| 关注点 | 决策 | 备注 |
|---|---|---|
| **密码哈希库** | `spring-security-crypto` 独立 jar（`org.springframework.security:spring-security-crypto`）| 不违反 ADR-0005，详见 [§8.2.1](#821-为什么-spring-security-crypto-不违反-adr-0005) |
| **哈希算法** | bcrypt，`strength=12` | OWASP 2024 推荐；dev/test/prod 统一 strength（"一致性 > 局部优化"元原则）|
| **密码策略** | 通过 `mb.iam.password.*` 配置项可调 | 长度 / 复杂度 / 历史不重用 / 过期 |
| **登录保护** | 渐进延迟 + 滑块验证码（`infra-captcha`）| 替代传统硬锁定，避免攻击者利用锁定 DoS 合法用户 |
| **忘密流程** | Redis 一次性 token（TTL 15 分钟）+ `platform-notification` 发邮件 | 防 email enumeration（统一响应 + 恒定时间）|
| **首次登录改密** | `mb_iam_user.must_change_password` 字段 | 管理员创建用户 / 管理员重置密码时设为 `true` |
| **改密后所有 session 失效** | `AuthFacade.kickoutAll(userId)` | Sa-Token 原生能力 |
| **客户端不 hash** | 信任 HTTPS，客户端传明文 | 详见 [§8.3.5](#835-客户端不-hash信任-https) |
| **2FA** | **v1.5+ 预留**，v1 不做 | Sa-Token 支持二次校验 `StpUtil.openSafe`，v1.5 扩展 |
| **ArchUnit 规则** | 业务层只允许 `org.springframework.security.crypto.*`，禁止其他 spring-security 子包 | [§8.8](#88-archunit-规则--authfacade-扩展) |

### 8.2 密码哈希选型

#### 8.2.1 为什么 `spring-security-crypto` 不违反 ADR-0005

ADR-0005 禁用 Spring Security 是为了**隔离其认证流程组件**（`SecurityContextHolder` / `@PreAuthorize` / filter chain / AuthenticationManager / UserDetails 体系）。这些组件在业务代码里的泄漏会导致：

- 业务层需要知道 Spring Security 的 Authentication / Principal 类型
- 测试需要 `@WithMockUser` 或手工 setup SecurityContext
- 权限判断的接入点散落在 filter / controller / method 三层

**但 `spring-security-crypto` 和这些组件完全正交**：

| 维度 | `spring-security-crypto` | `spring-security-web` + `spring-security-core` |
|---|---|---|
| 包前缀 | `org.springframework.security.crypto.*` | `org.springframework.security.web.*` / `org.springframework.security.core.*` / `org.springframework.security.config.*` |
| 依赖 | **只依赖 `spring-core`** | 依赖 servlet / context / filter / AOP 等大量组件 |
| 体积 | ~70 KB | ~1 MB+ |
| 能力 | 纯密码编码 / 加密工具（`PasswordEncoder` / `BytesEncryptor` / `KeyGenerators`）| 认证流程 + 授权判断 + filter chain |
| 和 Sa-Token 的冲突 | **零冲突**（Sa-Token 不管密码哈希）| 和 Sa-Token 的 `StpLogic` 完全冲突 |

**社区实践**：大量生产项目用 Sa-Token 做认证 + `spring-security-crypto` 做密码哈希，是被广泛验证的组合。`spring-security-crypto` 在这里不扮演"Spring Security"的角色，它是一个**纯算法工具 jar**。

**ArchUnit 层面的表达**（§8.8）：允许 `org.springframework.security.crypto.*`，禁止其他 `spring-security` 子包。这条规则**精确表达**了我们的意图——用它的算法，不用它的认证流程。

#### 8.2.2 Maven 依赖

只在 `infra-security` 的 `pom.xml` 添加：

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-crypto</artifactId>
    <!-- 版本由 spring-boot-dependencies BOM 管理，无需显式指定 -->
</dependency>
```

**不需要** `spring-security-core` / `spring-security-web` / `spring-boot-starter-security`。这些是认证流程的东西，Sa-Token 已经覆盖。

#### 8.2.3 `PasswordEncoder` Bean 定义

在 `infra-security` 的配置类中定义单例 Bean：

```java
package com.metabuild.infra.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

    /**
     * bcrypt strength=12（2^12 = 4096 轮，~250ms/次）。
     *
     * - OWASP 2024 推荐强度
     * - 生产/开发/测试统一 strength（"一致性 > 局部优化"）
     * - 未来升级到 strength=13 或切换 argon2id 时，利用 PasswordEncoder.upgradeEncoding() 
     *   在用户下次登录时渐进 rehash，无需大规模迁移
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

**业务层依赖注入**：

```java
// platform-iam/domain/auth/AuthService.java
@Service
@RequiredArgsConstructor
public class AuthService {
    private final PasswordEncoder passwordEncoder;  // ← 接口注入，不依赖具体实现
    // ...
}
```

业务层 **import 的唯一 spring-security 符号**：`org.springframework.security.crypto.password.PasswordEncoder`。

#### 8.2.4 strength=12 的依据

| strength | 2^strength 轮数 | 单次耗时（典型硬件）| 适用场景 |
|---|---|---|---|
| 10（Spring Security 默认）| 1024 | ~80 ms | 普通 web 应用 |
| **12（meta-build 选择）** | **4096** | **~250 ms** | **OWASP 2024 推荐，平衡安全和用户体验** |
| 14 | 16384 | ~1 s | 高安全场景（银行 / 医疗）|

**为什么不用 dev/prod 差异 strength**：

- "dev 用 strength=10 跑得快"是局部优化的诱惑
- 但"一致性 > 局部优化"元原则禁止这种混合——dev 和 prod 的密码行为必须完全一致，否则"dev 登录正常但 prod 超时"这种故障会让人抓狂
- strength=12 在 dev 下的 250ms 延迟完全可接受

#### 8.2.5 渐进升级：`upgradeEncoding()`

`PasswordEncoder` 接口原生支持升级：

```java
// AuthService.login 核心片段
if (passwordEncoder.matches(plainPassword, user.passwordHash())) {
    // 密码正确后，检查是否需要升级 hash
    if (passwordEncoder.upgradeEncoding(user.passwordHash())) {
        String newHash = passwordEncoder.encode(plainPassword);
        userRepository.updatePasswordHash(user.id(), newHash);
    }
    // ... 继续登录流程
}
```

**何时触发**：
- 当前 `BCryptPasswordEncoder(12)` 识别出 DB 里的 hash 是 `$2a$10$...`（低 strength 或旧算法）
- `upgradeEncoding()` 返回 `true`
- 用明文密码 rehash 存新的 `$2a$12$...`

**这意味着**：未来切换到 strength=13 或 argon2id 时，**不需要大规模迁移 DB**——用户下次登录时自动升级，老用户随时间逐渐迁移完毕。

---

### 8.3 密码策略（可配置）

#### 8.3.1 `mb.iam.password.*` 配置项

所有密码策略通过 `@ConfigurationProperties` 暴露（详见 [09-config-management.md](./09-config-management.md) 前缀规范），使用者可以根据场景调整：

| yml 键 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `mb.iam.password.min-length` | int | `8` | 密码最小长度 |
| `mb.iam.password.max-length` | int | `128` | 密码最大长度（bcrypt 会截断 72 字节，但接受最多 128 字符输入） |
| `mb.iam.password.require-digit` | boolean | `true` | 必须含数字 |
| `mb.iam.password.require-letter` | boolean | `true` | 必须含字母 |
| `mb.iam.password.require-uppercase` | boolean | `false` | 必须含大写字母（默认关闭，过度严格降低可用性）|
| `mb.iam.password.require-special` | boolean | `false` | 必须含特殊字符（默认关闭，同上）|
| `mb.iam.password.history-count` | int | `5` | 密码历史不重用数量 |
| `mb.iam.password.max-age-days` | int | `0` | 密码过期天数，`0` = 不过期（默认不过期，避免"90 天改密"造成的密码 `Password1!` → `Password2!` 反模式）|
| `mb.iam.password.captcha-threshold` | int | `3` | 连续失败多少次后要求滑块验证码 |
| `mb.iam.password.delay-threshold` | int | `5` | 连续失败多少次后开始延迟 |
| `mb.iam.password.short-delay-seconds` | int | `30` | 5-9 次失败的延迟时间（秒） |
| `mb.iam.password.long-delay-seconds` | int | `300` | 10+ 次失败的延迟时间（秒） |
| `mb.iam.password.fail-count-ttl-minutes` | int | `30` | 失败计数器 TTL（最后一次失败后多久自动重置） |
| `mb.iam.password.reset-token-ttl-minutes` | int | `15` | 忘密 token 有效期 |

#### 8.3.2 `MbIamPasswordProperties` 类

```java
package com.metabuild.platform.iam.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "mb.iam.password")
@Validated
public record MbIamPasswordProperties(
    @Min(6) @Max(128) int minLength,
    @Min(8) @Max(256) int maxLength,
    boolean requireDigit,
    boolean requireLetter,
    boolean requireUppercase,
    boolean requireSpecial,
    @Min(0) @Max(24) int historyCount,
    @Min(0) int maxAgeDays,
    @Min(1) @Max(20) int captchaThreshold,
    @Min(1) @Max(20) int delayThreshold,
    @Min(1) int shortDelaySeconds,
    @Min(1) int longDelaySeconds,
    @Min(1) @Max(1440) int failCountTtlMinutes,
    @Min(1) @Max(120) int resetTokenTtlMinutes
) {}
```

#### 8.3.3 密码复杂度校验：`PasswordPolicyValidator`

```java
package com.metabuild.platform.iam.domain.auth;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.platform.iam.config.MbIamPasswordProperties;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PasswordPolicyValidator {

    private final MbIamPasswordProperties policy;

    /**
     * 校验密码是否符合策略。不符合时抛 InvalidPasswordException,错误 key 指向 i18n bundle.
     */
    public void validate(String plainPassword) {
        if (plainPassword == null || plainPassword.length() < policy.minLength()) {
            throw new InvalidPasswordException("iam.password.tooShort", policy.minLength());
        }
        if (plainPassword.length() > policy.maxLength()) {
            throw new InvalidPasswordException("iam.password.tooLong", policy.maxLength());
        }
        if (policy.requireDigit() && !plainPassword.matches(".*\\d.*")) {
            throw new InvalidPasswordException("iam.password.missingDigit");
        }
        if (policy.requireLetter() && !plainPassword.matches(".*[a-zA-Z].*")) {
            throw new InvalidPasswordException("iam.password.missingLetter");
        }
        if (policy.requireUppercase() && !plainPassword.matches(".*[A-Z].*")) {
            throw new InvalidPasswordException("iam.password.missingUppercase");
        }
        if (policy.requireSpecial() && !plainPassword.matches(".*[^a-zA-Z0-9].*")) {
            throw new InvalidPasswordException("iam.password.missingSpecial");
        }
    }
}
```

`InvalidPasswordException` 继承 `BusinessException`（`@ResponseStatus(BAD_REQUEST)`），i18n key 在 `platform-iam/src/main/resources/messages/iam_zh_CN.properties` 中定义。

#### 8.3.4 首次登录强制改密

**Schema 字段**：`mb_iam_user.must_change_password BOOLEAN NOT NULL DEFAULT false`

**何时设为 true**：
1. 管理员创建用户时（`UserService.create()` 默认 `must_change_password = true`）
2. 管理员重置密码时（`AuthService.resetPasswordByAdmin()`）
3. 密码策略升级（可选，运维触发的数据库批量 UPDATE）

**何时变 false**：用户成功改密时（`AuthService.changePassword()`）

**如何强制**：登录成功后，将 `mustChangePassword` 存入 Sa-Token session 数据。全局拦截器（`MustChangePasswordInterceptor`，在 `platform-iam` 的 web 层）检查每个请求：

- 如果 `session.mustChangePassword == true` 且请求路径不是 `POST /api/v1/admin/auth/change-password` 或 `GET /actuator/health`，返回 `403 Forbidden` + `{ code: "iam.auth.passwordMustBeChanged" }`
- 前端捕获此错误码跳转到"强制改密"页面

#### 8.3.5 客户端不 hash：信任 HTTPS

**决策**：客户端向登录/改密接口传**明文密码**，服务端 bcrypt 哈希后存储。**不在客户端做预哈希**。

**为什么**：

| 担心的场景 | 客户端 hash 是否能防御 | 实际答案 |
|---|---|---|
| HTTPS 中间人抓包 | 否 | HTTPS 本身已防御 |
| 服务端日志泄漏密码 | 否 | 服务端也要处理"客户端传来的 hash"，日志同样会泄漏 |
| 服务端 DB 泄漏 | 否 | 拿到 bcrypt hash 的攻击者依然需要 crack |
| 减轻服务端计算压力 | 否 | 服务端还是要对客户端传的 hash 再做一次 bcrypt（否则 hash 本身成为"密码等价物"）|

**唯一合理场景**：如果担心服务端代码有漏洞记录明文密码（日志 / 异常堆栈），客户端传 hash 可以让"泄漏"变成"泄漏 hash"。但这个防御等价于"在业务层记住不要 log 明文密码"。

**meta-build 的决策**：业务代码通过 code review 禁止 log 明文密码，客户端传明文信任 HTTPS。符合 Java/Spring 生态主流做法。

---

### 8.4 登录保护（渐进延迟 + 滑块验证码）

v1 采用**渐进延迟 + 验证码**替代传统硬锁定，避免攻击者利用锁定机制 DoS 合法用户。

#### 8.4.1 渐进策略

基于 Redis 计数，key: `mb:auth:login-fail:{username}`：

| 连续失败次数 | 响应 |
|-------------|------|
| 1-2 次 | 正常提示"用户名或密码错误" |
| 3-4 次 | 要求**滑块验证码**（`infra-captcha` 模块提供） |
| 5-9 次 | 验证码 + **延迟 30 秒**才能重试 |
| 10+ 次 | 验证码 + **延迟 5 分钟** |

**设计要点**：
- 计数器 TTL 30 分钟（最后一次失败后 30 分钟无新失败自动重置）
- 登录成功后立即清零计数器
- 延迟在服务端实现（Redis TTL 标记"该 username 在 X 时间前不允许尝试"），不是 `Thread.sleep()`
- 渐进延迟 + per-IP 30 次/分钟限流双重保护

**与硬锁定的对比**：
- 硬锁定：攻击者故意输错 5 次 → 合法用户被锁 30 分钟（DoS）
- 渐进延迟：攻击者输错 10 次 → 只是需要等 5 分钟 + 过验证码，合法用户知道自己密码可以正常登录（只需过验证码）

#### 8.4.2 `LoginProtectionService`

```java
package com.metabuild.platform.iam.domain.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class LoginProtectionService {

    private final StringRedisTemplate redis;
    private final MbIamPasswordProperties policy;

    private static final String FAIL_KEY = "mb:auth:login-fail:";
    private static final String DELAY_KEY = "mb:auth:login-delay:";

    /**
     * 获取当前失败次数。
     */
    public long getFailCount(String username) {
        String val = redis.opsForValue().get(FAIL_KEY + username);
        return val == null ? 0 : Long.parseLong(val);
    }

    /**
     * 是否需要验证码（失败次数 >= captchaThreshold）。
     */
    public boolean requiresCaptcha(String username) {
        return getFailCount(username) >= policy.captchaThreshold();
    }

    /**
     * 是否处于延迟冷却期（该 username 暂不允许登录尝试）。
     */
    public boolean isDelayed(String username) {
        return Boolean.TRUE.equals(redis.hasKey(DELAY_KEY + username));
    }

    /**
     * 登录失败后递增计数 + 按阶梯设置延迟。
     */
    public long recordFailure(String username) {
        String key = FAIL_KEY + username;
        Long count = redis.opsForValue().increment(key);
        // 首次递增时设置 TTL
        if (count != null && count == 1L) {
            redis.expire(key, policy.failCountTtlMinutes(), TimeUnit.MINUTES);
        }
        long failCount = count == null ? 0 : count;

        // 按阶梯设置延迟
        if (failCount >= 10) {
            redis.opsForValue().set(
                DELAY_KEY + username, "1",
                Duration.ofSeconds(policy.longDelaySeconds()));
        } else if (failCount >= policy.delayThreshold()) {
            redis.opsForValue().set(
                DELAY_KEY + username, "1",
                Duration.ofSeconds(policy.shortDelaySeconds()));
        }
        return failCount;
    }

    /**
     * 登录成功后清零。
     */
    public void resetOnSuccess(String username) {
        redis.delete(FAIL_KEY + username);
        redis.delete(DELAY_KEY + username);
    }
}
```

**注意**：失败计数的 TTL 只在**首次递增时设置**，后续递增不刷新——这样"滑动窗口"变成"固定窗口"，避免攻击者通过持续尝试让计数窗口无限延长。Redis key 基于 `username` 而非 `userId`，因为攻击者不知道 userId，且要覆盖用户不存在的情况。

---

### 8.5 忘记密码流程

#### 8.5.1 流程

```
用户 → POST /api/v1/public/auth/forgot-password { email }
   ↓
AuthService.requestPasswordReset(email)
   ↓ 
1. 无论邮箱是否存在,立即返回 200 OK + { message: "iam.auth.passwordResetEmailSent" }
2. 后台异步(@Async 或线程池):
   - 如果邮箱存在:
     a. 生成 token(SecureRandom.nextBytes + Base64URL)
     b. 写 Redis: key = mb:iam:pwd-reset:<token>, value = userId, TTL = 15 min
     c. 调用 NotificationApi.sendEmail(user.email, "重置密码", "点击链接: https://.../reset-password?token=<token>")
   - 如果邮箱不存在:
     a. 不做任何事(但响应时间和存在时对齐,防 timing enumeration)

用户 → POST /api/v1/public/auth/reset-password { token, newPassword }
   ↓
AuthService.confirmPasswordReset(token, newPassword)
   ↓
1. Redis GET mb:iam:pwd-reset:<token> → userId
2. 如果 token 不存在或已使用 → 400 + iam.auth.invalidResetToken
3. 校验 newPassword 符合策略(含历史不重用)
4. 更新 password hash + 写历史表 + 清除 must_change_password
5. DELETE Redis token key(一次性)
6. LoginProtectionService.resetOnSuccess(username)（顺便清零失败计数）
7. AuthFacade.kickoutAll(userId)(所有旧 session 失效)
8. 返回 200 OK
```

#### 8.5.2 Token 生成

```java
// 32 字节随机 = 256 bit entropy,Base64URL 不含 padding
byte[] bytes = new byte[32];
new SecureRandom().nextBytes(bytes);
String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
// token 长度 43 字符,URL-safe
```

Redis 存储：

```java
redis.opsForValue().set(
    "mb:iam:pwd-reset:" + token,
    String.valueOf(userId),
    Duration.ofMinutes(policy.resetTokenTtlMinutes())
);
```

一次性消费：

```java
// 原子 GETDEL(Redis 6.2+)或 Lua 脚本
String userIdStr = redis.opsForValue().getAndDelete("mb:iam:pwd-reset:" + token);
if (userIdStr == null) {
    throw new BusinessException("iam.auth.invalidResetToken");
}
Long userId = Long.parseLong(userIdStr);
```

#### 8.5.3 防 email enumeration

**关键**：无论邮箱是否存在，响应**内容相同 + 响应时间对齐**。

实现：

```java
@Transactional
public void requestPasswordReset(String email) {
    // 1. 立即在 @Async 或独立线程池处理发信,主线程立即返回
    asyncExecutor.execute(() -> {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = generateResetToken();
            redis.opsForValue().set(
                "mb:iam:pwd-reset:" + token,
                String.valueOf(user.id()),
                Duration.ofMinutes(policy.resetTokenTtlMinutes())
            );
            notificationApi.sendEmail(
                user.email(),
                i18n.get("iam.email.passwordReset.subject"),
                i18n.get("iam.email.passwordReset.body", token)
            );
        }
        // 不存在的邮箱:不做任何事,不记日志(避免日志差异被利用)
    });
    // 2. 主线程不等待 async 完成,立即返回
}
```

**响应端**：Controller 直接返回 `200 { message: "iam.auth.passwordResetEmailSent" }`，不区分"已发送"和"邮箱不存在"。

#### 8.5.4 依赖 `platform-notification`

本模块通过 `NotificationApi` 接口调用 `platform-notification` 发邮件。跨模块依赖在 `platform-iam/pom.xml`：

```xml
<dependency>
    <groupId>com.metabuild</groupId>
    <artifactId>platform-notification</artifactId>
</dependency>
```

`NotificationApi` 接口定义见 `platform-notification` 模块（M4 落地），本节不重复。

---

### 8.6 密码修改流程

#### 8.6.1 已登录用户改密

```java
@Transactional
public void changePassword(ChangePasswordCmd cmd) {
    // 注意：@OperationLog 放对应的 Controller 方法上（N3 §2.5）
    Long userId = currentUser.userId();
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("iam.user.notFound"));

    // 1. 校验旧密码(即使已登录,改密也要验证身份)
    if (!passwordEncoder.matches(cmd.oldPassword(), user.passwordHash())) {
        throw new InvalidCredentialsException("iam.auth.oldPasswordMismatch");
    }

    // 2. 新密码策略
    passwordPolicyValidator.validate(cmd.newPassword());

    // 3. 历史不重用
    checkPasswordHistory(userId, cmd.newPassword());

    // 4. 更新 hash + 写历史 + 清除 must_change_password
    String newHash = passwordEncoder.encode(cmd.newPassword());
    userRepository.updatePassword(userId, newHash, false);  // must_change_password=false
    passwordHistoryRepository.append(userId, user.passwordHash());
    passwordHistoryRepository.trimToLastN(userId, policy.historyCount());

    // 5. 所有 session 失效(含当前)
    //    强制用户重新登录,确保新密码生效
    authFacade.kickoutAll(userId);
}

private void checkPasswordHistory(Long userId, String newPlainPassword) {
    if (policy.historyCount() == 0) return;
    List<String> historyHashes = passwordHistoryRepository.findLastN(userId, policy.historyCount());
    for (String oldHash : historyHashes) {
        if (passwordEncoder.matches(newPlainPassword, oldHash)) {
            throw new BusinessException("iam.password.reused", policy.historyCount());
        }
    }
}
```

#### 8.6.2 管理员重置密码

**注意**：`@RequirePermission("iam:user:resetPassword")` 应该放在对应的 Controller 方法上，不在 Service 方法上（N3 §2.5）。

Controller 层（权限声明）：

```java
// platform-iam/web/PasswordController.java
@RestController
@RequestMapping("/api/v1/iam/passwords")
@RequiredArgsConstructor
public class PasswordController {

    private final PasswordService passwordService;

    @PostMapping("/admin-reset")
    @RequirePermission("iam:user:resetPassword")       // ← 权限在 Controller 层
    @OperationLog(action = "iam.auth.resetPasswordByAdmin")
    public String resetPasswordByAdmin(@RequestBody @Valid ResetPasswordByAdminCommand cmd) {
        return passwordService.resetPasswordByAdmin(cmd);
    }
}
```

Service 层（业务逻辑，无 @RequirePermission）：

```java
// platform-iam/domain/auth/PasswordService.java
@Transactional
public String resetPasswordByAdmin(ResetPasswordByAdminCommand cmd) {
    User user = userRepository.findById(cmd.targetUserId())
        .orElseThrow(() -> new NotFoundException("iam.user.notFound"));

    // 生成临时密码（或使用管理员传入的密码）
    String tempPassword = cmd.newPassword() != null ? cmd.newPassword() : generateTempPassword();
    passwordPolicyValidator.validate(tempPassword);

    String newHash = passwordEncoder.encode(tempPassword);
    // must_change_password=true：用户下次登录必须改密
    userRepository.updatePassword(cmd.targetUserId(), newHash, true);
    passwordHistoryRepository.append(cmd.targetUserId(), user.passwordHash());

    // 管理员重置密码也应该 kickoutAll
    authFacade.kickoutAll(cmd.targetUserId());

    // 如果管理员选择"通知用户"，则发送包含临时密码的邮件
    if (cmd.notifyUser()) {
        notificationApi.sendEmail(
            user.email(),
            i18n.get("iam.email.passwordResetByAdmin.subject"),
            i18n.get("iam.email.passwordResetByAdmin.body", tempPassword)
        );
    }
    return tempPassword;  // 返回给管理员，由管理员转告用户或走邮件
}
```

#### 8.6.3 改密后所有 session 失效

`AuthFacade.kickoutAll(userId)` 是 Sa-Token 原生能力的门面封装。实现：

```java
// infra-security/SaTokenAuthFacade
@Override
public void kickoutAll(Long userId) {
    StpUtil.kickout(userId);  // Sa-Token 把该 user 的所有 session 都注销
}
```

调用点：
- 用户自助改密成功后
- 管理员重置密码后
- 忘密流程确认后
- 管理员手动强制下线（`AuthService.forceLogout(userId)`）

---

### 8.7 Schema 扩展

#### 8.7.1 `mb_iam_user` 新增字段

在原有 user 表基础上加四个字段（`mb-schema/src/main/resources/db/migration/` 的早期 migration 里直接包含）：

```sql
-- V20260601_001__iam_user.sql 的完整版本
CREATE TABLE mb_iam_user (
    id                     BIGINT       PRIMARY KEY,
    tenant_id              BIGINT       NOT NULL DEFAULT 0,
    username               VARCHAR(64)  NOT NULL,
    password_hash          VARCHAR(128) NOT NULL,       -- bcrypt $2a$12$... 共 60 字节
    email                  VARCHAR(255),
    dept_id                BIGINT,
    status                 SMALLINT     NOT NULL DEFAULT 1,
    -- === 密码和账户安全字段(ADR-待)===
    password_updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    must_change_password   BOOLEAN      NOT NULL DEFAULT false,
    -- =====================================
    version                INTEGER      NOT NULL DEFAULT 0,
    created_by             BIGINT       NOT NULL,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by             BIGINT       NOT NULL,
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_mb_iam_user_tenant_username
    ON mb_iam_user (tenant_id, username);
CREATE INDEX idx_mb_iam_user_tenant_email
    ON mb_iam_user (tenant_id, email);
```

**说明**：
- `failed_login_count` / 延迟状态**不在表里**——Redis 存（§8.4），避免高频写 DB
- `password_updated_at` 用于密码过期检查（如果 `mb.iam.password.max-age-days > 0`）
- `must_change_password` 用于首次登录强制改密（§8.3.4）

#### 8.7.2 `mb_iam_password_history` 表

```sql
-- V20260601_007__iam_password_history.sql
CREATE TABLE mb_iam_password_history (
    id                BIGINT       PRIMARY KEY,
    tenant_id         BIGINT       NOT NULL DEFAULT 0,
    user_id           BIGINT       NOT NULL,
    password_hash     VARCHAR(128) NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mb_iam_password_history_user_created
    ON mb_iam_password_history (tenant_id, user_id, created_at DESC);
```

**清理策略**：`PasswordHistoryRepository.trimToLastN(userId, N)` 在每次改密后执行——保留最新 N 条，删除更老的。不需要定时任务。

#### 8.7.3 忘密 token 不建表

忘密 token 存 Redis（§8.5.2），**不创建 `mb_iam_password_reset_token` 表**，理由：

- token 的生命周期 15 分钟，DB 存储成本和清理成本不划算
- Redis 的 `SET ... EX ... NX` + `GETDEL` 是原生原子操作
- 忘密 token 不需要"历史审计"（操作日志由 `@OperationLog` 注解记录）

---

### 8.8 ArchUnit 规则 + AuthFacade 扩展

#### 8.8.1 业务层只允许 `spring-security-crypto`

新增 ArchUnit 规则（`infra-archunit` M4 落地）：

```java
@ArchTest
static final ArchRule BUSINESS_CAN_ONLY_USE_CRYPTO_FROM_SPRING_SECURITY = noClasses()
    .that().resideInAnyPackage("..platform..", "..business..")
    .should().dependOnClassesThat()
    .resideInAnyPackage(
        "org.springframework.security.web..",
        "org.springframework.security.core..",
        "org.springframework.security.config..",
        "org.springframework.security.oauth2..",
        "org.springframework.security.authentication.."
    )
    .because(
        "业务层只允许 org.springframework.security.crypto.* 作密码哈希工具(§8.2.1)," +
        "禁止 Spring Security 的认证 / 授权 / 配置 / filter chain 组件(ADR-0005)"
    );
```

这条规则**精确表达**了我们的意图：允许密码工具，禁止认证框架。

#### 8.8.2 `AuthFacade` 接口扩展

在 §6.6 定义的 `AuthFacade` 接口基础上新增 `kickoutAll` 方法（如果尚未加）：

```java
// mb-common/src/main/java/com/metabuild/common/security/AuthFacade.java
public interface AuthFacade {
    LoginResult doLogin(Long userId, SessionData sessionData);  // 签发 access + refresh 双 token
    LoginResult refresh(String refreshToken);                    // 刷新 token（rotation）
    void logout();
    void kickout(String token);
    void kickoutAll(Long userId);   // ★ 新增：强制该 user 所有 session 失效
    void renewTimeout();
}
```

`SaTokenAuthFacade` 实现：

```java
@Override
public void kickoutAll(Long userId) {
    StpUtil.kickout(userId);  // Sa-Token 原生：把 user 的所有 token 注销
}
```

---

### 8.9 AuthService 完整代码骨架

> **这是 M4 落地时的参考实现**。使用者可以直接复制到 `platform-iam/domain/auth/AuthService.java`。

#### `PasswordResetEmailSender`（独立 Bean，确保 @Async 代理生效）

Spring AOP 代理机制：同一个 Bean 内部调用（`this.sendXxx()`）不走代理，`@Async` 不生效。因此发重置邮件的逻辑必须提取到独立 Bean：

```java
// platform-iam/domain/auth/PasswordResetEmailSender.java
package com.metabuild.platform.iam.domain.auth;

import com.metabuild.platform.notification.api.NotificationApi;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PasswordResetEmailSender {

    private final UserRepository userRepository;
    private final ResetTokenStore resetTokenStore;
    private final NotificationApi notificationApi;
    private final MbIamPasswordProperties policy;

    /**
     * 异步发送密码重置邮件。
     *
     * 必须放在独立 Bean（非 AuthService 内部方法），
     * 否则 Spring AOP 代理的同类内部调用绕过 @Async 拦截，方法会在当前线程同步执行。
     */
    @Async
    public void sendResetEmail(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return;  // 静默失败，防 email enumeration

        User user = userOpt.get();
        String token = generateResetToken();
        resetTokenStore.put(token, user.id(), Duration.ofMinutes(policy.resetTokenTtlMinutes()));
        notificationApi.sendPasswordResetEmail(user.email(), token);
    }

    private static String generateResetToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
```

#### `AuthService` 骨架

```java
package com.metabuild.platform.iam.domain.auth;

import com.metabuild.common.security.AuthFacade;
import com.metabuild.common.security.CurrentUser;
import com.metabuild.common.security.DataScope;
import com.metabuild.common.security.LoginResult;
// 注意：@OperationLog 放 Controller 层，Service 不导入
import com.metabuild.platform.iam.config.MbIamPasswordProperties;
import com.metabuild.platform.iam.domain.user.User;
import com.metabuild.platform.iam.domain.user.UserRepository;
import com.metabuild.platform.notification.api.NotificationApi;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String FAKE_BCRYPT_HASH =
        "$2a$12$AbCdEfGhIjKlMnOpQrStUuVwXyZ0123456789AbCdEfGhIjKlMn";

    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final AuthFacade authFacade;
    private final LoginProtectionService loginProtectionService;
    private final CaptchaService captchaService;
    private final DataScopeLoader dataScopeLoader;
    private final ResetTokenStore resetTokenStore;                   // Redis 封装
    private final PasswordResetEmailSender passwordResetEmailSender; // 独立 Bean 确保 @Async 代理生效
    private final CurrentUser currentUser;
    private final MbIamPasswordProperties policy;

    /**
     * 用户登录。
     * 
     * 失败情况:
     * - InvalidCredentialsException: 用户名不存在 / 密码错误(统一响应,防枚举)
     * - LoginDelayedException: 处于延迟冷却期,需等待后重试
     * - CaptchaRequiredException: 需要滑块验证码
     * 
     * 注意:
     * - 对不存在的用户也执行一次 bcrypt 运算,防 timing 侧信道枚举
     * - 密码正确后检查 upgradeEncoding,渐进升级 hash
     */
    public LoginResult login(String username, String plainPassword, String captchaToken) {
        // 渐进延迟检查
        if (loginProtectionService.isDelayed(username)) {
            throw new LoginDelayedException("iam.auth.loginDelayed");
        }

        // 验证码检查（失败 >= captchaThreshold 次后要求）
        if (loginProtectionService.requiresCaptcha(username)) {
            if (captchaToken == null || !captchaService.verify(captchaToken)) {
                throw new CaptchaRequiredException("iam.auth.captchaRequired");
            }
        }

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            // 假运算,让响应时间和存在用户一致
            passwordEncoder.matches(plainPassword, FAKE_BCRYPT_HASH);
            loginProtectionService.recordFailure(username);
            throw new InvalidCredentialsException("iam.auth.invalidCredentials");
        }
        User user = userOpt.get();

        // 密码校验
        if (!passwordEncoder.matches(plainPassword, user.passwordHash())) {
            loginProtectionService.recordFailure(username);
            throw new InvalidCredentialsException("iam.auth.invalidCredentials");
        }

        // 密码正确:清零失败计数
        loginProtectionService.resetOnSuccess(username);

        // 渐进升级 hash
        if (passwordEncoder.upgradeEncoding(user.passwordHash())) {
            String newHash = passwordEncoder.encode(plainPassword);
            userRepository.updatePasswordHash(user.id(), newHash);
        }

        // 加载数据范围(方案 E)
        DataScope dataScope = dataScopeLoader.loadForUser(user.id());

        // Sa-Token 登录(通过门面)
        return authFacade.doLogin(
            user.id(),
            new SessionData(user.id(), user.username(), dataScope, user.mustChangePassword())
        );
    }

    @Transactional
    public void changePassword(ChangePasswordCmd cmd) {
        // 注意：@OperationLog 放对应的 Controller 方法上（N3 §2.5）
        Long userId = currentUser.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound"));

        if (!passwordEncoder.matches(cmd.oldPassword(), user.passwordHash())) {
            throw new InvalidCredentialsException("iam.auth.oldPasswordMismatch");
        }

        passwordPolicyValidator.validate(cmd.newPassword());
        checkPasswordHistory(userId, cmd.newPassword());

        String newHash = passwordEncoder.encode(cmd.newPassword());
        userRepository.updatePassword(userId, newHash, false);
        passwordHistoryRepository.append(userId, user.passwordHash());
        passwordHistoryRepository.trimToLastN(userId, policy.historyCount());
        authFacade.kickoutAll(userId);
    }

    /** 忘密流程第一步:请求重置邮件 */
    public void requestPasswordReset(String email) {
        // 注意：通过独立 Bean passwordResetEmailSender 而非 this.sendXxx() 调用异步方法，
        // 避免 Spring AOP 代理的同类内部调用问题（@Async 在 this.xxx() 上不生效）
        passwordResetEmailSender.sendResetEmail(email);
    }

    /** 忘密流程第二步:凭 token 改密 */
    @Transactional
    public Long confirmPasswordReset(String token, String newPassword) {
        // 注意：@OperationLog 放对应的 Controller 方法上（N3 §2.5）
        Long userId = resetTokenStore.consume(token)
            .orElseThrow(() -> new BusinessException("iam.auth.invalidResetToken"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("iam.user.notFound"));

        passwordPolicyValidator.validate(newPassword);
        checkPasswordHistory(userId, newPassword);

        String newHash = passwordEncoder.encode(newPassword);
        userRepository.updatePassword(userId, newHash, false);
        passwordHistoryRepository.append(userId, user.passwordHash());
        passwordHistoryRepository.trimToLastN(userId, policy.historyCount());

        loginProtectionService.resetOnSuccess(user.username());  // 顺便清零失败计数
        authFacade.kickoutAll(userId);
        return userId;
    }

    // 注意：@RequirePermission 和 @OperationLog 都必须放在 Controller 层（N3 §2.5），不放 Service
    @Transactional
    public String resetPasswordByAdmin(ResetPasswordByAdminCommand cmd) {
        User user = userRepository.findById(cmd.targetUserId())
            .orElseThrow(() -> new NotFoundException("iam.user.notFound"));

        String tempPassword = cmd.newPassword() != null ? cmd.newPassword() : generateTempPassword();
        passwordPolicyValidator.validate(tempPassword);

        String newHash = passwordEncoder.encode(tempPassword);
        userRepository.updatePassword(cmd.targetUserId(), newHash, true);  // must_change_password=true
        passwordHistoryRepository.append(cmd.targetUserId(), user.passwordHash());
        authFacade.kickoutAll(cmd.targetUserId());

        if (cmd.notifyUser()) {
            notificationApi.sendPasswordResetByAdminEmail(user.email(), tempPassword);
        }
        return tempPassword;  // 返回给管理员，由管理员转告用户或走邮件
    }

    private void checkPasswordHistory(Long userId, String newPlainPassword) {
        if (policy.historyCount() == 0) return;
        List<String> historyHashes = passwordHistoryRepository.findLastN(userId, policy.historyCount());
        for (String oldHash : historyHashes) {
            if (passwordEncoder.matches(newPlainPassword, oldHash)) {
                throw new BusinessException("iam.password.reused", policy.historyCount());
            }
        }
    }

    private static String generateTempPassword() {
        // 简单示例:随机 12 字符,满足默认策略(长度 ≥ 8 + 字母 + 数字)
        // 生产建议用 Passay 或类似库生成合规密码
        byte[] bytes = new byte[9];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).substring(0, 12);
    }
}
```

---

### 8.10 AuthController 骨架

> **这是 M4 落地时的参考实现**。`/api/v1/auth/**` 是认证相关的唯一入口，`AuthService` 承担业务逻辑，`AuthController` 只做请求解析和响应映射。

```java
// import com.metabuild.common.security.CurrentUser;
// import com.metabuild.platform.log.OperationLog;  // 操作日志注解

/**
 * 认证相关端点。
 * /auth/login 和 /auth/logout 是公开/半公开路径，
 * /auth/me 需要已登录（Sa-Token 自动验证，不需要 @RequirePermission）。
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;

    /**
     * 获取当前登录用户信息（前端 useCurrentUser hook 消费）。
     * 未登录时 Sa-Token 拦截返回 401 ProblemDetail，前端 throwOnError:false 降级为匿名用户。
     */
    @GetMapping("/me")
    public CurrentUserSnapshot me() {
        return authService.getCurrentUserSnapshot(currentUser.userId());
    }

    @PostMapping("/login")
    @OperationLog(action = "iam.auth.login")
    public LoginResult login(@RequestBody @Valid LoginCmd cmd) {
        return authService.login(cmd.username(), cmd.password());
    }

    @PostMapping("/logout")
    @OperationLog(action = "iam.auth.logout")
    public void logout() {
        authService.logout();
    }
}
```

#### `CurrentUserSnapshot` DTO

`/auth/me` 响应体，前端 `useCurrentUser()` hook 消费。字段设计遵循"前端需要什么就暴露什么"原则，权限点 code 列表由角色→菜单→路由树 JOIN 推导（详见前端权限双树架构）。

```java
/**
 * /auth/me 响应体，前端 useCurrentUser() 消费。
 */
public record CurrentUserSnapshot(
    long userId,
    String username,
    Long tenantId,
    List<String> permissions,       // 权限点 code 列表（由角色→菜单→路由树 JOIN 推导）
    List<String> roles,             // 角色 code 列表
    String dataScopeType,           // 数据范围类型
    List<Long> dataScopeDeptIds     // 自定义部门范围（dataScopeType=CUSTOM_DEPT 时有值）
) {
    public static CurrentUserSnapshot from(CurrentUser user, List<String> permissions) {
        return new CurrentUserSnapshot(
            user.userId(), user.username(), user.tenantId(),
            permissions, List.copyOf(user.roles()),
            user.dataScopeType().name(), List.copyOf(user.dataScopeDeptIds())
        );
    }
}
```

**Sa-Token 路由放行规则**：

| 端点 | 放行策略 | 说明 |
|---|---|---|
| `POST /api/v1/auth/login` | 完全放行（匿名可访问）| Sa-Token 拦截器 excludeList |
| `POST /api/v1/auth/logout` | 放行（未登录也可调用）| 幂等，未登录时 no-op |
| `GET /api/v1/auth/me` | **需要登录**（Sa-Token 拦截器校验 token）| 未登录返回 401 ProblemDetail |

---

### 8.11 测试策略

| 测试 | 覆盖点 | 落地位置 |
|---|---|---|
| `BCryptPasswordEncoderTest` | strength=12 / encode / matches / upgradeEncoding | `infra-security` 单元测试 |
| `PasswordPolicyValidatorTest` | 各策略开关 + 正例 + 反例 | `platform-iam` 单元测试 |
| `LoginProtectionServiceTest` | 计数递增 / TTL / 渐进延迟 / 验证码阈值 / 清零 | `platform-iam` 单元测试 + Testcontainers Redis |
| `AuthServiceLoginIT` | 正常登录 / 密码错误 / 渐进延迟 / 验证码要求 / 时间侧信道 | `mb-admin` 集成测试 |
| `AuthServiceChangePasswordIT` | 旧密码对/错 / 历史不重用 / session 失效 | `mb-admin` 集成测试 |
| `PasswordResetFlowIT` | 请求 → 邮件发送（Mock） → token 消费 → 改密成功 → 解锁 | `mb-admin` 集成测试 |
| `EmailEnumerationIT` | 存在 / 不存在邮箱的响应体和响应时间差 | `mb-admin` 集成测试 |

---

### 8.12 v1.5+ 预留

| 能力 | 实现思路 |
|---|---|
| **2FA（TOTP）**| Sa-Token 原生 `StpUtil.openSafe(service, safeTime)` 做二次校验 token；`mb_iam_user` 加 `totp_secret` 字段；登录成功后进入"二次校验"状态，提交 TOTP 码才能访问敏感接口 |
| **密码强度评估** | 引入 `nulab:zxcvbn4j` 库，前端也可以用 `zxcvbn` JS 版实时评分 |
| **异常登录检测** | 记录登录 IP / User-Agent / 地理位置；新设备登录时发送通知邮件；连续异常时强制 2FA |
| **WebAuthn / 指纹 / Passkey** | 独立模块 `infra-webauthn`（v2+ 设计）|
| **OAuth2 / OIDC 集成** | 切换到 Spring Security 或引入 `just-auth` 库（v1.5 评估）|

v1 **不做以上任何一项**，M4 落地时只覆盖 §8.1-8.11 的核心能力。

---

[← 返回 README](./README.md)
