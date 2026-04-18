# v1 上生产前检查清单

> **用途**：meta-build v1 阶段刻意放弃了若干工程化能力（见 meta-0023），这份清单登记放弃的内容、触发重评估的条件、建议落地顺序。**上生产前必须逐项过一遍**。

- **创建日期**：2026-04-18
- **触发 ADR**：[meta-0023](../adr/meta-0023-over-engineering-case-study.md)
- **适用范围**：v1 部署到有真实用户流量的环境（灰度 / 生产）之前

---

## 评估原则

1. **有数据再做**：每一项都要求先拿到当前流量/容量/错误率数据，确认问题真实存在后再走新 ADR
2. **数据收集优先**：若监控没覆盖该维度，先补监控再看数据
3. **按触发条件排序**：优先处理"触发条件成立"的项，其余保持搁置

---

## 1. 安全加固（强烈建议）

| 项 | 当前状态 | 上生产前动作 | 触发紧急处理的条件 |
|---|---|---|---|
| **TLS 版本锁定** | 未显式锁定 | JVM 参数加 `-Djdk.tls.client.protocols=TLSv1.3 -Djdk.tls.server.protocols=TLSv1.3`，补 ArchUnit 规则禁止 `new SSLContext()` 手工降级，补 nginx/K8s ingress 的 `ssl_protocols TLSv1.3` | 安全扫描工具报 TLS < 1.2 |
| **敏感信息脱敏** | 局部脱敏（Sa-Token 密码字段等），不系统 | 补 Logback converter `%maskPhone / %maskIdCard / %maskEmail`；DeliveryLog 的 `error_message` 入库前过滤；WeChatBindingService 日志里 `openId` 脱敏（前 4 后 4） | 日志进了 ELK / 公共存储 |
| **Actuator 独立端口** | ✅ 已做（仅 prod profile，默认 9090 + 127.0.0.1，可通过 `MB_MANAGEMENT_PORT` / `MB_MANAGEMENT_ADDRESS` 覆盖）| 验证 nginx / K8s Service 没暴露 9090；Prometheus scrape target 指向 9090 | — |
| **Flyway SQL 审计** | 本地 review 即可 | 每次 migration 前，DBA / 有 DBA 经验的人过一遍索引 / FK / NOT NULL；本 checklist 更新"上线前跑过的 migration 清单" | 生产故障追溯发现 DDL 误操作 |
| **生产环境 env 覆盖** | `.env.example` 仅示例 | 生产实际的 `MB_SA_TOKEN_JWT_SECRET` / DB 密码 / 邮件 / 微信配置通过 K8s Secret 或 CI/CD Variable 注入，**绝不写进 image** | — |

---

## 2. 性能 / 容量（有数据再决策）

| 项 | 当前状态 | 触发条件 | 建议方案 |
|---|---|---|---|
| **权限缓存** | 关闭（每次鉴权查 DB 三表 JOIN） | 鉴权 QPS > 100/s 或 PG 连接池占用率持续 > 70% | 走新 ADR，当时重新评估 Redis vs Caffeine + 失效策略（TTL vs 事件驱动）|
| **虚拟线程 + JDK 升级** | JDK 21 + 传统线程池 | 长耗时阻塞 I/O（海外 PDF / 对账 / 第三方 SDK）出现，`mbAsyncExecutor` 队列经常 > 50 | 走新 ADR（不要再把 ADR-0021 作为起点，从当时的真实瓶颈推导）|
| **通知 Dispatcher 异步解耦 / Outbox** | 同步 `allOf().join()` + DeliveryLog 落库 | 通知量日均 > 1 万 或 需要"跨 JVM 重试 / 投递审计"能力 | 走新 ADR，DeliveryLog 表已预留为 Outbox 演进基础 |
| **FK cascade / 权限一致性** | FK ON DELETE CASCADE 保留；缓存关闭 | 真的加了权限缓存后，发现 cascade 会绕过应用层失效机制 | 走新 ADR，参考 ADR-0022 被撤销的方案（但要先在当下通过"是不是"自检）|
| **限流策略** | Bucket4j 全局 + 每 IP / 每用户 QPS | 遇到真实爬虫 / DDoS | 提升到 Redis 分布式限流 + 接入云厂商 WAF |
| **数据库连接池** | HikariCP max=10 | 连接池耗尽日志 / 并发不够 | 按 DB instance 规格调整（一般是 `vCPU * 2`）|

