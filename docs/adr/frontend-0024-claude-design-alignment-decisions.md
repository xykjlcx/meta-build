# ADR frontend-0024：Claude Design 对齐 · 14 项决策汇总

## 状态

已采纳

## 日期

2026-04-18

## 背景

2026-04-17 Anthropic 发布 Claude Design 设计体系，洋哥基于其规范生成了一份 Admin Scaffold 原型（保存在 `/Users/ocean/Desktop/claude-design-test01`），作为 meta-build v1 视觉终态的目标。原型涵盖成员与部门、角色、菜单、Dashboard、登录注册、个人中心、错误页等完整页面，使用 Claude 官方的 warm palette + 三种 Layout 变体（Classic / Inset / Rail），视觉质量明显高于当前 lark-console 单一 style 的成品。

对标之后，通过 14 轮针对性决策讨论（Q1–Q14），确定了 meta-build 与 Claude Design 的对齐范围、取舍边界、以及实施节奏。本 ADR 把这 14 项决策一次性落档，供后续 Plan A / B / C 三阶段实施时作为不可动摇的契约。

## 决策（14 项）

### 决策 1：用户管理合并为「成员与部门」（Q1）

**问题**：原 IAM 规划有独立「用户管理」页面 + 独立「部门管理」页面，是否保留？

**决策**：移除独立用户管理页，合一为「成员与部门」单页。采用 Claude Design 的 members 模式：左侧部门树 + 右侧成员表，切换部门即筛选右侧列表。

**理由**：部门与成员是强耦合领域，拆两页会导致用户频繁跳转。Claude Design 的单页布局符合企业后台的实际工作流（按部门维度管理人）。

**影响面**：Codex 做过的 user / dept 两页作废（见决策 8），新页面 `features/members/` 从头实现。

### 决策 2：claude-warm 作为默认 style，lark-console 保留为第二 style（Q2）

**问题**：引入 Claude Design 的 warm palette 后，是否替换 lark-console？

**决策**：新增 `claude-warm` 作为第三个 style，并切换为默认 style；lark-console 保留为第二 style，classic 仍在。所有业务页面改动需在 claude-warm 和 lark-console 两套 style 下都验证视觉质量。

**理由**：lark-console 已完成 v3 实测对齐（ADR-0020），弃掉沉没成本太高，而且「同一底座可切换多种 style」本身就是 meta-build 的卖点。claude-warm 成为新默认是因为 Claude Design 的视觉完成度更高、更适合作为对外展示的终态。

**影响面**：StyleRegistry 注册 3 个 style；`check-theme-integrity.ts` 校验 3 × 70 = 210 个 token；Plan A 的主要工作之一是补齐 claude-warm 的 light/dark token。

### 决策 3：Sidebar 分组借鉴叙事 + 真实模块填充（Q3）

**问题**：Claude Design 的 Sidebar 按「组织管理 / 内容 / 产品设置」三组叙事分组，meta-build 是否照搬？

**决策**：分组叙事借鉴（三组结构保留），但具体菜单项全部填入 meta-build 真实后端模块（iam / business-notice / platform-*），不做 disabled 占位项。

**理由**：照搬叙事分组让使用者一眼看懂后台结构，但菜单项必须是可点击、可工作的真实页面——disabled 占位会让使用者以为功能残缺。

**影响面**：Sidebar 配置根据决策 13 的三组 Tab 动态生成；没有对应后端模块的分组（如 Claude Design 的 invoices）直接不出现。

### 决策 4：三层导航架构（Q4）

**问题**：系统切换、模块切换、页面导航三个层级如何在 UI 上表达？

**决策**：三层独立：

- **九宫格** = 系统级切换（财务 / CRM / 快递 等，v1 仅占位）
- **Header Tab** = 模块级筛选（上限 5 个，见决策 13）
- **Sidebar** = 页面级（随当前 Tab 动态切换）

详细展开见 ADR frontend-0025（三层导航哲学）。

**理由**：中大型企业后台通常需要「切系统、切模块、切页面」三个层级；合并到一层会让任何一层都不够用。分开的三层每层都有明确的认知负载上限（系统数量 ≤ 9，模块 ≤ 5，页面按 Sidebar 容量）。

