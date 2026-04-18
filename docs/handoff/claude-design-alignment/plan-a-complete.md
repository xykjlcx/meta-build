# Plan A 完成报告 · Claude Design 对齐 · 基础设施

> **这是一份 Plan A 的收尾 handoff 文档**。Plan B / Plan C 的新 session 可以基于此接手，无需追溯 Plan A 实施细节。

**完成时间**: 2026-04-19
**分支**: `feat/claude-design-plan-a`（26 commits，base origin/main `e3cdbbf6`）
**Plan 文件**: `docs/superpowers/plans/2026-04-18-claude-design-alignment-plan-a-infrastructure.md`
**执行方式**: superpowers:subagent-driven-development（fresh subagent per task + spec reviewer per task）

---

## 1. 一句话定位

Plan A 为 Claude Design 视觉全面对齐打下 **L1 token × L4 preset × 共享组件** 的基础设施。完成后所有现有页面在 `claude-warm × claude-classic/inset/rail` 的任意组合下都可以正常渲染，视觉呈现 Claude Design 原型的基本体感（暖米白 + 暖橙 + 毛玻璃 topbar + bg-blobs 背景装饰 + 内嵌白卡片）。

Plan A **不追求 pixel-perfect 还原**——那是 Plan B（IAM 3 页重写）+ Plan C（Dashboard / Auth / Profile / 错误页）的工作。

---

## 2. 交付清单

### 文档层（Task 1-4）
- [docs/adr/frontend-0024-claude-design-alignment-decisions.md](../../../docs/adr/frontend-0024-claude-design-alignment-decisions.md)：14 决策汇总（Q1–Q14）
- [docs/adr/frontend-0025-three-layer-navigation-philosophy.md](../../../docs/adr/frontend-0025-three-layer-navigation-philosophy.md)：三层导航哲学 + 3 段"拒绝的替代方案"
- [docs/rules/l3-sedimentation-principle.md](../../../docs/rules/l3-sedimentation-principle.md)：L3 沉淀原则（playbook）
- CLAUDE.md / AGENTS.md / docs/specs/frontend/{01,02,05,09}.md / docs/handoff/frontend-gap-analysis.md：drift 修正（preset 2→5 / style 2→3 / 密度档名 xs-lg→compact-comfortable / depcruise 7→9 / 默认 style classic→claude-warm）

### L1 Token 层（Task 5-7）
- `client/packages/ui-tokens/src/tokens/semantic-claude-warm.css`（239 行）：light + dark 各 70 个 core semantic token，严格对齐 Claude Design `[data-theme="claude"]` 和 `[data-theme="midnight"]`
- `client/packages/ui-tokens/src/styles/claude-warm.md`（533 行）：style DESIGN 文档，9 章节
- `client/packages/ui-tokens/src/style-registry.ts`：新增 `claude-warm` 注册（hex color `#d97a3f` + cssFile 相对路径）
- `client/apps/web-admin/src/main.tsx`：`<StyleProvider defaultStyle="claude-warm">` 显式注入
- `client/packages/app-shell/src/theme/style-provider.tsx`：`normalizeStyleId` 兜底 `'classic'` → `'claude-warm'`，`normalizeStyleId` export 便于直接单测

### 密度系统（Task 8）
- `ThemeScale` 类型重命名：`xs/lg` → `compact/comfortable`
- `style-provider.tsx` 新增 `migrateScale` helper，在 `readStateFromStorage` + `readStateFromDom` 两处双向迁移 + 回写 localStorage/DOM dataset
- `mapLegacyThemeToState` 的 legacy `'compact' → scale: 'xs'` 迁移改为 `scale: 'compact'`
- `theme-customizer.tsx` scaleOptions 走 i18n（`theme.scale.{compact,default,comfortable}`）
- `ui-tokens/customizer.css`：`[data-theme-scale='xs']/'lg']` → `'compact'/'comfortable'` + 数值对齐 Claude Design（36/52px）
- `semantic-claude-warm.css` 的 `--size-control-height-{sm,md,lg}` 从 shadcn 节奏（32/36/44）调整到 Claude Design 节奏（36/44/52），仅作用于 claude-warm 不动 classic/lark-console
- `style-provider.test.tsx` 新增 4 migration 单测（xs→compact / lg→comfortable / 非法值回落 / compact→default attr 清理）

