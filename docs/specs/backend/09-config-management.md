# 9. 配置管理 [M1]

> **关注点**：Spring Boot 配置来源分层、前缀策略、完整 env var 清单、profile 分层、`@ConfigurationProperties` 类规范、fail-fast 启动校验、敏感配置处理、AI 协作契约。
>
> **这是 M1 脚手架实施者写 `application.yml` 时的 ground truth**。新增配置项时必须遵守 [§9.8 AI 协作契约](#98-ai-协作契约新增配置项-checklist) 的 checklist。
>
> **本章节遵循 ADR-0007 元方法论**：所有配置前缀按 Spring Boot / starter 的原生答案走，`mb.*` 前缀仅在没有原生对应项时出现（详见 [§9.1.3](#913-前缀策略原生优先)）。

## 9.1 配置来源分层和优先级

### 9.1.1 Spring Boot 原生优先级链（后者覆盖前者）

```
1. 硬编码常量               ← 【禁止】
2. application.yml          ← classpath 共享基础配置
3. application-<profile>.yml ← dev / test / prod 分环境覆盖
4. 环境变量                 ← k8s / docker 注入的主渠道
5. 命令行参数 --xxx=yyy     ← 一次性覆盖（调试）
```

**硬约束**：

| 条目 | 规则 |
|---|---|
| 硬编码 | 禁止任何配置项作为常量写入代码。由 `infra-archunit` 的 `NO_CONFIG_HARDCODED` 规则拦截 |
| `@Value` 注入 | 禁止使用 `@Value("${xxx}")`，必须通过 `@ConfigurationProperties` 类。由 `NO_AT_VALUE_ANNOTATION` ArchUnit 规则拦截 |
| 敏感配置 | 必须通过环境变量注入，禁止进 git 的任何 yml 文件 |
| prod profile | 所有必填字段 fail-fast 校验（§9.5），缺失即启动失败 |
| 配置中心 | v1 **不使用** Spring Cloud Config / Nacos / Apollo，v1.5+ 预留 |

### 9.1.2 为什么 `@ConfigurationProperties` 而不是 `@Value`

| 维度 | `@Value("${xxx}")` | `@ConfigurationProperties` |
|---|---|---|
| 类型安全 | ❌ 字符串散落各处 | ✅ Java 类承载一组配置 |
| IDE 补全 | ❌ | ✅ |
| 校验 | ❌ 拼写错误运行时才炸 | ✅ `@Validated` + jakarta.validation 启动时校验 |
| 重构 | ❌ grep 全仓 | ✅ IDE 重命名 |
| 测试友好度 | ❌ 需要 Spring context | ✅ 可以直接 `new MbDbProperties(...)` |

**没有使用 `@Value` 的理由**。所有配置访问必须通过 Properties 类。

### 9.1.3 前缀策略（原生优先）

**原则**：使用 Spring Boot / starter 的原生前缀。仅在没有原生对应项时才用 `mb.*` 自建前缀。

**为什么这样选**（ADR-0007 元方法论落地）：

- "全部用 `mb.*` 统一前缀"是"追求表面一致"的补丁思维——强行把 `spring.datasource.url` 包装成 `mb.db.url` 是在重新发明 Spring Boot 已经提供的命名空间
- 好品味 = 符合生态原生范式，不是形式上统一
- 分界线由"Spring Boot 是否已提供原生前缀"决定，不是"舍不得砍方案"的补丁式混合（"一致性 > 局部优化"自检通过）

**原生前缀清单**（使用者必须遵守）：

| 前缀 | 来源 | 用途 |
|---|---|---|
| `spring.datasource.*` | Spring Boot | PostgreSQL 连接 + HikariCP 连接池 |
| `spring.flyway.*` | Spring Boot | Flyway migration |
| `spring.data.redis.*` | Spring Boot | Redis 连接 + Lettuce 池 |
| `spring.mail.*` | Spring Boot | Spring Mail SMTP |
| `spring.servlet.multipart.*` | Spring Boot | 文件上传大小限制 |
| `spring.messages.*` | Spring Boot | i18n message bundle |
| `spring.jpa.open-in-view` | Spring Boot | 禁用 OSIV（硬约束，不可改）|
| `spring.jackson.*` | Spring Boot | Jackson 序列化 |
| `spring.threads.virtual.enabled` | Spring Boot | 禁用 virtual thread（v1 约束）|
| `server.*` | Spring Boot | HTTP server 端口 / context path |
| `management.*` | Spring Boot | Actuator 端点暴露 |
| `logging.*` | Spring Boot | 日志级别 / 输出 |
| `sa-token.*` | Sa-Token starter | JWT 密钥 / token 超时 / 踢人下线 |

**`mb.*` 自建前缀清单**（仅这些走 meta-build 自定义）：

| 前缀 | 用途 | 为什么没用原生 |
|---|---|---|
| `mb.id.worker` / `mb.id.datacenter` | Snowflake ID 生成器 worker/datacenter 编号 | Spring Boot 无对应；自建 `MbIdProperties` |
| `mb.jooq.slow-query-threshold-ms` | `SlowQueryListener` 阈值 | jOOQ 自建监听器，Spring Boot 无对应 |
| `mb.cache.jitter-percent` | Redis 缓存 TTL 抖动（防雪崩）| Spring Cache 原生不支持抖动 |
| `mb.file.storage.*` | 文件存储抽象（local / minio 切换）| `FileStorage` 是自建接口（ADR-0006）|
| `mb.rate-limit.*` | Bucket4j 限流参数 | 自建限流 |
| `mb.job.enabled` / `mb.job.timezone` | 定时任务总开关 | 自建 |
| `mb.i18n.supported-locales` | 支持的 locale 列表 | Spring `spring.messages.*` 只定义 bundle，没有"支持列表"概念 |
| `mb.cors.allowed-origins` | CORS 白名单（包装 Spring `CorsConfigurationSource`）| 原生 `spring.web.cors.*` 不够灵活 |
| `mb.observability.*` | 可观测性聚合配置（JSON 日志开关 / trace 采样率）| 聚合多个 Micrometer 配置 |
| `mb.app.version` | 应用版本（从 Maven property 注入）| 自建元数据 |
| `mb.iam.password.*` | platform-iam 密码策略（长度/复杂度/历史/过期/锁定阈值）| Sa-Token 不管密码策略，自建（详见 [05-security.md §8.3](./05-security.md#83-密码策略可配置)）|
| `mb.api.pagination.*` | 分页参数默认值和上限（详见 [06-api-and-contract.md §12](./06-api-and-contract.md)）| Spring Boot 原生无对应前缀，自建 |
| `mb.route-tree.path` | 路由树 JSON 文件路径，`RouteTreeSyncRunner` 启动时读取 | 默认 `classpath:route-tree.json`；Spring Boot 无对应原生前缀，自建 |

---

## 9.2 完整环境变量清单

> **表格约定**：
> - **Env Var** 列：容器/k8s 注入的环境变量名，符合 Spring Boot 的 `spring.datasource.url` ↔ `SPRING_DATASOURCE_URL` 自动映射规则
> - **必填** 列：`dev/test` 可选（有默认值），`prod` 必填（fail-fast 校验）
> - **敏感** 列：标 🔐 的字段禁止进 git，必须通过 env var 注入

### 9.2.1 数据库（PostgreSQL + HikariCP）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | String | — | prod | — | JDBC URL：`jdbc:postgresql://host:port/db` |
| `SPRING_DATASOURCE_USERNAME` | `spring.datasource.username` | String | — | prod | — | DB 用户 |
| `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.password` | String | — | prod | 🔐 | DB 密码 |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | `spring.datasource.hikari.maximum-pool-size` | int | 10 | — | — | HikariCP 最大连接数 |
| `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE` | `spring.datasource.hikari.minimum-idle` | int | 2 | — | — | 最小空闲连接 |
| `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT` | `spring.datasource.hikari.connection-timeout` | long(ms) | 30000 | — | — | 获取连接超时 |
| `SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT` | `spring.datasource.hikari.idle-timeout` | long(ms) | 600000 | — | — | 空闲连接回收 |
| `SPRING_DATASOURCE_HIKARI_MAX_LIFETIME` | `spring.datasource.hikari.max-lifetime` | long(ms) | 1800000 | — | — | 连接最大存活时间 |
| `MB_JOOQ_SLOW_QUERY_THRESHOLD_MS` | `mb.jooq.slow-query-threshold-ms` | long | 500 | — | — | `SlowQueryListener` 慢查询日志阈值 |

### 9.2.2 Flyway migration

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `SPRING_FLYWAY_ENABLED` | `spring.flyway.enabled` | boolean | `true` | — | — | Flyway migration 开关 |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | `spring.flyway.baseline-on-migrate` | boolean | `false` | — | — | 空库自动 baseline（v1 保持 false）|
| `SPRING_FLYWAY_VALIDATE_ON_MIGRATE` | `spring.flyway.validate-on-migrate` | boolean | `true` | — | — | 启动时校验 checksum |
| `SPRING_FLYWAY_OUT_OF_ORDER` | `spring.flyway.out-of-order` | boolean | `false` | — | — | **禁止在 prod 启用**（ADR-0008）|
| `SPRING_FLYWAY_LOCATIONS` | `spring.flyway.locations` | String | `classpath:db/migration` | — | — | migration 扫描路径 |

### 9.2.3 Redis（Spring Data Redis + Sa-Token session + Spring Cache）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `SPRING_DATA_REDIS_HOST` | `spring.data.redis.host` | String | `localhost` | prod | — | Redis 主机 |
| `SPRING_DATA_REDIS_PORT` | `spring.data.redis.port` | int | `6379` | — | — | Redis 端口 |
| `SPRING_DATA_REDIS_PASSWORD` | `spring.data.redis.password` | String | (空) | prod | 🔐 | Redis 密码 |
| `SPRING_DATA_REDIS_DATABASE` | `spring.data.redis.database` | int | `0` | — | — | Redis database 编号 |
| `SPRING_DATA_REDIS_LETTUCE_POOL_MAX_ACTIVE` | `spring.data.redis.lettuce.pool.max-active` | int | `8` | — | — | Lettuce 连接池 |
| `SPRING_DATA_REDIS_LETTUCE_POOL_MAX_IDLE` | `spring.data.redis.lettuce.pool.max-idle` | int | `8` | — | — | |
| `SPRING_DATA_REDIS_LETTUCE_POOL_MIN_IDLE` | `spring.data.redis.lettuce.pool.min-idle` | int | `0` | — | — | |
| `MB_CACHE_DEFAULT_TTL_SECONDS` | `mb.cache.default-ttl-seconds` | long | `3600` | — | — | 缓存默认 TTL |
| `MB_CACHE_JITTER_PERCENT` | `mb.cache.jitter-percent` | int | `10` | — | — | TTL 抖动百分比（防雪崩，`CacheEvictSupport` 读取）|

### 9.2.4 Sa-Token 认证

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_JWT_SECRET` | `sa-token.jwt-secret-key` | String | — | **prod** | 🔐 | JWT 签名密钥（最少 32 字符，§9.5）|
| `SA_TOKEN_TOKEN_NAME` | `sa-token.token-name` | String | `Authorization` | — | — | token header / cookie 名 |
| `SA_TOKEN_TIMEOUT` | `sa-token.timeout` | long(秒) | `2592000` | — | — | token 有效期（30 天）|
| `SA_TOKEN_ACTIVE_TIMEOUT` | `sa-token.active-timeout` | long(秒) | `-1` | — | — | 不检查活跃度 |
| `SA_TOKEN_IS_CONCURRENT` | `sa-token.is-concurrent` | boolean | `true` | — | — | 允许同账号多端登录 |
| `SA_TOKEN_IS_SHARE` | `sa-token.is-share` | boolean | `false` | — | — | 多端共享 token |
| `SA_TOKEN_TOKEN_STYLE` | `sa-token.token-style` | String | `jwt` | — | — | token 风格 |
| `SA_TOKEN_TOKEN_PREFIX` | `sa-token.token-prefix` | String | `Bearer` | — | — | token 前缀 |
| `SA_TOKEN_AUTO_RENEW` | `sa-token.auto-renew` | boolean | `false` | — | — | 不自动续签 |
| `SA_TOKEN_IS_LOG` | `sa-token.is-log` | boolean | `false` | — | — | Sa-Token 内部日志（prod 必须 false，dev 可 true）|

### 9.2.5 文件存储（local / MinIO 切换）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_FILE_STORAGE_MODE` | `mb.file.storage.mode` | enum(`LOCAL`/`MINIO`) | `LOCAL` | — | — | 存储模式 |
| `MB_FILE_STORAGE_LOCAL_BASE_PATH` | `mb.file.storage.local.base-path` | String | `/var/mb/files` | `LOCAL` 时必填 | — | 本地根目录 |
| `MB_FILE_STORAGE_MINIO_ENDPOINT` | `mb.file.storage.minio.endpoint` | String | — | `MINIO` 时必填 | — | MinIO 地址 |
| `MB_FILE_STORAGE_MINIO_ACCESS_KEY` | `mb.file.storage.minio.access-key` | String | — | `MINIO` 时必填 | 🔐 | MinIO accessKey |
| `MB_FILE_STORAGE_MINIO_SECRET_KEY` | `mb.file.storage.minio.secret-key` | String | — | `MINIO` 时必填 | 🔐 | MinIO secretKey |
| `MB_FILE_STORAGE_MINIO_BUCKET` | `mb.file.storage.minio.bucket` | String | `metabuild` | — | — | bucket 名 |
| `SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE` | `spring.servlet.multipart.max-file-size` | DataSize | `10MB` | — | — | 单文件上传上限 |
| `SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE` | `spring.servlet.multipart.max-request-size` | DataSize | `20MB` | — | — | 单请求总上限 |

### 9.2.6 邮件（可选，`spring.mail.*`）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `SPRING_MAIL_HOST` | `spring.mail.host` | String | — | 启用时必填 | — | SMTP host |
| `SPRING_MAIL_PORT` | `spring.mail.port` | int | `587` | — | — | SMTP port |
| `SPRING_MAIL_USERNAME` | `spring.mail.username` | String | — | 启用时必填 | — | SMTP 用户 |
| `SPRING_MAIL_PASSWORD` | `spring.mail.password` | String | — | 启用时必填 | 🔐 | SMTP 密码 |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE` | `spring.mail.properties.mail.smtp.starttls.enable` | boolean | `true` | — | — | 启用 STARTTLS |
| `MB_MAIL_FROM` | `mb.mail.from` | String | — | 启用时必填 | — | 发件人地址（`spring.mail.*` 没有此字段）|
| `MB_MAIL_ENABLED` | `mb.mail.enabled` | boolean | `false` | — | — | meta-build 层面的邮件开关（决定 `MbMailProperties` 是否加载，见 §9.5.3）|

### 9.2.7 限流（自建 Bucket4j）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_RATE_LIMIT_ENABLED` | `mb.rate-limit.enabled` | boolean | `true` | — | — | 全局开关 |
| `MB_RATE_LIMIT_GLOBAL_QPS` | `mb.rate-limit.global-qps` | int | `1000` | — | — | 全局 QPS |
| `MB_RATE_LIMIT_PER_IP_QPS` | `mb.rate-limit.per-ip-qps` | int | `100` | — | — | 按 IP QPS |
| `MB_RATE_LIMIT_PER_USER_QPS` | `mb.rate-limit.per-user-qps` | int | `200` | — | — | 按登录用户 QPS |
| `MB_RATE_LIMIT_BURST_CAPACITY` | `mb.rate-limit.burst-capacity` | int | `50` | — | — | 突发容量 |

### 9.2.8 定时任务（ShedLock）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_JOB_ENABLED` | `mb.job.enabled` | boolean | `true` | — | — | 定时任务总开关 |
| `MB_JOB_TIMEZONE` | `mb.job.timezone` | String | `UTC` | — | — | cron 表达式时区 |
| `MB_JOB_SHEDLOCK_DEFAULT_LOCK_AT_MOST_SECONDS` | `mb.job.shedlock.default-lock-at-most-seconds` | long | `300` | — | — | ShedLock 默认锁超时 |

### 9.2.9 可观测性

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `LOGGING_LEVEL_ROOT` | `logging.level.root` | String | `INFO` | — | — | 根日志级别 |
| `LOGGING_LEVEL_COM_METABUILD` | `logging.level.com.metabuild` | String | `INFO` | — | — | 项目日志级别（dev 用 `DEBUG`）|
| `MB_OBSERVABILITY_LOG_JSON_ENABLED` | `mb.observability.log-json-enabled` | boolean | `false`(dev) / `true`(prod) | — | — | JSON encoder 开关 |
| `MB_OBSERVABILITY_TRACE_SAMPLING_RATE` | `mb.observability.trace-sampling-rate` | double | `1.0`(dev) / `0.1`(prod) | — | — | Micrometer tracing 采样率 |
| `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` | `management.endpoints.web.exposure.include` | String | dev: `*` / prod: `health,info,prometheus,readiness,liveness` | — | — | Actuator 暴露端点 |

### 9.2.10 CORS（白名单）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_CORS_ALLOWED_ORIGINS` | `mb.cors.allowed-origins` | List\<String\>(逗号分隔) | `http://localhost:*`(dev) | **prod** | — | 允许的 origin 白名单 |
| `MB_CORS_ALLOWED_METHODS` | `mb.cors.allowed-methods` | List\<String\> | `GET,POST,PUT,DELETE,PATCH` | — | — | 允许的 method |
| `MB_CORS_ALLOWED_HEADERS` | `mb.cors.allowed-headers` | List\<String\> | `*` | — | — | 允许的 header |
| `MB_CORS_ALLOW_CREDENTIALS` | `mb.cors.allow-credentials` | boolean | `true` | — | — | 允许 cookie |
| `MB_CORS_MAX_AGE_SECONDS` | `mb.cors.max-age-seconds` | long | `3600` | — | — | 预检请求缓存 |

### 9.2.11 国际化 + 应用元数据

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `SPRING_MESSAGES_BASENAME` | `spring.messages.basename` | String | `messages` | — | — | i18n bundle base name |
| `SPRING_MESSAGES_FALLBACK_TO_SYSTEM_LOCALE` | `spring.messages.fallback-to-system-locale` | boolean | `false` | — | — | 禁止回退到系统 locale |
| `MB_I18N_DEFAULT_LOCALE` | `mb.i18n.default-locale` | String | `zh_CN` | — | — | 默认 locale |
| `MB_I18N_SUPPORTED_LOCALES` | `mb.i18n.supported-locales` | List\<String\> | `zh_CN,en_US` | — | — | 支持的 locale 列表 |
| `SERVER_PORT` | `server.port` | int | `8080` | — | — | HTTP 端口 |
| `SERVER_SERVLET_CONTEXT_PATH` | `server.servlet.context-path` | String | `/` | — | — | Context path |
| `SPRING_APPLICATION_NAME` | `spring.application.name` | String | `meta-build` | — | — | 应用名 |
| `MB_APP_VERSION` | `mb.app.version` | String | (Maven property 注入) | — | — | 应用版本 |

### 9.2.12 platform-iam 密码策略（`mb.iam.password.*`，详见 [05-security.md §8.3](./05-security.md#83-密码策略可配置)）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_IAM_PASSWORD_MIN_LENGTH` | `mb.iam.password.min-length` | int | `8` | — | — | 密码最小长度 |
| `MB_IAM_PASSWORD_MAX_LENGTH` | `mb.iam.password.max-length` | int | `128` | — | — | 密码最大长度 |
| `MB_IAM_PASSWORD_REQUIRE_DIGIT` | `mb.iam.password.require-digit` | boolean | `true` | — | — | 必须含数字 |
| `MB_IAM_PASSWORD_REQUIRE_LETTER` | `mb.iam.password.require-letter` | boolean | `true` | — | — | 必须含字母 |
| `MB_IAM_PASSWORD_REQUIRE_UPPERCASE` | `mb.iam.password.require-uppercase` | boolean | `false` | — | — | 必须含大写字母 |
| `MB_IAM_PASSWORD_REQUIRE_SPECIAL` | `mb.iam.password.require-special` | boolean | `false` | — | — | 必须含特殊字符 |
| `MB_IAM_PASSWORD_HISTORY_COUNT` | `mb.iam.password.history-count` | int | `5` | — | — | 密码历史不重用数量 |
| `MB_IAM_PASSWORD_MAX_AGE_DAYS` | `mb.iam.password.max-age-days` | int | `0` | — | — | 过期天数，`0` = 不过期 |
| `MB_IAM_PASSWORD_LOCKOUT_THRESHOLD` | `mb.iam.password.lockout-threshold` | int | `5` | — | — | 连续失败锁定阈值 |
| `MB_IAM_PASSWORD_LOCKOUT_DURATION_MINUTES` | `mb.iam.password.lockout-duration-minutes` | int | `30` | — | — | 锁定持续时长 |
| `MB_IAM_PASSWORD_RESET_TOKEN_TTL_MINUTES` | `mb.iam.password.reset-token-ttl-minutes` | int | `15` | — | — | 忘密 token 有效期 |

### 9.2.13 分页配置（`mb.api.pagination.*`，详见 [06-api-and-contract.md §12](./06-api-and-contract.md)）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_API_PAGINATION_DEFAULT_SIZE` | `mb.api.pagination.default-size` | int | `20` | — | — | 未传 size 时的默认值 |
| `MB_API_PAGINATION_MAX_SIZE` | `mb.api.pagination.max-size` | int | `200` | — | — | size 硬上限，超过抛 HTTP 400 |

### 9.2.14 路由树同步（`mb.route-tree.*`）

| Env Var | yml 键 | 类型 | 默认值 | 必填 | 敏感 | 说明 |
|---|---|---|---|---|---|---|
| `MB_ROUTE_TREE_PATH` | `mb.route-tree.path` | String | `classpath:route-tree.json` | — | — | 路由树 JSON 文件路径（`RouteTreeSyncRunner` 启动时读取）|

**合计**：约 84 个配置项，分 14 组；其中**敏感字段 6 个**（§9.6.1）。

---

## 9.3 Spring profiles 分层策略

### 9.3.1 分工表

| profile | 加载规则 | 职责 |
|---|---|---|
| `application.yml` | 所有 profile 共享 | 跨环境默认值（如 HikariCP 默认池大小 / 缓存 TTL / CORS method 白名单），**禁止含敏感或环境相关值** |
| `application-dev.yml` | `spring.profiles.active=dev` | 本地开发：写死 localhost 连接 + 宽松 CORS + DEBUG 日志 + 全部 Actuator 端点 |
| `application-test.yml` | `@ActiveProfiles("test")` | 集成测试：`BaseIntegrationTest` + Testcontainers 动态注入 `spring.datasource.*` 和 `spring.data.redis.*` |
| `application-prod.yml` | `spring.profiles.active=prod` | 生产：**所有敏感和环境相关字段走 `${MB_*}` / `${SPRING_*}` env var**，不写任何具体值 |

### 9.3.2 `application.yml`（共享基础）

```yaml
spring:
  application:
    name: meta-build
  jpa:
    open-in-view: false   # 硬约束,禁用 OSIV
  threads:
    virtual:
      enabled: false      # v1 不启用 virtual thread,M4 末评估
  flyway:
    enabled: true
    baseline-on-migrate: false
    validate-on-migrate: true
    out-of-order: false   # ADR-0008 禁止
    locations: classpath:db/migration
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  data:
    redis:
      database: 0
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 20MB
  messages:
    basename: messages
    fallback-to-system-locale: false

sa-token:
  token-name: Authorization
  token-prefix: Bearer
  timeout: 2592000
  active-timeout: -1
  is-concurrent: true
  is-share: false
  token-style: jwt
  auto-renew: false

mb:
  jooq:
    slow-query-threshold-ms: 500
  cache:
    default-ttl-seconds: 3600
    jitter-percent: 10
  rate-limit:
    enabled: true
    global-qps: 1000
    per-ip-qps: 100
    per-user-qps: 200
    burst-capacity: 50
  job:
    enabled: true
    timezone: UTC
    shedlock:
      default-lock-at-most-seconds: 300
  i18n:
    default-locale: zh_CN
    supported-locales: zh_CN,en_US
  cors:
    allowed-methods: GET,POST,PUT,DELETE,PATCH
    allowed-headers: "*"
    allow-credentials: true
    max-age-seconds: 3600

server:
  port: 8080
  servlet:
    context-path: /

logging:
  level:
    root: INFO
    com.metabuild: INFO
```

### 9.3.3 `application-dev.yml`

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/metabuild_dev
    username: metabuild
    password: dev_only_password    # 仅开发,非生产敏感
  data:
    redis:
      host: localhost
      password: ""

sa-token:
  jwt-secret-key: dev_jwt_secret_DO_NOT_USE_IN_PROD_min_32_chars
  is-log: true

mb:
  file:
    storage:
      mode: LOCAL
      local:
        base-path: ./var/files
  mail:
    enabled: false
  cors:
    allowed-origins: http://localhost:3000,http://localhost:5173
  observability:
    log-json-enabled: false
    trace-sampling-rate: 1.0

management:
  endpoints:
    web:
      exposure:
        include: "*"
  endpoint:
    configprops:
      show-values: always   # dev 显示全部配置

logging:
  level:
    com.metabuild: DEBUG
```

### 9.3.4 `application-test.yml`

```yaml
# Testcontainers 动态注入:
# - spring.datasource.url / username / password 由 BaseIntegrationTest @DynamicPropertySource 注入
# - spring.data.redis.host / port 同上

sa-token:
  jwt-secret-key: test_jwt_secret_for_integration_tests_min_32_chars

mb:
  file:
    storage:
      mode: LOCAL
      local:
        base-path: ${java.io.tmpdir}/mb-test-files
  mail:
    enabled: false
  cors:
    allowed-origins: http://localhost
  observability:
    log-json-enabled: false
    trace-sampling-rate: 0.0

logging:
  level:
    root: WARN
    com.metabuild: INFO
```

### 9.3.5 `application-prod.yml`

```yaml
# 生产配置规则:
# 1. 所有敏感字段和环境相关字段必须通过 env var 注入
# 2. 此文件禁止出现任何具体值(只定义"此字段必须从 env var 来"的映射 + 少量可选默认值)
# 3. 缺失必填字段时 fail-fast 启动失败(§9.5)

spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST}
      password: ${SPRING_DATA_REDIS_PASSWORD}
  mail:
    host: ${SPRING_MAIL_HOST:}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME:}
    password: ${SPRING_MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          starttls:
            enable: true

sa-token:
  jwt-secret-key: ${MB_JWT_SECRET}
  is-log: false

mb:
  file:
    storage:
      mode: ${MB_FILE_STORAGE_MODE:LOCAL}
      local:
        base-path: ${MB_FILE_STORAGE_LOCAL_BASE_PATH:/var/mb/files}
      minio:
        endpoint: ${MB_FILE_STORAGE_MINIO_ENDPOINT:}
        access-key: ${MB_FILE_STORAGE_MINIO_ACCESS_KEY:}
        secret-key: ${MB_FILE_STORAGE_MINIO_SECRET_KEY:}
        bucket: ${MB_FILE_STORAGE_MINIO_BUCKET:metabuild}
  mail:
    enabled: ${MB_MAIL_ENABLED:false}
    from: ${MB_MAIL_FROM:}
  cors:
    allowed-origins: ${MB_CORS_ALLOWED_ORIGINS}
  observability:
    log-json-enabled: true
    trace-sampling-rate: ${MB_OBSERVABILITY_TRACE_SAMPLING_RATE:0.1}

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,readiness,liveness
  endpoint:
    configprops:
      show-values: when_authorized   # prod 需权限查看
```

---

## 9.4 `@ConfigurationProperties` 类规范

### 9.4.1 命名和包位置

每组相关配置对应一个 `@ConfigurationProperties` 类：

| Properties 类 | 前缀 | 归属模块 | 包位置 |
|---|---|---|---|
| `MbIdProperties` | `mb.id` | infra-jooq | `com.metabuild.infra.jooq.config` |
| `MbJooqProperties` | `mb.jooq` | infra-jooq | `com.metabuild.infra.jooq.config` |
| `MbCacheProperties` | `mb.cache` | infra-cache | `com.metabuild.infra.cache.config` |
| `MbCorsProperties` | `mb.cors` | infra-security | `com.metabuild.infra.security.config` |
| `MbRateLimitProperties` | `mb.rate-limit` | infra-rate-limit | `com.metabuild.infra.ratelimit.config` |
| `MbI18nProperties` | `mb.i18n` | infra-i18n | `com.metabuild.infra.i18n.config` |
| `MbObservabilityProperties` | `mb.observability` | infra-observability | `com.metabuild.infra.observability.config` |
| `MbFileStorageProperties` | `mb.file.storage` | platform-file | `com.metabuild.platform.file.config` |
| `MbMailProperties` | `mb.mail` | platform-notification | `com.metabuild.platform.notification.config` |
| `MbJobProperties` | `mb.job` | platform-job | `com.metabuild.platform.job.config` |
| `MbRouteTreeProperties` | `mb.route-tree` | platform-iam | `com.metabuild.platform.iam.config` |
| `MbAppProperties` | `mb.app` | mb-admin | `com.metabuild.admin.config` |

**Spring Boot / starter 原生配置**（`spring.datasource.*` / `sa-token.*` / `server.*` 等）**不定义自己的 Properties 类**，由 Spring Boot / starter 自动绑定到其内部配置类（`DataSourceProperties` / `SaTokenConfig` / ...）。

### 9.4.2 标准模板（`record` + `@Validated`）

```java
package com.metabuild.infra.cache.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * meta-build 缓存配置。
 *
 * 环境变量前缀 mb.cache.*,完整清单见 docs/specs/backend/09-config-management.md §9.2.3
 */
@ConfigurationProperties(prefix = "mb.cache")
@Validated
public record MbCacheProperties(
    @NotNull @Min(60) @Max(86400) Long defaultTtlSeconds,
    @NotNull @Min(0) @Max(50) Integer jitterPercent
) {
}
```

### 9.4.3 启用方式

在 `mb-admin` 的 `MetaBuildApplication` 启动类上标注：

```java
@SpringBootApplication
@ConfigurationPropertiesScan(basePackages = "com.metabuild")
public class MetaBuildApplication {
    public static void main(String[] args) {
        SpringApplication.run(MetaBuildApplication.class, args);
    }
}
```

`@ConfigurationPropertiesScan` 自动发现 `com.metabuild.*` 下所有 `@ConfigurationProperties` 类，无需逐个 `@EnableConfigurationProperties`。

### 9.4.4 为什么用 `record` 而不是 `class`

| 维度 | `record` | `class` + Lombok |
|---|---|---|
| 不可变 | ✅ 天然不可变 | ❌ 需要 `@Value`（Lombok）或手工 final |
| 构造器绑定 | ✅ Spring Boot 3.x 推荐的绑定方式 | 需要 `@ConstructorBinding` 注解 |
| 代码量 | ✅ 无 getter/setter/constructor | ❌ 即使用 Lombok 也更长 |
| `@Validated` 支持 | ✅ | ✅ |
| `toString` 含敏感字段 | ⚠️ 自动生成会暴露，**含敏感字段时必须手动覆盖**（§9.6.3）| Lombok 可 `@ToString(exclude = ...)` |

**硬约束**：Properties 类默认使用 `record`。含敏感字段时必须手动覆盖 `toString()`（§9.6.3）。

### 9.4.5 嵌套配置：内部 `record`

```java
@ConfigurationProperties(prefix = "mb.file.storage")
@Validated
public record MbFileStorageProperties(
    @NotNull Mode mode,
    @Valid Local local,
    @Valid Minio minio
) {
    public enum Mode { LOCAL, MINIO }

    public record Local(
        @NotBlank String basePath
    ) {}

    public record Minio(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket
    ) {
        @Override
        public String toString() {
            return "Minio[endpoint=%s, accessKey=***, secretKey=***, bucket=%s]"
                .formatted(endpoint, bucket);
        }
    }
}
```

### 9.4.6 ArchUnit 规则

`infra-archunit` 必须包含以下规则（M1 落地）：

```java
@ArchTest
static final ArchRule NO_AT_VALUE_ANNOTATION = noClasses()
    .that().resideInAPackage("com.metabuild..")
    .should().beAnnotatedWith("org.springframework.beans.factory.annotation.Value")
    .because("禁止 @Value,必须通过 @ConfigurationProperties 类型安全访问配置(§9.1.2)");

@ArchTest
static final ArchRule PROPERTIES_MUST_BE_VALIDATED = classes()
    .that().areAnnotatedWith(ConfigurationProperties.class)
    .and().resideInAPackage("com.metabuild..")
    .should().beAnnotatedWith(Validated.class)
    .because("所有 @ConfigurationProperties 必须 @Validated(§9.5)");

@ArchTest
static final ArchRule NO_CONFIG_HARDCODED = noClasses()
    .that().resideInAPackage("com.metabuild..")
    .should().accessFieldWhere(
        // 规则实现:检查字符串常量是否匹配"看起来像配置值"的模式
        // 如 JDBC URL / host:port / Base64 密钥 / 超过 32 字符的 hex 字符串
    )
    .because("配置值不得硬编码(§9.1.1)");
```

---

## 9.5 fail-fast 启动校验

### 9.5.1 为什么必须 fail-fast

**反面教材（nxboot 踩过的坑）**：
1. 生产环境启动时 `JWT_SECRET` 为空（运维忘了注入 env var）
2. Spring Boot 启动成功（字段默认值是 null）
3. 第一个用户登录时 `JwtTokenProvider.sign(null)` 抛 NPE
4. 用户看到"登录失败，请稍后重试"
5. 运维从日志发现问题时，已经过去 30 分钟

**正确做法**：缺失必填敏感字段时，**应用启动失败**（进程退出码非 0），由 k8s / docker 的 liveness probe 立即告警。

### 9.5.2 三层防护

**第一层**：`@Validated` + jakarta.validation（应用级，覆盖 `@ConfigurationProperties` 类字段）

```java
@ConfigurationProperties(prefix = "mb.cors")
@Validated
public record MbCorsProperties(
    @NotEmpty(message = "mb.cors.allowed-origins 必填") List<String> allowedOrigins,
    @NotEmpty List<String> allowedMethods,
    @NotNull List<String> allowedHeaders,
    @NotNull Boolean allowCredentials,
    @Min(0) Long maxAgeSeconds
) {}
```

prod 启动时若 `MB_CORS_ALLOWED_ORIGINS` 为空，Spring Boot 抛 `BindValidationException`：

```
***************************
APPLICATION FAILED TO START
***************************

Binding to target [Bindable@xxx type = MbCorsProperties] failed:

    Property: mb.cors.allowed-origins
    Value: null
    Reason: mb.cors.allowed-origins 必填
```

退出码 1，k8s 检测到并重启。

**第二层**：`ApplicationContextInitializer` 做跨字段 + 跨 Properties 的 profile 级校验

有些校验 jakarta.validation 不好表达：

- "prod profile 下 `sa-token.jwt-secret-key` 必填"（Sa-Token 的 `SaTokenConfig` 不是我们的 record，加不了 `@Validated`）
- "`MB_FILE_STORAGE_MODE=MINIO` 时 minio.access-key/secret-key 必填"（跨字段条件约束）
- "`MB_MAIL_ENABLED=true` 时 mail.host/username/password/from 必填"

用 `ApplicationContextInitializer` 在 context 初始化时检查：

```java
package com.metabuild.admin.bootstrap;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import java.util.ArrayList;
import java.util.List;

/**
 * prod profile 下的跨字段配置校验。
 *
 * 注册方式:见 MetaBuildApplication.main()
 */
public class ProfileConfigValidator implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext ctx) {
        Environment env = ctx.getEnvironment();
        if (!env.matchesProfiles("prod")) return;

        List<String> errors = new ArrayList<>();

        // 1. Sa-Token(外部 starter,无法用 @Validated)
        requireNonBlank(env, "sa-token.jwt-secret-key", errors);
        requireMinLength(env, "sa-token.jwt-secret-key", 32, errors);

        // 2. 文件存储(跨字段条件)
        String storageMode = env.getProperty("mb.file.storage.mode", "LOCAL");
        if ("MINIO".equals(storageMode)) {
            requireNonBlank(env, "mb.file.storage.minio.endpoint", errors);
            requireNonBlank(env, "mb.file.storage.minio.access-key", errors);
            requireNonBlank(env, "mb.file.storage.minio.secret-key", errors);
        }

        // 3. 邮件(跨字段条件,mb.mail.enabled 决定整个 Properties 是否加载)
        boolean mailEnabled = Boolean.parseBoolean(env.getProperty("mb.mail.enabled", "false"));
        if (mailEnabled) {
            requireNonBlank(env, "spring.mail.host", errors);
            requireNonBlank(env, "spring.mail.username", errors);
            requireNonBlank(env, "spring.mail.password", errors);
            requireNonBlank(env, "mb.mail.from", errors);
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException(
                "prod profile 配置校验失败(应用启动中止):\n  - " + String.join("\n  - ", errors) +
                "\n\n完整配置清单见 docs/specs/backend/09-config-management.md §9.2"
            );
        }
    }

    private void requireNonBlank(Environment env, String key, List<String> errors) {
        String v = env.getProperty(key);
        if (v == null || v.isBlank()) {
            errors.add(key + " 必填(对应 env var " + toEnvVar(key) + ")");
        }
    }

    private void requireMinLength(Environment env, String key, int minLen, List<String> errors) {
        String v = env.getProperty(key);
        if (v != null && v.length() < minLen) {
            errors.add(key + " 长度至少 " + minLen + " 字符(当前 " + v.length() + ")");
        }
    }

    private String toEnvVar(String key) {
        return key.toUpperCase().replace('.', '_').replace('-', '_');
    }
}
```

**Spring Boot 3.x 注册方式**（`spring.factories` 已废弃）：

在 `MetaBuildApplication.main()` 中直接注册：

```java
@SpringBootApplication
@ConfigurationPropertiesScan(basePackages = "com.metabuild")
public class MetaBuildApplication {
    public static void main(String[] args) {
        new SpringApplicationBuilder(MetaBuildApplication.class)
            .initializers(new ProfileConfigValidator())
            .run(args);
    }
}
```

> ⚠️ Spring Boot 3.x 已不推荐 `META-INF/spring.factories` 注册 `ApplicationContextInitializer`，改用 `SpringApplicationBuilder.initializers()` 显式注册。

**第三层**：k8s / docker liveness probe（基础设施级）

```yaml
# docker-compose.yml / k8s Deployment
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

