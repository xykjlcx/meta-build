# nxboot 系统性演进规划（v2）

## Context

nxboot 的目标定位是"AI 时代的 RuoYi Plus"——不是给人类抄的模板，而是给 AI Agent 执行的契约。核心价值 = 稳固的底座 + AI 可执行的模式 + 自动化的验证闭环。

本规划基于 12 轮对话的深度讨论 + 两次代码审计 + 一次 Plan agent 交叉验证。之前的版本（v1）存在三个严重缺陷：
1. **基于错误的现状假设**：以为前端是 Ant Design 6，实际上已经迁到 Radix UI + Tailwind + shadcn，且迁移未完成
2. **CLAUDE.md 与代码严重脱节**：文档声称有 7 个 `shared/components`（NxTable/NxDrawer/NxForm 等），但磁盘上该目录为空，通用组件实际在 `client/src/components/` 且是 shadcn 风格
3. **时间估算系统性偏乐观**：Spec 引擎 MVP 的真实工作量是规划的 1.5-2 倍
4. **架构三层模型有漏洞**："AI 不碰底座"做不到——安全/限流类诉求必然要改 framework

v2 基于修正后的现状重新组织，并加入 Plan agent 发现的多个高价值维度。

---

## 现状关键发现（基于实地代码审计）

### 技术栈真相
- **后端**：JDK 21 + Spring Boot 3.4.4 + jOOQ 3.19 + PostgreSQL 16 + Flyway 29 个迁移 + Redis + JJWT，`version: 1.0.0-SNAPSHOT`
- **前端**：React 18 + TypeScript strict + Vite 6 + **Radix UI + Tailwind 4 + shadcn 风格**（不是 antd）+ TanStack Query + Zustand + Biome + Vitest + MSW
- **最新 tag**：v0.9.0，尚未正式发布 1.0

### 文档-代码的严重 drift
- `CLAUDE.md:56-67` 描述 7 个 `shared/components`，**磁盘实际是空目录**
- `CLAUDE.md` 描述的前端技术栈与实际不符，AI 按照 CLAUDE.md 生成代码会在 `import { NxTable } from '@/shared/components/NxTable'` 当场编译失败
- `docs/superpowers/specs/2026-04-03-nxboot-final-evolution-spec.md` 明确写了"不做代码生成器"，与当前规划冲突
- 存在未完成的 antd→shadcn 迁移（context-handoff 文档显示被 token 上限打断）

### 基础设施现状
- **CI**：仅 1 个 `ci.yml`（编译+测试+coverage 上传），无 release workflow，无 Dependabot
- **扩展点**：已有三个机制但**各自为政**——`@JobHandler` 白名单、`OAuth2ProviderRegistry`、`FileStorage` 接口，无统一 SPI
- **测试基础设施**：`BaseIntegrationTest`（Testcontainers 单例 + 事务回滚）+ `TestHelper`（mockLoginUser / adminToken），前端有 MSW setup 但只有 1 个测试用例
- **Flyway**：V1-V29 完整链路，包括 `init_data` + `init_dept_data` + `backfill_role_menu_ancestors`
- **已有的未被充分利用的资产**：`docs/reviews/` 下 20 份 codex review，`SmokeTest.java` 已存在但未入 release gate，`REVIEW_PROTOCOL.md` 红蓝演练流程可升格为 AI 契约一部分

### 四个架构问题（已确认）
1. `RoleService` 直接注入 `DSLContext` 并写 SQL，jOOQ 泄漏到 Service 层
2. `RoleService` 直接依赖 `MenuRepository`，跨领域边界被穿透
3. `DataScope` 是 opt-in 模式（ThreadLocal AOP + 手动 `@DataScope` 注解），忘贴即数据泄漏
4. 缓存 `@CacheEvict(allEntries = true)` 全量失效过于激进

---

## 架构分层模型修正

v1 的"底座 / 模式 / 验证"三层模型有漏洞——"AI 不碰底座"做不到。修正为：

| 层 | 类型 | 修改规则 |
|----|------|---------|
| **底座层** (Foundation) | 框架级代码 `nxboot-framework/*` | AI 可改，但 PR 必须伴随 ADR + ArchUnit 规则更新 |
| **模式层** (Pattern) | 领域级代码 `nxboot-system/*/*` | AI 按 Spec 生成，必须通过 Spec-Code 一致性检查 |
| **验证层** (Verification) | 跨层约束 | ArchUnit + 权限扫描 + Spec-Code checker + 性能基线 |

