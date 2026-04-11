## 先挑战一个假设

你说"AI 优先"，核心逻辑是：**好底座 + 好文档 + 好约束 → AI 能生产出高质量代码**。

这个逻辑对了一半。漏掉的一半是：

**AI 能写出"看起来对"的代码，但"看起来对" ≠ "真的对"。**

想一下你自己用 Claude 写佑海系统的经验——AI 生成的代码能跑，但有没有出过：字段忘了加校验、权限注解忘了贴、缓存失效少考虑了一种场景？这些问题不是 AI 能力不够，而是**没有验证机制告诉它"错了"**。

所以 nxboot 作为 AI 时代脚手架的核心竞争力，不应该只是"AI 能读懂我的代码"——而是：

> **AI 产出的代码，必须通过一道自动化的正确性漏斗，过不了就不算完成。**

这才是你和 RuoYi 的本质区别。RuoYi 给人类一堆模板抄。nxboot 应该给 AI 一套模式 + 一套**自动裁判**。

---

## 重新定义你的产品

别把 nxboot 想成"脚手架"——这个词太小了。重新定义：

> **nxboot 是一个 AI 代码生成的约束运行时。**

它包含三层：

```
┌─────────────────────────────────────────┐
│  第三层：验证层（Verification）          │
│  AI 的产出必须通过这一层才算合格         │
│  ArchUnit · 集成测试 · 类型检查 · Lint   │
├─────────────────────────────────────────┤
│  第二层：模式层（Pattern）               │
│  AI 按这一层的规范来生成代码             │
│  CLAUDE.md · 参考模块 · 模块生成器       │
├─────────────────────────────────────────┤
│  第一层：底座层（Foundation）             │
│  AI 不碰这一层，它只管用                 │
│  安全 · 权限 · 缓存 · 审计 · 请求链路    │
└─────────────────────────────────────────┘
```

- **底座层**：你已经做得很好了。这一层 AI 不应该修改，只是调用。
- **模式层**：你做了一半（CLAUDE.md + 14 个参考模块），但缺模块生成器。
- **验证层**：这一层几乎是空白，但它才是整个体系的**关键闭环**。

---

## 验证层为什么是真正的护城河

假设两个开发者：
- A 用 RuoYi，让 AI 写了一个订单模块，代码能跑，上线了
- B 用 nxboot，让 AI 写了一个订单模块，代码必须通过以下检查才算完成：

| 检查 | 验证什么 |
|------|---------|
| ArchUnit | Controller 没有直接注入 Repository、Service 没有 import jOOQ |
| 权限覆盖率 | 每个 Controller 方法都有 @PreAuthorize，无裸接口 |
| 类型检查 | jOOQ codegen 编译通过，前端 tsc --noEmit 通过 |
| 集成测试模板 | 自动生成的 CRUD 测试全部通过 |
| Flyway 校验 | 迁移脚本版本连续，可正向执行 |

B 的代码不一定比 A 写得更好，但 B **能证明自己的代码是对的**。

这对 AI 生成代码的场景尤其重要——因为人类不会逐行 review AI 写的每一行。验证层替代了人类 review，成为质量的守门员。

**这就是 nxboot 的护城河：不是"AI 能用它写代码"（任何框架都行），而是"AI 用它写的代码，通过验证层后，可以信赖"。**

---

## 关于"AI 会越来越强"的风险

你可能会担心：如果 AI 越来越强，是不是不需要脚手架了？

不会。原因：

1. **安全/权限/缓存这些横切逻辑**，即使最强的 AI 从零写也会遗漏边界情况。底座层的价值是**被生产验证过的正确实现**，这不是 AI 能从零推导的。

2. **AI 越强，对约束的需求越大**——因为强 AI 生成代码更快，人类审核的压力更大，更需要自动化验证来兜底。

3. **一致性**——一个公司 10 个开发者各自让 AI 生成代码，没有统一底座的话，出来 10 种风格。底座保证的是组织级一致性。

