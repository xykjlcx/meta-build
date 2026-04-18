# Plan B 写作任务 · Session Handoff

> **给写 Plan B 的新 session 的自包含上手指南**。你的任务是**只写 Plan B 的实施计划文档**（不执行代码改动）。写完交给洋哥 review。

**产生时间**：2026-04-18
**Handoff 位置**：主目录 main 分支（任何前端 worktree 都能拉到）
**推荐 worktree**：`../06-meta-build-planb-draft`（专用，只写 md 文档）
**推荐分支**：`docs/plan-b-draft`

---

## 1. 你是谁 / 你要做什么

- **项目**：meta-build —— AI 时代的可定制全栈技术底座（5 层前端架构）
- **当前任务**：写 **Plan B 的实施计划 md 文档**，不执行
- **产出位置**：`docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-b-iam-pages.md`
- **格式规范**：参考 Plan A（`docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`）的 task 粒度和 TDD 节奏
- **成功标准**：Plan B 写完后，**任何一个 AI session 读 Plan B 就能按 task 顺序执行，无歧义**（TDD + 小步 commit + 明确文件路径）
- **完成后**：提交 md 文档到分支并 push，交给洋哥或派 Codex rescue agent 做对抗审查 + 多角色 Review

---

## 2. Claude Design 对齐的全局规划（三 Plan 分拆）

| Plan | 范围 | 状态 |
|---|---|---|
| **Plan A** | 基础设施（claude-warm style + 3 claude-\* preset + HeaderTabSwitcher + useActiveModule + 九宫格占位） | 🔄 正在执行（另一个会话在 `feat/claude-design-plan-a` 分支） |
| **Plan B（你的任务）** | IAM 3 页重写 + Mock 重组 + i18n 调整 + 路由重构 | ⏳ **待写计划** |
| Plan C | Dashboard / Auth / Profile / 错误页 | ⏸ 待开始 |

Plan B 必须等 Plan A 合并到 main 才能执行。你**现在只写计划**，执行在以后。

---

## 3. Plan B 的具体范围（边界清晰）

### 3.1 删除（Codex 昨天做的，要推翻重写）

- `client/apps/web-admin/src/features/upms/pages/user-page.tsx`（626 行）
- `client/apps/web-admin/src/features/upms/pages/dept-page.tsx`（361 行）
- `client/apps/web-admin/src/features/upms/pages/role-page.tsx`（510 行）
- `client/apps/web-admin/src/features/upms/pages/menu-page.tsx`（409 行）
- `client/apps/web-admin/src/features/upms/shared.ts`（83 行）
- 对应的 4 条路由：`client/apps/web-admin/src/routes/_authed/system/{users,depts,roles,menus}/index.tsx`

### 3.2 新建（按 Claude Design 源码 100% 复刻，可抄代码改造）

- **members-page**（成员与部门合一）：左侧部门树 + 右侧成员表，Q1 决策的核心页面
  - 参考源码：`/Users/ocean/Desktop/claude-design-test01/components/members.jsx`（27KB）
  - 配套对话框：`/Users/ocean/Desktop/claude-design-test01/components/members_dialogs.jsx`（25KB）
  - 样式：`/Users/ocean/Desktop/claude-design-test01/styles/members.css`（13KB）
  - 路由：`/system/members`
- **roles-page**：角色 + 角色分组
  - 参考源码：`/Users/ocean/Desktop/claude-design-test01/components/roles.jsx`（46KB）
  - 配套组件：`/Users/ocean/Desktop/claude-design-test01/components/roles_groups.jsx`（5.5KB）
  - 路由：`/system/roles`
- **menus-page**：菜单树 + 权限点 + 图标
  - 参考源码：`/Users/ocean/Desktop/claude-design-test01/components/menus.jsx`（33KB）
  - 路由：`/system/menus`

### 3.3 Mock 菜单数据重组（Q13 决策 3 Tab）

当前 `client/apps/web-admin/src/mock/handlers.ts` 里菜单只有 2 个顶层节点（"系统管理" / "消息中心"）。**重组为 3 个 Tab**：

