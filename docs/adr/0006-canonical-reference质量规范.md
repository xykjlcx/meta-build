# ADR-0006: canonical reference 代码质量规范（P0 六维度 + P1 五维度）

- **状态**: 已采纳
- **日期**: 2026-04-11
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: `meta-build规划_v1_最终对齐.md`、`docs/specs/backend/`（原 `docs/specs/backend-architecture.md` 已拆分）

> **注**：本 ADR 写于 backend-architecture.md 拆分前。文中所有对 `backend-architecture.md §x.y` 的引用，现统一指向 `docs/specs/backend/` 子目录的对应文件，导航见 [backend/README.md](../specs/backend/README.md)。P0 维度的章节归位：HikariCP/缓存策略 → 04-data-persistence.md，platform-job/file/audit → 03-platform-modules.md，CurrentUser → 05-security.md。
- **上下文**: 这是对 backend-architecture.md 写作过程中"第一性原理审视"阶段的结论落地

---

## 背景

在 backend-architecture.md 多轮修订过程中，文档**结构层面**（Maven 分层、Java 包命名、模块边界、ArchUnit 规则）的讨论已经充分。但在一次"从第一性原理重新审视"中，暴露了一个被长期忽略的问题：

**文档的结构完备，不等于使用者能从零到一跑起来**。

当审视 meta-build 对目标用户的真实承诺时，发现 6 个维度是"使用者第一天写业务模块就会问"的问题，但当前文档里要么是占位符（`[M4 时补]`），要么完全没提：

1. 怎么加一个新业务模块？（从零到一的完整步骤）
2. 数据库连接池参数怎么配置？
3. 缓存策略怎么写才不出事？
4. 定时任务用什么框架？集群环境怎么防重复执行？
5. 文件上传怎么做？本地还是对象存储？
6. 审计日志怎么自动化？

这些不是"锦上添花"，而是**canonical reference 代码的质量底线**。

### 为什么这是 M0 必补而不是 M4 再做

meta-build 的路线图里，v1 的 M5 阶段要手写 **canonical reference 代码**（notice / order / approval 三个业务示例模块），作为 **v1.5 Spec 引擎** 的反向提炼样本。

**关键因果链**：
```
v1 canonical reference 代码样本质量
      ↓
v1.5 Spec 引擎能抽象出的模板质量
      ↓
使用者用 Spec 引擎生成的业务模块质量
      ↓
meta-build 项目的最终价值
```

如果 v1 样本里缓存乱写、定时任务没锁、审计日志缺失——Spec 引擎会**继承这些缺陷**。样本质量的规范**必须在 M0 就定下来**，不能等 M4 / M5 时临时决定。

这不是过度工程化，而是"**根节点决定整棵树**"的架构级约束。

---

## 决策

把以下 **11 个维度**作为 canonical reference 代码质量规范，集中写进 `backend-architecture.md`。

### P0 六维度（必须在 M0 落地的完整规范）

| # | 维度 | 位置 |
|---|------|------|
| P0.1 | **新增业务模块的完整操作流程**（12 步清单） | 新增 4.5 节 |
| P0.2 | **数据库连接池基线配置**（HikariCP 参数） | 新增 7.8 节 |
| P0.3 | **缓存策略完整规范**（key 命名 / TTL / 穿透 / 雪崩 / 击穿防护） | 新增 7.9 节 |
| P0.4 | **定时任务技术选择**（Spring `@Scheduled` + ShedLock 分布式锁） | 4.2 platform-job 小节展开 |
| P0.5 | **文件上传技术选择**（本地存储 + MinIO 可选） | 4.2 platform-file 小节展开 |
| P0.6 | **审计日志实现方案**（`@Audit` 注解 + AOP + `sys_audit_log` 表） | 4.2 platform-audit 小节展开 |

### P1 五维度（占位性规范，M4 前完善）