真正的风险不是"AI 不需要脚手架"，而是**别人也做了一个 AI 优先的脚手架且做得更好**。所以速度很重要。

---

## 路线图建议

### 第一阶段：打磨底座（你说的"稳固"）

就是前面评审中提到的 4 个架构改进 + 可观测性补齐。不展开了。

### 第二阶段：模块生成器 — 这是最高 ROI 的事

做一个 **Spec 驱动的模块生成器**。核心思路：

```yaml
# order.module.yaml — 用户（或 AI）写这个文件
name: order
label: 订单管理
table: biz_order
fields:
  - { name: orderNo, type: string, label: 订单号, required: true, unique: true, searchable: true }
  - { name: customerId, type: long, label: 客户ID, ref: customer }
  - { name: amount, type: decimal, label: 金额, precision: "10,2" }
  - { name: status, type: enum, label: 状态, values: [DRAFT, SUBMITTED, APPROVED, REJECTED] }
  - { name: remark, type: string, label: 备注, maxLength: 500 }
permissions:
  scope: data  # 启用数据权限
  operations: [list, create, update, delete, export]
```

一条命令：
```bash
pnpm nx:gen order.module.yaml
```

自动生成全部 11 个文件 + Flyway 迁移 + 集成测试 + 前端测试。

**为什么这个比 JHipster 的方案更好：**
- JHipster 的 JDL 太复杂，学习成本高
- 你的 YAML spec 足够简单，**AI 可以直接从自然语言需求生成 spec**
- 开发者的工作流变成：`描述需求 → AI 生成 spec → 人确认 spec → 生成器生成代码 → 验证层通过 → 上线`

**AI 不再直接写业务代码，而是写 spec。** 这才是正确的人机分工：AI 理解需求，生成器保证质量。

### 第三阶段：验证层补齐

| 验证项 | 实现方式 | 作用 |
|--------|---------|------|
| 架构守护 | ArchUnit 5-8 条规则 | 拦截分层违规 |
| 权限覆盖率 | 自定义 Maven 插件或测试 | 检查每个 @RestController 方法都有 @PreAuthorize |
| 模块完整性 | 检查脚本 | 每个 module 必须有 Controller + Service + Repository + 迁移 + 测试 |
| 前端类型安全 | tsc --noEmit 在 CI 中 | 前后端 VO 类型不匹配会编译失败 |
| 测试覆盖率门槛 | JaCoCo + Vitest coverage | 新模块的测试覆盖率不低于基准线 |

### 第四阶段：开源 + 社区

这里有一个关键的定位选择：

| 路线 | RuoYi 模式 | nxboot 应该走的路 |
|------|-----------|-----------------|
| 目标用户 | 人类开发者（看文档、抄模板） | **AI Agent + 人类监督者** |
| 核心文档 | README + 教程 | **CLAUDE.md + Module Spec + 验证规则** |
| 差异化 | 功能多、开箱即用 | **产出可验证、质量有保证** |
| 社区贡献 | 提交代码 | **提交行业 Module Spec**（电商、物流、CRM...） |

社区的贡献方式不是"给脚手架提 PR"，而是**贡献行业 Spec 模板**。比如有人做过跨境电商，他把订单/商品/仓储的 module spec 贡献出来，其他人直接用。这比贡献代码有价值得多——因为行业知识比代码更稀缺。

---

## 一个更大胆的想法

如果把终局想清楚，nxboot 的形态可能不是一个 GitHub 仓库，而是：

> **一个在线平台：用户用自然语言描述业务系统 → AI 生成 Module Spec → 用户确认 → 平台基于 nxboot 底座生成完整项目 → 自动部署**

类似 Vercel 对前端做的事，但面向的是**管理后台 / B 端系统**这个巨大市场。

这个方向上你有两个独特优势：
1. **你懂货代/跨境电商行业**——能做出有行业深度的 spec 模板，不是泛化的 CRUD
2. **你有佑海系统的实战经验**——知道生产环境会踩什么坑，这些经验固化在底座里

---

## 总结：该做什么、不该做什么