### L4 组件 / Hook 层（Task 9-11.5）
- `client/packages/app-shell/src/components/header-tab-switcher.tsx`：Header Tab 切换器（顶层菜单节点 → Tab），支持 `maxTabs=5` + 溢出合入 DropdownMenu + 键盘导航（ArrowLeft/Right + tablist role + roving tabindex）+ aria-selected/controls
- `client/packages/app-shell/src/menu/use-active-module.ts`：3 级 fallback hook（URL → localStorage → 第一个可显示模块）+ SSR 守卫（`safeGetItem / safeSetItem`）
- `client/packages/app-shell/src/layouts/types.ts`：新增 `SystemItem` 类型 + `ShellLayoutProps.systems?: SystemItem[]` slot
- `client/packages/app-shell/src/layouts/layout-resolver.tsx`：透传 systems 到 preset
- `client/packages/app-shell/src/index.ts`：barrel export `SystemItem` 供 L5 引用
- `client/apps/web-admin/src/config/systems.ts`：SYSTEMS 9 格硬编码数据（3×3 对应 Google Apps / O365 视觉惯例，1 current + 8 disabled）
- `client/packages/app-shell/src/components/system-switcher-popover.tsx`：九宫格 Popover 组件（disabled 项带"敬请期待" Tooltip）
- `client/packages/app-shell/src/components/bg-blobs.tsx`：背景装饰共享组件（2 个 500×500 模糊圆形渐变，brand 左上 opacity 0.35 + info 右下 opacity 0.22）

### Preset 层（Task 12-16）
- `client/packages/app-shell/src/presets/__tests__/test-utils.tsx`：共享测试 helper（renderWithShell + sampleMenuTree + sampleCurrentUser + sampleSystems + sampleResolveMenuHref + mkNode/mkChild）
- `client/packages/app-shell/src/presets/claude-classic/`：claude-classic preset（标准顶栏 + Sidebar w-60 + 主内容，对齐 Claude Design `.layout--classic`）
- `client/packages/app-shell/src/presets/claude-inset/`：claude-inset preset（Topbar 贴顶 + `bg-background/60 backdrop-blur-md` 毛玻璃 + 主体整体下沉内嵌白卡片 `m-2 mt-0 rounded-xl border shadow-sm` + bg-blobs，对齐 `.layout--inset`）
- `client/packages/app-shell/src/presets/claude-rail/`：claude-rail preset（窄 Rail 侧栏 w-16 + 只显示 icon + Tooltip 悬浮 label + bg-blobs，对齐 `.layout--rail`）
- `client/packages/app-shell/src/layouts/registry.ts`：注册 3 个 claude-* preset（`supportedDimensions: []`，Claude Design 原生设计语言通过切 preset 表达形态差异）
- `client/packages/app-shell/src/layouts/registry-core.ts`：`new LayoutRegistry('claude-inset')`（默认 preset 从 `inset` 切到 `claude-inset`）
- i18n shell.json 新增 `theme.styles.claude-warm` / `theme.scale.{compact,default,comfortable}` / `layout.{claudeClassic,claudeInset,claudeRail}(Desc)` / `layout.headerTabs.more` / `layout.mainContent` / `system.{switcher,admin,finance,crm,logistics,analytics,knowledge,workflow,messaging,more,placeholder,comingSoon}` / `topbar.{help,inbox,notifications,profile,settings,logout,searchPlaceholder}` 等 key（中英双语）
- `client/apps/web-admin/src/routes/_authed.tsx`：LayoutResolver 注入 `systems={SYSTEMS}`
- `presets/inset/inset-layout.tsx` + `presets/mix/mix-layout.tsx`：接入 SystemSwitcherPopover（systems 非空时渲染，否则 mix 保留 MixSubsystemSwitcher 占位 fallback）

### 回归 / CI 层（Task 18-19）
- `client/apps/web-admin/e2e/layout-visual.spec.ts`：Playwright visual regression（3 style × 5 preset × 2 colorMode = 30 组合）
- `client/apps/web-admin/e2e/layout-visual.spec.ts-snapshots/`：30 张 baseline PNG（Plan A 视觉基准，未来 CI 自动比对）
- `client/apps/web-admin/playwright.config.ts`：`reuseExistingServer: true`（允许复用已在跑的 dev server，本地 + CI 均适用）