---

## 新的 Milestone 路线（含"下班信号"）

### M0：底座加固 + 文档-代码一致性审计（5-8 天）

**内容：**
- 修复 4 个架构问题：
  - `jOOQ` 收到 Repository 层内，Service 层禁止 `import org.jooq.*`（ArchUnit 会在 M1 固化）
  - 跨领域访问走 Service 不走 Repository（改 `RoleService → MenuService`）
  - `DataScope` 反转：`BaseRepository` 或 jOOQ `VisitListener` 默认注入条件，白名单 `@BypassDataScope` 跳过
  - 缓存改 key 级失效，有意识的级联
- 可观测性基础：
  - Spring Boot Actuator + Micrometer
  - `server.shutdown=graceful`
  - HikariCP metrics 接 Actuator
  - Logback JSON 编码器（生产 profile），加入 `traceId` MDC
  - 慢查询 dashboard（`SlowQueryListener` 已有，只需对外暴露指标）
- 容器化：
  - 多阶段 Dockerfile（`eclipse-temurin:21-jre-alpine` base）
  - docker-compose 扩展：加上应用服务
- 代码质量守护：
  - SpotBugs + FindSecBugs Maven 插件
  - `.env.example` 完整化（所有环境变量 + 注释 + 示例值）
- **JVM 基线决策**：virtual threads / ZGC 是否启用（写入 ADR）
- **jOOQ codegen 决策**：generated 代码是 check-in 还是 CI 阶段生成？（影响 Spec 引擎的可行性，必须在 M0 决定）
- **Testcontainers reuse** 策略（避免 CI 上每个测试类重启容器）

**下班信号：** 空目录 clone 之后，`docker compose up -d && mvn verify && cd client && pnpm test` 一条命令链跑通，无需手动配置任何环境变量（除了 JWT secret）。

**预计工作量：** 5-8 天

---

### M0.5：前端栈收敛 + CLAUDE.md 校准（2-3 天，阻塞 M1/M2/M3）

**这是整个规划的关键前置步骤。** 不做这一步，后续所有的 AI 契约都在基于错误前提。

**内容：**
- 决策：前端最终栈选择（shadcn/Radix + Tailwind 路线 vs 回退 antd）
- 完成未完成的 antd → shadcn 迁移收尾（或反之）
- CLAUDE.md 校准：
  - 前端章节按真实代码重写
  - 共享组件章节：要么补齐 `shared/components`，要么改成"通用组件在 `src/components/`"并列出真实清单
  - 移除所有与代码不符的描述
- 选定一个 **canonical reference feature**（user 模块最完整），作为 AI 学习的标准样本
- 明确前端"模式层"的目标形态：AI 生成新模块应该 import 哪些包、遵循什么命名

**下班信号：** CLAUDE.md 中的每一个代码引用都能在仓库里找到对应实体；把 CLAUDE.md 扔给一个干净的 AI Agent，它能根据文档写出编译通过的代码。

**预计工作量：** 2-3 天

---

### M1：AI 契约基础 + ArchUnit + ADR（5-7 天）

**内容：**
- **ArchUnit 5-8 条核心规则**：
  - `Service` 不 import `org.jooq.*`
  - `Controller` 不注入 `Repository`
  - 模块依赖方向 `admin → system → framework → common` 单向
  - Repository 仅被同领域 Service 访问
  - 公共 API 包的稳定性约束
- **权限覆盖率检查**：JUnit 反射扫描所有 `@RestController` 方法，必须有 `@PreAuthorize`；**扩展到 WebSocket handler / @Scheduled**（v1 遗漏项）
- **ADR 目录建立**（`docs/adr/`），每个决策一份文件：
  - ADR-001: 为什么用 jOOQ 不用 JPA
  - ADR-002: JDK Record over Lombok
  - ADR-003: jOOQ 收敛到 Repository 层
  - ADR-004: DataScope 反转（opt-out）
  - ADR-005: 缓存 key 级失效策略
  - ADR-006: 前端栈决策（shadcn vs antd）
  - ADR-007: 多租户预留字段（tenant_id 列，默认 0）
  - ADR-008: 时区和时间类型处理策略
  - ADR-009: 错误码体系
  - 每条 ArchUnit 规则在注释里反向指向 ADR id