**该做：**
- Spec 驱动的模块生成器（把 AI 从"写代码"变成"写 Spec"）
- 验证层（让 AI 产出可信赖）
- 行业 Spec 模板库（这是真正的内容壁垒）
- 保持极度 opinionated（一件事只有一种做法，AI 不用选）

**不该做：**
- 不要加太多可配置项（每个配置项都是 AI 的困惑点）
- 不要支持多数据库 / 多前端框架（分散精力，且削弱"唯一正确做法"的优势）
- 不要急着做商业化 / 平台化（先把底座 + 生成器 + 验证层跑通）
- 不要和 RuoYi 比功能数量（你赢的维度是质量和 AI 友好度，不是功能数）

**一句话定位：**

> RuoYi 是给人抄的模板。nxboot 是给 AI 执行的契约。

---
---

# 深入设计：Spec 生成器 + 验证层

## 先厘清一个核心洞察

Spec 生成器和验证层不是两个独立的功能——它们是**一个闭环的两半**：

```
                  ┌──────────┐
                  │  Spec    │ ← AI 生成 / 人确认
                  └────┬─────┘
                       │
              ┌────────▼────────┐
              │   Generator     │ ← 确定性代码生成
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Generated Code │
              │  + Custom Code  │ ← 人/AI 补充业务逻辑
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Verification   │ ← 自动验证：Spec 说了的，代码都做到了吗？
              └────────┬────────┘
                       │
                  通过 / 不通过
```

关键点：**验证层不只是检查"代码写得对不对"，而是检查"代码和 Spec 是否一致"。** Spec 是合同，验证层是审计。

举个例子：Spec 写了 `permissions: [list, create, update, delete]`，验证层会自动检查——

- Controller 有 4 个对应的 HTTP 方法？
- 每个方法有 `@PreAuthorize`？
- 前端有 4 个操作按钮且都用了 `usePerm()`？
- 集成测试覆盖了这 4 个操作？

**如果任何一项不满足，构建直接失败。** 这就是"契约"的含义——不是建议，是强制。

---

## Spec 设计：怎么定义才够用又不过度

Spec 最容易犯的错是想覆盖所有情况，结果变得跟 JHipster 的 JDL 一样复杂。遵循你自己的原则——**确定性边界**：

- **确定性的部分**（用 Spec 描述、用生成器处理）：字段定义、数据类型、校验规则、权限声明、基础 CRUD UI
- **不确定性的部分**（留给 AI / 人）：复杂业务逻辑、非标准 UI、跨模块交互

### Spec 分三层

```yaml
# ==========================================
# 第一层：实体定义（必填，生成器核心输入）
# ==========================================
name: order
label: 订单管理
table: biz_order

fields:
  - name: orderNo
    type: string
    label: 订单号
    constraints: { required: true, unique: true, maxLength: 32 }
    ui: { searchable: true, copyable: true }

  - name: customerId
    type: long
    label: 客户
    ref: { module: customer, display: customerName }  # 外键关联

  - name: amount
    type: decimal
    label: 金额
    constraints: { required: true, precision: "10,2", min: 0 }

  - name: status
    type: enum
    label: 状态
    values:
      - { value: DRAFT, label: 草稿 }
      - { value: SUBMITTED, label: 已提交, color: blue }
      - { value: APPROVED, label: 已审核, color: green }
      - { value: REJECTED, label: 已驳回, color: red }
    constraints: { default: DRAFT }
    ui: { filterable: true, tag: true }  # 列表页可筛选，显示为标签

  - name: remark
    type: text
    label: 备注
    constraints: { maxLength: 500 }
    ui: { hideInTable: true }  # 列表页不显示，详情/表单显示

# ==========================================
# 第二层：行为定义（权限、排序、导入导出）
# ==========================================
permissions:
  code: biz:order           # 权限标识前缀
  dataScope: true           # 启用数据权限
  operations:
    - list                  # GET    /api/v1/biz/orders
    - create                # POST   /api/v1/biz/orders
    - update                # PUT    /api/v1/biz/orders/{id}
    - delete                # DELETE /api/v1/biz/orders/{id}
    - export                # GET    /api/v1/biz/orders/export

defaults:
  sort: { field: createdAt, order: desc }
  pageSize: 20

# ==========================================
# 第三层：扩展声明（可选，标记需要人/AI 补充的部分）
# ==========================================
extensions:
  - type: service-hook
    name: beforeCreate
    description: 创建订单前生成订单号（自定义编号规则）
  - type: service-hook
    name: afterStatusChange
    description: 状态变更时发送通知
```

