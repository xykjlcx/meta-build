# 01 - 5 层结构与依赖方向守护

> **关注点**：5 层 pnpm workspace package 职责 + 单向依赖硬约束 + 脚手架定位 + 每层第三方依赖白名单 + 守护机制（pnpm workspace + dependency-cruiser 双保险）。
>
> **本文件吸收**：brainstorming 决策 3（5 层分层）+ 决策 5（脚手架 vs 框架）+ 决策 2（依赖方向守护）+ 千人千面 6 条 MUST NOT 中的 #2 / #3 / #6（依赖方向相关）。

---

## 1. 决策结论 [M1]

### 1.1 5 层 pnpm workspace 结构

client 端采用 **5 层 pnpm workspace + 1 个独立契约包** 结构，依赖严格单向：

```
@mb/ui-tokens → @mb/ui-primitives → @mb/ui-patterns → @mb/app-shell → apps/web-admin
                                                                            ↓
                                                                       @mb/api-sdk
```

| 层 | 包名 | 职责 | 隔离的第三方依赖 |
|---|------|------|-----------------|
| L1 | `@mb/ui-tokens` | Design tokens（CSS Variables）+ Style Registry + Tailwind v4 CSS-first 配置（`@theme` 指令） | 无（纯 CSS + TS 常量） |
| L2 | `@mb/ui-primitives` | 42 个原子组件（shadcn/Radix 风格）| Radix UI / shadcn primitives / CVA / clsx |
| L3 | `@mb/ui-patterns` | 8 个业务组件（NxTable / NxForm / NxTree / ...）| TanStack Table / React Hook Form / Zod / date-fns |
| L4 | `@mb/app-shell` | 布局 / Provider 树 / 认证门面 / 全局 UI / i18n 机制 | TanStack Router / TanStack Query / i18next |
| L5 | `apps/web-admin` | 业务代码（features + routes）| 业务专属（无公共白名单） |
| ★ | `@mb/api-sdk` | 契约客户端 package（手写层入 git，generated/ 不入 git） | orval 运行时 + 手写拦截器 |

### 1.2 决策依据（5 层而非 3 层）

| 候选 | 决策 | 否决理由 |
|------|------|---------|
| 3 层（tokens + components + app） | ❌ | 原子组件和业务组件混在一层；未来要做多 UI 库变体（shadcn/antd/feishu 风格）时无法物理隔离 |
| 4 层（tokens + primitives + patterns + app） | ❌ | 把 shell（布局/Provider/i18n/认证门面）和业务 features 揉在 app 一层；定制壳时容易污染业务 |
| **5 层 + api-sdk** | ✅ | 每一层物理隔离一类第三方依赖；shell 独立后"换壳不换业务"成为可能；业务代码（L5）和底座（L1-L4）的边界清晰，使用者容易判断"我在改底座还是改业务" |

### 1.3 决策依据（脚手架而非框架）

| 候选 | 决策 | 否决理由 |
|------|------|---------|
| npm 依赖库（持续维护 + semver 升级） | ❌ | 千人千面要求使用者改 L1-L4 源码；npm 包升级会冲突；CLAUDE.md 哲学是"使用者拥有所有源码" |
| CLI 生成器（每次生成新项目） | ❌ | 重新生成会丢使用者的定制；CLI 维护成本高；不符合"AI 直接改源码"的工作流 |
| **git 模板仓库** | ✅ | 使用者 fork/clone 后所有源码都是自己的资产；不强制升级；AI 可以自由修改任何一层；通过 GitHub "Use this template" 一键创建 |

---

## 2. 5 层 package 结构 [M1]

### 2.1 层级图

```
┌────────────────────────────────────────────────────┐
│ L5  apps/web-admin            （业务代码 + features） │
│     ↓                                              │
│ L4  @mb/app-shell             （布局 + i18n + 认证）  │
│     ↓                                              │
│ L3  @mb/ui-patterns           （NxTable / NxForm）   │
│     ↓                                              │
│ L2  @mb/ui-primitives         （Button / Dialog）    │
│     ↓                                              │
│ L1  @mb/ui-tokens             （CSS Variables）      │
└────────────────────────────────────────────────────┘
            ↑
   ┌────────┴────────┐
   │  @mb/api-sdk    │  ← OpenAPI 生成产物，被 L5 直接消费
   │  （契约包，独立） │     被 L4 auth/menu/permission 基础设施调用
   └─────────────────┘
```