| # | 维度 | 位置 | M0 做什么 |
|---|------|------|---------|
| P1.1 | **事务传播的高级场景**（`REQUIRES_NEW` + 回滚规则） | 7.7 事务边界规范扩展 | 写清决策方向 |
| P1.2 | **领域事件的命名和版本规范** | 第 2 章模块边界守护 | 写清命名约定 + 字段策略 |
| P1.3 | **测试数据管理**（`@Sql` + fixture 目录约定） | 11.6 新增节 | 写清目录结构和命名 |
| P1.4 | **CI/CD 流程的具体步骤**（server.yml） | 附录 C 占位 | 列出步骤概要 |
| P1.5 | **多实例部署的兼容性约束**（哪些组件单机、哪些分布式安全） | 10.7 新增节 | 列出清单 |

### P2 推迟的（不在 M0 做）

- 消息队列集成（标记 [v1.5 时补]）
- API 废弃策略细化（标记 [M6 时补]）
- `@mb/api-sdk` 版本化（标记 [M6 时补]）
- 文档可验证性脚本（标记 [v1 完成时补]）

---

## P0 六维度的具体内容提纲

本 ADR 只列提纲。详细的代码骨架、配置示例、参数取值等写在 `backend-architecture.md` 的对应章节。

### P0.1 新增业务模块的完整操作流程（12 步）

1. `server/mb-business/` 下新建 `business-<name>/` 目录
2. 写 `pom.xml`（继承 `mb-business` parent，声明对 `mb-platform::api` 的依赖）
3. 新建 Java 包 `com.metabuild.business.<name>` + 4 层子包（`api` / `domain` / `infrastructure` / `web`）
4. 写 `<Name>Api` 接口放 `api` 子包
5. 写 `package-info.java` 标注允许的跨模块依赖（文档层约定，ArchUnit 验证）
6. 在 `mb-schema/src/main/resources/db/migration/` 加 migration 文件（**ADR-0008 后**命名规范改为 `V<yyyymmdd>_<nnn>__<module>_<table>.sql` 时间戳格式）
7. 在 `mb-admin/pom.xml` 添加对 `business-<name>` 的依赖（聚合启动）
8. 运行 `mvn -Pcodegen generate-sources -pl mb-schema` 重新生成 jOOQ 代码
9. 写 Service / Repository / Controller，按 canonical reference 的范式
10. 写集成测试继承 `BaseIntegrationTest`
11. 跑 `mvn verify` 确认 ArchUnit 规则通过
12. 如果需要权限点，在 `iam` 模块里登记 `business.<name>.create/update/delete`

### P0.2 数据库连接池基线（HikariCP）

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000          # 30s
      idle-timeout: 600000               # 10min
      max-lifetime: 1800000              # 30min
      leak-detection-threshold: 60000    # 60s 泄漏检测
      pool-name: MetaBuildHikariPool
```

**rationale**：
- `maximum-pool-size: 20` — 中小规模应用的合理起点，可按压测结果调整
- `leak-detection-threshold: 60000` — 泄漏检测在开发期必开，帮助发现未释放连接

### P0.3 缓存策略完整规范

**key 命名格式**: `mb:<模块>:<实体>:<id>` 或 `mb:<模块>:<业务>:<参数>`

例：
- `mb:iam:user:123` — 用户详情
- `mb:iam:user-perms:123` — 用户权限列表
- `mb:dict:by-code:gender` — 字典按 code 查询

**TTL 策略**：

| 数据类型 | TTL | 理由 |
|---------|-----|------|
| 用户详情 | 1 小时 | 变动不频繁 |
| 用户权限 | 30 分钟 | 权限变更需要稍快感知 |
| 字典 | 24 小时 + R__ Flyway 刷新 | 几乎不变 |
| 系统配置 | 10 分钟 | 平衡变更感知和缓存命中率 |
| 热点业务数据 | 5-15 分钟 + 随机抖动 ±20% | 防雪崩 |

**防护机制**：
- **穿透**：查询空结果也缓存（null 占位符 + 短 TTL），或用布隆过滤器
- **雪崩**：TTL 随机抖动（±20%），避免大批量 key 同时失效
- **击穿**：热点 key 用 Redis 分布式锁（Redisson `RLock`）包住数据库查询

### P0.4 定时任务技术选择

**框架**：Spring `@Scheduled` + [ShedLock](https://github.com/lukas-krecan/ShedLock)（分布式锁防集群重复执行）

**示例**：
```java
@Service
@RequiredArgsConstructor
public class DailyReportJob {

