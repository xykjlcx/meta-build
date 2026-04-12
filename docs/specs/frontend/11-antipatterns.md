# 11 - 前端反面教材

> **关注点**：从 nxboot 历史踩坑 + meta-build brainstorming 阶段的纠偏经验中提炼出的"不要这样做"清单。每条反面教材都有反模式代码、后果、正确做法、防御机制、引用，严格对齐 [backend/08-archunit-rules.md](../backend/08-archunit-rules.md) §6 的风格。
>
> 文末 §13 "元教训"回顾 brainstorming 阶段的 3 条思维方式问题——比单条反模式更难拦截，靠纪律性自检。

---

## 1. 反面教材总览 [M0]

| # | 反面教材 | 防御机制 | 引用 |
|---|---------|---------|------|
| §2 | 硬编码颜色污染主题 | Biome + stylelint + 主题完整性脚本 | [02](./02-ui-tokens-theme.md) §2/§4 |
| §3 | 跨层反向 import | dependency-cruiser + pnpm workspace | [01](./01-layer-structure.md) §4 |
| §4 | L2/L3 内部消费 i18n 导致独立不可用 | Biome `no-restricted-imports` + Storybook | [03](./03-ui-primitives.md) §4 / [05](./05-app-shell.md) §7 |
| §5 | 动态拼接 Tailwind class（生产丢样式） | Tailwind v4 `@theme` 防线 + Biome lint | `./10-quality-gates.md` §4.8（待写）|
| §6 | 数据库字段强行 i18n | 架构约定 + code review | [05](./05-app-shell.md) §7 / [07](./07-menu-permission.md) §5 |
| §7 | 使用者改 L2 时硬编码品牌色 | stylelint 全 monorepo 生效 | [01](./01-layer-structure.md) §3 |
| §8 | 菜单/权限单表同步 drift | 双树架构本身即防御 | [07](./07-menu-permission.md) §2/§13 |
| §9 | `.env.example` 漏声明 | `scripts/check-env-example.ts` CI | `./10-quality-gates.md` §4.11（待写）|
| §10 | 主题 CSS 用非扁平命名 | 主题完整性脚本 + stylelint | [02](./02-ui-tokens-theme.md) §4 |
| §11 | `routes/` 目录外声明路由 | TanStack Router 约定 + Biome `no-restricted-imports` | [06](./06-routing-and-data.md) §2 |
| §12 | 业务代码直调 api-sdk/auth | dependency-cruiser 子路径规则 | [08](./08-contract-client.md) §6 |
| §13 | 元教训（3 条思维纪律） | 自检清单 | memory files |

> **编号对齐**：§2 = MUST NOT #1，§3 = MUST NOT #2，依此类推，与 [README](./README.md) 反向索引对齐。

---

## 2. 硬编码颜色污染主题 [M1+M2]

### 2.1 反模式

```tsx
// apps/web-admin/src/features/orders/status-badge.tsx
export function StatusBadge({ status }: { status: string }) {
  // 反例 1：Tailwind 任意值语法
  if (status === 'paid') return <span className="bg-[#10b981] text-[#fff]">已付</span>;
  // 反例 2：Tailwind 调色板 class（绕过语义层）
  if (status === 'pending') return <span className="bg-yellow-500 text-white">待付</span>;
  // 反例 3：内联 style
  return <span style={{ color: '#ef4444' }}>已取消</span>;
}
```

### 2.2 后果

- **千人千面承诺破裂**：使用者切换主题（`data-theme="brand-blue"`）时硬编码颜色不跟随，UI 出现"半旧半新"撕裂
- **暗色模式失效**：硬编码 `#ffffff` 文字在暗色背景上看不见
- **WCAG AA 对比度无法保证**：绕过语义层后自动化对比度校验失效
- **主题升级路径锁死**：未来想做运维可视化主题编辑器时硬编码颜色无法被运行时覆盖

### 2.3 正确做法

```tsx
// packages/ui-primitives/src/badge.tsx（L2 通过 CVA 映射语义 class）
import { cva } from 'class-variance-authority';
export const badgeVariants = cva('inline-flex items-center rounded-md px-2 py-0.5 text-xs', {
  variants: {
    variant: {
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
    },
  },
});
```

```tsx
// apps/web-admin/src/features/orders/status-badge.tsx
import { Badge } from '@mb/ui-primitives/badge';
import { useTranslation } from 'react-i18next';

export function StatusBadge({ status }: { status: 'paid' | 'pending' | 'canceled' }) {
  const { t } = useTranslation('order');
  const variant = status === 'paid' ? 'success' : status === 'pending' ? 'warning' : 'destructive';
  return <Badge variant={variant}>{t(`status.${status}`)}</Badge>;
}
```

`bg-success` 在 `tailwind.config.ts` 里映射到 `var(--color-success)`，最终消费 [02-ui-tokens-theme.md §3 语义 token 完整清单](./02-ui-tokens-theme.md) 定义的源数据。

### 2.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| Biome 自定义规则 | `bg-[#xxx]` / `bg-red-500` 等 Tailwind 调色板 class |
| stylelint | `style={{ color: '#xxx' }}` + 任意 hex/rgb/hsl 值 |
| 主题完整性脚本 | 启动时校验所有主题定义了 46 个语义 token |

```json
// .stylelintrc.json（关键规则）
{ "rules": {
  "color-no-hex": true,
  "declaration-property-value-disallowed-list": {
    "/^color$/": ["/^rgb/", "/^hsl/", "/^#/"],
    "/^background/": ["/^rgb/", "/^hsl/", "/^#/"]
  }
} }
```

<!-- verify: cd client && pnpm lint -->

### 2.5 引用

- MUST NOT #1
- 详见 [02-ui-tokens-theme.md §2 CSS Variables Only 哲学](./02-ui-tokens-theme.md) + §3 语义 token 完整清单
- 千人千面承诺的工程根基

---

## 3. 跨层反向 import [M1]

