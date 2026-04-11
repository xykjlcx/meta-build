# ADR-0003: 翻转决策 8 — 移除 Spring Modulith，改为 Maven 模块隔离 + ArchUnit 双保险

- **状态**: 已采纳
- **日期**: 2026-04-11
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: `meta-build规划_v1_最终对齐.md`（决策 8）、`docs/specs/backend/`（原 `docs/specs/backend-architecture.md` 已拆分）
- **覆盖关系**: 本 ADR 是对规划文档决策 8 的**翻转**——从"Spring Modulith + ArchUnit 双保险"改为"Maven 模块隔离 + ArchUnit 双保险"。规划文档原文保留不动，后续所有文档和代码以本 ADR 为准。

> **注**：本 ADR 写于 backend-architecture.md 拆分前。文中所有对 `backend-architecture.md §x.y` 的引用，现统一指向 `docs/specs/backend/` 子目录的对应文件，导航见 [backend/README.md](../specs/backend/README.md)。

---

## 背景

规划文档决策 8 定义：

> **后端模块化**: Spring Modulith 1.4.x + ArchUnit 双保险
> - Spring Modulith 提供官方约定：模块识别、@ApplicationModuleTest 模块测试隔离、Documenter 自动生成依赖图
> - ArchUnit 提供自定义规则：jOOQ 不入 Service、Controller 不注入 Repository、跨领域走对方 Service 等
> - 两者职责互补，Modulith 管"模块边界"，ArchUnit 管"代码细节"

在写 `backend-architecture.md` 过程中，这个决策连续暴露出两个问题：

### 问题 1：Spring Modulith 主包位置的架构敏感性

Spring Modulith 的模块识别规则是"主类所在包的**直接子包** = Application Module"。这意味着主类位置直接决定整个 Modulith 扫描行为：

- 如果主类在 `com.metabuild.admin`，Modulith 只会扫描 `com.metabuild.admin.*` 的直接子包——但业务模块在 `com.metabuild.platform.*`，Modulith 根本识别不到
- 如果主类在 `com.metabuild.platform`，只能识别 platform 下的业务模块——但未来要加 `com.metabuild.order` / `com.metabuild.billing` 等业务域时，这些都在 platform 之外，Modulith 扫不到
- 如果主类在 `com.metabuild`，会把 `common / infra / admin / platform` 都识别为"模块"——需要 `@Modulithic(sharedModules)` + 白名单机制勉强绕过

三种方案都有问题。为了适配 Modulith 的默认约定，我们必须选择：**要么扁平化 Java 包（丢失 platform/business 分层命名），要么写复杂的 `@Modulithic` 配置**。这和洋哥的直觉"命名应该表达层级"产生根本性张力。

### 问题 2：对 ROI 的系统评估

针对上述问题，我们系统评估了 Spring Modulith 在 meta-build 项目中的实际收益 vs 成本：

**Modulith 的收益清单**（7 项）：
1. 模块边界验证 `verify()`
2. 循环依赖检测
3. API 暴露约定 `@NamedInterface`
4. 模块隔离测试 `@ApplicationModuleTest`
5. 事件机制 `@ApplicationModuleListener`
6. 自动模块图 `Documenter`
7. 共享模块声明 `@Modulithic(sharedModules)`

**ArchUnit + Maven + Spring 原生机制能替代多少**：

| 能力 | 替代方案 | 替代质量 |
|------|---------|--------|
| 模块边界验证 | Maven pom 依赖隔离 + ArchUnit `slices()` | ✅ 等同 |
| 循环依赖检测 | ArchUnit 内置 `slices().should().beFreeOfCycles()` | ✅ 等同 |
| API 暴露约定 | 包命名约定（`api/` 子包）+ ArchUnit 规则 | ✅ 等同 |
| 模块隔离测试 | Spring 原生切片测试（`@WebMvcTest` / `@DataJpaTest`）| ⚠️ 略繁琐 |
| 事件机制 | `@EventListener` + `@Async` + `@TransactionalEventListener` | ⚠️ 多 2 行注解 |
| 自动模块图 | 手写 mermaid 图 | ⚠️ 失去自动化 |
| 共享模块声明 | Maven 依赖自然解决 | ✅ 等同（更简单） |

