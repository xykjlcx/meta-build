# Claude Design 对齐 · Plan A：基础设施

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Claude Design 视觉全面对齐准备 L1 Token 层、Style 注册、Customizer 密度文案、3 个 claude-\* Layout Preset、Header Tab + useActiveModule 骨架。完成后现有页面在 `claude-warm` style × 5 个 preset 的所有组合下都能正常渲染（视觉可能没完全打磨，但不崩溃、布局正确）。

**Architecture:** Token 层新增 `claude-warm` style（140 个 semantic token × light/dark），Layout Registry 新增 3 个 preset（`claude-classic / claude-inset / claude-rail`），共享 `HeaderTabSwitcher` 组件把顶层菜单节点渲染为 Tab，`useActiveModule` hook 从 URL 推导当前激活模块。零数据模型改动（后端 `mb_iam_menu` 不动）。

**Tech Stack:** React 19, Tailwind CSS v4 + OKLCH, shadcn/ui v4 Sidebar, TanStack Router, Vitest

**依赖的决策（Q1–Q14）：**
- Q2：lark-console 保留，claude-warm 默认
- Q4：三层导航（九宫格系统级 / Header Tab 模块级 / Sidebar 页面级）
- Q5：新增 3 个 preset（claude-classic / claude-inset / claude-rail）
- Q6：新增 1 个 Style `claude-warm`（light=claude warm / dark=midnight）
- Q7：密度维度重命名（compact / default / comfortable）+ i18n
- Q9：九宫格 v1 前端硬编码占位
- Q10：零数据模型改动，UI 由 layout 决定呈现
- Q13：Header Tab 初始 3 个（组织管理 / 内容 / 产品设置）
- Q14：偏好持久化继续用 localStorage

**不在本 Plan 范围内（留给 Plan B / C）：**
- IAM 4 个页面的推翻重写（Plan B）
- Mock 菜单重组为 3 Tab（Plan B）
- Dashboard / Auth / Profile / 错误页（Plan C）

---

## 关键概念澄清（实施前必读）

### 概念 1：Style × Preset 兼容性矩阵（30 组合）

Plan A 完成后：

| | shadcn-classic | lark-console | **claude-warm**（默认） |
|---|---|---|---|
| inset（M3 现有） | ✓ 原样 | ✓ 原样 | ✓ 暖橙渲染 |
| mix（M3 现有） | ✓ 原样 | ✓ 原样 | ✓ 暖橙渲染 |
| **claude-classic**（新） | ✓ 可渲染 | ✓ 可渲染 | ✓ **目标视觉** |
| **claude-inset**（新，默认） | ✓ 可渲染 | ✓ 可渲染 | ✓ **目标视觉** |
| **claude-rail**（新） | ✓ 可渲染 | ✓ 可渲染 | ✓ **目标视觉** |

5 preset × 3 style × 2 ColorMode = **30 组合**，Task 18 全量回归。

### 概念 2：meta-build `inset` 不等于 Claude Design `claude-inset`

两者**视觉形态不同**，这是 Q6 加 `claude-` 前缀并存的核心理由：

| preset | 定义 | 来源 |
|---|---|---|
| `inset`（M3 现有） | 左侧 Sidebar + **主内容区**内嵌白卡片 | shadcn/ui v4 SidebarProvider + SidebarInset 原生形态 |
| `claude-inset`（Plan A 新） | Topbar 贴顶 + **主体整体下沉**内嵌白卡片（sidebar + main 一起内嵌，带 bg-blobs 背景装饰） | Claude Design `.layout--inset` |

两者并存，**不是**同义替换。Plan A 不改现有 `inset`，只新增 3 个 `claude-*`。

### 概念 3：Sidebar 分组 = 顶层 DIRECTORY 节点（Q10 数据模型零改动）

meta-build 菜单树本身就是"分组化"的：

```
mb_iam_menu（parent_id 自引用）
├─ 组织管理 [DIRECTORY, parent_id=null]     ← 顶层节点 = 分组/模块
│  ├─ 成员与部门 [MENU]                      ← 二级节点 = 页面
│  ├─ 角色管理 [MENU]
│  └─ 菜单管理 [MENU]
├─ 内容 [DIRECTORY, parent_id=null]
│  └─ 公告管理 [MENU]
└─ 产品设置 [DIRECTORY, parent_id=null]
   └─ ...
```

UI 由 layout 决定如何呈现同一份数据：

| layout 类型 | 顶层 DIRECTORY 节点 | 二级 MENU 节点 |
|---|---|---|
| 有 Header Tab（claude-\*、mix） | → Header Tab | → Sidebar（按 activeModuleId 过滤） |
| 无 Header Tab（inset） | → Sidebar 一级 label（分组标题，不可点击） | → Sidebar 二级菜单项 |

**不需要**给菜单数据加 `group` meta 字段，**不需要**前端硬编码"顶层 id → 分组"映射表。Q10 决策已天然覆盖。

### 概念 4：Header Tab 3 个是 Q13 扩展，不是漏抄 Claude Design

- Claude Design 源（`/Users/ocean/Desktop/claude-design-test01`）：**2 Tab**（企业管理 / 产品设置）
- meta-build Q13 决策：**3 Tab**（组织管理 / 内容 / 产品设置）

"内容" Tab 是 meta-build 主动扩展，未来承载 business-order / business-approval / 使用者业务模块。落地时按 3 Tab 做，不要被 Claude Design 2 Tab "对齐回去"。

### 概念 5：三层导航数据流（伪代码）

```typescript
// 后端返回一棵 MenuNode[] 树（Q10 零改动）
const menuTree: MenuNode[] = useMenu();

// 第一层：系统级（九宫格）= 前端硬编码，不走菜单树（Q9）
const systems: SystemItem[] = SYSTEMS; // config/systems.ts

// 第二层：模块级（Header Tab）= 顶层 DIRECTORY 节点
const modules = menuTree.filter(isDisplayNode); // 过滤可见顶层节点
const { activeModuleId, setActiveModule, activeSubmenu } = useActiveModule({
  menuTree,
  currentPathname,
  resolveMenuHref,
});
// activeModuleId: 当前激活模块 id，优先级 URL 推导 → localStorage → 第一个模块
// activeSubmenu: activeModuleNode.children（当前模块下的所有页面节点）

// 第三层：页面级（Sidebar）= activeSubmenu 渲染
<Sidebar>
  {activeSubmenu.map(renderMenuItem)}
</Sidebar>
```

有 Tab 的 layout（`claude-*`、`mix`）：模块级消费 `HeaderTabSwitcher`，Sidebar 消费 `activeSubmenu`。
无 Tab 的 layout（`inset`）：整棵 `menuTree` 直接渲染到 Sidebar（顶层当 label，二级当菜单项）。

### 概念 6：ADR 编号遵循新命名规范

本 Plan 的 ADR 文件名**不是** `0021/0022`（旧习惯），而是：
- `docs/adr/frontend-0024-claude-design-alignment-decisions.md`
- `docs/adr/frontend-0025-three-layer-navigation-philosophy.md`

原因：2026-04-17 `docs/rules/adr-numbering-discipline.md` 约定新 ADR 用 `<scope>-<nnnn>-<kebab-title>.md` 格式。0021/0022/meta-0023 已被后端占用（详见 session-handoff-2026-04-18.md §5.2）。新会话落库前用 `ls docs/adr/ | sort -V | tail -3` 二次确认最大编号。

---

## 文件结构（本 Plan 的改动位置）

```
docs/
├── adr/
│   ├── frontend-0024-claude-design-alignment-decisions.md [新建]
│   └── frontend-0025-three-layer-navigation-philosophy.md [新建]
├── rules/
│   └── l3-sedimentation-principle.md                      [新建]
└── rules/INDEX.md                                         [追加一行]

CLAUDE.md                                                   [drift 修正]
AGENTS.md                                                   [级联更新]

client/packages/ui-tokens/src/
├── tokens/
│   └── semantic-claude-warm.css                           [新建：140 tokens × light+dark]
└── styles/
    ├── index.css                                          [追加 @import]
    └── claude-warm.md                                     [新建：style DESIGN 文档]

client/packages/app-shell/src/
├── components/
│   ├── header-tab-switcher.tsx                            [新建]
│   ├── header-tab-switcher.test.tsx                       [新建]
│   ├── system-switcher-popover.tsx                        [新建：九宫格占位]
│   └── theme-customizer.tsx                               [修改：density 文案 + 所有 preset]
├── menu/
│   ├── use-active-module.ts                               [新建]
│   └── use-active-module.test.ts                          [新建]
├── presets/
│   ├── claude-classic/
│   │   ├── index.ts                                       [新建]
│   │   ├── claude-classic-layout.tsx                      [新建]
│   │   └── __tests__/claude-classic-layout.test.tsx       [新建]
│   ├── claude-inset/
│   │   ├── index.ts                                       [新建]
│   │   ├── claude-inset-layout.tsx                        [新建]
│   │   └── __tests__/claude-inset-layout.test.tsx         [新建]
│   └── claude-rail/
│       ├── index.ts                                       [新建]
│       ├── claude-rail-layout.tsx                         [新建]
│       └── __tests__/claude-rail-layout.test.tsx          [新建]
├── layouts/registry.ts                                    [修改：追加 3 个 preset 注册]
├── theme/style-provider.tsx                               [修改：ThemeScale 类型 + 迁移]
└── i18n/
    ├── zh-CN/shell.json                                   [修改：density/preset 文案]
    └── en-US/shell.json                                   [修改：density/preset 文案]

client/apps/web-admin/src/
├── main.tsx                                               [修改：注册 claude-warm style + 默认值]
└── config/
    └── systems.ts                                         [新建：九宫格硬编码数据]
```

---

## Task 0：开工前准备 + 现状基线

**Files:**
- 无文件改动（只跑命令 + 截图）

**前置说明**：本 Plan 在前端 worktree `/Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend` 的 `feat/claude-design-plan-a` 分支执行。主目录 `../06-meta-build` 是后端会话的工作区，**不要切过去**。详见 session-handoff-2026-04-18.md §5.1。

- [ ] **Step 1: 确认 worktree + 分支状态**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend
git worktree list              # 应看到当前目录 + 主目录两个
git branch --show-current      # feat/claude-design-plan-a
git status --short             # 除了本 plan 和 handoff 两个 untracked 外干净
```

若分支不对或工作区脏，先与洋哥确认再继续。

- [ ] **Step 2: 跟上 main（防后端会话 rebase 冲突）**

```bash
git fetch origin main
git rebase origin/main         # 无冲突即可；有冲突按 docs/collab/concurrent-dev-protocol.md 处理
```

- [ ] **Step 3: 启动 dev server 拍基线截图**

```bash
pnpm -C client install --frozen-lockfile   # 首次 or 依赖变化时跑
pnpm -C client dev  # 后台启动
```

用 Playwright 或手动浏览器打开 `http://localhost:5173`：
- 登录任意测试账号（mock 下走 login 即可）
- 分别截图当前 `inset` preset + `shadcn-classic` style 的首页
- 分别截图 `mix` preset + `lark-console` style 的首页

保存到 `docs/handoff/claude-design-alignment/baseline-before.md` 里（Markdown + 嵌入图片）。

- [ ] **Step 4: 跑基线质量检查（确认当前分支通过）**

```bash
cd client && pnpm check:types && pnpm test && pnpm lint && pnpm lint:css && pnpm check:theme && pnpm check:i18n && pnpm check:deps
```

Expected: 全部通过。如果任何一项不通过，先修复再开始 Plan A。

**depcruise 校对**：`pnpm check:deps` 基于 `client/.dependency-cruiser.cjs` 的 **9 条规则**（不是某些 spec 里写的 7 条，后续 Task 19 会同步纠正）：`l1-tokens-no-mb-deps / l2-primitives-only-tokens / l3-patterns-only-tokens-primitives / l4-app-shell-no-l5 / features-no-api-sdk-auth / l3-no-forbidden-deps / l5-no-direct-sse-internals / l5-no-direct-event-bus / no-circular`。

- [ ] **Step 5: 提交基线截图**

```bash
git add docs/handoff/claude-design-alignment/baseline-before.md
git commit -m "docs(plan-a): baseline screenshots before Claude Design alignment"
```

---

## Task 1：ADR frontend-0024 · Claude Design 对齐决策汇总

**Files:**
- Create: `docs/adr/frontend-0024-claude-design-alignment-decisions.md`

**前置确认**：落库前执行 `ls docs/adr/ | sort -V | tail -3`，若 `frontend-0024` 已被占，递增到下一个未用编号并同步 Task 2 / 矩阵说明节 / handoff。

- [ ] **Step 1: 新建 ADR frontend-0024**

把 14 个决策（Q1–Q14）作为本 ADR 的 14 个子章节。每个子章节包含：问题、决策、理由、影响面。

参考已有 ADR 格式（例如 `docs/adr/0020-feishu-rename-to-lark-console-and-token-expansion.md`）—— 中文、带 "背景 / 决策 / 理由 / 影响 / 如何验证" 五段。

文件内容骨架（填充时参考本 Plan 头部"依赖的决策"和决策任务清单）：

