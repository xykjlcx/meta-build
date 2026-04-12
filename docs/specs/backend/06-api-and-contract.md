# 06 - API 响应与契约驱动

> **关注点**：异常基类层次、ProblemDetail、PageResult、i18n、错误码命名、契约驱动 OpenAPI 工作流、@mb/api-sdk 输出。
>
> **本文件吸收原 backend-architecture.md §9（异常与响应）+ §12（契约驱动）**。两者共享"API 边界契约"主题（ProblemDetail 是错误契约，OpenAPI 是结构契约）。

## 1. 异常基类层次 [M4]

```java
// mb-common/src/main/java/com/metabuild/common/exception/MetaBuildException.java
public abstract class MetaBuildException extends RuntimeException {
    private final String code;      // 错误码（用于 i18n + 前端分支）
    private final HttpStatus status; // HTTP 状态码
    private final Object[] args;     // i18n 消息占位符参数

    protected MetaBuildException(String code, HttpStatus status, Object... args) {
        super(code);
        this.code = code;
        this.status = status;
        this.args = args;
    }
    // getters ...
}

// 4xx 业务异常基类
public class BusinessException extends MetaBuildException {
    public BusinessException(String code, HttpStatus status, Object... args) {
        super(code, status, args);
    }
}

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, Object... args) {
        super(code, HttpStatus.NOT_FOUND, args);
    }
}

public class UnauthorizedException extends BusinessException {
    public UnauthorizedException(String code, Object... args) {
        super(code, HttpStatus.UNAUTHORIZED, args);
    }
}

public class ForbiddenException extends BusinessException {
    public ForbiddenException(String code, Object... args) {
        super(code, HttpStatus.FORBIDDEN, args);
    }
}

public class ConflictException extends BusinessException {
    public ConflictException(String code, Object... args) {
        super(code, HttpStatus.CONFLICT, args);
    }
}

// 5xx 系统异常基类
public class SystemException extends MetaBuildException {
    public SystemException(String code, Object... args) {
        super(code, HttpStatus.INTERNAL_SERVER_ERROR, args);
    }
}
```

## 2. GlobalExceptionHandler 处理范围 [M4]

| 异常类型 | HTTP Status | 映射结果 |
|---------|------------|---------|
| `MetaBuildException` | 从异常 status 字段 | ProblemDetail |
| `MethodArgumentNotValidException` (Bean Validation) | 400 | ProblemDetail + `errors[]` 扩展字段 |
| `AuthenticationException` | 401 | ProblemDetail |
| `AccessDeniedException` | 403 | ProblemDetail |
| `Exception`（兜底） | 500 | ProblemDetail（**隐藏堆栈**，只留 traceId） |
| `org.jooq.exception.DataChangedException` | 409 Conflict | ProblemDetail（`errorCode: common.optimisticLock`）+ jOOQ 乐观锁冲突（见 [04-data-persistence.md §8.5](04-data-persistence.md)）|

## 3. 响应格式混合方案 [M4]

| 场景 | 格式 | Content-Type | HTTP Status |
|------|------|--------------|------------|
| **成功（单对象）** | 直接返回业务对象 `UserView { ... }` | `application/json` | 200 / 201 |
| **成功（列表）** | 直接返回数组 `[UserView, ...]` | `application/json` | 200 |
| **成功（分页）** | `PageResult<T>` | `application/json` | 200 |
| **成功（无内容）** | 空 body | - | 204 |
| **错误（业务）** | `ProblemDetail` + 扩展字段 `code` | `application/problem+json` | 4xx |
| **错误（系统）** | `ProblemDetail` + 扩展字段 `traceId` | `application/problem+json` | 5xx |
| **错误（验证）** | `ProblemDetail` + 扩展字段 `errors[]` | `application/problem+json` | 400 |

