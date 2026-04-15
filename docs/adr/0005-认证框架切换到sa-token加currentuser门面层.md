# ADR-0005: 认证框架从 Spring Security 切换到 Sa-Token + CurrentUser 门面层

- **状态**: 已采纳
- **日期**: 2026-04-11
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: `meta-build规划_v1_最终对齐.md`（决策 4 原文: JJWT + Spring Security）、`docs/specs/backend/`（原 `docs/specs/backend-architecture.md` 已拆分）

> **注**：本 ADR 写于 backend-architecture.md 拆分前。文中所有对 `backend-architecture.md §x.y` 的引用，现统一指向 `docs/specs/backend/` 子目录的对应文件，导航见 [backend/README.md](../specs/backend/README.md)。安全相关章节现位于 [05-security.md](../specs/backend/05-security.md)。
- **覆盖关系**: 本 ADR **翻转**规划文档决策 4 中的认证框架选型。规划文档原文保留不动，后续所有文档和代码以本 ADR 为准。

---

## 背景

规划文档决策 4（后端技术栈）原定：

> **安全**: Spring Security + JJWT 双 token

这继承自 nxboot 的既有选型（JwtTokenProvider / SecurityUtils / MemoryTokenBlacklist / RedisTokenBlacklist 等组件都是基于 Spring Security + JJWT 实现）。

在写 backend-architecture.md 第 8 章"安全模型"时，系统评估了 **Sa-Token**（dromara 生态的轻量认证框架）作为替代方案的可行性，结论是应该翻转决策。

---

## 决策

**后端认证框架**：Spring Security + JJWT → **Sa-Token + CurrentUser 门面层**

核心变更：
1. 引入 `cn.dev33:sa-token-spring-boot3-starter` 作为认证底层
2. 在 `infra-security` 层设计 `CurrentUser` 门面接口，业务层**禁止直接依赖** Sa-Token
3. 自定义 `@RequirePermission` 注解 + AOP，**不直接用** `@SaCheckPermission`
4. 测试支持用 `MockCurrentUser` + `@Primary` Bean 替换，**不用** `mockStatic`
5. ArchUnit 规则强制业务层隔离

---

## 理由：5 个维度的评估

### 维度 1：场景加权 —— 75% 的核心用户场景 Sa-Token 胜出

meta-build 的目标用户画像估算：

| 用户群体 | 占比 | Sa-Token vs Spring Security |
|---------|-----|---------------------------|
| 独立开发者 / 自由职业者 | 35% | **Sa-Token 压倒**（30 分钟上手 vs 2-4 小时） |
| 中小团队技术负责人 | 25% | **Sa-Token 胜**（简单场景显著快） |
| 个人项目 / 个人 SaaS | 15% | **Sa-Token 压倒** |
| 小型 SaaS 创业团队 | 10% | **Sa-Token 略胜**（Session 存 tenantId 天然灵活） |
| 企业 SSO（AD/LDAP） | 5% | **Spring Security 压倒** |
| 涉外 OIDC（Azure AD） | 5% | **Spring Security 压倒** |
| 国企 CAS | 3% | **Sa-Token 略胜**（sa-token-sso 原生支持） |
| 其他 | 2% | — |

**核心用户场景（75%）Sa-Token 胜出，企业场景（15%）Spring Security 胜出**。

### 维度 2：气质匹配 —— 项目内外一致性

meta-build 的前端栈已经表达了"简洁优先"的哲学：
- shadcn/ui（而不是 Ant Design 全家桶）
- TanStack Router（而不是 React Router）
- Biome（而不是 ESLint + Prettier）
- Vite（而不是 webpack）
- 嵌套 monorepo + 契约驱动最小集

后端如果上 Spring Security（企业级繁重派），会造成**内外气质不一致**。使用者会感到割裂："前端一切都很轻，后端为什么这么重？"

Sa-Token 的气质和 meta-build 的整体定位**内外一致**。

### 维度 3：AI 友好度 —— 最硬的论据

**这是不可妥协的核心维度**。meta-build 的北极星是"给 AI 执行的契约"。