容器启动失败 → `CrashLoopBackOff` → 运维告警。

### 9.5.3 条件加载（可选 Properties）

不是所有缺失配置都应该 fail-fast。**可选配置**（如邮件 / MinIO）应该在**启用时**才校验：

```java
@ConfigurationProperties(prefix = "mb.mail")
@Validated
@ConditionalOnProperty(prefix = "mb.mail", name = "enabled", havingValue = "true")
public record MbMailProperties(
    @NotBlank String from
    // Spring Boot 原生 spring.mail.host 等由 MailProperties 校验
) {}
```

`MbMailProperties` 只在 `mb.mail.enabled=true` 时加载，`@NotBlank` 校验才会触发。这样**邮件未启用时不需要配 SMTP**。

同样的模式用于 MinIO：

```java
// MbFileStorageProperties 的 Minio 内部 record 不能用 @ConditionalOnProperty
// 改为在 ProfileConfigValidator 第二层处理(§9.5.2 代码中已覆盖)
```

---

## 9.6 敏感配置处理

### 9.6.1 敏感字段清单（必须走 env var）

| 模块 | 字段 | 说明 |
|---|---|---|
| 数据库 | `SPRING_DATASOURCE_PASSWORD` | PostgreSQL 密码 |
| Redis | `SPRING_DATA_REDIS_PASSWORD` | Redis 密码 |
| Sa-Token | `MB_JWT_SECRET` | JWT 签名密钥 |
| 文件存储(MinIO) | `MB_FILE_STORAGE_MINIO_ACCESS_KEY` | MinIO accessKey |
| 文件存储(MinIO) | `MB_FILE_STORAGE_MINIO_SECRET_KEY` | MinIO secretKey |
| 邮件 | `SPRING_MAIL_PASSWORD` | SMTP 密码 |