- **CLAUDE.md 的"可执行契约"重构**：
  - 明确 MUST / MUST NOT / SHOULD 措辞
  - 能用 ArchUnit 表达的约束不用文字
  - 加入 `<!-- verify: <command> -->` 注释块（能被 tooling 抽出来跑）
- **AGENTS.md 与 CLAUDE.md 职责划分**：
  - AGENTS.md：快速定位入口（< 200 行）
  - CLAUDE.md：契约全文
- **GitHub 自动化**：release workflow（基于 tag 触发）、Dependabot、conventional-changelog
- **docs/reviews/ 产业化**（高 ROI 低成本）：
  - 整理 20 份 codex review 为"AI 常犯错 Top 20"
  - 反哺 CLAUDE.md 的"反面教材"章节

**下班信号：** 故意在某个 Controller 新方法忘加 `@PreAuthorize` 并 push，CI 自动红并精确指出缺失位置。

**预计工作量：** 5-7 天

---

### M2：前端模式层定型 + 共享组件补完（7-10 天，可与 M1 并行）

**内容：**
- 基于 M0.5 的栈决策，补完或重写共享组件：
  - 数据表格（NxTable 或 DataTable，封装 TanStack Table）
  - 搜索栏（SearchBar）
  - 操作栏（ActionBar）
  - 抽屉（Drawer，封装 Sheet）
  - 确认对话框（ConfirmDialog）
  - 上传组件（Upload）
  - **NxForm schema-driven 表单**:从后端 `Command` Record 的 JSR-303 注解反射生成 schema（v1 严重遗漏项，是 AI 减少手写的核心点）
- 每个组件配备 Vitest + RTL 测试
- **Storybook 评估并决策**（visual regression 入口，对 AI 生成的 UI 验证是必要的）
- **退出行为一致性约定**（Esc、遮罩点击、未保存 confirm）通过组件封装统一
- **字段级权限扩展**：usePerm 增加 `canViewField('user.phone')` 能力

**下班信号：** 一个 feature 模块的前端代码只 `import` from `@/shared/*` 或等价物，且能通过一次 `tsc --noEmit` 和 `pnpm test`。

**预计工作量：** 7-10 天

---

### M3：Spec 引擎最小闭环（5-7 天）

**关键调整：** 放弃 v1 的"全链路生成"野心，改为"**手脚架 + checker**"模式——Spec 先生成 DB 层（SQL + 菜单 + 权限注入），Java/TS 代码骨架生成放到 M3.5/M3.6。

**内容：**
- YAML Spec schema 设计（含 JSON Schema for IDE 补全）
- Spec Lint：命名规范、字段重名、外键存在性、权限命名规范
- Spec 引擎最小闭环只做：
  - 生成 Flyway V 脚本（表定义 + 索引）
  - 生成菜单 upsert 脚本（插入 `sys_menu` + 权限码）
  - 生成角色授权脚本（admin 和 default role 自动授权）
- **自动版本号分配**（日期+hash，避免并发分支冲突）
- **i18n 同步**：Spec 里的 label 同步追加到 `messages_zh_CN.properties` 和前端 `locales/zh-CN.ts`
- **Spec 引擎自举**（高 ROI）：第一个 Spec 是 `spec-of-spec.yaml`，用来生成 Spec 的 JSON Schema + 文档
- **idempotency**：第二次跑同一个 Spec 合理行为
- **dry-run 模式**
- **模块删除机制**（删除 Spec 时清理对应代码/菜单/权限，避免仓库脏化）
- **GENERATED 标记**：所有生成文件头部写 `// GENERATED by nxboot-codegen; regions marked @preserve will survive regen`

**下班信号：** 写一份 `notice.module.yaml`，运行 `nxboot spec apply notice`，数据库有表、sys_menu 有菜单、admin 能登录后看到新菜单（但点进去是 404，因为还没生成 Java/TS 代码）。

**预计工作量：** 5-7 天

---

### M3.5：Spec 引擎代码骨架 - Java 五件套(3-5 天）