**Modulith 独特且不可替代的价值 ≈ 0**。它提供的是"语法糖"和"官方背书"，而不是新能力。

---

## 决策

**移除 Spring Modulith，将决策 8 修订为：**

> **后端模块化**: Maven 模块隔离 + ArchUnit 双保险
> - **Maven 层（pom 级硬隔离）**: 业务模块之间默认禁止互相依赖，跨模块访问必须在 pom.xml 里显式添加依赖声明（pom 层白名单，PR review 时可见）
> - **ArchUnit 层（包级细约束）**: 即使 pom 依赖允许，跨模块仍然只能 import 对方的 `api` 子包，禁止 import `domain` / `infrastructure` 包
> - **循环依赖检测**: ArchUnit `slices().should().beFreeOfCycles()`
> - **事件通信**: Spring 原生 `@EventListener` + `@Async` + `@TransactionalEventListener(AFTER_COMMIT)`
> - **模块图文档**: 手写 mermaid 图作为活文档（M4 末出图，之后按需更新）

"双保险"的精神保留——只是从 `Modulith verify() + ArchUnit` 换为 `Maven pom + ArchUnit`，且新组合更硬（pom 级是编译期约束，比运行期 verify 更早拦截）。

### 连带决策

1. **Java 包保留 platform / business 分层命名**：
   - 平台能力：`com.metabuild.platform.iam` / `com.metabuild.platform.audit` / ...
   - 未来业务：`com.metabuild.business.order` / `com.metabuild.business.notice` / ...
   - 不再需要扁平化（这是方案 D 的诉求，随 Modulith 一起撤销）

2. **主类位置**：`com.metabuild.admin.MetaBuildApplication`（和 Maven 模块名对齐）。不再受主包位置约束，Spring Boot `@SpringBootApplication` 的 component scan 可以用 `@ComponentScan(basePackages = "com.metabuild")` 显式指定扫描范围。

3. **模块内部结构不变**：每个业务模块仍然按 `api / domain / infrastructure / web` 四层组织，`api` 子包是对外接口。

4. **ADR-0002 不受影响**：`mb-framework → mb-infra` / `mb-system → mb-platform` 的命名调整继续有效。

---

## 理由的核心：5 条关键判断

### 1. Modulith 独特价值 ≈ 0
7 项能力里，5 项完全可替代（质量等同），2 项有替代方案（质量略降但可接受）。没有一项是"非 Modulith 不可"。

### 2. Modulith 和 meta-build 核心命题冲突
meta-build 的北极星是"**给 AI 执行的契约**"。Modulith 发布于 2022 年，AI 训练数据少；ArchUnit 发布于 2017 年，业界标准，AI 熟悉度高。引入 AI 相对陌生的工具 = 反北极星。

### 3. 文档表达成本巨大
保留 Modulith 需要：整章介绍 Spring Modulith 概念（`@Modulithic` / `NamedInterface` / `ApplicationModuleListener` / `@ApplicationModule` / `sharedModules` / `allowedDependencies`），术语表加 3-5 条。移除后这些全部省略，文档直接用 Maven + ArchUnit 说话。

### 4. 降低主包位置和扩展性风险
Modulith 的主包位置敏感性已经暴露了 3 轮方案讨论（A/B/C/D）。移除后：
- 主类位置不再敏感（`com.metabuild.admin` 或任何位置都行）
- 未来加任何业务域（`com.metabuild.order` / `com.metabuild.billing` / `com.metabuild.ai`）只需加 Maven 模块，无需改任何 Modulith 配置

### 5. 降低版本升级税
Modulith 1.4.x 只支持 Spring Boot 3.5.x，未来升级 Spring Boot 4.0 时必须同步升级 Modulith 2.x，两边都有破坏性变更历史。ArchUnit 独立演进，升级压力小得多。

---

## 成本和风险

