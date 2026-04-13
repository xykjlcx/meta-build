# 0412 后端架构文档全面 review 与修复

## 全面交叉 Review
- 4 个 Opus agent 并行审查，按文档组分工（架构骨架 / 数据+安全 / API+配置+可观测 / 规则+全局一致性）
- 每个 agent 从三个维度切入：设计合理性 / 落地可行性 / 逻辑一致性
- 发现 8 Critical + 25 Major + 27 Minor + 16 Suggestion
- 前端会话交叉发现后端 4 个问题（双树 DDL 缺失、AuthController 缺失、AppPermission 链路缺失、权限点格式不一致）
- superpowers:code-reviewer 深度审查又发现 2 Critical + 10 Important

## Critical 修复（8 项）
- C1: 包结构统一为 §4.3（domain/，去掉 infrastructure），回刷 01/03/05/08
- C2: MUST #3 删除 deleted（不做软删除）
- C3: 删除 User.java + PasswordPolicy.java（不引入独立领域对象）
- C4: JooqHelper 保留，conditionalUpdate API 修复（两阶段 builder），batch 标 [M1 验证]
- C5: Sa-Token 配置以 05 为准（JWT + Authorization + MB_JWT_SECRET），修正 09
- C6: 自动解决（C5 确认后 OpenAPI 声明已正确）
- C7: 计数更新为 17 MUST NOT + 15 MUST
- C8: SERVICE_MUST_NOT_USE_JOOQ_DSL 黑名单→白名单 SERVICE_JOOQ_WHITELIST

## 架构决策（本会话新增）
- 表前缀 sys_ → mb_（平台表），业务表保持 biz_
- 审计日志砍掉，替换为操作日志 platform-oplog（@OperationLog 放 Controller 层，不做 before/after 快照）
- version 字段按需添加（不强制所有表），仅并发更新场景
- 全局时间策略：Java 层走 Clock Bean（Instant.now(clock)），SQL 层走 CURRENT_TIMESTAMP，禁止无参调用（ArchUnit NO_DIRECT_TIME_API）
- 权限点格式不限段数，点分隔字符串即可
- AuthFacade 接口放 mb-common.security（依赖反转要求）

## Major 修复（13 项直接修 + 4 项讨论决策）
- @Value 代码示例改为 @ConfigurationProperties（04 IdGeneratorConfig + 05 CorsConfig）
- PageResult 去重（删 06 §3 旧版）
- README ADR 索引补 0008
- @Async 自调用修复（独立 PasswordResetEmailSender Bean）
- GlobalExceptionHandler 补 Sa-Token 异常（NotLoginException→401 等）
- springdoc-openapi-maven-plugin GAV 声明
- packages-to-scan 加 com.metabuild.business
- biz_order_main 建表 SQL 补 owner_dept_id
- spring.factories 改 SpringApplicationBuilder.initializers()
- 3 张核心表 DDL 补充（mb_iam_role / mb_iam_dept / mb_iam_user_role）
- infrastructure 残留全面清理（04/README/appendix）
- 权限点命名规范放松段数限制
- mb.route-tree.path 配置项 + Properties 类补全

## 前端交叉修复（4 项）
- 双树 DDL（mb_iam_route_tree / mb_iam_menu / mb_iam_role_menu）→ 03 §3.0-3.3
- AppPermission 生成链路（OperationCustomizer → x-permission → permissions.ts）→ 06 §13
- AuthController + CurrentUserSnapshot DTO → 05 §8.10
- 权限点格式统一为点分隔（13 处冒号→点号）

## 耗时
- 全面 review：~1.5h（4 agent 并行）
- Critical 修复：~1h
- 前端交叉修复：~30min
- 深度 review + 修复：~1h
- Major 批量修复：~1.5h
- 总计约 5-6h

## 遗留
- ADR-0009~0012 未写（翻转决策先写 ADR 是铁律，本会话违反了）
- CLAUDE.md 最近大修未更新
- verify-docs.sh 未扩展（新关键词未覆盖）
- 前端文档中 sys_ 残留未同步
- 10 项 Major 推迟到 M4（ArchUnit 规则体系补全、断链修复、DataScopeVisitListener spike 等）