**内容：**
- 基于已有的 canonical reference feature 抽模板
- 生成 `VO / Command / Controller / Service / Repository` 骨架
- 处理 **jOOQ codegen 串行链**：Flyway migrate → jOOQ codegen → 生成 Java 代码（顺序不能错，否则 import 一个不存在的类）
- 扩展点桩（`@extension` 标记 + TODO 骨架）
- 自动生成集成测试骨架（复用 `BaseIntegrationTest` + `TestHelper`）

**下班信号：** `nxboot spec apply notice` 跑完后，`mvn verify` 通过（包括自动生成的集成测试）。

**预计工作量：** 3-5 天

---

### M3.6：Spec 引擎代码骨架 - TS 五件套（3-5 天）

**内容：**
- 生成 `types.ts / api.ts / columns.tsx / XxxList.tsx / XxxForm.tsx` 骨架
- 前端 i18n 同步
- 路由动态注入（如果走静态路由）或菜单数据驱动（如果走动态菜单）
- 从后端 `Command` Record 反射生成 form schema（与 M2 的 NxForm 对齐）

**下班信号：** `nxboot spec apply notice && pnpm dev`，浏览器能看到新模块的列表页，能增删改查。

**预计工作量：** 3-5 天

---

### M4：Spec 引擎增强（7-10 天）

**内容：**
- **主从表**（master-detail）：Order + OrderItem，生成事务保存 + 级联删除 + 前端可编辑明细表格
- **引用关系**（reference）：外键 + JOIN + 前端下拉选择器
- **状态机**（enum + transitions）：生成 `OrderStatusMachine` + 状态流转校验 + 前端状态按钮动态显示
- **ApplicationService 编排层骨架**：Spec 声明 `type: application-service`，生成依赖注入和方法签名骨架，方法体留 TODO 给 AI
- **Spec 版本演进**：新增字段的 diff 工具，提示手动加哪些代码
- **扩展点契约版本号**：service-hook 接口变更的兼容性管理

**下班信号：** 用一份包含主从表 + 状态机 + 引用 + 扩展点的 Spec 跑全链路，生成的代码通过所有验证。

**预计工作量：** 7-10 天

---

### M5：验证层完整版 + 性能基线 + E2E（8-12 天）

**内容：**
- **Spec-Code 一致性检查**（双轨方案）：
  - JavaParser 扫 Java 源码：Spec 字段 ⊆ Record 字段（单向包含，MVP 够用）
  - ClassGraph 扫字节码：`@PreAuthorize` 覆盖率
  - ts-morph 扫 TS 源码：前端 types 一致性
  - **菜单一致性**：Spec 声明的模块必须在 `sys_menu` 有对应行（集成测试形态）
- **覆盖率门槛**：不允许倒退，通过 JaCoCo + Vitest coverage report diff
- **E2E 测试骨架**：Playwright 已集成但未用，补一条登录 → 用户 CRUD → 退出的流程
- **性能基线**：
  - N+1 检测（基于 request-scoped SQL 计数器 + jOOQ ExecuteListener）
  - 慢查询阈值（500ms，已有 SlowQueryListener）
  - baseline.json 存到 `docs/benchmarks/`
- **API 契约回归**：`openapi-diff` CI job，检测 path 删除/返回结构破坏
- **前端可访问性基线**：axe-core 集成到 Vitest 或 Playwright
- **Secret 扫描**：gitleaks 或 trufflehog 加入 CI
- **依赖安全扫描**：OWASP dependency-check

**下班信号：** 故意让 Spec 和代码 drift（Spec 加字段但代码没加），5 秒内 checker 报错并给出精确行号。

**预计工作量：** 8-12 天

---

### M6：开源准备（3-5 天，部分内容前期增量做）

**内容：**
- LICENSE / ISSUE_TEMPLATE / PULL_REQUEST_TEMPLATE / Code of Conduct（ISSUE_TEMPLATE 现有 bug_report 和 feature_request，需完善）
- **AI-readable machine index**（`.nxboot/index.json`）：列出所有模块、权限点、Spec、ADR，AI 首次读取即可定位
- **示例 Prompt 库**（`docs/prompts/`）：新增模块 prompt、加字段 prompt、重构 prompt
- **Demo 数据集**：Flyway 里没有 demo data，新人 clone 后看到空壳（RuoYi 的巨大优势是开箱有数据）
- Quickstart 视频 + 官网
- **Windows 开发者支持文档**（Flyway locations 路径兼容性）
- 中英文双语文档（至少 README + Quickstart）
- 贡献者指南细化

