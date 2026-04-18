# Claude Design 对齐 · Session Handoff

> **给新 session 的自包含上手指南**。当前会话因为要物理隔离到 worktree 开发，新 session 读完本文档即可接续工作，无需追溯上游对话。

**产生时间**：2026-04-18
**Handoff 位置**：`/Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend`
**Worktree 分支**：`feat/claude-design-plan-a`（基于 main d082b750）

---

## 1. 你是谁 / 你要做什么

- **项目**：meta-build —— AI 时代的可定制全栈技术底座（5 层前端架构 + 8 平台模块后端）
- **当前任务**：Claude Design 视觉对齐（前端）
- **总体规划**：3 个 Plan 分阶段交付
  - **Plan A（你的任务）**：基础设施 —— 新增 `claude-warm` style + 3 个 `claude-*` Layout Preset + HeaderTabSwitcher + useActiveModule + 九宫格占位。完成后现有页面在新 style/preset 组合下可渲染
  - Plan B（未来）：IAM 3 页重写（members / roles / menus）+ mock 重组
  - Plan C（未来）：Dashboard / Auth / Profile / 错误页

---

## 2. 14 个决策的最终答案（Q1–Q14）

这是上一个会话和洋哥 1:1 确定的，不要重新讨论：

| # | 主题 | 决策 |
|---|---|---|
| Q1 | 用户管理去留 | **删除独立用户管理**，合一为"成员与部门"（Claude Design 的 members 模式） |
| Q2 | lark-console style 去留 | **保留作为第二 style**，`claude-warm` 默认 |
| Q3 | Sidebar 分组策略 | **借鉴 Claude Design 分组叙事**（组织管理 / 内容 / 产品设置），具体菜单项填入 meta-build 真实模块，**不做 disabled 占位** |
| Q4 | 三层导航架构 | **九宫格=系统级**（占位，v1 硬编码）**/ Header Tab=模块级**（上限 5）**/ Sidebar=页面级**（随 Tab 动态） |
| Q5 | Layout Preset 新增 | **新增 3 个**：`claude-classic` / `claude-inset` / `claude-rail`（共 5 个 preset） |
| Q6 | theme 映射 | **新增 1 个 Style `claude-warm`**（light=claude warm / dark=midnight），**不做 slate** |
| Q7 | Customizer density | 现有 `scale` 维度重命名：`xs → compact`、`default → default`、`lg → comfortable`。**label 走 i18n**（中文"紧凑/默认/舒适"、英文"Compact/Default/Comfortable"）。**圆角节奏保留 SM/MD/LG 代号** |
| Q8 | Codex 4 页处理 | **直接推翻重写**，按 Claude Design 源码 100% 复刻（必要时抄代码改造）。MSW mock 保留复用。属于 Plan B 范围 |
| Q9 | 九宫格数据源 | **v1 前端硬编码占位**，图标保留、点击出悬浮框、不做真实跳转 |
| Q10 | 菜单数据模型 | **零改动**，现有 `mb_iam_menu` 自引用树足够，顶层节点天然作为模块 |
| Q11 | 图表组件 | **全部放 Dashboard 页面内**，不下沉 L3。原则："L3 是沉淀出来的，不是设计出来的" |
| Q12 | groups/invoices | **都不做** |
| Q13 | Header Tab 初始分组 | **3 Tab**：组织管理（iam）/ 内容（business-notice）/ 产品设置（工具类） |
| Q14 | 偏好持久化 | **保持 localStorage**，不做后端同步 |

详见 Plan A 头部 "依赖的决策（Q1–Q14）" 段。

---

## 3. Plan A 文件位置

**`docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`**

共 20 个 task，文件结构段落列明了所有要改动的文件路径。

**当前状态**：还是 **初稿**（未修订）。已经收到多角色 Review 的 4 个 Critical，需要先修订再实施。

---

## 4. Plan A 修订清单（实施前必须做）

上一个会话派了**多角色 Review**（Spec / 工程 / 测试 / 使用者四个视角），返回 4 个 Critical 问题：

