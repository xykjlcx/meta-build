# 02 - 基础设施层 mb-infra

> **关注点**：11 个 `mb-infra` 子模块的清单、职责、Maven 结构、自动配置机制。
>
> **本文件吸收原 backend-architecture.md §3 全文**（11 个 infra 子模块清单）。

## 1. 决策结论 [M1+M4]

`mb-infra` 按"能力"切分为 **11 个子模块**，每个子模块是独立的 Maven module，职责单一、可单独测试。所有子模块不暴露 Controller（`infra-captcha` 除外，它暴露 public 验证码端点），只提供工具类、配置类、AOP、Filter/Interceptor、事件处理器。

## 2. 11 个子模块清单 [M1+M4]

| # | 模块 | 职责 | 借用来源 | Milestone |
|---|------|------|---------|-----------|
| 1 | `infra-security` | **Sa-Token 封装 + `SaTokenCurrentUser` / `SaTokenAuthFacade` 实现 + `@RequirePermission` 注解 + CORS**（ADR-0005；数据权限拦截在 `infra-jooq`） | Sa-Token 1.39.x + 自研门面层 | M4 |
| 2 | `infra-cache` | Redis + CacheEvictSupport（key 级失效） | nxboot CacheEvictSupport | M4 |
| 3 | `infra-jooq` | JooqHelper + SlowQueryListener + DataScopeVisitListener（**不含生成代码，生成代码在 mb-schema**） | nxboot JooqHelper, SlowQueryListener | M1 启动 + M4 补全 |
| 4 | `infra-exception` | GlobalExceptionHandler + ProblemDetail 映射 | nxboot GlobalExceptionHandler（改造） | M4 |
| 5 | `infra-i18n` | MessageSource + Accept-Language LocaleResolver | nxboot I18nHelper（改造） | M4 |
| 6 | `infra-async` | AsyncConfig + 线程池 + 上下文传递 | nxboot AsyncConfig（增强） | M1 |
| 7 | `infra-rate-limit` | Bucket4j + RateLimitInterceptor（v1 内存版） | nxboot RateLimitInterceptor | M4 |
| 8 | `infra-websocket` | WebSocket 基础设施 | （v1 留空占位） | v1.5 |
| 9 | `infra-observability` | Actuator + Micrometer + Logback JSON + TraceIdFilter | 新增 | M1 启动 + M4 补全 |
| 10 | `infra-archunit` | ArchUnit 规则库（规则代码，不含测试；测试在 mb-admin） | 新增 | M1 启动 + M4 补全 |
| 11 | `infra-captcha` | 滑块验证码生成与验证（登录保护等场景） | 新增 | M4 |

详细借用清单见 [附录 A](#附录-a-从-nxboot-借用的组件清单)，每个模块的 M1/M4 实施清单见 [附录 B](#附录-b-infra-模块的-m1m4-实施清单)。

### 11. infra-captcha（滑块验证码）

**职责**：提供滑块验证码的生成和验证能力，用于登录失败保护等场景。

**核心组件**：
- `CaptchaService`：生成验证码（背景图 + 缺口 + 滑块）、验证用户提交的坐标
- `CaptchaController`：`GET /api/v1/public/captcha/generate`（生成）+ `POST /api/v1/public/captcha/verify`（验证）

**技术实现**：
- 图片处理：JDK 原生 `BufferedImage` + `Graphics2D`（零第三方依赖）
- 存储：Redis 存验证 token + 正确 x 坐标（TTL 5 分钟）
- 验证：比较用户提交的 x 坐标和正确位置，容差 ±5px

**配置项**：

| 配置 | 默认值 | 说明 |
|------|--------|------|
| `mb.captcha.enabled` | `true` | 是否启用验证码 |
| `mb.captcha.expire-seconds` | `300` | 验证码过期时间（秒） |
| `mb.captcha.tolerance-px` | `5` | x 坐标容差（像素） |

**使用方**：`platform-iam` 的 `AuthService`（登录失败 3 次后要求验证码）

**M4 实施**：图库（10-20 张背景图）放在 `infra-captcha/src/main/resources/captcha/` 目录。

## 3. 子模块的 Maven 结构 [M1]

每个子模块的 `pom.xml` 只声明当前能力需要的依赖，不集成 Spring Boot Starter（starter 由 mb-admin 统一引入）：

```xml
<!-- mb-infra/infra-security/pom.xml -->
<parent>
    <groupId>com.metabuild</groupId>
    <artifactId>mb-infra</artifactId>
    <version>${revision}</version>
</parent>
<artifactId>infra-security</artifactId>

<dependencies>
    <dependency>
        <groupId>com.metabuild</groupId>
        <artifactId>mb-common</artifactId>
    </dependency>
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-spring-boot3-starter</artifactId>
        <version>${sa-token.version}</version>
    </dependency>
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-jwt</artifactId>
        <version>${sa-token.version}</version>
    </dependency>
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-redis-jackson</artifactId>
        <version>${sa-token.version}</version>
    </dependency>
</dependencies>
```

## 4. 自动配置 [M1]

每个子模块通过 Spring Boot 3 的 `AutoConfiguration.imports` 机制自动注册：

```
mb-infra/infra-security/src/main/resources/META-INF/spring/
└── org.springframework.boot.autoconfigure.AutoConfiguration.imports
    内容: com.metabuild.infra.security.SecurityAutoConfiguration
```

<!-- verify: cd server && mvn test -pl mb-infra/infra-security -Dtest=SecurityAutoConfigurationTest -->

---

[← 返回 README](./README.md)