**合计 6 个敏感字段**。未来新增敏感字段时必须同步更新此清单。

### 9.6.2 `.gitignore` 规则

`meta-build/.gitignore` 必须包含：

```gitignore
# 环境变量文件(任何位置)
.env
.env.*
*.env

# IDE 运行配置(常含 env var)
.idea/runConfigurations/
.idea/workspace.xml
.vscode/launch.json

# 生产配置的本地副本
application-prod-local.yml
application-*-override.yml
application-*-secret.yml
```

`CI/CD` 流程必须检查：

```bash
# 阻止包含敏感关键字的文件被 commit
git secrets --scan
# 或自定义 pre-commit hook:grep 所有 *.yml 里的 password/secret/key 是否含非 ${...} 的值
```

### 9.6.3 禁止敏感字段进日志

**反面教材**：nxboot 有次在 debug 日志里打印了整个 `DataSource` 配置，密码明文出现在 ELK 里。

**record 的 `toString` 问题**：

```java
// ❌ 错误:record 自动生成 toString 会打印密码
public record MinioConfig(String endpoint, String accessKey, String secretKey, String bucket) {}

// log.info("storage: {}", config) 会输出:
// "MinioConfig[endpoint=http://minio:9000, accessKey=ROOTUSER, secretKey=real_secret, bucket=metabuild]"
```