---

## 3. 可观测性（强烈建议落地）

| 项 | 当前状态 | 上生产前动作 |
|---|---|---|
| **日志聚合（ELK / Loki）** | 本地 Logback JSON encoder，未接聚合 | 接入 ELK / Grafana Loki；`traceId` 字段已预留 |
| **Metrics 抓取（Prometheus）** | Actuator 暴露 `/prometheus` 端点 | Prometheus scrape target 指向 9090；配 Grafana 看板（接口 QPS / P95 / 错误率 / JVM / HikariCP / mbAsyncExecutor 队列深度）|
| **分布式追踪（OpenTelemetry）** | `traceId` 通过 `TraceIdFilter` + MDC 传播；DeliveryLog 已落 `trace_id` | 接入 OTel Collector → Tempo / Jaeger；现有 `traceId` 字段自动复用 |
| **告警规则** | 无 | 至少配：5xx > 1%、P95 > 500ms、mbAsyncExecutor 队列 > 100、HikariCP active > 80%、DB 慢查询、jOOQ slow-query-threshold 触发次数 |
| **审计日志** | `mb_operation_log` 已落表 | 接入日志聚合后，按 `operator / ip / action` 建专用索引 |
| **DeliveryLog 可查** | 已落表 | 管理后台加"通知投递日志"页面：按 `business_type / event_type / status` 查询 + 按 `trace_id` 关联 |

---

## 4. 高可用 / 故障处理

| 项 | 当前状态 | 上生产前动作 |
|---|---|---|
| **多实例部署** | 文档支持（ShedLock / Redis 限流 / 共享文件存储） | 实际多实例前：验证 SSE 在多实例下行为（每实例独立连接）、`mb_notification_delivery_log` 无主从冲突、`SseHeartbeatScheduler` 豁免 ShedLock 是否合理 |
| **DB 主备切换** | 单实例 | 接管理 PG（RDS / Aurora）+ 验证连接漂移后应用自动重连（HikariCP `validationTimeout` + 重试）|
| **Redis 故障降级** | Sa-Token / rate-limit 依赖 Redis，无降级 | 评估：Redis 故障时鉴权 / 限流的回退策略（严格拒绝 or 放行）|
| **文件存储** | 本地磁盘 `/var/lib/meta-build/files` | 多实例前切对象存储（阿里云 OSS / AWS S3）|

---

## 5. 发布流程

| 项 | 上线前动作 |
|---|---|
| **Flyway migration 回滚脚本** | 每个上生产的 migration 准备一份手工回滚 SQL（或 `DROP` + 重新跑的命令）|
| **蓝绿 / 金丝雀** | 至少灰度 10% 流量跑 24h |
| **回滚演练** | 生产上线前在 staging 环境演练"回滚到上个版本"至少 1 次 |
| **告警演练** | 人工触发一次 5xx / 慢查询，验证告警真能到值班人员手里 |

---

## 6. 已知推迟到 v1.5+ 的大块

- **Spec 引擎**（AI 自动生成骨架，见 CLAUDE.md §终极目标）
- **Spring Modulith / DDD 严格化**
- **多租户路由**（v1 有 tenant_id 字段预留，但不做完整租户隔离）
- **消息队列（Kafka / RabbitMQ）**
- **微服务化拆分**
- **分布式事务**（Seata / TCC）

---

## 维护约定

- 每次 v1 milestone 结束时 review 本 checklist 所有项的状态
- 某项触发条件成立时：登记发生日期 + 数据 + 新 ADR 编号
- 上生产后本文件改名 `v1-prod-postmortem.md` 记录实际踩坑 vs 预期
- 本文件本身也是"过度工程化"的校准：若 v1 上线后某些项半年都没触发，说明当初推迟决策是对的；若多次触发，反思"是不是"当时是否问得不够