### 失去的能力

| 失去 | 影响 | 缓解 |
|------|------|------|
| `@ApplicationModuleTest` 快速模块测试 | 集成测试启动时间略长 | Testcontainers 容器复用已经压到 ~10 秒级，可接受 |
| `Documenter` 自动模块图 | 需要手写 mermaid 图 | v1 阶段 8 个业务模块手写成本低，M4 末一次性出图 |
| 对外宣传"Spring Modulith"的 buzzword | 少一个业界热词 | meta-build 核心卖点是"AI 原生 + 千人千面"，不依赖 Modulith 背书 |
| Modulith 官方背书的"模块化单体"术语 | 营销价值小 | 业界普遍认知 Maven 多模块 + ArchUnit 就是"模块化单体"的经典实现 |

### 新引入的事项

| 事项 | 说明 |
|------|------|
| 事件通信手动组合 | Spring 原生 `@EventListener` + `@Async` + `@TransactionalEventListener(AFTER_COMMIT)` 多 2 行代码，v1 canonical reference 的 approval 模块会用到 |
| 模块图手写维护 | 每加一个业务模块手动更新 `docs/architecture/module-graph.md`，约 5 分钟工作量 |
| Maven pom 白名单管理 | 跨模块依赖在 pom.xml 里显式声明，PR review 时检查（比 Modulith 的 `allowedDependencies` 注解更清晰） |

---

## 与规划文档的关系

**规划文档 `meta-build规划_v1_最终对齐.md` 决策 8 的原文不动**（作为 v1 规划对齐阶段的历史记录保留）。本 ADR 翻转该决策，后续所有文档和代码以本 ADR 为准：

- `docs/specs/backend-architecture.md`（本次修订）
- 未来的 `CLAUDE.md`、`frontend-architecture.md` 等文档
- 未来的 server 端所有代码

规划文档里提到"Spring Modulith"的所有章节，后续文档统一替换为"Maven 模块隔离 + ArchUnit"。

未来如果有人翻规划文档发现决策 8 写的是 Modulith，本 ADR 是权威修订说明。

---

## 对 `backend-architecture.md` 的修订清单

### 删除
- 附录 D 术语表里的 `NamedInterface` / `ApplicationModule` 条目
- 第 11 章测试金字塔里的 `@ApplicationModuleTest` 相关内容（如有）

### 改写
- **第 2 章整章**：原"Spring Modulith 包结构与 verify"改为"**模块边界守护机制**"（内容重写：Maven pom 隔离 + ArchUnit 规则 + Spring 原生事件 + 手写模块图）
- **第 5.2 节**："跨模块走对方 Service" 的修复方案从"Modulith verify + ArchUnit"改为"Maven pom + ArchUnit"
- **第 6 章 ArchUnit 规则集**：补充 `slices().beFreeOfCycles()` 循环依赖检测规则
- **0.2 决策 8 回顾**：改为 "Maven 模块隔离 + ArchUnit 双保险" 并加一行"相对规划文档的修订见 ADR-0003"

### 不变
- 4 层 Maven 模块结构（mb-common / mb-infra / mb-platform / mb-admin）
- 模块内部 `api / domain / infrastructure / web` 四层结构
- Java 包分层命名（`com.metabuild.platform.iam` 等，保留）
- 4 个架构问题的修复方案（5.1 / 5.3 / 5.4 都和 Modulith 无关，保持不变）
- 数据层 / 安全 / 异常 / 可观测性 / 契约驱动 等其他章节

---

## 验证方式

- ✅ `backend-architecture.md` 里不再出现 "Spring Modulith" / `@Modulithic` / `@ApplicationModule` / `NamedInterface` / `@ApplicationModuleListener` / `@ApplicationModuleTest` / `Documenter` 等术语
- ✅ 术语表不再有相关条目
- ✅ 第 2 章的新内容能独立指导 M1 脚手架实施（不需要引用 Modulith 文档）
- ⏳ M1 实施时，`server/pom.xml` 不引入 `spring-modulith-*` 依赖