    @Scheduled(cron = "0 0 2 * * *")   // 每天凌晨 2 点
    @SchedulerLock(
        name = "dailyReportJob",
        lockAtMostFor = "10m",          // 最多持锁 10 分钟
        lockAtLeastFor = "1m"           // 至少持锁 1 分钟（防止多实例竞争）
    )
    public void run() {
        // ... 任务逻辑
    }
}
```

**存储**：ShedLock 用 JDBC 表 `shedlock` 存储锁状态（Flyway 里建表）。

**执行历史**：记录到 `sys_job_log` 表，用于监控和排查。

### P0.5 文件上传技术选择

**存储抽象**：`FileStorage` 接口 + 多实现

```java
public interface FileStorage {
    FileMetadata upload(String filename, InputStream stream, String contentType);
    InputStream download(String fileId);
    void delete(String fileId);
}
```

**v1 默认实现**：`LocalFileStorage`
- 存储路径：`${MB_FILE_STORAGE_PATH:/var/lib/meta-build/files}`
- 按 SHA-256 哈希分目录存储（`files/ab/cd/abcdef1234...`）
- 秒传：上传前校验哈希，已存在则直接返回

**可选实现**：`MinioFileStorage`（S3 兼容）
- 通过 `MB_FILE_STORAGE_TYPE=minio` 启用
- 配置 `MB_MINIO_ENDPOINT` / `MB_MINIO_ACCESS_KEY` / `MB_MINIO_SECRET_KEY` / `MB_MINIO_BUCKET`

**限制**：
- 默认最大 10MB（`MB_FILE_MAX_SIZE`）
- 默认允许的 MIME 类型：`image/*, application/pdf, application/zip`
- 双重校验（扩展名 + MIME type），避免伪装

**元数据表** `sys_file_metadata`：
- `file_id`（雪花 ID）
- `original_filename`
- `content_type`
- `size_bytes`
- `sha256` (唯一索引，用于秒传)
- `storage_type` (local/minio)
- `storage_path`
- 审计字段 + `tenant_id`

### P0.6 审计日志实现方案

**AOP 注解驱动**：

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audit {
    /** 动作标识，例如 "iam.user.update" */
    String action();

    /** 目标实体类型，例如 "User" */
    String targetType();

    /** 目标 ID 的 SpEL 表达式，例如 "#user.id" */
    String targetIdExpr() default "";

    /** 是否记录 before/after 快照 */
    boolean recordSnapshot() default true;
}
```

**用法**：
```java
@Service
public class UserService implements UserApi {

    @Audit(action = "iam.user.update", targetType = "User", targetIdExpr = "#user.id")
    @Transactional
    public User update(User user) {
        // ...
    }
}
```

**AOP 实现**：
- 方法执行前后分别取 before/after 快照（通过 Repository 查询）
- 异步写入 `sys_audit_log` 表（Spring `@Async`）
- 字段：`id / tenant_id / user_id / action / target_type / target_id / before_json / after_json / client_ip / user_agent / created_at`
- **敏感字段脱敏**：密码、token 等字段自动屏蔽（字段级 @Sensitive 注解）

**保留期**：默认 90 天（可配置 `mb.audit.retention-days`），过期数据由定时任务清理。

---

## P1 五维度的提纲（M0 只写方向）

### P1.1 事务传播的高级场景

- `REQUIRES_NEW`：独立事务的场景（如审计日志写入，外层事务回滚时审计仍保留）
- **回滚规则**：`RuntimeException` 自动回滚 / `checked Exception` 默认不回滚，用 `@Transactional(rollbackFor = Exception.class)` 强制
- **嵌套事务**：`NESTED` 在 meta-build v1 不用（Postgres 支持 savepoint 但增加复杂度）
- **分布式事务**：v1 不做，标记 [v1.5 评估]

### P1.2 领域事件命名和版本规范

- **命名**：`<Aggregate><PastTenseVerb>Event`（如 `UserCreatedEvent` / `OrderSubmittedEvent`）
- **字段策略**：事件只带 **aggregate ID + 最少上下文**，需要详情时监听者自己查询
- **版本**：v1 不做显式版本，字段变更视为 breaking change，要求同时改所有监听者
- **持久化**：v1 不做事件持久化（重启丢事件），M5 approval 模块如有需要再引入 `spring-modulith-events` 替代方案

### P1.3 测试数据管理

**目录约定**：
```
src/test/resources/
├── sql/
│   ├── iam/
│   │   ├── 01-users.sql        # 基础用户数据
│   │   └── 02-roles.sql
│   └── order/
│       └── 01-orders.sql
└── fixtures/                    # Java 代码形式的数据构造
    └── UserFixtures.java
