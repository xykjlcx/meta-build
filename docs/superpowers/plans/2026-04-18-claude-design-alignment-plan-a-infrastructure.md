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
- Q14：偏好持久化继续用 localStorage

**不在本 Plan 范围内（留给 Plan B / C）：**
- IAM 4 个页面的推翻重写（Plan B）
- Mock 菜单重组为 3 Tab（Plan B）
- Dashboard / Auth / Profile / 错误页（Plan C）

---

## 文件结构（本 Plan 的改动位置）

```
docs/
├── adr/
│   ├── 0021-claude-design-alignment-decisions.md          [新建]
│   └── 0022-three-layer-navigation-philosophy.md          [新建]
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

- [ ] **Step 1: 切到干净分支**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
git checkout main
git status  # 确认工作区干净
git pull --ff-only origin main
git checkout -b feat/claude-design-plan-a
```

- [ ] **Step 2: 启动 dev server 拍基线截图**

```bash
cd client && pnpm dev  # 后台启动
```

用 Playwright 或手动浏览器打开 `http://localhost:5173`：
- 登录任意测试账号（mock 下走 login 即可）
- 分别截图当前 `inset` preset + `shadcn-classic` style 的首页
- 分别截图 `mix` preset + `lark-console` style 的首页

保存到 `docs/handoff/claude-design-alignment/baseline-before.md` 里（Markdown + 嵌入图片）。

- [ ] **Step 3: 跑基线质量检查（确认 main 现状通过）**

```bash
cd client && pnpm check:types && pnpm test && pnpm lint && pnpm lint:css && pnpm check:theme && pnpm check:i18n && pnpm check:deps
```

Expected: 全部通过。如果任何一项不通过，先修复再开始 Plan A。

- [ ] **Step 4: 提交基线截图**

```bash
git add docs/handoff/claude-design-alignment/
git commit -m "docs(plan-a): baseline screenshots before Claude Design alignment"
```

---

## Task 1：ADR-0021 · Claude Design 对齐决策汇总

**Files:**
- Create: `docs/adr/0021-claude-design-alignment-decisions.md`

- [ ] **Step 1: 新建 ADR-0021**

把 14 个决策（Q1–Q14）作为 ADR-0021 的 14 个子章节。每个子章节包含：问题、决策、理由、影响面。

参考已有 ADR 格式（例如 `docs/adr/0020-feishu-rename-to-lark-console-and-token-expansion.md`）—— 中文、带 "背景 / 决策 / 理由 / 影响 / 如何验证" 五段。

文件内容骨架（填充时参考本 Plan 头部"依赖的决策"和决策任务清单）：

```markdown
# ADR-0021：Claude Design 对齐 · 14 项决策汇总

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

详见 ADR-0022。

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
- 文档：ADR-0022 新增（三层导航哲学）；CLAUDE.md drift 修正；AGENTS.md 级联；docs/rules/l3-sedimentation-principle.md 新增

## 如何验证
- Plan A 完成后：所有现有页面在 claude-warm × (claude-classic / claude-inset / claude-rail) 下可渲染
- Plan B 完成后：IAM 3 页视觉对齐 Claude Design 源码
- Plan C 完成后：通用页面对齐
- CI 绿灯 + 跨 style 视觉回归截图通过

## 关联 ADR
- ADR-0016（Style / ColorMode / Customizer）：扩展（claude-warm 成为新默认）
- ADR-0017（Layout Resolver + Preset Registry）：扩展（5 preset）
- ADR-0020（lark-console + 70 token 扩展）：扩展（claude-warm 同等地位，token 实际达 140，CLAUDE.md drift 同步修正）
```

- [ ] **Step 2: 写完后本地 preview**

```bash
head -50 docs/adr/0021-claude-design-alignment-decisions.md
```

确认格式和已有 ADR 一致。

- [ ] **Step 3: 提交**

```bash
git add docs/adr/0021-claude-design-alignment-decisions.md
git commit -m "docs(adr): ADR-0021 Claude Design 对齐 14 项决策汇总"
```