- **组织管理**（替代"系统管理"）→ children: 成员与部门 / 角色 / 菜单
- **内容**（原"消息中心"拆出）→ children: 公告 / 微信绑定 / 渠道总览
- **产品设置**（新）→ children: 占位 children 即可（config/dict/file/job/log/monitor 等页面在 Plan C 之后才做，这里先放占位菜单项）

### 3.4 i18n 调整

- `client/apps/web-admin/src/i18n/zh-CN/iam.json` + `en-US/iam.json`：
  - 删除"用户管理"相关 key
  - 新增"成员与部门"相关 key
  - 调整"角色管理" / "菜单管理"的 key（按新 UI 文案）

### 3.5 MSW mock handlers 保留

`client/apps/web-admin/src/mock/handlers.ts` 里的 CRUD mock（用户 / 部门 / 角色 / 菜单 API）**保留复用**（API 契约没变，只是前端消费方式变了）。

---

## 4. 14 个决策中和 Plan B 相关的（重点 5 条）

### Q1：用户管理合一为"成员与部门"
独立"用户管理"页面删除，合一为 members 页（左树右表）。这是 Plan B 的最大改动。

### Q3：Sidebar 分组叙事（借鉴 + 真实模块）
Sidebar 分组按 Claude Design 叙事（组织管理 / 内容 / 产品设置），**具体菜单项填入 meta-build 真实模块，不做 disabled 占位**。

### Q8：直接推翻重写 Codex 4 页
删除 Codex 的 user/dept/role/menu 4 页，按 Claude Design 源码 100% 复刻，必要时直接抄代码改造（把 JSX + babel 翻译成 TS + `@mb/ui-primitives` + `@mb/ui-patterns`）。MSW mock 保留。

### Q10：菜单数据模型零改动 + UI 跟随 layout
后端 `mb_iam_menu` 表**不动**。顶层 DIRECTORY 节点 = 模块，UI 按 layout 渲染：
- 有 Header Tab 的 layout（claude-\*）：顶层 → Tab，二级 → Sidebar 项
- 无 Header Tab 的 layout（inset）：顶层 → Sidebar 一级 label，二级 → Sidebar 项

**Sidebar 分组不需要加 meta 字段或硬编码映射表**（主目录会话已确认这是 Q10 的自然延伸）。

### Q13：3 Tab 是有意识扩展，不是漏抄 Claude Design 的 2 Tab
Claude Design 原型 2 Tab（企业管理 / 产品设置），Q13 洋哥主动扩展为 3 Tab：
- **组织管理** = iam
- **内容** = business-notice + 未来 business-order / business-approval / 使用者业务模块
- **产品设置** = 平台工具类（config/dict/file/job/log/monitor/notification）

Mock 重组要按这 3 个 Tab 分配顶层节点。

---

## 5. Plan B 的前置条件（Plan A 产出清单）

Plan B **执行时** 需要 Plan A 已合并到 main，能用到的基础设施：

- **Style 已默认 `claude-warm`**（light + dark 140 token 已对齐 Claude Design）
- **5 个 Preset 可切换**：`inset / mix / claude-classic / claude-inset / claude-rail`，默认 `claude-inset`
- **HeaderTabSwitcher 组件**（`@mb/app-shell/components/header-tab-switcher.tsx`）—— claude-\* preset 共享
- **useActiveModule hook**（`@mb/app-shell/menu/use-active-module.ts`）—— 从 URL 推导激活模块
- **SystemSwitcherPopover 九宫格占位**（`@mb/app-shell/components/system-switcher-popover.tsx`）+ `web-admin/src/config/systems.ts`
- **Customizer 密度命名对齐**：`compact / default / comfortable`（+ i18n）
- **ShellLayoutProps.systems slot** 已扩展

Plan B 的 task 里引用这些设施时可以假设它们存在，不需要再定义。但写计划时要**显式声明"前置条件：Plan A 已 merge 到 main"**。

---

## 6. 关键约定（必读）