`PageResult<T>` 结构定义见 [§12.2 PageResult 定义](#122-pagequery-和-pageresult)。

#### GlobalExceptionHandler 实现骨架

```java
// mb-infra/infra-exception/src/main/java/com/metabuild/infra/exception/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;
    private final String errorBaseUri = "https://meta-build.dev/errors/";

    @ExceptionHandler(MetaBuildException.class)
    public ProblemDetail handleMetaBuild(MetaBuildException ex, HttpServletRequest req) {
        Locale locale = LocaleContextHolder.getLocale();
        String detail = messageSource.getMessage(
            "errors." + ex.getCode() + ".detail", ex.getArgs(), ex.getCode(), locale);
        String title = messageSource.getMessage(
            "errors." + ex.getCode() + ".title", null, ex.getCode(), locale);

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(ex.getStatus(), detail);
        pd.setType(URI.create(errorBaseUri + ex.getCode()));
        pd.setTitle(title);
        pd.setInstance(URI.create(req.getRequestURI()));
        pd.setProperty("code", ex.getCode());
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
            .toList();

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Validation failed");
        pd.setType(URI.create(errorBaseUri + "validation"));
        pd.setTitle("Validation Error");
        pd.setInstance(URI.create(req.getRequestURI()));
        pd.setProperty("errors", errors);
        pd.setProperty("traceId", MDC.get("traceId"));
        return pd;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnknown(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception [{}]", MDC.get("traceId"), ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        pd.setType(URI.create(errorBaseUri + "system.internal"));
        pd.setTitle("Internal Server Error");
        pd.setInstance(URI.create(req.getRequestURI()));
        pd.setProperty("traceId", MDC.get("traceId"));
        // 不暴露堆栈
        return pd;
    }
}
```

## 4. i18n 国际化 [M4]

#### 决策

- **MessageSource** 加载多语言文件
- **LocaleResolver**: `AcceptHeaderLocaleResolver`（根据 `Accept-Language` header 识别）
- **默认 locale**: `zh_CN`
- **支持 locale**: `zh_CN`, `en_US`（v1 只支持这两个，v1.5 扩展）

#### 消息文件组织

```
mb-admin/src/main/resources/messages/
├── messages_zh_CN.properties     # 顶层消息（common）
├── messages_en_US.properties
└── ...

mb-platform/platform-iam/src/main/resources/messages/
├── iam_zh_CN.properties
└── iam_en_US.properties

mb-platform/platform-oplog/src/main/resources/messages/
├── oplog_zh_CN.properties
└── oplog_en_US.properties
```

#### 消息 key 命名

每个错误码对应两个 key：

```properties
# iam_zh_CN.properties
errors.iam.user.notFound.title=用户不存在
errors.iam.user.notFound.detail=用户 ID {0} 不存在
errors.iam.user.duplicateEmail.title=邮箱已存在
errors.iam.user.duplicateEmail.detail=邮箱 {0} 已被其他用户使用
```

```properties
# iam_en_US.properties
errors.iam.user.notFound.title=User Not Found
errors.iam.user.notFound.detail=User with ID {0} does not exist
errors.iam.user.duplicateEmail.title=Duplicate Email
errors.iam.user.duplicateEmail.detail=Email {0} is already in use
```

## 5. 错误码命名规范 [M4]

格式: `<模块>.<资源>.<错误>` （camelCase）

| 错误码 | HTTP | 描述 |
|--------|------|------|
| `iam.user.notFound` | 404 | 用户不存在 |
| `iam.user.duplicateEmail` | 409 | 邮箱已存在 |
| `iam.user.invalidPassword` | 400 | 密码不符合策略 |
| `iam.role.notFound` | 404 | 角色不存在 |
| `iam.role.permissionRequired` | 403 | 缺少必需权限 |
| `iam.auth.tokenExpired` | 401 | Token 过期 |
| `iam.auth.tokenInvalid` | 401 | Token 无效 |
| `oplog.log.writeFailed` | 500 | 操作日志写入失败 |
| `file.upload.sizeExceeded` | 400 | 上传文件超过大小限制 |
| `file.upload.typeNotAllowed` | 400 | 文件类型不允许 |
| `system.internal` | 500 | 系统内部错误（兜底） |
| `validation` | 400 | 参数验证失败（兜底） |

## 6. 契约驱动决策与工作流 [M4]

### 6.1 决策结论

**做最小集 MVP**（springdoc + OpenAPI Generator → @mb/api-sdk），不做 Spectral lint 和 oasdiff 检查（延后到 M6）。

### 6.2 工作流图

```
┌─────────────────────────┐
│ Spring Controller       │
│ + @Operation 注解       │
│ + @Schema DTO 注解      │
└───────────┬─────────────┘
            │ springdoc 运行时扫描
            ▼
┌─────────────────────────┐
│ OpenAPI 3.1 JSON/YAML   │
│ 生成: target/openapi.json │
│ 基线: api-contract/      │
│   openapi-v1.json (git) │
└───────────┬─────────────┘
            │ OpenAPI Generator (CI 触发)
            ▼
┌─────────────────────────┐
│ TypeScript client       │
│ @mb/api-sdk             │
│ (client/packages/       │
│  api-sdk/，不入 git)    │
└───────────┬─────────────┘
            │ import
            ▼
┌─────────────────────────┐
│ client features code    │
│ tsc --noEmit            │
└─────────────────────────┘

后端改 DTO → CI 重新生成 @mb/api-sdk → 前端 tsc 立即报错（类型不同步 → CI 红）
```

## 7. springdoc 配置 [M4]

```yaml
# application.yml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: true
  swagger-ui:
    path: /swagger-ui
    enabled: ${MB_SWAGGER_ENABLED:false}    # 生产默认关闭
  packages-to-scan: com.metabuild.platform, com.metabuild.business  # 覆盖 platform 和 business 两层的 Controller
```

#### springdoc-openapi-maven-plugin

`mvn springdoc:generate` 需要在 `mb-admin/pom.xml` 中配置：

```xml
<plugin>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-maven-plugin</artifactId>
    <version>1.4</version>
    <executions>
        <execution>
            <id>generate-openapi</id>
            <phase>integration-test</phase>
            <goals>
                <goal>generate</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <apiDocsUrl>http://localhost:8080/v3/api-docs</apiDocsUrl>
        <outputFileName>openapi.json</outputFileName>
        <outputDir>${project.build.directory}</outputDir>
    </configuration>
</plugin>
```

此插件在构建阶段启动应用并调用 `/v3/api-docs` 生成 JSON。

```java
// mb-infra/infra-exception/src/main/java/com/metabuild/infra/openapi/OpenApiConfig.java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI metaBuildOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Meta-Build API")
                .version("v1")
                .description("Meta-Build 后端 API 契约")
                .license(new License().name("MIT").url("https://meta-build.dev/license")))
            .servers(List.of(
                new Server().url("/api").description("Current server")
            ))
            .components(new Components()
                .addSecuritySchemes("bearer-jwt",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
            .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
```

## 8. Controller 注解规范 [M4]

```java
@RestController
@RequestMapping("/api/v1/iam/users")
@Tag(name = "IAM/User", description = "用户管理")
public class UserController {

    @Operation(summary = "分页查询用户", description = "按条件分页查询用户列表")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "成功"),
        @ApiResponse(responseCode = "403", description = "缺少权限",
            content = @Content(mediaType = "application/problem+json",
                schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping
    @RequirePermission("iam.user.list")
    public PageResult<UserView> list(
            @Parameter(description = "查询参数") @Valid UserQuery query,
            @Parameter(description = "页码（从 1 开始）") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        return userApi.page(query, page, size);
    }
}
```

## 9. OpenAPI Generator 配置 [M4]

`tools/openapi-generator/config.yaml`:

```yaml
generatorName: typescript-fetch
inputSpec: server/mb-admin/target/openapi.json
outputDir: client/packages/api-sdk/src/generated
additionalProperties:
  npmName: "@mb/api-sdk"
  withInterfaces: true
  supportsES6: true
  typescriptThreePlus: true
  modelPropertyNaming: original
```

## 10. @mb/api-sdk 输出位置与 git 策略 [M4]

| 路径 | git 状态 | 说明 |
|------|---------|-----|
| `client/packages/api-sdk/src/index.ts` | 入 git | 手写包装层 |
| `client/packages/api-sdk/src/generated/` | **不入 git** | CI 重新生成，`.gitignore` 排除 |
| `client/packages/api-sdk/package.json` | 入 git | - |
| `server/api-contract/openapi-v1.json` | **入 git** | **契约基线**（手动 commit 或 pre-commit hook 更新） |
| `server/mb-admin/target/openapi.json` | 不入 git | Maven 构建产物（`target/` 在 `.gitignore`） |

**为什么基线不放 `target/`**：`target/` 是 Maven 构建产物目录，必须在 `.gitignore` 里排除，不能把基线文件放进去。基线文件必须放在持久化目录 `server/api-contract/`。

CI 流程:
1. `mvn springdoc:generate -pl mb-admin` → 生成到 `server/mb-admin/target/openapi.json`
2. 对比 `server/api-contract/openapi-v1.json`（git 基线），有差异 → CI fail（提示开发者先更新基线）
3. `openapi-generator generate` → `client/packages/api-sdk/src/generated/`
4. `pnpm -C client tsc --noEmit` → 类型检查

**基线更新约定**: 后端改 DTO 后，开发者本地运行 `mvn springdoc:generate && cp server/mb-admin/target/openapi.json server/api-contract/openapi-v1.json && git add server/api-contract/`，然后和业务代码一起 commit。

## 11. API 版本管理 [M4+M6]

#### 决策

- URL 前缀: `/api/v1/<resource>`
- v2 并存策略: `/api/v2/<resource>`（与 v1 同时部署）
- deprecation 标记: `@Deprecated(since = "v1.5", forRemoval = true)` + HTTP `Sunset` header
- **Breaking change 检查**: oasdiff（推迟到 M6）

#### Sunset header 示例

```java
@Deprecated(since = "v1.5", forRemoval = true)
@GetMapping("/api/v1/iam/users/legacy")
public List<UserView> listLegacy(HttpServletResponse res) {
    res.setHeader("Sunset", "Wed, 01 Jan 2027 00:00:00 GMT");
    res.setHeader("Deprecation", "true");
    res.setHeader("Link", "</api/v2/iam/users>; rel=\"successor-version\"");
    return userApi.listLegacy();
}
```

<!-- verify: cd server && mvn springdoc:generate -pl mb-admin && test -f mb-admin/target/openapi.json && diff -q mb-admin/target/openapi.json api-contract/openapi-v1.json -->

---

## 12. 分页契约 [M4]

> **关注点**：`PageQuery` / `PageResult` / `SortParser` 数据契约、Spring MVC 自动解析、URL query 参数规范、sort 白名单机制。
>
> **定位**：分页是所有列表 API 的统一契约，业务 Controller 零样板地接收 `PageQuery`，返回 `PageResult`。sort 字段由业务 Repository 通过 `SortParser` 的 Builder API 声明白名单。

### 12.1 URL query 参数规范

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `page` | int | 1 | 页号，从 1 开始，必须 ≥ 1 |
| `size` | int | `mb.api.pagination.default-size`（默认 20） | 每页大小，上限 `mb.api.pagination.max-size`（默认 200） |
| `sort` | 多值参数 | 由业务 Repository 的 `defaultSort` 决定（推荐 `createdAt:desc`） | 格式 `field:asc` 或 `field:desc`，可多次传参 |

**示例**：

```
GET /api/v1/admin/iam/users?page=1&size=20&sort=createdAt:desc&sort=username:asc
```

### 12.2 `PageQuery` 和 `PageResult`

两个 record 定义在 `mb-common.pagination` 包（零 Spring 依赖，跨所有 infra/platform/business 模块共享）：

```java
// mb-common/pagination/PageQuery.java
public record PageQuery(
    int page,
    int size,
    @Nullable List<String> sort
) {
    public int offset() { return (page - 1) * size; }
}

// mb-common/pagination/PageResult.java
public record PageResult<T>(
    List<T> content,
    long totalElements,
    int totalPages,
    int page,
    int size
) {
    public boolean hasNext() { return page < totalPages; }
    public boolean hasPrevious() { return page > 1; }

    public static <T> PageResult<T> of(List<T> content, long total, PageQuery query) {
        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / query.size());
        return new PageResult<>(content, total, totalPages, query.page(), query.size());
    }
}
```

**JSON 响应示例**：

```json
{
  "content": [
    { "id": 1, "username": "alice" },
    { "id": 2, "username": "bob" }
  ],
  "totalElements": 237,
  "totalPages": 12,
  "page": 1,
  "size": 20
}
```

### 12.3 Spring MVC 自动解析

通过 `PageQueryArgumentResolver`（注册在 `infra-exception.web.WebMvcConfig`）让 Controller 参数自动解析：

```java
@GetMapping("/api/v1/admin/iam/users")
public PageResult<UserView> list(PageQuery query) {
    // query 已经过 Resolver 校验（page/size 有效，已应用默认值和上限）
    return userService.page(query);
}
```

**业务 Controller 零样板**：不需要 `@RequestParam` / `@ModelAttribute` / `@PageableDefault`，Spring 自动识别 `PageQuery` 参数类型并解析。

### 12.4 配置项

```yaml
mb:
  api:
    pagination:
      default-size: 20      # 未传 size 时使用
      max-size: 200         # size 硬上限，超过抛 400
```

完整配置说明见 [09-config-management.md §9.2.13](./09-config-management.md)。

### 12.5 `SortParser` 白名单机制

**安全原则**：默认禁止，显式允许。前端传的 sort 字段必须在业务 Repository 显式声明的白名单里，不在白名单的字段直接 400。

**为什么不用全自动反射**：全自动反射 + 黑名单会在新增敏感字段时泄漏（如 `password_hash` / `api_key` / `bank_card_number`）——黑名单是开放集合，容易漏。显式白名单的疏忽只是"少一个可排序字段"（功能缺失，可修复），符合"默认禁止，显式允许"的安全原则。

**Builder API**：

```java
List<SortField<?>> orderBy = SortParser.builder()
    .forTable(MB_IAM_USER)                         // 约定：自动注册 id / createdAt / updatedAt
    .allow("username",  MB_IAM_USER.USERNAME)       // 业务字段显式列举
    .allow("email",     MB_IAM_USER.EMAIL)
    .defaultSort(MB_IAM_USER.CREATED_AT.desc())     // 默认创建时间倒序（必填）
    .parse(query.sort());
```

**`forTable(Table)` 约定**：自动注册 `id` / `createdAt` / `updatedAt` 三个通用字段（meta-build schema 规范强制所有表包含，见 [04-data-persistence.md §5.3](./04-data-persistence.md)）。通过 `table.field("id")` 反射查找，找不到就跳过（如 `mb_operation_log` 可能没有 `updated_at`）。

**敏感字段绝不自动注册**：`forTable` 只注册 3 个约定字段，`password_hash` / `email`（PII 场景）/ `api_key` 等敏感字段必须业务层明确 `.allow()` 才能加入白名单，默认不可排序。

### 12.6 i18n 错误码

| 错误 key | HTTP 状态 | 说明 |
|---|---|---|
| `common.pagination.invalidPage` | 400 | page 参数无效 |
| `common.pagination.invalidSize` | 400 | size 参数无效 |
| `common.pagination.sizeExceeded` | 400 | size 超过 `max-size` 上限 |
| `common.pagination.invalidNumber` | 400 | 参数无法解析为数字 |
| `common.pagination.invalidSortField` | 400 | sort 字段不在白名单 |

### 12.7 异常映射

`BusinessException("common.pagination.*", ...)` 由 `GlobalExceptionHandler` 映射到 HTTP 400 + ProblemDetail（见 §3）。

### 12.8 性能建议

- **索引**：所有需要分页的表**建议**加 `(tenant_id, created_at DESC)` 复合索引，支持默认排序的索引扫描。不强制，使用者根据数据量决定。
- **避免深度分页**：offset 分页在 `page × size > 100000` 时性能显著下降（数据库需要跳过 offset 行）。meta-build v1 不做 seek/游标分页，海量数据的导出场景应该用独立的异步导出接口（v1.5+）。
- **COUNT 查询**：v1 每次分页查询都执行 `COUNT(*)`，大表场景可能较慢。v1.5+ 可考虑增加"不计算总数"模式（`PageResult.withoutTotal()`），v1 不做。

---

## 13. AppPermission 生成链路（前后端权限点契约）[M4]

> **关注点**：后端 `@RequirePermission` 注解 → springdoc 扫描 → OpenAPI extension `x-permission` → OpenAPI Generator → 前端 `AppPermission` 联合类型。
>
> **目标**：权限点拼写的**编译期校验**。前端用错权限 code 直接 tsc 报错，不等到运行时。

### 13.1 链路全图

```
1. 后端标注
   Controller 方法 @RequirePermission("iam.user.create")
         │
         │ springdoc 扫描（OperationCustomizer）
         ▼
2. OpenAPI extension
   operation["x-permission"] = "iam.user.create"
         │
         │ mvn springdoc:generate
         ▼
3. openapi.json
   包含所有 @RequirePermission 扫描到的 code 清单
         │
         │ OpenAPI Generator
         ▼
4. TypeScript 生成
   client/packages/api-sdk/src/generated/permissions.ts
         │
         │ import AppPermission
         ▼
5. 前端编译期校验
   requireAuth({ permission: 'iam.user.create' })  // 拼错 → tsc 报错
```

### 13.2 OperationCustomizer 代码骨架

```java
// mb-infra/infra-openapi（或 infra-exception）模块
// src/main/java/com/metabuild/infra/openapi/PermissionOperationCustomizer.java

@Component
public class PermissionOperationCustomizer implements OperationCustomizer {
    @Override
    public Operation customize(Operation operation, HandlerMethod handlerMethod) {
        RequirePermission ann = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (ann != null) {
            operation.addExtension("x-permission", ann.value());
        }
        return operation;
    }
}
```

### 13.3 生成产物

```typescript
// client/packages/api-sdk/src/generated/permissions.ts
// 自动生成，不手动编辑

export type AppPermission =
  | 'iam.user.list'
  | 'iam.user.create'
  | 'iam.user.update'
  | 'iam.user.delete'
  | 'iam.role.list'
  | 'iam.role.assignPermission'
  | 'iam.menu.list'
  // ... 所有 @RequirePermission 扫描到的 code
  ;

export const ALL_APP_PERMISSIONS: readonly AppPermission[] = [
  'iam.user.list',
  'iam.user.create',
  // ...
] as const;
```

### 13.4 CI 校验

| 校验步骤 | 命令 | 失败原因 |
|---|---|---|
| 权限点一致性检查 | `pnpm check:permissions` | `route-tree.json` 中引用的 code 不在后端 `@RequirePermission` 集合内 |
| TypeScript 编译检查 | `tsc --noEmit` | 前端 `requireAuth({ permission })` 参数不在 `AppPermission` 联合类型中 |

**`pnpm check:permissions` 脚本逻辑**（M4 实施时写）：
1. 扫描 `server/api-contract/openapi-v1.json`，提取所有 `x-permission` 值的集合 `backendCodes`
2. 扫描 `client/apps/web-admin/src/route-tree.json`，提取所有 `permission` 字段值的集合 `frontendCodes`
3. `frontendCodes - backendCodes` 非空 → CI 失败，打印差异列表

---

[← 返回 README](./README.md)