**正确做法**：手动覆盖 `toString()`：

```java
public record MinioConfig(String endpoint, String accessKey, String secretKey, String bucket) {
    @Override
    public String toString() {
        return "MinioConfig[endpoint=%s, accessKey=***, secretKey=***, bucket=%s]"
            .formatted(endpoint, bucket);
    }
}
```

**ArchUnit 硬约束**（M1 落地）：

```java
@ArchTest
static final ArchRule SENSITIVE_RECORDS_MUST_OVERRIDE_TOSTRING = classes()
    .that().areRecords()
    .and().containAnyFieldsThat(haveNameMatching("(?i).*(password|secret|accessKey|privateKey).*"))
    .should().haveMethod("toString", String.class)
    .because("含敏感字段的 record 必须手动覆盖 toString(§9.6.3)");
```

### 9.6.4 禁止日志级别过低

prod profile 下：

- `logging.level.root` ≥ `INFO`
- `logging.level.org.springframework.security` 不得设为 `DEBUG`
- `logging.level.cn.dev33.satoken` 不得设为 `DEBUG`
- `sa-token.is-log` 必须为 `false`

这些由 `ProfileConfigValidator`（§9.5.2）追加检查。

### 9.6.5 密钥轮转

**v1 的轮转流程**（无零停机）：

