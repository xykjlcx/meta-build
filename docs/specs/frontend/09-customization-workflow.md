# 09 - 脚手架定制工作流

> **关注点**：使用者 fork meta-build 后的 5 条定制路径 + 千人千面保护边界 + 3 种典型定制工作流 + AI 辅助定制的 prompt 模板。本文是使用者第一份要读的"怎么改"指南。

---

## 1. 决策结论 [M1+M2+M3]

meta-build 是 **纯脚手架模式**（决策 5）：使用者通过 GitHub "Use this template" 或 `git clone` 拿到完整源码后，**L1-L5 全部都是使用者资产**——可以改任何文件，包括底座的 token 定义、原子组件实现、布局结构。

但"可以改一切"不等于"改坏不被察觉"：

| 维度 | 结论 |
|------|------|
| 谁拥有源码 | **使用者**（fork 之后 meta-build 不再持续推送更新） |
| 谁负责约束 | **底座**（pnpm workspace + dependency-cruiser + TS strict + Biome + stylelint + 主题/i18n 完整性脚本，详见 [10-quality-gates.md](./10-quality-gates.md)） |
| 千人千面保护机制 | **工具拦截**——硬编码颜色 / 反向 import / 动态拼接 class / 主题缺 token 在 CI 阶段失败，不让坏代码混进 main |
| 升级策略 | **默认不升级**。需要新功能时由使用者手动 `git cherry-pick` meta-build 上游的 commit |
| 不做的事 | 不做 CLI、不发布 npm 包、不做"插件市场"、不做版本兼容承诺 |

**核心哲学一句话**：底座定义"什么不能做"（硬约束），使用者定义"具体怎么做"（业务和视觉）。

---

## 2. 脚手架定制哲学 [M1]

### 2.1 使用者有权改一切

| 层 | 是否使用者资产 | 改它的常见动机 |
|---|---|---|
| L1 `@mb/ui-tokens` | ✅ | 切换品牌色、改圆角风格、加暗色主题 |
| L2 `@mb/ui-primitives` | ✅ | 改按钮的默认尺寸、给 Input 加新 variant |
| L3 `@mb/ui-patterns` | ✅ | 改 NxTable 的工具栏布局、加新的筛选器形态 |
| L4 `@mb/app-shell` | ✅ | 改侧边栏从树形折叠改为分组、加新的全局 Provider |
| L5 `apps/web-admin` | ✅ | 这是业务代码本体，每天都在改 |

**对照后端**：后端的 `mb-business` 也是使用者扩展位（详见 [backend/03-platform-modules.md](../backend/03-platform-modules.md)），但后端的 `mb-common` / `mb-schema` / `mb-infra` / `mb-platform` 是"建议尽量不改的底座"。前端的不同点在于**没有"建议不改"的层**——所有 5 层都是使用者源码，因为前端的视觉和交互定制频率远高于后端。

### 2.2 底座只提供约束 + 默认实现

底座给的不是"完整 SaaS"，而是：