### 3.1 反模式

```tsx
// 反例 1：L2 反向 import L3
// packages/ui-primitives/src/dialog.tsx
import { NxTable } from '@mb/ui-patterns/nx-table'; // ❌ 低层依赖高层

// 反例 2：L1 依赖任何 @mb/* 包
// packages/ui-tokens/src/index.ts
import { Button } from '@mb/ui-primitives'; // ❌ L1 必须零依赖

// 反例 3：L4 反向 import L5 业务代码
// packages/app-shell/src/header.tsx
import { OrderQuickCreate } from '@/features/orders/quick-create'; // ❌ L4 不知道 L5
```

### 3.2 后果

- **千人千面定制能力被破坏**：低层知道高层 → 高层换实现时低层一起爆炸
- **使用者无法独立替换 L2/L3**：想砍掉 NxTable 时发现 L2 的 Dialog 反向依赖它，联动改一大片
- **循环依赖运行时崩**：pnpm 安装仍成功，Vite 构建时报 `Cannot access X before initialization`
- **吃掉脚手架"clone 即拥有"承诺**：物理层级失效退化成约定层级

### 3.3 正确做法

```tsx
// 顺向：L3 依赖 L2 + L1
// packages/ui-patterns/src/nx-table.tsx
import { Button } from '@mb/ui-primitives/button';
export function NxTable<T>({ data, onRefresh }: NxTableProps<T>) {
  return (
    <div className="bg-background text-foreground">
      <Button onClick={onRefresh}>刷新</Button>
    </div>
  );
}

// L4 通过 props 接收 L5 注入
// packages/app-shell/src/header.tsx
export function Header({ extra }: { extra?: React.ReactNode }) {
  return <header className="bg-background">{extra}</header>;
}

// L5 在 routes 里组装
// apps/web-admin/src/routes/__root.tsx
import { Header } from '@mb/app-shell/header';
import { OrderQuickCreate } from '@/features/orders/quick-create';
export function RootLayout() { return <Header extra={<OrderQuickCreate />} />; }
```

### 3.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| dependency-cruiser | 扫描 import 发现"低层 → 高层"或"L1 → 任何 @mb/*"立即报错 |
| pnpm workspace 物理隔离 | L1 `package.json` 的 `dependencies` 不写 `@mb/*`，安装时直接缺包 |
| TypeScript 路径映射 | `tsconfig.base.json` 限制每层 alias 可见范围 |

```javascript
// .dependency-cruiser.cjs 关键规则
module.exports = {
  forbidden: [
    { name: 'no-reverse-layer', severity: 'error',
      from: { path: '^packages/ui-primitives' },
      to: { path: '^packages/(ui-patterns|app-shell)' } },
    { name: 'l1-no-mb-deps', severity: 'error',
      from: { path: '^packages/ui-tokens' },
      to: { path: '^packages/(ui-primitives|ui-patterns|app-shell)' } },
  ],
};
```

<!-- verify: cd client && pnpm depcruise -->

### 3.5 引用

- MUST NOT #2 + MUST NOT #6
- 详见 [01-layer-structure.md §4 依赖方向守护机制](./01-layer-structure.md)

---

## 4. L2 / L3 内部消费 i18n 导致独立不可用 [M2+M3]

### 4.1 反模式

```tsx
// 反例 1：L2 Dialog 内部调 useTranslation
// packages/ui-primitives/src/dialog.tsx
import { useTranslation } from 'react-i18next'; // ❌ L2 不应知道 i18n
export function Dialog({ children, onConfirm, onCancel }) {
  const { t } = useTranslation('common');
  return <div>{children}<button onClick={onConfirm}>{t('confirm')}</button></div>;
}

// 反例 2：L3 NxTable 写死中文兜底
// packages/ui-patterns/src/nx-table.tsx
export function NxTable({ data }) {
  if (data.length === 0) return <div>暂无数据</div>; // ❌ 写死中文
}
```

### 4.2 后果

- **L2/L3 不能独立使用**：Storybook 里单看 Dialog 必须配 i18n Provider，否则报错
- **L2/L3 不能被开源市场复用**：未来抽出来给其他项目用时 i18n 强依赖让分发成本激增
- **i18n key 命名权被基础组件抢走**：业务方想用"是/否"代替"确认/取消"要改 L2 源码
- **违反 i1 决策**："L2/L3 零感知 i18n，文案通过 props 传入"是 brainstorming 明确确认的设计

### 4.3 正确做法

```tsx
// L2 Dialog 通过 props 接收文案（shadcn 式）
// packages/ui-primitives/src/dialog.tsx
export interface DialogProps {
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export function Dialog({ children, confirmText, cancelText, onConfirm, onCancel }: DialogProps) {
  return <div>{children}<button onClick={onConfirm}>{confirmText}</button></div>;
}

// L3 NxTable 接收 emptyText 兜底
export interface NxTableProps<T> {
  data: T[];
  emptyText?: React.ReactNode;
}
export function NxTable<T>({ data, emptyText }: NxTableProps<T>) {
  if (data.length === 0) return <div className="text-muted-foreground">{emptyText ?? '—'}</div>;
  return <table>{/* ... */}</table>;
}

// L5 持有 i18n，把文案传给 L2/L3
// apps/web-admin/src/features/orders/order-list-page.tsx
import { useTranslation } from 'react-i18next';
export function OrderListPage() {
  const { t } = useTranslation('order');
  return <NxTable data={orders} emptyText={t('list.empty')} />;
}
```

### 4.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| Biome `no-restricted-imports` | `packages/ui-primitives/**` 和 `packages/ui-patterns/**` 禁止 import `react-i18next`/`i18next` |
| Storybook 独立运行验证 | L2/L3 故事必须能在没有 i18n Provider 的 Storybook 中渲染 |
| Code review checklist | L2/L3 里任何中文/英文字符串都要质疑 |