| | Sa-Token | Spring Security |
|---|---|---|
| **代码结构** | 线性（读 token → 校验 → 执行） | 链式（Filter 链 + AuthenticationProvider + SecurityContext） |
| **AI 训练数据量** | 相对少，但语法简单 | 多，但概念多且易错 |
| **AI 生成代码错误率** | 低（逻辑线性） | 中-高（Filter 顺序、CORS、CSRF 常翻车） |
| **AI 加新功能的复杂度** | 直接在 Controller 里加 if | 需要写 AuthenticationProvider 或 Filter，顺序敏感 |

**关键观察**：meta-build 的核心价值主张是"让使用者用自己的 AI 改代码"。Spring Security 的 AI 生成代码错误率显著高于 Sa-Token，这**直接违反**项目的北极星。

仅凭这一点就足以决定翻转。

### 维度 4：切换对称性 —— 战略正确性

两个框架的切换成本是**对称的**（约 2-3 天）：
- 改 `SecurityConfig`
- 改 Controller 的权限注解
- 改获取当前用户的工具类
- 改 DataScope 切面
- 改测试的 mock 方式

既然对称，**应该先选核心场景更好的**，边缘场景（SSO/LDAP/OIDC）未来遇到再切换。"为了 5% 的边缘场景，让 75% 的核心用户写 100+ 行配置"是本末倒置。

而且加上 `CurrentUser` 门面层后，切换成本从 2-3 天降到**半天**（后文详述）。

### 维度 5：CurrentUser 门面层 —— 真正的关键洞察

这是把 Sa-Token 的"简洁"和 Spring Security 的"可测试性"都拿到的方案。

**核心设计**：业务层（`platform/business/schema`）**只依赖** `CurrentUser` 接口，**零感知** Sa-Token。未来切换到 Spring Security 时，只需重写 `SaTokenCurrentUser` → `SpringSecurityCurrentUser` 一个实现类。

这也让 meta-build 后端和前端的契约哲学**完全对称**：

| | 前端 | 后端 |
|---|---|---|
| **业务层依赖** | `@mb/api-sdk` TypeScript 接口 | `CurrentUser` Java 接口 |
| **底层实现对业务透明** | axios/fetch 底层无所谓 | Sa-Token/Spring Security 底层无所谓 |
| **契约化设计** | OpenAPI 生成 | Java interface 定义 |

---

## 详细设计

### 1. CurrentUser 接口定义

**关键约束**：接口设计必须经得起 Spring Security 反向切换，所以**不能暴露任何 Sa-Token 特有概念**（`SaSession` / `StpUtil` / `StpLogic` 等）。

```java
// mb-infra/infra-security/src/main/java/com/metabuild/infra/security/CurrentUser.java
package com.metabuild.infra.security;

import java.util.Set;

/**
 * 当前登录用户的门面接口。
 *
 * 业务层（platform/business）必须通过此接口获取用户信息和权限判断，
 * 禁止直接依赖 Sa-Token、Spring Security 等认证框架的 API。
 *
 * 未来切换认证框架时，只需提供新的实现类（{@link SaTokenCurrentUser} → 其他），
 * 业务代码完全不需要修改。
 */
public interface CurrentUser {

    /** 当前是否已登录（未登录时所有 userId() 等方法会抛异常） */
    boolean isAuthenticated();

    /** 当前用户 ID（未登录抛 UnauthorizedException） */
    Long userId();

    /** 当前用户名 */
    String username();

    /** 当前租户 ID（v1 总是返回 0） */
    long tenantId();

    /** 权限点集合 */
    Set<String> permissions();

    /** 角色集合 */
    Set<String> roles();

    /** 数据范围类型 */
    DataScopeType dataScopeType();

    /** 可访问的部门 ID 集合（数据范围用） */
    Set<Long> dataScopeDeptIds();

    // --- 权限判断 ---

    boolean hasPermission(String permissionCode);
    boolean hasAnyPermission(String... permissionCodes);
    boolean hasAllPermissions(String... permissionCodes);

    // --- 角色判断 ---

    boolean hasRole(String roleCode);

    /** 超管快捷判断 */
    boolean isAdmin();

    /** 完整快照（对外 DTO，用于日志、审计、前端返回） */
    CurrentUserInfo snapshot();
}
```

### 2. Sa-Token 实现