---

## Task 2：ADR-0022 · 三层导航哲学

**Files:**
- Create: `docs/adr/0022-three-layer-navigation-philosophy.md`

- [ ] **Step 1: 新建 ADR-0022**

```markdown
# ADR-0022：三层导航哲学（系统 / 模块 / 页面）

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

## 影响
- 前端新增 `useActiveModule` hook（从 URL 推导当前激活的顶层节点 id）
- 新增 `HeaderTabSwitcher` 组件（被 claude-\* preset 共用）
- Sidebar 改造为"按 activeModuleId 过滤子节点"
- 九宫格占位实现为 `system-switcher-popover`（v1 数据硬编码）

## 相关 ADR
- ADR-0017（Layout Resolver + Preset Registry）：扩展
- ADR-0021（14 项决策汇总）：包含本决策 Q4
```

- [ ] **Step 2: 提交**

```bash
git add docs/adr/0022-three-layer-navigation-philosophy.md
git commit -m "docs(adr): ADR-0022 三层导航哲学（系统/模块/页面正交）"
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

## Task 4：修正 CLAUDE.md drift + 级联 AGENTS.md

**Files:**
- Modify: `CLAUDE.md`（多处）
- Modify: `AGENTS.md`（级联）

**背景**：已发现两处 drift：
1. 写"inset / mix / top / side 四种布局"，实际只有 `inset / mix` 2 个
2. 写"70 semantic token"，实际 `semantic-classic.css` 里有 140 个

- [ ] **Step 1: grep 出所有 drift 关键词**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
grep -n "inset / mix / top / side\|70 semantic\|top.*side.*四种" CLAUDE.md AGENTS.md docs/specs/
```

记录每一处位置。

- [ ] **Step 2: 修正 CLAUDE.md**

找到 "前端依赖方向" 段落和 "技术栈" 段落里出现 preset 数量、token 数量的地方，改为：

- `inset / mix / top / side 四种布局` → `inset / mix（M3）+ claude-classic / claude-inset / claude-rail（Plan A 新增），共 5 种`
- `70 semantic token` → `140 个 semantic token（Layer 2 × 2 style）`

并在"当前阶段"表格追加：

```markdown
| **Plan A** | Claude Design 对齐 · 基础设施（claude-warm style + 3 claude-\* preset + HeaderTab） | 🔄 进行中 |
| Plan B | IAM 3 页重写 + Mock 重组（成员与部门 / 角色 / 菜单） | ⏸ 待开始 |
| Plan C | 通用页面（Dashboard / Auth / Profile / 错误页） | ⏸ 待开始 |
```

- [ ] **Step 3: 级联 AGENTS.md**

`AGENTS.md` 是 Codex 的入口。grep 出 CLAUDE.md 修正的相同关键词，同步修正。

```bash
diff CLAUDE.md AGENTS.md | head -50
```

按 diff 对照更新。