```json
// biome.json 片段
{ "overrides": [{
  "include": ["packages/ui-primitives/**", "packages/ui-patterns/**"],
  "linter": { "rules": { "style": { "noRestrictedImports": { "level": "error",
    "options": { "paths": {
      "react-i18next": "L2/L3 禁止消费 i18n（i1 决策）",
      "i18next": "同上"
    } } } } } }
}] }
```

<!-- verify: cd client && pnpm -F @mb/ui-primitives storybook:build -->

### 4.5 引用

- i1 决策：L2/L3 零感知 i18n
- 详见 [03-ui-primitives.md §4 组件 API 约定](./03-ui-primitives.md) + [05-app-shell.md §7 i18n 完整工程](./05-app-shell.md)

---

## 5. 动态拼接 Tailwind class name [M1+M2]

**为什么不应该动态拼接 Tailwind class**：Tailwind 在构建时扫描源码中的静态字符串来生成 CSS。动态拼接的 class（如 `` `bg-${color}-500` ``）在构建时不可见，不会生成对应 CSS，导致生产环境样式完全丢失。这不是 lint 规则的问题，而是 Tailwind 的构建机制决定的。正确做法是使用对象映射。

### 5.1 反模式

```tsx
// ❌ 动态拼接——生产环境样式丢失
const className = `bg-${color}-500`

// 反例 1：模板字符串拼接 class
function StatusDot({ color }: { color: 'red' | 'green' | 'blue' }) {
  return <span className={`bg-${color}-500 inline-block size-3 rounded-full`} />;
  // ❌ Tailwind JIT 静态扫描根本扫不到 bg-red-500/bg-green-500/bg-blue-500
}

// 反例 2：对象索引拼接
function btnClass(variant: string) {
  return `bg-${variant} hover:bg-${variant}-600`; // ❌ 同样扫不到
}
```

### 5.2 后果

- **生产构建样式丢失**：dev 模式全量 CSS 一切正常，生产构建（Tailwind purge 只留扫到的 class）后样式消失
- **bug 只在生产出现**：测试阶段难复现，经典"上线才发现"型坑
- **同时违反硬编码颜色禁令**（§2），双重违反

### 5.3 正确做法

```tsx
// ✅ 对象映射——所有 class 都是完整字符串，Tailwind 能扫描到
const colorMap = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
} as const
const className = colorMap[status]

// 正例 1：完整 class 列出，Tailwind 能扫到所有可能值
import { clsx } from 'clsx';
function StatusDot({ color }: { color: 'red' | 'green' | 'blue' }) {
  return <span className={clsx('inline-block size-3 rounded-full',
    color === 'red' && 'bg-destructive',
    color === 'green' && 'bg-success',
    color === 'blue' && 'bg-info')} />;
}

// 正例 2：CVA variants（推荐，类型安全）
import { cva, type VariantProps } from 'class-variance-authority';
const dotVariants = cva('inline-block size-3 rounded-full', {
  variants: { color: { red: 'bg-destructive', green: 'bg-success', blue: 'bg-info' } },
});
export function StatusDot({ color }: VariantProps<typeof dotVariants>) {
  return <span className={dotVariants({ color })} />;
}
```