```java
// mb-infra/infra-security/src/main/java/com/metabuild/infra/security/SaTokenCurrentUser.java
package com.metabuild.infra.security;

import cn.dev33.satoken.stp.StpUtil;
import cn.dev33.satoken.session.SaSession;
import org.springframework.stereotype.Component;
import java.util.Set;

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
    public String username() {
        SaSession session = StpUtil.getSession();
        return session.getString("username");
    }

    @Override
    public long tenantId() {
        SaSession session = StpUtil.getSession();
        Long tenantId = session.getLong("tenantId");
        return tenantId != null ? tenantId : 0L;
    }

    @Override
    public Set<String> permissions() {
        return Set.copyOf(StpUtil.getPermissionList());
    }

    @Override
    public Set<String> roles() {
        return Set.copyOf(StpUtil.getRoleList());
    }

    @Override
    public boolean hasPermission(String permissionCode) {
        return StpUtil.hasPermission(permissionCode);
    }

    @Override
    public boolean hasRole(String roleCode) {
        return StpUtil.hasRole(roleCode);
    }

    @Override
    public boolean isAdmin() {
        return hasRole("admin") || permissions().contains("*:*:*");
    }

    // ... 其他方法
}
```

### 3. 自定义 @RequirePermission 注解 + AOP

**为什么不用 @SaCheckPermission**：那会让 Controller 直接绑死到 Sa-Token，切换时要改所有 Controller。自定义注解让 Controller 层和认证框架解耦。

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

Controller 用法（**没有任何 Sa-Token 引用**）：

```java
@RestController
@RequestMapping("/api/v1/iam/users")
@RequiredArgsConstructor
public class UserController {

    private final UserApi userApi;

    @RequirePermission("iam.user.list")
    @GetMapping
    public PageResult<UserVo> list(UserQry query) {
        return userApi.page(query);
    }

    @RequirePermission("iam.user.create")
    @PostMapping
    public UserVo create(@RequestBody @Valid UserCreateCmd cmd) {
        return userApi.create(cmd);
    }
}
```

### 4. Sa-Token 配置（application.yml）

```yaml
sa-token:
  token-name: Authorization          # 从 Authorization header 读
  token-prefix: Bearer               # Bearer 前缀
  timeout: 2592000                   # access token 30 天
  active-timeout: -1                 # 不检查活跃度
  is-concurrent: true                # 允许同账号多端登录
  is-share: false                    # 多端 token 不共享
  token-style: jwt                   # JWT 模式（无状态 + 可主动失效）
  auto-renew: false                  # 不自动续签
  is-log: false                      # 生产关闭日志
  jwt-secret-key: ${MB_JWT_SECRET}   # 无默认值，缺失启动失败

# 生产环境启用 Redis 黑名单
spring:
  data:
    redis:
      host: ${MB_REDIS_HOST:localhost}
      port: ${MB_REDIS_PORT:6379}
      password: ${MB_REDIS_PASSWORD:}
```

**Token 模式选择：JWT mixed（无状态 + Redis 黑名单）**

- **载荷**：JWT（无状态，每个请求不用查 Redis）
- **注销**：token 加入 Redis 黑名单（有状态失效机制）
- **优点**：读请求零 Redis 开销 + 可以主动注销（强制下线）
- **依赖**：`cn.dev33:sa-token-jwt` + `cn.dev33:sa-token-redis-jackson`

### 5. MockCurrentUser 测试支持

**关键**：不用 `mockStatic(StpUtil.class)` 这种 mock 静态方法的黑魔法。直接替换 Bean。

```java
// mb-admin/src/test/java/com/metabuild/TestSecurityConfig.java
@TestConfiguration
public class TestSecurityConfig {

    @Bean
    @Primary
    public CurrentUser testCurrentUser() {
        return new MockCurrentUser();
    }
}
```