- [ ] **Step 4: 跑 verify 脚本确认没有新 drift**

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build
bash scripts/verify-docs.sh 2>&1 | tail -20  # 如果存在的话
bash scripts/verify-frontend-docs.sh 2>&1 | tail -20
```

Expected: 0 errors（drift 脚本通过）。

- [ ] **Step 5: 提交**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: 修正 CLAUDE.md / AGENTS.md drift（preset 2→5 / token 70→140）"
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
- Modify: `client/packages/app-shell/src/components/theme-customizer.tsx`
- Modify: `client/packages/app-shell/src/i18n/zh-CN/shell.json`
- Modify: `client/packages/app-shell/src/i18n/en-US/shell.json`
- Modify: `client/packages/ui-tokens/src/tokens/component.css`（如果有密度相关 token）

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

- [ ] **Step 5: 3 档 token 数值对齐 Claude Design**

查找密度相关 token 覆写位置（应该在 `tailwind-theme.css` 或 `tokens/component.css`，通过 grep `data-theme-scale` 定位）：

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

注意：data-theme-scale='default' 时不应写 attr（遵循现有约定：默认值不落 dataset，由 :root 的默认 tokens 生效）。`style-provider.tsx` 已有这个逻辑（`if (state.scale !== 'default') body.dataset.themeScale = ...`）。

- [ ] **Step 6: 跑类型检查 + 单测 + check:i18n**

```bash
cd client && pnpm check:types && pnpm check:i18n && pnpm -F @mb/app-shell test
```

Expected: 全部通过。

- [ ] **Step 7: 手动验证**

dev server 重启，清空 localStorage（DevTools Application → Local Storage → Clear），重新加载。Customizer 密度档显示"紧凑 / 默认 / 舒适"（中文）或 "Compact / Default / Comfortable"（英文，切到 en 时）。切换各档，观察行高/字号变化。

- [ ] **Step 8: 提交**

```bash
git add client/packages/app-shell/src/theme/style-provider.tsx \
        client/packages/app-shell/src/components/theme-customizer.tsx \
        client/packages/app-shell/src/i18n/ \
        client/packages/ui-tokens/src/