**影响面**：新增 `HeaderTabSwitcher` / `useActiveModule` / `SystemSwitcher`（九宫格占位）；现有 Sidebar 接入 `useActiveModule` hook 做动态切换。

### 决策 5：新增 3 个 Layout Preset（Q5）

**问题**：Claude Design 的三种 Layout 变体（Classic / Inset / Rail）如何并入现有 Preset Registry？

**决策**：新增 `claude-classic` / `claude-inset` / `claude-rail` 三个 preset，统一加 `claude-` 前缀避免与现有 `inset` preset 命名冲突。Registry 最终包含 5 个 preset（原 `default` + 原 `inset` + 新 3 个）。

**理由**：meta-build 已有的 `inset` preset 和 Claude Design 的 `inset` 视觉不同（meta-build 的 `inset` 来自 ADR-0017，是 mix × lark-console 的 sidebar 内嵌布局），直接复用会引起歧义。`claude-` 前缀明确区分来源。

**影响面**：`app-shell/src/presets/` 新增 3 个 preset 定义；PresetRegistry 白名单扩 5 项；LayoutResolver 支持新 preset。

### 决策 6：claude-warm style 的 theme 映射（Q6）

**问题**：claude-warm 的 light 和 dark 具体用哪套 token？

**决策**：新增 1 个 Style `claude-warm`，内部分两档：

- **light** = Claude Design 的 claude warm tokens（warm neutrals + 暖色系 primary）
- **dark** = Claude Design 的 midnight tokens（深蓝紫主调）

不做 slate 或其他变体。

**理由**：Claude Design 原型里 warm + midnight 已是成熟配对，slate 是原型里的冷调替代选项但视觉完成度不如 warm/midnight，留 slate 只会增加 token 维护负担。

**影响面**：`tokens/semantic-claude-warm.css` 一个文件覆盖 light + dark 两套（通过 `[data-color-mode="dark"]` 选择器区分），对齐 classic / lark-console 的文件组织。

### 决策 7：密度维度重命名 + 圆角保留代号（Q7）

**问题**：现有 scale 维度（xs / default / lg）与 Claude Design 的 compact / default / comfortable 如何对齐？

**决策**：重命名现有 scale 维度：

- `xs` → `compact`
- `default` → `default`（保持）
- `lg` → `comfortable`

三档数值对齐 Claude Design `tokens.css`。Label 走 i18n：中文「紧凑 / 默认 / 舒适」、英文「Compact / Default / Comfortable」。

**圆角维度保留 SM / MD / LG 代号**，因为 SM/MD/LG 是行业通用的 size scale 语言（Tailwind / shadcn / Material 都用），无需重命名。

**理由**：`xs/lg` 是 T-shirt size 命名，语义弱；`compact/comfortable` 是密度语义命名，用户能直觉理解。Claude Design 的命名本身就是这套语义，对齐降低切换成本。

**影响面**：Customizer 面板 label 变更；localStorage 中已存的 `mb_scale=xs` 需要一次性迁移映射；所有消费 scale token 的组件不受影响（CSS 变量名不变，只变用户可见 label）。

### 决策 8：Codex 做过的 IAM 4 页推翻重写（Q8）

**问题**：Codex 此前做的 user / dept / role / menu 4 页是否复用？

**决策**：直接删除 Codex 的 4 个页面，按 Claude Design 源码 100% 复刻为 members / roles / menus 3 页（合一后少了独立 user 页，见决策 1）。MSW mock handler 保留复用，但页面 UI 层全部重写。属于 Plan B 范围。

**理由**：Codex 的实现基于旧设计方向，视觉质量、交互密度、组件结构都和 Claude Design 有明显差距；增量修改成本超过重写成本。Mock 层是后端契约的模拟，与 UI 无关，无需推翻。

**影响面**：Plan B 删除 `features/user/` `features/dept/` `features/role/` `features/menu/` 共 4 个目录；新增 `features/members/` `features/roles/` `features/menus/` 3 个目录。

### 决策 9：九宫格「系统」v1 硬编码占位（Q9）

**问题**：九宫格系统切换器（切财务 / CRM / 快递）如何实现？

