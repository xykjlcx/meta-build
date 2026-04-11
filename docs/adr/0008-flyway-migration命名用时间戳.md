# ADR-0008: Flyway migration 命名从数字分段切换到时间戳

- **状态**: 已采纳
- **日期**: 2026-04-11
- **决策者**: 洋哥 + 小灵犀
- **相关文档**: [`docs/specs/backend/04-data-persistence.md §5 Flyway 脚本组织`](../specs/backend/04-data-persistence.md#5-flyway-脚本组织-m1m4)、ADR-0007（元方法论的第二次应用样本）
- **类型**: 具体技术决策（兼 ADR-0007 元方法论再次应用）

> **注**：本 ADR 写于 `backend-architecture.md` 已拆分到 `docs/specs/backend/` 子目录结构之后，所有对 backend 文档的引用直接指向子目录文件，无需像 ADR-0001~0007 那样标注"拆分前/后"转换。

---

## 背景

### 触发事件：M1.2 方案刚落地后被洋哥连续两次质疑

本会话先执行了 M1.2 "业务模块域编号空间扩展"任务，第一版方案（数字分段）落地到 04-data-persistence.md / 03-platform-modules.md / appendix.md 三个文件：

| 分段 | 用途 |
|---|---|
| V01-V08 | platform 8 个模块 |
| V11 | 初始化数据 |
| V50-V89 | 使用者业务模块（每个独占一段，40 段）|
| V90-V92 | M5 canonical reference 固定位（notice/order/approval）|
| V99 | 过渡逃生舱 |

方案刚落地，洋哥立即发起两次质疑：

**第一次质疑**：
> "V90/V91/V92，我觉得这种 V 后面跟数字符号的形式很不直观，还是直接改成具体的业务语义或者英文单词吧"

**戳中点**：看到 `V91` 无法直读对应的业务模块，必须翻"域编号分配表"解码——分段数字本身不是人类友好的映射。

**第二次质疑**（在我给出"platform 保留 V01-V08 + business 走时间戳"的混合方案后）：
> "我觉得不要同时存在多个方案。如果要用时间戳，或者要用这种官方的，就全用这种官方的"

**戳中点**：混合方案是补丁思维——既舍不得折腾 platform，又想给 business 原生答案，结果两套心智模型并存。

---

### 第一性原理自检

按 ADR-0007 元方法论审查 M1.2 第一版方案：

| 审查问 | 答案 |
|---|---|
| **原生范式来源** | 数字段分配（V01-V99 按模块切段）是 nxboot / 传统 Java 团队的老习惯，来自 MyBatis-Plus / 早期 Spring Boot 项目的约定 |
| **新生态答案** | **Flyway 官方文档对多人团队的推荐是时间戳命名**（`V<yyyyMMddHHmmss>__description.sql`），官方示例和 Hasura / Quarkus 等大型开源项目的主流做法都是时间戳 |
| **两者一致性** | **不一致** → 按 ADR-0007 必须走新生态原生哲学 |

**结论**：M1.2 第一版方案是 ADR-0007 反面教材的典型落地——**继承惯性，未先问新生态的原生答案**。

---

### 次级元原则：一致性 > 局部最优

洋哥第二次质疑引出的新原则——**方案的一致性比局部优化更重要**。

我提出混合方案时的内心戏：
- "platform 8 个模块 M0 已经定稿，V01-V08 是紧凑的表达"
- "business 多人协作需要时间戳降冲突"
- "两种场景用不同范式是合理的"

看似自洽，实则是**舍不得砍任何一个方案的补丁思维**。洋哥切断：**"要用就全用"**。

**为什么一致性 > 局部最优**：

1. **心智切换有成本**：使用者/AI 看到 `V01` 要想"这是 platform 旧规范"，看到 `V20260701_001` 要想"这是 business 新规范"——上下文切换本身是错误来源
2. **维护不对称**：两套规则的文档、规范、工具支持、校验逻辑都要两套
3. **补丁思维的标志**：混合方案本质是"两个方案都舍不得砍"——和 ADR-0007 方案 E 前四轮"DataScopedRepository 基类怎么变好"是同一套症状

---

## 决策

**Flyway migration 命名全部采用时间戳格式，无模块例外、无阶段例外、无分层例外**。

### 命名格式

```
V<yyyymmdd>_<nnn>__<module>_<table>.sql
```

| 字段 | 规则 | 示例 |
|---|---|---|
| `<yyyymmdd>` | 该 migration 文件**首次加入项目的日期**（8 位） | `20260601` |
| `<nnn>` | 同日序号，001-999 零填充 | `001` / `012` / `099` |
| `<module>` | 模块归属前缀 | 见下 |
| `<table>` | 表名或变更描述（snake_case） | `user` / `order_main` / `add_user_phone` |

**module 前缀约定**：

| 模块类型 | 前缀规则 | 示例 |
|---|---|---|
| platform 模块 | 模块名简写（无 `platform_` 前缀，因为 platform 是固定 8 个，简写不歧义） | `iam_user` / `audit_log` / `file_metadata` |
| business 模块 | `business_<模块名>_<表>` | `business_notice` / `business_order_main` / `business_approval_flow` |
| 初始化数据 | `init_<类型>` | `init_data` / `init_permission` |
| 基础设施辅助表 | `<用途>` | `shedlock` / `flyway_schema_history`（后者由 Flyway 自动建）|

### 文件示例

```
mb-schema/src/main/resources/db/migration/
├── V20260601_001__iam_user.sql              # platform-iam
├── V20260601_002__iam_role.sql
├── V20260601_003__iam_menu.sql
├── V20260601_004__iam_dept.sql
├── V20260601_005__iam_user_role.sql
├── V20260601_006__iam_role_menu.sql
├── V20260602_001__audit_log.sql             # platform-audit
├── V20260602_002__file_metadata.sql         # platform-file
├── V20260603_001__notification.sql          # platform-notification
├── V20260603_002__dict.sql                  # platform-dict
├── V20260603_003__config.sql                # platform-config
├── V20260603_004__job.sql                   # platform-job
├── V20260603_005__shedlock.sql              # ShedLock 分布式锁表
├── V20260603_006__monitor.sql               # platform-monitor
├── V20260605_001__init_data.sql             # 初始化数据（超管/默认角色/基础菜单）
├── V20260701_001__business_notice.sql       # M5 canonical reference
├── V20260702_001__business_order_main.sql
├── V20260702_002__business_order_item.sql
└── V20260703_001__business_approval_flow.sql
```

### Flyway version 解析的合法性

Flyway 把文件名里的 `_` 和 `.` 都视为版本号分隔符：

- `V20260601_001` → version = `20260601.1`
- `V20260601_002` → version = `20260601.2`
- `V20260602_001` → version = `20260602.1`
- 排序：`20260601.1 < 20260601.2 < 20260602.1` ✓

Flyway 用 natural sort 执行 migration，时间戳单调递增天然满足顺序要求。

### 模块归属识别

**不依赖 version 号**（版本号只承载"执行顺序"单一职责），模块归属靠 **description 前缀** + **package-info.java 注释**：

```bash
# 查 iam 模块的所有 migration
ls mb-schema/src/main/resources/db/migration/ | grep '__iam_'

# 查 business-order 模块的所有 migration
ls mb-schema/src/main/resources/db/migration/ | grep '__business_order_'

# 查某一天新增的 migration
ls mb-schema/src/main/resources/db/migration/ | grep '^V20260702_'
```

### 冲突管理

| 场景 | 处理 |
|---|---|
| 创建 migration 前 | `git pull` 最新代码，确认不与远端冲突 |
| 同日多人冲突（两人都选 `V20260611_001`） | PR review 时后 merge 的一方 bump 序号到 `002` / `003` |
| 跨日冲突 | 自然消除（日期单调递增） |
| 本地已跑 `V20260612_001`，pull 到 `V20260611_001`（时间戳更早） | Flyway 严格模式会报错，开发者 bump 新文件为 `V20260612_002` |
| 生产环境 out-of-order | **禁止**启用 `flyway.outOfOrder=true`，生产保持严格顺序 |

### 砍掉的概念

与 M1.2 第一版方案对比，**全部砍掉**：

- ❌ "域编号分配表"（V01-V99 到模块的映射表）
- ❌ "每个域的主责人 sequential 分配序号"
- ❌ "使用者业务模块分段规则"（V50-V89）
- ❌ "canonical reference 固定位"（V90-V92）
- ❌ "V99 过渡逃生舱"
- ❌ M1.2 新加的"grep 查 V 段空闲"命令

这些概念在时间戳方案下全部是**不需要存在**的——补丁消失的症状。

---

## 为什么这是 ADR-0007 的第二次应用

ADR-0007 元方法论第二次发挥作用：

| 维度 | 第一次应用（方案 E 数据权限）| 第二次应用（本 ADR）|
|---|---|---|
| **补丁式思维的表现** | 在 `DataScopedRepository` 基类上打补丁（5 轮迭代）| 在数字段分配上打补丁（V50-V89 → V90-V92 → V99 逃生舱）|
| **继承来源** | MyBatis-Plus 生态的基类继承范式 | nxboot / 传统 Java 团队的数字段惯例 |
| **新生态原生答案** | jOOQ `VisitListener` 单点拦截 | Flyway 时间戳命名 |
| **洋哥的追问** | "你觉得这是终极方案吗？" + "回到源头来想，一开始就该这么设计吗？" | "V90/V91/V92 不直观" + "不要多方案共存" |
| **砍掉的概念** | 基类、`DataScopeContext` ThreadLocal | V 段分配表、主责人、空闲段管理 |
| **结果** | 方案 E（零基类、单点拦截） | 时间戳（零分配表、单一范式） |

**两次样本的共同模式**：补丁式思维 → 洋哥追问 → 原生哲学审查 → 砍掉非原生概念 → 症状同时消失。

**建议未来读者**：本 ADR 和 ADR-0007 搭配阅读，更能感受到"继承惯性 vs 原生哲学"这条元规则的实际威力。

---

## 一致性 > 局部优化（次级元原则）

洋哥的第二次质疑引出一条**独立于 ADR-0007 的元原则**：

> **方案的一致性比局部优化更重要。当混合方案看似合理时，先自检是不是两个方案都舍不得砍。**

### 判断标准

出现以下信号时触发自检：

1. "platform 保留 A，business 用 B" ← 按模块分范式
2. "M0 阶段用 X，M4 阶段用 Y" ← 按时间分范式
3. "前端用 P，后端用 Q" ← 按层分范式（有时是合理的，但必须审查）
4. "老数据用 M，新数据用 N" ← 按历史分范式
5. "小团队用 S，大团队用 L" ← 按规模分范式

**反问**：这些分界线是**问题本身的内在差异**，还是**我舍不得砍任何一个方案的补丁**？

**如果是前者**（比如 HTTP 协议和 WebSocket 本质不同），混合合理。
**如果是后者**（比如 Flyway 命名"platform 保留数字 + business 用时间戳"），全用新方案。

### 这条元原则的应用范围

比 ADR-0007 更基础——ADR-0007 是"继承遗产时问原生哲学"，本原则是"无论是不是继承，都不要补丁式混合"。

**建议未来 PR / review 时**，当我（或其他 AI / 人类贡献者）提出混合方案，先问：
- 这个"分界线"是**问题特性**决定的吗？
- 还是**我舍不得砍任何一个方案**？

答案是后者 → 砍一个，选另一个全用。

---

## 连带影响

### 文档修订

- **04-data-persistence.md**：
  - §5 Flyway 脚本组织整节重写——从"域编号分配表"换成"时间戳命名规范"
  - 示例目录树改为时间戳格式
  - §5.1 jOOQ 代码生成示例路径 `V01_001__iam_user.sql` → `V20260601_001__iam_user.sql`
- **03-platform-modules.md**：
  - §5 12 步清单步骤 6 的 SQL 示例文件名 + `<!-- verify: -->` 块路径更新
  - §2.7 platform-job 里 `V07_002__shedlock.sql` → `V20260603_005__shedlock.sql`
- **01-module-structure.md**：
  - 目录树示例中 V01_001 / V07_002 / V11_001 全部改时间戳
- **appendix.md**：
  - 附录 A A.2.8 Flyway schema 借用清单改造策略行的命名格式
  - 附录 B.1 mb-schema M5 清单改为按模块名分组描述
- **README.md**：
  - MUST #8 反向索引里的命名格式
- **CLAUDE.md**：
  - 语言规则表 Flyway SQL 文件名格式
  - ADR 索引增加 0008 行
  - 文档索引 ADR 数量 7 → 8
  - "最近一次大修"小节更新内容和日期
- **scripts/verify-docs.sh**：
  - `adrs=(0001 0002 ... 0007)` → 加 `0008`
- **docs/adr/0004 + 0006**：
  - 历史 ADR 里出现 `V01_001` / `V<域编号>` 的地方，加"ADR-0008 后命名已改时间戳"的注解

### 代码影响（M1/M4 阶段落地时）

- `mb-schema/src/main/resources/db/migration/` 里所有 migration 文件使用时间戳命名
- 无需配置 `flyway.outOfOrder`（默认严格顺序）
- 无需维护"V 段分配"任何工具脚本
- `@ConfigurationProperties` 类、Flyway 配置相关代码无任何变化

---

## 成本与风险

### 成本

| 项目 | 成本 | 备注 |
|------|------|------|
| M1.2 第一版方案返工（04/03/appendix 三处的数字段改动撤销+重写） | 低（约 20 分钟） | 本会话立即完成 |
| 连带 01/README/CLAUDE.md/verify-docs.sh 的命名格式统一 | 低（约 15 分钟） | |
| 为 ADR-0004 + 0006 的历史引用加 drift 注解 | 低（约 5 分钟） | |
| 写本 ADR | 中（约 40 分钟） | 一次性，但价值密度高（含元原则） |

### 风险

| 风险 | 严重度 | 缓解 |
|------|-------|------|
| 多人同日同序号冲突 | 低 | 时间戳天然比 V 段分配更少冲突（PR merge 时 bump 序号即可）|
| 开发者时钟不同步 | 极低 | `date +%Y%m%d` 是日级，时钟偏差几乎不跨日 |
| 本地 out-of-order（已跑新日期，pull 到旧日期） | 中 | 协作规则"创建前先 pull"+ 发现后 bump 新文件序号 |
| 使用者把"时间戳"当"创建时间"而不是"加入项目时间" | 低 | 命名规范里明确——时间戳是"首次加入项目的日期"，而不是"写 SQL 的日期" |
| Flyway 生态工具对时间戳命名的支持不完善 | 极低 | Flyway 官方文档主推时间戳，IDE / CLI 工具全部支持 |

### 放弃的能力

| 放弃 | 对 meta-build 的影响 |
|------|-------------------|
| "看到 V01 就知道是 iam 模块"的视觉映射 | 靠 description 前缀 `iam_` 补偿，语义更直白（不需要记 V 号 = 模块的映射）|
| 按模块数字紧凑分布的"领地感" | 时间戳同样单调递增，只是语义从"模块领地"变成"加入时间"。业务模块归属靠 description + package-info 注释补偿 |
| 目录里按模块分组的视觉效果 | `ls \| grep business_order_` 等命令等价还原，查询成本极低 |

---

## 验证方式

- ✅ `04-data-persistence.md §5` 只描述时间戳命名规范，不含"域编号分配表"
- ✅ 全仓 spec 文件中不再有 `V<域编号>_<序号>__<描述>.sql` 形式的示例
- ✅ 全仓 spec 文件中不再有 `V01_001` / `V11_001` / `V50_001` / `V90_001` / `V99_001` 等具体示例（ADR-0004 / 0006 的历史引用加 drift 注解）
- ✅ `CLAUDE.md` 的 ADR 索引有 0008 行
- ✅ `scripts/verify-docs.sh` 的 ADR 检查列表含 `0008`
- ✅ `verify-docs.sh` 全绿（62/62，新增 1 项 ADR-0008 检查）
- ⏳ M4 实施时验证：真正写 migration 时用时间戳命名

---

## 维护约定

### 本 ADR 是样本级 ADR，和 ADR-0007 搭配阅读

未来 meta-build 里每次出现"继承 nxboot / 传统 Java 惯例"时，**同时应用 ADR-0007 + 本 ADR 的次级元原则**：

1. **ADR-0007 问**：新生态的原生答案是什么？
2. **本 ADR 问**：我是不是提了混合方案？如果是，问是不是补丁。

两个质问同时过关，方案才算成熟。

### "一致性 > 局部优化"作为独立 feedback 规则

本 ADR 引出的"一致性 > 局部最优"原则应作为独立的 feedback memory 保存到 meta-build 协作上下文，未来所有方案 brainstorming 都要触发此自检。

---

## 致谢

洋哥在 M1.2 刚落地后连续两次质疑——

1. **第一问**："V90/V91/V92 不直观，改业务语义" → 戳中"数字分段非 Flyway 原生"
2. **第二问**："不要多方案共存，要用官方的就全用官方的" → 戳中"混合方案是补丁思维"

这两个质疑和 ADR-0007 方案 E 的两个追问（"你觉得这是终极方案吗？""回到源头来想，是否一开始就应该这么设计？"）同一灵魂——**拒绝补丁，追求终态**。

本 ADR 固化这一次实践，让未来 AI 遇到"看似合理的混合方案"时能感受到同样的追问压力。