### 设计原则

**Spec 不描述"怎么做"，只描述"要什么"。**

| 该写在 Spec 里 | 不该写在 Spec 里 |
|---------------|----------------|
| 字段类型是 decimal | 用 BigDecimal 还是 Double |
| 字段必填 | @NotNull 注解放在哪里 |
| 需要分页 | offset 还是 cursor 分页 |
| 支持导出 | 用 POI 还是 EasyExcel |
| 订单号要唯一 | 唯一校验放在 Service 还是 DB 约束 |

"怎么做"是生成器的事，由 nxboot 的既定模式决定。这就是"opinionated"的价值——**Spec 里不需要做任何技术决策。**

---

## 生成器：生成什么、不生成什么

### 一条命令生成的完整文件清单

```bash
$ pnpm nx:gen specs/order.module.yaml

生成后端文件：
  ✓ server/nxboot-system/src/.../order/model/OrderVO.java
  ✓ server/nxboot-system/src/.../order/model/OrderCommand.java
  ✓ server/nxboot-system/src/.../order/controller/OrderController.java
  ✓ server/nxboot-system/src/.../order/service/OrderService.java
  ✓ server/nxboot-system/src/.../order/repository/OrderRepository.java
  ✓ server/nxboot-admin/src/.../db/migration/V30__create_biz_order.sql

生成后端测试：
  ✓ server/nxboot-admin/src/test/.../OrderServiceIntegrationTest.java

生成前端文件：
  ✓ client/src/features/order/types.ts
  ✓ client/src/features/order/api.ts
  ✓ client/src/features/order/columns.tsx
  ✓ client/src/features/order/pages/OrderList.tsx
  ✓ client/src/features/order/pages/OrderForm.tsx

生成前端测试：
  ✓ client/src/features/order/__tests__/OrderList.test.tsx

更新路由和菜单：
  ✓ client/src/app/routes.tsx（追加路由）
  ✓ server/.../db/migration/V30__create_biz_order.sql（包含菜单初始化 INSERT）

生成验证规则：
  ✓ specs/order.verify.yaml（自动派生的验证清单）
```

### 关键设计：生成后的代码可以改，但有保护

生成的文件分两种：

```java
// === OrderService.java ===
// @generated — 此文件由 nx:gen 生成，可自由修改
// 修改后重新生成不会覆盖此文件（除非加 --force）

@Service
public class OrderService {

    // --- 标准 CRUD（生成器产出）---
    public PageResult<OrderVO> page(...) { ... }
    public Long create(OrderCommand.Create cmd) { ... }
    public void update(Long id, OrderCommand.Update cmd) { ... }
    public void delete(Long id) { ... }

    // --- 扩展点（生成器留桩，人/AI 填充）---
    // @extension beforeCreate
    // TODO: 实现订单号生成逻辑
    private String generateOrderNo() {
        throw new UnsupportedOperationException("请实现订单号生成逻辑");
    }
}
```

**规则：**
- 首次生成的文件，后续 `nx:gen` 不会覆盖（避免丢失自定义代码）
- 如果 Spec 新增了字段，运行 `nx:gen --diff` 会输出差异，告诉你需要手动加什么
- 如果想完全重新生成，用 `nx:gen --force`（会备份旧文件）

---

## 验证层：具体检查什么、怎么实现

### 验证规则体系

从 Spec 自动派生验证规则。用一个真实例子走一遍：

