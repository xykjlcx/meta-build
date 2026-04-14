# Meta-Build 愿景与技术方案：AI 驱动的异步开发体系

> **一句话定位**：MB 底座约束 + Spec 引擎生成骨架 + TDD 验收驱动 AI 实现 + 经验库持续进化 = 人定义规则后离开，AI 跑一夜，第二天验收。

---

## 一、核心问题

当前人与 AI 的协作模式是**同步的**——人问一句 AI 答一句，人是全程在线的。这意味着：

- 人的时间是瓶颈，AI 的算力被浪费（等人输入）
- 中初级代码开发仍然需要人坐在电脑前一来一回
- AI 的能力没有被充分释放

**Meta-Build 要解决的问题**：把人从同步协作中解放出来，转变为异步模式——人做完决策性工作后离开，AI 自主执行，人只在最后验收和处理复杂逻辑。

---

## 二、终极工作模式

### 一天的工作流

```
┌─ 晚上 7:00-8:30 ── 人的工作（1-1.5 小时）──────────────┐
│                                                          │
│  1. 人用自然语言描述业务需求                               │
│  2. AI 生成 Spec 初稿 + TDD 验收条件初稿                  │
│  3. 人审核修改（审比写快得多）                              │
│  4. Spec 校验器自动检查完整性                              │
│  5. 确认无误 → 提交到任务队列                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           ↓
┌─ 晚上 8:30 → 次日早上 ── AI 无人值守执行 ────────────────┐
│                                                          │
│  循环引擎按拓扑排序逐个模块执行：                           │
│  ① Spec 引擎生成骨架代码 → [spec-gen] commit              │
│  ② AI 在骨架上实现业务逻辑                                │
│  ③ TDD 测试验证 → 不通过 → AI 修正 → 再验证               │
│  ④ 全部验收条件通过 → [ai-impl] commit                    │
│  ⑤ 下一个模块...                                         │
│                                                          │
│  模块隔离 / 超时跳过 / 失败不阻塞 / MB 约束全程守护         │
│                                                          │
└──────────────────────────────────────────────────────────┘
                           ↓
┌─ 次日早上 ── 人验收（30% 密集协作）──────────────────────┐
│                                                          │
│  1. 查看 Dashboard："8 成功 / 1 失败 / 1 超时"            │
│  2. 成功的模块：快速 review → 处理复杂逻辑 → [human] commit│
│  3. 失败的模块：分析原因 → 补验收条件或调 spec → 重跑      │
│  4. 踩坑记录写入经验库 → 下次不再犯                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 人的角色转变

| 传统模式 | Meta-Build 模式 |
|---------|----------------|
| 人写代码 | 人审 spec（AI 写初稿） |
| 人和 AI 一来一回 | 人定义规则后离开 |
| 人全程在线 | 人只在首尾参与 |
| 产出取决于人的时间 | 产出取决于 AI 的算力 |
| 人是执行者 | 人是决策者和验收者 |

---

## 三、五层技术架构

```
层 1：Spec 定义层 ─── 人 + AI 协作（1-1.5 小时）
       │
层 2：Spec 校验层 ─── 确定性脚本（1 分钟）
       │
层 3：Spec 引擎 ──── 确定性代码生成（5 分钟/模块）
       │
层 4：AI 循环引擎 ── 无人值守（30-50 分钟/模块）
       │
层 5：人工验收层 ─── 密集协作（30%）
       │
       └──→ 经验库 ──→ 反哺层 1-4 ──→ 飞轮效应
```

### 层 1：Spec 定义层

**输入**：人用自然语言描述业务需求

**过程**：
1. 人描述："我要一个订单管理模块，有客户关联、商品明细子表、金额>5万需要总监审批"
2. AI 根据描述生成 YAML spec 初稿（含 ER 模型 + 状态机 + 页面布局 + 权限矩阵）
3. AI 同时生成 TDD 验收条件初稿（10-20 个测试场景）
4. 人审核修改——审比写快得多，且更适合人的判断力优势

**输出**：YAML spec 文件 + TDD 验收条件文件

**Spec 文件包含四层软件工程信息**：

```yaml
module: business-order

# 第一层：ER 模型
entities:
  Order:
    table: biz_order_main
    data_scope: true          # 需要数据权限
    version: true             # 需要乐观锁
    fields:
      - { name: order_no, type: VARCHAR(32), unique: true }
      - { name: customer_id, type: BIGINT, ref: biz_customer.id }
      - { name: total_amount, type: DECIMAL(12,2) }
      - { name: status, enum: [DRAFT, PENDING, APPROVED, REJECTED] }
  OrderItem:
    table: biz_order_item
    parent: Order             # 主子表关系
    fields:
      - { name: product_name, snapshot: true }    # 快照字段
      - { name: unit_price, snapshot: true }
      - { name: quantity, type: INT }