```

**`@Sql` 用法**：
```java
@SpringBootTest
@Sql("/sql/iam/01-users.sql")
class UserServiceTest extends BaseIntegrationTest { ... }
```

### P1.4 CI/CD server.yml 步骤

```yaml
name: server CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: 21
          distribution: temurin
      - name: Cache Maven
        uses: actions/cache@v4
        with:
          path: ~/.m2/repository
          key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
      - name: Build and test
        run: cd server && mvn -B verify
      - name: Upload JaCoCo report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: server/mb-admin/target/site/jacoco/
```

### P1.5 多实例部署的兼容性约束

| 组件 | 单机 vs 分布式 | 多实例安全？ |
|------|--------------|------------|
| Redis 缓存 | 分布式 | ✅ |
| JWT（无状态） | 无状态 | ✅ |
| 限流（内存版 Bucket4j） | 单机 | ❌ 每个实例独立限流，总请求量放大 |
| 限流（Redis 版） | 分布式 | ✅（v1.5+） |
| 定时任务（ShedLock） | 分布式锁 | ✅ |
| 本地文件存储 | 单机 | ❌ 文件只在一个实例上 |
| MinIO 文件存储 | 分布式 | ✅ |
| WebSocket | 单机 | ❌（v1.5 + Redis Pub/Sub 解决） |

**v1 默认部署假设**：单实例。多实例部署要求使用 Redis 限流 + 对象存储 + 避免 WebSocket。

---

## 对 backend-architecture.md 的影响

修订统计：
- **新增章节**: 4.5（新增业务模块流程）/ 7.8（HikariCP）/ 7.9（缓存策略）/ 8.6（CurrentUser 门面层，见 ADR-0005）/ 10.7（多实例约束）/ 11.6（测试数据管理）
- **扩展章节**: 4.2（platform-job/file/audit 的具体实现）/ 7.7（事务传播高级场景）/ 附录 C（CI/CD 占位）
- **预计增加**: 约 800-1000 行
- **总长度**: 2014 行 → 约 2800-3200 行

---

## 成本和风险

### 成本

| 项目 | 成本 |
|------|------|
| 写文档 | 中（约 1 天工作量） |
| M4 / M5 实施时要遵守规范 | 低（规范本身让实施更快） |
| 使用者学习成本 | 低（每个规范都带代码示例） |

### 风险

| 风险 | 严重度 | 缓解 |
|------|-------|------|
| 规范写死后 M4 / M5 发现不合适 | 低 | 规范以 ADR 形式记录，发现问题可以再发 ADR 翻转 |
| 规范过细变成教条 | 低 | 所有规范都带 **rationale**，使用者可以基于 rationale 自己判断是否适用 |
| 文档变长导致 AI 阅读效率下降 | 低-中 | 用清晰的章节编号 + 目录导航，AI 可按需读取 |

---

## 验证方式

- ✅ backend-architecture.md 的每个 P0 维度都有**代码骨架**而不是"将来写"
- ✅ 新增 4.5 节能让一个陌生开发者按步骤加一个业务模块（"陌生人反向走查"）
- ✅ 每个 P0 规范有对应的 `<!-- verify: -->` 可执行验证块
- ✅ P1 五维度有明确的触发时机标注
- ✅ 附录 D 术语表包含所有新概念
- ⏳ M4 实施时验证：这些规范能否让实施路径清晰？
- ⏳ M5 canonical reference 代码完成后验证：是否 100% 遵守这些规范？