- **协作约定**：`docs/collab/concurrent-dev-protocol.md`（前后端并发开发协议，含共享文件段落归属）
- **ADR 编号纪律**：`docs/rules/adr-numbering-discipline.md`（新 ADR 带 scope 前缀 + ls 查最大编号 + 1）
- **L3 沉淀原则**：Plan B 新建的 3 个页面里的组件**不要随手下沉到 `@mb/ui-patterns`**，先放 `features/upms/components/`，等有多处复用再考虑下沉（原则由 Q11 决策）
- **TDD 纪律**：Plan B 的业务逻辑代码必须 TDD（先写失败测试再实现，测试 commit 先于实现 commit）。骨架 / 纯视觉 / spike 例外。详见 `docs/rules/tdd-enforcement.md`
- **verify-all-modes**：Plan B 完成时必须跑完整验证链（`pnpm build` + `check:types` + `test` + `lint` + `lint:css` + `check:theme` + `check:i18n` + `check:deps`）
- **两种 style 回归**：Plan B 的 3 个页面要在 `claude-warm` + `lark-console` 两种 style 下都跑通（Q2 决策 "lark-console 作为第二 style 保留"）

---

## 7. 推荐的 Plan B task 切分（给你参考，不是必须照抄）

### 阶段 0：前置检查
- Task 0.1：确认 Plan A 已 merge 到 main，所有 Plan A 产出可用
- Task 0.2：启动 dev server + 截图当前 IAM 4 页视觉（Codex 版本）作为 baseline
- Task 0.3：质量线 baseline（全部 check 通过）

### 阶段 1：Mock 菜单数据重组
- Task 1.1：重写 `mock/handlers.ts` 的菜单返回（3 Tab 顶层节点 + 按 Q13 填充）
- Task 1.2：验证 HeaderTabSwitcher 能显示 3 Tab + Sidebar 按激活 Tab 过滤

### 阶段 2：路由重构
- Task 2.1：删除 `routes/_authed/system/{users,depts,roles,menus}/index.tsx` 4 个路由
- Task 2.2：新建 `routes/_authed/system/{members,roles,menus}/index.tsx` 3 个路由
- Task 2.3：更新 `menu-route-map.ts`

### 阶段 3：members-page 新建（最复杂）
- Task 3.1-3.N：左树 / 右表 / 邀请对话框 / 编辑对话框 / 批量操作 / 搜索过滤 / 等
- 参考源码：members.jsx + members_dialogs.jsx

### 阶段 4：roles-page 新建
- Task 4.1-4.N：角色列表 / 角色分组 / 权限矩阵 / 成员分配 / 等
- 参考源码：roles.jsx + roles_groups.jsx

### 阶段 5：menus-page 新建
- Task 5.1-5.N：菜单树 / 权限点管理 / 图标选择 / 路由绑定 / 等
- 参考源码：menus.jsx

### 阶段 6：i18n + 清理
- Task 6.1：iam.json 双语调整
- Task 6.2：删除 `features/upms/shared.ts`
- Task 6.3：清理 Codex 4 页的 import 引用（如果有）

### 阶段 7：验证 + 跨 style 回归
- Task 7.1：全量质量检查
- Task 7.2：claude-warm + lark-console 两套 style 下的 3 页视觉回归
- Task 7.3：E2E smoke test
- Task 7.4：Plan B 完成报告 + handoff 给 Plan C

**预估总 task 数**：15-25 个（按 Plan A 的粒度感）。

---

## 8. 参考资料

### Claude Design 源
- `/Users/ocean/Desktop/claude-design-test01/components/members.jsx`（成员与部门核心）
- `/Users/ocean/Desktop/claude-design-test01/components/members_dialogs.jsx`
- `/Users/ocean/Desktop/claude-design-test01/components/roles.jsx`
- `/Users/ocean/Desktop/claude-design-test01/components/roles_groups.jsx`
- `/Users/ocean/Desktop/claude-design-test01/components/menus.jsx`
- `/Users/ocean/Desktop/claude-design-test01/components/data.jsx`（mock 数据参考）
- `/Users/ocean/Desktop/claude-design-test01/styles/members.css`

### Codex 既有实现（要推翻的，但业务逻辑可复用）
- `client/apps/web-admin/src/features/upms/pages/*.tsx`
- `client/apps/web-admin/src/features/upms/shared.ts`
- `client/apps/web-admin/src/i18n/*/iam.json`
- `client/apps/web-admin/src/mock/handlers.ts`（MSW handlers，保留）