### 5.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| Tailwind v4 `@theme` | `--color-*: initial` 自然防线，未通过 `@theme` 注册的 class 不会进入产物 |
| Biome lint | 正则规则匹配 `` className={`.*\${.*}.*` `` 模板字符串拼接 |

<!-- verify: cd client && pnpm lint -->

### 5.5 引用

- MUST NOT #8
- 详见 `./10-quality-gates.md` §4.8（Batch 2 待写）

---

## 6. 数据库字段强行 i18n [M3+M4]

### 6.1 反模式

```sql
-- 反例 1：JSONB 存多语言
CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY,
    name JSONB NOT NULL -- ❌ {"zh-CN":"订单管理","en-US":"Order Management"}
);

-- 反例 2：i18n key 走前端字典
CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY,
    name_key VARCHAR(128) -- ❌ "menu.order.management"，前端查 menu.json
);
```

```tsx
// 反例 3：前端把 name_key 当 i18n key 解析
function MenuItem({ menu }: { menu: SysMenu }) {
  const { t } = useTranslation('menu');
  return <span>{t(menu.name_key)}</span>; // ❌ 数据库数据走 i18n
}
```

### 6.2 后果

- **运维 UI 复杂度爆炸**：运维想改"订单管理→订货管理"要先想"改数据库 JSONB 还是前端字典"，要懂 i18n key 命名规范
- **运维和翻译的边界模糊**：数据库业务数据和代码静态文案是完全不同的关注点，混一起 → 谁负责翻译永远扯不清
- **新增菜单要同步更新前端字典**：CI 校验"数据库 name_key 在前端字典都有对应"，发布流程多一步
- **违反 MUST #6 的边界**：MUST #6 明确说"代码静态文案走 i18n，数据库存储的文案永不走 i18n"，被字面化扩大解释
- **JSONB 查询性能下降**：每次菜单查询要解析 JSON，比 VARCHAR 慢

### 6.3 正确做法

```sql
-- 菜单 name 就是普通 VARCHAR，运维填什么就是什么
CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY,
    name VARCHAR(64) NOT NULL, -- 直接存运维填的字符串
    icon VARCHAR(64),
    parent_id BIGINT,
    route_ref_id BIGINT
);
```

```tsx
// 前端直接展示，不走 i18n
function MenuItem({ menu }: { menu: SysMenu }) { return <span>{menu.name}</span>; }
```

**判断什么走/不走 i18n 的清单**：

| 内容来源 | 例子 | 是否 i18n |
|---------|------|---------|
| 代码写死的字符串 | `<Button>提交订单</Button>` | ✅ |
| 表单字段标签 | `<Label>用户名</Label>` | ✅ |
| 错误提示 | `toast.error('密码不正确')` | ✅ |
| 表格列头 | `header: '订单号'` | ✅ |
| 数据库菜单名 | `sys_menu.name = '订单管理'` | ❌ |
| 数据库字典选项 | `sys_dict_item.label = '已付款'` | ❌ |
| 业务数据 | `sys_user.nickname = '张三'` | ❌ |
| 用户填写的内容 | `order.remark = '加急'` | ❌ |

**真要多语言菜单怎么办**：在使用者自己的项目里加 `sys_menu_i18n` 表（运维 UI 提供"添加翻译"按钮），不放进 meta-build 底座。底座只保证最简模型。

### 6.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| Code review | 看到 `JSONB` / `name_key` / `i18n_xxx` 字段立即质疑 |
| 架构约定 | meta-build 底座的所有数据库表不允许 JSONB 翻译字段 |
| Flyway migration review | M4 阶段 platform-iam 的 SQL review checklist |

### 6.5 引用

- MUST #6 的边界：代码静态文案走 i18n，数据库存储的文案永不走 i18n
- 详见 [05-app-shell.md §7 i18n 完整工程](./05-app-shell.md) + [07-menu-permission.md §5 菜单树 sys_menu](./07-menu-permission.md)

---

## 7. 脚手架模式下使用者改 L2 时硬编码品牌色 [M2+]

### 7.1 反模式

使用者 fork meta-build 后想"把按钮改成自己品牌蓝"，直接改 L2 源码：

```tsx
// 使用者改了 packages/ui-primitives/src/button.tsx
export const buttonVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      primary: 'bg-[#0066ff] text-white hover:bg-[#0052cc]', // ❌ 把语义 token 改成硬编码
    },
  },
});
```

### 7.2 后果

- **千人千面承诺破裂**：所有用 `<Button variant="primary">` 的地方颜色锁死，后续换主题要搜索替换源码
- **看似快实则慢**：第一次省 5 分钟（不用学主题机制），后续每次调整都要回 L2 改源码，复利式负债
- **使用者团队新人困惑**：新人看到 L2 里硬编码颜色，不知道是"meta-build 自带"还是"前任改的"，没有信号区分
- **stylelint 可能漏**（除非配在 packages/ 上）：使用者可能以为 stylelint 只对 L5 业务代码生效

### 7.3 正确做法

**方法一：改主题（80% 场景推荐）**

```css
/* packages/ui-tokens/themes/brand-blue.css */
[data-theme="brand-blue"] {
  --color-primary: #0066ff;
  --color-primary-foreground: #ffffff;
  /* 其他 46 个语义 token */
}
```

```tsx
// apps/web-admin/src/main.tsx
document.documentElement.setAttribute('data-theme', 'brand-blue');
```

完成！所有 `<Button variant="primary">` 自动跟随。

**方法二：扩展 L2（5% 场景，需要新 variant 时）**

```tsx
export const buttonVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground',
      ghost: 'bg-transparent text-primary hover:bg-primary/10', // 新 variant 仍用语义 token
    },
  },
});
```

### 7.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| stylelint 全 monorepo 生效 | `.stylelintrc.json` 的 files.include 覆盖 `packages/**` + `apps/**` |
| Biome `noArbitraryColors` | 同样对 packages/ 生效 |
| CLAUDE.md 约定 | "改 L2 源码前先问：能不能用主题机制覆盖" |
| 使用者手册 | 把"改主题"作为推荐路径，"改 L2 源码"作为 escape hatch |

<!-- verify: cd client && pnpm lint && pnpm stylelint "**/*.{css,tsx}" -->

### 7.5 引用

- MUST NOT #1（硬编码颜色）的脚手架特化场景
- 详见 [01-layer-structure.md §3 脚手架模式](./01-layer-structure.md) + `./09-customization-workflow.md`（Batch 2 待写）

---

## 8. 菜单 / 权限单表同步 drift [M3+M4]

### 8.1 反模式

继承 nxboot 的 `sys_menu` 单表设计，靠 `type` 字段区分 directory / menu / button：

```sql
CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    type SMALLINT,        -- ❌ 1=directory 2=menu 3=button
    name VARCHAR(64),
    path VARCHAR(128),
    component VARCHAR(128),
    permission VARCHAR(128),
    sort INT
);
```

并且通过 CI 脚本扫描代码同步表：

```typescript
// scripts/sync-menu-from-code.ts ❌
async function syncMenuFromCode() {
  const routes = await scanRoutes();
  for (const r of routes) {
    if (r.requireAuth) await db.upsert('sys_menu', { type: 3, permission: r.requireAuth.permission });
  }
}
```

### 8.2 后果

- **代码和表双向不对称**：代码删权限点 → 表里残留；表里手动加权限点 → 代码无对应 `requireAuth`
- **运维改菜单层次污染权限点**：运维拖动菜单时不小心改了 button 行的 `parent_id`，权限点归属错位
- **同步靠工程补丁不是架构解决**：每次代码变更都要跑 sync 脚本，CI 失败就阻塞合并
- **`type` 字段是"伪聚合"反模式**：把"代码反映"和"业务组织"两个独立关注点揉一张表里靠枚举假装是同一东西

### 8.3 正确做法

**双树架构**：路由树（代码权威，只读）+ 菜单树（运维自由配置）。

```sql
-- 树 1：路由树（代码扫描产物，运维只读）
CREATE TABLE sys_route_tree (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,
    type SMALLINT,              -- 1=menu 页面 2=button 权限点
    code VARCHAR(128),          -- 'order.read' / 'order.delete'
    path VARCHAR(128),
    last_seen_at TIMESTAMPTZ,   -- 启动时 upsert
    is_stale BOOLEAN            -- 代码侧已不再出现的 stale 标记
);

-- 树 2：菜单树（运维自由配置）
CREATE TABLE sys_menu (
    id BIGINT PRIMARY KEY,
    parent_id BIGINT,           -- 任意嵌套
    name VARCHAR(64),           -- 运维填的显示名（不走 i18n，见 §6）
    icon VARCHAR(64),
    sort INT,
    route_ref_id BIGINT,        -- 指向 sys_route_tree.id（directory 节点为 NULL）
    FOREIGN KEY (route_ref_id) REFERENCES sys_route_tree(id)
);
```

Vite 插件构建时扫 `routes/**/*.tsx`，后端启动时读 `build/route-tree.json` 自动 upsert → 代码和路由树零 drift。运维只能改 `sys_menu`，`sys_route_tree` 只读。

**为什么不退化为单表**：代码结构和业务组织是两个独立的演化轴，演化频率和演化主体完全不同。物理隔离两棵树才是真正的单一职责。

### 8.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| 架构约束 | 双树设计本身即防御，不存在能写 button 行的 SQL 入口 |
| Vite 插件 | 启动时扫 routes，没有手动 upsert 入口 |
| 后端启动钩子 | 读 `build/route-tree.json` 自动 upsert，不依赖 CI 同步脚本 |
| CLAUDE.md 警告 | 明确禁止"表太多了，合并成一张吧"的提议 |
| memory 锁定 | `~/.claude/projects/.../memory/project_frontend_permission_dual_tree.md` 记录"禁止退化"承诺 |

### 8.5 引用

- nxboot 反面教材
- 详见 [07-menu-permission.md §2 单表方案的否决](./07-menu-permission.md) + §13 禁止退化为单表的承诺

---

## 9. .env.example 漏声明 [M1+]

### 9.1 反模式

代码新增环境变量但忘在 `.env.example` 里声明：

```typescript
// apps/web-admin/src/lib/sentry.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // ❌ 新增引用
  environment: import.meta.env.VITE_APP_ENV,
});
```

```bash
# apps/web-admin/.env.example
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=Meta Build Admin
# ❌ 没有 VITE_SENTRY_DSN 和 VITE_APP_ENV
```

### 9.2 后果

- **使用者 clone 后 Sentry 悄悄没启用**：按 README 复制 `.env.example` 到 `.env`，不知道有 `VITE_SENTRY_DSN` 存在 → 生产监控失效
- **脚手架模式特有**：依赖库模式下使用者会读 README 配环境变量；脚手架模式下直接 clone 就跑，`.env.example` 是唯一的"环境变量自描述"
- **没有运行时报错**：`import.meta.env.VITE_SENTRY_DSN` 缺失只是 `undefined`，Sentry 静默初始化失败极难排查
- **类似失效**：可能影响 GA、错误上报、CDN 切换、特性开关

### 9.3 正确做法

```bash
# apps/web-admin/.env.example
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=Meta Build Admin
VITE_APP_ENV=development
# 错误监控（生产必填，开发留空 → 自动禁用 Sentry）
VITE_SENTRY_DSN=
```

```typescript
// scripts/check-env-example.ts
import { readFileSync } from 'node:fs';
import { glob } from 'glob';

const ENV_PATTERN = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g;

async function check() {
  const files = await glob('apps/web-admin/src/**/*.{ts,tsx}');
  const usedVars = new Set<string>();
  for (const file of files) {
    for (const m of readFileSync(file, 'utf-8').matchAll(ENV_PATTERN)) usedVars.add(m[1]);
  }

  const declared = new Set(
    readFileSync('apps/web-admin/.env.example', 'utf-8')
      .split('\n').filter((l) => l.startsWith('VITE_')).map((l) => l.split('=')[0].trim())
  );
  const missing = [...usedVars].filter((v) => !declared.has(v));
  if (missing.length > 0) {
    console.error('环境变量在代码中使用但 .env.example 未声明：', missing);
    process.exit(1);
  }
}
check();
```

### 9.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| `scripts/check-env-example.ts` | CI 必跑，发现使用了未声明的环境变量立即失败 |
| Vite 内置 envPrefix 校验（辅助）| 默认只暴露 `VITE_` 前缀变量，防止误用其他前缀 |

<!-- verify: cd client && pnpm tsx scripts/check-env-example.ts -->

### 9.5 引用

- MUST #7
- 详见 `./10-quality-gates.md` §4.11（Batch 2 待写）

---

## 10. 主题用非扁平命名 [M1]

### 10.1 反模式

```css
/* 反例 1：嵌套段落表达层级 */
:root {
  --colors-primary-500: #0ea5e9;       /* ❌ 三段式嵌套 */
  --colors-primary-foreground: #fff;
}

/* 反例 2：点分段命名 */
:root { --color.primary.default: #0ea5e9; } /* ❌ */

/* 反例 3：camelCase */
:root { --colorPrimary: #0ea5e9; }   /* ❌ 不符合 CSS 惯例 */
```

### 10.2 后果

- **未来升级到 JSON 源时无法自动迁移**：扁平命名 `--color-primary` 可机械映射到 JSON path `{color:{primary:'...'}}`；嵌套命名 `--colors-primary-500` 没有"哪段是 group / 哪段是 name / 哪段是 modifier"的稳定规则，转换函数无法自动识别
- **Tailwind preset 配置变复杂**：扁平时 `preset.theme.colors.primary = 'var(--color-primary)'` 一行；嵌套时要写 `colors.primary.500 = 'var(--colors-primary-500)'`，多层对象语法
- **AI 改主题容易出错**：嵌套命名让 AI 不知道哪段可省略（`--colors-primary` 还是 `--colors-primary-DEFAULT`？），扁平只有一种写法
- **和 shadcn 生态不一致**：shadcn 用扁平命名（`--background`/`--foreground`/`--primary`），强行嵌套后从 shadcn 复制组件代码要全量改写

### 10.3 正确做法

```css
/* packages/ui-tokens/themes/default.css */
:root {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-primary: #0ea5e9;
  --color-primary-foreground: #ffffff;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-success: #10b981;
  --color-warning: #f59e0b;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  --size-control-height: 2.5rem;
}
```

未来升级 JSON 源时的转换（30 行代码即可机械生成）：

```typescript
// v1.5 预案：JSON → CSS
type ThemeJson = Record<string, Record<string, string>>;
function jsonToCssVars(theme: ThemeJson): string {
  const lines: string[] = [];
  for (const [group, items] of Object.entries(theme)) {
    for (const [name, value] of Object.entries(items)) lines.push(`  --${group}-${name}: ${value};`);
  }
  return lines.join('\n');
}
// 输入: { color: { primary: '#0ea5e9', 'primary-foreground': '#fff' } }
// 输出: --color-primary: #0ea5e9;
//       --color-primary-foreground: #fff;
```

### 10.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| 主题完整性脚本 | 启动时正则校验所有 CSS 变量匹配 `^--[a-z]+(-[a-z0-9]+)*$`，发现 `.` 或 camelCase 立即报错 |
| stylelint `custom-property-pattern` | 同上正则强制 |

```json
// .stylelintrc.json
{ "rules": {
  "custom-property-pattern": ["^[a-z]+(-[a-z0-9]+)*$", {
    "message": "CSS 变量必须扁平命名（MUST NOT #7）"
  }]
} }
```

<!-- verify: cd client && pnpm -F @mb/ui-tokens check-themes -->

### 10.5 引用

- MUST NOT #7
- 详见 [02-ui-tokens-theme.md §4 扁平命名约定](./02-ui-tokens-theme.md)

---

## 11. routes 目录外的路由声明 [M3]

### 11.1 反模式

```tsx
// 反例：在 features 目录里声明路由
// apps/web-admin/src/features/orders/order-list-page.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/orders/')({ // ❌ 错位置
  component: OrderListPage,
  beforeLoad: requireAuth({ permission: 'order.read' }),
});

function OrderListPage() { return <div>订单列表</div>; }
```

### 11.2 后果

- **TanStack Router 的 routeTree.gen.ts 扫不到**：Vite 插件只扫 `apps/web-admin/src/routes/**/*.tsx`，features 里的 `createFileRoute` 不会被识别，路由根本注册不上
- **看似有路由，访问 404**：开发者写完后访问 `/orders` 直接 404，调试时不知道哪里出错
- **类型推导失效**：`<Link to="/orders">` 类型补全依赖 `routeTree.gen.ts`，路由没注册 → 类型不存在
- **双树架构的路由树扫描也漏**：Vite 插件扫 routes 提取 `requireAuth`，features 里的路由不会进入 `sys_route_tree`，权限点缺失

### 11.3 正确做法

**约定**：路由文件在 `apps/web-admin/src/routes/`，业务组件在 `features/`，路由文件 import features 里的组件。

```tsx
// 业务组件（不含路由声明）
// apps/web-admin/src/features/orders/order-list-page.tsx
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@mb/api-sdk';
export function OrderListPage() {
  const { data } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.list() });
  return <div>订单列表 {data?.length} 条</div>;
}

// 路由文件（含 createFileRoute + 守卫 + import 业务组件）
// apps/web-admin/src/routes/orders/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@mb/app-shell/router';
import { OrderListPage } from '@/features/orders/order-list-page';

export const Route = createFileRoute('/orders/')({
  component: OrderListPage,
  beforeLoad: requireAuth({ permission: 'order.read' }),
  meta: { title: '订单列表', buttons: ['order.delete', 'order.export'] },
});
```

### 11.4 防御机制

| 工具 | 拦截内容 |
|------|---------|
| TanStack Router Vite 插件 | 只扫 `routes/**/*.tsx`，features 里的路由声明被忽略 → 开发时立即 404 发现 |
| Biome `noRestrictedImports` | features 禁止 import `createFileRoute`/`createRootRoute`（只允许 `useNavigate`/`Link`）|
| 路由树扫描脚本 | `build/route-tree.json` 缺失意味着 `requireAuth` 没扫到，构建失败 |

```json
// biome.json — features 目录覆盖
{
  "overrides": [{
    "include": ["apps/web-admin/src/features/**/*.{ts,tsx}"],
    "linter": { "rules": { "correctness": {
      "noRestrictedImports": { "level": "error", "options": {
        "paths": { "@tanstack/react-router": "路由声明只能在 routes/ 目录（MUST NOT #5）" }
      }}
    }}}
  }]
}
```

<!-- verify: cd client && pnpm -F web-admin lint && pnpm -F web-admin build -->

### 11.5 引用

- MUST NOT #5
- 详见 [06-routing-and-data.md §2 TanStack Router 文件路由](./06-routing-and-data.md)

---

## 12. 业务代码直调 api-sdk/auth/me [M3+M4]

### 12.1 反模式

业务组件绕过 `useCurrentUser` hook，直接调 `@mb/api-sdk` 的 auth 接口：

```tsx
// 反例 1：apps/web-admin/src/features/dashboard/header.tsx
import { authApi } from '@mb/api-sdk';
import { useQuery } from '@tanstack/react-query';
export function DashboardHeader() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => authApi.getMe() }); // ❌
  return <div>欢迎 {user?.nickname}</div>;
}

// 反例 2：另一个组件独立调，缓存 key 还不同
// apps/web-admin/src/features/orders/order-list-page.tsx
const { data: me } = useQuery({ queryKey: ['me-orders'], queryFn: () => authApi.getMe() }); // ❌
```

### 12.2 后果

- **多处独立缓存 → 登出时清理不彻底**：登出只清一个 `['me']`，其他 `['me-orders']`/`['me-dashboard']` 还在，下次进入页面出现"幽灵登录态"
- **Accept-Language 切换时不一致**：切换语言后某些组件用户信息没刷新
- **绕过认证门面单一来源原则**：`useCurrentUser` 是认证门面（来自 `@mb/app-shell`），内部统一管理缓存、登出清理、自动刷新
- **权限信息缓存漂移**：`useCurrentUser` 还会拉 `permissions` 列表，业务代码绕过它拿不到一致的权限快照
- **类比后端**：后端 MUST"业务层只能通过 `CurrentUser` 门面访问当前用户"——前端是同样的设计

### 12.3 正确做法

```tsx
// features 用 useCurrentUser hook（来自 @mb/app-shell）
import { useCurrentUser } from '@mb/app-shell/auth';
export function DashboardHeader() {
  const { user, permissions } = useCurrentUser();
  return (
    <div>
      欢迎 {user?.nickname}
      {permissions.has('order.create') && <button>新建订单</button>}
    </div>
  );
}
```

```tsx
// useCurrentUser 内部统一管理（实现在 @mb/app-shell 内部）
// packages/app-shell/src/auth/use-current-user.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@mb/api-sdk';

const ME_QUERY_KEY = ['__mb_app_shell__', 'me'] as const; // 全局唯一 key

export function useCurrentUser() {
  const { data } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => authApi.getMe(),
    staleTime: Infinity,
  });
  return { user: data?.user ?? null, permissions: new Set(data?.permissions ?? []) };
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    await authApi.logout();
    qc.removeQueries({ queryKey: ME_QUERY_KEY }); // 唯一缓存被清，全局同步
  };
}
```

**豁免**：`apps/web-admin/src/routes/auth/**`（登录页/注册页/忘记密码页）允许直接调 `authApi`，因为它们是登录态"建立者"而非消费者。

```tsx
// 豁免示例：登录页直接调 authApi.login
// apps/web-admin/src/routes/auth/login.tsx
import { authApi } from '@mb/api-sdk';
export function LoginPage() {
  const handleLogin = async (form: LoginForm) => { await authApi.login(form); }; // ✅ 豁免
  return <form onSubmit={handleLogin}>{/* ... */}</form>;
}
```

### 12.4 防御机制

```javascript
// .dependency-cruiser.cjs
module.exports = {
  forbidden: [{
    name: 'features-no-direct-auth-api', severity: 'error',
    from: { path: '^apps/web-admin/src/features' },
    to: { path: '^@mb/api-sdk/auth' },
    comment: '业务代码必须用 useCurrentUser hook，禁止直调 authApi（MUST NOT #4）',
  }],
  allowed: [
    { from: { path: '^apps/web-admin/src/routes/auth' }, to: { path: '^@mb/api-sdk/auth' } },
    { from: { path: '^packages/app-shell' }, to: { path: '^@mb/api-sdk/auth' } },
  ],
};
```

<!-- verify: cd client && pnpm depcruise -->

### 12.5 引用

- MUST NOT #4
- 详见 [05-app-shell.md §5 认证门面](./05-app-shell.md) + [08-contract-client.md §6 认证门面豁免](./08-contract-client.md)
- 后端对应：`CurrentUser` 门面（[backend/05-security.md](../backend/05-security.md) §6）

---

## 13. 元教训（来自 brainstorming 阶段的 memory 反思） [M0]

> 前面 12 条是"具体代码错误"，可以用工具拦截。本节的元教训是 brainstorming 阶段 AI 自己犯过的"思维方式问题"，工具拦不住，靠纪律性自检。
>
> 这些教训来自 2026-04-11 brainstorming 会话洋哥 3 次明确纠偏，已沉淀为 3 份 memory 文件：
>
> - `memory/feedback_first_principles_over_dogma.md`
> - `memory/feedback_consistency_over_local_optimum.md`
> - `memory/feedback_official_docs_as_starting_point.md`

### 13.1 被预设原则绑架

**反模式**：把"类型安全 / 单一职责 / DRY / YAGNI"等设计原则当作**起点**，把思考空间限制在"符合原则"的解里。

**brainstorming 实际犯的 3 个错**：

| # | 议题 | 被哪个原则绑架 | 当时的错误推荐 | 正确答案（第一性原理） |
|---|------|--------------|-------------|-----------------|
| 1 | 主题工程模型 | "类型安全 = 好" | C 方案：TS 源 → CSS 编译 | A 方案：纯 CSS Variables（视觉即反馈，不需要编译期保护）|
| 2 | 菜单 name 是否走 i18n | "MUST #6 所有文案走 i18n" 字面化 | 推荐 i18n key | 不走 i18n（数据库数据 ≠ 代码静态文案）|
| 3 | 菜单/权限模型 | "单一职责" 字面化 | 推荐 `sys_permission + sys_menu` 两表 | 双树架构（代码反映 vs 业务组织 是两个独立演化轴）|

**洋哥原话**：
> "你经常被一些预设的原则限制住……这反映出来两个问题：原则是不是设早了？原则是不是不够明确导致你随意泛化？"

**正确做法**：每次设计决策前先问 3 个本质问题，**再**用原则验证。

| 顺序 | 问题 |
|------|------|
| 1 | 这要解决什么**真实**问题？（不是抽象的"职责/复用/类型安全"）|
| 2 | **真实使用场景**下的约束是什么？（用户心智、运维习惯、代码演化方向、性能阈值）|
| 3 | 最直接满足约束的**最小方案**是什么？|
| 4 | 推导出方案后**再**用原则验证：符合 YAGNI 吗？DRY 吗？单一职责吗？|
| 5 | 如果原则和第一性原理冲突——**原则让步** |

**判断"原则被字面化"的信号**：引用某原则时说不清它的**前提条件**是什么 → 大概率被字面化；没有"真存在多职责 / 真有重复 / 真有风险"的具体证据就先引用了 → 噪声。

### 13.2 一致性大于局部优化

**反模式**：当提出"混合方案"（按模块/按阶段/按层/按历史/按规模分不同范式）时，多数情况是**两个方案都舍不得砍**的补丁思维。

**触发自检的信号**：

| 信号 | 例子 |
|------|------|
| "platform 用 A, business 用 B" | 后端 Flyway 命名：platform 用 V01-V08, business 用时间戳 |
| "M0 用 X, M4 用 Y" | "现在先用简单的，以后改成复杂的" |
| "前端 P, 后端 Q" | "前端方案 A，后端方案 B" |
| "老数据 M, 新数据 N" | "已有菜单走旧表，新建的走新表" |

**分界线审查**：这条分界线是**问题特性**决定的吗（HTTP vs WebSocket 本质不同）？还是**舍不得砍任何一个方案**？答案是后者时 → 砍一个，全用另一个。

**前端具体警示**：

| 反模式 | 一致性方案 |
|-------|---------|
| "L2 用 A 路由库，L4 用 B 路由库" | 全栈 TanStack Router |
| "桌面端用 A，移动端用 B" | 全用 Tailwind 响应式 + 同一套组件 |
| "新组件用 CVA，旧组件保留 className 拼接" | 全用 CVA |
| "L2 部分组件 import shadcn，部分自写" | 要么全 shadcn 复制，要么全自写 |

**和 ADR-0007 的关系**：ADR-0007 是"继承遗产时问原生哲学"，本元原则更基础——**无论是不是继承，都不要补丁式混合**。

### 13.3 第一性原理起点 = 官方文档

**反模式**：做任何技术决策的第一动作不是查官方文档，而是从 nxboot 或项目原则出发推导。

**禁止的决策起点**：

- ❌ "nxboot 是这么做的，看看怎么改造"
- ❌ "按照 meta-build 的 XX 原则，应该这样设计"
- ❌ "我记得 React/Tailwind/TanStack 通常这么写"
- ❌ 跳过查文档直接拍脑袋

**要求的决策起点**：

- ✅ "让我先查 TanStack Router 官方文档对这个问题的答案"
- ✅ "Tailwind 对 CSS Variables 的官方推荐方案是什么"

**洋哥原话**：
> "这种问题你要总是从第一性原理出发，优先看这个东西的官方用法和最佳实践是什么，而不是基于 nxboot 或者基于我们的一些原则。"

**前端具体警示**：

| 决策 | 错误起点（nxboot/惯性）| 正确起点（官方文档）|
|------|---------------------|-------------------|
| 路由库 | "Vue Router 是这样的" | TanStack Router 官方 quick start |
| 表单库 | "antd Form 习惯是 Form.Item placeholder" | React Hook Form + Zod 集成 |
| 表格 | "antd Table columns 配置" | TanStack Table v8 官方 |
| 主题 | "antd ConfigProvider 注入" | shadcn 官方 CSS Variables 文档 |

**标准流程**：① 查官方文档（context7/WebFetch/WebSearch）→ ② 呈现官方答案，对比"如果按 nxboot 会怎么做" → ③ 讨论是否有局部调整 → **禁止**跳过第一步。

### 13.4 从 nxboot 借用组件时先问原生范式

**反模式**：从 nxboot 复制组件代码到 meta-build 时，把 nxboot 用的库范式（antd/Vue/MyBatis-Plus 风格）一起带过来。

**和 13.1/13.3 的关系**：13.3 是起点（决策第一动作查文档），13.4 是触发点（已在借用遗产时再次确认"新技术栈原生范式"）。这是 ADR-0007 元方法论"继承遗产前先问原生哲学"的前端版。

**前端具体例子**：

| nxboot（antd/Vue 风格）| meta-build（shadcn 风格）|
|----------------------|-----------------------|
| `<Form.Item label="姓名" required>` | `<FormField name="username">` + 文案 props 显式传入 |
| `<Table columns={cols} dataSource={data} />` 配置式 | `<NxTable>` 组合式 + TanStack Table 抽象 |
| 全局 ConfigProvider + theme 对象 | `data-theme` 属性 + CSS Variables |
| 业务字段名走 antd locale 包 | 按业务模块 namespace 走 react-i18next |
| `Form.Item` 自带 errorMessage 显示 | `<FormMessage />` 子组件，使用方控制呈现 |

**判断信号**：

- 自己写的代码出现 nxboot/antd API 风格 → 立刻问"shadcn/TanStack 的官方写法是怎样"
- 组件 API 像 antd（配置对象 + 大量 props）→ 立刻问"shadcn 组合式 API 是怎样"
- 借用 nxboot 某个组件代码超过 30 行未做任何改动 → 可能是范式漂移信号

---

## 14. 反面教材到契约的映射总结 [M0]

| 反面教材 | 工具拦截 | 引用的硬约束 |
|---------|---------|-----------|
| §2 硬编码颜色 | Biome + stylelint + 主题完整性脚本 | MUST NOT #1 |
| §3 跨层反向 import | dependency-cruiser + pnpm workspace | MUST NOT #2 + #6 |
| §4 L2/L3 消费 i18n | Biome `no-restricted-imports` + Storybook | i1 决策 |
| §5 动态拼接 Tailwind | Tailwind v4 `@theme` 防线 + Biome lint | MUST NOT #8 |
| §6 数据库字段 i18n | 架构约定 + code review | MUST #6 边界 |
| §7 改 L2 硬编码品牌色 | stylelint 全 monorepo 生效 | MUST NOT #1 + 脚手架原则 |
| §8 单表 drift | 双树架构本身 + memory 锁定 | 双树架构决策 |
| §9 `.env.example` 漏声明 | `check-env-example.ts` CI | MUST #7 |
| §10 非扁平命名 | 主题完整性脚本 + stylelint | MUST NOT #7 |
| §11 routes 外路由 | TanStack Router 约定 + Biome `noRestrictedImports` | MUST NOT #5 |
| §12 直调 authApi | dependency-cruiser 子路径规则 | MUST NOT #4 |
| §13 元教训 | 思维纪律 + 自检清单 | 无（思维层） |

**核心信念**：每条具体反面教材都有工具拦截，把"正确的事"压低到机械可执行的层级。元教训没有工具拦截，需要每次决策时主动自检——这是 brainstorming 阶段交付物之外，AI 持续协作的隐性成本，必须显式记录。

---

[← 返回 README](./README.md)