```java
// mb-admin/src/test/java/com/metabuild/MockCurrentUser.java
public class MockCurrentUser implements CurrentUser {
    private Long userId;
    private String username;
    private long tenantId = 0L;
    private Set<String> permissions = Set.of();
    private Set<String> roles = Set.of();
    private boolean admin;

    public MockCurrentUser asUser(long userId, String username, String... perms) {
        this.userId = userId;
        this.username = username;
        this.permissions = Set.of(perms);
        this.roles = Set.of("user");
        this.admin = false;
        return this;
    }

    public MockCurrentUser asAdmin() {
        this.userId = 1L;
        this.username = "admin";
        this.permissions = Set.of("*:*:*");
        this.roles = Set.of("admin");
        this.admin = true;
        return this;
    }

    public void clear() {
        this.userId = null;
        this.username = null;
        this.permissions = Set.of();
        this.roles = Set.of();
        this.admin = false;
    }

    @Override
    public boolean isAuthenticated() {
        return userId != null;
    }

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

    @Autowired
    private MockCurrentUser currentUser;

    @Autowired
    private UserService userService;

    @BeforeEach
    void setup() {
        currentUser.clear();
    }

    @Test
    void admin_should_create_user() {
        currentUser.asAdmin();
        UserVo user = userService.create(new UserCreateCmd("alice", "password"));
        assertThat(user.id()).isNotNull();
    }

    @Test
    void normal_user_should_fail_to_create_user() {
        currentUser.asUser(100L, "bob", "iam.user.list");  // 没有 create 权限
        assertThatThrownBy(() ->
            userService.create(new UserCreateCmd("alice", "password"))
        ).isInstanceOf(ForbiddenException.class);
    }
}
```

**和 `mockStatic(StpUtil.class)` 对比**：
- Mock 静态方法需要 `mockito-inline`，每次测试 setup/teardown 繁琐
- MockCurrentUser 是普通 Bean 替换，setup 一行，表达力强

### 6. ArchUnit 规则

```java
@ArchTest
static final ArchRule business_must_not_depend_on_sa_token = noClasses()
    .that().resideInAnyPackage(
        "com.metabuild.platform..",
        "com.metabuild.business..",
        "com.metabuild.schema.."
    )
    .should().dependOnClassesThat().resideInAPackage("cn.dev33.satoken..")
    .because("业务层必须通过 CurrentUser 门面使用认证，禁止直接依赖 Sa-Token API");

@ArchTest
static final ArchRule only_infra_security_depends_on_sa_token = classes()
    .that().dependOnClassesThat().resideInAPackage("cn.dev33.satoken..")
    .should().resideInAnyPackage(
        "com.metabuild.infra.security..",
        "com.metabuild.admin.."   // 启动入口允许直接配置 Sa-Token
    )
    .because("Sa-Token 的 API 只能在 infra-security 模块内部和 admin 启动入口使用");
```

---

## 影响范围

### 删除的组件（原 Spring Security 借用清单）

从 nxboot 借用列表中**删除**：
- ~~JwtTokenProvider~~（Sa-Token 原生支持）
- ~~SecurityUtils~~（CurrentUser 门面替代）
- ~~MemoryTokenBlacklist / RedisTokenBlacklist~~（Sa-Token 原生支持）
- ~~MetaBuildPermissionEvaluator~~（CurrentUser.hasPermission() 替代）
- ~~DataScopeAspect~~（改为 DataScopeVisitListener，和 Sa-Token 无关）

### 保留的组件

- ✅ **JwtSecret 环境变量**：`MB_JWT_SECRET` 保持必填
- ✅ **CorsConfig**：和认证框架无关，继续借用
- ✅ **DataScope 机制**：通过 CurrentUser.dataScopeType() / dataScopeDeptIds() 访问

### 新增的组件

- `CurrentUser` 接口（infra-security）
- `SaTokenCurrentUser` 实现（infra-security）
- `CurrentUserInfo` 快照 DTO（infra-security）
- `RequirePermission` 注解（infra-security）
- `RequirePermissionAspect` AOP（infra-security）
- `MockCurrentUser` 测试工具（mb-admin test scope）
- `TestSecurityConfig` 测试配置（mb-admin test scope）

### Maven 依赖变更

**新增**：
```xml
<dependency>
    <groupId>cn.dev33</groupId>
    <artifactId>sa-token-spring-boot3-starter</artifactId>
    <version>1.39.0</version>
</dependency>
<dependency>
    <groupId>cn.dev33</groupId>
    <artifactId>sa-token-jwt</artifactId>
    <version>1.39.0</version>
</dependency>
<dependency>
    <groupId>cn.dev33</groupId>
    <artifactId>sa-token-redis-jackson</artifactId>
    <version>1.39.0</version>
</dependency>
```