### 2.2 每层的存在理由（拿掉它会怎样）

| 层 | 拿掉它会怎样 |
|---|------------|
| `@mb/ui-tokens` | 颜色/圆角/间距没有单一事实源；多套主题无法保证完整性；Tailwind v4 `@theme` 配置散落在每个 app 里重复维护 |
| `@mb/ui-primitives` | 上层直接依赖 Radix/shadcn 原始组件；想换底层 UI 库（shadcn → antd 风格）时需要改所有调用点；无法做"千人千面"的样式定制 |
| `@mb/ui-patterns` | 每个业务模块自己 wrap TanStack Table / RHF；表格/表单代码重复爆炸；TanStack 升级时全应用受冲击 |
| `@mb/app-shell` | 路由、Provider、认证门面、i18n 机制散落在业务代码里；"换壳不换业务"无法实现；多个 web app 时基础设施代码无法复用 |
| `apps/web-admin` | 没有任何具体的业务实现；底座的设计无法被验证 |
| `@mb/api-sdk` | 每个调用点手写 fetch；类型在前后端之间漂移；后端契约变更时前端发现不了 |

### 2.3 每层隔离的第三方依赖

**L1 `@mb/ui-tokens`** —— 零第三方运行时依赖

- 只输出 CSS 文件 + Tailwind v4 `@theme` 配置 + 极少量 TS 常量
- 不依赖 React，不依赖任何 npm 包（开发时仅 `typescript` / `vitest`）

**L2 `@mb/ui-primitives`** —— 隔离 Radix / shadcn

- L2 把 `@radix-ui/react-dialog` / `@radix-ui/react-select` 等 wrap 成 `@mb/ui-primitives` 的 `Dialog` / `Select`
- 上层（L3/L4/L5）**永远不直接 import `@radix-ui/*`**
- 未来要做"antd 风格变体"时只需新建 `@mb/ui-primitives-antd`，上层切换 import 路径即可

**L3 `@mb/ui-patterns`** —— 隔离 TanStack Table / React Hook Form / Zod

- L3 把 `@tanstack/react-table` 包成 `NxTable`，把 `react-hook-form + zod` 包成 `NxForm`
- 上层（L4/L5）**永远不直接 import `@tanstack/react-table` / `react-hook-form` / `zod`**
- 业务模块写表格时只需 `<NxTable columns={...} data={...} />`，不感知 TanStack Table 的 API 细节

**L4 `@mb/app-shell`** —— 隔离 TanStack Router / TanStack Query / i18next

- L4 是 Provider 树和路由守卫的归属层
- L5 业务代码只通过 L4 暴露的 hook（`useCurrentUser` / `useMenu` / `useLanguage` / `useStyle`）访问应用基础设施
- 路由声明用 `@tanstack/react-router` 的 `createFileRoute`，但只允许在 `apps/web-admin/src/routes/**/*.tsx` 出现

**L5 `apps/web-admin`** —— 业务代码

- 没有"白名单依赖"概念，业务自己决定用什么（但仍受 L1-L4 的约束传递）
- **唯一硬约束**：所有 API 调用必须走 `@mb/api-sdk`；所有 UI 组件必须走 `@mb/ui-primitives` / `@mb/ui-patterns`；所有路由必须在 `routes/**/*.tsx` 声明

### 2.4 包命名规范

| 层 | npm scope | 示例 |
|---|-----------|------|
| L1 | `@mb/*` | `@mb/ui-tokens` |
| L2 | `@mb/*` | `@mb/ui-primitives` |
| L3 | `@mb/*` | `@mb/ui-patterns` |
| L4 | `@mb/*` | `@mb/app-shell` |
| L5 | 无 scope | `web-admin`（在 `apps/` 下） |
| 契约包 | `@mb/*` | `@mb/api-sdk` |