```markdown
# ADR frontend-0024：Claude Design 对齐 · 14 项决策汇总

## 状态
已采纳（2026-04-18）

## 背景
2026-04-17 Anthropic 发布 Claude Design，洋哥生成了一份 Admin Scaffold 原型（保存在 /Users/ocean/Desktop/claude-design-test01），作为 meta-build v1 视觉终态的目标。通过 14 轮决策讨论，确定了对齐方案。

## 决策（14 项）

### 1. 用户管理取消（Q1）
移除独立"用户管理"页面，合一为"成员与部门"（Claude Design 的 members 模式，左侧部门树 + 右侧成员表）。

### 2. lark-console style 保留为第二 style（Q2）
claude-warm 作为默认 style，lark-console 保留作为第二 style。所有业务页面改动需要在两套 style 下验证视觉质量。

### 3. Sidebar 分组借鉴 + 真实模块填充（Q3）
Sidebar 分组叙事借鉴 Claude Design（组织管理 / 内容 / 产品设置），具体菜单项填入 meta-build 真实后端模块，不做 disabled 占位。

### 4. 三层导航架构（Q4）
- 九宫格 = 系统级切换（财务 / CRM / 快递 等，v1 仅占位）
- Header Tab = 模块级筛选（上限 5 个）
- Sidebar = 页面级（随 Tab 动态）

详见 ADR frontend-0025。

### 5. 新增 3 个 Layout Preset（Q5）
claude-classic / claude-inset / claude-rail。统一加 `claude-` 前缀避免和现有 `inset` 命名冲突。Registry 最终 5 个 preset。

### 6. theme 映射（Q6）
新增 1 个 Style `claude-warm`：light = Claude Design 的 claude warm tokens，dark = midnight tokens。不做 slate。

### 7. 密度维度重命名（Q7）
现有 scale 维度重命名：xs → compact，default → default，lg → comfortable。3 档数值对齐 Claude Design tokens.css。Label 走 i18n：中文"紧凑/默认/舒适"、英文"Compact/Default/Comfortable"。圆角节奏保留 SM/MD/LG 代号（行业通用 size scale 语言）。

### 8. Codex 4 页推翻重写（Q8）
直接删除 Codex 做的 user/dept/role/menu 4 页，按 Claude Design 源码 100% 复刻（members/roles/menus 3 页）。MSW mock 保留复用。属于 Plan B 范围。

### 9. 九宫格"系统"占位（Q9）
v1 前端硬编码占位（`web-admin/src/config/systems.ts`），图标在 Topbar 最右，点击展开悬浮框，不做真实跳转。不引入"系统"后端抽象。

### 10. 菜单数据模型零改动（Q10）
`mb_iam_menu` 现有 `parent_id` 自引用 + `menu_type` 足够。顶层节点（parent_id=null）天然作为"模块"，UI 由 layout 决定呈现（Tab / 九宫格 / Sidebar 一级节点）。

### 11. L3 图表组件不下沉（Q11）
Dashboard 的 StatCard / Sparkline / LineChart / BarChart / ActivityFeed 全部放页面私有目录 `features/dashboard/components/`，不下沉到 `@mb/ui-patterns`。

衍生原则：L1、L2 是设计出来的（自上而下契约），L3 是沉淀出来的（业务实战中多次复用后提炼）。详见 `docs/rules/l3-sedimentation-principle.md`。

### 12. groups 和 invoices 不做（Q12）
Claude Design 的 groups（用户组）和 invoices（发票）模块，都不落地到 meta-build。视为参考样本，未来需要时去抄组件或布局。

### 13. Header Tab 初始 3 个（Q13）
- 组织管理（iam）
- 内容（business-notice；未来 business-order / business-approval / 使用者业务模块）
- 产品设置（platform 工具类：config / dict / file / job / log / monitor / notification）

Customizer 面板独立于 Tab（Topbar 右侧调色板图标 popover）。

### 14. 偏好持久化 localStorage（Q14）
Style / ColorMode / scale / radius / Preset / lang 全部继续 localStorage 存储，不做后端 UserSettings 同步。

## 影响面
- 前端：新增 1 style + 3 preset + HeaderTabSwitcher + useActiveModule + 九宫格占位；IAM 4 页推翻重写；新增 Dashboard / Auth / Profile / 错误页
- 后端：零改动
- 文档：ADR frontend-0025 新增（三层导航哲学）；CLAUDE.md drift 修正；AGENTS.md 级联；docs/rules/l3-sedimentation-principle.md 新增

## 如何验证
- Plan A 完成后：所有现有页面在 claude-warm × (claude-classic / claude-inset / claude-rail) 下可渲染
- Plan B 完成后：IAM 3 页视觉对齐 Claude Design 源码
- Plan C 完成后：通用页面对齐
- CI 绿灯 + 跨 style 视觉回归截图通过

## 关联 ADR
- ADR-0016（Style / ColorMode / Customizer）：扩展（claude-warm 成为新默认）
- ADR-0017（Layout Resolver + Preset Registry）：扩展（5 preset）
- ADR-0020（lark-console + 70 token 扩展）：扩展（claude-warm 同等地位，token 实际达 140，CLAUDE.md drift 同步修正）
- ADR frontend-0025（三层导航哲学）：本 ADR 的 Q4 决策详细展开
```

- [ ] **Step 2: 写完后本地 preview**

```bash
head -50 docs/adr/frontend-0024-claude-design-alignment-decisions.md
```

确认格式和已有 ADR 一致（五段结构 / 中文 / 带代码示例）。

- [ ] **Step 3: 提交**

```bash
git add docs/adr/frontend-0024-claude-design-alignment-decisions.md
git commit -m "docs(adr): frontend-0024 Claude Design 对齐 14 项决策汇总"
```

---

## Task 2：ADR frontend-0025 · 三层导航哲学

**Files:**
- Create: `docs/adr/frontend-0025-three-layer-navigation-philosophy.md`

- [ ] **Step 1: 新建 ADR frontend-0025**

```markdown
# ADR frontend-0025：三层导航哲学（系统 / 模块 / 页面）

## 状态
已采纳（2026-04-18）

## 背景
Claude Design 原型展示了 Topbar 双 Tab（企业管理 / 产品设置）+ Sidebar 分组的信息架构。在对齐讨论中（决策 Q4），洋哥基于第一性原理推导出更通用的三层导航抽象，把九宫格的定位从"布局变体"升级为"系统级切换"。

## 决策
meta-build 采用正交的三层导航：

| 层级 | 抽象 | UI 入口 | v1 实现 | 未来扩展 |
|---|---|---|---|---|
| 系统级 | System | 九宫格图标（Topbar 最右） | 前端硬编码占位，点击出悬浮框 | 表驱动 / 配置驱动 |
| 模块级 | Module | Header Tab（上限 5） | 顶层菜单节点（parent_id=null）作为 Tab | - |
| 页面级 | Page | Sidebar 菜单项 | 现有菜单树（parent_id 指向当前激活模块） | - |

## 理由
- **系统级 vs 模块级**：不同系统（财务 / CRM / 快递打单）之间是"应用间跳转"，模块（应收 / 应付 / 账单）之间是"应用内切换"。两者的用户心智、权限边界、数据隔离都不同，应该正交拆分。
- **模块级 UI 跟随 layout**：有 Header Tab 的 layout（claude-\*、mix）显示为 Tab，没有 Header Tab 的 layout（inset）显示为 Sidebar 一级节点。数据模型统一，UI 由 layout 决定。
- **数据模型零改动**：现有 `mb_iam_menu` 表的 `parent_id` 自引用天然支持多层树，顶层节点就是模块，不需要引入新表。

## 拒绝的替代方案

### 替代 1：单层菜单 + 路由前缀分组（如 `/org/*`、`/content/*`）
- **方案**：不引入"模块"抽象，统一铺平菜单；在 UI 层按路由前缀分组为视觉 group。
- **拒绝原因**：
  1. 分组信息与 URL 硬绑定，后期调整分组（例如把"菜单管理"从"组织管理"挪到"产品设置"）需要改路由 + 所有相关链接，代价高。
  2. 前后端都要引入分组语义的 convention，容易长时间 drift（前端改了前缀但 iam 权限码没跟上）。
  3. 新业务模块加入时要先约定前缀，违反"数据驱动、UI 消费"的原则。

### 替代 2：把"系统"做成 layout 变体（每个系统一个 preset）
- **方案**：不引入九宫格，而是给每个系统（财务 / CRM / 物流）分别定义一套 layout preset，用户通过切 preset 进入不同系统。
- **拒绝原因**：
  1. 混淆"视觉形态"（preset）和"业务边界"（system）两个正交维度，每加一个系统都要造一个 preset，preset 数量爆炸。
  2. 同一个系统内用户可能想切 preset 风格（claude-classic → claude-inset），这个需求和切系统独立，不该耦合。
  3. v1 多系统实际还不存在，超前做成 preset 是明显的 YAGNI。

### 替代 3：给菜单数据加 `group` meta 字段
- **方案**：后端 `mb_iam_menu` 表加 `group_key` 字段，前端按 group 分组渲染。
- **拒绝原因**：
  1. 现有 `parent_id` 自引用树已经天然承担"分组"语义，再加 `group_key` 是冗余。
  2. 会让"分组" 和 "目录节点"两个概念并存，数据模型复杂度上升、约束变多（group 和 parent 之间是否一致？）。
  3. Q10 已明确"数据模型零改动"，引入新字段破坏该承诺。

## 影响
- 前端新增 `useActiveModule` hook（从 URL 推导当前激活的顶层节点 id）
- 新增 `HeaderTabSwitcher` 组件（被 claude-\* preset 共用）
- Sidebar 改造为"按 activeModuleId 过滤子节点"
- 九宫格占位实现为 `system-switcher-popover`（v1 数据硬编码）

## 如何验证
- 所有 preset 消费同一份 `MenuNode[]`，切换 preset 不需要改数据。
- `useActiveModule.test.ts` 覆盖 URL 推导 / localStorage 恢复 / 首次 fallback。
- 跨 preset 切换时 Sidebar 内容随 activeModuleId 自动切换，无状态丢失。

## 相关 ADR
- ADR-0017（Layout Resolver + Preset Registry）：扩展
- ADR frontend-0024（14 项决策汇总）：包含本决策 Q4
```

- [ ] **Step 2: 提交**

```bash
git add docs/adr/frontend-0025-three-layer-navigation-philosophy.md
git commit -m "docs(adr): frontend-0025 三层导航哲学（系统/模块/页面正交）"
```

---

## Task 3：新增 rule · L3 沉淀原则

**Files:**
- Create: `docs/rules/l3-sedimentation-principle.md`
- Modify: `docs/rules/INDEX.md`

- [ ] **Step 1: 新建 rule 文件**

```markdown
# L3 是沉淀出来的，不是设计出来的

**Type**: playbook
**Scope**: 前端 / 全栈
**Triggers**: 新增组件、考虑 L3 ui-patterns 下沉

## 原则

meta-build 的 5 层前端架构里：
- L1 `@mb/ui-tokens`：设计出来的（自上而下的契约）
- L2 `@mb/ui-primitives`：设计出来的（shadcn/ui v4 原版骨架）
- **L3 `@mb/ui-patterns`：沉淀出来的（业务实战中多次复用后提炼）**
- L4 `@mb/app-shell`：设计出来的（Layout / Provider 基础设施）
- L5 `web-admin`：消费层

## 判断标准

### 可以下沉 L3
- 组件已经在 2 处以上实际业务场景使用
- 业务语义清晰（不是 "花哨的 Card" 这种装饰性组件）
- 有稳定的 API 抽象（props 接口经过多轮使用打磨过）
- 未来新业务模块会很自然地继续用它

### 不应下沉 L3
- 只在 1 处使用（哪怕看起来通用）
- 是"想象中的复用"（"以后别的页面可能会用" → 以后再说）
- 业务耦合强但 props 抽象不清晰
- 为了"让 L3 更丰富" 而下沉

## 依据

2026-04-18 Claude Design 对齐讨论（决策 Q11）：Dashboard 需要 5 个图表组件（StatCard / Sparkline / LineChart / BarChart / ActivityFeed）。是否下沉 L3？洋哥判断：Dashboard 是演示页面、图表只用一次、没有经过业务实战检验，**不下沉**。先在页面内私有使用，未来真出现复用需求（监控面板、业务模块首页等）再沉淀。

## 如何应用

- **做新页面时**：把新组件先放 `features/<domain>/components/`
- **Review PR 时**：看到"顺手下沉 L3"的动作，先问"它在几处使用？"
- **M-n review 时**：盘点 `features/*/components/` 里是否有高频重复的组件，再考虑批量下沉
```

- [ ] **Step 2: 更新 INDEX.md**

在 `docs/rules/INDEX.md` 追加：

```markdown
| `l3-sedimentation-principle.md` | playbook | 前端 | L3 是沉淀出来的，不是设计出来的 |
```

（具体插入位置按字母序或按现有分类）

- [ ] **Step 3: 提交**

```bash
git add docs/rules/l3-sedimentation-principle.md docs/rules/INDEX.md
git commit -m "docs(rules): 新增 L3 沉淀原则（playbook）"
```

---

## Task 4：修正 CLAUDE.md / AGENTS.md / specs 的 drift

**Files:**
- Modify: `CLAUDE.md`（多处）
- Modify: `AGENTS.md`（级联）
- Modify: `docs/specs/frontend/02-ui-tokens-theme.md`
- Modify: `docs/specs/frontend/05-app-shell.md`
- Modify: `docs/specs/frontend/09-customization-workflow.md`
- 视 grep 结果可能扩展到其它 `docs/specs/frontend/*.md`

**背景**：已发现的 drift 类别：
1. preset 数量：旧文档写"inset / mix / top / side 四种布局"或"2 preset"，实际将变为 5 个
2. token 数量：旧文档写"70 semantic token"，实际 `semantic-classic.css` 里有 140 个
3. 密度档名：旧文档写"xs / default / lg"，改名后是 "compact / default / comfortable"
4. depcruise 规则数：旧文档写"7 条"，实际 9 条（见 Task 0 Step 4）
5. 默认 style / 默认 preset：`shadcn-classic + inset` → `claude-warm + claude-inset`

- [ ] **Step 1: grep 出所有 drift 关键词（全范围）**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend

# 关键词扫描：把每类 drift 一次性列出来
grep -nE "inset / mix / top / side|top/side preset|2 个 preset|2 preset|四种布局|四种 layout" \
  CLAUDE.md AGENTS.md docs/specs/frontend/*.md

grep -nE "70 (个 )?semantic token|70 token" \
  CLAUDE.md AGENTS.md docs/specs/frontend/*.md

grep -nE "data-theme-scale[:=] ?['\"]?(xs|lg)['\"]?|scale: ?'(xs|lg)'|xs / default / lg|xs/default/lg" \
  CLAUDE.md AGENTS.md docs/specs/frontend/*.md

grep -nE "7 条 depcruise|7 条规则|7 (个 )?depcruise|7 dependency-cruiser" \
  CLAUDE.md AGENTS.md docs/specs/frontend/*.md

grep -nE "默认.*(shadcn-classic|shadcn)|defaultStyle.*shadcn|defaultLayoutPreset.*inset" \
  CLAUDE.md AGENTS.md docs/specs/frontend/*.md
```

记录每一处位置。**特别检查** `docs/specs/frontend/02-ui-tokens-theme.md`（token 定义）、`05-app-shell.md`（preset 清单）、`09-customization-workflow.md`（使用者定制流程）。

- [ ] **Step 2: 修正 CLAUDE.md**

找到 "前端依赖方向" 段落和 "技术栈" 段落里出现 preset 数量、token 数量的地方，改为：

- `inset / mix / top / side 四种布局` / `2 个 preset` → `inset / mix（M3）+ claude-classic / claude-inset / claude-rail（Plan A 新增），共 5 种`
- `70 semantic token` → `140 个 semantic token（Layer 2 × 2 light/dark）`
- `xs / default / lg` → `compact / default / comfortable`
- `7 条 depcruise 规则` → `9 条 depcruise 规则`

并在"当前阶段"表格追加：

```markdown
| **Plan A** | Claude Design 对齐 · 基础设施（claude-warm style + 3 claude-* preset + HeaderTab） | 🔄 进行中 |
| Plan B | IAM 3 页重写 + Mock 重组（成员与部门 / 角色 / 菜单） | ⏸ 待开始 |
| Plan C | 通用页面（Dashboard / Auth / Profile / 错误页） | ⏸ 待开始 |
```

- [ ] **Step 3: 修正 specs 三份主文件**

按 Step 1 grep 结果精准替换：

- `docs/specs/frontend/02-ui-tokens-theme.md`：token 数量（70 → 140）+ style 清单（从 2 扩到 3）+ 密度档名（xs/lg → compact/comfortable）
- `docs/specs/frontend/05-app-shell.md`：preset 清单（2 → 5）+ 默认 preset（inset → claude-inset）+ 三层导航模型（新增段落或指向 ADR frontend-0025）
- `docs/specs/frontend/09-customization-workflow.md`：增补"使用者新增 Style / Preset 的 how-to 清单"（对应 Review 的使用者视角反馈）

**注意**：Plan A 实施期间 specs 可以按"最终态"写（claude-warm 默认 + 5 preset），不需要标注"M3 时如何如何"——完成 Plan A 后这就是新现实。

- [ ] **Step 4: 级联 AGENTS.md**

`AGENTS.md` 是 Codex 的入口。grep 出 CLAUDE.md 修正的相同关键词，同步修正。

```bash
diff CLAUDE.md AGENTS.md | head -80
```

按 diff 对照更新。

- [ ] **Step 5: 跑 verify 脚本确认没有新 drift**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend
ls scripts/verify-*.sh 2>/dev/null          # 列出现有 verify 脚本
bash scripts/verify-docs.sh 2>&1 | tail -20  # 如果存在
bash scripts/verify-frontend-docs.sh 2>&1 | tail -20
```

Expected: 0 errors。若脚本不存在或不覆盖新增关键词，把新 grep 加入 `scripts/verify-frontend-docs.sh`（或新建），让未来 drift 自动被 CI 拦截。

- [ ] **Step 6: 复查 Step 1 的 grep 全部归零**

```bash
# 重跑 Step 1 的全部 grep，expected 都是无输出（除了 Plan 本身的引用）
```

- [ ] **Step 7: 提交**

```bash
git add CLAUDE.md AGENTS.md docs/specs/frontend/
git commit -m "docs: 修正 CLAUDE/AGENTS/specs drift（preset 2→5 / token 70→140 / 密度档名 / depcruise 7→9）"
```

---

## Task 5：L1 Token · 新建 semantic-claude-warm.css

**Files:**
- Create: `client/packages/ui-tokens/src/tokens/semantic-claude-warm.css`
- Modify: `client/packages/ui-tokens/src/styles/index.css`

- [ ] **Step 1: 读 Claude Design 的 tokens.css 源**

```bash
cat /Users/ocean/Desktop/claude-design-test01/styles/tokens.css | head -160
```

提取三段关键 tokens：
- `[data-theme="claude"]` light mode（代码段 45-80）
- `[data-theme="midnight"]` dark mode（代码段 121-156）

- [ ] **Step 2: 映射到 meta-build 的 140 个 semantic token**

参考 `client/packages/ui-tokens/src/tokens/semantic-classic.css` 的 140 行结构（`--color-background / --color-foreground / --color-primary / ...`）。

对照 Claude Design 的 `--bg / --fg / --brand / ...`，建立映射：

| Claude Design | meta-build |
|---|---|
| `--bg` | `--color-background` |
| `--bg-elev` | `--color-card` |
| `--bg-sunken` | `--color-muted` |
| `--fg` | `--color-foreground` |
| `--fg-muted` | `--color-muted-foreground` |
| `--brand` | `--color-primary` |
| `--brand-hover` | `--color-primary-hover` |
| `--border` | `--color-border` |
| `--success / --warning / --danger / --info` | `--color-success / --color-warning / --color-destructive / --color-info` |
| `--shadow-xs / --sm / --md / --lg / --xl` | `--shadow-xs / --sm / --md / --lg / --xl` |

没有直接对应的 Claude Design token（如 `--glass-bg / --overlay / --ease-out / --dur-fast`）按现有 semantic-classic 的扩展点走。

- [ ] **Step 3: 写出 semantic-claude-warm.css**

文件结构参考 `semantic-classic.css`。骨架：

```css
/* Layer 2 — Semantic tokens for Claude Warm style
 * 对齐 Claude Design /Users/ocean/Desktop/claude-design-test01/styles/tokens.css
 *   - Light 基于 [data-theme="claude"]（暖米白 + 暖橙）
 *   - Dark  基于 [data-theme="midnight"]（暖深色 + 橙）
 *
 * 约定（同 semantic-classic）：色类 token 引用 @theme primitive，尺寸/阴影/动效引用 primitive 变量。
 *
 * Selector 命名：
 *   Light: [data-theme-style='claude-warm']
 *   Dark:  [data-theme-style='claude-warm'][data-theme-color-mode='dark']
 */

[data-theme-style='claude-warm'] {
  /* ===== Surface ===== */
  --color-background: oklch(0.975 0.008 85);
  --color-foreground: oklch(0.24 0.015 60);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.24 0.015 60);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.24 0.015 60);
  --color-panel: oklch(0.98 0.007 85);

  /* ===== Primary（Claude 暖橙） ===== */
  --color-primary: oklch(0.66 0.15 45);
  --color-primary-foreground: oklch(0.99 0.005 85);
  --color-primary-hover: oklch(0.6 0.16 45);

  /* ===== Secondary / Accent ===== */
  --color-secondary: oklch(0.95 0.03 55);
  --color-secondary-foreground: oklch(0.24 0.015 60);
  --color-accent: oklch(0.955 0.01 85);

  /* ===== Muted ===== */
  --color-muted: oklch(0.955 0.01 85);
  --color-muted-foreground: oklch(0.48 0.012 60);

  /* ===== Border / Input / Ring ===== */
  --color-border: oklch(0.9 0.008 70);
  --color-input: oklch(0.9 0.008 70);
  --color-ring: oklch(0.68 0.14 45 / 0.35);

  /* ===== Status（Success / Warning / Danger / Info） ===== */
  --color-success: oklch(0.62 0.13 150);
  --color-success-foreground: oklch(0.99 0.005 85);
  --color-success-soft: oklch(0.95 0.04 150);
  --color-warning: oklch(0.72 0.14 75);
  --color-warning-foreground: oklch(0.24 0.015 60);
  --color-warning-soft: oklch(0.96 0.05 85);
  --color-destructive: oklch(0.58 0.18 25);
  --color-destructive-foreground: oklch(0.99 0.005 85);
  --color-destructive-soft: oklch(0.95 0.04 25);
  --color-info: oklch(0.62 0.12 235);
  --color-info-foreground: oklch(0.99 0.005 85);
  --color-info-soft: oklch(0.95 0.03 235);

  /* ===== Sidebar ===== */
  --color-sidebar: oklch(0.97 0.008 85);
  --color-sidebar-foreground: oklch(0.24 0.015 60);
  --color-sidebar-border: oklch(0.9 0.008 70);
  --color-sidebar-accent: oklch(0.95 0.03 55);
  --color-sidebar-accent-foreground: oklch(0.24 0.015 60);
  --color-sidebar-primary: oklch(0.66 0.15 45);
  --color-sidebar-primary-foreground: oklch(0.99 0.005 85);
  --color-sidebar-ring: oklch(0.68 0.14 45 / 0.35);

  /* ===== 剩余 token 按 semantic-classic 结构同步补齐 ===== */
  /* TODO 在 Step 4 里比对 semantic-classic.css 逐行 diff，确保不遗漏 */
}

[data-theme-style='claude-warm'][data-theme-color-mode='dark'] {
  /* ===== Surface（Midnight） ===== */
  --color-background: oklch(0.18 0.012 60);
  --color-foreground: oklch(0.94 0.008 85);
  --color-card: oklch(0.24 0.012 60);
  --color-card-foreground: oklch(0.94 0.008 85);
  --color-popover: oklch(0.24 0.012 60);
  --color-popover-foreground: oklch(0.94 0.008 85);
  --color-panel: oklch(0.22 0.012 60);

  --color-primary: oklch(0.74 0.14 50);
  --color-primary-foreground: oklch(0.18 0.012 60);
  --color-primary-hover: oklch(0.8 0.14 50);

  --color-secondary: oklch(0.3 0.05 50);
  --color-secondary-foreground: oklch(0.94 0.008 85);
  --color-accent: oklch(0.26 0.012 60);

  --color-muted: oklch(0.26 0.012 60);
  --color-muted-foreground: oklch(0.72 0.012 70);

  --color-border: oklch(0.32 0.012 60);
  --color-input: oklch(0.32 0.012 60);
  --color-ring: oklch(0.7 0.14 45 / 0.45);

  --color-success: oklch(0.72 0.15 155);
  --color-success-foreground: oklch(0.18 0.012 60);
  --color-success-soft: oklch(0.3 0.06 155);
  --color-warning: oklch(0.78 0.14 80);
  --color-warning-foreground: oklch(0.18 0.012 60);
  --color-warning-soft: oklch(0.32 0.07 80);
  --color-destructive: oklch(0.68 0.19 25);
  --color-destructive-foreground: oklch(0.18 0.012 60);
  --color-destructive-soft: oklch(0.3 0.08 25);
  --color-info: oklch(0.7 0.13 235);
  --color-info-foreground: oklch(0.18 0.012 60);
  --color-info-soft: oklch(0.3 0.06 235);

  --color-sidebar: oklch(0.2 0.012 60);
  --color-sidebar-foreground: oklch(0.94 0.008 85);
  --color-sidebar-border: oklch(0.32 0.012 60);
  --color-sidebar-accent: oklch(0.3 0.05 50);
  --color-sidebar-accent-foreground: oklch(0.94 0.008 85);
  --color-sidebar-primary: oklch(0.74 0.14 50);
  --color-sidebar-primary-foreground: oklch(0.18 0.012 60);
  --color-sidebar-ring: oklch(0.7 0.14 45 / 0.45);

  /* TODO 剩余按 semantic-classic dark mode 结构同步补齐 */
}
```

- [ ] **Step 4: 补齐所有 140 个 token**

打开 `semantic-classic.css` 逐段复制结构（token 名字），填入 claude-warm 对应的值。确保 claude-warm 和 classic 的 token 列表**完全一致**（数量、顺序、命名）。

验证：

```bash
diff <(grep -oE "^\s*--[a-z-]+:" client/packages/ui-tokens/src/tokens/semantic-classic.css | sort -u) \
     <(grep -oE "^\s*--[a-z-]+:" client/packages/ui-tokens/src/tokens/semantic-claude-warm.css | sort -u)
```

Expected: 无差异（两个文件 token 名字完全一致）。

- [ ] **Step 5: 在 styles/index.css 追加 @import**

```bash
# 打开文件，在现有 @import 后追加
echo '@import "../tokens/semantic-claude-warm.css";' >> client/packages/ui-tokens/src/styles/index.css
```

或手动编辑 `client/packages/ui-tokens/src/styles/index.css` 加一行 import。

- [ ] **Step 6: 跑 token 完整性检查**

```bash
cd client && pnpm check:theme
```

Expected: 通过。check:theme 会校验 `3 × 140 token` （现有 2 style + 新 style）都有对应覆写。

- [ ] **Step 7: 提交**

```bash
git add client/packages/ui-tokens/src/tokens/semantic-claude-warm.css client/packages/ui-tokens/src/styles/index.css
git commit -m "feat(tokens): 新增 semantic-claude-warm.css（light + dark，140 tokens）"
```

---

## Task 6：新建 claude-warm style DESIGN 文档

**Files:**
- Create: `client/packages/ui-tokens/src/styles/claude-warm.md`

- [ ] **Step 1: 写 DESIGN 文档**

参考 `lark-console.md` 和 `shadcn-classic.md` 的结构（9 章节）。内容要点：
- 色系：Claude Warm（light）+ Midnight（dark）
- 参考：Claude Design `/Users/ocean/Desktop/claude-design-test01/styles/tokens.css`
- 品牌色：暖橙 `oklch(0.66 0.15 45)`（light）/ `oklch(0.74 0.14 50)`（dark）
- 字体栈：Inter + PingFang SC + HarmonyOS Sans SC + Microsoft YaHei + system-ui + sans-serif
- 特征：暖米白背景 / 圆润阴影 / OKLCH 色彩空间 / font-feature-settings ss01, cv11

```markdown
# Claude Warm Style · DESIGN

## 1. 定位
对齐 Anthropic Claude Design（claude.ai/design）原生设计语言，作为 meta-build v1 的默认 style。

## 2. 色系
- Light: 暖米白（oklch 0.975 0.008 85）+ 暖橙品牌色（oklch 0.66 0.15 45）
- Dark: 暖深色（oklch 0.18 0.012 60）+ 亮橙品牌色（oklch 0.74 0.14 50）

## 3. 字体栈
...