# 第二层：状态机
stateMachine:
  entity: Order
  initial: DRAFT
  transitions:
    - { from: DRAFT, to: PENDING, action: submit, permission: order.submit }
    - { from: PENDING, to: APPROVED, action: approve, permission: order.approve }
    - { from: PENDING, to: REJECTED, action: reject, permission: order.approve }

# 第三层：页面布局
pages:
  list:
    columns: [order_no, customer_name, total_amount, status, created_at]
    filters: [status, date_range]
    actions: [create, export]
  form:
    sections:
      - { title: 基本信息, fields: [customer_id, remark] }
      - { title: 商品明细, component: OrderItemSubTable }
  detail:
    tabs: [基本信息, 商品明细, 审批记录, 操作日志]

# 第四层：权限矩阵
permissions:
  - { action: order.create, description: 创建订单 }
  - { action: order.read, description: 查看订单 }
  - { action: order.update, description: 编辑订单 }
  - { action: order.delete, description: 删除订单 }
  - { action: order.submit, description: 提交审批 }
  - { action: order.approve, description: 审批订单 }
```

**TDD 验收条件**：

```yaml
acceptance:
  - name: 基本 CRUD
    tests:
      - 创建订单成功，返回订单编号
      - 查询订单列表，支持按状态筛选
      - 编辑草稿订单，修改客户和备注
      - 删除草稿订单成功

  - name: 状态机
    tests:
      - 草稿订单提交后状态变为 PENDING
      - PENDING 订单不能再编辑
      - 审批通过后状态变为 APPROVED

  - name: 数据权限
    tests:
      - 部门1用户只能看到 owner_dept_id=1 的订单
      - 部门2用户看不到部门1的订单
      - 管理员（DataScopeType.ALL）能看到所有订单

  - name: 业务规则
    tests:
      - 金额 ≤ 5万的订单，部门经理审批即通过
      - 金额 > 5万的订单，需要部门经理+总监两级审批
      - 商品明细的 product_name 和 unit_price 是下单时的快照，不随商品修改而变化
```

### 层 2：Spec 校验层

**目的**：在 AI 执行之前拦截 spec 错误——把问题发现在"人还在电脑前"的时候。

**校验项**（确定性脚本，不需要 AI）：

| 校验项 | 说明 |
|--------|------|
| 字段完整性 | 所有字段有类型定义 |
| 状态机可达性 | 无不可达状态、无死锁（每个非终态都有出路） |
| 引用完整性 | `ref` 引用的实体存在 |
| 页面字段存在性 | 页面引用的字段在实体中存在 |
| 权限点命名规范 | 符合三段式 `<module>.<resource>.<action>` |
| TDD 引用完整性 | 验收条件中的 entity/action 在 spec 中有定义 |
| 模块依赖可解 | 依赖图无循环 |

**校验不通过 → 立即反馈人修改，不启动循环引擎。**

### 层 3：Spec 引擎

**定位**：高质量代码生成器——不是简单的 CRUD 生成，而是从四层软件工程信息生成完整骨架。

**输入**：YAML spec

**输出**（全部放在 `generated/` 目录，可随时从 spec 重新生成）：

| 生成物 | 来源 |
|--------|------|
| Flyway DDL（含索引、约束、owner_dept_id） | ER 模型 |
| jOOQ codegen 触发 | ER 模型 |
| Repository（含 JOIN 查询、分页模板） | ER 模型 + 关联关系 |
| Service 接口 + 状态转换骨架 | 状态机 |
| Controller + @RequirePermission | 权限矩阵 |
| DTO（View/Command/Query record） | ER 模型（含快照字段标记） |
| DataScopeRegistry 注册 | data_scope: true |
| 前端路由文件 + 页面骨架 | 页面布局 |
| NxTable 列配置 + NxForm 字段配置 | 页面布局 |
| AppPermission 类型 + 菜单注册 | 权限矩阵 |
| 测试骨架（CRUD + 权限 + 数据权限） | ER 模型 + 权限 |

**和若依代码生成器的区别**：

| 维度 | 若依代码生成器 | MB Spec 引擎 |
|------|-------------|-------------|
| 输入 | 表结构（一层） | ER + 状态机 + 页面 + 权限（四层） |
| 输出 | 后端 CRUD | 前后端全套 + 测试骨架 |
| 生成后 | 和模板脱钩，改了不能再生成 | `generated/` 目录可随时重新生成 |
| 约束守护 | 无 | ArchUnit + TypeScript strict + dependency-cruiser |
| 和 AI 的关系 | 无 | 生成骨架是 AI 的起点，不是终点 |

### 层 4：AI 循环引擎（Ralph）

**定位**：在 Spec 引擎生成的骨架之上，AI 自主实现业务逻辑并通过 TDD 验收。

**执行模式**：

```
任务队列（按依赖拓扑排序）：
[客户模块] → [订单模块] → [审批模块]