Spec 声明了：
```yaml
fields:
  - name: orderNo
    constraints: { required: true, unique: true }
permissions:
  operations: [list, create, update, delete]
  dataScope: true
```

验证层自动检查：

```
┌─────────────────────────────────────────────────────────────────┐
│ 架构规则（ArchUnit，编译期）                                      │
│                                                                 │
│  ✓ OrderController 没有直接注入 OrderRepository                  │
│  ✓ OrderService 没有 import org.jooq.*                          │
│  ✓ OrderRepository 在 order 包内，没有被其他领域的 Service 直接依赖 │
├─────────────────────────────────────────────────────────────────┤
│ 权限规则（自定义检查，CI 阶段）                                    │
│                                                                 │
│  ✓ OrderController.page()   有 @PreAuthorize("@perm.has('biz:order:list')")   │
│  ✓ OrderController.create() 有 @PreAuthorize("@perm.has('biz:order:create')") │
│  ✓ OrderController.update() 有 @PreAuthorize("@perm.has('biz:order:update')") │
│  ✓ OrderController.delete() 有 @PreAuthorize("@perm.has('biz:order:delete')") │
│  ✓ OrderService.page() 有 @DataScope 注解                                     │
├─────────────────────────────────────────────────────────────────┤
│ 数据完整性（Flyway + 编译，构建期）                                │
│                                                                 │
│  ✓ biz_order 表有 order_no 列且 NOT NULL                         │
│  ✓ biz_order 表有 UNIQUE 约束在 order_no 上                      │
│  ✓ jOOQ codegen 编译通过（表结构和代码一致）                       │
├─────────────────────────────────────────────────────────────────┤
│ 校验一致性（自定义检查）                                          │
│                                                                 │
│  ✓ OrderCommand.Create.orderNo 有 @NotBlank                     │
│  ✓ OrderService.create() 调用了 existsByOrderNo()（唯一性校验）   │
│  ✓ 前端 OrderForm 的 orderNo 字段有 required 属性                │
├─────────────────────────────────────────────────────────────────┤
│ 测试覆盖（JUnit + Vitest，测试期）                                │
│                                                                 │
│  ✓ OrderServiceIntegrationTest 覆盖 CRUD 四个操作                │
│  ✓ 创建重复 orderNo 返回 BIZ_DUPLICATE 错误                     │
│  ✓ 无权限用户访问返回 403                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 实现方式：分层、渐进

不需要一口气全做。按投入产出比排序：

| 层 | 实现 | 工作量 | 价值 |
|----|------|--------|------|
| **L1 架构守护** | ArchUnit 测试类，5-8 条规则 | 1 天 | 防止分层违规，对 AI 生成代码尤其重要 |
| **L2 权限覆盖率** | 一个 JUnit 测试：反射扫描所有 Controller 方法，检查注解 | 半天 | 消灭裸接口，零成本持续验证 |
| **L3 模块完整性** | Shell 脚本：对照 Spec 检查文件是否齐全 | 半天 | 防止 AI 只生成了 Service 忘了 Controller |
| **L4 Spec-Code 一致性** | 读 Spec YAML + 反射扫描代码，交叉验证 | 2-3 天 | **这是核心差异化**——Spec 说了 required，代码就必须有 @NotBlank |
| **L5 自动生成测试** | 模块生成器同时生成集成测试模板 | 含在生成器里 | 新模块自带基础测试覆盖 |

---

## 扩展点机制：生成器的灵魂

标准 CRUD 能覆盖 70% 的场景。剩下 30% 是差异化的业务逻辑。生成器必须优雅地处理这个问题。

### 方案：Spec 声明扩展点，生成器留桩

```yaml
# Spec 中声明
extensions:
  - type: service-hook      # 在 Service 层插入逻辑
    name: beforeCreate
    description: 创建前生成订单号

  - type: service-hook
    name: onStatusChange
    description: 状态变更时触发通知
    params: { from: OrderStatus, to: OrderStatus }

  - type: custom-query      # 非标准查询
    name: findByCustomerAndDateRange
    description: 按客户和日期范围查询
    params: { customerId: long, startDate: date, endDate: date }

  - type: ui-override       # 前端自定义
    name: statusColumn
    description: 状态列用自定义渲染（带操作按钮）