**下班信号：** 一个完全陌生的开发者从 README 开始，在 15 分钟内看到本地登录页并完成第一次 `nxboot spec apply`。

**预计工作量：** 3-5 天

---

### M7：行业 Spec 库（长期，开源后社区驱动）

**内容：**
- 电商、物流、CRM 的 Module Spec 模板
- Spec 市场 / 认证机制
- Spec 的许可证决策（MIT 代码 vs Apache spec）

---

## 完全新加的维度（Plan agent 发现的盲点）

以下维度在 v1 规划中完全缺失，已分散到各 Milestone，但单独列出确保不遗漏：

| 维度 | 归属 | 备注 |
|------|------|------|
| **多租户预留字段** | M1 ADR-007 | 所有 `sys_*` 表预留 `tenant_id BIGINT NOT NULL DEFAULT 0`，补做代价极大 |
| **时区和时间类型** | M1 ADR-008 | LocalDateTime / Instant / OffsetDateTime 明确规约，避免跨时区坑 |
| **API 向后兼容** | M5 | OpenAPI diff + `@Deprecated` 生命周期承诺 |
| **前端类型从 OpenAPI 生成** | M5 | 替代现有的手动前后端对称（规模大了必漂移） |
| **数据库 schema 演进安全网** | M4 | 大表加列的 zero-downtime、drop column 的 two-phase、CONCURRENTLY 索引规约 |
| **审计防篡改** | M5 | 哈希链 或 append-only 表 |
| **PII 脱敏自动化** | M4 | Spec 的 `sensitive: true` 字段自动脱敏 |
| **AI 生成代码的安全审查** | M0/M5 | SAST (FindSecBugs)、secret 扫描 (gitleaks)、依赖扫描 (OWASP) |
| **冒烟测试升格为 release gate** | M5 | `SmokeTest.java` 已存在，未入 gate |
| **运行时配置热更新** | M1 ADR | 哪些配置能热更 / 哪些必须重启 |
| **灾备参考实现** | M6 | `docs/ops/backup.md` + pg_dump cron 示例 |
| **spec-of-spec 自举** | M3 | 用 Spec 引擎生成自己的 meta schema，经典 self-hosting |
| **"下班信号"机制** | 每个 M | 定义"能看到什么现象就算结束"，避免无限打磨 |

---

## 时间总览

| Milestone | 内容 | 工作量 | 可并行 |
|-----------|------|--------|--------|
| M0 | 底座加固 + 可观测性 | 5-8 天 | - |
| M0.5 | 前端栈收敛 + 文档校准 | 2-3 天 | 阻塞 M1/M2/M3 |
| M1 | AI 契约 + ArchUnit + ADR | 5-7 天 | 与 M2 并行 |
| M2 | 前端共享组件 + NxForm | 7-10 天 | 与 M1 并行 |
| M3 | Spec 引擎最小闭环（DB 层） | 5-7 天 | - |
| M3.5 | Spec 引擎 Java 五件套 | 3-5 天 | - |
| M3.6 | Spec 引擎 TS 五件套 | 3-5 天 | 可与 M3.5 并行 |
| M4 | Spec 引擎增强 | 7-10 天 | - |
| M5 | 验证层 + 性能基线 + E2E | 8-12 天 | - |
| M6 | 开源准备 | 3-5 天 | 部分内容前期增量做 |
| M7 | 行业 Spec 库 | 长期 | 开源后社区驱动 |

**总计（M0-M6）：48-72 天**（v1 估算 35-51 天，膨胀 40%，但每一步可交付且不相互阻塞）

---

## 三大风险与对冲

### 风险 1（最脆弱）：M3 Spec 引擎

**失败模式：**
- 最可能：7 天到期只做出"5 个 Spec → 5 个 Java 文件"的玩具，没接通菜单/权限/i18n，demo 跑通但没人用
- 次可能：做得太全，第一次跑通但第二次冲突

**对冲策略：**
- 放弃"全链路生成"，改为"骨架 + checker"
- 第一版 Spec schema 让 AI 自己从 user 模块反推，再验证能否回推出 user 模块（自验证成本低）
- MVP 只做 DB 层（M3），Java/TS 代码分到 M3.5/M3.6，每一步下班信号清晰

### 风险 2：CLAUDE.md 契约公信力