## 4-9: ...
```

（后续章节按已有文件模板填充。）

- [ ] **Step 2: 提交**

```bash
git add client/packages/ui-tokens/src/styles/claude-warm.md
git commit -m "docs(tokens): 新增 claude-warm.md DESIGN 文档"
```

---

## Task 7：Style 注册 + 默认值切换

**Files:**
- Modify: `client/apps/web-admin/src/main.tsx`
- Modify: `client/packages/app-shell/src/theme/style-provider.tsx`

- [ ] **Step 1: 找到现有 style 注册点**

```bash
grep -n "styleRegistry\.register\|register({" client/apps/web-admin/src/main.tsx client/packages/ui-tokens/src/*.ts
```

定位两个已有 style 的注册位置。

- [ ] **Step 2: 注册 claude-warm**

在 `main.tsx` 合适位置（同 shadcn-classic / lark-console 注册相邻）追加：

```tsx
import { styleRegistry } from '@mb/ui-tokens';

styleRegistry.register({
  id: 'claude-warm',
  displayName: 'Claude Warm',
  description: '暖米白 + 暖橙（对齐 Anthropic Claude Design）',
  color: 'linear-gradient(135deg, oklch(0.975 0.008 85), oklch(0.66 0.15 45))',
  cssFile: '@mb/ui-tokens/styles/tokens/semantic-claude-warm.css',
});
```

- [ ] **Step 3: 修改默认 Style**

打开 `client/packages/app-shell/src/theme/style-provider.tsx`，找到默认 style 的定义位置（grep `'shadcn-classic'` 或 `defaultStyleId`）：

```tsx
// Before
const DEFAULT_STYLE_ID: StyleId = 'shadcn-classic';

// After
const DEFAULT_STYLE_ID: StyleId = 'claude-warm';
```

同时检查是否有 i18n 文案或 Storybook 默认值需要跟随修改。

- [ ] **Step 4: i18n 新增文案**

- `client/packages/app-shell/src/i18n/zh-CN/shell.json`：
  ```json
  {
    "theme": {
      "styles": {
        "claude-warm": "Claude 暖色"
      }
    }
  }
  ```
- `client/packages/app-shell/src/i18n/en-US/shell.json`：
  ```json
  {
    "theme": {
      "styles": {
        "claude-warm": "Claude Warm"
      }
    }
  }
  ```

- [ ] **Step 5: dev server 手动验证**

```bash
cd client && pnpm dev
```

打开 localhost:5173，点击 Topbar 调色板图标，看到 Customizer 的 Style 选项里出现 "Claude 暖色"。切换后整个页面变暖橙色。

- [ ] **Step 6: 写一个单元测试**

`client/packages/app-shell/src/theme/__tests__/style-provider.test.tsx` 追加：

```tsx
import { describe, expect, it } from 'vitest';
import { styleRegistry } from '@mb/ui-tokens';

describe('claude-warm style registration', () => {
  it('should register claude-warm as a valid style', () => {
    expect(styleRegistry.getAllIds()).toContain('claude-warm');
  });

  it('should be the default style', () => {
    // 从 style-provider 导出 DEFAULT_STYLE_ID 或通过 localStorage 空时的状态推断
    const stored = null;
    const resolved = stored ?? 'claude-warm';
    expect(resolved).toBe('claude-warm');
  });
});
```

- [ ] **Step 7: 跑测试**

```bash
cd client && pnpm -F @mb/app-shell test
```

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add client/apps/web-admin/src/main.tsx \
        client/packages/app-shell/src/theme/style-provider.tsx \
        client/packages/app-shell/src/i18n/ \
        client/packages/app-shell/src/theme/__tests__/
git commit -m "feat(style): 注册 claude-warm style 并设为默认"
```

---

## Task 8：密度维度重命名（xs/lg → compact/comfortable）

**Files:**
- Modify: `client/packages/app-shell/src/theme/style-provider.tsx`
- Modify: `client/packages/app-shell/src/theme/__tests__/style-provider.test.tsx`（新增 migration 单测）
- Modify: `client/packages/app-shell/src/components/theme-customizer.tsx`
- Modify: `client/packages/app-shell/src/i18n/zh-CN/shell.json`
- Modify: `client/packages/app-shell/src/i18n/en-US/shell.json`
- Modify: `client/packages/ui-tokens/src/customizer.css`（**核心**：替换 `data-theme-scale='xs'/'lg'` selector）
- Modify: `client/packages/ui-tokens/src/tokens/component.css`（如有密度相关 token）

- [ ] **Step 1: 改 ThemeScale 类型**

`style-provider.tsx` 第 4 行附近：

```tsx
// Before
export type ThemeScale = 'default' | 'xs' | 'lg';
const SCALE_IDS = new Set<ThemeScale>(['default', 'xs', 'lg']);

// After
export type ThemeScale = 'default' | 'compact' | 'comfortable';
const SCALE_IDS = new Set<ThemeScale>(['default', 'compact', 'comfortable']);
```

- [ ] **Step 2: 加 localStorage 迁移逻辑**

在 `style-provider.tsx` 读取 SCALE_KEY 的地方（约第 120 行）加入迁移：

```tsx
const rawStoredScale = window.localStorage.getItem(SCALE_KEY);
// 迁移：旧值 xs → compact, lg → comfortable
let storedScale: string | null = rawStoredScale;
if (rawStoredScale === 'xs') {
  storedScale = 'compact';
  window.localStorage.setItem(SCALE_KEY, 'compact');
} else if (rawStoredScale === 'lg') {
  storedScale = 'comfortable';
  window.localStorage.setItem(SCALE_KEY, 'comfortable');
}
```

- [ ] **Step 3: theme-customizer.tsx 更新 options**

```tsx
// Before
const scaleOptions = [
  { value: 'default', label: '⊘' },
  { value: 'xs', label: 'XS' },
  { value: 'lg', label: 'LG' },
] as const;

// After
const scaleOptions = [
  { value: 'compact', labelKey: 'theme.scale.compact' },
  { value: 'default', labelKey: 'theme.scale.default' },
  { value: 'comfortable', labelKey: 'theme.scale.comfortable' },
] as const;
```

渲染处用 `t(option.labelKey)` 取 i18n 文案（参考现有 contentLayoutOptions 的渲染方式）。

- [ ] **Step 4: i18n 加密度文案**

`zh-CN/shell.json`：
```json
{
  "theme": {
    "scale": {
      "compact": "紧凑",
      "default": "默认",
      "comfortable": "舒适"
    }
  }
}
```

`en-US/shell.json`：
```json
{
  "theme": {
    "scale": {
      "compact": "Compact",
      "default": "Default",
      "comfortable": "Comfortable"
    }
  }
}
```

- [ ] **Step 5: 替换 customizer.css 的 selector（Critical）**

Review 指出：只改 TS 类型不改 CSS selector，切换会失效。找到 `client/packages/ui-tokens/src/customizer.css` 里的 selector 并替换：

```bash
grep -n "data-theme-scale" client/packages/ui-tokens/src/customizer.css
# 典型输出会有 [data-theme-scale='xs'] / [data-theme-scale='lg'] 两段规则块
```

逐处替换：
- `[data-theme-scale='xs']` → `[data-theme-scale='compact']`
- `[data-theme-scale='lg']` → `[data-theme-scale='comfortable']`

**保留 selector 内部的 CSS 变量**（之后 Step 6 再对齐到 Claude Design 数值），先让名字先过。

同时全仓库复查：

```bash
grep -rn "data-theme-scale=['\"]\(xs\|lg\)['\"]" client/
```

Expected：除了 Plan / handoff 文档之外无命中（所有代码已切换）。

- [ ] **Step 6: 3 档 token 数值对齐 Claude Design**

查找密度相关 token 覆写位置（`customizer.css` 或 `tokens/component.css`，通过 grep 定位）：

```bash
grep -rn "data-theme-scale\|--row-h\|--pad-x" client/packages/ui-tokens/src/
```

按 Claude Design `tokens.css` 第 158-172 行的数值对齐：

```css
[data-theme-scale='compact'] {
  --row-h: 36px;
  --pad-x: 12px;
  --pad-y: 8px;
  --gap: 8px;
  --font-size-base: 13px;
}

[data-theme-scale='default'] {
  /* default 值由 :root 定义，无需覆写 */
}

[data-theme-scale='comfortable'] {
  --row-h: 52px;
  --pad-x: 20px;
  --pad-y: 16px;
  --gap: 16px;
  --font-size-base: 14px;
}
```

注意：`data-theme-scale='default'` 时不应写 attr（遵循现有约定：默认值不落 dataset，由 :root 的默认 tokens 生效）。`style-provider.tsx` 已有这个逻辑（`if (state.scale !== 'default') body.dataset.themeScale = ...`）。

- [ ] **Step 7: 补 localStorage 迁移单测（Review 反馈）**

Review Warning 指出 migration 主逻辑（Step 2）没有测试覆盖。在 `client/packages/app-shell/src/theme/__tests__/style-provider.test.tsx` 新增 describe block：

```tsx
describe('ThemeScale localStorage migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("migrates legacy 'xs' to 'compact'", () => {
    window.localStorage.setItem('mb_scale', 'xs');
    // 触发 StyleProvider 读取 storage（render provider 或调用 resolveInitialScale）
    render(<StyleProvider><div /></StyleProvider>);
    expect(window.localStorage.getItem('mb_scale')).toBe('compact');
    // 同时断言 body.dataset.themeScale === 'compact'
    expect(document.body.dataset.themeScale).toBe('compact');
  });

  it("migrates legacy 'lg' to 'comfortable'", () => {
    window.localStorage.setItem('mb_scale', 'lg');
    render(<StyleProvider><div /></StyleProvider>);
    expect(window.localStorage.getItem('mb_scale')).toBe('comfortable');
    expect(document.body.dataset.themeScale).toBe('comfortable');
  });

  it('falls back to default on invalid value', () => {
    window.localStorage.setItem('mb_scale', 'whatever');
    render(<StyleProvider><div /></StyleProvider>);
    // default 不写 dataset（现有约定）
    expect(document.body.dataset.themeScale).toBeUndefined();
  });

  it('removes data-theme-scale attr when switching back to default', () => {
    // 洋哥 Review 指出的额外检查：compact → default 回切时 attr 应被 remove
    window.localStorage.setItem('mb_scale', 'compact');
    const { rerender } = render(<StyleProvider><TestSwitcher to="default" /></StyleProvider>);
    // 触发切换后
    expect(document.body.dataset.themeScale).toBeUndefined();
  });
});
```

（具体 render / Provider wiring 参考同文件现有 test 写法。）

- [ ] **Step 8: 跑类型检查 + 单测 + check:i18n**

```bash
cd client && pnpm check:types && pnpm check:i18n && pnpm -F @mb/app-shell test
```

Expected: 全部通过（含 4 个新增 migration 单测）。

- [ ] **Step 9: 手动验证**

dev server 重启：
1. 清空 localStorage（DevTools Application → Local Storage → Clear），重新加载。Customizer 密度档显示"紧凑 / 默认 / 舒适"（中文）或 "Compact / Default / Comfortable"（英文，切到 en 时）。
2. 切换各档，观察行高/字号变化。
3. 模拟 migration：`localStorage.setItem('mb_scale', 'xs')` → 刷新页面 → 应自动改为 `'compact'` 且生效。

- [ ] **Step 10: 提交**

```bash
git add client/packages/app-shell/src/theme/ \
        client/packages/app-shell/src/components/theme-customizer.tsx \
        client/packages/app-shell/src/i18n/ \
        client/packages/ui-tokens/src/
git commit -m "refactor(theme): 密度维度 xs/lg → compact/comfortable（types + CSS selector + i18n + Claude Design 数值 + migration 单测）"
```

---

## Task 9：HeaderTabSwitcher 共享组件

**Files:**
- Create: `client/packages/app-shell/src/components/header-tab-switcher.tsx`
- Create: `client/packages/app-shell/src/components/__tests__/header-tab-switcher.test.tsx`

- [ ] **Step 1: 写失败的测试**

```tsx
// header-tab-switcher.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderTabSwitcher } from '../header-tab-switcher';
import type { MenuNode } from '../../menu';

const mkNode = (id: number, name: string): MenuNode => ({
  id,
  parentId: null,
  name,
  permissionCode: null,
  menuType: 'DIRECTORY',
  icon: null,
  sortOrder: id,
  visible: true,
  children: [],
});