**对称于后端的 `com.metabuild.<layer>.<domain>` 包命名**：前端用 npm scope `@mb/*` 表达"meta-build 底座"，scope 内的包名直接表达层级（`ui-tokens` / `ui-primitives` / `ui-patterns` / `app-shell`）。

### 2.5 client/ 完整目录树

```
client/
├── pnpm-workspace.yaml                        # workspace 配置
├── package.json                               # 根 package.json（scripts + devDependencies）
├── tsconfig.base.json                         # 共享 TS strict 配置
├── biome.json                                 # 代码风格 + 基础 lint
├── .dependency-cruiser.cjs                    # 依赖方向 + 白名单约束（详见 §4.2）
├── .env.example                               # 所有 import.meta.env.* 的声明
│
├── packages/
│   ├── ui-tokens/                             # L1 设计令牌
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                       # 导出 Style Registry + 类型
│   │   │   ├── tailwind-theme.css             # Tailwind v4 CSS-first 配置（@theme 指令映射 CSS 变量）
│   │   │   ├── styles/
│   │   │   │   ├── classic.css                # canonical style（light + dark）
│   │   │   │   └── index.css
│   │   │   ├── style-registry.ts              # Style 元数据登记
│   │   │   └── customizer.css                 # scale / radius / contentLayout CSS 维度
│   │   └── scripts/
│   │       └── check-theme-integrity.ts       # 主题完整性校验脚本（详见 02 章）
│   │
│   ├── ui-primitives/                         # L2 42 个原子组件
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                       # barrel export
│   │   │   ├── button.tsx                     # 隔离 Radix Slot
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx                     # 隔离 @radix-ui/react-dialog
│   │   │   ├── select.tsx                     # 隔离 @radix-ui/react-select
│   │   │   └── ...                            # 详见 03-ui-primitives.md
│   │   └── stories/                           # Storybook（每个 variant 一个故事）
│   │
│   ├── ui-patterns/                           # L3 8 个业务组件
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── nx-table/                      # 隔离 @tanstack/react-table
│   │   │   ├── nx-form/                       # 隔离 react-hook-form + zod
│   │   │   ├── nx-filter/
│   │   │   ├── nx-drawer/
│   │   │   ├── nx-bar/
│   │   │   ├── nx-loading/
│   │   │   └── api-select/
│   │   └── stories/
│   │
│   ├── app-shell/                             # L4 应用基础设施
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── layouts/
│   │       │   ├── layout-resolver.tsx
│   │       │   ├── registry.ts
│   │       │   ├── layout-preset-provider.tsx
│   │       │   └── basic-layout.tsx
│   │       ├── presets/
│   │       │   ├── inset/
│   │       │   └── module-switcher/
│   │       ├── auth/
│   │       │   ├── use-current-user.ts        # 认证读门面（对应后端 CurrentUser）
│   │       │   ├── use-auth.ts                # 认证写门面（对应后端 AuthFacade）
│   │       │   └── require-auth.ts            # 路由守卫工厂
│   │       ├── menu/
│   │       │   ├── use-menu.ts                # 菜单 hook
│   │       │   ├── types.ts
│   │       │   └── icon-map.ts                # lucide 图标白名单
│   │       ├── i18n/
│   │       │   ├── i18n-instance.ts
│   │       │   ├── use-language.ts
│   │       │   ├── language-switcher.tsx
│   │       │   └── locales/
│   │       │       ├── zh-CN/
│   │       │       │   ├── shell.json
│   │       │       │   └── common.json
│   │       │       └── en-US/
│   │       │           ├── shell.json
│   │       │           └── common.json
│   │       ├── theme/
│   │       │   ├── use-style.ts
│   │       │   └── style-provider.tsx
│   │       └── customizer/
│   │           ├── theme-customizer.tsx
│   │           └── use-customizer-settings.ts
│   │
│   └── api-sdk/                               # 契约包（OpenAPI 产物）
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── generated/                     # orval 产物（不入 git）
│           └── index.ts                       # barrel + 拦截器配置入口
│
└── apps/
    └── web-admin/                             # L5 业务代码
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        ├── index.html
        ├── .env.example
        └── src/
            ├── main.tsx
            ├── routes/                        # ★ 路由唯一合法位置
            │   ├── __root.tsx
            │   ├── auth/
            │   │   ├── login.tsx              # 豁免：可直接 import @mb/api-sdk/auth
            │   │   └── logout.tsx
            │   ├── orders/
            │   │   ├── index.tsx              # 列表
            │   │   └── $id.tsx                # 详情
            │   └── customers/
            │       ├── index.tsx
            │       └── $id.tsx
            ├── features/                      # 业务功能模块
            │   ├── orders/
            │   │   ├── components/
            │   │   ├── hooks/
            │   │   └── api.ts                 # 通过 @mb/api-sdk 调用后端
            │   └── customers/
            └── i18n/
                └── locales/
                    ├── zh-CN/
                    │   ├── orders.json        # L5 业务字典（按业务模块分 namespace）
                    │   └── customers.json
                    └── en-US/
                        ├── orders.json
                        └── customers.json
```