每个模块独立执行：
┌─────────────────────────────────────────┐
│ 1. 读取 generated/ 骨架代码              │
│ 2. 读取业务规则描述 + 验收条件            │
│ 3. 读取经验库 rules（避免已知踩坑）       │
│ 4. 在 custom/ 目录实现业务逻辑            │
│ 5. 运行 TDD 测试                         │
│ 6. 不通过 → 读错误信息 → 修改 → 再测试    │
│ 7. 通过 → [ai-impl] commit → 下一模块    │
│                                          │
│ 超时 60 分钟 → 跳过，记录失败原因          │
│ MB 约束全程守护（ArchUnit 等）             │
└─────────────────────────────────────────┘
```

**关键设计**：

| 设计点 | 说明 |
|--------|------|
| 模块隔离 | 每个模块独立 session，互不影响 |
| 超时机制 | 单模块超时自动跳过，不阻塞后续 |
| 失败隔离 | 模块 A 失败不影响模块 B（除非有依赖） |
| 依赖管理 | 按拓扑排序执行；依赖方失败 → 被依赖方标记 blocked |
| 验收粒度 | 每个验收条件独立（不是一个大测试），AI 一次修一个 |
| 经验库加载 | 每个模块执行前先读 rules，避免已知踩坑 |

**产能估算**：

| 指标 | 估值 |
|------|------|
| 单模块 AI 生成时间 | 5-10 分钟 |
| 单轮测试时间 | 5-10 分钟 |
| 平均循环次数 | 3-5 次 |
| 单模块总时间 | 30-50 分钟 |
| 一夜（8 小时）产能 | 10-15 个模块 |
| 预期一次通过率（初期） | 60-70% |
| 预期一次通过率（成熟期） | 85-90% |

### 层 5：人工验收层

**次日早上的工作流**：

1. **查看 Dashboard**：一眼看到"8 成功 / 1 失败 / 1 超时"
2. **成功模块**：快速 review → 处理复杂逻辑（复杂表单交互、特殊业务规则）→ `[human]` commit
3. **失败模块**：分析失败原因 → 补验收条件或调 spec → 重跑（或人工修复）
4. **踩坑记录**：写入经验库 → 下次不再犯

**人需要处理的"最后一公里"**：

| 内容 | 占比 | 为什么需要人 |
|------|------|------------|
| 复杂业务规则（价格引擎、库存算法） | 10% | 领域核心，每个行业不同 |
| 复杂表单交互（动态表单、级联选择） | 10% | UI 细节需要人的审美判断 |
| Edge case 处理 | 5% | AI 想不到的边界情况 |
| 集成对接（支付/物流/外部 API） | 5% | 每个接口方不标准 |

---

## 四、代码溯源链

### 文件级隔离

```
business-order/
├── generated/          ← Spec 引擎产物（可随时从 spec 重新生成）
│   ├── OrderRecord.java
│   ├── OrderRepository.java（CRUD 骨架）
│   ├── OrderController.java（路由 + 权限）
│   ├── OrderStateMachine.java（状态枚举 + 转换接口）
│   └── order-list.tsx（列表页骨架）
│
└── custom/             ← AI / 人写的业务逻辑（不被覆盖）
    ├── OrderServiceImpl.java（业务规则实现）
    ├── OrderApprovalGuard.java（审批守卫条件）
    └── order-form-logic.ts（复杂表单逻辑）
```

### Commit 级溯源

每个模块的 git 历史严格分层：

```
commit 1: [spec-gen] business-order 骨架生成
           ← 100% 确定性，可从 spec 重新生成
           ← 校验通过即提交

commit 2: [ai-impl] business-order 业务逻辑实现
           ← AI 产物，通过了全部 TDD 验收
           ← MB 约束（ArchUnit 等）全绿

commit 3: [human] business-order 复杂表单交互调整
           ← 人处理的最后一公里