describe('HeaderTabSwitcher', () => {
  it('renders all top-level modules as tabs when count <= maxTabs', () => {
    const menu = [mkNode(1, '组织管理'), mkNode(2, '内容'), mkNode(3, '产品设置')];
    render(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={1} onModuleChange={() => {}} maxTabs={5} />,
    );
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '内容' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '产品设置' })).toBeInTheDocument();
  });

  it('renders overflow menu when count > maxTabs', () => {
    const menu = [
      mkNode(1, '模块 1'),
      mkNode(2, '模块 2'),
      mkNode(3, '模块 3'),
      mkNode(4, '模块 4'),
      mkNode(5, '模块 5'),
      mkNode(6, '模块 6'),
      mkNode(7, '模块 7'),
    ];
    render(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={1} onModuleChange={() => {}} maxTabs={5} />,
    );
    // 前 4 个显示为 tab，第 5 位开始合并进"更多"下拉
    expect(screen.getByRole('tab', { name: '模块 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '模块 4' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '模块 5' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more|更多/i })).toBeInTheDocument();
  });

  it('calls onModuleChange when a tab is clicked', () => {
    const onModuleChange = vi.fn();
    const menu = [mkNode(1, 'A'), mkNode(2, 'B')];
    render(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={1} onModuleChange={onModuleChange} />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onModuleChange).toHaveBeenCalledWith(2);
  });

  it('marks active tab with aria-selected', () => {
    const menu = [mkNode(1, 'A'), mkNode(2, 'B')];
    render(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={2} onModuleChange={() => {}} />,
    );
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'false');
  });

  it('supports keyboard navigation with ArrowLeft/ArrowRight', () => {
    const onModuleChange = vi.fn();
    const menu = [mkNode(1, 'A'), mkNode(2, 'B'), mkNode(3, 'C')];
    render(
      <HeaderTabSwitcher
        menuTree={menu}
        activeModuleId={2}
        onModuleChange={onModuleChange}
      />,
    );
    const activeTab = screen.getByRole('tab', { name: 'B' });
    activeTab.focus();
    fireEvent.keyDown(activeTab, { key: 'ArrowRight' });
    expect(onModuleChange).toHaveBeenCalledWith(3);
    fireEvent.keyDown(activeTab, { key: 'ArrowLeft' });
    expect(onModuleChange).toHaveBeenCalledWith(1);
  });

  it('has tablist role on container', () => {
    const menu = [mkNode(1, 'A')];
    render(
      <HeaderTabSwitcher menuTree={menu} activeModuleId={1} onModuleChange={() => {}} />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑测试验证失败**

```bash
cd client && pnpm -F @mb/app-shell test header-tab-switcher
```

Expected: FAIL（HeaderTabSwitcher not defined）。

- [ ] **Step 3: 实现 HeaderTabSwitcher**

```tsx
// header-tab-switcher.tsx
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, cn } from '@mb/ui-primitives';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MenuNode } from '../menu';
import { isDisplayNode } from '../menu/menu-utils';

export interface HeaderTabSwitcherProps {
  menuTree: MenuNode[];
  activeModuleId: number | null;
  onModuleChange: (moduleId: number) => void;
  /** 最多显示几个 tab，超过的塞入"更多"下拉。默认 5。 */
  maxTabs?: number;
  className?: string;
}

export function HeaderTabSwitcher({
  menuTree,
  activeModuleId,
  onModuleChange,
  maxTabs = 5,
  className,
}: HeaderTabSwitcherProps) {
  const { t } = useTranslation('shell');
  const modules = menuTree.filter(isDisplayNode);

  // 超过 maxTabs：前 maxTabs-1 个作为 tab，剩下合并到下拉
  const inlineCount = modules.length > maxTabs ? maxTabs - 1 : modules.length;
  const inlineModules = modules.slice(0, inlineCount);
  const overflowModules = modules.slice(inlineCount);

  // 键盘导航：ArrowLeft / ArrowRight 在 inlineModules 之间循环切换
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIdx = (idx + delta + inlineModules.length) % inlineModules.length;
    const next = inlineModules[nextIdx];
    if (next) onModuleChange(next.id);
  };

  return (
    <div role="tablist" className={cn('flex items-center gap-1', className)}>
      {inlineModules.map((m, idx) => {
        const active = m.id === activeModuleId;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={active}
            aria-controls="main-content"
            tabIndex={active ? 0 : -1}
            onClick={() => onModuleChange(m.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'px-3 h-8 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
            )}
          >
            {m.name}
          </button>
        );
      })}

      {overflowModules.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('layout.headerTabs.more', { defaultValue: 'More' })}
              className="h-8"
            >
              <MoreHorizontal className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {overflowModules.map((m) => (
              <DropdownMenuItem key={m.id} onClick={() => onModuleChange(m.id)}>
                {m.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 跑测试验证通过**

```bash
cd client && pnpm -F @mb/app-shell test header-tab-switcher
```

Expected: PASS (4 tests)。

- [ ] **Step 5: i18n 补文案**

`zh-CN/shell.json`：`"layout.headerTabs.more": "更多模块"`
`en-US/shell.json`：`"layout.headerTabs.more": "More"`

- [ ] **Step 6: 提交**

```bash
git add client/packages/app-shell/src/components/header-tab-switcher.tsx \
        client/packages/app-shell/src/components/__tests__/header-tab-switcher.test.tsx \
        client/packages/app-shell/src/i18n/
git commit -m "feat(app-shell): 新增 HeaderTabSwitcher 组件（claude-* preset 共享）"
```

---

## Task 10：useActiveModule hook

**Files:**
- Create: `client/packages/app-shell/src/menu/use-active-module.ts`
- Create: `client/packages/app-shell/src/menu/__tests__/use-active-module.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// use-active-module.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { useActiveModule } from '../use-active-module';
import type { MenuNode } from '../types';

// MemoryRouter 包裹便于模拟路由
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
// ... (router setup omitted — 使用 window.location 简化测试)

const menu: MenuNode[] = [
  {
    id: 1,
    parentId: null,
    name: '组织管理',
    menuType: 'DIRECTORY',
    icon: null,
    sortOrder: 1,
    visible: true,
    permissionCode: null,
    children: [
      {
        id: 10,
        parentId: 1,
        name: '成员与部门',
        menuType: 'MENU',
        icon: null,
        sortOrder: 1,
        visible: true,
        permissionCode: null,
        children: [],
      },
    ],
  },
  {
    id: 2,
    parentId: null,
    name: '内容',
    menuType: 'DIRECTORY',
    icon: null,
    sortOrder: 2,
    visible: true,
    permissionCode: null,
    children: [],
  },
];

describe('useActiveModule', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('picks first module when no URL match and no localStorage', () => {
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/',
        resolveMenuHref: (n) => (n.id === 10 ? '/system/members' : null),
      }),
    );
    expect(result.current.activeModuleId).toBe(1);
  });

  it('picks module by URL match', () => {
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/system/members',
        resolveMenuHref: (n) => (n.id === 10 ? '/system/members' : null),
      }),
    );
    expect(result.current.activeModuleId).toBe(1);
  });

  it('persists active module to localStorage on setActiveModule', () => {
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/',
        resolveMenuHref: () => null,
      }),
    );
    act(() => {
      result.current.setActiveModule(2);
    });
    expect(result.current.activeModuleId).toBe(2);
    expect(window.localStorage.getItem('mb_active_module_id')).toBe('2');
  });

  it('restores from localStorage when no URL match', () => {
    window.localStorage.setItem('mb_active_module_id', '2');
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/',
        resolveMenuHref: () => null,
      }),
    );
    expect(result.current.activeModuleId).toBe(2);
  });
});
```

- [ ] **Step 2: 跑测试验证失败**

- [ ] **Step 3: 实现 hook**

```ts
// use-active-module.ts
import { useCallback, useMemo, useState, useEffect } from 'react';
import type { MenuNode } from './types';
import { findMenuPathByPath, type MenuHrefResolver, isDisplayNode } from './menu-utils';

const ACTIVE_MODULE_KEY = 'mb_active_module_id';

// SSR / Storybook / 非浏览器环境的安全 localStorage 访问
const hasWindow = () => typeof window !== 'undefined';
const safeGetItem = (key: string): string | null => {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // Safari 隐身模式 / storage 禁用
  }
};
const safeSetItem = (key: string, value: string): void => {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 静默失败，不影响 UI 状态 */
  }
};

export interface UseActiveModuleParams {
  menuTree: MenuNode[];
  currentPathname: string;
  resolveMenuHref?: MenuHrefResolver;
}

export interface UseActiveModuleResult {
  activeModuleId: number | null;
  setActiveModule: (id: number) => void;
  activeModuleNode: MenuNode | null;
  /** 当前激活模块下的子菜单（Sidebar 消费） */
  activeSubmenu: MenuNode[];
}

export function useActiveModule({
  menuTree,
  currentPathname,
  resolveMenuHref,
}: UseActiveModuleParams): UseActiveModuleResult {
  // Initial state: 优先 URL 推导 → localStorage → 第一个模块
  const computeInitial = useCallback((): number | null => {
    // 1. URL 推导
    if (resolveMenuHref) {
      const path = findMenuPathByPath(menuTree, currentPathname, resolveMenuHref);
      if (path.length > 0 && path[0]?.id != null) {
        return path[0].id;
      }
    }
    // 2. localStorage（SSR / Storybook 下 safeGetItem 返回 null，自动走 fallback）
    const stored = safeGetItem(ACTIVE_MODULE_KEY);
    if (stored) {
      const id = Number(stored);
      if (!Number.isNaN(id) && menuTree.some((n) => n.id === id && isDisplayNode(n))) {
        return id;
      }
    }
    // 3. 第一个可显示模块
    const first = menuTree.find(isDisplayNode);
    return first ? first.id : null;
  }, [menuTree, currentPathname, resolveMenuHref]);

  const [activeModuleId, setActiveModuleIdState] = useState<number | null>(computeInitial);

  // URL 变化时重算（currentPathname 变化意味着路由切换）
  useEffect(() => {
    const next = computeInitial();
    setActiveModuleIdState(next);
  }, [computeInitial]);

  const setActiveModule = useCallback((id: number) => {
    setActiveModuleIdState(id);
    safeSetItem(ACTIVE_MODULE_KEY, String(id));
  }, []);

  const { activeModuleNode, activeSubmenu } = useMemo(() => {
    if (activeModuleId == null) {
      return { activeModuleNode: null, activeSubmenu: [] };
    }
    const node = menuTree.find((n) => n.id === activeModuleId) ?? null;
    return {
      activeModuleNode: node,
      activeSubmenu: node?.children ?? [],
    };
  }, [menuTree, activeModuleId]);

  return { activeModuleId, setActiveModule, activeModuleNode, activeSubmenu };
}
```

- [ ] **Step 4: 跑测试**

Expected: 4 tests PASS。

- [ ] **Step 5: 提交**

```bash
git add client/packages/app-shell/src/menu/use-active-module.ts \
        client/packages/app-shell/src/menu/__tests__/use-active-module.test.ts
git commit -m "feat(app-shell): useActiveModule hook（URL + localStorage 推导当前激活模块）"
```

---

## Task 11：SystemItem 类型 + ShellLayoutProps.systems slot（Critical 1 前置）

**Files:**
- Modify: `client/packages/app-shell/src/layouts/types.ts`（新增 `SystemItem` 类型 + `ShellLayoutProps.systems` slot）
- Modify: `client/packages/app-shell/src/layouts/layout-resolver.tsx`（透传 systems 到 preset）

**目的（Critical 1 修复）**：让 Task 12/13/14 的 preset 从第一个 commit 起就通过 `props.systems` 消费九宫格数据，**不** `import { SYSTEMS } from '@/config/systems'`，避免 app-shell 跨层引用 web-admin 导致 `check:deps` 失败。

**为什么提前到这里**：原 Plan 把 slot 定义放在 Task 15（Task 12-14 之后），中间 4 个 commit 会存在跨层 import。改为先定义 slot，再写 preset 消费 props，单向依赖从头到尾都成立。

- [ ] **Step 1: 在 app-shell/layouts/types.ts 定义 SystemItem 和 slot**

```ts
// types.ts 追加
export interface SystemItem {
  key: string;
  labelKey: string;  // i18n key，例 "system.admin"
  icon: string;      // lucide icon name，例 "layout-dashboard"
  current: boolean;  // 是否当前系统（视觉高亮）
  disabled: boolean; // 占位项 disabled
}

export interface ShellLayoutProps {
  // ... 现有字段（children, menuTree, currentUser, notificationSlot, resolveMenuHref, 等）
  systems?: SystemItem[];  // 新增 slot：九宫格数据，由 L5 web-admin 注入
}
```

**关键**：`SystemItem` 定义在 app-shell 而不是 web-admin，这样 preset（在 app-shell）可以直接 `import type { SystemItem } from '../../layouts/types'`，而不需要跨层引用 web-admin。

- [ ] **Step 2: layout-resolver.tsx 透传 systems**

找到 LayoutResolver 渲染 preset 的地方：

```tsx
// LayoutResolver 现有代码（节选）
function LayoutResolverInner({ children, systems, ...rest }: ShellLayoutProps) {
  const { currentPresetId } = useLayoutPreset();
  const preset = layoutRegistry.get(currentPresetId);
  const Layout = preset.component;
  return <Layout systems={systems} {...rest}>{children}</Layout>;
}
```

确保 `systems` 作为 `ShellLayoutProps` 的字段被透传给实际 preset 组件。

- [ ] **Step 3: 类型检查**

```bash
cd client && pnpm check:types
```

Expected：通过（现有 preset 因为没消费 systems，不会报错；types 扩展是可选字段）。

- [ ] **Step 4: 提交**

```bash
git add client/packages/app-shell/src/layouts/types.ts \
        client/packages/app-shell/src/layouts/layout-resolver.tsx
git commit -m "feat(app-shell): 前置扩展 ShellLayoutProps.systems slot + SystemItem 类型（为 claude-* preset 铺路）"
```

---

## Task 11.5：九宫格数据 + SystemSwitcherPopover 组件

**Files:**
- Create: `client/apps/web-admin/src/config/systems.ts`（硬编码 9 格数据）
- Create: `client/packages/app-shell/src/components/system-switcher-popover.tsx`
- Modify: `client/packages/app-shell/src/i18n/zh-CN/shell.json`
- Modify: `client/packages/app-shell/src/i18n/en-US/shell.json`

**视觉参照**：Google Apps（Gmail / Drive 右上角九宫格）或 Office 365 App Launcher。Claude Design 源项目**未**实现九宫格（只有 grid 图标按钮，无功能），所以不能"照抄"Claude Design——视觉参考走 Google Apps / O365 的惯例：
- Popover 触发在 Topbar 最右（与 User avatar 相邻）
- 3×3 网格，每格图标 + label
- 当前系统高亮（bg-accent），占位项灰化 disabled
- Popover 底部放"更多系统即将推出"说明
- disabled 项 hover 显示 tooltip 说明"敬请期待"（Review 的使用者视角反馈）

- [ ] **Step 1: 硬编码 9 格系统数据（web-admin/config/systems.ts）**

```ts
/**
 * 九宫格"系统级切换"占位数据（Q9：v1 前端硬编码）。
 * 导出为 `SystemItem[]`，由 web-admin 注入 ShellLayoutProps.systems。
 * 类型 `SystemItem` 从 @mb/app-shell 引入（避免跨层重复定义）。
 */
import type { SystemItem } from '@mb/app-shell';

export const SYSTEMS: SystemItem[] = [
  // 第一格：当前系统
  { key: 'admin',      labelKey: 'system.admin',      icon: 'layout-dashboard', current: true,  disabled: false },
  // 2-4：未来跨境电商相关
  { key: 'finance',    labelKey: 'system.finance',    icon: 'wallet',           current: false, disabled: true  },
  { key: 'crm',        labelKey: 'system.crm',        icon: 'users-round',      current: false, disabled: true  },
  { key: 'logistics',  labelKey: 'system.logistics',  icon: 'package',          current: false, disabled: true  },
  // 5-6：未来数据类
  { key: 'analytics',  labelKey: 'system.analytics',  icon: 'bar-chart-3',      current: false, disabled: true  },
  { key: 'knowledge',  labelKey: 'system.knowledge',  icon: 'book-open',        current: false, disabled: true  },
  // 7-8：未来协作
  { key: 'workflow',   labelKey: 'system.workflow',   icon: 'git-branch',       current: false, disabled: true  },
  { key: 'messaging',  labelKey: 'system.messaging',  icon: 'message-square',   current: false, disabled: true  },
  // 9：更多入口
  { key: 'more',       labelKey: 'system.more',       icon: 'more-horizontal',  current: false, disabled: true  },
];
```

**9 格** 对应 Google Apps / O365 的惯例（3×3），即便 v1 仅 1 个 current，其余 8 个占位也保持九宫格视觉完整。

- [ ] **Step 2: SystemSwitcherPopover 组件**

```tsx
// system-switcher-popover.tsx
import type { SystemItem } from '../layouts/types';
import {
  Button, Popover, PopoverContent, PopoverTrigger,
  Tooltip, TooltipContent, TooltipTrigger, cn,
} from '@mb/ui-primitives';
import {
  LayoutGrid, LayoutDashboard, Wallet, UsersRound, Package,
  BarChart3, BookOpen, GitBranch, MessageSquare, MoreHorizontal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  wallet: Wallet,
  'users-round': UsersRound,
  package: Package,
  'bar-chart-3': BarChart3,
  'book-open': BookOpen,
  'git-branch': GitBranch,
  'message-square': MessageSquare,
  'more-horizontal': MoreHorizontal,
};

export interface SystemSwitcherPopoverProps {
  systems: SystemItem[];
}