### Critical 1：Task 11/12 跨层依赖 → app-shell 引用 web-admin
- 问题：Task 11/12 的 layout 直接 `import { SYSTEMS } from '@/config/systems'`（web-admin 层），但它们位于 `@mb/app-shell`，依赖方向反了。Task 15 才修成 slot 形式，中间 4 个 commit 会让 `check:deps` 失败
- 修法：把 Task 15 的 "ShellLayoutProps.systems slot 定义" 合并到 Task 11 之前，preset 从一开始就消费 props.systems，不直接 import

### Critical 2：Task 8 漏改 `customizer.css`
- 问题：密度维度重命名只改了 TS 类型 + i18n，但 `client/packages/ui-tokens/src/customizer.css` 里实际的 selector 还是 `data-theme-scale='xs'` / `'lg'`，不改会导致切换失效
- 修法：Task 8 追加一个 Step："把 `customizer.css` 里的 `data-theme-scale='xs'` → `'compact'`、`'lg'` → `'comfortable'` 替换"

### Critical 3：Task 4 drift 扫描范围漏了 specs
- 问题：CLAUDE.md / AGENTS.md drift 扫描没覆盖 `docs/specs/frontend/02-ui-tokens-theme.md` / `05-app-shell.md` / `09-customization-workflow.md`，这些文件很可能还写着"2 preset / 70 token / xs|lg"
- 修法：Task 4 的 grep 范围扩到 `docs/specs/frontend/*.md`，每份检查 "4 种布局"、"70 semantic token"、"xs/lg"、"top/side preset" 等关键词

### Critical 4：Task 12/13/14 Layout 测试骨架没填实
- 问题：测试只有 `// Arrange: ...` 注释，没真代码。TDD 声称要"写失败测试"但测试根本不存在
- 修法：Task 12（claude-classic）补上完整的 renderWithRouter + mock menuTree + 断言 topbar / sidebar / active module 过滤的 3 个测试。Task 13/14 可简写但至少每个保留 1 个 smoke test

### Warning / Observation（次级，实施中滚动处理）

- **ADR-0021/0022 骨架只写了"决策一句话"，缺理由段** → 填充时按模板补"背景/理由/影响/如何验证"
- **ADR-0022 缺"拒绝的替代方案"** → 补"为何不用单层菜单 + 路由前缀分组"、"为何不把系统做成 layout 变体"
- **Task 10 useActiveModule 缺 `typeof window` 守卫** → SSR / Storybook 会炸
- **Task 16 改默认 preset 会断 `registry-core.test.ts`** → 同步改测试的默认值断言
- **Task 19 E2E 压到最后太晚** → Task 16 改默认 preset 时就要跑 E2E smoke
- **localStorage 迁移（Task 8）零测试覆盖** → 补单测：旧值 `xs→compact`、`lg→comfortable`、非法值回落 default
- **HeaderTabSwitcher 缺键盘导航** → aria `role="tablist"` 要求方向键切换
- **15 组合手动截图太脆** → 建议 Playwright visual regression `toHaveScreenshot()`
- **SystemItem 类型三处重复定义** → 抽到 app-shell 的 types 统一 export

### 使用者视角补充

- Plan 缺"使用者新增 Style / Preset 的 how-to 清单" → 在 `docs/specs/frontend/09-customization-workflow.md` 增补
- 密度档 `default → compact → default` 回切时要验证 `data-theme-scale` attr 被 remove（Plan 的 `style-provider.tsx` 已有逻辑，但没要求手动验证）
- 九宫格 3 disabled 图标对使用者可能像 "bug"，建议 disabled 项 hover 显示 tooltip 说明

---

## 5. 关键约定（必读）

### 5.1 协作约定
- **`docs/collab/concurrent-dev-protocol.md`**（必读）—— 前后端并发开发协议
- 后端会话正在**主目录 main 分支**活跃工作，你在**本 worktree**（`06-meta-build-frontend`）的 feat 分支工作
- **不要碰** `server/**` / `docs/specs/backend/**` / 后端相关 ADR
- 共享文件（CLAUDE.md / AGENTS.md / INDEX.md）只碰前端相关段落