### 2.6 单向依赖硬约束

详细的"哪个层允许依赖哪些 `@mb/*`" 见 §4.3 allow-list 表。这里只说**结构层面**的硬约束：

- `@mb/ui-tokens` **零 `@mb/*` 依赖**（L1 是依赖图的根）
- `@mb/ui-primitives` 只允许依赖 `@mb/ui-tokens`
- `@mb/ui-patterns` 只允许依赖 `@mb/ui-tokens + @mb/ui-primitives`
- `@mb/app-shell` 只允许依赖 `@mb/ui-tokens + @mb/ui-primitives + @mb/ui-patterns + @mb/api-sdk`
- `apps/web-admin` 允许依赖所有 L1-L4 + `@mb/api-sdk`
- `@mb/api-sdk` **零 `@mb/*` 依赖**（与 L1-L4 解耦，被 L5 消费 + L4 auth/menu/permission 基础设施调用）

**允许单向跨级**：L5 直接 `import { Button } from '@mb/ui-primitives'` 是合法的（跳过 L3 和 L4）。**反向 import 才被禁止**——例如 L2 不能 import `@mb/ui-patterns`，L1 不能 import 任何 `@mb/*`。

<!-- verify: cd client && pnpm install && pnpm -r tsc --noEmit -->

---

## 3. 脚手架模式 [M1]

### 3.1 定位：git 模板仓库，不是 npm 依赖库

meta-build 前端是 **git 模板仓库**（template repository），不是 npm 包。

| 维度 | meta-build 前端 | 普通 UI 库（如 antd / shadcn-ui） |
|------|----------------|----------------------------------|
| 分发形态 | git 仓库（GitHub "Use this template" / `git clone`）| npm 包（`npm install`）|
| 使用者获得什么 | 整个 monorepo 的所有源码（L1-L5 + 配置 + 工具链） | `node_modules/<pkg>/dist/*` 的编译产物 |
| 升级路径 | 手动 cherry-pick / 不强制升级 | `npm update` |
| 定制深度 | 任意改 L1-L5 源码（包括底座的 42 个原子组件） | 通过 props / theme override / shadcn 式复制源码 |
| 多项目复用 | 每次新项目重新 clone（每份独立演化） | 多项目共享同一份依赖 |

### 3.2 分发形态

**主路径**：GitHub "Use this template" 按钮 → 一键创建新仓库
- 使用者得到的是一个**完整的 monorepo**，所有 L1-L5 源码都在自己的 git 历史里
- 不与 meta-build 上游仓库有任何 npm 依赖关系

**备用路径**：`git clone <url> --depth 1` + 删除 `.git` + 重新 `git init`
- 适合不想用 GitHub template 的场景（GitLab / 内部 Gitea / 离线环境）

### 3.3 使用者升级策略

**默认不升级**。使用者 fork 后的项目和上游 meta-build **没有任何自动同步关系**。