---

## 3. 默认状态（Plan A 交付后）

用户首次打开页面（清 localStorage）看到的是：

| 维度 | 值 |
|---|---|
| Style | `claude-warm`（暖米白 + 暖橙） |
| Preset | `claude-inset`（Topbar 贴顶 + 主体下沉内嵌白卡片 + bg-blobs） |
| ColorMode | `light` |
| Density | `default`（控件高度 44px） |
| Radius | `default` |
| ContentLayout | `default` |
| SidebarMode | `default` |

---

## 4. 质量指标

### 自动化
| 检查 | 结果 |
|---|---|
| `pnpm check:types` | ✅ PASS |
| `pnpm test`（vitest 全量） | ✅ **70 tests passed**（原 43 + Plan A 新增 27：HeaderTabSwitcher 6 + useActiveModule 4 + migration 4 + style registration 3 + claude-classic 3 + claude-inset 1 + claude-rail 1 + 原 style-provider test 扩展 5） |
| `pnpm build` | ✅ 2.43s done |
| `pnpm lint`（biome） | ✅ 0 errors（3 complexity warnings，见遗留清单） |
| `pnpm lint:css`（stylelint） | ✅ 0 errors |
| `pnpm check:theme` | ✅ 3 style × 2 ColorMode = 6 blocks，每 block 70 core tokens |
| `pnpm check:i18n` | ✅ 双语 key 对称 |
| `pnpm check:business-words` | ✅ L3 无业务词汇 |
| `pnpm check:deps`（depcruise 9 rules） | ✅ 423 modules / 947 deps / 0 violations |
| `pnpm check:env` | ✅ |
| Playwright E2E | ✅ **56 tests passed**（Notice 26 + layout-visual 30） |

### 手动
- 手动切换 5 preset × 3 style × 2 ColorMode = 30 组合，都能正常渲染不崩
- 密度切换 compact/default/comfortable 行高明显变化（2.25/2.75/3.25rem）
- Customizer 面板 5 preset 下拉 + 3 style 下拉 + 新密度档名显示正常
- 九宫格按钮在所有 preset 的 Topbar 出现，点击弹 3×3 popover

---

## 5. 已知限制 / Plan A 之外

以下是 **Plan A 刻意不做**的事情，由 Plan B / C 接手：

| 限制 | 归属 | 说明 |
|---|---|---|
| IAM 4 页（user/role/dept/menu）视觉是 Codex 旧版 | **Plan B** | 按 Claude Design members/roles/menus 3 页 100% 复刻（Q8 决策） |
| Mock 菜单顶层是"系统管理 / 消息中心" 2 Tab | **Plan B** | 重组为 3 Tab（组织管理 / 内容 / 产品设置，Q13 决策） |
| Dashboard 页面视觉粗糙（无图表组件） | **Plan C** | StatCard / Sparkline / LineChart / BarChart / ActivityFeed 放 `features/dashboard/components/`（L3 不下沉，Q11 决策 + `docs/rules/l3-sedimentation-principle.md`） |
| Login / Auth / Profile / 错误页未对齐 | **Plan C** | |
| 九宫格 9 格数据只 1 current + 8 disabled | **Plan A 交付态**（Q9 决策） | disabled 项 Tooltip "敬请期待"。未来版本可能改为后端 `/iam/systems` 返回 |
| Claude Design 密度 token `--pad-x / --pad-y / --gap / --font-size-base` 未落地 | **Plan B/C 按需扩展** | Plan A C2 决策 A：保持 meta-build 现有 `--size-control-height` 命名，只对齐控件高度；padding/gap/font-size 的密度体感不对齐（若 Plan B/C 业务场景发现差距，再扩展 `TOKEN_NAMES` 白名单） |
| 3 个 complexity warnings | **Plan A 尾声** | `readStateFromStorage` 19（Task 8 migration 引入）/ `MixSidebar` 19（Task 15 九宫格 fallback 分支引入）/ `NxTable` 18（pre-existing）。可在 Plan B 尾声时机拆分函数降复杂度 |

---

## 6. Plan B / Plan C 启动前提

Plan A 完成后，Plan B 和 Plan C 可以**并行启动**（无共享代码路径）：