1. **架构约束**：5 层 pnpm workspace 的依赖方向（[01 §4](./01-layer-structure.md#4-依赖方向守护机制-m1)）
2. **千人千面承诺**：硬编码即报错，主题切换可视化无副作用
3. **最小可用默认实现**：
   - 3 套 style：`classic`（canonical 参考）+ `lark-console`（飞书管理后台风格）+ `claude-warm`（Claude Design 对齐，默认选中）。新增 style 的流程见 [02 §9](./02-ui-tokens-theme.md#9-使用者扩展新风格的步骤-m2)
   - L2 原子组件与布局基础件（[03 §3](./03-ui-primitives.md#3-l2-公开组件清单)）
   - L3 业务组件与页面骨架（[04 §3](./04-ui-patterns.md#3-11-个公开组件清单)）
   - `LayoutResolver + Preset Registry + BasicLayout`（[05 §3](./05-app-shell.md#3-布局预设-m3)）
   - 完整的认证 / 路由 / i18n / API SDK 工具链

**类比**：底座像"给厨师的厨房"——锅碗瓢盆齐全，刀具放在固定位置（约束），但具体做什么菜（业务）由厨师决定。

### 2.3 定制 vs 污染的边界

不是所有"改源码"都是合法定制。下表区分两者：

| 类型 | 合法定制 | 污染（被工具拦截） |
|---|---|---|
| 颜色 | 改 `--color-primary: oklch(...)` | 在组件里写 `bg-[#ff5722]` 或 `style={{ color: '#fff' }}` |
| 圆角 | 改 `--radius-md: 8px` | 在组件里写 `rounded-[10px]` |
| 间距 | 改 `--size-control-height: 36px` | 在组件里写 `h-[36px]` |
| 组件改造 | 改 `Button.tsx` 的 CVA variants 定义 | 在 L2 内部 `import { useTranslation } from 'react-i18next'`（破坏 L2 i18n 零感知） |
| 布局调整 | 改 `LayoutResolver` 的默认 preset 或改 `presets/inset/*` 的 JSX 结构 | 在 L4 里 `import { orderApi } from '@mb/api-sdk'`（违反白名单依赖） |
| 业务扩展 | 在 `apps/web-admin/src/features/orders/` 加新文件 | 在 features 里 `fetch('/api/v1/orders')`（违反 MUST #4） |

**判定原则**：

- **改语义**（"主品牌色应该是蓝色还是紫色"）→ 合法
- **改实现位置**（把"主品牌色"硬编码到具体组件）→ 污染
- **加业务能力**（订单详情页加导出按钮）→ 合法
- **绕过架构约束**（features 直接调 authApi）→ 污染

工具会无差别地拦截所有"污染"，但不会拦截任何"合法定制"——这是底座对使用者的承诺。

---

## 3. 5 条定制路径 [M1+M2+M3]

下表是 fork 之后使用者能改的所有位置。**改任何 UI / 业务 / 布局都能映射到这 5 条之一**——如果发现自己想改的东西不在这 5 条里，先停下来想想是不是绕过架构了。

| # | 层 | 定制对象 | 改哪个文件 | AI 认知负担 | 改坏了的检测机制 | 影响范围 |
|---|---|---------|-----------|-----------|---------------|---------|
| 1 | L1 | 主题（色彩 / 圆角 / 密度 / 阴影 / 字体） | `client/packages/ui-tokens/src/tokens/semantic-*.css` | **低** | 主题完整性脚本 + Tailwind IntelliSense + stylelint 禁硬编码 | 全站样式（所有用 token 的组件） |
| 2 | L2 | 原子组件（Button / Input / Dialog / Table / 等 30 个） | `client/packages/ui-primitives/src/{button,input,dialog}.tsx` | **中** | TS strict + Storybook 故事 + Vitest 单测 + L2 i18n 禁用规则 | 所有上层使用者（L3 / L4 / L5） |
| 3 | L3 | 业务组件（NxTable / NxForm / NxFilter / NxDrawer / NxBar / NxLoading / ApiSelect） | `client/packages/ui-patterns/src/nx-table.tsx` 等 7 个 | **高**（懂 TanStack Table / RHF / Zod） | TS strict + Storybook 故事 + Vitest + 业务语义扫描 + 使用方 e2e | 所有用到该业务组件的页面 |
| 4 | L4 | 壳（布局 / Provider / 全局 UI / i18n 配置） | `client/packages/app-shell/src/{layouts,providers,header,sidebar}/*.tsx` | **高**（懂路由 + 菜单 + 主题 + i18n） | TS strict + Playwright E2E + i18n 完整性脚本 | 所有用这个布局的页面 |
| 5 | L5 | 业务代码（features 业务逻辑 + routes 路由声明） | `client/apps/web-admin/src/features/**` 和 `client/apps/web-admin/src/routes/**` | **中**（业务逻辑） | TS strict + Vitest + Playwright + dependency-cruiser auth 豁免规则 | 单页面 / 单功能 |

**两条快速判断准则**：

1. **影响范围越大、AI 认知负担越高**——改 L1 一行 CSS 影响全站，但只需要懂"颜色"；改 L4 一个布局只影响布局使用者，但需要懂路由 + 菜单 + 主题协同
2. **越往上越频繁、越往下越谨慎**——L5 每天改、L1 每周改、L4 每月改、L2/L3 每季度改

### 3.1 路径 1：L1 主题定制 [M1+M2]

**改的对象**：CSS 变量（color / radius / size / shadow / motion / font，共 54 个语义 token）。

**改的文件**：

```
client/packages/ui-tokens/src/tokens/
├── semantic-classic.css       # canonical style（light + dark 两套颜色）
├── semantic-lark-console.css  # lark-console style（飞书管理后台风格，light + dark）
└── ...                        # 其他 style 文件
```

**改坏了的检测机制**（4 道防线）：

| 防线 | 工具 | 触发时机 | 拦截内容 |
|------|------|---------|---------|
| 1 | stylelint | Vite build / CI | 主题 CSS 文件中出现非 `--<group>-<name>` 命名（违反扁平命名约定，[02 §4.1](./02-ui-tokens-theme.md#41-命名格式)） |
| 2 | 主题完整性脚本 | `pnpm check:theme` / CI | 任一主题缺少参考主题中的 token / 多出参考主题之外的 token / 命名不扁平（实现详见 [02 §8.2](./02-ui-tokens-theme.md#82-脚本结构)） |
| 3 | Tailwind IntelliSense | IDE 实时 | 在组件里写 `bg-` 时 IDE 自动补全所有 token，写 `bg-[#ff0000]` IDE 不补全（视觉提示） |
| 4 | stylelint 禁硬编码 | Vite build / CI | 组件里出现 `bg-[#xxx]` / `bg-red-500` / `rounded-[Npx]` / `style={{ color }}` 一律报错 |

**影响范围**：所有用 Tailwind 语义 class 消费 token 的组件（L2 / L3 / L4 / L5 全部）会同步变化。这就是千人千面的"千面"——改一处 CSS 变量，全站样式跟着切换。

### 3.2 路径 2：L2 原子组件定制 [M2]

**改的对象**：L2 公开组件中的任何一个实现（CVA variants / ref 转发行为 / 默认 props / shadcn 风格的内部 JSX）。

**改的文件**：

```
client/packages/ui-primitives/src/
├── button.tsx
├── input.tsx
├── dialog.tsx
└── ... 其他 22 个
```

**改坏了的检测机制**：

| 防线 | 工具 | 拦截内容 |
|------|------|---------|
| 1 | TypeScript strict | 改了 props 类型却没改使用方 → 编译失败 |
| 2 | Storybook 故事 | 每个 variant 都有故事，肉眼检查改完后是否正常（详见 [03 §5.1](./03-ui-primitives.md#51-每个-variant-一个-story-m2)） |
| 3 | Vitest 单测 | 测试 ref 转发、键盘交互、a11y 属性（详见 [03 §8.1](./03-ui-primitives.md#81-单元测试-m2)） |
| 4 | L2 i18n 禁用规则 | 改 L2 时不小心 `import { useTranslation } from 'react-i18next'` → dependency-cruiser 报错（详见 [03 §4.2](./03-ui-primitives.md#42-禁止内部消费-i18nshadcn-模式硬约束-m2)） |
| 5 | 主题消费规则 | 改 L2 时把 `bg-primary` 改成 `bg-blue-500` → stylelint 报错 |

**影响范围**：所有上层使用者（L3 / L4 / L5）会同步变化。需要重点跑 Storybook 看视觉、跑使用了这个组件的 e2e 测试看交互。

### 3.3 路径 3：L3 业务组件定制 [M3]

**改的对象**：NxTable / NxForm / NxFilter / NxDrawer / NxBar / NxLoading / ApiSelect / NxTree，以及 `PageHeader` / `StatusBadge` / `SearchInput` 等页面骨架组件的内部实现。

**改的文件**：

```
client/packages/ui-patterns/src/
├── nx-table.tsx     # 表格（包 TanStack Table）
├── nx-form.tsx      # 表单（包 RHF + Zod）
├── nx-filter.tsx    # 筛选器
├── nx-drawer.tsx    # 编辑抽屉
├── nx-bar.tsx       # 批量操作栏
├── nx-loading.tsx   # 加载状态
└── api-select.tsx   # 异步下拉
```

**AI 认知负担为什么"高"**：

- L3 组件包了 TanStack Table / React Hook Form / Zod 这些有自己心智模型的库，改 L3 必须理解被包的库的 API
- L3 必须保持"对上层屏蔽底层库"的承诺（[04 §2.2](./04-ui-patterns.md#22-对上层屏蔽的承诺)），改的时候不能让 TanStack Table 的类型泄漏到 props
- L3 不能硬编码业务语义（[04 §4](./04-ui-patterns.md#4-不硬编码业务语义l3-最强硬约束-m3)）——所有"订单/客户/商品"等业务词汇必须由 L5 通过 props 传入

**改坏了的检测机制**：

| 防线 | 工具 | 拦截内容 |
|------|------|---------|
| 1 | TypeScript strict | props 类型变化让所有 L5 使用方编译失败 |
| 2 | 业务语义扫描 | grep L3 源码，发现"订单/客户"等业务词汇即失败（详见 [04 §8.2](./04-ui-patterns.md#82-业务语义扫描-m3)） |
| 3 | Storybook 故事 | 每个组件 3-5 个故事（默认 / 空状态 / loading / 错误） |
| 4 | Vitest 单测 | 列定义、排序、分页、表单提交等核心交互测试 |
| 5 | 使用方 e2e | 改完后跑 `apps/web-admin` 的 Playwright 测试，确认订单列表 / 客户列表都正常 |

### 3.4 路径 4：L4 壳定制 [M3]

**改的对象**：布局结构 / Provider 树 / 全局 UI（Header / Sidebar） / 认证门面 / i18n 配置。

**改的文件**：

```
client/packages/app-shell/src/
├── layouts/
│   ├── layout-resolver.tsx    # authed 布局总入口
│   ├── registry.ts            # preset 注册表
│   └── basic-layout.tsx       # 无菜单布局
├── presets/
│   ├── inset/                 # 默认后台布局
│   └── mix/                   # 模块切换布局
├── customizer/
│   └── theme-customizer.tsx   # 运行时定制面板
└── i18n/
    ├── i18n-instance.ts       # i18n 初始化
    └── zh-CN/{shell,common}.json
```

**AI 认知负担为什么"高"**：

L4 是"换壳不换业务"的关键层（[05 §2.2](./05-app-shell.md#22-l4-是换壳不换业务的关键层)），改它要同时理解：

- TanStack Router 的布局路由 + Outlet 模型（[06 §2.4](./06-routing-and-data.md#24-布局路由-_authedtsx-骨架)）
- `useMenu()` 怎么从后端 mb_iam_menu 树拉数据（[07 §8](./07-menu-permission.md#8-前端-usemenu-hook)）
- StyleProvider 怎么和 `data-style` / `data-mode` / `body data-*` 协作（[02 §5](./02-ui-tokens-theme.md#5-运行时主题模型-m2m3)）
- i18n Provider 怎么和 `Accept-Language` 拦截器同步（[05 §7.6](./05-app-shell.md#76-api-accept-language-自动同步-m2) + [08 §4.3](./08-contract-client.md#43-accept-languageç和-i18n-运行时语言同步)）
- 认证门面 useCurrentUser / useAuth 的状态来源（[05 §5](./05-app-shell.md#5-认证门面-m3)）

**改坏了的检测机制**：

| 防线 | 工具 | 拦截内容 |
|------|------|---------|
| 1 | TypeScript strict | Provider 类型变化让 main.tsx 编译失败 |
| 2 | i18n 完整性脚本 | 改 i18n 时漏翻一个 key → CI 失败（详见 [05 §7.8](./05-app-shell.md#78-完整性校验脚本-m2)） |
| 3 | Playwright E2E | 改布局后跑全套页面切换测试，看登录态 / 菜单 / 主题切换是否还正常 |
| 4 | dependency-cruiser | L4 不能依赖 L5 / api-sdk → 改 L4 时不小心 import features 立即报错（详见 [01 §4.4 规则 4](./01-layer-structure.md#44-dependency-cruiser-配置)） |

### 3.5 路径 5：L5 业务代码定制 [M3+]

**改的对象**：业务功能（features）和路由声明（routes）。

**改的文件**：

```
client/apps/web-admin/src/
├── routes/
│   ├── _authed/
│   │   ├── orders/
│   │   │   ├── index.tsx        # 订单列表
│   │   │   └── $id.tsx          # 订单详情
│   │   └── customers/
│   │       └── ...
│   └── auth/
│       └── login.tsx            # 登录页
├── features/
│   ├── orders/                  # 订单业务逻辑
│   │   ├── use-order-list.ts
│   │   └── order-table.tsx
│   └── customers/
│       └── ...
└── i18n/
    └── zh-CN/order.json         # 业务字典
```

**改坏了的检测机制**：

| 防线 | 工具 | 拦截内容 |
|------|------|---------|
| 1 | TypeScript strict | 改了 features 但 routes 还在用旧签名 → 编译失败 |
| 2 | dependency-cruiser auth 豁免 | features 直接 import authApi → 报错（详见 [08 §6.2](./08-contract-client.md#62-dependency-cruiser-子路径规则)） |
| 3 | dependency-cruiser routes 约束 | 在 features/ 里写 `createFileRoute` → 报错（违反 MUST NOT #5） |
| 4 | i18n 完整性 | 加了业务字典 key 但漏翻其他语言 → CI 失败 |
| 5 | Playwright E2E | 业务流程的端到端测试 |

L5 是"日常工作面"——改 L5 的频率最高，但因为前面 4 层都已经用工具守住了边界，改 L5 出大问题的概率反而最低。

---

## 4. 三种典型定制工作流 [M1+M2+M3]

下面是使用者最常做的三种定制工作流。每种都给完整的操作步骤 + AI prompt 模板（推荐让 AI 辅助执行）。

### 4.1 工作流 A：换主题（改色）

**场景**：使用者拿到 meta-build 后，要把默认主题从中性蓝色改成飞书风格的青蓝色，并且 dark 主题也跟着改。

**步骤**：

1. **打开 canonical style 文件** `client/packages/ui-tokens/src/styles/classic.css`
2. **修改颜色变量**——找到 `--color-primary` 和 `--color-primary-foreground` 两行，改成新的颜色值
3. **同步修改 dark block** `[data-style='classic'][data-mode='dark']` 的对应变量
4. **跑主题完整性校验** `pnpm -C client check:theme`，确认每个主题都有完整的 46 个 token
5. **跑 Storybook 看效果** `pnpm -C client/packages/ui-primitives storybook`——所有消费 L1 token 的 L2 组件会立刻显示新颜色
6. **跑 dev server 看真实页面** `pnpm -C client/apps/web-admin dev`，切换 Header 的主题切换按钮看 default ↔ dark 效果

**AI prompt 模板**：

```
请帮我把 meta-build 的 default 主题从中性蓝改成飞书风格的青蓝色（接近 #3370FF）。

约束：
1. 只改 `client/packages/ui-tokens/src/styles/classic.css` 里的 light / dark 两个 block 的 `--color-primary` 和 `--color-primary-foreground`
2. 不要在任何组件里写硬编码颜色——改完后跑 pnpm -C client check:theme 必须通过
3. dark 主题的 primary 色要降一些饱和度（暗色背景下不刺眼）
4. 不要动其他 token（accent / destructive / muted 等）

完成后告诉我：
- 实际改了哪几行
- pnpm check:theme 的输出
- 建议我打开哪个 Storybook 故事最快验证效果
```

**预期影响**：全站所有用 `bg-primary` / `text-primary` / `border-primary` 的元素同步变色。验证方式：打开 Storybook 看 Button / Badge / Tabs 的 primary variant，再打开 dev server 看登录页 / 订单列表的所有按钮和高亮色。

**踩坑提醒**：

- 不要在 `classic.css` 之外的任何地方写蓝色 hex code——否则定制就被污染了
- 改完后**必须**跑 `check:theme`——如果不小心拼错变量名（如 `--color-primery`），会被检测出"参考主题之外的多余变量"

### 4.2 工作流 B：换组件样式（改按钮圆角）

**场景**：使用者觉得默认按钮太圆（`rounded-md` 即 8px），想改成方一些（4px）。

**步骤**：

1. **决策点**：是想"全站圆角风格变方"，还是"只有按钮变方"？
   - 全站变方 → 改 `--radius-md` 这个 token（路径 1）
   - 只按钮变方 → 改 Button 组件的 CVA 默认 size（路径 2）
2. 假设是"只按钮变方"——打开 `client/packages/ui-primitives/src/button.tsx`
3. **修改 CVA variants**——找到 `buttonVariants` 的 `size: { default: 'h-10 px-4 py-2 rounded-md' }`，把 `rounded-md` 改成 `rounded-sm`
4. **跑 Storybook** `pnpm -C client/packages/ui-primitives storybook`，打开 Button 故事看新圆角
5. **跑 Vitest** `pnpm -C client/packages/ui-primitives test`，确认所有 ref prop / a11y 测试还通过
6. **如果 Vitest 里有视觉快照测试**，删除旧快照让它重新生成

**AI prompt 模板**：

```
请帮我把 meta-build 的 Button 默认尺寸的圆角改小一点（从 rounded-md 改成 rounded-sm）。

约束：
1. 只改 client/packages/ui-primitives/src/button.tsx 的 buttonVariants CVA 定义
2. 不要硬编码 px 值（不要写 rounded-[4px]，要用 rounded-sm 这个语义 class）
3. 不要改其他 size variant（sm / lg / icon），只改 default
4. 改完后必须能通过 pnpm -C client/packages/ui-primitives test
5. Storybook 的 Button/All Variants 故事要能渲染出新圆角

完成后告诉我：
- 改了哪一行
- 是否需要更新 Storybook 快照
```

**预期影响**：所有 L3 / L4 / L5 用到 Button 默认尺寸的地方都变方。如果想"只在订单详情页用方按钮"，那不应该走这个路径——应该在订单详情页用 `<Button className="rounded-sm">`（但这是反模式，因为引入了局部样式偏差）。

**踩坑提醒**：

- 不要写 `rounded-[4px]`——会被 stylelint 拦截
- 如果想加新 size variant（如 `dense`），CVA 的类型会自动推导，不用手改 props 接口

### 4.3 工作流 C：换布局（改侧边栏结构）

**场景**：使用者觉得默认的侧边栏树形折叠太复杂，想改成"分组扁平列表"风格（一级菜单作为分组标题，二级菜单直接展开成列表项）。

**步骤**：

1. **打开侧边栏文件** `client/packages/app-shell/src/sidebar/sidebar.tsx`
2. **理解原结构**——侧边栏消费 `useMenu()` 拿到 mb_iam_menu 树（详见 [07 §8](./07-menu-permission.md#8-前端-usemenu-hook)），递归渲染每一级菜单
3. **改渲染逻辑**——把递归的 `<MenuTree>` 改成两段渲染：
   - 一级菜单（`level === 0`）渲染为 `<SidebarGroup>` 标题
   - 二级菜单（`level === 1`）渲染为 `<SidebarItem>` 列表项
4. **不要改 useMenu / mb_iam_menu 数据结构**——只改渲染层
5. **跑 dev server** 看新侧边栏在登录状态下是否正常
6. **跑 Playwright 测试** `pnpm -C client/apps/web-admin test:e2e`，验证菜单跳转 / 高亮 / 折叠 / 主题切换 / 退出登录都还正常
7. **手动测试**：随便选一个孤儿菜单（指向已删除路由的菜单节点）确认灰化提示还在（[07 §10](./07-menu-permission.md#10-孤儿处理-ui)）

**AI prompt 模板**：

```
请帮我把 meta-build 的 `inset` preset 侧边栏从树形折叠改成分组扁平列表风格。

约束：
1. 只改 client/packages/app-shell/src/sidebar/sidebar.tsx 一个文件
2. 不要改 useMenu hook 的实现——只改渲染层
3. 不要改 mb_iam_menu 表结构或 backend API
4. 不要硬编码颜色（用 bg-muted / text-muted-foreground 等 token）
5. 改完后跑 Playwright 测试必须通过
6. 必须保留三个核心行为：菜单点击跳转、当前路由高亮、孤儿菜单灰化

实现要求：
- 一级菜单（level === 0）渲染为不可点击的分组标题
- 二级菜单（level === 1）渲染为列表项，支持 active 状态
- 没有三级菜单的情况，但要保留递归代码以防未来扩展

完成后告诉我：
- 改了哪些 JSX 段
- 跑 Playwright 的输出
- 是否需要补 Storybook 故事
```

**预期影响**：所有使用 `inset` preset 的页面侧边栏外观变化。`mix` 和 `BasicLayout` 不受影响。

**踩坑提醒**：

- L4 不能 import L5 → 千万不要在 sidebar.tsx 里 `import ... from '@/features/...'`，dependency-cruiser 会报错
- L4 内部文案必须走 i18n → 分组标题不要写中文字符串，要走 `t('shell.menu.group.system')`（详见 [05 §7.2](./05-app-shell.md#72-字典目录结构-m2)）
- 改完后 i18n 完整性脚本如果发现新增 key 在其他语言里没翻译，CI 会失败——记得同步翻译

---

## 5. AI 辅助定制的最佳实践 [通用]

meta-build 的设计假设是"使用者会用 AI（Claude / Cursor / Copilot）协助定制"。下面是可以直接复制粘贴的 prompt 模板，覆盖最常见的 5 类定制需求。

### 5.1 Prompt 模板 A：从产品需求改样式

```
你是 meta-build 项目的前端定制助手。我要做以下定制：

需求：<一句话描述视觉变化，例如"把主品牌色从蓝色改成紫色">

请遵守以下约束：
1. meta-build 是 5 层 pnpm workspace（L1 ui-tokens → L2 ui-primitives → L3 ui-patterns → L4 app-shell → L5 web-admin）
2. 任何颜色 / 圆角 / 间距改动必须改 L1 的 CSS 变量，禁止在组件里写硬编码
3. 改完后跑 pnpm -C client check:theme 必须通过
4. 不要改任何文件的 import 路径（依赖方向是单向的，违反即编译失败）
5. 不要新增 npm 依赖（每层有白名单，详见 docs/specs/frontend/01-layer-structure.md §4.3）

请：
1. 先告诉我应该走 5 条定制路径中的哪一条（路径 1=L1 主题 / 路径 2=L2 组件 / ... / 路径 5=L5 业务）
2. 给出具体要改的文件路径和 diff
3. 列出验证命令
```

### 5.2 Prompt 模板 B：加新业务模块（页面 + 后端 API）

```
你是 meta-build 项目的全栈定制助手。我要新增一个业务模块：

模块名：<例如"客户合同管理"，英文 contract>
功能：<例如"列表页 + 详情页 + 新增/编辑表单">

请遵守以下约束：
1. 路由必须放在 client/apps/web-admin/src/routes/_authed/contracts/，不能放在 features 里
2. 业务逻辑（hooks / API 封装）放 client/apps/web-admin/src/features/contracts/
3. 所有 API 调用必须通过 @mb/api-sdk，禁止手写 fetch / axios
4. 路由必须用 requireAuth({ permission: 'contract.read' }) 守卫
5. 表格用 @mb/ui-patterns 的 NxTable，表单用 NxForm，禁止直接 import TanStack Table 或 React Hook Form
6. 所有用户可见文案走 t('contract.xxx')，新增 client/apps/web-admin/src/i18n/zh-CN/contract.json
7. 后端权限点必须先在 mb_iam_route_tree 注册（详见 docs/specs/frontend/07-menu-permission.md §6）

请：
1. 列出要创建的所有文件路径
2. 给出每个文件的完整代码（不要 // TODO 占位）
3. 列出运维需要在菜单管理页做哪些事（添加 mb_iam_menu 节点 / 给角色赋权）
4. 列出验证命令（tsc / 单测 / Playwright）
```

### 5.3 Prompt 模板 C：加新原子组件

```
你是 meta-build 项目的 L2 ui-primitives 维护者。我要新增一个原子组件：

组件名：<例如 Slider / NumberInput / ColorPicker>
来源：<例如"shadcn/ui 的 Slider 组件"或"自己写一个"或"包裹 react-number-format">

请遵守以下约束（详见 docs/specs/frontend/03-ui-primitives.md）：
1. 文件位置：client/packages/ui-primitives/src/<kebab-case>.tsx
2. 组件通过 `ref` prop 转发 ref（React 19 原生支持，不需要 `forwardRef`）
3. 必须用 CVA 定义 variants（如果有多 variant）
4. 所有视觉走 Tailwind 语义 class（bg-primary / text-foreground 等），禁止硬编码
5. 禁止 import react-i18next（L2 i18n 零感知，文案通过 props 传入）
6. 必须导出到 client/packages/ui-primitives/src/index.ts
7. 必须有 Storybook 故事（每个 variant 一个）
8. 必须有 Vitest 单测（覆盖 ref 转发、基本交互）
9. 第三方依赖必须在 L2 白名单内（详见 docs/specs/frontend/01-layer-structure.md §4.3.2）

请：
1. 给出完整的组件实现
2. 给出 Storybook 故事
3. 给出单测
4. 列出新增的 npm 依赖（如果有）和需要在 package.json 里更新的位置
```

### 5.4 Prompt 模板 D：改主题加新语言

```
你是 meta-build 项目的 i18n 维护者。我要新增一种语言支持：

新语言：<例如 ja-JP（日语）>

请遵守以下约束（详见 docs/specs/frontend/05-app-shell.md §7）：
1. 在 client/packages/app-shell/src/i18n/ja-JP/ 下加 shell.json 和 common.json
2. 在 client/apps/web-admin/src/i18n/ja-JP/ 下加 order.json 等所有业务 namespace
3. key 必须和 zh-CN 完全一致（一个不多一个不少），翻译值用日语
4. 更新 client/packages/app-shell/src/i18n/i18n-instance.ts 的 SUPPORTED_LANGUAGES 和 init.resources
5. 不要改 DEFAULT_LANGUAGE（保持 zh-CN）
6. 跑 pnpm -C client check:i18n 必须通过

请：
1. 列出所有需要新建的文件
2. 给出 i18n-instance.ts 的 diff
3. 跑校验命令
4. 提醒我：后端 messages_ja_JP.properties 也要同步加（详见 docs/specs/backend/06-api-and-contract.md §4）
```

### 5.5 Prompt 模板 E：诊断和修复违反硬约束的代码

```
你是 meta-build 项目的硬约束检查员。下面是 CI 报错：

<粘贴 CI 输出>

请：
1. 识别违反的是哪条硬约束（详见 docs/specs/frontend/10-quality-gates.md §2 / §3）
2. 解释为什么这条约束存在（千人千面保护 / 依赖方向 / 等）
3. 给出修复方案（要么改代码合规，要么调整约束本身——但调整约束需要先讨论）
4. 不要绕过工具检查（不要 // biome-ignore、不要 // dependency-cruiser-disable-next-line）
```

---

## 6. 千人千面的验证方式 [M2+M3]

"千人千面"是一句口号，但工具能让它变成可验证的事实。下面是验证使用者改的主题确实做到"换皮不换业务"的具体步骤。

### 6.1 主题切换的肉眼验证

**前提**：使用者已经定义了 `classic` 风格，并接入了 `StyleProvider + ThemeCustomizer`。

**步骤**：

1. 启动 dev server：`pnpm -C client/apps/web-admin dev`
2. 登录到任意业务页面（例如订单列表）
3. 在 Header 右上角点击 ThemeCustomizer，依次切换 `classic light` / `classic dark` / `scale=compact + radius=sm`
4. **观察**：所有按钮、表格、表单、图标都同步变色 / 变密度，**不应该**出现某个按钮颜色没跟着变（如果有，说明它硬编码了颜色，应该被 stylelint 拦截，但漏网了）
5. 切回 default，刷新页面，主题应该被记住（localStorage 持久化，[02 §5.3](./02-ui-tokens-theme.md#53-初始化时机)）

### 6.2 主题完整性的工具验证

```bash
# 检查所有主题都定义了完整的 46 个 token
pnpm -C client check:theme

# 检查所有主题没有硬编码颜色
pnpm -C client lint  # 包含 stylelint
```

### 6.3 加新主题的端到端验证

**目标**：使用者加一套完全不同的主题（例如"lark-console"飞书管理后台风格），验证换主题不会破坏任何业务功能。

**步骤**：

1. 按 [02 §9](./02-ui-tokens-theme.md#9-使用者扩展新主题的步骤-m2) 加新主题文件
2. 跑 `pnpm -C client check:theme` 验证完整性
3. 在 Style Registry 注册新风格
4. 启动 dev server，在 ThemeCustomizer 的风格下拉框选择 `lark-console`
5. **断言**：
   - 所有页面的主色变成飞书蓝
   - 所有按钮 / 表格 / 表单 / 弹窗的圆角和尺寸符合飞书风格
   - 没有任何"忘了改"的硬编码颜色
   - 切回 default 一切正常
6. 跑全套 Playwright E2E：`pnpm -C client/apps/web-admin test:e2e`——业务流程不应受主题影响

如果第 5 步发现有"忘了改"的颜色 → 那是 stylelint 漏网，去 [10-quality-gates.md](./10-quality-gates.md) 加一条规则。

---

## 6A. 新增 Style / 新增 Layout Preset 的 how-to 清单 [M2+M3]

> **这一节是"加一套风格"或"加一套布局"的最小可执行清单**。完整原理见对应专题文档（02 §9 / 05 §3.5）。

### 6A.1 新增一套 Style（L1 层）

典型场景：加品牌色主题、加"暗紫色"变种、对齐某设计体系（如 Plan A 新增 `claude-warm`）。

| 步 | 动作 | 关键文件 |
|---|------|---------|
| 1 | 创建 semantic token 覆写文件 `semantic-<id>.css`，覆写全部 70 个语义 token × 2 mode | `client/packages/ui-tokens/src/tokens/semantic-<id>.css` |
| 2 | 在入口 CSS 按 `primitive → semantic-* → component` 顺序追加 `@import` | `client/packages/ui-tokens/src/styles/index.css` |
| 3 | 在 Style Registry 调 `styleRegistry.register({ id, displayName, description, color, cssFile })` | `client/packages/ui-tokens/src/style-registry.ts` |
| 4 | M6 前的双维护同步：`window.__MB_STYLE_IDS__` 和 `index.html` 首帧脚本的 `fallback` 数组追加新 id | `client/apps/web-admin/src/main.tsx` + `client/apps/web-admin/index.html` |
| 5 | 跑 `pnpm -F @mb/ui-tokens check:theme` 确认完整性通过 | — |
| 6 | dev server 打开 ThemeCustomizer 的风格下拉框验证新 id 可选、切换生效 | — |

**完整原理**：[02 §9](./02-ui-tokens-theme.md#9-使用者扩展新风格的步骤-m2)。

### 6A.2 新增一套 Layout Preset（L4 层）

典型场景：加"中顶部 tab + 左侧栏"布局、Plan A 的 `claude-classic` / `claude-inset` / `claude-rail`。

| 步 | 动作 | 关键文件 |
|---|------|---------|
| 1 | 实现符合 `ShellLayoutProps` 的 React 组件（参考 `presets/inset/inset-layout.tsx`） | `client/packages/app-shell/src/presets/<id>/<id>-layout.tsx` |
| 2 | 通过 `LayoutPresetDef.supportedDimensions` 声明支持的 Customizer 维度（`'contentLayout'` / `'sidebarMode'`） | 同上 preset 目录下的 `def.ts` |
| 3 | 在应用入口调 `registerLayout(presetDef)`（禁止依赖 side-effect import 顺序定义默认值） | `client/apps/web-admin/src/main.tsx` 或 `bootstrap.ts` |
| 4 | 如需让 ThemeCustomizer 下拉显示新 preset，无需额外配置（UI 读 `layoutRegistry.list()` 动态渲染） | — |
| 5 | 补 Playwright 视觉 baseline（`pnpm -C apps/web-admin test:e2e --update-snapshots`） | — |
| 6 | dev server 切换到新 preset 验证菜单 / 内容区域 / Customizer UI 正常 | — |

**完整原理**：[05 §3.5](./05-app-shell.md#35-扩展新-layout-preset) + [ADR frontend-0025 三层导航哲学](../../adr/frontend-0025-three-layer-navigation-philosophy.md)。

### 6A.3 容易踩的坑

- **Style 没有覆写完整 70 token** → `check:theme` 报错，去补齐缺失项
- **Preset 没声明 `supportedDimensions`** → ThemeCustomizer 里对应维度会被错误地启用，引入伪控制
- **Preset 依赖"第一个 import 即默认"的 side-effect 顺序** → 违反 05 §3.2 的显式注册约束，AI 和 bundler 推理会失真
- **新 style 忘了同步 `index.html` fallback** → 首帧闪烁（localStorage 里有新 id，但首帧脚本白名单还没更新）

---

## 7. 何时应该停下来问 [通用]

下面这些场景，**不要**直接改代码，先停下来讨论：

| 场景 | 为什么要停 |
|------|----------|
| 想在 L2 / L3 / L4 里 import `useTranslation` | 违反 L2/L3 i18n 零感知（[03 §4.2](./03-ui-primitives.md#42-禁止内部消费-i18nshadcn-模式硬约束-m2)） |
| 想在 features 里 import `authApi` | 违反认证门面豁免（[08 §6](./08-contract-client.md#6-认证门面豁免)） |
| 想新增 npm 依赖到 L1 / L2 / L3 / L4 | 违反白名单依赖（[01 §4.3](./01-layer-structure.md#43-每层-allow-list)） |
| 想在 L3 里写"订单/客户/商品"业务词汇 | 违反 L3 不硬编码业务语义（[04 §4](./04-ui-patterns.md#4-不硬编码业务语义l3-最强硬约束-m3)） |
| 想把权限点写在前端不告诉后端 | 违反"代码权威 + 双树架构"（[07 §6.1](./07-menu-permission.md#61-代码权威原则)） |
| 想在 routes 之外的位置写 `createFileRoute` | 违反 MUST NOT #5（[06 §2.1](./06-routing-and-data.md#21-routes-目录约定)） |
| 想用 `// biome-ignore` 或 `// dependency-cruiser-disable-next-line` 绕过工具 | 工具拦截就是千人千面保护，绕过 = 污染 |

**正确做法**：先在 commit message 或 PR 里说明"为什么这条约束在我的场景下不适用"，让团队评审后决定是改约束还是改方案。任何"为了快"绕过工具的做法都会让下一个 fork 这套代码的人踩坑。

---

## 8. 引用关系

| 主题 | 详见 |
|------|------|
| 5 层结构和依赖方向 | [01-layer-structure.md](./01-layer-structure.md) |
| 主题 token 完整清单和扁平命名 | [02-ui-tokens-theme.md](./02-ui-tokens-theme.md) |
| L2 公开组件清单 + Storybook 规范 | [03-ui-primitives.md](./03-ui-primitives.md) |
| L3 业务组件与页面骨架 + 不硬编码业务语义 | [04-ui-patterns.md](./04-ui-patterns.md) |
| 布局预设 + Provider 树 + i18n 完整工程 | [05-app-shell.md](./05-app-shell.md) |
| TanStack Router 文件路由 + requireAuth | [06-routing-and-data.md](./06-routing-and-data.md) |
| 双树权限架构 + useMenu + 孤儿处理 | [07-menu-permission.md](./07-menu-permission.md) |
| @mb/api-sdk 使用规范 + 认证门面豁免 | [08-contract-client.md](./08-contract-client.md) |
| 13 条硬约束 + 2 条推荐完整表 + 10 个工具链总览 | [10-quality-gates.md](./10-quality-gates.md) |

<!-- verify: cd client && pnpm install && pnpm -C apps/web-admin tsc --noEmit && pnpm check:theme && pnpm check:i18n -->

---

[← 返回 README](./README.md)