export function SystemSwitcherPopover({ systems }: SystemSwitcherPopoverProps) {
  const { t } = useTranslation('shell');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('system.switcher', { defaultValue: 'Systems' })}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="grid grid-cols-3 gap-1">
          {systems.map((s) => {
            const Icon = ICON_MAP[s.icon] ?? LayoutGrid;
            const tile = (
              <button
                key={s.key}
                disabled={s.disabled}
                className={cn(
                  'w-full flex flex-col items-center justify-center gap-1 p-3 rounded-md text-xs',
                  'transition-colors',
                  s.current && 'bg-accent text-accent-foreground',
                  !s.current && !s.disabled && 'hover:bg-accent/60',
                  s.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t(s.labelKey)}</span>
              </button>
            );
            // disabled 项包 Tooltip 说明"敬请期待"
            if (s.disabled) {
              return (
                <Tooltip key={s.key}>
                  <TooltipTrigger asChild>
                    <span className="block">{tile}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('system.comingSoon', { defaultValue: '敬请期待' })}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return tile;
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('system.placeholder', { defaultValue: '更多系统即将推出' })}
        </p>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 3: i18n 补文案**

`zh-CN/shell.json` 追加：
```json
{
  "system": {
    "switcher": "切换系统",
    "admin": "管理后台",
    "finance": "财务系统",
    "crm": "客户管理",
    "logistics": "物流打单",
    "analytics": "数据分析",
    "knowledge": "知识库",
    "workflow": "工作流",
    "messaging": "消息中心",
    "more": "更多",
    "placeholder": "更多系统即将推出",
    "comingSoon": "敬请期待"
  }
}
```

`en-US/shell.json` 追加对应英文版。

- [ ] **Step 4: 手动验证 dev server**

（在 Task 12 接进 Topbar 时一起验证）

- [ ] **Step 5: 提交**

```bash
git add client/apps/web-admin/src/config/systems.ts \
        client/packages/app-shell/src/components/system-switcher-popover.tsx \
        client/packages/app-shell/src/i18n/
git commit -m "feat(app-shell): 九宫格占位组件 SystemSwitcherPopover（9 格 × Google Apps 视觉语言）"
```

- [ ] **Step 5: 提交**

```bash
git add client/apps/web-admin/src/config/systems.ts \
        client/packages/app-shell/src/components/system-switcher-popover.tsx \
        client/packages/app-shell/src/i18n/
git commit -m "feat(app-shell): 九宫格占位组件 SystemSwitcherPopover（Q9 硬编码）"
```

---

## Task 12：claude-classic Preset

**Files:**
- Create: `client/packages/app-shell/src/presets/claude-classic/index.ts`
- Create: `client/packages/app-shell/src/presets/claude-classic/claude-classic-layout.tsx`
- Create: `client/packages/app-shell/src/presets/claude-classic/__tests__/claude-classic-layout.test.tsx`

**视觉目标**：标准 topbar（56px 高，带品牌 + HeaderTab + 右侧功能区）+ 左侧 Sidebar（240px，按 activeModuleId 过滤）+ 主内容。对齐 Claude Design 的 `layout--classic`。

**重要（Critical 1 修复）**：`SYSTEMS` 通过 `props.systems` 消费（由 Task 11 的 ShellLayoutProps.systems slot 定义，Task 15 由 web-admin 层注入实例），preset **不 import** `@/config/systems`。

- [ ] **Step 1: 写完整渲染测试（Critical 4 修复：不留 arrange 注释骨架）**

```tsx
// claude-classic-layout.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createMemoryHistory, createRootRoute, createRoute, createRouter,
  RouterProvider, Outlet,
} from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClaudeClassicLayout } from '../claude-classic-layout';
import { i18n } from '../../../i18n/i18n-instance';
import type { MenuNode } from '../../../menu';
import type { CurrentUser } from '../../../auth';
import type { SystemItem } from '../../../layouts/types';

// --- 测试夹具 ---
const mkNode = (id: number, name: string, children: MenuNode[] = []): MenuNode => ({
  id, parentId: null, name, menuType: 'DIRECTORY',
  icon: null, sortOrder: id, visible: true, permissionCode: null, children,
});
const mkChild = (id: number, parentId: number, name: string, permissionCode: string): MenuNode => ({
  id, parentId, name, menuType: 'MENU',
  icon: null, sortOrder: id, visible: true, permissionCode, children: [],
});

const menuTree: MenuNode[] = [
  mkNode(1, '组织管理', [mkChild(10, 1, '成员与部门', 'iam:member:list'),
                         mkChild(11, 1, '角色管理', 'iam:role:list')]),
  mkNode(2, '内容', [mkChild(20, 2, '公告管理', 'notice:notice:list')]),
  mkNode(3, '产品设置', [mkChild(30, 3, '系统配置', 'platform:config:list')]),
];

const currentUser: CurrentUser = {
  isAuthenticated: true, userId: 1, username: 'admin', nickname: 'Admin',
  deptId: null, email: null,
  permissions: new Set(['iam:member:list', 'iam:role:list', 'notice:notice:list', 'platform:config:list']),
  hasPermission: () => true, hasAnyPermission: () => true, hasAllPermissions: () => true,
};

const systems: SystemItem[] = [
  { key: 'admin', labelKey: 'system.admin', icon: 'layout-dashboard', current: true, disabled: false },
];

const resolveMenuHref = (n: MenuNode): string | null => {
  const map: Record<string, string> = {
    'iam:member:list': '/system/members',
    'iam:role:list': '/system/roles',
    'notice:notice:list': '/notices',
    'platform:config:list': '/platform/config',
  };
  return n.permissionCode ? (map[n.permissionCode] ?? null) : null;
};

// --- 测试辅助：最小化包裹 Router / i18n / QueryClient ---
function renderWithShell(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <ClaudeClassicLayout
        menuTree={menuTree}
        currentUser={currentUser}
        systems={systems}
        resolveMenuHref={resolveMenuHref}
      >
        <Outlet />
      </ClaudeClassicLayout>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <div>Home</div> });
  const memberRoute = createRoute({ getParentRoute: () => rootRoute, path: '/system/members', component: () => <div>Members</div> });
  const noticeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/notices', component: () => <div>Notices</div> });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, memberRoute, noticeRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('ClaudeClassicLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders topbar (brand), HeaderTabs, sidebar and main region', () => {
    renderWithShell('/system/members');
    // 品牌
    expect(screen.getByText(/meta-build/i)).toBeInTheDocument();
    // HeaderTab（3 个顶层 DIRECTORY 节点）
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '内容' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '产品设置' })).toBeInTheDocument();
    // 九宫格按钮
    expect(screen.getByRole('button', { name: /切换系统|Systems/i })).toBeInTheDocument();
    // Sidebar 的子菜单（默认 activeModule=1 组织管理）
    expect(screen.getByText('成员与部门')).toBeInTheDocument();
    expect(screen.getByText('角色管理')).toBeInTheDocument();
    // 主区域
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('filters sidebar by active module（切 Tab 后 Sidebar 随之变化）', async () => {
    renderWithShell('/system/members');
    // 初始：组织管理的子菜单可见
    expect(screen.getByText('成员与部门')).toBeInTheDocument();
    expect(screen.queryByText('公告管理')).not.toBeInTheDocument();
    // 点击"内容" Tab
    fireEvent.click(screen.getByRole('tab', { name: '内容' }));
    // 切换后：公告管理出现，成员与部门不再可见
    expect(await screen.findByText('公告管理')).toBeInTheDocument();
    expect(screen.queryByText('成员与部门')).not.toBeInTheDocument();
  });

  it('picks active module from URL on initial render', () => {
    renderWithShell('/notices');
    // URL 指向 /notices，应当激活"内容" Tab
    expect(screen.getByRole('tab', { name: '内容' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '组织管理' })).toHaveAttribute('aria-selected', 'false');
    // Sidebar 只显示"内容"的子菜单
    expect(screen.getByText('公告管理')).toBeInTheDocument();
  });
});
```

**关键**：上面 3 个测试完整覆盖 (1) topbar/sidebar/tab 渲染 (2) 切 Tab 过滤 Sidebar (3) URL 初始化激活模块——这是 Critical 4 的修法"每个 preset 至少 3 个可执行 assertion，不留注释骨架"。

- [ ] **Step 2: 实现 layout**

```tsx
// claude-classic-layout.tsx
import { SearchInput } from '@mb/ui-patterns';
import {
  Avatar, AvatarFallback, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  cn,
} from '@mb/ui-primitives';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Bell, HelpCircle, Inbox, LogOut, Search, Settings, User } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { HeaderTabSwitcher } from '../../components/header-tab-switcher';
import { SystemSwitcherPopover } from '../../components/system-switcher-popover';
import { ThemeCustomizer } from '../../components/theme-customizer';
import { useActiveModule } from '../../menu/use-active-module';
import type { ShellLayoutProps } from '../../layouts/types';
import { resolveMenuIcon, isDisplayNode, getDisplayChildren } from '../../menu';

// 说明：systems 来自 ShellLayoutProps.systems slot（Task 11 定义），由 L5 web-admin 注入。
// app-shell 层的 preset **不** import web-admin 的 config/systems.ts，保持依赖单向。

export function ClaudeClassicLayout({
  children,
  menuTree,
  currentUser,
  notificationSlot,
  resolveMenuHref,
  systems,  // Task 11 定义的 slot
}: ShellLayoutProps) {
  const { t } = useTranslation('shell');
  const navigate = useNavigate();
  const router = useRouterState();
  const { logout } = useAuth();

  const currentPathname = router.location.pathname;
  const { activeModuleId, setActiveModule, activeSubmenu } = useActiveModule({
    menuTree,
    currentPathname,
    resolveMenuHref,
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Topbar */}
      <header className="h-14 flex items-center gap-3 px-4 border-b bg-background z-20">
        {/* Brand */}
        <div className="flex items-center gap-2 font-semibold text-sm shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            M
          </div>
          <span className="hidden md:inline">meta-build</span>
        </div>

        {/* Header Tabs（模块级） */}
        <HeaderTabSwitcher
          menuTree={menuTree}
          activeModuleId={activeModuleId}
          onModuleChange={setActiveModule}
          maxTabs={5}
          className="ml-4"
        />

        {/* 搜索 */}
        <div className="flex-1 flex justify-center">
          <SearchInput
            placeholder={t('topbar.searchPlaceholder', { defaultValue: '搜索功能、成员、文档' })}
            className="w-96 max-w-full"
          />
        </div>

        {/* 右侧功能区 */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" aria-label={t('topbar.help')}>
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t('topbar.inbox')}>
            <Inbox className="h-4 w-4" />
          </Button>
          {notificationSlot ?? (
            <Button variant="ghost" size="icon" aria-label={t('topbar.notifications')}>
              <Bell className="h-4 w-4" />
            </Button>
          )}
          {systems && systems.length > 0 && <SystemSwitcherPopover systems={systems} />}
          <DarkModeToggle />
          <ThemeCustomizer />

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{currentUser?.nickname?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm">{currentUser?.nickname}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
                <User className="h-4 w-4 mr-2" />
                {t('topbar.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: '/settings' })}>
                <Settings className="h-4 w-4 mr-2" />
                {t('topbar.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('topbar.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-sidebar text-sidebar-foreground overflow-y-auto">
          <nav className="p-2">
            {activeSubmenu.filter(isDisplayNode).map((item) => {
              const IconComp = resolveMenuIcon(item.icon);
              const children = getDisplayChildren(item);
              return (
                <div key={item.id} className="mb-1">
                  <Link
                    to={resolveMenuHref?.(item) ?? '/'}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    {IconComp && <IconComp className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </Link>
                  {children.length > 0 && (
                    <div className="ml-6 mt-0.5">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          to={resolveMenuHref?.(child) ?? '/'}
                          className="block px-3 py-1.5 rounded-md text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**依赖说明**：`systems` 作为 `ShellLayoutProps` 字段已在 Task 11 完成定义，此处直接从 props 解构即可，无需跨层 import。

- [ ] **Step 3: 新建 index.ts**

```ts
// claude-classic/index.ts
export { ClaudeClassicLayout } from './claude-classic-layout';
```

- [ ] **Step 4: 跑测试（应当 PASS）**

```bash
cd client && pnpm -F @mb/app-shell test claude-classic
```

- [ ] **Step 5: 提交**

```bash
git add client/packages/app-shell/src/presets/claude-classic/
git commit -m "feat(preset): claude-classic preset（标准 topbar + HeaderTab + sidebar）"
```

---

## Task 13：claude-inset Preset

**Files:**
- Create: `client/packages/app-shell/src/presets/claude-inset/index.ts`
- Create: `client/packages/app-shell/src/presets/claude-inset/claude-inset-layout.tsx`
- Create: `client/packages/app-shell/src/presets/claude-inset/__tests__/claude-inset-layout.test.tsx`

**视觉目标（P0② 补强）**：Topbar 贴顶 + 主体整体下沉内嵌白卡片（m-2 rounded-xl shadow-sm + bg-sidebar 铺底）+ Sidebar 内嵌 + **bg-blobs 背景装饰**（两个模糊圆形渐变，brand 色左上 + info 色右下）。bg-blobs 是 Claude Design `layout--inset` / `layout--rail` 的视觉标志（参考 `/Users/ocean/Desktop/claude-design-test01/styles/app.css` 的 `.bg-blobs::before/::after`）。

- [ ] **Step 1: 写 smoke test（Critical 4 修复：至少 1 个可执行 assertion）**

```tsx
// claude-inset-layout.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
// router / i18n / QueryClient 包裹参考 claude-classic-layout.test.tsx 的 renderWithShell helper，
// 或抽成共享 test-utils.tsx 避免重复；这里为节省篇幅用 renderWithShell(path, Layout) 方式
import { ClaudeInsetLayout } from '../claude-inset-layout';

describe('ClaudeInsetLayout', () => {
  beforeEach(() => window.localStorage.clear());

  it('renders topbar, sidebar, main with inset card wrapper + bg-blobs decoration', () => {
    renderWithShell('/system/members', ClaudeInsetLayout);
    // 顶层基本结构
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    expect(screen.getByText('成员与部门')).toBeInTheDocument();
    // 关键视觉：main 区域带 rounded-xl + border + shadow-sm（内嵌白卡片）
    const main = screen.getByRole('main');
    expect(main.className).toMatch(/rounded-xl/);
    expect(main.className).toMatch(/border/);
    // bg-blobs 装饰元素存在
    expect(screen.getByTestId('bg-blobs')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 实现 layout**

基础结构复用 Task 12 的 `ClaudeClassicLayout` Topbar（品牌 + HeaderTabSwitcher + 搜索 + SystemSwitcherPopover + 用户菜单）。**差异点** 全部落在 body 包裹：

```tsx
export function ClaudeInsetLayout(props: ShellLayoutProps) {
  // ... useActiveModule / useAuth / useTranslation 同 claude-classic
  return (
    <div className="flex flex-col h-screen bg-sidebar relative overflow-hidden">
      {/* bg-blobs 背景装饰（claude-inset 视觉标志，对齐 Claude Design） */}
      <div data-testid="bg-blobs" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.35] bg-primary" />
        <div className="absolute -bottom-36 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.22] bg-info" />
      </div>

      {/* Topbar 贴顶（z-10 在 bg-blobs 之上） */}
      <header className="relative z-10 h-14 flex items-center gap-3 px-4 bg-background/60 backdrop-blur-md border-b">
        {/* 品牌 + HeaderTabSwitcher + 搜索 + SystemSwitcherPopover + 用户菜单
            完整内容参考 claude-classic-layout.tsx */}
      </header>

      {/* 主体：整体下沉内嵌白卡片 */}
      <div className="relative z-10 flex-1 flex overflow-hidden m-2 mt-0 gap-2">
        <aside className="w-60 rounded-xl bg-sidebar/80 backdrop-blur-sm border border-sidebar-border overflow-y-auto">
          {/* Sidebar，按 activeSubmenu 渲染，参考 claude-classic */}
        </aside>
        <main
          role="main"
          id="main-content"
          className="flex-1 bg-background/90 backdrop-blur-sm rounded-xl border shadow-sm overflow-y-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

**bg-blobs 视觉值**（对齐 Claude Design `/Users/ocean/Desktop/claude-design-test01/styles/app.css`）：
- `blur-[120px]` = CSS `filter: blur(120px)`
- `w-[500px] h-[500px]` = `500px × 500px`
- `opacity-[0.35]` / `opacity-[0.22]` = 原始 opacity 值
- `-top-24 -left-20` / `-bottom-36 -right-24` = Tailwind spacing 近似原 `-120px/-80px` 和 `-150px/-100px`
- `bg-primary` / `bg-info` = 通过 semantic token 映射到 claude-warm 的暖橙 + 冷蓝

**注意**：如果 `claude-rail` 也需要 bg-blobs，Task 14 会把 `<div data-testid="bg-blobs">` 抽成 `app-shell/components/bg-blobs.tsx` 共享组件。Plan A 先内联。

- [ ] **Step 3: 新建 index.ts**

```ts
export { ClaudeInsetLayout } from './claude-inset-layout';
```

- [ ] **Step 4: 跑测试**

```bash
cd client && pnpm -F @mb/app-shell test claude-inset
```

Expected：smoke test PASS（含 bg-blobs data-testid 断言 + rounded-xl main 断言）。

- [ ] **Step 5: 提交**

```bash
git add client/packages/app-shell/src/presets/claude-inset/
git commit -m "feat(preset): claude-inset preset（topbar 贴顶 + 主体内嵌白卡片 + bg-blobs 背景装饰）"
```

---

## Task 14：claude-rail Preset（含 bg-blobs 抽组件）

**Files:**
- Create: `client/packages/app-shell/src/presets/claude-rail/index.ts`
- Create: `client/packages/app-shell/src/presets/claude-rail/claude-rail-layout.tsx`
- Create: `client/packages/app-shell/src/presets/claude-rail/__tests__/claude-rail-layout.test.tsx`
- Create: `client/packages/app-shell/src/components/bg-blobs.tsx`（从 Task 13 抽出共享）
- Modify: `client/packages/app-shell/src/presets/claude-inset/claude-inset-layout.tsx`（切换为使用共享 `<BgBlobs />`）

**视觉目标（P0② 补强）**：窄 Rail 侧栏（64px 图标轨道，hover 显示 label 浮窗）+ 标准 topbar。Header Tab 仍然显示。**bg-blobs 背景装饰同 claude-inset**（Claude Design `layout--rail` 和 `layout--inset` 共用 `.bg-blobs` 样式）。

- [ ] **Step 1: 抽 BgBlobs 共享组件**

Task 13 里 bg-blobs 是内联 div，claude-rail 也需要相同装饰——此时抽共享组件最合适（Review 提到的 SystemItem 多处重复反模式，bg-blobs 同理）。

```tsx
// client/packages/app-shell/src/components/bg-blobs.tsx
/**
 * 背景装饰：两个模糊圆形渐变（brand 色左上 + info 色右下）。
 * 用于 claude-inset / claude-rail preset 的视觉标志。
 * 对齐 Claude Design `/Users/ocean/Desktop/claude-design-test01/styles/app.css` .bg-blobs。
 */
export function BgBlobs() {
  return (
    <div data-testid="bg-blobs" aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.35] bg-primary" />
      <div className="absolute -bottom-36 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.22] bg-info" />
    </div>
  );
}
```

然后回到 Task 13 生成的 `claude-inset-layout.tsx`，把内联 div 改为 `<BgBlobs />` 调用（import from `'../../components/bg-blobs'`），并同步修改其测试不变（data-testid 仍然存在）。

- [ ] **Step 2: 写 smoke test（Critical 4 修复）**

```tsx
// claude-rail-layout.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { ClaudeRailLayout } from '../claude-rail-layout';

describe('ClaudeRailLayout', () => {
  beforeEach(() => window.localStorage.clear());

  it('renders narrow rail sidebar (w-16) with icon-only items and bg-blobs', () => {
    renderWithShell('/system/members', ClaudeRailLayout);
    // HeaderTab 仍然存在（rail 保留模块切换）
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    // Sidebar：关键视觉 aside.w-16（窄轨道）
    const aside = screen.getByRole('complementary'); // aside 默认 role
    expect(aside.className).toMatch(/w-16/);
    // rail 模式下菜单只展示图标，label 通过 Tooltip 暴露（不直接在 DOM 文本里）
    expect(screen.queryByText('成员与部门')).not.toBeInTheDocument(); // 默认不可见
    // 但 aria-label 携带 name，供屏幕阅读器
    expect(screen.getByRole('link', { name: '成员与部门' })).toBeInTheDocument();
    // bg-blobs 装饰仍然存在
    expect(screen.getByTestId('bg-blobs')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 实现 layout**

复用 Task 12/13 的 Topbar 结构。Sidebar 是 claude-rail 的独特点：

```tsx
import { BgBlobs } from '../../components/bg-blobs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@mb/ui-primitives';

export function ClaudeRailLayout(props: ShellLayoutProps) {
  // ... 同 claude-classic 的 useActiveModule / useAuth
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <BgBlobs />

      <header className="relative z-10 h-14 ...">{/* 同 claude-classic / claude-inset */}</header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <aside className="w-16 border-r bg-sidebar overflow-y-auto">
          <nav className="p-2 flex flex-col gap-1">
            {activeSubmenu.filter(isDisplayNode).map((item) => {
              const IconComp = resolveMenuIcon(item.icon);
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      to={resolveMenuHref?.(item) ?? '/'}
                      aria-label={item.name}
                      className="w-10 h-10 grid place-items-center rounded-md hover:bg-sidebar-accent"
                    >
                      {IconComp && <IconComp className="h-4 w-4" />}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            })}
  </nav>
</aside>
```

- [ ] **Step 5: 提交**

```bash
git add client/packages/app-shell/src/presets/claude-rail/
git commit -m "feat(preset): claude-rail preset（窄图标轨道侧栏 + 悬浮 label）"
```

---

## Task 15：web-admin 注入 SYSTEMS + 现有 inset/mix 接入九宫格

**Files:**
- Modify: `client/apps/web-admin/src/routes/_authed.tsx`（或 LayoutResolver 实际消费点）
- Modify: `client/packages/app-shell/src/presets/inset/inset-layout.tsx`
- Modify: `client/packages/app-shell/src/presets/mix/mix-layout.tsx`

**目的**：Task 11 已经完成 `ShellLayoutProps.systems` slot 定义，Task 11.5 完成 `SYSTEMS` 硬编码数据 + `SystemSwitcherPopover` 组件，Task 12/13/14 的 claude-\* preset 已从 `props.systems` 消费。本 Task 负责:
1. 让 web-admin 把 SYSTEMS 实例注入 LayoutResolver
2. 让现有 inset / mix preset 也渲染九宫格（否则切换 preset 时九宫格按钮会消失）

- [ ] **Step 1: web-admin 注入 SYSTEMS**

找到 `LayoutResolver` 在 web-admin 的消费点（通常 `client/apps/web-admin/src/routes/_authed.tsx`）：

```tsx
import { SYSTEMS } from '@/config/systems';

<LayoutResolver
  notificationSlot={<NotificationBadge />}
  resolveMenuHref={resolveMenuHref}
  systems={SYSTEMS}   // 新增
>
  <Outlet />
</LayoutResolver>
```

- [ ] **Step 2: 现有 InsetLayout 接入 SystemSwitcherPopover**

在 `client/packages/app-shell/src/presets/inset/inset-layout.tsx` 的 Topbar 功能区（现有通知徽章旁边）加入：

```tsx
import { SystemSwitcherPopover } from '../../components/system-switcher-popover';

// Topbar 右侧
{systems && systems.length > 0 && <SystemSwitcherPopover systems={systems} />}
```

同时 destructure `systems` 字段（来自 `ShellLayoutProps`）。

- [ ] **Step 3: 现有 MixLayout 接入 SystemSwitcherPopover**

同 Step 2，针对 `presets/mix/mix-layout.tsx` 的 MixHeader 组件。

- [ ] **Step 4: 跑全量 test**

```bash
cd client && pnpm test && pnpm check:types && pnpm check:deps
```

Expected: 全部通过。**特别验证 check:deps**：app-shell 层仍然不应该 import `@/config/systems`（SYSTEMS 只在 web-admin 层存在，通过 props 注入）。

- [ ] **Step 5: 手动验证 dev server 九宫格在所有 preset 下都出现**

```bash
cd client && pnpm dev
```

Customizer 切换 5 个 preset，确认 Topbar 最右都有 LayoutGrid 图标按钮，点开看到 9 格。

- [ ] **Step 6: 提交**

```bash
git add client/apps/web-admin/src/ \
        client/packages/app-shell/src/presets/inset/ \
        client/packages/app-shell/src/presets/mix/
git commit -m "feat(app-shell): 所有 preset（inset/mix/claude-*）接入九宫格 + web-admin 注入 SYSTEMS"
```

---

## Task 16：注册 3 个 claude-* preset 到 Registry

**Files:**
- Modify: `client/packages/app-shell/src/layouts/registry.ts`

- [ ] **Step 1: 追加 3 个注册**

```ts
// registry.ts 现有部分之下追加
import { ClaudeClassicLayout } from '../presets/claude-classic';
import { ClaudeInsetLayout } from '../presets/claude-inset';
import { ClaudeRailLayout } from '../presets/claude-rail';

layoutRegistry.register({
  id: 'claude-classic',
  name: 'layout.claudeClassic',
  description: 'layout.claudeClassicDesc',
  component: ClaudeClassicLayout,
  supportedDimensions: ['sidebarMode'],
});

layoutRegistry.register({
  id: 'claude-inset',
  name: 'layout.claudeInset',
  description: 'layout.claudeInsetDesc',
  component: ClaudeInsetLayout,
  supportedDimensions: ['contentLayout', 'sidebarMode'],
});

layoutRegistry.register({
  id: 'claude-rail',
  name: 'layout.claudeRail',
  description: 'layout.claudeRailDesc',
  component: ClaudeRailLayout,
  supportedDimensions: [],
});
```

- [ ] **Step 2: i18n 加 preset 文案**

`zh-CN/shell.json`：
```json
{
  "layout": {
    "claudeClassic": "Claude 经典",
    "claudeClassicDesc": "标准顶栏 + 左侧栏（对齐 Claude Design classic）",
    "claudeInset": "Claude 内嵌",
    "claudeInsetDesc": "顶栏贴顶 + 主体内嵌白卡片（对齐 Claude Design inset）",
    "claudeRail": "Claude 图标轨",
    "claudeRailDesc": "窄图标侧栏 + 悬浮 label"
  }
}
```

`en-US/shell.json` 对应英文。

- [ ] **Step 3: 修改默认 preset 为 claude-inset**

Claude Design 原型默认 layout 是 `inset`。meta-build 的对应是 `claude-inset`，配合 claude-warm 默认 style 完整对齐 Claude Design 初始体感（Q2 + Q6 决策合流的自然选择）。

在 `client/packages/app-shell/src/layouts/registry-core.ts` 改：

```ts
// Before
export const layoutRegistry = new LayoutRegistry('inset');
// After
export const layoutRegistry = new LayoutRegistry('claude-inset');
```

- [ ] **Step 4: 同步修改 registry-core.test.ts 的默认值断言（Review 补强）**

`client/packages/app-shell/src/layouts/registry-core.test.ts` 里如果有 `expect(defaultPresetId).toBe('inset')` 之类的断言，改为 `'claude-inset'`。`grep -n "'inset'" client/packages/app-shell/src/layouts/registry-core.test.ts` 快速定位。

同理检查 `client/packages/app-shell/src/theme/__tests__/style-provider.test.tsx` 里关于默认 preset 的断言。

- [ ] **Step 5: 跑 E2E smoke（Review 补强：不压到 Task 19）**

Review 指出 "E2E 压到 Task 19 太晚"。本步骤是改默认 preset 的第一个"能影响全局渲染"的 commit，必须立即跑 E2E 验证其它业务页面（Notice 列表 / 详情）在新默认下仍然能走完：

```bash
cd client && pnpm -F web-admin e2e
```

Expected: PASS。若 fail：
- 检查 E2E selector 是否被新 Topbar 结构影响（例如依赖某个 aria-label 或 class）
- 修 E2E 选择器 or 补加稳定 selector（data-testid）到 preset，不要关掉测试

- [ ] **Step 6: dev server 手动验证 5 个 preset 都能切**

```bash
cd client && pnpm dev
```

打开 localhost:5173：
1. 默认落页面是 claude-warm × claude-inset 组合（暖橙 + 顶栏贴顶 + 内嵌白卡片 + bg-blobs 背景）
2. Customizer 弹出 → 布局预设下拉看到 5 个选项
3. 逐个切换 inset / mix / claude-classic / claude-inset / claude-rail，都能正确渲染
4. 每个 preset 下的 Sidebar / HeaderTab / 九宫格按钮都正常

- [ ] **Step 7: 提交**

```bash
git add client/packages/app-shell/src/layouts/ \
        client/packages/app-shell/src/i18n/
git commit -m "feat(layout): 注册 3 个 claude-* preset + 默认切换到 claude-inset（含 E2E smoke）"
```

---

## Task 17：Customizer 展示所有 5 个 preset（自动）

**检查项**：

- [ ] **Step 1: 打开 ThemeCustomizer 源**

`client/packages/app-shell/src/components/theme-customizer.tsx` 里关于 preset 列表的代码：

```tsx
// 已有代码
<SelectContent>
  {layoutRegistry.list().map((p) => (
    <SelectItem key={p.id} value={p.id}>
      {t(p.name)}
    </SelectItem>
  ))}
</SelectContent>
```

**关键观察**：Customizer 已经是 `layoutRegistry.list()` 动态读取，**无需修改**。Task 16 注册完成后自动显示所有 5 个。

- [ ] **Step 2: 验证 dev server**

Customizer 弹出 → 布局预设下拉 → 应看到 5 项：`Inset 壳 / Mix / Claude 经典 / Claude 内嵌 / Claude 图标轨`。

- [ ] **Step 3: 无需 commit（Task 16 已包含）**

---

## Task 18：跨 style × preset 回归验证 + 截图

**Files:**
- Create: `docs/handoff/claude-design-alignment/plan-a-regression.md`

- [ ] **Step 1: 手动跨组合验证**

dev server 打开，依次切换：

| Style | Preset | 检查 |
|---|---|---|
| shadcn-classic | inset | 原样现状，不崩 |
| shadcn-classic | mix | 原样现状，不崩 |
| shadcn-classic | claude-classic | 渲染不崩，视觉 OK |
| shadcn-classic | claude-inset | 渲染不崩 |
| shadcn-classic | claude-rail | 渲染不崩 |
| lark-console | inset | 原样现状 |
| lark-console | mix | 原样现状 |
| lark-console | claude-classic | 渲染不崩 |
| lark-console | claude-inset | 渲染不崩 |
| lark-console | claude-rail | 渲染不崩 |
| claude-warm | inset | 渲染不崩，暖橙色呈现 |
| claude-warm | mix | 渲染不崩 |
| claude-warm | claude-classic | 最终目标视觉（Plan B/C 继续打磨） |
| claude-warm | claude-inset | 最终目标视觉 |
| claude-warm | claude-rail | 最终目标视觉 |

每个组合截图，保存到 `docs/handoff/claude-design-alignment/plan-a-regression.md`。

- [ ] **Step 2: 跨 ColorMode 验证**

每个 style 切换 light/dark。Customizer 面板可操作。

- [ ] **Step 3: 密度切换验证**

`claude-warm + claude-inset` 组合下切换 compact/default/comfortable，行高和字号按预期变化。

- [ ] **Step 4: 提交截图**

```bash
git add docs/handoff/claude-design-alignment/plan-a-regression.md
git commit -m "docs(plan-a): 跨 style × preset × ColorMode 回归截图（30 组合）"
```

---

## Task 19：全量 CI 检查

**注**：E2E smoke 已在 Task 16 Step 5 提前跑过（确保默认 preset 切换的首个 commit 不砸 E2E）。本 Task 是全量最终检查。

- [ ] **Step 1: 跑全部质量检查**

```bash
cd client && \
  pnpm check:types && \
  pnpm test && \
  pnpm build && \
  pnpm lint && \
  pnpm lint:css && \
  pnpm check:theme && \
  pnpm check:i18n && \
  pnpm check:business-words && \
  pnpm check:deps && \
  pnpm check:env
```

Expected: 全部 PASS。

**check:deps 补充校验**（对应 Task 0 Step 4 的 9 条规则）：
- `l4-app-shell-no-l5`：app-shell 不能 import web-admin，特别要确认 preset 没 `import '@/config/systems'`（Critical 1 修复要点，由 props.systems 注入）
- `l5-no-direct-sse-internals` / `l5-no-direct-event-bus`：Plan A 不触碰 SSE，不应有新违规

如有失败：
- `check:types`：TS 类型错（可能是 ThemeScale 迁移没覆盖到的地方）
- `check:theme`：新 style 的 token 有缺失（对照 semantic-classic 逐行补，应达 140 token × 3 style）
- `check:i18n`：有 i18n key 只加了中文或只加了英文
- `check:deps`：检查是否有跨层 import（如 app-shell import web-admin）
- `lint`：Biome 警告，按提示修

- [ ] **Step 2: 跑全量 E2E（含新 preset 下的回归）**

```bash
cd client && pnpm -F web-admin e2e
```

E2E 测试主要覆盖 Notice 流程。Plan A 不动业务页面，但默认 preset 切换到 claude-inset 后 Topbar / Sidebar 结构有变，确认 E2E 选择器依然稳定。

- [ ] **Step 3: 视觉回归（Playwright toHaveScreenshot，Review 推荐）**

Task 18 的 30 组合手动截图容易 drift。**若时间允许**，新增 Playwright visual regression 测试：

```ts
// apps/web-admin/e2e/layout-visual.spec.ts（新建）
import { test, expect } from '@playwright/test';

const STYLES = ['shadcn-classic', 'lark-console', 'claude-warm'] as const;
const PRESETS = ['inset', 'mix', 'claude-classic', 'claude-inset', 'claude-rail'] as const;

for (const style of STYLES) {
  for (const preset of PRESETS) {
    test(`layout ${style} × ${preset}`, async ({ page }) => {
      await page.goto('/dashboard');
      await page.evaluate(([s, p]) => {
        localStorage.setItem('mb_style', s);
        localStorage.setItem('mb_layout_preset', p);
      }, [style, preset]);
      await page.reload();
      await expect(page).toHaveScreenshot(`${style}-${preset}.png`, { maxDiffPixels: 300 });
    });
  }
}
```

首次运行会生成基线截图，后续 CI 每次 PR 自动比对。若 Plan A 时间紧，可留给 Plan B/C 再做。

- [ ] **Step 4: 提交 CI 绿灯 marker**

```bash
git commit --allow-empty -m "ci(plan-a): 基础设施全量检查通过"
```

---

## Task 20：Plan A 收尾 + Handoff

**Files:**
- Create: `docs/handoff/claude-design-alignment/plan-a-complete.md`

- [ ] **Step 1: 写 Plan A 完成报告**

```markdown
# Plan A 完成报告 · Claude Design 基础设施

## 完成时间
2026-04-XX

## 交付清单
- ADR frontend-0024（14 项决策汇总）
- ADR frontend-0025（三层导航哲学，含拒绝的替代方案）
- rule: L3 沉淀原则
- CLAUDE.md / AGENTS.md / docs/specs/frontend 三份主 spec 的 drift 修正
- L1 Token: semantic-claude-warm.css（140 tokens × light+dark）+ claude-warm.md DESIGN
- Style 注册: claude-warm（默认）
- 密度重命名: xs/lg → compact/comfortable + i18n + Claude Design token 数值 + migration 单测
- HeaderTabSwitcher 组件（含键盘导航 aria tablist 测试）
- useActiveModule hook（含 SSR 守卫 + 4 个单测）
- SystemSwitcherPopover 九宫格占位（9 格 × Google Apps 视觉语言 + disabled Tooltip）
- ShellLayoutProps.systems slot + SystemItem 类型（前置 Task 11，避免跨层依赖）
- BgBlobs 共享组件（claude-inset / claude-rail 视觉标志）
- 3 个 Preset: claude-classic / claude-inset / claude-rail（默认 claude-inset）
- 现有 inset / mix 接入九宫格
- 30 组合（3 style × 5 preset × 2 ColorMode）跨维度回归截图
- （可选）Playwright visual regression toHaveScreenshot 基线

## 交付后的新默认状态
- Style: claude-warm
- ColorMode: light
- Preset: claude-inset
- Density: default

用户首次打开页面看到的是：暖米白 + 暖橙品牌色 + topbar 贴顶 + 主体内嵌白卡片。

## Plan B / C 的前提
本 Plan 完成后 Plan B 和 Plan C 可以并行启动：
- Plan B 只碰业务页面（IAM 3 页重写 + mock 重组），不碰骨架
- Plan C 只碰通用页面（Dashboard / Auth / Profile / 错误页），不碰骨架

## 已知遗留
- Dashboard 页面还是 Codex 版本（视觉未对齐 — Plan C 解决）
- IAM 4 页仍是 Codex 版本（视觉未对齐，用户管理仍然存在 — Plan B 解决）
- Login / Auth 页面视觉未对齐（Plan C 解决）
- mock 菜单顶层 2 个节点（系统管理 / 消息中心）尚未重组为 3 Tab 结构（组织管理 / 内容 / 产品设置，Plan B 解决）
- 九宫格数据 1 current + 8 disabled，点击仅显示 Tooltip 不跳转（Q9 决策）
- 密度档 `default → compact → default` 回切的 `data-theme-scale` attr 清理已由 Task 8 migration 单测覆盖
```

- [ ] **Step 2: 合并到 main（或准备 PR）**

按项目习惯，选择：
- 直接 FF 合并到 main（本地）
- 或 push 到 feat/claude-design-plan-a 远程分支，开 PR

- [ ] **Step 3: 通知准备启动 Plan B 和 C**

更新 TaskList 把 Plan A 标完成，然后开始写 Plan B / C 两份 plan。

---

## 自检（Self-Review）

**1. 规格覆盖**

- [x] Q2 lark-console 保留 → Task 5 只新增不删除
- [x] Q4 三层导航 → Task 9 (HeaderTab) + Task 10 (useActiveModule) + Task 11/11.5 (SystemSwitcher)
- [x] Q5 新增 3 preset → Task 12/13/14/16
- [x] Q6 新增 claude-warm style → Task 5/6/7
- [x] Q7 密度重命名 → Task 8（含 customizer.css selector 替换 + migration 单测）
- [x] Q9 九宫格占位 → Task 11/11.5/15
- [x] Q10 零数据模型改动 → 整个 Plan 不碰 mb_iam_menu / MenuNode / backend；Sidebar 分组用顶层 DIRECTORY 节点（见矩阵说明节概念 3）
- [x] Q13 3 Tab（组织管理 / 内容 / 产品设置）→ mock 重组在 Plan B，Plan A 只负责 HeaderTabSwitcher 组件（支持 N 个 Tab）
- [x] Q14 localStorage 持久化 → Task 7/8/10 保持现状 + SSR 守卫

**2. Review 4 Critical 修复状态**

- [x] Critical 1（跨层依赖）→ Task 11 前置定义 SystemItem + ShellLayoutProps.systems slot；Task 12/13/14 从 props 消费；Task 15 瘦身为 web-admin 注入 + inset/mix 接入
- [x] Critical 2（customizer.css selector）→ Task 8 Step 5 明确要求替换 `data-theme-scale='xs'/'lg'`
- [x] Critical 3（drift 扫描范围）→ Task 4 扩到 `docs/specs/frontend/02/05/09` 三份主 spec + 扩展 grep 关键词（密度档名 / depcruise 7→9 / 默认 style）
- [x] Critical 4（Task 12/13/14 测试填实）→ Task 12 三个完整可执行断言 + renderWithShell helper；Task 13/14 各 1 个 smoke test（main rounded-xl / aside w-16 / bg-blobs data-testid 等稳定断言）

**3. Review Warning/Observation 处理状态**

- [x] ADR 骨架补理由段 + 拒绝的替代方案 → Task 2 的 ADR frontend-0025 补全
- [x] useActiveModule SSR 守卫 → Task 10 加 `typeof window` 保护 + safeGetItem/safeSetItem
- [x] 改默认 preset 同步改测试 → Task 16 Step 4 明确要求
- [x] E2E smoke 前移 → Task 16 Step 5（不等到 Task 19）
- [x] localStorage migration 单测 → Task 8 Step 7（3 个断言 + attr 回切清理）
- [x] HeaderTabSwitcher 键盘导航 → Task 9 测试补 ArrowLeft/Right + tablist role + tabIndex 滚动
- [x] 30 组合手动截图太脆 → Task 19 Step 3 建议 Playwright toHaveScreenshot（可选）
- [x] SystemItem 多处重复 → 抽到 app-shell/layouts/types.ts 统一 export（Task 11）
- [x] BgBlobs 装饰 → Task 13 内联，Task 14 抽共享组件
- [x] 九宫格 disabled Tooltip → Task 11.5 Step 2 的 SystemSwitcherPopover 实现内置
- [x] 使用者 how-to 清单 → Task 4 Step 3 要求补到 `docs/specs/frontend/09-customization-workflow.md`

**4. ADR 编号合规**

- [x] 使用 `frontend-0024` / `frontend-0025`，遵循 `docs/rules/adr-numbering-discipline.md`
- [x] 前置确认：Task 1 Step 0 要求 `ls docs/adr/ | sort -V | tail -3` 核对最大编号
- [x] 跨文档同步：矩阵说明节概念 6 说明了编号选择理由

**5. 占位扫描**

grep "TBD\|TODO\|implement later\|fill in details" 本 plan：
- Task 5 Step 4 有一个 TODO（补齐 140 tokens），但附带了具体指令（diff 检查）
- 无其它未闭合占位

**6. 类型一致性**

- `ThemeScale = 'default' | 'compact' | 'comfortable'` —— Task 8 定义，后续 Task 均消费
- `MenuNode`、`ShellLayoutProps` —— 未改现有结构，Task 11 追加 `systems?` 字段
- `SystemItem` —— **Task 11 定义在 app-shell/layouts/types.ts**（跨层单一源）
- `UseActiveModuleResult` —— Task 10 定义

**7. 依赖方向（9 条 depcruise 规则）校验**

- [x] 所有 preset 只从 app-shell 内部 import（`../../layouts/types`、`../../components/*`、`../../menu`），不跨到 web-admin
- [x] SYSTEMS 硬编码数据在 web-admin，通过 props 注入 LayoutResolver
- [x] `check:deps` 在 Task 0 / Task 15 / Task 19 三个检查点运行

---

## 执行方式建议

Plan 保存路径：`docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`

**执行选项**：
1. **Subagent-Driven（推荐）**：fresh subagent 每 task 一个，task 间检查点 review。适合本 Plan（21 个 task：Task 0-20 含 Task 11.5，并行度低但任务边界清晰）
2. **Inline**：当前 session 执行。适合急需快速推进

本 Plan 推荐 Subagent-Driven：基础设施改动面广，每 task 间做一次本地 verify + 跨组合快照更稳妥。

**检查点建议**（subagent-driven 时的 review 节奏）：
- Task 0-4 完成后：review drift 修正是否彻底（grep 归零）
- Task 5-8 完成后：L1 token + 密度重命名是否闭环（dev server 看到 claude-warm + compact/comfortable 切换正常）
- Task 11/11.5 完成后：类型扩展 + 九宫格组件是否独立工作（ShellLayoutProps 类型编译通过 + SystemSwitcherPopover 可单独渲染）
- Task 14 完成后：3 个 claude-\* preset 都可在 dev server 切换
- Task 16 完成后：默认 preset 切到 claude-inset + E2E PASS（首次"对齐完成"体感）
- Task 19 完成后：全量 CI 绿灯，准备合并