### Plan B（IAM 3 页重写 + Mock 重组）
**范围**：
- 删除 `client/apps/web-admin/src/features/upms/` 下 Codex 做的 user / role / dept / menu 4 页
- 按 Claude Design 源 `/Users/ocean/Desktop/claude-design-test01/components/{members,roles,roles_groups,menus}.jsx` 100% 复刻 3 页（members / roles / menus，Q12 决策：groups 和 invoices 不做）
- 重组 MSW mock 顶层菜单为 3 Tab：**组织管理**（iam 子菜单）/ **内容**（business-notice）/ **产品设置**（platform 工具类）

**依赖 Plan A 的东西**：
- claude-warm style + claude-classic/inset/rail preset 已可用
- SystemSwitcherPopover + HeaderTabSwitcher + useActiveModule 已可用
- 共享 `presets/__tests__/test-utils.tsx` 可复用于 IAM 页面 E2E

**前置清单**：
1. `git fetch && git rebase main`（Plan A 合并后）
2. 读 `docs/specs/frontend/05-app-shell.md` + Q10 决策（数据模型零改动）
3. 读 Claude Design 源 `components/members.jsx`（~500 行 + `styles/members.css`）

### Plan C（Dashboard / Auth / Profile / 错误页对齐）
**范围**：
- Dashboard：新建 StatCard / Sparkline / LineChart / BarChart / ActivityFeed 5 图表组件到 `features/dashboard/components/`（不下沉 L3）
- Login / Auth / 忘记密码：对齐 Claude Design `components/auth.jsx`
- Profile：对齐 Claude Design `components/profile.jsx`
- 错误页：404 / 500 对齐 Claude Design 风格（如有）

**依赖 Plan A**：同 Plan B

---

## 7. 关键决策速查（Plan B / C 实施时会复用）

- **Q1** 用户管理取消 → 合一为"成员与部门"
- **Q2** claude-warm 默认 / lark-console + classic 保留
- **Q3** Sidebar 分组借鉴 Claude Design 叙事，填 meta-build 真实模块
- **Q4** 三层导航（系统级 / 模块级 / 页面级，详见 ADR frontend-0025）
- **Q5** 新增 3 preset 加 `claude-` 前缀，Registry 共 5 个
- **Q6** 单 style `claude-warm`（light = Claude warm / dark = midnight），不做 slate
- **Q7** 密度 xs/lg → compact/comfortable
- **Q8** Codex 4 页推翻重写（按 Claude Design 源 100%）
- **Q9** 九宫格 v1 前端硬编码（9 格 × Google Apps 视觉）
- **Q10** 菜单数据模型零改动（顶层 DIRECTORY 天然作为模块）
- **Q11** L3 不下沉图表组件（沉淀原则）
- **Q12** groups / invoices 不做
- **Q13** Header Tab 初始 3 个（组织管理 / 内容 / 产品设置）
- **Q14** 偏好 localStorage 持久化

完整 ADR：`docs/adr/frontend-0024-claude-design-alignment-decisions.md`

---

## 8. Plan A 实施过程中的 meta 教训

1. **`plan-code-snippets-must-verify` 规则的代价**：Plan 初稿和 v1 修订都凭空假设了若干 API（TOKEN_NAMES 数量 / style 注册位置 / menu 工具 import 路径 / customizer.css token 命名 etc.），code-reviewer 对抗审查揪出 5 个新 Critical。v2 修订加入"概念 7：实施真相源"把真实文件锚点列入 Plan，subagent 执行前必须先 cat 真相源确认，后续 Task 执行顺畅很多。未来 Plan 写作应第一时间列锚点。

2. **subagent-driven-development 的节奏**：对**纯文档类 Task**（ADR / rule / drift）跳过 code-quality review、只保留 spec reviewer 够用。对**代码类 Task**严格 implementer → spec reviewer → code quality reviewer 三段。**视觉类 Task**（preset 实施）的 spec review 侧重结构断言（data-testid / className 正则），而不是逐像素比对（那是 Task 18 Playwright visual regression 的工作）。

3. **Vite HMR 对 module-level side effect 不完全**：Task 7 / Task 16 的 `styleRegistry.register(...)` 和 `layoutRegistry.register(...)` 是模块加载时执行的 side effect。dev server 不重启时 Vite HMR 不会重新执行 register 调用，导致 UI 看起来"没改"。完整重启 + 清缓存是必需的。

