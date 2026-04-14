# M4 完成交接文档

> 新 session 开始前读这份文档，5 分钟内获得 M4 完整上下文。

---

## 当前状态

- **M4 已完成**，在 main 上（PR #1 合并，36 commits）
- 后端 7 infra 模块 + 8 platform 模块 + 18 DDL + 24 ArchUnit 规则 + 46 测试
- 经过 5 轮审查：逐阶段 review → Codex 对抗性审查 → 4 角色并行审查（安全/AI执行者/架构师/编译验证）
- M4 worktree（`~/06-meta-build-m4/`）可清理

---

## M4 新增的代码结构

### infra 层（7 个模块实现 + 2 个补全）

```
server/mb-infra/
├── infra-i18n/            → MessageSource + AcceptHeaderLocaleResolver
├── infra-exception/       → GlobalExceptionHandler(ProblemDetail) + PageQueryArgumentResolver + SecurityHeaderFilter
├── infra-security/        → Sa-Token JWT Simple + SaTokenCurrentUser + SaTokenAuthFacade
│   │                        + @RequirePermission AOP + RefreshTokenService(Redis rotation)
│   │                        + SaInterceptor 全局认证 + CORS + PasswordEncoder(BCrypt 12)
├── infra-cache/           → RedisCacheManager + CacheEvictSupport(afterCommit)
├── infra-rate-limit/      → @RateLimit + Bucket4j 内存限流
├── infra-captcha/         → CaptchaService(BufferedImage) + Redis 一次性 token
├── infra-jooq/            → [M4 补全] DataScopeVisitListener + DataScopeRegistry
│   │                        + AuditFieldsRecordListener + BypassDataScopeAspect + SortParser
├── infra-observability/   → [M4 补全] DatabaseReadinessIndicator + AuthMetrics
│   │                        + UserIdMdcInterceptor
└── infra-archunit/        → [M4 扩展] 3→24 条规则
```

### platform 层（8 个模块）

```
server/mb-platform/
├── platform-iam/          → 最大模块（50+ 文件）
│   ├── api/               → 6 Api 接口 + 13 DTO（*View/*Command 命名）
│   ├── domain/
│   │   ├── user/          → UserService + UserRepository + PasswordHistoryRepository
│   │   ├── role/          → RoleService + RoleRepository
│   │   ├── dept/          → DeptService + DeptRepository（WITH RECURSIVE CTE）
│   │   ├── menu/          → MenuService + MenuRepository + RouteTreeRepository
│   │   ├── permission/    → PermissionService + PermissionRepository
│   │   ├── datascope/     → DataScopeLoader（注册 mb_iam_user/dept）
│   │   ├── auth/          → AuthService + PasswordPolicy + MustChangePasswordInterceptor
│   │   └── session/       → OnlineUserService + LoginLogService + LoginLogRepository
│   ├── config/            → MbIamPasswordProperties（14 个配置项）+ IamAutoConfiguration
│   └── web/               → 5 Controllers（全部 @RequirePermission）
├── platform-oplog/        → @OperationLog 注解 + AOP + 异步写入（追加表）
├── platform-dict/         → DictType + DictData CRUD + @Cacheable
├── platform-config/       → key-value CRUD + CacheEvictSupport(afterCommit)
├── platform-file/         → FileStorage 接口 + LocalFileStorage（SHA-256 分级目录 + 租户隔离）
├── platform-notification/ → 通知 + 已读标记（mb_notification_read 追加表）
├── platform-job/          → @Scheduled + ShedLock + OplogCleanupJob（90 天过期）
└── platform-monitor/      → JVM/DB 指标读取（MXBean + Micrometer）
```

### DDL（18 个 Flyway migration）

```
server/mb-schema/src/main/resources/db/migration/
├── V20260601_001__iam_user.sql                    [M1 已有]
├── V20260602_001__iam_user_add_fields.sql         version + 密码安全字段
├── V20260602_002~010                              IAM 核心：role/dept/user_role/route_tree/menu/role_menu/role_data_scope_dept/password_history/login_log
├── V20260603_001~007                              平台模块：operation_log/file_metadata/notification+read/dict_type+data/config/job_log/shedlock
└── V20260604_001__init_data.sql                   超管角色 + 默认部门 + 绑定（ON CONFLICT DO NOTHING）
```

### 测试（46 个）

```
server/mb-admin/src/test/java/com/metabuild/admin/
├── MetaBuildApplicationTest.java          → 1 test（Spring Context 启动）
├── architecture/ArchitectureTest.java     → 24 tests（24 条 ArchUnit 规则）
├── MockCurrentUser.java                   → 测试用 CurrentUser 实现
├── TestSecurityConfig.java                → @TestConfiguration（mock 安全 Bean）
├── iam/
│   ├── UserServiceIntegrationTest.java    → 6 tests（CRUD + 密码编码 + 唯一性）
│   ├── AuthServiceIntegrationTest.java    → 3 tests（登录成功/错误/不存在）
│   └── DataScopeIntegrationTest.java      → 4 tests（SELF/OWN_DEPT/ALL/Bypass）
└── dict/
    └── DictServiceIntegrationTest.java    → 8 tests（DictType + DictData CRUD）
```