**决策**：v1 前端硬编码占位：配置文件放在 `web-admin/src/config/systems.ts`，图标出现在 Topbar 最右侧，点击展开悬浮框显示系统列表，但不做真实跳转（点击后只是视觉反馈，实际路由不变）。不引入「系统」这一后端抽象。

**理由**：v1 只有一套 meta-build 后台，九宫格是对未来扩展的视觉预留。引入后端「系统」表 / API 是过度工程化——v1.5 有真实多系统需求时再做抽象，现在保留 UI 入口就够了。

**影响面**：`src/config/systems.ts` 新增 + `SystemSwitcher` 组件实现（Topbar 集成）；后端零改动。

### 决策 10：菜单数据模型零改动（Q10）

**问题**：三层导航架构要求「模块」这一概念，现有 `mb_iam_menu` 表是否需要改结构？

**决策**：数据模型零改动。`mb_iam_menu` 现有的 `parent_id` 自引用 + `menu_type` 足够表达三层结构：顶层节点（`parent_id=null`）天然作为「模块」，UI 由 layout 决定呈现方式（Tab / 九宫格 / Sidebar 一级节点都是同一数据的不同渲染）。

**理由**：菜单树本身就是递归结构，加「模块」层反而破坏一致性。UI 层通过 `useActiveModule` hook 读取顶层节点 id 做筛选，纯前端逻辑，后端无感。

**影响面**：后端零改动；前端 Sidebar 数据源改为按「当前 Tab 对应的顶层节点」筛选其子树。

### 决策 11：L3 图表组件不下沉 + L3 沉淀原则（Q11）

**问题**：Dashboard 的 StatCard / Sparkline / LineChart / BarChart / ActivityFeed 是否下沉到 `@mb/ui-patterns`？

**决策**：全部放页面私有目录 `features/dashboard/components/`，不下沉到 L3。

**衍生原则**：L1、L2 是**设计出来的**（自上而下契约，需提前设计），L3 是**沉淀出来的**（业务实战中多次复用后提炼）。单次使用就下沉到 L3 是过度抽象。详见新增规则文档 `docs/rules/l3-sedimentation-principle.md`。

**理由**：图表组件 Dashboard 页目前仅 1 个消费者，尚未形成「多业务复用」的证据。下沉后反而要考虑 API 通用性、配置灵活度，增加维护成本。等第 2、第 3 个消费者出现时再沉淀更健康。

**影响面**：Dashboard 图表全部在 `features/dashboard/components/` 下实现；`@mb/ui-patterns` 不新增组件；新增 rules 文件 `docs/rules/l3-sedimentation-principle.md`。

### 决策 12：groups 和 invoices 不做（Q12）

**问题**：Claude Design 原型里的 groups（用户组）和 invoices（发票）是否实现？

**决策**：都不落地到 meta-build。视为参考样本，未来有需求时再去原型或源码里抄组件或布局。

**理由**：groups 与 meta-build 当前的角色权限模型语义重叠（group 可用 role 表达）；invoices 是跨境电商业务域的内容，不属于平台底座范围。v1 不做 = 不加维护负担。

**影响面**：路由无 `/groups` `/invoices`；菜单无对应项；Plan 范围收敛。

### 决策 13：Header Tab 初始 3 个（Q13）

**问题**：Header Tab 初始放几组？

**决策**：初始 3 个 Tab：

1. **组织管理**（iam：members / roles / menus 等）
2. **内容**（business-notice；未来 business-order / business-approval / 使用者业务模块）
3. **产品设置**（platform 工具类：config / dict / file / job / log / monitor / notification）

Customizer 面板独立于 Tab，放 Topbar 右侧调色板图标 popover，不占用 Tab 槽位。

**理由**：3 个 Tab 覆盖当前所有模块，且保留 2 个扩展位（决策 4 定的上限 5 个）。Customizer 是元控制面板（控制整个后台的外观），与业务 Tab 不是同一级别，分离更清晰。

**影响面**：`web-admin/src/config/header-tabs.ts` 新增，定义 3 个 Tab + 各自对应的顶层菜单 id；Customizer 作为 Topbar 独立图标实现。

### 决策 14：偏好持久化继续用 localStorage（Q14）