**如果想拿上游的更新**（手动 cherry-pick）：
1. 在使用者仓库添加 upstream remote：`git remote add upstream <meta-build-url>`
2. `git fetch upstream`
3. 看 upstream 的 commit 历史，挑出想要的 commit：`git cherry-pick <commit-sha>`
4. 解决冲突（使用者改过的文件可能冲突）
5. 提交

**为什么不做"自动升级"**：
- 千人千面要求使用者改 L1-L4 源码 → 任何"覆盖式升级"都会摧毁定制
- AI 时代的工作流是"AI 改本仓库代码"而不是"AI 升级依赖" → 升级机制是反 pattern
- 强制升级会让 meta-build 变成"另一个需要长期维护的依赖"，违背"AI 时代脚手架"的初心

### 3.4 L1-L5 初始代码来源

| 层 | 初始代码来源 | 备注 |
|---|------------|------|
| L1 `@mb/ui-tokens` | meta-build 自写 | 3 套初始主题（default / dark / compact）|
| L2 `@mb/ui-primitives` | shadcn/ui CLI 拷贝 + meta-build 调整 | 42 个原子组件，参考 shadcn 默认实现 |
| L3 `@mb/ui-patterns` | meta-build 自写 | 8 个业务组件全部新写，参考 nxboot 同类组件 |
| L4 `@mb/app-shell` | meta-build 自写 | 布局参考 shadcn examples + 自写 i18n / 认证门面 |
| L5 `apps/web-admin` | M5 阶段填入 canonical reference | M0-M4 阶段是空骨架 + 登录页 |
| `@mb/api-sdk/generated` | orval 自动生成 | 不入 git，构建时生成 |

---

## 4. 依赖方向守护机制 [M1]

### 4.1 双保险机制总览

```
┌─────────────────────────────────────────────────────┐
│ 保险 1：pnpm workspace package.json（编译期硬隔离）  │
│   每个 package 的 dependencies 字段是白名单          │
│   错误依赖会触发 "Cannot find module" 编译失败       │
├─────────────────────────────────────────────────────┤
│ 保险 2：dependency-cruiser（细约束，CI 强制）        │
│   配置在 .dependency-cruiser.cjs                    │
│   补 pnpm 抓不到的：方向反转 / 第三方白名单 / 子路径  │
└─────────────────────────────────────────────────────┘
```

### 4.2 pnpm workspace 配置

**根 `client/pnpm-workspace.yaml`**：

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**根 `client/package.json`**：

```json
{
  "name": "meta-build-client",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "biome check .",
    "check:deps": "depcruise packages apps --config .dependency-cruiser.cjs",
    "check:theme": "pnpm -F @mb/ui-tokens check:theme",
    "check:i18n": "pnpm -F @mb/app-shell check:i18n",
    "check:env": "tsx scripts/check-env.ts"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "dependency-cruiser": "^16.0.0",
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  },
  "packageManager": "pnpm@9.12.0"
}
```

**示例：`client/packages/ui-primitives/package.json`**（展示白名单）：