---

## M4 交付物清单

### 认证授权

| 交付物 | 说明 |
|--------|------|
| Sa-Token JWT Simple | Redis session + JWT 格式 token（支持 logout/踢人/封号） |
| Refresh Token Rotation | RefreshTokenService（Redis 存储 + one-time use rotation） |
| SaInterceptor 全局认证 | `/api/**` 默认拦截，白名单放行 login/refresh/public |
| @RequirePermission AOP | 自定义注解 + 切面，前置 isAuthenticated 检查 |
| CurrentUser / AuthFacade | 双门面隔离（Sa-Token 只在 infra-security 内） |
| PasswordEncoder | BCrypt strength 12 |
| 密码安全全套 | 策略校验/历史防重用/登录保护(429)/强制改密/重置 token |

### 数据权限

| 交付物 | 说明 |
|--------|------|
| DataScopeVisitListener | ExecuteListener 在 SQL 渲染时注入 WHERE 条件 |
| DataScopeRegistry | 集中声明哪些表需要数据权限 + dept 列名 |
| BypassDataScopeAspect | @BypassDataScope 注解显式旁路 |
| 5 种 DataScopeType | ALL / CUSTOM_DEPT / OWN_DEPT / OWN_DEPT_AND_CHILD / SELF |
| WITH RECURSIVE CTE | DeptRepository.findAllChildDeptIds — 一次查询获取子树 |

### ArchUnit 规则（24 条）

| 类 | 规则数 | 覆盖 |
|----|--------|------|
| JooqIsolationRule | 4 | DSLContext 隔离 + NO_PLAIN_SQL + Service jOOQ 白名单 |
| SaTokenIsolationRule | 2 | 业务层禁止 Sa-Token + 仅 infra-security/exception 可访问 |
| ModuleBoundaryRule | 2 | 跨 platform 只走 api 包 + 无循环依赖 |
| ControllerRule | 2 | Controller 禁直连 Repository + 必须 @RestController |
| TransactionRule | 2 | @Transactional 只在 Service 层 |
| GeneralCodingRulesBundle | 3 | 禁字段注入 + 禁 System.out + 禁 java.util.logging |
| CodingStyleRule | 5 | 禁 MapStruct + 禁 JetBrains 注解 + Optional 只做返回值 |
| ConfigManagementRule | 2 | 禁 @Value + @ConfigurationProperties 必须 @Validated |
| TimezoneRule | 1 | API 层禁 LocalDateTime |
| JdbcIsolationRule | 1 | 业务层禁 JdbcTemplate |
| BusinessBoundaryRule | 1 | business 只依赖 platform api（allowEmptyShould） |

### 质量验证

| 检查 | 命令 | 状态 |
|------|------|------|
| 全量编译 | `cd server && mvn compile` | ✅ 26 modules |
| 全量测试 | `cd server && mvn verify` | ✅ 46 tests, 0 failures |
| ArchUnit | `mvn test -Dtest=ArchitectureTest -pl mb-admin` | ✅ 24 rules |
| jOOQ codegen | `mvn -Pcodegen generate-sources -pl mb-schema` | ✅ 19 tables |
| Spring Boot 启动 | `MetaBuildApplicationTest` | ✅ context loads |

---

## 关键技术决策备忘

| 决策 | 结论 | 备注 |
|------|------|------|
| JWT 模式 | Simple（JWT 格式 + Redis session） | Stateless 无法 logout/踢人，Phase 1 review 修正 |
| Refresh Token | 手写 RefreshTokenService（Redis） | Sa-Token 无内置双 token（仅 OAuth2 模块有） |
| 数据权限 | ExecuteListener（非 VisitListener） | VisitListener 的 Clause API 已 deprecated，ExecuteListener.renderStart 更稳定 |
| 审计字段 | AuditFieldsRecordListener | 不在 JooqHelper 中做，统一用 RecordListener |
| 时间类型 | OffsetDateTime + Clock Bean | DDL 用 TIMESTAMPTZ，代码用 now(clock)（ADR-0012） |
| DTO 命名 | *View / *Command | 4 角色审查后对齐 spec（原代码用 Response/Request） |
| 权限码格式 | 冒号分隔 `iam:user:list` | Sa-Token 惯例，spec 已对齐 |
| 安全模型 | opt-out（SaInterceptor 全局认证） | 4 角色审查发现原实现是 opt-in，nxboot 反面教材 #2 |
| Lombok | 1.18.44 + annotationProcessorPaths | 1.18.34 不兼容 JDK 25 |
| bucket4j | 8.10.1 | 计划的 8.14.0 不存在于 Maven Central |
| CacheEvict | afterCommit 模式 | @CacheEvict 在事务提交前触发，Codex 审查发现 |
| 部门树查询 | WITH RECURSIVE CTE | 替代 N+1 递归 Java 调用，架构师 review 建议 |