### 5.2 ADR 命名
- **`docs/rules/adr-numbering-discipline.md`**（必读）
- 新 ADR 用 `<scope>-<nnnn>-<kebab-title>.md`
- **现有编号状态**（截至 2026-04-18 21:55）：
  - 0001-0020：老 ADR（不动）
  - 0021 / 0022：后端落的"反面样本"（命名前规则最后一批）
  - **meta-0023**：后端刚落（过度工程化案例研究）
  - **你的下一个编号是 `0024`**，带 `frontend-` 前缀
- Plan A 原本规划的 ADR-0021/0022 要改为：
  - `frontend-0024-claude-design-alignment-decisions.md`
  - `frontend-0025-three-layer-navigation-philosophy.md`
- 开新 ADR 前 `ls docs/adr/ | sort -V | tail -3` 再确认一次

### 5.3 Rebase 节奏
- 后端会话可能持续在 main 上推进，你定期 `git fetch && git rebase main` 跟上
- 前端 worktree 不动后端代码，理论上没冲突

---

## 6. 你的执行路径

### Step 1：修订 Plan A（优先）
按上面 Critical 1-4 的修法改 `docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`。修完 commit 到 feat 分支。

### Step 2：执行 Plan A（推荐用 superpowers:subagent-driven-development）
20 个 task，fresh subagent 每 task 一个，task 间做本地 verify。

### Step 3：Plan A 完成后
- 跨 Style × Preset × ColorMode 回归（3 × 5 × 2 = 30 组合）
- 合并 feat 分支到 main（或走 PR）
- 写 handoff 给 Plan B 会话：`docs/handoff/claude-design-alignment/plan-a-complete.md`（Plan A 的 Task 20 里有骨架）

### Step 4（以后）
启动 Plan B 会话写 Plan B（IAM 3 页重写）—— 这是下一个 handoff 的事了。

---

## 7. 快速验证清单（开始工作前跑一遍）

```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-frontend

# 确认 worktree 和分支
git worktree list        # 应看到当前目录 + main 目录
git branch --show-current  # feat/claude-design-plan-a

# 确认工作区干净（除了 Plan A 和本 handoff 两个 untracked）
git status --short

# 确认依赖和现状
pnpm -C client install --frozen-lockfile  # 装依赖
pnpm -C client check:types                # 当前类型通过
pnpm -C client test                        # 当前测试通过
pnpm -C client check:theme                 # 现有 2 style 完整
```

都过了就可以开始修订 Plan A。

---

## 8. 别干的事

- ❌ 不要碰 `server/**`、`docs/specs/backend/**`、后端相关 ADR
- ❌ 不要在主目录（`../06-meta-build`）工作 —— 那是后端会话的
- ❌ 不要删除 Codex 的 IAM 4 页（`user-page / dept-page / role-page / menu-page`）—— 那是 Plan B 的事，Plan A 只碰基础设施
- ❌ 不要改 Dashboard、Auth、Profile 等业务页面 —— 那是 Plan C 的事
- ❌ 不要重新讨论 14 个决策 —— 已经和洋哥定稿，照 Plan 做就好
- ❌ 不要跳过测试 / 跳过 rebase / 跳过 check:deps —— 项目 rules 明确禁止

---

## 9. 碰到问题怎么办

- **技术实现疑惑**：读现有 preset 代码（`presets/inset/` / `presets/mix/`）作为参照
- **决策级疑惑**：停止施工，写清楚问题后让洋哥决定，不要自己推翻 14 个决策
- **和后端会话冲突**：按 `docs/collab/concurrent-dev-protocol.md` §2 共享文件约定处理
- **ADR 编号撞车**：`git pull && ls docs/adr/ | tail -3` 重新确认最大值，让步递增

---

祝好，把 Plan A 跑稳。🦄