```

### 溯源价值

| 场景 | 看哪里 | 处理方式 |
|------|--------|---------|
| 表结构/字段/权限错了 | `[spec-gen]` commit | spec 写错了 → 改 spec → 重新生成 |
| 业务规则不对 | `[ai-impl]` commit | AI 实现有误 → 改验收条件 → AI 重跑 |
| UI 交互问题 | `[human]` commit | 人改的 → 人修 |
| 需要回退到纯骨架 | `git reset --hard [spec-gen]` | 丢弃 AI 和人的改动，从骨架重来 |
| 量化 AI 可靠性 | 统计 `[ai-impl]` 需人修正的比例 | 指导验收条件优化 |

---

## 五、经验库进化机制

### 结构

```
docs/rules/                    ← 项目级经验库
├── spec-engine/               ← Spec 引擎踩坑
│   ├── varchar-vs-text.md     # 某些字段应该用 TEXT 不是 VARCHAR
│   ├── missing-index.md       # 容易遗漏的索引模式
│   └── snapshot-fields.md     # 快照字段的识别规则
│
├── ai-impl/                   ← AI 实现踩坑
│   ├── state-guard-pattern.md # AI 容易写错状态守卫的模式
│   ├── async-context.md       # 异步场景 CurrentUser 不可用
│   └── jooq-batch-trap.md     # jOOQ 批量操作的常见错误
│
├── tdd/                       ← TDD 验收踩坑
│   ├── granularity.md         # 验收条件粒度太粗导致 AI 钻空子
│   ├── data-setup.md          # 测试数据准备的标准模式
│   └── async-test.md          # 异步操作的测试时序问题
│
└── architecture/              ← 架构层踩坑
    ├── cross-module-event.md  # 跨模块事件的常见问题
    └── data-scope-edge.md     # 数据权限的边界情况
```

### 进化飞轮

```
踩坑 → 记录到 rules → 引擎/AI/测试改进 → 下次不踩 → 正确率提升
  ↑                                                        │
  └────────── 新功能/新模块 ←──────────────────────────────┘
```

**三条进化路径**：

| 路径 | 触发 | 改进 | 效果 |
|------|------|------|------|
| Spec 引擎进化 | 发现生成的代码有模式性错误 | 修 Spec 引擎模板 + 记 rules | 后续生成自动正确 |
| AI 实现进化 | 发现 AI 犯同类错误 | 记 rules → AI 执行前先读 | 后续 AI 避免同类错误 |
| TDD 验收进化 | 发现验收条件没拦住的 bug | 补验收条件模式 + 记 rules | 后续验收更严格 |

### 可量化指标

| 指标 | 衡量什么 | 预期趋势 |
|------|---------|---------|
| 月新增 rules 数 | 踩坑速度（初期快，后期慢） | 递减 |
| AI 一次通过率 | AI 实现质量 | 递增（60% → 90%） |
| `[ai-impl]` 需人修正比例 | AI 可靠性 | 递减 |
| 单模块平均循环次数 | AI 效率 | 递减（5 次 → 2 次） |
| 人均日产出模块数 | 整体效率 | 递增 |

---

## 六、确定性与不确定性的边界

这是整个体系的设计哲学核心——**明确划分确定性工作和不确定性工作，用不同的机制处理**。

| | 确定性工作 | 不确定性工作 |
|---|----------|------------|
| **谁做** | Spec 引擎 / 校验脚本 / MB 约束 | AI / 人 |
| **代表** | DDL 生成、CRUD 骨架、权限声明、测试骨架 | 业务规则实现、状态守卫条件、复杂表单逻辑 |
| **特征** | 输入确定 → 输出确定 | 需要判断力、有试错空间 |
| **验证方式** | 校验脚本（通过/不通过） | TDD 测试循环 |
| **错误处理** | 改 spec / 改模板 | 改验收条件 / 改 rules / AI 重试 |
| **存放位置** | `generated/` 目录 | `custom/` 目录 |
| **commit 标记** | `[spec-gen]` | `[ai-impl]` / `[human]` |

**为什么这个边界重要**：混淆确定性和不确定性是过度工程化的根源——试图用 Spec 引擎表达业务规则（确定性工具做不确定性的事）或让 AI 做 CRUD 生成（不确定性工具做确定性的事），都是错配。

---

## 七、与竞品的本质区别

### vs 若依/芋道（传统代码生成器）

```
若依：表结构 → 代码生成器 → CRUD 代码 → 完事（后续全靠人改）