### M4 踩坑记录

- **Lombok JDK 25 不兼容**：`ExceptionInInitializerError: TypeTag :: UNKNOWN`，升级到 1.18.44 解决
- **mvn install 再跑 ArchUnit**：infra-archunit 新增规则后必须先 install，否则 mb-admin 测试引用旧 jar 报 `NoSuchFieldError`
- **I18nAutoConfiguration Bean 名冲突**：Spring MVC 已注册 `localeResolver`，需加 `@ConditionalOnMissingBean`
- **CaptchaService disabled 时 Bean 缺失**：`captcha.enabled=false` 但 AuthService 注入 CaptchaService → 启动失败。需注册 no-op stub
- **UserService 未设置 Snowflake ID**：表无自增序列，insert 前必须 `idGenerator.nextId()`
- **DataScopeVisitListener 用 VisitListener 时 topLevel() 行为不可靠**：改为 ExecuteListener.renderStart 在 SQL 渲染时注入条件

---

## 下一阶段：M5（canonical reference）

### 前置条件

M5 需要 M3（前端）+ M4（后端）都完成：
- M3 ✅ 已完成
- M4 ✅ 已完成

### M5 核心任务

1. **api-sdk 切换 OpenAPI 生成**
   - 后端 springdoc → `server/api-contract/openapi-v1.json`
   - 前端 `pnpm generate:api-sdk` 从 JSON 生成 TypeScript
   - M3 手写类型 → `generated/` 自动生成
   - 拦截器代码复用

2. **3 个 canonical reference 业务模块**
   - business-notice / business-order / business-approval
   - 前后端贯通：12 步清单创建后端 + L5 页面消费 API
   - 每个模块是 Spec 引擎（v1.5）的反向提炼样本

3. **MSW mock → 真实 API**
   - 移除或保留为测试专用
   - configureApiSdk 的 basePath 指向后端

4. **前后端联调验证**
   - 登录 → 菜单加载 → CRUD → 数据权限过滤 → 操作日志
   - Playwright E2E 测试

5. **权限 route-tree.json 生成**
   - 前端 Vite 插件扫描路由 → JSON
   - 后端 RouteTreeSyncRunner 启动同步

### M5 对 M4 的依赖

- 全部 8 个 platform 模块的 Controller API
- @RequirePermission 权限码（42 个，冒号分隔）
- Sa-Token JWT + RefreshTokenService 认证流
- DataScopeVisitListener 数据权限自动过滤
- GlobalExceptionHandler → ProblemDetail 错误格式
- PageQuery / PageResult / SortParser 分页体系

### M5 对 M3 的依赖

- L3 组件（NxTable/NxForm/NxDrawer）构建 CRUD 页面
- L4 hooks（useAuth/useMenu/useCurrentUser）消费 API
- api-sdk 拦截器链
- Provider 树 + 路由守卫

---

## 契约对齐补丁（M4 合流后联合审查）

M4 合流后前后端联合审查，新增 2 个端点 + 2 处修复：

| 变更 | 说明 |
|------|------|
| `GET /api/v1/auth/me` | 新增端点，返回 `CurrentUserView`（userId/username/nickname/roles/permissions/deptId/isAdmin），前端 `useCurrentUser` hook 消费 |
| `GET /api/v1/menus/current-user` | 新增端点，返回 `List<CurrentUserMenuView>`（嵌套树结构），前端 `useMenu` hook 消费 |
| `CurrentUserView.isAdmin` 加 `@JsonProperty("isAdmin")` | 修复 Jackson 默认将 `isAdmin` 序列化为 `admin` 的问题，确保前端字段名一致 |
| `MenuService.toResponse` parentId 0→null 转换 | 根节点 parentId 在数据库为 0，转换为 null 返回前端，避免前端树构建时找不到 parent=0 的节点 |
| `MenuRepository.findByRoleIds` | 新增方法，按角色 ID 集合查询菜单（`current-user` 端点依赖），替代原先只有 `findAll` 的实现 |

---

## 常用命令

```bash
# 后端开发
cd server && docker compose up -d                        # 启动 PG(15432) + Redis(16379)
cd server && mvn compile                                 # 全量编译（26 模块）
cd server && mvn verify                                  # 全量测试（46 tests）
cd server && mvn spring-boot:run -pl mb-admin            # 启动应用（需 Docker）
cd server && mvn test -pl mb-admin -Dtest=ArchitectureTest  # ArchUnit 规则检查

# jOOQ 代码生成（改 DDL 后执行）
cd server && mvn -Pcodegen generate-sources -pl mb-schema

# 前端开发（不变）
cd client && pnpm install && pnpm dev                    # dev server（localhost:5173 + MSW mock）
cd client && pnpm build                                  # 生产构建
cd client && pnpm test                                   # 全量测试（267 tests）

# Docker
docker compose up -d                                     # PG(15432) + Redis(16379)
```