```json
{
  "name": "@mb/ui-primitives",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "storybook:build": "storybook build"
  },
  "dependencies": {
    "@mb/ui-tokens": "workspace:*",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.451.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

**关键点**：
- `dependencies` 字段就是该层的"第三方白名单"——任何不在这里的包，import 时 TypeScript 编译失败
- `@mb/ui-tokens` 用 `workspace:*` 协议引用同 workspace 包
- `react` 放在 `peerDependencies`（避免重复实例）

### 4.3 每层 allow-list

下表是每层允许 import 的包（`@mb/*` 内部依赖 + 第三方依赖）。**白名单之外的包，import 即编译失败 / dependency-cruiser 校验失败**。

#### 4.3.1 内部 `@mb/*` 依赖方向

| 层 | 允许依赖的 `@mb/*` 包 |
|---|--------------------|
| `@mb/ui-tokens` | **无**（不依赖任何 `@mb/*`） |
| `@mb/ui-primitives` | `@mb/ui-tokens` |
| `@mb/ui-patterns` | `@mb/ui-tokens` + `@mb/ui-primitives` |
| `@mb/app-shell` | `@mb/ui-tokens` + `@mb/ui-primitives` + `@mb/ui-patterns` + `@mb/api-sdk` |
| `apps/web-admin` | `@mb/ui-tokens` + `@mb/ui-primitives` + `@mb/ui-patterns` + `@mb/app-shell` + `@mb/api-sdk` |
| `@mb/api-sdk` | **无**（独立契约包，不依赖 L1-L4） |

#### 4.3.2 第三方依赖白名单（精确到包名）

**L1 `@mb/ui-tokens`**：
- 运行时：无（纯 CSS + TS 常量导出）
- 开发时：`typescript` / `vitest` / `tsx`

**L2 `@mb/ui-primitives`**：
- `react` / `react-dom`（peerDep）
- `@radix-ui/react-dialog` / `@radix-ui/react-select` / `@radix-ui/react-tabs` / `@radix-ui/react-tooltip` / `@radix-ui/react-popover` / `@radix-ui/react-dropdown-menu` / `@radix-ui/react-slot` / 等
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`

**L3 `@mb/ui-patterns`**：
- L2 的一切（通过 `@mb/ui-primitives` 间接获得）
- `@tanstack/react-table`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `date-fns`

**L4 `@mb/app-shell`**：
- L3 的一切
- `@mb/api-sdk`（auth / menu / permission 基础设施 API 调用）
- `@tanstack/react-router`
- `@tanstack/react-query`
- `@tanstack/react-query-devtools`
- `i18next`
- `react-i18next`

**L5 `apps/web-admin`**：
- `react` / `react-dom`
- `@mb/ui-tokens` / `@mb/ui-primitives` / `@mb/ui-patterns` / `@mb/app-shell` / `@mb/api-sdk`
- `@tanstack/react-router`（仅限 `createFileRoute` API，用于 `routes/**/*.tsx`）
- `react-i18next`（仅限 `useTranslation` hook，用于 features 内部）
- 业务专属依赖（如 `chart.js` / `react-pdf` 等，由使用者自行决定）

**`@mb/api-sdk`**：
- orval 运行时（当前实现为 `fetch` + react-query + 自定义 mutator）
- 无 `@mb/*` 依赖

### 4.4 dependency-cruiser 配置

`client/.dependency-cruiser.cjs`（约 80 行核心规则）：

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ============ 规则 1：L1 不依赖任何 @mb/* ============
    {
      name: 'l1-tokens-no-mb-deps',
      severity: 'error',
      comment: 'L1 @mb/ui-tokens 不能依赖任何 @mb/* 包',
      from: { path: '^packages/ui-tokens' },
      to: { path: '^packages/(ui-primitives|ui-patterns|app-shell|api-sdk)' },
    },

    // ============ 规则 2：L2 只能依赖 L1 ============
    {
      name: 'l2-primitives-only-tokens',
      severity: 'error',
      comment: 'L2 @mb/ui-primitives 只能依赖 @mb/ui-tokens',
      from: { path: '^packages/ui-primitives' },
      to: { path: '^packages/(ui-patterns|app-shell|api-sdk)' },
    },

    // ============ 规则 3：L3 只能依赖 L1 + L2 ============
    {
      name: 'l3-patterns-only-tokens-primitives',
      severity: 'error',
      comment: 'L3 @mb/ui-patterns 只能依赖 L1 + L2',
      from: { path: '^packages/ui-patterns' },
      to: { path: '^packages/(app-shell|api-sdk)' },
    },

    // ============ 规则 4：L4 不能依赖 L5 ============
    {
      name: 'l4-app-shell-no-l5',
      severity: 'error',
      comment: 'L4 @mb/app-shell 不能依赖 apps/*（L4 可依赖 @mb/api-sdk 用于 auth/menu/permission 基础设施）',
      from: { path: '^packages/app-shell' },
      to: { path: '^apps' },
    },

    // ============ 规则 5：features 不能直接 import api-sdk/auth 状态接口 ============
    {
      name: 'features-no-api-sdk-auth-state',
      severity: 'error',
      comment:
        'apps/web-admin/src/features/** 不能直接 import @mb/api-sdk/auth 状态接口；'
        + '认证状态必须通过 @mb/app-shell 的 useCurrentUser / useAuth hook 获取。'
        + 'routes/auth/** 是豁免位置（登录页必须直调）',
      from: {
        path: '^apps/web-admin/src/features',
      },
      to: {
        path: '^packages/api-sdk/.+/auth/(login|logout|refresh|whoami)',
      },
    },

    // ============ 规则 6：禁止循环依赖 ============
    {
      name: 'no-circular',
      severity: 'error',
      comment: '禁止循环依赖',
      from: {},
      to: { circular: true },
    },

    // ============ 规则 7：禁止 orphan 文件 ============
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: '孤儿文件（无 import 引用）应该被清理',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)vite\\.config\\.ts$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
```

**为什么需要 dependency-cruiser**（pnpm workspace 不够用）：
- pnpm workspace 只能拦截"完全没在 dependencies 声明的包"，但拦不住"声明了但层级方向反了"的情况——比如 L2 的 package.json 错误声明了 `@mb/ui-patterns`，pnpm 不会报错，dependency-cruiser 才能拦
- pnpm 不能做"子路径粒度"的约束——规则 5（features 不直调 api-sdk/auth）必须靠 dependency-cruiser
- pnpm 不能检测循环依赖

### 4.5 TypeScript 路径配置

**根 `client/tsconfig.base.json`**：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@mb/ui-tokens": ["packages/ui-tokens/src/index.ts"],
      "@mb/ui-tokens/*": ["packages/ui-tokens/src/*"],
      "@mb/ui-primitives": ["packages/ui-primitives/src/index.ts"],
      "@mb/ui-primitives/*": ["packages/ui-primitives/src/*"],
      "@mb/ui-patterns": ["packages/ui-patterns/src/index.ts"],
      "@mb/ui-patterns/*": ["packages/ui-patterns/src/*"],
      "@mb/app-shell": ["packages/app-shell/src/index.ts"],
      "@mb/app-shell/*": ["packages/app-shell/src/*"],
      "@mb/api-sdk": ["packages/api-sdk/src/index.ts"],
      "@mb/api-sdk/*": ["packages/api-sdk/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

每个子 package 的 `tsconfig.json` 继承这个 base：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

<!-- verify: cd client && pnpm install && pnpm -r tsc --noEmit -->

<!-- verify: cd client && pnpm check:deps -->

---

## 5. M1 启动时的最小实现 [M1]

M1 阶段不需要把所有 L1-L5 的具体内容都建好。最小实现只要求：

1. **`pnpm-workspace.yaml` + 根 `package.json`** 就位
2. **5 个 package.json + 1 个 api-sdk package.json** 就位（即使 src 是空的也行）
3. **`tsconfig.base.json` + 每个子 package 的 `tsconfig.json`** 就位
4. **`.dependency-cruiser.cjs`** 就位，包含规则 1-6
5. **`.env.example`** 就位（即使是空文件）
6. **`biome.json`** 就位
7. 跑 `pnpm install && pnpm -r tsc --noEmit && pnpm check:deps` 全部通过

**M1 不需要做的事**（推迟到后续 milestone）：
- L1 主题文件 → M2
- L2 42 个原子组件 → M2
- L3 8 个业务组件 → M3
- L4 完整 Provider 树 + i18n → M3
- L5 业务 features → M5
- `@mb/api-sdk` 实际生成 → M4（后端 OpenAPI 就位后）

**M1 完成的判定**：

```bash
cd client
pnpm install                    # 所有 package.json 安装成功
pnpm -r tsc --noEmit            # 所有 package 类型检查通过
pnpm check:deps                 # dependency-cruiser 6 条规则通过
pnpm lint                       # Biome 通过
```

四个命令全部 0 错误退出 → M1 脚手架完成。

<!-- verify: cd client && pnpm install && pnpm -r tsc --noEmit && pnpm check:deps && pnpm lint -->

---

[← 返回 README](./README.md)