```

生成器产出：

```java
// OrderService.java — 生成的代码
@Transactional
public Long create(OrderCommand.Create cmd) {
    // ↓ 扩展点桩：beforeCreate
    String orderNo = this.beforeCreate(cmd);

    // 标准创建逻辑...
    return id;
}

/**
 * 扩展点：创建订单前调用
 * 由 Spec 声明，需要实现订单号生成逻辑
 */
protected String beforeCreate(OrderCommand.Create cmd) {
    // TODO: 实现订单号生成
    // 示例：return "ORD-" + DateUtils.format(now(), "yyyyMMdd") + "-" + sequence.next();
    throw new UnsupportedOperationException("请实现 beforeCreate 扩展点");
}
```

**验证层会检查：** 所有声明的扩展点都已被实现（不再 throw UnsupportedOperationException）。

### AI 的工作流变成

```
人：我需要一个订单模块，订单号规则是 ORD-日期-流水号

AI 做两件事：
1. 生成 Spec（字段、权限、扩展点声明）
2. 实现扩展点的业务逻辑

AI 不碰标准 CRUD 代码 — 那是生成器的事
```

**这就是正确的人机分工：**
- **生成器**（确定性）：处理模式化的 CRUD 代码，保证结构正确
- **AI**（不确定性）：理解业务需求，写 Spec + 实现扩展点
- **验证层**（确定性）：检查两者的产出是否一致、是否完整

---

## 这套体系的终极检验标准

设想一个场景：

> 一个从没见过 nxboot 的开发者，把 CLAUDE.md 和一个业务需求扔给 AI Agent。
> Agent 自己生成 Spec → 运行生成器 → 实现扩展点 → 跑验证层 → 全部通过。
> 人类只在两个时刻介入：**确认 Spec** 和 **确认上线**。

如果这个场景能跑通，nxboot 就真正实现了"AI 执行的契约"这个定位。

---
---

# 多实体业务场景：Spec 生成器如何处理复杂业务

你说到点上了。这个问题不想清楚，Spec 生成器就只是一个高级版 RuoYi 代码生成器，没有本质区别。

你的判断是对的——**确实是两步**。但关键在于：这两步的边界画在哪里，以及第二步怎么做得更好。

---

## 先承认一个事实

真实的业务系统，复杂度分两种：

| 类型 | 例子 | 特征 |
|------|------|------|
| **结构复杂度** | 订单有明细、客户有地址、角色有权限 | 表之间有关系，但逻辑是模式化的（主从保存、级联删除） |
| **行为复杂度** | 下单扣库存、审核触发通知、退款反冲账 | 跨模块协作，有条件判断、有副作用、有状态流转 |

Spec 生成器能覆盖**结构复杂度**的大部分——因为主从表、外键关联、级联操作是有限的几种模式，可以穷举。

但**行为复杂度**本质上是业务知识，不是结构模式。"下单要扣库存"这个规则，没有任何生成器能从字段定义里推导出来——它只存在于业务方的脑子里。

所以正确的分工是：

```
生成器负责：结构（表、字段、关系、CRUD、UI）
AI 负责：  行为（业务规则、跨模块协调、状态流转）
验证层负责：确保两者的产出都符合契约
```

---

## 第一步：Spec 比你想的能做更多

单表 CRUD 只是最基础的。Spec 再往上走一层，可以覆盖三种最常见的关系模式：

### 模式一：主从表（Master-Detail）

订单 + 订单明细，最经典的场景：

```yaml
name: order
label: 订单管理
table: biz_order

fields:
  - { name: orderNo, type: string, label: 订单号, constraints: { required: true, unique: true } }
  - { name: customerId, type: long, label: 客户, ref: { module: customer, display: customerName } }
  - { name: totalAmount, type: decimal, label: 总金额, constraints: { precision: "10,2" } }
  - { name: status, type: enum, label: 状态, values: [DRAFT, SUBMITTED, APPROVED] }