**删除**：
```xml
<!-- Spring Security starter（不再需要） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<!-- JJWT（Sa-Token 自带 JWT 能力） -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
</dependency>
```

### 对 backend-architecture.md 的影响

| 章节 | 变更 |
|------|------|
| 0.2 决策回顾 | 决策 7（后端框架内含安全）加注"认证见 ADR-0005" |
| 3.2 infra-security 模块清单 | 借用来源更新 |
| 6.x ArchUnit 规则 | 补 Sa-Token 业务层隔离规则 |
| **8 章 安全模型整章重写** | 见下 |
| 11.x 测试基类 | TestHelper 改为 MockCurrentUser |
| 附录 A 借用清单 | 删除 JwtTokenProvider 等 Spring Security 相关组件 |
| 附录 D 术语表 | 新增 Sa-Token / CurrentUser / RequirePermission / MockCurrentUser 条目 |

### 第 8 章安全模型的重写要点

- 8.1 JWT 机制 → Sa-Token JWT mixed 模式
- 8.2 权限模型 → `CurrentUser` + `@RequirePermission`
- 8.3 DataScope opt-out 实现 → 通过 `CurrentUser.dataScopeType()` 获取
- 8.4 强制敏感配置 → `MB_JWT_SECRET` 继续必填
- 8.5 CORS 规范 → 不变
- 新增 **8.6 CurrentUser 门面层设计**（本 ADR 的精华）

---

## 未来切换的触发条件

如果遇到以下任一场景，可以重新评估切换回 Spring Security：

1. **企业 SSO 刚需**：需要 SAML 2.0 / OIDC / LDAP / Active Directory 集成
2. **Spring Authorization Server**：需要作为 OAuth 2.0 授权服务器
3. **国际开源增长**：海外社区对 Sa-Token 接受度持续低（迹象：GitHub PR 反复问"why not Spring Security?"）
4. **多系统 OAuth 集成**：需要和 Google / GitHub / Apple 登录深度集成

**预估切换成本**（因为有 CurrentUser 门面层）：
- 改 1 个 `CurrentUser` 实现类（`SaTokenCurrentUser` → `SpringSecurityCurrentUser`）：约 4 小时
- 改 `application.yml` 配置：约 1 小时
- 改 `RequirePermissionAspect`（委托 Spring Security 的 `PermissionEvaluator`）：约 1 小时
- 改 `MockCurrentUser` 的测试 setup：不需要改（门面不变）
- 改 Controller：**不需要改**（`@RequirePermission` 不变）
- 改业务代码：**不需要改**（依赖 `CurrentUser` 接口不变）
- 总计：**半天左右**

这个"对称切换"的能力是 CurrentUser 门面层的最大价值。

---

## 成本和风险

### 成本

| 项目 | 成本 |
|------|------|
| CurrentUser 接口 + SaTokenCurrentUser 实现 | 中（约 200 行代码） |
| @RequirePermission 注解 + AOP | 低（约 50 行代码） |
| MockCurrentUser 测试支持 | 低（约 100 行代码） |
| ArchUnit 规则 | 零（已在规则文件里补） |
| 认知负担 | 中（使用者要理解"必须用门面"的约定） |

### 风险

| 风险 | 严重度 | 缓解 |
|------|-------|------|
| Sa-Token 长期维护（dromara 非 Spring 官方） | 中 | dromara 是活跃的开源组织，Sa-Token 本身是 1.4k+ star 项目，长期维护预期稳定 |
| 国际开源推广慢（海外不熟悉） | 低 | meta-build 核心卖点是"AI 原生 + 千人千面"，不依赖认证框架的品牌 |
| 遇到边缘场景（SSO）需要切换 | 低-中 | 门面层让切换成本降到半天 |
| 使用者绕过门面直接用 `StpUtil` | 中 | ArchUnit 规则编译期拦截，CI 失败不可合并 |

---

## 与规划文档的关系

规划文档决策 4 原文"Spring Security + JJWT 双 token"**不动**。本 ADR 翻转该决策：
- **认证框架**：Spring Security → Sa-Token
- **双 token**：保留（JWT mixed 模式同样支持 access + refresh 双 token 语义）
- **JWT 机制**：JJWT → Sa-Token 内置 JWT

后续所有文档和代码以本 ADR 为准。