**失败模式：**
- 如果 M0.5 不先做，后续所有 AI 契约文档继续跟代码对不上，AI 会学会"以代码为准，不信契约"，之后再写任何契约都失去意义

**对冲策略：**
- M0.5 是阻塞项，不能跳过
- 建立 CLAUDE.md 的"可执行验证"机制（`<!-- verify: command -->`）

### 风险 3：前端迁移半成品

**失败模式：**
- 前端当前处于 antd→shadcn 迁移中途（60-80%）
- M2 以为是"补几个组件"，实际是"完成一次技术栈迁移"
- 工作量被低估 3 倍

**对冲策略：**
- M0.5 必须决策最终栈并完成迁移
- 在 M0.5 就明确"canonical reference feature"，作为 AI 和后续开发的标准样本

---

## 关键文件（实施时会修改或新建）

### 需要修改
- `CLAUDE.md` — M0.5 重写前端章节，M1 重构为可执行契约
- `server/nxboot-framework/src/main/java/com/nxboot/framework/security/DataScopeContext.java` — M0 DataScope 反转入口
- `server/nxboot-framework/src/main/java/com/nxboot/framework/jooq/JooqHelper.java` — M3 Spec 引擎的依赖点
- `server/nxboot-system/src/main/java/com/nxboot/system/role/service/RoleService.java` — M0 jOOQ 收敛 + 跨领域解耦
- `.github/workflows/ci.yml` — M0/M1 加 ArchUnit + SpotBugs + 权限覆盖率 + Secret 扫描
- `.env.example` — M0 完整化

### 需要新建
- `docs/adr/` — M1 架构决策记录目录
- `docs/prompts/` — M6 AI 示例 prompt 库
- `docs/benchmarks/baseline.json` — M5 性能基线
- `.nxboot/index.json` — M6 AI 机器可读索引
- `specs/` — M3 Spec 存放目录
- `server/nxboot-framework/src/test/java/com/nxboot/framework/archunit/` — M1 ArchUnit 测试
- `Dockerfile` — M0 应用镜像构建
- `client/src/shared/components/` — M2 补完（或决定不用这个目录）
- 模块生成器工具（CLI）— M3，工具栈待定（Java 好处：和 jOOQ codegen 同链；Node 好处：和前端生成方便）

### 需要 supersede
- `docs/superpowers/specs/2026-04-03-nxboot-final-evolution-spec.md` — 该文档明确写了"不做代码生成器"，与当前规划冲突，需在 `docs/adr/` 中明确 supersede 关系

---

## 验证方案

### 整体规划的验证
每个 Milestone 都有明确的"下班信号"（见上文），以可观察的现象为准，不以"全部完成"为准。

### 关键动作的端到端验证
1. **M0 底座加固** → `docker compose up -d && mvn verify && cd client && pnpm test` 在空 clone 仓库上一条龙通过
2. **M0.5 文档校准** → 把 CLAUDE.md 扔给一个干净的 Claude Code 会话，让它生成一个新模块的代码骨架，不出现任何编译错误
3. **M1 AI 契约** → 故意违反 ArchUnit 规则 push，CI 红
4. **M2 共享组件** → 新 feature 模块只 import 共享层
5. **M3-M3.6 Spec 引擎全链路** → `nxboot spec apply notice && mvn verify && pnpm test && pnpm dev`，浏览器能进入新模块的 CRUD
6. **M4 Spec 增强** → 一份复杂 Spec（含主从表+状态机+引用）全链路通过
7. **M5 验证层** → 故意 drift，checker 5 秒内报错
8. **M6 开源** → 陌生开发者 15 分钟从 README 到本地 demo

---

## 关键决策点（需要用户确认）

在开始执行前，以下决策必须先拍板：

1. **前端栈收敛方向**：继续 shadcn/Radix/Tailwind 路线，还是回退到 antd？（这决定了 M0.5 和 M2 的所有工作内容）
2. **Spec 引擎 MVP 策略**：采纳"手脚架 + checker"的保守方案，还是坚持 v1 的"全链路生成"？（这决定了 M3 的成败概率）
3. **时间预算**：48-72 天的总工作量是否可接受？如果不接受，哪些 Milestone 可以推迟或删除？
4. **supersede 历史文档**：`final-evolution-spec.md` 明确写了"不做代码生成器"，现在是否正式 supersede？