1. 生成新 JWT 密钥（至少 32 字符随机）
2. 通过容器编排平台注入新 `MB_JWT_SECRET`
3. 重启应用
4. 所有旧 token 失效，用户需重新登录

**v1.5+ 预留**：Sa-Token 社区方案支持双密钥过渡期（`SecondaryJwtKey`），可实现无感轮转。v1 不做。

---

## 9.7 配置查看和热更新策略

### 9.7.1 v1：重启生效

所有配置变更需要重启应用：

- 模块化单体，重启成本可控（< 30 秒）
- 不上配置中心，没有推送机制
- 单实例默认，短暂不可用可接受

### 9.7.2 运行时查看配置：Actuator `/configprops`

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,configprops,readiness,liveness
  endpoint:
    configprops:
      show-values: when_authorized   # prod 需权限,dev 可 always
```

访问 `/actuator/configprops` 查看当前所有 `@ConfigurationProperties` 的绑定值。敏感字段自动脱敏（显示为 `******`）。

权限拦截通过 `@RequirePermission("admin.config.view")` 注解 Actuator 的 `WebEndpoint`（具体落地在 infra-observability M4）。

### 9.7.3 v1.5+ 预留

| 能力 | 实现方式 |
|---|---|
| 运行时配置刷新 | Spring Cloud Context `@RefreshScope` + `/actuator/refresh` |
| 集中配置管理 | Nacos / Apollo / Spring Cloud Config |
| 配置变更推送 | Spring Cloud Bus + RabbitMQ |
| 业务开关（feature flag） | 独立模块 `infra-feature-flag`（v1.5+ 设计）|

v1 不做，等使用者反馈决定升级。

---

## 9.8 AI 协作契约：新增配置项 checklist

**当 AI 或使用者给某个模块加一个新配置项时，必须完成以下步骤**：

- [ ] **前缀选择**：按 [§9.1.3 前缀策略](#913-前缀策略原生优先) 判断——有原生对应项用原生，无才用 `mb.*`
- [ ] **Properties 类**：在对应 `Mb<Module>Properties` 类加字段，配完整约束注解（`@NotBlank` / `@NotNull` / `@Min` / `@Max` 等）
- [ ] **默认值位置**：
  - 跨环境共享的默认值写在 `application.yml`
  - 环境差异值在 `application-<profile>.yml`
  - prod 走 env var 的必填字段在 `application-prod.yml` 里用 `${ENV_VAR_NAME}` 占位
- [ ] **§9.2 表格更新**：在本文档对应模块的 env var 清单里加一行，标明 key / 类型 / 默认值 / 必填 / 敏感
- [ ] **敏感字段**（如适用）：
  - 加到 [§9.6.1 敏感字段清单](#961-敏感字段清单必须走-env-var)
  - 覆盖 Properties 类的 `toString()` 脱敏
  - 确认 `.gitignore` 不会放行
- [ ] **必填字段**（prod 场景）：
  - 优先用 `@Validated` + `@NotBlank`（Properties 类）
  - 跨字段条件约束加到 `ProfileConfigValidator.checkRequired()`
- [ ] **单元测试**：`MbXxxPropertiesTest` 验证绑定 + 约束生效（正例 + 负例）
- [ ] **集成测试**（如涉及外部依赖）：在 `BaseIntegrationTest` 子类里通过 `@DynamicPropertySource` 注入测试值

**ArchUnit 自动兜底**：`NO_AT_VALUE_ANNOTATION` / `PROPERTIES_MUST_BE_VALIDATED` / `SENSITIVE_RECORDS_MUST_OVERRIDE_TOSTRING` 三条规则自动覆盖部分 checklist 项。其他靠 code review。

- [ ] **时间获取**：新增需要获取当前时间的代码时，注入 `Clock` Bean 而非直接调用 `Instant.now()`（`Clock` 是代码中注册的 Spring Bean，便于测试时替换，无需配置项）

---

## 9.9 前后端配置的独立性

前端 `@mb/app-shell` 有自己的运行时配置（主题 / API base URL / feature flag），通过 **`VITE_*`** 环境变量注入（Vite 原生）。

**两套配置系统独立**：

- 后端：`MB_*` / `SPRING_*` / `SA_TOKEN_*` → `@ConfigurationProperties`
- 前端：`VITE_*` → `import.meta.env.VITE_*`

**不共享 env var 前缀**，避免跨层耦合。

**运行时共享**：后端通过 `GET /api/v1/admin/runtime-config` 端点把一部分**公开配置**暴露给前端：

- 支持的 locale 列表
- 业务 feature flag 开关
- 应用名 / 版本号
- CDN / 资源 base URL

前端在启动时拉取此端点作为初始化参数。敏感配置和基础设施配置**不通过此端点暴露**。

完整前端配置规范见 `docs/specs/frontend/README.md`（**M0 待写**）。

---

[← 返回 README](./README.md)
