# 10 - 前端硬约束与工具链

> **关注点**：13 条前端硬约束（6 MUST NOT + 7 MUST）+ 2 条推荐（RECOMMENDED）的完整定义 + 10 个守护工具的配置骨架 + 4 个触发时机层次 + M1/M2/M3 阶段启用对照表。本文是**前端硬约束的单一源头**——[README.md](./README.md) 反向索引的所有"详见"链接都指向本文件的具体章节，CLAUDE.md 只经 README 间接引用本文。
>
> **本文件吸收决策 2 和 4**：契约密度选"务实方案"——依赖方向 + pnpm workspace + TS strict + Biome + stylelint + dependency-cruiser + 主题 / i18n / env 三个完整性脚本，全部现成工具（~180 行自写配置），不自己造架构守护框架。工具链只用 Biome（lint + format），不引入 ESLint。

---

## 1. 决策结论 [M1+M2+M3]

### 1.1 一句话定位

**前端硬约束 = 给 AI 执行的不可动摇的契约**。meta-build 的 13 条硬约束（+ 2 条推荐）由 10 个工具在 Vite dev / Vite build / CI 三个阶段守护，任何违反都让构建或 CI 硬失败，不依赖代码审查的自觉。

### 1.2 硬约束总览

| 分类 | 条数 | 性质 |
|------|------|------|
| MUST NOT（禁止） | 6 条 | 千人千面保护的红线，违反即污染 |
| MUST（必须） | 7 条 | 架构契约的正向声明，缺失即降级 |
| RECOMMENDED（推荐） | 2 条 | 最佳实践，有自然反馈机制兜底，不工具强制 |
| **硬约束合计** | **13 条** | 每条都有至少一个工具守护 |

### 1.3 工具链总览

| # | 工具 | 守护的约束 | M1 启用 | M2 启用 | M3 启用 |
|---|------|----------|--------|--------|--------|
| 1 | TypeScript strict | 类型安全、props 契约、API 契约 | ✅ | ✅ | ✅ |
| 2 | Biome | 代码风格、`no-restricted-imports`、`noRestrictedGlobals` | ✅ | ✅ | ✅ |
| 3 | stylelint | CSS 变量扁平命名、禁硬编码颜色 | ✅ | ✅ | ✅ |
| 4 | dependency-cruiser | 依赖方向、白名单、子路径规则（auth 豁免） | ✅ | ✅ | ✅ |
| 5 | Vitest | L2 / L3 / L4 单元测试 | — | ✅ | ✅ |
| 6 | Playwright | L5 端到端测试 | — | — | ✅ |
| 7 | Storybook | L2 / L3 可视化 + 快照 | — | ✅ | ✅ |
| 8 | 主题完整性脚本 | 主题 token 缺失检测 | — | ✅ | ✅ |
| 9 | i18n 完整性脚本 | 字典 key 跨语言一致 | — | ✅ | ✅ |
| 10 | `.env.example` 一致性脚本 | `import.meta.env.*` 使用必须声明 | ✅ | ✅ | ✅ |