**问题**：Style / ColorMode / scale / radius / Preset / lang 等用户偏好是否需要同步到后端 UserSettings？

**决策**：全部继续 localStorage 存储，不做后端同步。

**理由**：v1 阶段使用者都是单设备单浏览器场景，跨设备同步需求弱；引入后端 UserSettings 表需要 schema + API + 冲突合并策略，对 v1 ROI 太低。v1.5 如有多端需求再补。

**影响面**：现有 Customizer / ColorMode / i18n 存储逻辑保持；后端零改动。

## 理由

**为什么一次性把 14 项决策汇总为一个 ADR 而不是拆 14 份**：这 14 个决策是同一次对齐讨论的结果，彼此交叉引用（例如 Q1 的用户管理合并影响 Q8 的 IAM 页推翻重写，Q4 的三层导航影响 Q5 的 preset 数量和 Q13 的 Tab 数量）。拆成 14 份 ADR 会让使用者反复跳转，且每份 ADR 孤立看都不完整。汇总在一份里反而符合「一次决策一份 ADR」的初衷。

**为什么把三层导航拆到 ADR frontend-0025 独立展开**：决策 4 本身是一句话定义，但背后的哲学（为什么需要三层？每层的认知负载上限？每层的职责边界？）值得单独成文。本 ADR 只锁决策，frontend-0025 展开论证。

**为什么 claude-warm 是新默认而不是可选**：meta-build v1 的对外展示样本应该是最高完成度的版本，Claude Design 原型在视觉上已经优于 lark-console v3，default style 跟随视觉最优原则才能给使用者最好的第一印象。

## 影响

### 正面影响

- 14 项决策一次性冻结，Plan A / B / C 执行期间不再反复讨论方向性问题
- 新增 1 style + 3 preset 扩充了定制维度（style × preset = 3 × 5 = 15 种组合）
- IAM 3 页推翻重写让 meta-build 对外展示样本的视觉质量一次性拉齐 Claude Design
- L3 沉淀原则固化（决策 11 衍生），避免未来反复出现「单次使用就下沉」的过度抽象

### 代价

- Plan B 推翻 Codex 做过的 4 页，沉没成本
- claude-warm + 3 preset + 九宫格占位 + HeaderTabSwitcher 一次性新增工作量集中在 Plan A
- `check-theme-integrity.ts` 的 style 数从 2 扩到 3，token 总量从 140 扩到 210
- localStorage 存储的 `mb_scale=xs` 需要一次性迁移映射（旧值 xs → 新值 compact）

### 已知限制（本次不处理）

- 九宫格系统切换在 v1 仅占位，真实多系统路由推迟到 v1.5+
- 偏好后端同步推迟到 v1.5+
- Claude Design 的 groups / invoices 模块不做，未来如有类似需求再单独评估

## 如何验证

- Plan A 完成后：所有现有页面在 `claude-warm × (claude-classic / claude-inset / claude-rail)` 下可渲染无报错
- Plan A 完成后：`check-theme-integrity.ts` 通过（3 style × 70 token × 2 color-mode）
- Plan A 完成后：Customizer 的 scale label 显示为「紧凑 / 默认 / 舒适」（中文环境）或「Compact / Default / Comfortable」（英文环境）
- Plan B 完成后：IAM 3 页（members / roles / menus）视觉对齐 Claude Design 源码
- Plan C 完成后：Dashboard / Auth / Profile / 错误页对齐
- CI 绿灯 + 跨 style 视觉回归截图通过

## 关联 ADR

- [ADR-0016](0016-前端主题系统从theme切换到style加color-mode与customizer.md)（Style / ColorMode / Customizer）：扩展（claude-warm 成为新默认）
- [ADR-0017](0017-app-shell从固定布局切换到layout-resolver加preset-registry.md)（Layout Resolver + Preset Registry）：扩展（Registry 从 2 preset 扩到 5 preset）
- [ADR-0020](0020-feishu-rename-to-lark-console-and-token-expansion.md)（lark-console + 70 token 扩展）：扩展（claude-warm 作为第三个 style 同等提供 70 core token × 2 ColorMode）
- ADR frontend-0025（三层导航哲学）：本 ADR 的 Q4 决策详细展开
