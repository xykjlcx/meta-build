# ADR-0002: 后端模块命名调整 framework → infra, system → platform

- **状态**: 已采纳
- **日期**: 2026-04-11
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: `meta-build规划_v1_最终对齐.md`（ground truth）、`docs/specs/backend/`（原 `docs/specs/backend-architecture.md` 已拆分）
- **覆盖关系**: 本 ADR 是对规划文档决策 10 的"命名层"修订，**不改变架构决策本身**

> **注**：本 ADR 写于 backend-architecture.md 拆分前。文中所有对 `backend-architecture.md §x.y` 的引用，现统一指向 `docs/specs/backend/` 子目录的对应文件，导航见 [backend/README.md](../specs/backend/README.md)。

---

## 背景

规划文档 `meta-build规划_v1_最终对齐.md` 决策 10 定义了后端 4 层 Maven 模块命名：

```
mb-common → mb-framework → mb-system → mb-admin
```

这套命名直接继承自 nxboot（nxboot-common / nxboot-framework / nxboot-system / nxboot-admin），是 RuoYi 生态圈的事实标准。

在写 `backend-architecture.md` 时，洋哥提出了一个关键问题：**`mb-framework` 和 `mb-system` 这两个名字是否足够精确，能否让 AI 一眼看懂模块职责**。经过讨论，识别出这两个名字的硬伤：

### framework 的问题

1. **和 Spring Framework 本体冲突**：Spring 的核心库叫 "Spring Framework"，`mb-framework` 会让 AI 误以为这是"另一个框架本体"，而不是"用 Spring 写的基础设施层"
2. **语义不精确**：这一层装的是 security / cache / jooq / rate-limit / observability 等**基础设施能力**，不是"框架"。framework 暗示"提供编程范式"，但实际内容是"提供运行时能力"
3. **行业术语错位**：DDD、Clean Architecture、六边形架构里的标准术语是 "Infrastructure Layer"，framework 不是这一层的标准名字

### system 的问题

1. **太泛**：任何东西都能叫 system，语义为零
2. **行业隐含约定**：在 RuoYi / nxboot 生态里 "system" 特指"用户/角色/菜单管理"的后台功能，但这是圈内隐含知识，外部开发者和 AI 都看不出
3. **和"系统"多义词混淆**：AI 可能误以为是 OS 系统层、`System.out.println` 的 system、或"系统管理"
4. **和数据库前缀 `sys_` 语义重叠**：表命名 `sys_iam_user`，前缀 sys 到底指模块还是指数据库层，不清楚

### 对 AI 契约的影响

meta-build 的核心定位是"**给 AI 执行的契约**"。AI 读 Maven 模块名时只有字面语义可推理，不懂圈内约定。对一个陌生 AI：

| 看到 | `mb-framework` 的反应 | `mb-infra` 的反应 |
|------|---------------------|------------------|
| 第一反应 | "这是某种框架? 要贡献代码到这里?" | "基础设施层，不碰业务逻辑" |

| 看到 | `mb-system` 的反应 | `mb-platform` 的反应 |
|------|-------------------|---------------------|
| 第一反应 | "系统? OS? 管理系统?" | "平台能力，提供给业务用的" |

语义清晰度 > 继承感。

---

## 决策

### 命名调整

| 原 | 新 | 理由 |
|----|----|------|
| `mb-common` | **保持不变** | 含义清晰，零 Spring 工具层用 common 符合惯例 |
| `mb-framework` | **`mb-infra`** | 精确描述"基础设施能力"；对齐 DDD / Clean Architecture 的 Infrastructure Layer 术语；不与 Spring Framework 本体混淆 |
| `mb-system` | **`mb-platform`** | 精确描述"平台业务能力"；和规划文档里"平台业务模块"的措辞一致；区分 platform (稳定能力) vs business (可变业务样本) |
| `mb-admin` | **保持不变** | "admin" 作为 Spring Boot 启动入口的业界约定理解度高 |