MB：  Spec → Spec 引擎 → 骨架 → AI 实现 → TDD 验证 → 人验收
                                    ↑                       │
                                    └── 经验库 ←────────────┘
```

若依停在"生成"，MB 的价值在生成之后的整条链路。

### vs 低代码平台（明道云/宜搭）

| | 低代码 | Meta-Build |
|---|-------|-----------|
| 上限 | 平台能力的天花板 | 无上限（源码在手） |
| AI 协作 | 弱（封闭平台） | 原生为 AI 设计 |
| 复杂业务 | 做不了 | 人+AI 协作处理 |
| 锁定风险 | 高 | 零 |

### vs Cursor Rules / .cursorrules（AI 约束文件）

| | Cursor Rules | Meta-Build |
|---|-------------|-----------|
| 约束方式 | Prompt（软约束，AI 可能忽略） | ArchUnit + 编译器（硬约束，违反即失败） |
| 代码生成 | 无 | Spec 引擎 |
| 验证方式 | 人 review | TDD 自动验证 |
| 进化机制 | 人手动更新 rules | 飞轮自动进化 |

**Meta-Build 的本质创新**：把 AI 协作从"靠 prompt 祈祷"升级为"靠工具强制 + 测试验证 + 经验进化"。

---

## 八、实现路线图

### v1（M0-M7）— 底座跑通

交付物：可用的全栈管理后台底座 + ArchUnit 约束体系 + 12 步清单 + 3 个 canonical reference

**v1 验证的核心假设**：MB 约束层能否有效防止 AI 破坏架构？

### v1.5 — Spec 引擎 + TDD 验收框架

| 组件 | 内容 |
|------|------|
| Spec 引擎 v1 | YAML spec → 四层生成（ER + 状态机 + 页面 + 权限） |
| TDD 验收框架 | 验收条件标准格式 + 测试生成器 |
| Spec 校验器 | 完整性 / 一致性 / 可达性自动检查 |
| 经验库机制 | docs/rules/ 结构 + AI 加载流程 |
| generated/custom 隔离 | 文件级 + commit 级溯源链 |

**v1.5 验证的核心假设**：Spec 引擎 + TDD 验收能否让 AI 自主完成一个完整业务模块？

### v2 — 循环引擎 + 异步执行

| 组件 | 内容 |
|------|------|
| Ralph 循环引擎 | 任务队列 + 模块隔离 + 超时跳过 + 依赖拓扑 |
| 执行 Dashboard | 一夜执行结果可视化 |
| AI 上下文管理 | 每个模块独立 session + 共享 spec 仓库 |
| 增量生成 | spec 变更后只重新生成 generated/，不覆盖 custom/ |
| 进化度量 | AI 一次通过率、循环次数、人修正比例等指标追踪 |

**v2 验证的核心假设**：人定义规则后离开，AI 跑一夜，第二天全量功能大部分可用？

### 远期 — 可视化 + 自然语言

| 组件 | 内容 |
|------|------|
| 可视化 Spec 编辑器 | 非开发者也能通过 UI 定义业务 spec |
| 自然语言 → Spec | "我要一个订单管理系统" → 自动生成完整 spec |
| AI 自我进化 | AI 自动分析失败模式并更新经验库 |

---

## 九、风险与应对

| 风险 | 严重度 | 应对 |
|------|--------|------|
| Spec 抽象层次定不对（太粗无价值/太细做不完） | 高 | v1 M5 的 3 个 canonical reference 用来摸索边界 |
| AI 循环引擎一夜跑不完（卡住/超时） | 中 | 模块隔离 + 超时跳过 + 失败不阻塞 |
| TDD 验收条件写不好（太粗 AI 钻空子/太细人写不动） | 中 | 经验库持续积累验收条件最佳实践 |
| 增量生成的工程复杂度 | 中 | 先用 generated/custom 目录隔离，v2 再做精细增量 |
| LLM 能力天花板（复杂业务逻辑理解不了） | 低 | 这 20-30% 本来就是留给人的"最后一公里" |

---

## 十、一句话总结

**Meta-Build 不是一个管理后台框架，是一个 AI 驱动的软件工厂。**

- **Spec 引擎**是工厂的生产线（确定性生产骨架）
- **TDD 验收**是工厂的质检（自动验证正确性）
- **MB 约束层**是工厂的安全围栏（防止 AI 搞破坏）
- **经验库**是工厂的持续改进机制（做得越多越准）
- **人**是工厂的厂长（定义规则、验收产品、处理异常）

人不再是流水线工人，而是设计流水线的人。