# ↓ 关键：主从关系声明
details:
  - name: items
    label: 订单明细
    table: biz_order_item
    fields:
      - { name: productName, type: string, label: 商品名, constraints: { required: true } }
      - { name: sku, type: string, label: SKU }
      - { name: quantity, type: int, label: 数量, constraints: { required: true, min: 1 } }
      - { name: unitPrice, type: decimal, label: 单价, constraints: { required: true, precision: "10,2" } }
```

生成器看到 `details` 就知道：
- `OrderVO` 里有 `List<OrderItemVO> items`
- `OrderCommand.Create` 里有 `List<OrderItemCommand> items`
- `OrderService.create()` 在一个事务里保存主表 + 明细表
- `OrderService.delete()` 级联删除明细
- `OrderForm.tsx` 里有一个**可编辑的明细表格**(加行、删行、改行)
- `OrderList.tsx` 支持展开行显示明细

这些都是**确定性的模式**，生成器完全能处理。

### 模式二：引用关系（Reference）

订单引用客户，但客户是独立模块：

```yaml
fields:
  - name: customerId
    type: long
    label: 客户
    ref:
      module: customer          # 引用哪个模块
      display: customerName     # 列表页显示客户名而不是 ID
      ui: select                # 表单里用下拉选择器
```

生成器看到 `ref` 就知道：
- Repository 查询时 JOIN customer 表取 customerName
- 前端 OrderForm 里渲染一个客户选择器（调 `useCustomers()` API）
- VO 里有 `customerName` 字段（冗余展示用）

### 模式三：枚举 + 状态（Enum with Transitions）

```yaml
fields:
  - name: status
    type: enum
    label: 状态
    values: [DRAFT, SUBMITTED, APPROVED, REJECTED, CANCELLED]
    transitions:                # 可选：声明合法的状态流转
      DRAFT: [SUBMITTED, CANCELLED]
      SUBMITTED: [APPROVED, REJECTED]
      REJECTED: [SUBMITTED, CANCELLED]  # 驳回后可重新提交
```

生成器看到 `transitions` 就知道：
- 生成一个 `OrderStatusMachine` 工具类，`canTransit(from, to)` 方法
- `OrderService.updateStatus()` 里自动校验状态流转合法性
- 前端状态操作按钮根据当前状态动态显示（DRAFT 状态只显示"提交"和"取消"）

**这三种模式覆盖了 80% 的结构复杂度。** 剩下 20% 的特殊结构（多对多、树形、自关联），先不做——等遇到了再扩展 Spec 语法。

---

## 第二步：跨模块的业务行为怎么办

这是你真正在问的问题：**"下单要扣库存"这种跨模块逻辑，谁来写、怎么写？**

答案很明确：**AI 写，写在扩展点里，验证层检查。**

但这里有一个关键的设计决策——跨模块调用的模式要不要统一？

### 方案：约定一个 Application Service 层

现在 nxboot 只有 `Controller → Service → Repository` 三层。加一层 **Application Service**（编排层），专门处理跨模块协调：

```
Controller → ApplicationService → Service → Repository
               ↓ 跨模块调用
             其他 Service
```

```
nxboot-system/
├── order/
│   ├── controller/OrderController.java      ← HTTP 入口
│   ├── service/OrderService.java            ← 单模块 CRUD（生成器产出）
│   ├── repository/OrderRepository.java
│   └── model/
├── inventory/
│   ├── service/InventoryService.java
│   └── ...
└── application/                              ← 新增：编排层
    └── OrderApplicationService.java          ← 跨模块业务逻辑（AI 写）
```

```java
// OrderApplicationService.java — 这个文件 AI 写，不是生成器产出
@Service
public class OrderApplicationService {

    private final OrderService orderService;
    private final InventoryService inventoryService;
    private final CustomerService customerService;
    private final NotificationService notificationService;