**总自写配置量估算**：主题完整性 ~90 行（[02 §8.2](./02-ui-tokens-theme.md#82-脚本骨架)）+ i18n 完整性 ~100 行（[05 §7.8](./05-app-shell.md#78-完整性校验脚本-m2)）+ `.env.example` 一致性 ~60 行（本文 §4.10）+ dependency-cruiser 配置 ~80 行（[01 §4.4](./01-layer-structure.md#44-dependency-cruiser-配置)）+ stylelint 配置 ~40 行 + Biome `no-restricted-imports` 配置 ~30 行 ≈ **400 行**。其中"主题 / i18n / env 三个完整性脚本"本身是 ~180 行，契约密度决策 2 提到的 ~180 行指的就是这三个脚本的自写逻辑部分，不含配置文件。

### 1.4 milestone 分布

| milestone | 新增启用的工具 | 新增检查的硬约束 |
|-----------|-------------|---------------|
| **M1**（脚手架 + 基础设施） | TS / Biome / stylelint / dependency-cruiser / `.env.example` 一致性 | MUST NOT #2 #3 #5 #6 #7；RECOMMENDED #8；MUST #7 |
| **M2**（L1 + L2 + Theme + i18n 基础） | Vitest / Storybook / 主题完整性脚本 / i18n 完整性脚本 | RECOMMENDED #1；MUST NOT #4；MUST #1 #2 #5 #6 |
| **M3**（L3 + L4 + L5 + Routing） | Playwright | MUST #3 #4 |

---

## 2. MUST NOT 完整表（6 条硬约束 + 2 条推荐）

> 硬约束格式：禁止内容 → 具体违反示例 → 防御机制 → 违反代价 → 详见 Batch 1 文件章节。
> 推荐（RECOMMENDED）格式：不推荐的做法 → 推荐替代 → 自然反馈机制 → 详见。

### 2.1 RECOMMENDED #1：避免硬编码颜色 / 圆角 / 间距 [M1+M2]

> **降级说明**：原为 MUST NOT，降级为推荐。Tailwind v4 的 `--color-*: initial` 清空默认调色板是第一道自然防线——使用者写 `bg-red-500` 时会发现颜色不生效（因为 v4 默认不注册这些颜色）。使用者如果有意使用固定色（如表头永远灰色 `bg-[#f5f5f5]`）是合法的定制需求，脚手架不应强制拦截。

**推荐做法**：在组件 / 样式文件里优先使用 L1 的语义 token（通过 Tailwind 语义 class 或 CSS 变量），避免硬编码的颜色值、圆角值、间距值、字号值。

**不推荐的写法**：

```tsx
// 不推荐：硬编码 hex 色（不跟主题走）
<button className="bg-[#ff0000]">Click</button>

// 不推荐：Tailwind 调色板（v4 默认未注册，不生效）
<button className="bg-red-500 text-white">Click</button>

// 不推荐：硬编码圆角
<button className="rounded-[4px]">Click</button>

// 不推荐：inline style 硬编码颜色
<button style={{ color: '#fff', background: 'blue' }}>Click</button>
```

**推荐写法**：

```tsx
// 推荐：语义 class
<button className="bg-primary text-primary-foreground rounded-md h-10 gap-2">
  Click
</button>
```

**提醒**：使用 `bg-[#xxx]` 任意值时要意识到这不跟主题走——主题切换时该组件的颜色不会变。如果这是有意为之（如品牌色固定、数据可视化色板），则属于合法用例。

**辅助检测**（非强制）：

| 工具 | 说明 |
|------|------|
| stylelint | CSS 文件内的硬编码颜色检测（`declaration-strict-value` 插件），帮助发现无意的硬编码 |
| Tailwind v4 默认行为 | `--color-*: initial` 清空调色板，`bg-red-500` 等原生 class 直接不生效，开发者自然会发现 |

**详见**：
- [03-ui-primitives.md §4.4 主题消费走 Tailwind 语义 class](./03-ui-primitives.md#44-主题消费走-tailwind-语义-class-m2)
- [02-ui-tokens-theme.md §3 语义 token 完整清单](./02-ui-tokens-theme.md#3-语义-token-完整清单46-个-m1)

### 2.2 MUST NOT #2：反向 import（低层依赖高层） [M1]

**禁止内容**：低层 package 依赖高层 package。允许单向跨级（例如 L5 直接 import L2 的原子组件），但不允许反向。

**具体违反示例**：

```tsx
// 禁止：L1 ui-tokens 依赖任何 @mb/* 包
// client/packages/ui-tokens/src/index.ts
import { Button } from '@mb/ui-primitives';  // ❌ L1 不能依赖 L2

// 禁止：L2 ui-primitives 依赖 L3
// client/packages/ui-primitives/src/button.tsx
import { NxTable } from '@mb/ui-patterns';  // ❌ L2 不能依赖 L3

// 禁止：L3 ui-patterns 依赖 L4
// client/packages/ui-patterns/src/nx-table.tsx
import { useCurrentUser } from '@mb/app-shell';  // ❌ L3 不能依赖 L4

// 禁止：L4 app-shell 依赖 L5
// client/packages/app-shell/src/sidebar/sidebar.tsx
import { OrderList } from '@/features/orders';  // ❌ L4 不能依赖 features
```

**正确写法**：每一层只依赖比自己低的层。详见 [01-layer-structure.md §4.3.1 内部 @mb/* 依赖方向](./01-layer-structure.md#431-内部-mb-依赖方向)。

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| pnpm workspace | 每个 package.json 的 dependencies 必须显式声明——L1 的 package.json 不声明 L2 的话根本没法 `import` |
| dependency-cruiser `forbidden` 规则 | 规则 1-4：`l1-tokens-no-mb-deps` / `l2-primitives-only-tokens` / `l3-patterns-only-tokens-primitives` / `l4-app-shell-no-l5` |
| dependency-cruiser `no-circular` | 禁止循环依赖（规则 6） |
| TypeScript 路径 | `tsconfig.base.json` 的 `paths` 映射固定到对应 package，反向 import 会让 `tsc --noEmit` 报模块找不到 |

**违反代价**：**依赖方向混乱 = 无法独立演化某一层**。例如 L2 如果依赖 L3，想单独替换 L3 实现时 L2 会被拖着一起改。更严重的是循环依赖会让构建工具陷入死循环。

**详见**：
- [01-layer-structure.md §4.4 dependency-cruiser 配置](./01-layer-structure.md#44-dependency-cruiser-配置)
- [01-layer-structure.md §2.6 单向依赖硬约束](./01-layer-structure.md#26-单向依赖硬约束)

### 2.3 MUST NOT #3：L2-L5 import 白名单外的包 [M1]

**禁止内容**：每层 package 的 dependencies 必须在白名单内。白名单由"该层职责"决定——L2 能用 Radix，L3 才能用 TanStack Table，L4 才能用 TanStack Router，L5 才能用 api-sdk。

**具体违反示例**：

```tsx
// 禁止：L2 依赖 TanStack Table（它是 L3 的职责）
// client/packages/ui-primitives/src/button.tsx
import { useReactTable } from '@tanstack/react-table';  // ❌

// 禁止：L3 依赖 TanStack Router（它是 L4 的职责）
// client/packages/ui-patterns/src/nx-table.tsx
import { useNavigate } from '@tanstack/react-router';  // ❌

// 禁止：L4 依赖 axios（应该走 @mb/api-sdk）
// client/packages/app-shell/src/api/interceptor.ts
import axios from 'axios';  // ❌

// 禁止：L5 业务代码里 import @radix-ui 原始组件（应该走 @mb/ui-primitives 的 wrapper）
// apps/web-admin/src/features/orders/order-dialog.tsx
import * as RadixDialog from '@radix-ui/react-dialog';  // ❌
```

**正确写法**：

```tsx
// 正确：L5 用 L2 的 wrapper
import { Dialog } from '@mb/ui-primitives';
```

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| pnpm workspace 的 `package.json` | 没在对应层的 dependencies 里声明的包，install 不到，import 报错 |
| Biome `noRestrictedImports` | 按 monorepo 包路径细分的黑名单（例如"L3 不能 import `@tanstack/react-router`"） |
| dependency-cruiser | 读 node_modules 真实路径判断，比 Biome 更细 |

**违反代价**：**层级职责泄漏 = 未来重构成本爆炸**。例如 L5 直接用 Radix，那么将来把 L2 从 Radix 换到 antd 风格时，L5 也要跟着改——这就退化成了没有隔离层的"单体前端"。

**详见**：
- [01-layer-structure.md §4.3.2 第三方依赖白名单（精确到包名）](./01-layer-structure.md#432-第三方依赖白名单精确到包名)
- [01-layer-structure.md §2.3 每层隔离的第三方依赖](./01-layer-structure.md#23-每层隔离的第三方依赖)

### 2.4 MUST NOT #4：features 直接 import `@mb/api-sdk/auth/*` 状态管理接口 [M3]

**禁止内容**：`apps/web-admin/src/features/**` 下的任何文件不能直接 import `@mb/api-sdk` 里的 auth 接口（`getMe` / `login` / `logout` / `refresh`）。必须通过 `@mb/app-shell` 提供的 `useCurrentUser` / `useAuth` 门面访问。**豁免**：`apps/web-admin/src/routes/auth/**`（登录页）可以直调，因为此时门面还没数据。

**具体违反示例**：

```tsx
// 禁止：features 里直接调 authApi
// apps/web-admin/src/features/profile/profile-page.tsx
import { authApi } from '@mb/api-sdk';

export function ProfilePage(): React.ReactElement {
  const [me, setMe] = React.useState(null);
  React.useEffect(() => {
    authApi.getMe().then(setMe);  // ❌ 绕过 useCurrentUser 门面
  }, []);
  return <div>{me?.username}</div>;
}
```

**正确写法**：

```tsx
// 正确：通过门面
import { useCurrentUser } from '@mb/app-shell';

export function ProfilePage(): React.ReactElement {
  const me = useCurrentUser();
  return <div>{me.username}</div>;
}
```

**豁免示例**（登录页）：

```tsx
// 允许：routes/auth/login.tsx 直调 authApi
// apps/web-admin/src/routes/auth/login.tsx
import { authApi } from '@mb/api-sdk';  // ✅ 豁免白名单
```

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| dependency-cruiser 规则 `features-no-api-sdk-auth-state` | 精确匹配 `from: ^apps/web-admin/src/features` 且 `to: @mb/api-sdk/auth/(login|logout|refresh|whoami)` |
| 豁免规则 `auth-routes-may-import-auth-api` | `from: ^apps/web-admin/src/routes/auth/` 的文件允许 import `@mb/api-sdk` 的 AuthApi |

**违反代价**：**认证门面单一来源被破坏**。同一份"当前用户"可能在多个业务点被独立拉取，缓存不一致，且难以统一切换认证框架（Sa-Token → SSO）。更严重的是，某些 features 可能自己实现 token 刷新逻辑，和门面的刷新逻辑冲突。

**详见**：
- [08-contract-client.md §6 认证门面豁免](./08-contract-client.md#6-认证门面豁免)
- [08-contract-client.md §6.2 dependency-cruiser 子路径规则](./08-contract-client.md#62-dependency-cruiser-子路径规则)
- [05-app-shell.md §5.4 features 禁止直调 api-sdk auth 状态接口](./05-app-shell.md#54-features-禁止直调-api-sdk-auth-状态接口)

### 2.5 MUST NOT #5：非 `routes/**/*.tsx` 位置声明路由 [M3]

**禁止内容**：`createFileRoute(...)` 只能出现在 `apps/web-admin/src/routes/**/*.tsx` 文件里。其他任何位置（features、components、hooks）都不能 import 和调用 `createFileRoute`。

**具体违反示例**：

```tsx
// 禁止：features 里声明路由
// apps/web-admin/src/features/orders/order-route.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/orders')({  // ❌
  component: OrderList,
});
```

**正确写法**：路由**只在** `routes/` 目录下声明，业务组件在 `features/`，路由文件 import 业务组件：

```tsx
// apps/web-admin/src/routes/_authed/orders/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { OrderList } from '@/features/orders';  // ✅

export const Route = createFileRoute('/_authed/orders/')({
  component: OrderList,
});
```

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| `@tanstack/router-vite-plugin` | 只扫描 `apps/web-admin/src/routes/` 目录，在 features 里写 `createFileRoute` 的文件不会进入 `routeTree.gen.ts`，运行时 404 |
| dependency-cruiser 规则 | `from: ^apps/web-admin/src/(features|components|hooks)` + `to: '@tanstack/react-router'` 但 `calls: createFileRoute` → 报错（利用 dependency-cruiser 的 `usage` 粒度） |
| Biome `noRestrictedImports` | `features/**` 禁止 `from '@tanstack/react-router'` 中的 `createFileRoute` 符号 |

**违反代价**：**运行时 404 而不是编译失败**。这是最坑的错误类型——写的代码看起来对，TS 也过了，但运行时路由根本不存在，必须靠约定 + 工具守住。

**详见**：
- [06-routing-and-data.md §2.1 routes 目录约定](./06-routing-and-data.md#21-routes-目录约定)
- [06-routing-and-data.md §2.2 routeTree.gen.ts 构建产物](./06-routing-and-data.md#22-routetreegents-构建产物)

### 2.6 MUST NOT #6：L1 `@mb/ui-tokens` 依赖任何 `@mb/*` package [M1]

**禁止内容**：L1 是"最底层"，它不能 import 任何 `@mb/*` 包——否则就出现了反向依赖或循环。

**具体违反示例**：

```ts
// 禁止：L1 依赖任何 @mb/* 包
// client/packages/ui-tokens/src/index.ts
import { Button } from '@mb/ui-primitives';  // ❌
import { useCurrentUser } from '@mb/app-shell';  // ❌
```

**正确写法**：L1 的 dependencies **为空**（除了 `typescript` / `vitest` / `tsx` 开发时工具）。L1 只输出 CSS 文件和 TypeScript 常量，没有运行时依赖。

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| pnpm workspace | `packages/ui-tokens/package.json` 的 `dependencies` 不声明任何 `@mb/*` → install 之后 `import @mb/ui-primitives` 报 `Cannot find module` |
| dependency-cruiser 规则 `l1-tokens-no-mb-deps` | 严格拦截 `from: ^packages/ui-tokens` + `to: ^packages/(ui-primitives|ui-patterns|app-shell|api-sdk)` |

**违反代价**：**循环依赖** / **无法独立发布 L1 供其他项目用**。如果 L1 依赖了 L2，那么"只想复用 token"的项目必须拖一套完整的 UI 库——这和"L1 是最小公约数"的设计哲学矛盾。

**详见**：
- [01-layer-structure.md §4.3.1 内部 @mb/* 依赖方向](./01-layer-structure.md#431-内部-mb-依赖方向)
- [01-layer-structure.md §4.4 dependency-cruiser 配置（规则 1）](./01-layer-structure.md#44-dependency-cruiser-配置)

### 2.7 MUST NOT #7：主题 CSS 使用非扁平命名 [M1+M2]

**禁止内容**：主题 CSS 变量必须用扁平命名 `--<group>-<name>` 或 `--<group>-<name>-<modifier>`。禁止嵌套命名（`--colors.primary.500`）、点分段（`--color.primary.fg`）、斜杠（`--radius/md`）、camelCase（`--sizes-controlHeight`）。

**具体违反示例**：

```css
/* 禁止：嵌套复数命名 */
:root[data-theme="default"] {
  --colors-primary-500: oklch(60% 0.15 240);  /* ❌ */
}

/* 禁止：点分段命名 */
:root[data-theme="default"] {
  --color.primary.foreground: #fff;  /* ❌ */
}

/* 禁止：camelCase */
:root[data-theme="default"] {
  --sizes-controlHeight: 40px;  /* ❌ */
}

/* 禁止：斜杠 */
:root[data-theme="default"] {
  --radius/md: 8px;  /* ❌ */
}
```

**正确写法**：

```css
:root[data-theme="default"] {
  --color-primary: oklch(60% 0.15 240);
  --color-primary-foreground: #fff;
  --size-control-height: 40px;
  --radius-md: 8px;
}
```

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| 主题完整性脚本 | 校验每个变量名符合正则 `^--[a-z]+(-[a-z0-9]+)+$`（扁平命名，全小写 + 短横线） |
| stylelint | `custom-property-pattern` 规则强制同一正则 |

**违反代价**：**锁死未来升级 JSON 源的路径**。[02-ui-tokens-theme.md §4.3](./02-ui-tokens-theme.md#43-为未来升级-json-源保留路径) 说明了扁平命名是为未来 v1.5 可能升级到 JSON 源保留的平滑路径——如果现在用嵌套命名，消费侧的 Tailwind preset 会依赖"primary-500"这种段落结构，未来从 JSON 生成 CSS 反而困难。

**详见**：
- [02-ui-tokens-theme.md §4 扁平命名约定](./02-ui-tokens-theme.md#4-扁平命名约定-m1)
- [02-ui-tokens-theme.md §8.2 主题完整性脚本骨架](./02-ui-tokens-theme.md#82-脚本骨架)

### 2.8 RECOMMENDED #8：避免动态拼接 Tailwind class name [M1]

> **降级说明**：原为 MUST NOT，降级为推荐。这是一个 Tailwind 的构建机制限制——写错了样式直接不生效，开发者在本地 `pnpm build` 就能发现（生产构建后样式丢失一眼可见），不需要工具强制拦截。

**不推荐的写法**：

```tsx
// 不推荐：模板字符串拼接
const color = 'red';
return <div className={`bg-${color}-500`}>text</div>;  // ⚠ 生产构建时样式丢失

// 不推荐：字符串相加
const variant = 'primary';
return <div className={'bg-' + variant + ' text-' + variant + '-foreground'}>text</div>;  // ⚠

// 不推荐：运行时查表（虽然类型对，但 Tailwind 扫描不到）
const colorMap: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};
return <div className={colorMap[variant]}>text</div>;  // ⚠
```

**推荐写法**：使用 **CVA**（class-variance-authority）把所有 variant 静态枚举出来，让 Tailwind 构建时能扫描到所有字面量：

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'border border-input bg-background',
    },
  },
  defaultVariants: { variant: 'default' },
});

// 使用
<button className={buttonVariants({ variant: 'destructive' })}>Delete</button>
```

**为什么不应该这样做**：Tailwind 在构建阶段扫描源码，找到所有 `bg-XXX` 字面量生成 CSS。拼接字符串在运行时才拼出来，构建时根本看不到 → 生产构建里没有对应的 CSS → 运行时 class 存在但样式丢失（肉眼看就是"颜色没了"）。这是 Tailwind 使用中最经典的坑，但由于写错了本地就能发现（`pnpm build` 后看效果），不需要工具层面强制拦截。

**辅助手段**：

| 手段 | 说明 |
|------|------|
| CVA 代码约定 | 所有 variant 走 CVA 静态枚举，开发者养成习惯即可 |
| 本地 build 验证 | `pnpm build` 后检查页面效果，动态拼接的 class 样式会直接丢失 |

**详见**：
- [11-antipatterns.md 动态拼接 Tailwind class](./11-antipatterns.md)（反面教材详解）
- [03-ui-primitives.md §4.1 CVA variants 风格](./03-ui-primitives.md#41-cva-variants-风格-m2)
- [04-ui-patterns.md §5 组件 props API 设计](./04-ui-patterns.md#5-组件-props-api-设计)（L3 的 variant props 怎么映射到 CVA）

---

## 3. MUST 完整表（7 条）

### 3.1 MUST #1：L2 / L3 组件必须有 Storybook 故事 [M2+M3]

**必做内容**：

- **L2 每个原子组件**必须至少有 1 个 Storybook 故事，每个 variant 一个（例如 Button 有 `Default` / `Destructive` / `Outline` / `Ghost` / `Link` 5 个故事）
- **L3 每个业务组件**必须至少有 3-5 个故事（默认态 / 空状态 / loading / 错误态 / 满数据态）
- 故事文件命名 `<component>.stories.tsx`，与组件同目录
- 故事命名用 `Component/Variant`（例如 `Button/Destructive`）

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| Storybook build | CI 阶段 `pnpm -C client/packages/ui-primitives storybook:build` 必须成功（任何故事报错都失败） |
| Vitest + Storybook Test Runner | 遍历所有故事跑 render smoke test |
| 代码约定 + PR review | 新增组件没有故事文件的 PR 被打回 |

**详见**：
- [03-ui-primitives.md §5 Storybook 规范](./03-ui-primitives.md#5-storybook-规范)
- [03-ui-primitives.md §5.1 每个 variant 一个 story](./03-ui-primitives.md#51-每个-variant-一个-story-m2)
- [04-ui-patterns.md §7 Storybook 规范](./04-ui-patterns.md#7-storybook-规范)

### 3.2 MUST #2：所有主题必须定义全部 46 个语义 token [M2]

**必做内容**：每个主题 CSS 文件必须定义参考主题（`default`）中的**全部** 46 个语义 token，一个不多一个不少。详见 [02-ui-tokens-theme.md §3 语义 token 完整清单](./02-ui-tokens-theme.md#3-语义-token-完整清单46-个-m1)。

**防御机制**：**主题完整性脚本**，对比每个主题和参考主题的变量集合：

- 缺失检测：报错列出每个主题相比 `default` 缺的变量名
- 多余检测：报错列出每个主题相比 `default` 多的变量名（防 typo）
- 命名检测：所有变量名必须符合 `^--[a-z]+(-[a-z0-9]+)+$`（扁平命名，全小写）

**CI 集成**：

```bash
pnpm -C client check:theme  # 失败 exit code 1，阻断 PR 合入
```

**详见**：
- [02-ui-tokens-theme.md §8 主题完整性校验脚本](./02-ui-tokens-theme.md#8-主题完整性校验脚本-m2)
- [02-ui-tokens-theme.md §8.2 脚本骨架](./02-ui-tokens-theme.md#82-脚本骨架)

### 3.3 MUST #3：L5 路由必须声明权限 [M3]

**必做内容**：`apps/web-admin/src/routes/_authed/**/*.tsx` 里的每个路由必须在 `beforeLoad` 声明 `requireAuth({ permission: 'xxx.yyy' })`，或使用 `@PermitAll`（不需要权限的页面）。

**具体示例**：

```tsx
// apps/web-admin/src/routes/_authed/orders/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@mb/app-shell/auth';

export const Route = createFileRoute('/_authed/orders/')({
  beforeLoad: requireAuth({ permission: 'order.read' }),
  component: OrderList,
});
```

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| TypeScript strict | `permission` 类型是 `AppPermission` 联合类型，IDE 自动补全合法权限点，拼错即类型错误 |
| CI 校验 | 数据库 `mb_iam_route_tree.code` 必须是 `AppPermission` 的子集（详见 [07 §6.3](./07-menu-permission.md#63-ci-校验数据库-code-必须在代码清单内)） |
| 约定 + PR review | `_authed/**` 下没有 `beforeLoad: requireAuth(...)` 的路由被打回 |

**详见**：
- [06-routing-and-data.md §3 路由守卫工厂 requireAuth](./06-routing-and-data.md#3-路由守卫工厂-requireauth-m3)
- [06-routing-and-data.md §3.1 工厂函数定义](./06-routing-and-data.md#31-工厂函数定义)
- [07-menu-permission.md §6 权限一致性](./07-menu-permission.md#6-权限一致性)

### 3.4 MUST #4：L5 业务代码必须通过 `@mb/api-sdk` 调后端 [M3]

**必做内容**：`apps/web-admin/src/features/**` 里的所有 API 调用必须通过 `@mb/api-sdk`（由 OpenAPI Generator 从后端 springdoc 生成的 TypeScript 客户端）。禁止手写 `fetch` / `axios` / `ky` / `got` 等 HTTP 请求。

**具体示例**：

```ts
// 正确：通过 @mb/api-sdk
import { orderApi, type OrderView, type PageResult } from '@mb/api-sdk';
import { useQuery } from '@tanstack/react-query';

export function useOrderList(page: number, size: number) {
  return useQuery<PageResult<OrderView>, Error>({
    queryKey: ['orders', 'list', page, size],
    queryFn: () => orderApi.list({ page, size }),
  });
}
```

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| Biome `noRestrictedGlobals` | 禁用 `fetch` / `XMLHttpRequest` 全局 |
| Biome `noRestrictedImports` | 禁用 `axios` / `ky` / `got` |
| pnpm workspace | `apps/web-admin/package.json` 的 dependencies 不包含 axios 等，install 不到 |
| TypeScript | api-sdk 的生成类型强制字段和类型正确，拼错 / 漏字段 / 类型错立即报错 |

**详见**：
- [08-contract-client.md §3 @mb/api-sdk 使用规范](./08-contract-client.md#3-mbapi-sdk-使用规范)
- [08-contract-client.md §3.1 所有 API 调用必须通过 @mb/api-sdk](./08-contract-client.md#31-所有-api-调用必须通过-mbapi-sdk)
- [08-contract-client.md §3.2 禁止手写 fetch / axios 的工具守护](./08-contract-client.md#32-禁止手写-fetch--axios-的工具守护)

### 3.5 MUST #5：L2-L5 组件样式必须通过 Tailwind 语义 class 消费主题 [M1+M2]

**必做内容**：所有视觉相关的 class 必须消费 L1 token（通过 Tailwind 语义 class 或 CSS 变量），形成"主题切换 → 组件样式跟着变"的单向数据流。

**具体示例**：

```tsx
// 正确：用语义 class
<button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-10 px-4">
  Click
</button>

// 正确：在 CVA 里用语义 class
const buttonVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',  // 消费 token
    },
  },
});
```

**这条 MUST 是 RECOMMENDED #1 的强制对面**——#1 说"推荐不硬编码"，#5 说"组件样式必须走语义 class"。MUST #5 是硬约束（stylelint 守护），而 RECOMMENDED #1 是柔性提醒。

**防御机制**：stylelint `declaration-strict-value` 插件，强制 CSS 属性中的 color / background / border-color 使用 `var(--color-xxx)`。

**详见**：
- [03-ui-primitives.md §4.4 主题消费走 Tailwind 语义 class](./03-ui-primitives.md#44-主题消费走-tailwind-语义-class-m2)
- [02-ui-tokens-theme.md §7 Tailwind preset 配置](./02-ui-tokens-theme.md#7-tailwind-preset-配置-m1)
- [02-ui-tokens-theme.md §7.3 消费方式](./02-ui-tokens-theme.md#73-消费方式)

### 3.6 MUST #6：代码静态文案走 i18n，数据库文案永不走 i18n [M2+M3]

**必做内容**：这条有两面：

| 类型 | 例子 | 是否走 i18n |
|------|------|-----------|
| **代码中的静态文案** | 按钮"保存"、表格列头"订单号"、Toast"操作成功"、表单错误 | ✅ **必须**走 `t('...')` |
| **数据库存储的运维数据** | `mb_iam_menu.name`（菜单名"订单管理"）、`mb_dict_item.label`（字典选项）、用户输入的业务数据 | ❌ **永不**走 i18n，直接渲染 |
| **后端返回的错误消息** | `ProblemDetail.title` / `detail` | ⚠ 走后端 i18n（`Accept-Language` 协商，由 `MessageSource` 渲染），前端拿到的已经是目标语言，**不**做二次 `t(...)` |

**为什么数据库文案不 i18n**：数据库里的菜单名是"运维数据"——运维在菜单管理页用中文录入"订单管理"，这是运维的选择，系统不应该硬加一层翻译覆盖它。如果未来某个企业要多语言菜单，那是他们的菜单管理页加一个"菜单名英文"字段的事，不是前端 i18n 的职责。详见 [07-menu-permission.md §5.3](./07-menu-permission.md#53-数据库-name-不走-i18n数据库数据的-i18n-边界)。

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| i18n 完整性脚本 | 对比每对语言下相同 namespace 的 key 集合，缺失即失败 |
| L2 i18n 禁用规则 | L2 不能 import `react-i18next`，文案通过 props 传入（详见 MUST NOT 扩展） |
| 代码约定 | PR review 看见中文字符串字面量必须要求改成 `t('xxx')`，除非是注释或测试 |
| 类型生成 | i18next 内置 module augmentation + TypeScript `typeof` JSON import 提供 `t()` key 类型安全 |

**详见**：
- [05-app-shell.md §7 i18n 完整工程](./05-app-shell.md#7-i18n-完整工程-m2-基础--m3-完整)
- [05-app-shell.md §7.10 i18n 边界 代码静态文案 vs 数据库数据](./05-app-shell.md#710-i18n-边界-代码静态文案-vs-数据库数据)
- [05-app-shell.md §7.8 完整性校验脚本](./05-app-shell.md#78-完整性校验脚本-m2)
- [03-ui-primitives.md §4.2 禁止内部消费 i18n](./03-ui-primitives.md#42-禁止内部消费-i18nshadcn-模式硬约束-m2)

### 3.7 MUST #7：所有 `import.meta.env.*` 引用的变量必须在 `.env.example` 声明 [M1]

**必做内容**：使用 `import.meta.env.VITE_XXX` 读取环境变量时，这个变量必须在 `client/.env.example` 里有声明（带默认值或空字符串 + 注释说明用途）。脚手架 fork 的使用者拿到代码后能通过 `.env.example` 快速知道要配哪些变量。

**具体示例**：

```ts
// apps/web-admin/src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true';
```

```bash
# client/.env.example
# 后端 API 基础 URL（必填）
VITE_API_BASE_URL=http://localhost:8080/api/v1

# 是否启用 MSW mock（开发用）
VITE_ENABLE_MOCK=false
```

**为什么这条约束在脚手架模式下特别重要**：使用者 fork 代码后第一件事就是 `pnpm install && pnpm dev`——如果代码里引用了 `VITE_FOO` 但 `.env.example` 没写，使用者只会看到"undefined 报错"，根本不知道要配什么。这是脚手架特有的 onboarding 坑。

**防御机制**：

| 工具 | 拦截点 |
|------|-------|
| `.env.example` 一致性脚本 | 扫描 `apps/**/*.{ts,tsx}` 里所有 `import.meta.env.VITE_XXX`，对比 `.env.example` 的差集 |
| CI 集成 | `pnpm check:env` 失败即阻断 PR |

**详见**：本文件 §4.10 `.env.example` 一致性脚本

---

## 4. 工具链详解（10 个）

### 4.1 工具 1：TypeScript strict [M1]

**配置文件**：`client/tsconfig.base.json`

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

**守护的硬约束**：MUST #3 #4；隐式守护所有类型相关问题。

**启用命令**：

```bash
# 每个 package 独立
pnpm -C client/packages/ui-tokens tsc --noEmit
pnpm -C client/packages/ui-primitives tsc --noEmit
# ...
pnpm -C client/apps/web-admin tsc --noEmit
```

**详见**：[01-layer-structure.md §4.5 TypeScript 路径配置](./01-layer-structure.md#45-typescript-路径配置)

### 4.2 工具 2：Biome [M1]

**配置文件**：`client/biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "error",
        "useNamingConvention": { "level": "error", "options": { "strictCase": false } }
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": { "level": "warn", "options": { "maxAllowedComplexity": 15 } }
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "error"
      },
      "suspicious": {
        "noConsole": { "level": "error", "options": { "allow": ["warn", "error"] } }
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all" }
  }
}
```

**子配置**（`apps/web-admin/biome.json`，继承根并加 L5 专属规则）：

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "extends": ["../../biome.json"],
  "linter": {
    "rules": {
      "correctness": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "axios": "Use @mb/api-sdk; see docs/specs/frontend/08-contract-client.md §3",
              "ky": "Use @mb/api-sdk; see docs/specs/frontend/08-contract-client.md §3",
              "got": "Use @mb/api-sdk; see docs/specs/frontend/08-contract-client.md §3",
              "@radix-ui/react-dialog": "Use @mb/ui-primitives/Dialog",
              "@radix-ui/react-select": "Use @mb/ui-primitives/Select",
              "@tanstack/react-table": "Use @mb/ui-patterns/NxTable",
              "react-hook-form": "Use @mb/ui-patterns/NxForm (豁免：routes/auth/** 登录表单可以直用)"
            }
          }
        }
      },
      "suspicious": {
        "noRestrictedGlobals": {
          "level": "error",
          "options": { "deniedGlobals": ["fetch", "XMLHttpRequest"] }
        }
      }
    }
  }
}
```

**守护的硬约束**：MUST NOT #3 #4；MUST #4。

**启用命令**：`pnpm -C client biome check .`

### 4.3 工具 3：stylelint [M1]

**配置文件**：`client/.stylelintrc.cjs`

```js
/** @type {import('stylelint').Config} */
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    // 扁平命名：所有 --xxx 变量必须是 --<group>-<name>（全小写 + 短横线）
    'custom-property-pattern': [
      '^--[a-z]+(-[a-z0-9]+)+$',
      {
        message: (name) =>
          `CSS 变量 "${name}" 必须符合扁平命名 --<group>-<name>-<modifier> (详见 docs/specs/frontend/02-ui-tokens-theme.md §4)`,
      },
    ],
    // 禁止硬编码颜色（任何 color / background / border-color 必须用 var(--color-xxx)）
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'background-color', 'border-color', 'fill', 'stroke'],
      {
        ignoreValues: ['transparent', 'inherit', 'currentColor', 'none', '/^var\\(--color-/'],
        message: 'Hardcoded color not allowed. Use CSS variable var(--color-xxx) instead.',
      },
    ],
    // 禁止硬编码圆角
    'declaration-property-value-disallowed-list': {
      '/^border-radius$/': ['/^\\d+px$/', '/^\\d+rem$/'],
    },
  },
  overrides: [
    {
      files: ['**/themes/*.css'],
      rules: {
        // 主题 CSS 文件里允许硬编码（这是 token 定义的源头）
        'scale-unlimited/declaration-strict-value': null,
        'declaration-property-value-disallowed-list': null,
      },
    },
  ],
};
```

**守护的硬约束**：RECOMMENDED #1（辅助检测）；MUST NOT #7；MUST #5。

**启用命令**：`pnpm -C client stylelint "**/*.css"`

### 4.4 工具 4：dependency-cruiser [M1]

**配置文件**：`client/.dependency-cruiser.cjs`

完整配置（约 80 行核心规则）见 [01-layer-structure.md §4.4 dependency-cruiser 配置](./01-layer-structure.md#44-dependency-cruiser-配置)。本文不重复，只列规则一览：

| 规则名 | 守护的硬约束 |
|--------|------------|
| `l1-tokens-no-mb-deps` | MUST NOT #6 |
| `l2-primitives-only-tokens` | MUST NOT #2 #3 |
| `l3-patterns-only-tokens-primitives` | MUST NOT #2 #3 |
| `l4-app-shell-no-l5` | MUST NOT #2 #3 |
| `features-no-api-sdk-auth-state` | MUST NOT #4 |
| `auth-routes-may-import-auth-api`（豁免） | MUST NOT #4 的豁免 |
| `no-circular` | MUST NOT #2（循环 = 反向一种特例） |
| `no-orphans` | 清理无 import 的孤儿文件（warning，不强制） |

**启用命令**：

```bash
pnpm -C client dlx dependency-cruiser --config .dependency-cruiser.cjs packages apps
```

### 4.5 工具 5：Vitest [M2]

**配置文件**：各 package 的 `vitest.config.ts`（继承根 `client/vitest.config.base.ts`）。

**根配置**（`client/vitest.config.base.ts`）：

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
});
```

**守护的硬约束**：MUST #1（通过 Storybook Test Runner 的故事遍历）；间接守护所有逻辑正确性。

**启用命令**：

```bash
# L2 / L3 / L4 单元测试
pnpm -C client/packages/ui-primitives test
pnpm -C client/packages/ui-patterns test
pnpm -C client/packages/app-shell test
```

**详见**：
- [03-ui-primitives.md §8 测试规范](./03-ui-primitives.md#8-测试规范)
- [04-ui-patterns.md §8 测试规范](./04-ui-patterns.md#8-测试规范)

### 4.6 工具 6：Playwright [M3]

**配置文件**：`client/apps/web-admin/playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**守护的硬约束**：MUST #3（通过权限检查的端到端验证）；间接守护主题切换 / 路由 / i18n / 认证门面的集成正确性。

**启用命令**：`pnpm -C client/apps/web-admin test:e2e`

### 4.7 工具 7：Storybook [M2]

**配置文件**：`client/packages/ui-primitives/.storybook/main.ts` 和 `client/packages/ui-patterns/.storybook/main.ts`

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: { autodocs: 'tag' },
};

export default config;
```

**守护的硬约束**：MUST #1。

**启用命令**：

```bash
# 开发时浏览
pnpm -C client/packages/ui-primitives storybook

# CI 构建（静态产物）
pnpm -C client/packages/ui-primitives storybook:build
```

**详见**：
- [03-ui-primitives.md §5 Storybook 规范](./03-ui-primitives.md#5-storybook-规范)
- [04-ui-patterns.md §7 Storybook 规范](./04-ui-patterns.md#7-storybook-规范)

### 4.8 工具 8：主题完整性脚本 [M2]

**位置**：`client/packages/ui-tokens/scripts/check-theme-integrity.ts`

**完整骨架**：详见 [02-ui-tokens-theme.md §8.2 脚本骨架](./02-ui-tokens-theme.md#82-脚本骨架)（约 90 行 TypeScript）。

**职责**：

1. 读 Theme Registry 取所有主题的 id 和 cssFile 路径
2. 解析每个主题 CSS 文件，提取所有 `--xxx` 变量名
3. 校验每个变量名符合扁平命名 `^--[a-z]+(-[a-z0-9]+)+$`
4. 对比每个主题相比参考主题（`default`）的缺失变量和多余变量
5. 任一校验失败即 `process.exit(1)`

**启用命令**：`pnpm -C client check:theme`

**CI 集成**：

```yaml
# .github/workflows/ci.yml 节选
- name: Check theme integrity
  run: pnpm -C client check:theme
```

**守护的硬约束**：MUST NOT #7；MUST #2。

### 4.9 工具 9：i18n 完整性脚本 [M2]

**位置**：`client/scripts/check-i18n.ts`

**完整骨架**：详见 [05-app-shell.md §7.8 完整性校验脚本](./05-app-shell.md#78-完整性校验脚本-m2)（约 100 行 TypeScript）。

**职责**：

1. 扫描 `packages/app-shell/src/i18n/` 和 `apps/web-admin/src/i18n/` 下所有 `<lang>/<namespace>.json`
2. 按 namespace 分组，对比每对语言的 key 集合
3. 报告缺失 key 和多余 key
4. 任一不一致即 `process.exit(1)`

**启用命令**：`pnpm -C client check:i18n`

**CI 集成**：

```yaml
- name: Check i18n integrity
  run: pnpm -C client check:i18n
```

**守护的硬约束**：MUST #6。

### 4.10 工具 10：`.env.example` 一致性脚本 [M1]

**位置**：`client/scripts/check-env-example.ts`

**完整骨架**（约 60 行 TypeScript）：

```typescript
// client/scripts/check-env-example.ts
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { globSync } from 'glob';

/**
 * .env.example 一致性校验脚本
 *
 * 职责：
 *   1. 扫描 apps/** 下所有 .ts / .tsx 文件中 import.meta.env.VITE_XXX 的使用
 *   2. 收集所有被使用的 VITE_* 变量名
 *   3. 读 client/.env.example 收集所有已声明的 VITE_* 变量名
 *   4. 对比差集：
 *      - 被使用但未声明 → 错误（阻断 PR）
 *      - 声明但未使用 → 警告（提醒清理死代码）
 *
 * 触发时机：
 *   - CI: pnpm check:env  → 硬失败
 *   - 本地: pnpm check:env  → 开发者手动跑
 */

interface Usage {
  readonly file: string;
  readonly line: number;
  readonly name: string;
}

const PROJECT_ROOT = resolve(__dirname, '..');
const ENV_EXAMPLE_PATH = resolve(PROJECT_ROOT, '.env.example');
const ENV_VAR_PATTERN = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g;
const ENV_DECL_PATTERN = /^(VITE_[A-Z0-9_]+)=/gm;

function collectUsages(): Usage[] {
  const usages: Usage[] = [];
  const files = globSync('apps/**/*.{ts,tsx}', {
    cwd: PROJECT_ROOT,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });
  for (const relPath of files) {
    const fullPath = resolve(PROJECT_ROOT, relPath);
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const matches = line.matchAll(ENV_VAR_PATTERN);
      for (const match of matches) {
        const name = match[1];
        if (name) {
          usages.push({ file: relPath, line: idx + 1, name });
        }
      }
    });
  }
  return usages;
}

function collectDeclarations(): Set<string> {
  if (!existsSync(ENV_EXAMPLE_PATH)) {
    console.error(`[check:env] .env.example 不存在: ${ENV_EXAMPLE_PATH}`);
    process.exit(1);
  }
  const content = readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
  const declared = new Set<string>();
  const matches = content.matchAll(ENV_DECL_PATTERN);
  for (const match of matches) {
    const name = match[1];
    if (name) {
      declared.add(name);
    }
  }
  return declared;
}

function main(): void {
  const usages = collectUsages();
  const declared = collectDeclarations();
  const usedNames = new Set(usages.map((u) => u.name));

  const missing = [...usedNames].filter((n) => !declared.has(n));
  const unused = [...declared].filter((n) => !usedNames.has(n));

  if (missing.length > 0) {
    console.error('[check:env] 下列变量在代码中使用但未在 .env.example 声明：');
    for (const name of missing) {
      const locs = usages.filter((u) => u.name === name);
      console.error(`  - ${name}`);
      for (const loc of locs) {
        console.error(`      at ${loc.file}:${loc.line}`);
      }
    }
    console.error(`\n请在 ${ENV_EXAMPLE_PATH} 声明这些变量（带注释说明用途）`);
    process.exit(1);
  }

  if (unused.length > 0) {
    console.warn('[check:env] 下列变量在 .env.example 声明但未被使用，可以清理：');
    for (const name of unused) {
      console.warn(`  - ${name}`);
    }
  }

  console.log(`[check:env] OK，扫描了 ${usages.length} 处使用，${declared.size} 个声明`);
}

main();
```

**注册到 `client/package.json`**：

```json
{
  "scripts": {
    "check:env": "tsx scripts/check-env-example.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "glob": "^11.0.0",
    "typescript": "^5.6.0"
  }
}
```

**CI 集成**：

```yaml
- name: Check .env.example consistency
  run: pnpm -C client check:env
```

**守护的硬约束**：MUST #7。

---

## 5. 触发时机分层

不是所有工具都要在所有时机跑。下面是**分层触发策略**——越靠前越快（只跑变化的部分），越靠后越全（跑完整套）。

### 5.1 Vite dev（实时，毫秒级反馈） [M1]

**触发点**：使用者启动 `pnpm -C client/apps/web-admin dev` 后，代码每次保存。

**跑什么**：

| 工具 | 说明 |
|------|------|
| TypeScript（通过 Vite 插件） | 类型错误实时显示在浏览器覆盖层 |
| TypeScript module augmentation（`i18next.d.ts`） | i18next 内置类型安全方案，零额外依赖、零构建步骤 |
| `@tanstack/router-vite-plugin` | 监听 `routes/**` 变化自动生成 `routeTree.gen.ts` |
| HMR（Vite 内置） | 组件改动热替换 |

**不跑什么**：stylelint / dependency-cruiser / 完整性脚本 / Playwright——这些会让 dev 变慢，留给 build 和 CI。

### 5.2 Vite build（每次 build，秒级） [M1+M2+M3]

**触发点**：`pnpm -C client/apps/web-admin build`，或在 CI 里构建生产产物。

**跑什么**：

| 工具 | 说明 |
|------|------|
| TypeScript strict | `tsc --noEmit` 全量检查 |
| Biome | 代码风格 + noRestrictedImports + noRestrictedGlobals |
| stylelint | CSS 扁平命名 + 禁硬编码颜色 |
| Vite 生产构建 | 产出 dist 目录 |

**不跑什么**：完整性脚本 / Playwright——这些在 CI 阶段跑。

### 5.3 pre-commit（可选，使用者决定） [M1+]

**触发点**：使用者在自己的仓库里配 husky + lint-staged（meta-build 不默认安装，脚手架原则是"不强制使用者装 git hook"）。

**推荐配置**（使用者自行加到 `client/package.json`）：

```json
{
  "devDependencies": {
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["biome check --apply-unsafe"],
    "*.css": ["stylelint --fix"]
  },
  "scripts": {
    "prepare": "husky"
  }
}
```

**跑什么**（推荐）：Biome check / stylelint 的增量检查。**不跑**完整性脚本和测试（太慢，留给 CI）。

### 5.4 CI（必做，分钟级） [M1+M2+M3]

**触发点**：GitHub Actions / GitLab CI / 其他 CI 平台，在 PR 提交和 main 推送时触发。

**跑什么**（完整 workflow）：

```yaml
# .github/workflows/ci.yml 节选
name: CI
on: [pull_request, push]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - name: Install
        run: pnpm -C client install --frozen-lockfile

      # === M1 启用 ===
      - name: TypeScript strict
        run: pnpm -C client -r tsc --noEmit
      - name: Biome check
        run: pnpm -C client biome check .
      - name: Stylelint
        run: pnpm -C client stylelint "**/*.css"
      - name: Dependency-cruiser
        run: pnpm -C client dlx dependency-cruiser --config .dependency-cruiser.cjs packages apps
      - name: Check .env.example
        run: pnpm -C client check:env

      # === M2 启用 ===
      - name: Check theme integrity
        run: pnpm -C client check:theme
      - name: Check i18n integrity
        run: pnpm -C client check:i18n
      - name: Vitest (L2)
        run: pnpm -C client/packages/ui-primitives test
      - name: Storybook build (L2)
        run: pnpm -C client/packages/ui-primitives storybook:build

      # === M3 启用 ===
      - name: Vitest (L3)
        run: pnpm -C client/packages/ui-patterns test
      - name: Vitest (L4)
        run: pnpm -C client/packages/app-shell test
      - name: Playwright E2E
        run: pnpm -C client/apps/web-admin test:e2e
```

**硬失败原则**：任何一步失败即 PR 合入被阻断，不允许 `[skip ci]` 或"下次再修"。

### 5.5 触发时机对照表

| 硬约束 | Vite dev | Vite build | pre-commit | CI |
|--------|---------|-----------|------------|-----|
| RECOMMENDED #1 硬编码 | — | — | — | —（Tailwind v4 自然防线） |
| MUST NOT #2 反向 import | ✅ TS | ✅ TS + dep-cruiser | — | ✅ |
| MUST NOT #3 白名单 | ✅ TS | ✅ Biome + dep-cruiser | — | ✅ |
| MUST NOT #4 auth 豁免 | — | ✅ dep-cruiser | — | ✅ |
| MUST NOT #5 routes 位置 | ✅ vite-plugin | ✅ vite-plugin | — | ✅ |
| MUST NOT #6 L1 无 mb 依赖 | ✅ TS | ✅ dep-cruiser | — | ✅ |
| MUST NOT #7 扁平命名 | — | ✅ stylelint | ✅ stylelint | ✅ |
| RECOMMENDED #8 动态 class | — | —（本地 build 可验证） | — | — |
| MUST #1 Storybook | — | — | — | ✅ |
| MUST #2 主题完整性 | — | — | — | ✅ |
| MUST #3 路由权限 | ✅ TS | ✅ TS | — | ✅ |
| MUST #4 api-sdk | ✅ TS | ✅ Biome | — | ✅ |
| MUST #5 语义 class | — | ✅ stylelint | — | ✅ |
| MUST #6 i18n | ✅ 类型生成 | — | — | ✅ |
| MUST #7 `.env.example` | — | — | — | ✅ |

**观察**：CI 是唯一 100% 覆盖的层，这也是为什么"PR 合入必须 CI 绿"是铁律。

---

## 6. M1 / M2 / M3 各阶段启用对照表

### 6.1 M1（脚手架 + 基础设施）

**目标**：让 5 层 pnpm workspace 跑起来、依赖方向锁死、基础代码风格和类型检查就绪。

**启用的工具**：

| 工具 | 启用位置 |
|------|---------|
| TypeScript strict | 所有 package 的 `tsconfig.json` extends 根配置 |
| Biome | `client/biome.json` + `apps/web-admin/biome.json` |
| stylelint | `client/.stylelintrc.cjs` |
| dependency-cruiser | `client/.dependency-cruiser.cjs`（只开 L1-L4 依赖方向规则，不开 auth 豁免因为 L5 还没代码） |
| `.env.example` 一致性脚本 | `client/scripts/check-env-example.ts` |

**启用的硬约束**：MUST NOT #2 #3 #5 #6 #7；RECOMMENDED #8；MUST #7。

**不启用**：Vitest（还没组件可测）、Storybook（L2 还没写）、主题完整性脚本（L1 主题还没写）、i18n 完整性脚本（L4 还没写）、Playwright（L5 还没写）。

### 6.2 M2（L1 + L2 + Theme + i18n 基础）

**目标**：L1 主题系统和 L2 原子组件库成型，主题切换和 i18n 运行时可用。

**新增启用的工具**：

| 工具 | 启用位置 |
|------|---------|
| Vitest | `packages/ui-primitives/vitest.config.ts` |
| Storybook | `packages/ui-primitives/.storybook/main.ts` |
| 主题完整性脚本 | `packages/ui-tokens/scripts/check-theme-integrity.ts` |
| i18n 完整性脚本 | `client/scripts/check-i18n.ts` |

**新增启用的硬约束**：RECOMMENDED #1（Tailwind v4 自然防线生效）；MUST NOT #4（dep-cruiser auth 豁免只在 L5 存在后才生效，这里先装不跑）；MUST #1 #2 #5 #6。

### 6.3 M3（L3 + L4 + L5 + Routing）

**目标**：L3 业务组件 + L4 壳 + L5 业务代码 + 路由 + 权限全部跑通，端到端 e2e 测试就绪。

**新增启用的工具**：

| 工具 | 启用位置 |
|------|---------|
| Playwright | `apps/web-admin/playwright.config.ts` |
| L3 Storybook | `packages/ui-patterns/.storybook/main.ts` |
| L3 Vitest | `packages/ui-patterns/vitest.config.ts` |
| L4 Vitest | `packages/app-shell/vitest.config.ts` |
| dep-cruiser auth 豁免规则 | 开启 `features-no-api-sdk-auth-state` 和 `auth-routes-may-import-auth-api` |

**新增启用的硬约束**：MUST #3 #4；MUST NOT #4 完整生效。

---

## 7. 自写代码量审计

决策 2 说"务实方案，~180 行自写配置"。本节核对这个数字是否成立。

| 组件 | 类型 | 位置 | 行数估算 |
|------|------|------|---------|
| 主题完整性脚本核心逻辑 | TS | `packages/ui-tokens/scripts/check-theme-integrity.ts` | ~90 行 |
| i18n 完整性脚本核心逻辑 | TS | `client/scripts/check-i18n.ts` | ~100 行 |
| `.env.example` 一致性脚本核心逻辑 | TS | `client/scripts/check-env-example.ts` | ~60 行 |
| dependency-cruiser 配置 | JS | `client/.dependency-cruiser.cjs` | ~80 行 |
| stylelint 配置（含 overrides） | JS | `client/.stylelintrc.cjs` | ~40 行 |
| Biome 子配置（`noRestrictedImports` 映射表） | JSON | `apps/web-admin/biome.json` | ~30 行 |

**小计**：约 **400 行**（含 TypeScript 脚本 + JS 配置 + JSON 映射表）。

**决策 2 的 "~180 行" 指的是**：3 个自写完整性脚本（主题 + i18n + env）的核心逻辑合计约 250 行，去掉注释和空行约 180 行。不包含纯配置文件（dependency-cruiser / stylelint / biome）——那些是声明式配置，不是"自写代码"。

**验证**：这个数字远小于"自己写一套架构守护框架"（估算 2000+ 行）或"上 Nx monorepo"（引入几千行第三方配置和心智负担）。meta-build 选"拼装现成工具 + 最小自写脚本"，符合契约密度决策 2 的务实哲学。

---

## 8. 约束修改流程

如果某条硬约束需要修改（增 / 删 / 改），必须走下面的流程。**不允许**在代码里加 `// biome-ignore` / `// dependency-cruiser-disable-next-line` 等绕过工具的注释——那是污染行为。

### 8.1 加新硬约束

1. **先想清楚**：这条约束守护的是什么（千人千面？依赖方向？契约？）
2. **找对应工具**：TS / Biome / stylelint / dep-cruiser / 完整性脚本，选最适合的那个
3. **改子文件**：在对应的 Batch 1 文件里加章节描述约束的具体形式（例如"L3 不能依赖 Framer Motion"加到 [04-ui-patterns.md §6](./04-ui-patterns.md#6-l3-白名单依赖-m3)）
4. **改工具配置**：dep-cruiser / stylelint / Biome 里加对应规则
5. **改本文件**：在 §2 MUST NOT 或 §3 MUST 加条目（如果是新硬约束而不是扩展已有的）
6. **改 README 反向索引**：把新约束加到 [README.md 反向索引](./README.md#前端硬约束反向索引)
7. **CI 跑一遍**：确认新约束在旧代码上没有误伤（如果有，要么改旧代码要么调约束）

### 8.2 删已有硬约束

删约束意味着"放宽设计"，必须写 ADR 解释为什么。步骤：

1. **写 ADR**：放 `docs/adr/` 下，说明"原约束 #X 为什么要删"——通常是因为约束阻碍了合理的用例
2. **找 Batch 1 文件对应章节**：加"已删除（见 ADR-00XX）"标记，不要直接删除原章节
3. **改工具配置**：关闭对应规则（注释掉而不是删除）
4. **改本文件**：把 MUST NOT / MUST 表里的条目改成"已删除"
5. **改 README 反向索引**：同步标记

### 8.3 临时绕过某条约束（强烈不推荐）

如果在某次紧急修复中必须绕过某条约束：

1. **不要直接加 disable 注释**
2. 先在 PR 描述里写清楚"为什么必须绕"
3. **加 TODO issue**：记录下次合并到主干时必须修的事项
4. **约束配置里加例外**：例如 dep-cruiser 加一条豁免规则而不是全局禁用，并加注释指向 TODO

**更好的做法**：如果一个约束需要被绕过的场景很常见，那说明约束本身有问题，应该走"改约束"流程而不是"绕约束"。

---

## 9. 验证

本文件定义的工具链是否就绪，可以通过下面的命令链一次性验证。**M3 完成后**应该能全部通过。

```bash
cd client

# 安装
pnpm install --frozen-lockfile

# === 静态检查 ===
pnpm -r tsc --noEmit
pnpm biome check .
pnpm stylelint "**/*.css"
pnpm dlx dependency-cruiser --config .dependency-cruiser.cjs packages apps

# === 完整性脚本 ===
pnpm check:theme
pnpm check:i18n
pnpm check:env

# === 单元测试 ===
pnpm -F @mb/ui-primitives test
pnpm -F @mb/ui-patterns test
pnpm -F @mb/app-shell test

# === Storybook 构建 ===
pnpm -F @mb/ui-primitives storybook:build
pnpm -F @mb/ui-patterns storybook:build

# === E2E ===
pnpm -F web-admin test:e2e
```

预期：所有命令 exit code 为 0。

<!-- verify: cd client && pnpm install && pnpm -r tsc --noEmit && pnpm biome check . && pnpm stylelint "**/*.css" && pnpm check:theme && pnpm check:i18n && pnpm check:env -->

---

[← 返回 README](./README.md)