### 连带调整

- **Java 包名同步调整**：
  - `com.metabuild.framework.*` → `com.metabuild.infra.*`
  - `com.metabuild.system.*` → `com.metabuild.platform.*`
  - 保持 Maven 模块名与 Java 根包名一致（这是 ArchUnit 规则和 Spring Modulith 识别的基础）
- **子模块命名同步调整**：
  - `framework-security` / `framework-cache` / `framework-jooq` / `framework-exception` / `framework-i18n` / `framework-async` / `framework-rate-limit` / `framework-websocket` / `framework-observability` / `framework-archunit`
  - → `infra-security` / `infra-cache` / `infra-jooq` / `infra-exception` / `infra-i18n` / `infra-async` / `infra-rate-limit` / `infra-websocket` / `infra-observability` / `infra-archunit`
  - `system-iam` / `system-audit` / `system-file` / `system-notification` / `system-dict` / `system-config` / `system-job` / `system-monitor`
  - → `platform-iam` / `platform-audit` / `platform-file` / `platform-notification` / `platform-dict` / `platform-config` / `platform-job` / `platform-monitor`
- **ArchUnit 规则的包匹配同步调整**：
  - `..system.(*)..` → `..platform.(*)..`
  - `..framework..` → `..infra..`

### 拒绝的备选方案

| 备选 | 拒绝理由 |
|------|---------|
| `mb-core` 替换 common | 和 Spring Core 有弱冲突，common 够用 |
| `mb-kernel` 替换 common | 过于"内核"感，common 更朴素合适 |
| `mb-domain` + `mb-infrastructure` + `mb-application` (DDD) | 过于学院派，meta-build 用 Spring Modulith 不走 DDD |
| `mb-biz` 替换 system | 缩写不专业，platform 更清晰 |
| `mb-launcher` 替换 admin | admin 业界理解度更高，不必动 |

---

## 与规划文档的关系

**规划文档 `meta-build规划_v1_最终对齐.md` 的原文不动**，作为 v1 阶段 17 项决策的 ground truth 基线保留。本 ADR 是对决策 10 中命名层的修订，后续所有文档（backend-architecture.md / frontend-architecture.md / CLAUDE.md / 后续 ADR）都以本 ADR 的命名为准。

规划文档里出现的 `mb-framework` / `mb-system` / `framework/` / `system/` 等命名，在后续文档和代码中都替换为 `mb-infra` / `mb-platform` / `infra/` / `platform/`。

未来如果有人翻规划文档发现命名不一致，本 ADR 是权威说明。

---

## 影响范围

### 立即生效的文档

- ✅ `docs/specs/backend-architecture.md`（本次批量替换约 200 处）
- ✅ 本 ADR 自身

### 未来要遵守的文档

- `docs/specs/frontend-architecture.md`（未写，写时遵守）
- `CLAUDE.md`（未写，写时遵守）
- 未来所有后端相关 ADR 和 specs

### 不动的文档

- `meta-build规划_v1_最终对齐.md`（ground truth 保留原文）

### 实施阶段的影响

- M1 脚手架阶段按新命名创建 Maven 模块和 Java 包
- `server/pom.xml`、`infra/pom.xml`、`platform/pom.xml` 等的 artifactId 都用新命名
- ArchUnit 规则代码里的包匹配模式按新命名写
- Spring Modulith 的 `@ApplicationModule` 注解的 `allowedDependencies` 字符串按新命名写

---

## 验证方式

- ✅ `backend-architecture.md` 里不再有 `mb-framework` / `mb-system` / `com.metabuild.framework` / `com.metabuild.system`（除了引用规划文档原名时的必要例外）
- ✅ 本 ADR 在 `docs/adr/` 目录下可被找到
- ⏳ M1 实施时，`server/` 目录下的 Maven 模块名 + Java 包名都是新命名