### meta-build 架构文档
- `docs/specs/frontend/README.md`（前端设计总入口）
- `docs/specs/frontend/04-ui-patterns.md`（L3 业务组件规范）
- `docs/specs/frontend/09-customization-workflow.md`（使用者定制流程）
- `CLAUDE.md`（项目全貌）
- `AGENTS.md`（同上，Codex 会读的入口）

### 同系列 Plan 参考
- `docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`（Plan A，结构参考）
- `docs/superpowers/plans/2026-04-16-shell-visual-polish.md`（历史 plan，task 粒度感）
- `docs/superpowers/plans/2026-04-15-m5-plan-c-notice-frontend-e2e.md`（Notice 前端 Plan C，最接近 Plan B 的体量）

### 决策和规则
- `docs/handoff/claude-design-alignment/session-handoff-2026-04-18.md`（Plan A 的 handoff，完整列了 14 个决策）
- `docs/collab/concurrent-dev-protocol.md`
- `docs/rules/adr-numbering-discipline.md`
- `docs/rules/tdd-enforcement.md`
- `docs/rules/plan-review-before-execution.md`

---

## 9. 执行路径

### Step 1：启动前检查
```bash
cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build-planb-draft
git status                               # 干净
git log --oneline -3                     # 基于 main 最新
git branch --show-current                # docs/plan-b-draft
```

### Step 2：读完 handoff 和决策背景
- 读完本文档
- 读 `docs/handoff/claude-design-alignment/session-handoff-2026-04-18.md`（Plan A handoff，里面有完整 14 个决策 + 主目录会话的额外澄清）
- 扫 Claude Design 源的 3 个页面（members/roles/menus jsx），理解视觉语言和交互

### Step 3：探索现状
- 读 Codex 4 个页面的实现（user/dept/role/menu-page.tsx），理解现有业务逻辑 / API 调用 / MSW mock 对接
- 读现有 mock handlers 的菜单和 IAM 数据，理解契约
- 读 Plan A 文档，理解 HeaderTabSwitcher / useActiveModule 的接口（你的 Plan B 要调用它们）

### Step 4：写 Plan B
- 路径：`docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-b-iam-pages.md`
- 格式：参考 Plan A（文件头 + 文件结构 + Task N + 自检 + Execution Handoff）
- task 粒度：2-5 分钟一步，每个 task 有"失败测试 → 实现 → 通过 → commit"完整闭环

### Step 5：Self-review + 提交
- 按 writing-plans skill 的 self-review 检查（规格覆盖 / 占位扫描 / 类型一致性）
- commit 到 `docs/plan-b-draft` 分支并 push

### Step 6：交给洋哥 review 或派 agent
- 洋哥选择：自审 / 派 Codex rescue agent 对抗审查 / 派 Plan agent 多角色 Review
- 修订后合并到 main

---

## 10. 别干的事

- ❌ **不要执行 Plan B**（写完就交出去）
- ❌ 不要碰 `server/**` / `docs/specs/backend/**`
- ❌ 不要改现有前端代码（Plan B 写作会话不碰代码，只写 md）
- ❌ 不要在 Plan B 文档里重新讨论 14 个决策（直接引用）
- ❌ 不要把新组件下沉 L3（L3 是沉淀出来的，Q11 决策）
- ❌ 不要越界写 Plan C 的内容（Dashboard / Auth / Profile / 错误页留给 Plan C）
- ❌ 不要在 Plan B 里假设自己能改 Plan A 的基础设施（Plan A 已经在另一个会话跑，接口按 Plan A 文档来）

---

## 11. 碰到问题怎么办

- **决策级疑惑**：停止写作，列清楚问题交给洋哥或主目录会话
- **Plan A 接口不确定**：读 Plan A 文档的 Task 9/10/15（HeaderTabSwitcher / useActiveModule / ShellLayoutProps.systems）
- **Claude Design 源码 vs meta-build 架构的映射**：参考 Plan A 文档里的映射表，或者对照 meta-build 现有的 `mix-layout.tsx` / `inset-layout.tsx` 看 preset 怎么消费 menuTree
- **权限点 / 数据格式**：看 `@mb/api-sdk` 的生成类型（`client/packages/api-sdk/src/generated/`）和 mock handlers 里的响应结构

---

祝好，写稳 Plan B。🦄