4. **Claude Design 原生哲学 vs shadcn 复合组件**：Task 16 `supportedDimensions: []` 对 3 个新 preset——不用 shadcn Sidebar 复合组件（有 SidebarProvider / icon collapse 等），因为 Claude Design 的"折叠"是切到 `claude-rail` 独立 preset 表达，不是单个 preset 内部维度。这是洋哥 W7 反向决策的核心：100% 还原视觉源而不是沿用既有组件能力。

---

## 9. Commit 清单（26 个）

```
40d18710 ci(plan-a): 全量质量检查 + E2E + visual regression 全绿
2d38e5f0 chore(lint): Task 19 全量 CI 修复（biome format + stylelint case + a11y redundant role）
ad47c07e test(e2e): 新增 layout visual regression（30 组合 baseline）+ playwright reuseExistingServer
c18f396c feat(layout): 注册 3 个 claude-* preset + 默认切换到 claude-inset
3097ffbf feat(app-shell): 所有 preset（inset/mix/claude-*）接入九宫格 + web-admin 注入 SYSTEMS
0d4ac5c8 feat(preset): claude-rail preset（窄图标轨道侧栏 + 悬浮 label）+ 抽 BgBlobs 共享组件
87825e57 feat(preset): claude-inset preset（topbar 贴顶 + 主体内嵌白卡片 + bg-blobs 背景装饰）
7eeeacc8 feat(preset): claude-classic preset（标准 topbar + HeaderTab + sidebar，100% 还原 Claude Design layout--classic）
438e541f feat(app-shell): 九宫格占位组件 SystemSwitcherPopover（9 格 × Google Apps 视觉语言）
6db4ac36 feat(app-shell): 前置扩展 ShellLayoutProps.systems slot + SystemItem 类型（为 claude-* preset 铺路）
758fd571 feat(app-shell): useActiveModule hook（URL + localStorage 推导当前激活模块）
eeb390b3 feat(app-shell): 新增 HeaderTabSwitcher 组件（claude-* preset 共享）
9c0a6eee feat(tokens): claude-warm 的 --size-control-height-* 对齐 Claude Design 密度值
bc8c21a7 refactor(theme): 密度维度 xs/lg → compact/comfortable（types + CSS selector + i18n + Claude Design 数值 + migration 单测）
f1383002 docs(style): 同步 normalizeStyleId 注释到 claude-warm 兜底（Task 7 follow-up）
90cd2634 feat(style): 注册 claude-warm style 并设为默认（style-registry + StyleProvider defaultStyle + 兜底）
3854f519 docs(tokens): 新增 claude-warm.md DESIGN 文档
308b0a64 feat(tokens): 新增 semantic-claude-warm.css（light + dark 各 70 个 core token）
d46f50cf docs(plan-a): Plan 内部 v2 残留清理（Task 1/4 的 70→140 臆造最后 3 处）
eae94475 docs: 修正 CLAUDE/AGENTS/specs drift（preset 2→5 / style 2→3 / 密度档名 xs-lg → compact-comfortable / depcruise 7→9 / 默认 style classic → claude-warm）
7ca79a5c docs(rules): 新增 L3 沉淀原则（playbook）
a37ab487 docs(adr): frontend-0025 三层导航哲学（系统/模块/页面正交）
7ed375f4 docs(adr): frontend-0024 Claude Design 对齐 14 项决策汇总
d5a8c16f docs(plan-a): Plan A 修订 v2（5 Critical + 11 Warning 闭环）
ba632232 docs(plan-a): Plan A 修订稿（4 Critical + Warning + 自主补项）
48b728b3 docs(plan-a): Claude Design 对齐 Plan A 初稿 + session handoff
```

---

## 10. 合并建议

**建议路径**：
1. 跑最后一次 `git fetch && git rebase origin/main` 跟上后端会话最新 commit
2. 本地 FF 合并：
   ```bash
   git checkout main
   git merge --ff-only feat/claude-design-plan-a
   git push origin main
   ```
   或 push 到 feat 远程分支开 PR 让后端会话 review

**合并后立即启动**：
- Plan B 新 session：读本文档 + `docs/adr/frontend-0024` + `docs/adr/frontend-0025` 即可开工，无需读 Plan A 实施过程
- Plan C 同理

---

祝 Plan A 顺利交付 🦄
