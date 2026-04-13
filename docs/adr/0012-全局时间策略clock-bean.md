# ADR-0012: 全局时间策略（Clock Bean + 文档引导）

- **状态**: 已采纳
- **日期**: 2026-04-12
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: [`docs/specs/backend/04-data-persistence.md §12.5 全局时间策略`](../specs/backend/04-data-persistence.md)
- **类型**: 具体技术决策（文档引导 + 模板示范）

> **注**：本 ADR 写于 `backend-architecture.md` 已拆分到 `docs/specs/backend/` 子目录结构之后，所有对 backend 文档的引用直接指向子目录文件。

---

## 背景

### 触发事件：M0 Review 中发现时间获取无统一规范

M0 Review 讨论中发现后端 spec 的代码示例中混用多种时间获取方式：

- `Instant.now()`（无参静态调用）
- `new Date()`
- `LocalDateTime.now()`
- `System.currentTimeMillis()`

这些方式的共同问题：**测试时无法控制时间**。涉及时间逻辑的单元测试要么跳过时间断言，要么用 `Thread.sleep()` 等待——两者都是反模式。

### Spring 官方推荐

Spring Framework 官方推荐注入 `java.time.Clock` Bean 获取时间：

- 生产环境注入 `Clock.systemUTC()`
- 测试环境注入 `Clock.fixed(instant, zone)` 冻结时间
- 所有时间 API 使用带 Clock 参数的重载：`Instant.now(clock)`、`OffsetDateTime.now(clock)`

这是 Spring 生态的原生答案（ADR-0007 元方法论的自然延伸）。

---

## 决策

### 二元时间策略

| 场景 | 策略 | 示例 |
|------|------|------|
| **Java 业务代码** | 注入 `Clock` Bean，调用 `Instant.now(clock)` | Service 中计算过期时间、生成 token 有效期 |
| **SQL / 审计字段** | DDL 用 `CURRENT_TIMESTAMP`，jOOQ 用 `DSL.currentOffsetDateTime()` | `created_at`、`updated_at` 由 RecordListener 或 DDL DEFAULT 填充 |

### 生产 Clock Bean

```java
@Bean
public Clock clock() {
    return Clock.systemUTC();
}
```

### 测试 Clock Bean

```java
@TestConfiguration
static class TimeConfig {
    @Bean
    Clock clock() {
        return Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    }
}
```

### 禁止列表（编码规范，文档引导 + 模板示范）

| 禁止调用 | 替代方式 |
|----------|---------|
| `Instant.now()` | `Instant.now(clock)` |
| `OffsetDateTime.now()` | `OffsetDateTime.now(clock)` |
| `LocalDateTime.now()` | `LocalDateTime.now(clock)` |
| `LocalDate.now()` | `LocalDate.now(clock)` |
| `System.currentTimeMillis()` | `clock.millis()` |
| `new Date()` | `Date.from(clock.instant())` |

不通过 ArchUnit 硬约束，而是通过 `Clock` Bean 工具类 + canonical reference 模板 + 12 步清单骨架代码统一示范。理由：无参时间调用的 ArchUnit 检测需要自定义 `ArchCondition`（方法参数级检查），复杂度高且误报风险大；`Clock` Bean 注入本身已经是强引导——Service 构造器里有 `Clock` 字段，开发者自然会用 `Instant.now(clock)` 而非无参调用。

---

## 为什么分两个策略

Java 业务代码和 SQL/审计字段用不同策略不是"混合方案"（ADR-0008 次级元原则的合理例外）：

- **Java 代码需要可测试性**：Clock Bean 的核心价值是让测试能冻结时间。`Instant.now()` 在测试中不可控
- **SQL 层不需要 Java 可测试性**：`CURRENT_TIMESTAMP` 由数据库在事务内统一提供，天然一致；DDL DEFAULT 和 RecordListener 用 `DSL.currentOffsetDateTime()` 是 jOOQ 原生方式
- **分界线来自问题本身**：Java 和 SQL 是两个不同的时间源，用同一种策略反而会引入不必要的复杂度（比如在 Java 里算好 Instant 再传给 SQL，破坏数据库事务时间一致性）

---

## 连带影响

### 文档修订（本次 Review 已完成）

- `04-data-persistence.md`：新增 §12.5 全局时间策略
- `08-archunit-rules.md`：§7.8 Clock Bean 规范（文档引导，非 ArchUnit 硬规则）
- `09-config-management.md`：AI 协作 checklist 新增时间获取检查项

### 代码影响（M1/M4 阶段）

- `mb-infra` 或 `mb-admin` 注册 `Clock` Bean（一行代码）
- 所有 Service 类需要当前时间时注入 `Clock` 字段
- canonical reference + 12 步清单骨架代码统一示范 `Instant.now(clock)` 用法

---

## 成本与风险

| 维度 | 评估 |
|------|------|
| 开发习惯成本 | 低——`Instant.now(clock)` 比 `Instant.now()` 多 5 个字符；Service 构造器注入 `Clock` 字段自然引导正确用法 |
| 测试收益 | 高——所有涉及时间逻辑的测试可以精确断言，不再需要 `Thread.sleep()` 或时间容差 |
| 风险 | 极低——Clock 是 JDK 标准 API，Spring 官方推荐 |
| 放弃的能力 | 无——带 Clock 参数的重载是 JDK 原生 API，不损失任何功能 |

---

## 验证方式

- ✅ `04-data-persistence.md` §12.5 有完整的二元策略说明
- ✅ `08-archunit-rules.md` §7.8 有 Clock Bean 编码规范说明
- ⏳ M1 脚手架时注册 Clock Bean
- ⏳ M4 Service 代码全部通过 `Clock` 获取时间（canonical reference + 12 步清单示范引导）