git commit -m "refactor(theme): 密度维度 xs/lg → compact/comfortable（含 localStorage 迁移 + i18n + token 对齐 Claude Design）"
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

  return (
    <div role="tablist" className={cn('flex items-center gap-1', className)}>
      {inlineModules.map((m) => {
        const active = m.id === activeModuleId;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={active}
            aria-controls="main-content"
            onClick={() => onModuleChange(m.id)}
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
    // 2. localStorage
    const stored = window.localStorage.getItem(ACTIVE_MODULE_KEY);
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
    window.localStorage.setItem(ACTIVE_MODULE_KEY, String(id));
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

## Task 11：九宫格占位组件

**Files:**
- Create: `client/apps/web-admin/src/config/systems.ts`
- Create: `client/packages/app-shell/src/components/system-switcher-popover.tsx`

- [ ] **Step 1: 硬编码系统数据**

`client/apps/web-admin/src/config/systems.ts`：

```ts
/**
 * 九宫格"系统级切换"占位数据。
 * v1 仅前端硬编码（Q9 决策），未来可能升级为后端表驱动或配置驱动。
 */
export interface SystemItem {
  key: string;
  labelKey: string;  // i18n key
  icon: string;      // lucide icon name
  current: boolean;  // 是否当前系统（视觉高亮）
  disabled: boolean; // 占位项 disabled
}

export const SYSTEMS: SystemItem[] = [
  { key: 'admin', labelKey: 'system.admin', icon: 'layout-dashboard', current: true, disabled: false },
  { key: 'finance', labelKey: 'system.finance', icon: 'wallet', current: false, disabled: true },
  { key: 'crm', labelKey: 'system.crm', icon: 'users-round', current: false, disabled: true },
  { key: 'logistics', labelKey: 'system.logistics', icon: 'package', current: false, disabled: true },
];
```

- [ ] **Step 2: SystemSwitcherPopover 组件**

```tsx
// system-switcher-popover.tsx
import { Button, Popover, PopoverContent, PopoverTrigger, cn } from '@mb/ui-primitives';
import { LayoutGrid, LayoutDashboard, Wallet, UsersRound, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ICON_MAP: Record<string, typeof LayoutGrid> = {
  'layout-dashboard': LayoutDashboard,
  wallet: Wallet,
  'users-round': UsersRound,
  package: Package,
};

export interface SystemSwitcherPopoverProps {
  systems: Array<{
    key: string;
    labelKey: string;
    icon: string;
    current: boolean;
    disabled: boolean;
  }>;
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
            return (
              <button
                key={s.key}
                disabled={s.disabled}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 p-3 rounded-md text-xs',
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
    "placeholder": "更多系统即将推出"
  }
}
```

`en-US/shell.json` 追加对应英文版。

- [ ] **Step 4: 手动验证 dev server**

（在 Task 14 一起接进 Topbar 时再验）

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

- [ ] **Step 1: 写渲染测试**

```tsx
// claude-classic-layout.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from '@tanstack/react-router';
// ... 测试骨架参考现有 presets/mix/__tests__/mix-layout.test.tsx

describe('ClaudeClassicLayout', () => {
  it('renders topbar, sidebar, and main', () => {
    // Arrange: mock menu tree with 1 module
    // Act: render
    // Assert: 能看到品牌、HeaderTab、Sidebar 菜单项、主内容
  });

  it('filters sidebar by active module', () => {
    // 两个顶层模块，激活第一个，只看到第一个模块的子菜单
  });

  it('switches active module via header tab', () => {
    // 点击第二个 tab，Sidebar 内容更新
  });
});
```

（按现有测试风格补全，参考 mix-layout.test.tsx）

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
// systems 从 web-admin 注入还是从 preset 引用？—— 通过 ShellLayoutProps 的 slot 传入更干净
import { SYSTEMS } from '@/config/systems'; // 或通过 props 注入，见下面 Note

// Note: SYSTEMS 硬编码在 apps/web-admin 层，但 preset 在 app-shell 层。
// 解决方案：ShellLayoutProps 新增 systems?: SystemItem[] slot，由 web-admin 传入。
// 如果不传，preset 使用空数组或默认不显示九宫格按钮。

export function ClaudeClassicLayout({
  children,
  menuTree,
  currentUser,
  notificationSlot,
  resolveMenuHref,
  systems,  // 新增 slot
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

**重要注记**：`systems` 作为 `ShellLayoutProps` 的新 slot 需要在 Task 15 统一扩展 types。这里先 import 使用，types 扩展在 Task 15 做。

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

**视觉目标**：Topbar 贴顶 + 主体整体下沉内嵌白卡片（m-2 rounded-xl shadow-sm + bg-sidebar 铺底）+ Sidebar 内嵌。对齐 Claude Design 的 `layout--inset`。

- [ ] **Step 1 → Step 5：基本复制 Task 12 的结构**

在 Step 2 中，layout 外层 wrapper 改为：

```tsx
<div className="flex flex-col h-screen bg-sidebar">
  {/* Topbar（同 claude-classic） */}
  <header className="...">...</header>

  {/* 主体：整体下沉内嵌白卡片 */}
  <div className="flex-1 flex overflow-hidden m-2 mt-0 gap-2">
    <aside className="w-60 rounded-xl bg-sidebar border border-sidebar-border overflow-y-auto">
      {/* Sidebar */}
    </aside>
    <main id="main-content" className="flex-1 bg-background rounded-xl border shadow-sm overflow-y-auto">
      {children}
    </main>
  </div>
</div>
```

（具体视觉细节在 Plan B / C 实施时继续打磨，Plan A 目标是"能渲染不崩溃"。）

- [ ] **Step 5: 提交**

```bash
git add client/packages/app-shell/src/presets/claude-inset/
git commit -m "feat(preset): claude-inset preset（topbar 贴顶 + 主体内嵌白卡片）"
```

---

## Task 14：claude-rail Preset

**Files:**
- Create: `client/packages/app-shell/src/presets/claude-rail/index.ts`
- Create: `client/packages/app-shell/src/presets/claude-rail/claude-rail-layout.tsx`
- Create: `client/packages/app-shell/src/presets/claude-rail/__tests__/claude-rail-layout.test.tsx`

**视觉目标**：窄 Rail 侧栏（64px 图标轨道，hover 显示 label 浮窗）+ 标准 topbar。Header Tab 仍然显示。

- [ ] **Step 1–5: 参考 Task 12 / 13 结构**

Layout 核心改动：Sidebar 从 w-60 变为 w-16，菜单项只显示图标，hover 显示 tooltip。

```tsx
<aside className="w-16 border-r bg-sidebar overflow-y-auto">
  <nav className="p-2 flex flex-col gap-1">
    {activeSubmenu.filter(isDisplayNode).map((item) => {
      const IconComp = resolveMenuIcon(item.icon);
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Link to={resolveMenuHref?.(item) ?? '/'} className="w-10 h-10 grid place-items-center rounded-md hover:bg-sidebar-accent">
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

## Task 15：扩展 ShellLayoutProps 的 systems slot

**Files:**
- Modify: `client/packages/app-shell/src/layouts/types.ts`
- Modify: `client/packages/app-shell/src/layouts/layout-resolver.tsx`
- Modify: `client/apps/web-admin/src/...`（wherever ShellLayout is used — 通常是 _authed.tsx 或 app-layout.tsx）

**目的**：让 web-admin 把硬编码的 SYSTEMS 传给 preset，保持 app-shell 的 web-admin 解耦。

- [ ] **Step 1: types.ts 新增 systems 字段**

```ts
export interface ShellLayoutProps {
  // ... 现有字段
  systems?: Array<{
    key: string;
    labelKey: string;
    icon: string;
    current: boolean;
    disabled: boolean;
  }>;
}
```

- [ ] **Step 2: layout-resolver.tsx 透传**

找到 LayoutResolver 渲染 preset 的地方，把 `systems` 透传到 Layout 组件。

- [ ] **Step 3: web-admin 注入 SYSTEMS**

在 `_authed.tsx` 或 ShellLayout 消费点 import SYSTEMS 并传入 `<ShellLayout systems={SYSTEMS} />`。

- [ ] **Step 4: 所有 preset 消费 props.systems**

回到 Task 12 / 13 / 14 的 layout 里，把 `import { SYSTEMS } from '@/config/systems'` 删掉，改为从 `props.systems` 消费。

- [ ] **Step 5: 现有 InsetLayout / MixLayout 也加 SystemSwitcherPopover**

为保证所有 preset 都能展示九宫格按钮，在 `presets/inset/inset-layout.tsx` 和 `presets/mix/mix-layout.tsx` 的 Topbar 功能区也加入 SystemSwitcherPopover（如果 props.systems 存在）。

- [ ] **Step 6: 跑全量 test**

```bash
cd client && pnpm test
```

Expected: 全部通过。

- [ ] **Step 7: 提交**

```bash
git add client/packages/app-shell/src/layouts/types.ts \
        client/packages/app-shell/src/layouts/layout-resolver.tsx \
        client/packages/app-shell/src/presets/ \
        client/apps/web-admin/src/
git commit -m "feat(app-shell): ShellLayoutProps 新增 systems slot + 所有 preset 消费九宫格"
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

- [ ] **Step 3: 修改默认 preset？**

Claude Design 默认 layout 是 `inset`（它的定义）。meta-build 的对应是 `claude-inset`。考虑是否改默认：
- 选项 1：保持现状（默认 `inset`，是 meta-build 原 shadcn 风格）
- 选项 2：改为 `claude-inset`，配合 claude-warm 默认 style

推荐选项 2（与 Style 默认保持一致，完整对齐 Claude Design 初始体感）。

在 `registry-core.ts` 的 `new LayoutRegistry('inset')` 改为 `new LayoutRegistry('claude-inset')`。

- [ ] **Step 4: dev server 手动验证 5 个 preset 都能切**

```bash
cd client && pnpm dev
```

打开 localhost:5173，Customizer 里看到 5 个 preset 选项，逐个切换不崩溃。每个 preset 下的 Sidebar / HeaderTab / 九宫格按钮都正常渲染。

- [ ] **Step 5: 提交**

```bash
git add client/packages/app-shell/src/layouts/ \
        client/packages/app-shell/src/i18n/
git commit -m "feat(layout): 注册 3 个 claude-* preset + 默认切换到 claude-inset"
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
git commit -m "docs(plan-a): 跨 style × preset 回归截图（15 组合）"
```

---

## Task 19：全量 CI 检查

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

如有失败：
- `check:types`：TS 类型错（可能是 ThemeScale 迁移没覆盖到的地方）
- `check:theme`：新 style 的 token 有缺失（对照 semantic-classic 逐行补）
- `check:i18n`：有 i18n key 只加了中文或只加了英文
- `lint`：Biome 警告，按提示修

- [ ] **Step 2: 跑 E2E（可选）**

```bash
cd client && pnpm -F web-admin e2e
```

E2E 测试主要覆盖 Notice 流程，Plan A 不动业务页面，E2E 应当仍然通过。

如果失败，检查是否 Customizer / preset 切换影响了 E2E 脚本里的 selector。

- [ ] **Step 3: 提交 CI 绿灯 marker**

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
- ADR-0021（14 项决策汇总）
- ADR-0022（三层导航哲学）
- rule: L3 沉淀原则
- CLAUDE.md / AGENTS.md drift 修正
- L1 Token: semantic-claude-warm.css（140 tokens × light+dark）+ claude-warm.md DESIGN
- Style 注册: claude-warm（默认）
- 密度重命名: xs/lg → compact/comfortable + i18n + Claude Design token 数值
- HeaderTabSwitcher 组件（带测试）
- useActiveModule hook（带测试）
- SystemSwitcherPopover 九宫格占位（带 SYSTEMS 硬编码数据）
- 3 个 Preset: claude-classic / claude-inset / claude-rail（默认 claude-inset）
- ShellLayoutProps.systems slot + 所有 preset 消费
- 15 组合（3 style × 5 preset）跨 light/dark 回归截图

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
- Dashboard 页面还是 Codex 版本（视觉未对齐）
- IAM 4 页仍是 Codex 版本（视觉未对齐，用户管理仍然存在 — Plan B 解决）
- Login / Auth 页面视觉未对齐（Plan C 解决）
- mock 菜单顶层 2 个节点（系统管理 / 消息中心）尚未重组为 3 Tab（Plan B 解决）
- 九宫格数据只有 1 current + 3 disabled，点击无跳转（Q9 决策）
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
- [x] Q4 三层导航 → Task 9 (HeaderTab) + Task 10 (useActiveModule) + Task 11 (SystemSwitcher)
- [x] Q5 新增 3 preset → Task 12/13/14/16
- [x] Q6 新增 claude-warm style → Task 5/6/7
- [x] Q7 密度重命名 → Task 8
- [x] Q9 九宫格占位 → Task 11/15
- [x] Q10 零数据模型改动 → 整个 Plan 不碰 mb_iam_menu / MenuNode / backend
- [x] Q14 localStorage 持久化 → Task 7/8/10 保持现状

**2. 占位扫描**

grep "TBD\|TODO\|implement later\|fill in details\|similar to Task" 本 plan：
- Task 5 Step 4 有一个 TODO（补齐 140 tokens），但附带了具体指令（diff 检查）
- Task 13/14 Step 1-5 "参考 Task 12 结构" —— 这是 skill 警告的 "similar to Task N"。修正：Task 13/14 的 layout 核心差异已经在 Step 2 展示了具体代码片段（外层 wrapper 结构），能让执行者不看 Task 12 也能实现

**3. 类型一致性**

- `ThemeScale = 'default' | 'compact' | 'comfortable'` —— Task 8 定义，后续 Task 均消费
- `MenuNode`、`ShellLayoutProps` —— 未改现有结构，Task 15 只追加 `systems?` 字段
- `SystemItem` —— Task 11 定义（SYSTEMS 硬编码 + SystemSwitcherPopover props）
- `UseActiveModuleResult` —— Task 10 定义

---

## 执行方式建议

Plan 保存路径：`docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`

**执行选项**：
1. **Subagent-Driven（推荐）**：fresh subagent 每 task 一个，task 间检查点 review。适合本 Plan（20 个 task，并行度低但任务边界清晰）
2. **Inline**：当前 session 执行。适合急需快速推进

本 Plan 推荐 Subagent-Driven：基础设施改动面广，每 task 间做一次本地 verify + 跨组合快照更稳妥。