    /**
     * 提交订单（跨模块编排）
     * 1. 校验客户信用
     * 2. 锁定库存
     * 3. 更新订单状态
     * 4. 发送通知
     */
    @Transactional
    public void submitOrder(Long orderId) {
        OrderVO order = orderService.getById(orderId);

        // 业务规则：校验客户
        customerService.validateCredit(order.customerId(), order.totalAmount());

        // 业务规则：扣减库存
        for (OrderItemVO item : order.items()) {
            inventoryService.deduct(item.sku(), item.quantity());
        }

        // 状态流转
        orderService.updateStatus(orderId, OrderStatus.SUBMITTED);

        // 副作用：通知
        notificationService.notifyOrderSubmitted(order);
    }
}
```

### 这个分层的好处

| 层 | 谁写 | 职责 | 可以测试吗 |
|----|------|------|-----------|
| **Controller** | 生成器 | HTTP 转换 | 不需要单独测 |
| **ApplicationService** | AI / 人 | 跨模块编排、业务流程 | 集成测试 |
| **Service** | 生成器 | 单模块 CRUD + 校验 | 生成器自带测试 |
| **Repository** | 生成器 | 数据访问 | 不需要单独测 |

**生成器产出的代码和 AI 写的代码，物理上分开了。**

- 生成器的产出在各个模块目录里（order/、inventory/）
- AI 的产出在 `application/` 目录里
- 验证层可以对两者施加不同的规则：
  - 模块内代码：必须符合 Spec 契约
  - 编排层代码：必须有对应的集成测试

### Spec 怎么声明"需要编排"

```yaml
# order.module.yaml 的 extensions 部分
extensions:
  - type: application-service     # ← 告诉框架：这个模块有跨模块业务逻辑
    name: OrderApplicationService
    operations:
      - name: submitOrder
        description: 提交订单（校验客户信用 → 扣减库存 → 更新状态 → 发送通知）
        involves: [customer, inventory, notification]  # 涉及哪些模块
      - name: cancelOrder
        description: 取消订单（释放库存 → 更新状态 → 通知客户）
        involves: [inventory, notification]
```

生成器看到 `type: application-service` 会：
1. 创建 `OrderApplicationService.java` 的**骨架**（依赖注入写好，方法签名写好）
2. 创建对应的**集成测试骨架**
3. 方法体留 `TODO` 给 AI 实现

**验证层检查：** ApplicationService 里所有方法都有实现（不是 TODO），且都有对应的集成测试。

---

## 所以完整的工作流是

```
第一步（生成器 — 确定性）
├── 读 Spec → 生成各模块的 CRUD 代码
├── 处理主从关系、引用关系、状态机
├── 生成测试 + 验证规则
└── 产出：可独立运行的标准模块

第二步（AI — 不确定性）
├── 读 Spec 中的 extensions 声明
├── 实现 ApplicationService 中的业务逻辑
├── 实现 Service 中的扩展点（如订单号生成）
└── 产出：跨模块协调代码

第三步（验证层 — 确定性）
├── Spec 契约检查（字段、权限、关系是否完整）
├── 架构规则检查（分层、依赖方向）
├── 测试通过检查（CRUD 测试 + 业务逻辑测试）
└── 产出：通过 / 不通过
```

你说的"先生成模板，再做调用配合"——本质上是对的。但区别在于：

| RuoYi 的做法 | nxboot 的做法 |
|-------------|-------------|
| 生成代码，然后全靠人 | 生成代码 + 测试 + 验证规则 |
| 没有 Spec，生成后无据可查 | Spec 是持续的合同，代码必须与 Spec 一致 |
| 跨模块逻辑写在 Service 里，和 CRUD 混在一起 | 跨模块逻辑独立到 ApplicationService，职责分明 |
| 生成完就不管了 | 验证层持续守护，每次 CI 都检查 |

**RuoYi 的生成器是一次性的工具。nxboot 的 Spec 是持续的契约。** 这才是本质区别。
