## 04 - L3 业务组件库 ui-patterns

> **关注点**：L3 `@mb/ui-patterns` 的隔离哲学、7 个核心业务组件 props API、TanStack Table / RHF / Zod 隔离边界、不硬编码业务语义的硬约束、Storybook 规范、L3 白名单依赖。
>
> L3 是 L2 原子组件之上的"业务复合层"——隔离 TanStack Table / React Hook Form 等业务基础设施，但**不持有任何具体业务语义**（订单 / 客户 / 商品等业务词汇永不进 L3）。

---

## 1. 决策结论 [M3]

### 1.1 一句话定位

`@mb/ui-patterns` 是 meta-build 前端的**业务基础设施隔离层**，提供 7 个高频复合组件（NxTable / NxForm / NxFilter / NxDrawer / NxBar / NxLoading / ApiSelect），所有组件源码作为使用者资产存在，对上层屏蔽 TanStack Table / React Hook Form / Zod / date-fns 等业务基础设施 API。

### 1.2 核心约定速查

| 项 | 决策 |
|---|---|
| 命名前缀 | `Nx*`（meta-build 业务复合组件统一前缀，区分 L2 原子组件） |
| 底层基础设施 | TanStack Table v8 + React Hook Form + Zod + date-fns |
| 视觉来源 | 全部基于 L2 `@mb/ui-primitives` 组合，不直接引用 Radix |
| 文案处理 | **零内部 i18n**（继承 L2 约定），所有文案通过 props 传入 |
| 业务语义 | **零业务词汇**（订单 / 客户 / 商品等永远在 L5） |
| 类型 | TypeScript strict + 完整泛型（`<TData>` / `<TFormSchema>`） |
| 测试 | Vitest + @testing-library/react |
| 文档 | Storybook，每个组件 3-5 个 story（默认 / 空 / loading / error / 批量） |
| 包名 | `@mb/ui-patterns` |
| 发布 | **不发布到 npm**，作为脚手架源码直接 import |

### 1.3 milestone 状态

| 子任务 | milestone |
|---|---|
| 7 个核心组件最小可用版本 | [M3] |
| 全部组件 Storybook stories | [M3] |
| Vitest 单元测试覆盖 | [M3] |
| 组件 props 类型生成的 TS 文档 | [M3] |
| 第二变体（如 antd 风格 NxTable） | v1.5+ |

---

## 2. L3 哲学：隔离业务基础设施

### 2.1 为什么要 wrap TanStack Table / RHF / Zod [M3]

直接让 L5 业务代码 import `@tanstack/react-table` 会导致三个问题：

1. **基础设施锁定**：所有业务页面绑死 TanStack Table API。将来想换 ag-grid / Material React Table 时要改 50+ 处
2. **重复样板**：每个列表页都要重复写 100 行 useReactTable / columnDef / pagination state 配置
3. **AI 认知负担**：让 AI 在每个新页面写 `useReactTable({ data, columns, getCoreRowModel: ..., getPaginationRowModel: ..., onPaginationChange: ..., state: { pagination, sorting }, ... })`，远不如让它写 `<NxTable data={...} columns={...} pagination={...} />`

L3 把这三个问题在一个层级集中解决：使用者改 `nx-table.tsx` 的内部实现就能统一调整所有列表页的行为。

### 2.2 对上层屏蔽的承诺

| 上层 | 看见 | 看不见 |
|---|---|---|
| L4 `@mb/app-shell` | `import { NxTable, NxForm } from '@mb/ui-patterns'` | `@tanstack/react-table` / `react-hook-form` / `zod` |
| L5 `apps/web-admin` | 同上 + 列定义可以传 `ColumnDef<TData>` 类型 | 直接 import 业务基础设施被 dependency-cruiser 拦截 |

> **特例**：L5 在定义列结构时**允许** `import type { ColumnDef } from '@tanstack/react-table'`（类型 only）。运行时 API（`useReactTable` / `flexRender` 等）禁止 import。这是为了平衡"上层完全屏蔽"和"列定义类型推导"。详见 §6.4。

**硬约束**：L4 / L5 的运行时 import 白名单中**没有** `@tanstack/react-table` 的 hook 与函数。由 dependency-cruiser 拦截。

### 2.3 L3 API 稳定性承诺

L3 是**脚手架资产**，不是 npm 依赖库。这意味着：

- meta-build 不承诺 L3 的 API 跨版本兼容
- 使用者 fork 后默认不升级，需要时手动 cherry-pick
- 当使用者修改了自己仓库里的 L3 源码后，meta-build 上游的更新会与之冲突
- 这是 shadcn/ui 模式的核心权衡：**自由 > 兼容性**

如果上层（L4 / L5）需要新功能，正确的做法是 **先在 L3 加 prop / 子组件，再到上层使用**，而不是绕过 L3 直接调 TanStack Table。

### 2.4 未来多变体扩展路径 [v1.5+]

和 L2 一样，L3 未来如果出现"想要 antd 风格 NxTable"的需求，扩展路径是 **新增同名 package 的并行变体**：

```text
client/packages/
├── ui-patterns/                # 默认（基于 L2 + TanStack Table）
└── ui-patterns-antd/           # 可选（基于 antd Table）
                                  使用者通过 pnpm-workspace.yaml 切换
```

两个 package 都声明 `"name": "@mb/ui-patterns"`，并保证 props API 接口完全一致，使用方代码零修改即可切换。

> v1 不实现第二变体，但 props 接口设计阶段就要保证"可用其他基础设施实现等价功能"。例如 NxTable 的 props 不暴露任何 TanStack Table 特有的 API（不暴露 `getCoreRowModel` / `flexRender` 等）。

---

## 3. 7 个核心业务组件清单

| # | 组件 | 文件 | 基础设施 | 职责 |
|---|---|---|---|---|
| 1 | `NxTable` | `nx-table.tsx` | TanStack Table v8 | 数据表格：列定义 + 排序 + 分页 + 行选择 + 批量操作 + 空 / loading / error 三态 |
| 2 | `NxForm` | `nx-form.tsx` | RHF + Zod resolver | 声明式表单：字段配置 + Zod schema + 错误提示 + 提交回调 |
| 3 | `NxFilter` | `nx-filter.tsx` | URL state hook（可插拔） | 筛选器：URL 状态同步 + 多条件 AND / OR + reset 按钮 |
| 4 | `NxDrawer` | `nx-drawer.tsx` | L2 Drawer + RHF | 编辑抽屉：表单 + 确认 / 取消 + 脏检查（dirty form 离开提醒） |
| 5 | `NxBar` | `nx-bar.tsx` | 无（纯 React + L2） | 批量操作栏：固定底栏 + 选中数量显示 + 操作按钮集 |
| 6 | `NxLoading` | `nx-loading.tsx` | 无（纯 React + L2） | 加载状态容器：骨架屏 + 空状态 + 错误态 + 重试按钮（三态合一） |
| 7 | `ApiSelect` | `api-select.tsx` | TanStack Query 动态 import + L2 Combobox | 异步下拉：基于 `@mb/api-sdk` + 搜索 + 分页 + 缓存 |

### 3.1 不在 L3 范围

下列内容**不属于** L3，由其他层承担：

| 不在 L3 | 应该在哪里 | 原因 |
|---|---|---|
| `OrderTable` / `CustomerTable` | L5 `apps/web-admin/src/features/**` | 业务语义不进 L3 |
| `OrderStatusBadge` / `OrderStatusOptions` | L5 | 业务字典 |
| `useCurrentUser` / 全局状态 hook | L4 `@mb/app-shell` | 应用基础设施 |
| `requireAuth` 路由守卫 | L4 | 路由层 |
| 原子按钮 / 输入框 / 对话框 | L2 `@mb/ui-primitives` | 原子级 |

---

## 4. 不硬编码业务语义（L3 最强硬约束）[M3]

### 4.1 规则陈述

**L3 组件源码 `packages/ui-patterns/src/**/*.ts*` 中绝对不允许出现任何业务领域的语义词汇**：

| 禁止出现 | 原因 |
|---|---|
| `Order` / `OrderStatus` / `OrderType` | 订单是业务概念 |
| `Customer` / `CustomerLevel` / `CustomerTag` | 客户是业务概念 |
| `Product` / `Sku` / `Category` | 商品是业务概念 |
| 任何中文业务字段名（如 "订单号" "客户名" "下单时间"） | 业务字典 |
| 任何业务 API 路径（如 `/api/orders` / `/api/customers`） | 业务接口 |
| 默认中文文案（"暂无数据" "加载中" "操作成功"） | i18n 由使用方调用 |

**只允许出现**：通用 props 名（`dataSource` / `columns` / `value` / `onChange` / `loading` / `emptyText` / `errorText` / `size` / `page` 等）

### 4.2 反面写法

```tsx
// ❌ 错误：把业务语义塞进 L3
export interface NxTableProps {
  orderId?: string;                    // 不允许：业务字段
  showOrderStatus?: boolean;           // 不允许：业务概念
  defaultOrderColumns?: ColumnDef[];   // 不允许：业务默认值
}

// ❌ 错误：默认中文文案
export const NxLoading = ({ children }: Props) => {
  if (loading) return <div>加载中...</div>;  // 不允许：默认硬编码文案
  if (error) return <div>出错了，请重试</div>; // 不允许
};
```

### 4.3 正确写法

```tsx
// ✓ 正确：通用 props
export interface NxTableProps<TData> {
  data: TData[];                       // 通用泛型
  columns: ColumnDef<TData>[];         // 通用泛型
  pagination?: NxTablePagination;      // 通用 state
  emptyText?: React.ReactNode;         // 文案由调用方传
}

// ✓ 正确：文案 props 必填
export interface NxLoadingProps {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  loadingText: React.ReactNode;        // 必填，强迫调用方传
  errorText: React.ReactNode;          // 必填
  emptyText: React.ReactNode;          // 必填
  retryLabel?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}
```

### 4.4 使用方在 L5 注入业务语义

```tsx
// apps/web-admin/src/features/orders/order-table.tsx (L5)
import { useTranslation } from 'react-i18next';
import { NxTable, NxLoading } from '@mb/ui-patterns';
import type { Order } from '@mb/api-sdk';

import { useOrderColumns } from './use-order-columns';

export const OrderTable = () => {
  const { t } = useTranslation('order');
  const columns = useOrderColumns();
  const { data, isLoading, error } = useOrderListQuery();

  return (
    <NxLoading
      loading={isLoading}
      error={error}
      empty={!data?.records.length}
      loadingText={t('order.loading')}
      errorText={t('common.errorRetry')}
      emptyText={t('order.empty')}
    >
      <NxTable<Order>
        data={data?.records ?? []}
        columns={columns}
        emptyText={t('order.empty')}
      />
    </NxLoading>
  );
};
```

> 这是 L3 / L5 边界的范例：L5 持有 `Order` 类型 + `useOrderColumns()` + 全部业务文案；L3 只提供通用渲染容器。

由 dependency-cruiser + 自定义脚本扫描 `packages/ui-patterns/src/**/*.{ts,tsx}` 中的禁用词。详见 [10-quality-gates.md](./10-quality-gates.md)。

---

## 5. 组件 props API 设计

每个组件给出完整的 TypeScript 接口骨架（strict 模式可编译）。详细实现见 §10。

### 5.1 NxTable [M3]

```tsx
// packages/ui-patterns/src/nx-table.tsx
import type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';
import type * as React from 'react';

export interface NxTablePagination {
  page: number;           // 从 1 开始，与后端 PageResult 一致
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NxTableProps<TData> {
  /** 数据源（受控） */
  data: TData[];
  /** 列定义（受控） */
  columns: ColumnDef<TData, unknown>[];
  /** 行 ID 提取器（用于受控 rowSelection） */
  getRowId?: (row: TData, index: number) => string;
  /** 加载中状态（决定是否显示骨架屏） */
  loading?: boolean;
  /** 空数据文案（由调用方注入 i18n） */
  emptyText?: React.ReactNode;
  /** 行点击回调 */
  onRowClick?: (row: TData) => void;
  /** 分页（传 undefined 表示禁用分页） */
  pagination?: NxTablePagination;
  /** 分页变更回调 */
  onPaginationChange?: (next: NxTablePagination) => void;
  /** 排序状态（受控） */
  sorting?: SortingState;
  /** 排序变更回调 */
  onSortingChange?: (next: SortingState) => void;
  /** 行选择状态（受控） */
  rowSelection?: RowSelectionState;
  /** 行选择变更回调 */
  onRowSelectionChange?: (next: RowSelectionState) => void;
  /** 批量操作栏的渲染插槽（在选中行时显示，建议传入 NxBar） */
  batchActions?: React.ReactNode;
  /** 表格容器额外 className */
  className?: string;
}
```

### 5.2 NxForm [M3]

```tsx
// packages/ui-patterns/src/nx-form.tsx
import type { DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form';
import type { ZodSchema } from 'zod';
import type * as React from 'react';

export interface NxFormProps<TFormValues extends FieldValues> {
  /** Zod 校验 schema（决定字段类型 + 校验规则） */
  schema: ZodSchema<TFormValues>;
  /** 默认值 */
  defaultValues?: DefaultValues<TFormValues>;
  /** 提交回调 */
  onSubmit: SubmitHandler<TFormValues>;
  /** 表单子元素（通常是 NxFormField 组件） */
  children: React.ReactNode;
  /** 提交按钮文案（必填） */
  submitLabel: React.ReactNode;
  /** 取消按钮文案（可选） */
  cancelLabel?: React.ReactNode;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否在加载中（提交时禁用按钮） */
  loading?: boolean;
  /** 表单容器额外 className */
  className?: string;
}

export interface NxFormFieldProps {
  /** 字段名（必须是 schema 已声明的 key） */
  name: string;
  /** 字段标签 */
  label: React.ReactNode;
  /** 字段描述 */
  description?: React.ReactNode;
  /** 输入控件（通常是 L2 的 Input / Select / Checkbox 等） */
  children: React.ReactElement;
  /** 是否必填（仅用于显示星号，校验由 schema 决定） */
  required?: boolean;
}
```

### 5.3 NxFilter [M3]

```tsx
// packages/ui-patterns/src/nx-filter.tsx
import type * as React from 'react';

export type NxFilterValue = Record<string, unknown>;

export interface NxFilterProps<TFilter extends NxFilterValue> {
  /** 当前筛选值（受控，通常来自 URL search params） */
  value: TFilter;
  /** 筛选变更回调（应同步到 URL） */
  onChange: (next: TFilter) => void;
  /** 重置按钮文案（必填） */
  resetLabel: React.ReactNode;
  /** 应用按钮文案（必填） */
  applyLabel: React.ReactNode;
  /** 筛选字段子元素（通常是 NxFilterField） */
  children: React.ReactNode;
  /** 容器额外 className */
  className?: string;
}

export interface NxFilterFieldProps {
  /** 字段名（必须存在于 NxFilterProps.value） */
  name: string;
  /** 字段标签 */
  label: React.ReactNode;
  /** 输入控件 */
  children: React.ReactElement;
}
```

### 5.4 NxDrawer [M3]

```tsx
// packages/ui-patterns/src/nx-drawer.tsx
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import type { ZodSchema } from 'zod';
import type * as React from 'react';

export interface NxDrawerProps<TFormValues extends FieldValues> {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变更回调 */
  onOpenChange: (open: boolean) => void;
  /** 标题 */
  title: React.ReactNode;
  /** 描述 */
  description?: React.ReactNode;
  /** 抽屉位置 */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** 表单 schema（如不传则不渲染表单） */
  schema?: ZodSchema<TFormValues>;
  /** 默认值 */
  defaultValues?: Partial<TFormValues>;
  /** 提交回调 */
  onSubmit?: SubmitHandler<TFormValues>;
  /** 提交按钮文案 */
  submitLabel?: React.ReactNode;
  /** 取消按钮文案 */
  cancelLabel?: React.ReactNode;
  /** 关闭按钮 ARIA 标签（透传到 L2 Drawer） */
  closeLabel: string;
  /** 脏检查关闭确认文案（dirty form 时弹出） */
  dirtyConfirmText?: React.ReactNode;
  /** 抽屉内容（在表单 form 子元素中渲染） */
  children: React.ReactNode;
}
```

### 5.5 NxBar [M3]

```tsx
// packages/ui-patterns/src/nx-bar.tsx
import type * as React from 'react';

export interface NxBarProps {
  /** 选中的行数 */
  selectedCount: number;
  /** 选中数量显示模板（必须包含 {count} 占位符） */
  selectedTemplate: string;
  /** 操作按钮集（建议传 L2 Button） */
  actions: React.ReactNode;
  /** 清除选中回调 */
  onClear?: () => void;
  /** 清除按钮文案 */
  clearLabel?: React.ReactNode;
  /** 是否固定在底部 */
  fixed?: boolean;
  /** 容器额外 className */
  className?: string;
}
```

### 5.6 NxLoading [M3]

```tsx
// packages/ui-patterns/src/nx-loading.tsx
import type * as React from 'react';

export interface NxLoadingProps {
  /** 加载中状态 */
  loading?: boolean;
  /** 错误对象（任意类型，由调用方决定） */
  error?: unknown;
  /** 是否为空数据 */
  empty?: boolean;
  /** 加载中文案（必填） */
  loadingText: React.ReactNode;
  /** 错误文案（必填） */
  errorText: React.ReactNode;
  /** 空数据文案（必填） */
  emptyText: React.ReactNode;
  /** 重试按钮文案 */
  retryLabel?: React.ReactNode;
  /** 重试回调 */
  onRetry?: () => void;
  /** 加载样式类型 */
  variant?: 'skeleton' | 'spinner';
  /** 默认子元素（loading / error / empty 都为 false 时显示） */
  children?: React.ReactNode;
}
```

### 5.7 ApiSelect [M3]

```tsx
// packages/ui-patterns/src/api-select.tsx
import type * as React from 'react';

export interface ApiSelectOption<TValue = string> {
  value: TValue;
  label: React.ReactNode;
  /** 用于搜索匹配的纯文本（避免 ReactNode label 无法搜索） */
  searchText?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface ApiSelectFetchParams {
  /** 搜索关键字 */
  keyword: string;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  size: number;
}

export interface ApiSelectFetchResult<TValue = string> {
  /** 选项列表 */
  options: ApiSelectOption<TValue>[];
  /** 总数（用于判断是否还有下一页） */
  totalElements: number;
}

export interface ApiSelectProps<TValue = string> {
  /** 当前值 */
  value: TValue | null;
  /** 值变更回调 */
  onChange: (next: TValue | null) => void;
  /** 数据获取函数（由调用方注入，通常基于 @mb/api-sdk） */
  fetcher: (params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult<TValue>>;
  /** 占位符 */
  placeholder?: React.ReactNode;
  /** 加载中文案 */
  loadingText: React.ReactNode;
  /** 空状态文案 */
  emptyText: React.ReactNode;
  /** 每页数量 */
  size?: number;
  /** debounce 间隔（毫秒） */
  debounceMs?: number;
  /** 缓存 key（同 key 的请求会缓存） */
  cacheKey?: string;
  /** 是否禁用 */
  disabled?: boolean;
}
```

> **注意 ApiSelect 的 fetcher 设计**：L3 不直接 import `@mb/api-sdk`，而是通过 props 注入 fetcher 函数。这保证了 L3 对 `@mb/api-sdk` 零依赖（业务接口在 L5 / L4 注入），同时保留了"异步下拉"的通用能力。

---

## 6. L3 白名单依赖 [M3]

`packages/ui-patterns/package.json` 的 `dependencies` 严格限定在以下白名单：

| 包 | 用途 | 必需 |
|---|---|---|
| `react` | UI 框架 | 是 |
| `react-dom` | DOM 渲染 | 是（peer） |
| `@mb/ui-tokens` | L1 设计令牌 | 是（peer） |
| `@mb/ui-primitives` | L2 原子组件 | 是（peer） |
| `@tanstack/react-table` | 数据表格基础设施 | 是 |
| `react-hook-form` | 表单基础设施 | 是 |
| `@hookform/resolvers` | RHF 与 Zod 桥接 | 是 |
| `zod` | 校验 schema | 是 |
| `date-fns` | 日期工具 | 是 |
| `clsx` | className 拼接（继承自 L2） | 是 |
| `tailwind-merge` | Tailwind class 去重（继承自 L2） | 是 |

### 6.1 禁止依赖（违反即 dependency-cruiser 报错）

| 禁止 | 原因 |
|---|---|
| `react-i18next` / `i18next` | L3 不消费 i18n（继承 L2 约定） |
| `@tanstack/react-router` | 路由是 L4 关注点 |
| `@tanstack/react-query` | 全局缓存是 L4 关注点 |
| `axios` / `ky` / `fetch` 直接调用 | 网络请求由 L5 通过 fetcher 注入 |
| `zustand` / `redux` / `jotai` | 全局状态在 L4 |
| `@mb/api-sdk` | 业务契约不进 L3（fetcher 由调用方注入） |
| `@mb/app-shell` | 反向 import |
| `@radix-ui/*` | 必须经过 L2 |

### 6.2 例外：L5 允许 import 类型

L5 业务代码定义列结构时**允许** `import type { ColumnDef, Row, Cell } from '@tanstack/react-table'`（**只允许 type-only import**）。这是为了让 L5 能拿到精确的列定义类型推导。

dependency-cruiser 的规则：

```text
{
  name: 'no-runtime-tanstack-table-in-l5',
  severity: 'error',
  from: { path: '^apps/web-admin/src/' },
  to: {
    path: '@tanstack/react-table',
    dependencyTypes: ['npm', 'npm-no-pkg'],
  },
  // 允许 type-only import（dependencyTypes: ['type-only'] 被排除）
}
```

详见 [01-layer-structure.md §4.3](./01-layer-structure.md)。

### 6.3 L5 完全禁止的运行时调用

L5 不允许直接 `import { useReactTable, flexRender } from '@tanstack/react-table'`（运行时 hook / 函数）。所有需要使用 useReactTable 的地方必须通过 NxTable。

### 6.4 类型 only import 的强制机制

由 Biome 的 `useImportType` 规则在 L5 强制 `import type` 写法，结合 dependency-cruiser 的 `dependencyTypes: ['type-only']` 排除规则形成双保险。

---

## 7. Storybook 规范

### 7.1 每个组件 3-5 个故事 [M3]

L3 组件的 Storybook 比 L2 更注重"状态组合"，每个组件至少覆盖以下场景：

| Story 名 | 场景 |
|---|---|
| `Default` | 默认数据，正常状态 |
| `Loading` | 加载中（骨架屏 / spinner） |
| `Empty` | 空数据 |
| `Error` | 错误态（带重试按钮） |
| `WithBatchActions` | 启用批量操作（仅 NxTable） |
| `Disabled` | 禁用状态（仅适用组件） |

### 7.2 故事命名 Patterns/Component [M3]

```tsx
// packages/ui-patterns/src/nx-table.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';

import { NxTable } from './nx-table';

interface DemoRow {
  id: string;
  name: string;
  age: number;
}

const demoColumns: ColumnDef<DemoRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'age', header: '年龄' },
];

const demoData: DemoRow[] = [
  { id: '1', name: '张三', age: 28 },
  { id: '2', name: '李四', age: 32 },
  { id: '3', name: '王五', age: 24 },
];

const meta = {
  title: 'Patterns/NxTable',
  component: NxTable<DemoRow>,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof NxTable<DemoRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: demoData,
    columns: demoColumns,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns: demoColumns,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: demoColumns,
    emptyText: '暂无数据（仅 storybook 演示，实际由调用方传入）',
  },
};

export const WithPagination: Story = {
  args: {
    data: demoData,
    columns: demoColumns,
    pagination: { page: 1, size: 10, totalElements: 100, totalPages: 10 },
    onPaginationChange: () => {},
  },
};

export const WithRowSelection: Story = {
  args: {
    data: demoData,
    columns: demoColumns,
    rowSelection: { '1': true },
    onRowSelectionChange: () => {},
  },
};
```

### 7.3 Storybook 内的 i18n 注意 [M3]

L3 组件不消费 i18n（§4.1），但 stories 演示时**允许**使用中文字面量（仅为可视化展示）。这是 stories 文件的特例，不影响组件源码的硬约束。

---

## 8. 测试规范

### 8.1 单元测试覆盖范围 [M3]

每个 L3 组件至少覆盖：

| 测试维度 | 范围 |
|---|---|
| 默认渲染 | 不报错 |
| 受控状态 | onChange / onPaginationChange 等回调正常触发 |
| 空 / loading / error 三态 | NxLoading 三态切换正确 |
| 行选择 | NxTable 选中状态正确反映 |
| 表单校验 | NxForm 错误消息正确显示 |
| 业务语义扫描 | 自定义脚本扫描源码不含禁用词 |

### 8.2 业务语义扫描 [M3]

专门一个测试文件确保 L3 源码不含业务词汇：

```ts
// packages/ui-patterns/scripts/scan-business-words.test.ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_WORDS = [
  'Order',
  'Customer',
  'Product',
  'Sku',
  '订单',
  '客户',
  '商品',
];

const SOURCE_DIR = path.resolve(__dirname, '../src');

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      // 排除测试和 stories
      if (!entry.name.includes('.test.') && !entry.name.includes('.stories.')) {
        files.push(full);
      }
    }
  }
  return files;
}

describe('L3 业务语义扫描', () => {
  it('源码不应包含业务词汇', async () => {
    const files = await walk(SOURCE_DIR);
    const violations: { file: string; word: string }[] = [];
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      for (const word of FORBIDDEN_WORDS) {
        if (content.includes(word)) {
          violations.push({ file, word });
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
```

<!-- verify: cd client && pnpm -F @mb/ui-patterns test -->

---

## 9. 使用者扩展 L3 的工作流

### 9.1 修改现有业务组件 [使用者动作]

```text
场景：把 NxTable 的默认 size 从 10 改成 20

1. 打开 client/packages/ui-patterns/src/nx-table.tsx
2. 找到 useReactTable 的 initialState.pagination
3. 修改 size: 10 → size: 20
4. 运行 pnpm -F @mb/ui-patterns test
5. 启动 pnpm -F @mb/ui-patterns storybook 验证
6. 全站 NxTable 默认 size 自动变化（除非调用方显式传 pagination）
```

### 9.2 添加新业务组件 [使用者动作]

```text
场景：新增一个 NxTimeline 组件（时间线展示）

1. 在 client/packages/ui-patterns/src/ 下新建 nx-timeline.tsx
2. 按 §5 的接口约定设计 props（不含业务语义）
3. 新建 nx-timeline.stories.tsx（至少 3 个 story）
4. 新建 nx-timeline.test.tsx
5. 在 src/index.ts 末尾追加 export * from './nx-timeline'
6. 运行 pnpm -F @mb/ui-patterns test && pnpm -F @mb/ui-patterns build
7. L4 / L5 即可 import { NxTimeline } from '@mb/ui-patterns'
```

### 9.3 改坏了的检测 [使用者保护]

| 改坏方式 | 检测机制 |
|---|---|
| 在 L3 源码引入 `Order` 等业务词 | §8.2 业务语义扫描脚本失败 |
| import 了 `@mb/api-sdk` | dependency-cruiser 报错 |
| import 了 `react-i18next` | dependency-cruiser 报错 |
| 直接 import `@radix-ui/*` | dependency-cruiser 报错（必须经过 L2） |
| 改了 props 类型导致 L4/L5 编译失败 | `pnpm -r tsc --noEmit` 报错 |
| 漏了 `loadingText` 等必填文案 prop | TS strict 报错（required prop 缺失） |
| 用了硬编码颜色 / 中文默认文案 | stylelint + 业务语义扫描双保险 |

---

## 10. 完整代码示例：NxTable [M3]

体现 L3 wrap TanStack Table 的完整实现，覆盖：列定义 + 分页 + 排序 + 行选择 + loading / empty 三态 + 批量操作槽位。

```tsx
// packages/ui-patterns/src/nx-table.tsx
import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Skeleton,
  cn,
} from '@mb/ui-primitives';

export interface NxTablePagination {
  page: number;           // 从 1 开始，与后端 PageResult 一致
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NxTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  loading?: boolean;
  emptyText?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  pagination?: NxTablePagination;
  onPaginationChange?: (next: NxTablePagination) => void;
  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (next: RowSelectionState) => void;
  batchActions?: React.ReactNode;
  className?: string;
}

function resolveUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(prev) : updater;
}

export function NxTable<TData>(props: NxTableProps<TData>): React.JSX.Element {
  const {
    data,
    columns,
    getRowId,
    loading = false,
    emptyText,
    onRowClick,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    rowSelection,
    onRowSelectionChange,
    batchActions,
    className,
  } = props;

  // NxTablePagination.page 从 1 开始，TanStack Table 的 pageIndex 从 0 开始
  const tablePagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: (pagination?.page ?? 1) - 1,
      pageSize: pagination?.size ?? 10,
    }),
    [pagination?.page, pagination?.size],
  );

  const table = useReactTable<TData>({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: sorting ? getSortedRowModel() : undefined,
    manualPagination: pagination !== undefined,
    pageCount: pagination
      ? pagination.totalPages
      : undefined,
    state: {
      pagination: tablePagination,
      sorting: sorting ?? [],
      rowSelection: rowSelection ?? {},
    },
    onPaginationChange: (updater) => {
      const next = resolveUpdater(updater, tablePagination);
      // TanStack 内部 pageIndex(0-based) → NxTablePagination.page(1-based)
      onPaginationChange?.({
        page: next.pageIndex + 1,
        size: next.pageSize,
        totalElements: pagination?.totalElements ?? 0,
        totalPages: pagination?.totalPages ?? 1,
      });
    },
    onSortingChange: (updater) => {
      const next = resolveUpdater(updater, sorting ?? []);
      onSortingChange?.(next);
    },
    onRowSelectionChange: (updater) => {
      const next = resolveUpdater(updater, rowSelection ?? {});
      onRowSelectionChange?.(next);
    },
    enableRowSelection: rowSelection !== undefined,
  });

  const rowModel = table.getRowModel();
  const isEmpty = !loading && rowModel.rows.length === 0;
  const selectedCount = Object.keys(rowSelection ?? {}).filter((k) => rowSelection?.[k]).length;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {columns.map((_col, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rowModel.rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {batchActions && selectedCount > 0 ? <div>{batchActions}</div> : null}

      {pagination ? (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>
            {(pagination.page - 1) * pagination.size + 1}-
            {Math.min(pagination.page * pagination.size, pagination.totalElements)} /{' '}
            {pagination.totalElements}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() =>
              onPaginationChange?.({
                page: pagination.page - 1,
                size: pagination.size,
                totalElements: pagination.totalElements,
                totalPages: pagination.totalPages,
              })
            }
            aria-label="prev"
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              onPaginationChange?.({
                page: pagination.page + 1,
                size: pagination.size,
                totalElements: pagination.totalElements,
                totalPages: pagination.totalPages,
              })
            }
            aria-label="next"
          >
            ›
          </Button>
        </div>
      ) : null}
    </div>
  );
}
```

> 上面 import 中的 `Table` / `TableHead` / `TableBody` / `TableRow` / `TableCell` / `TableHeader` 由 L2 `@mb/ui-primitives` 提供（属于 §3.4 展示类的扩展，作为 `Card` 同类 wrapper 内的 `table.tsx` 输出）。在 M2 实现 L2 时一并交付。

---

## 11. 完整代码示例：NxLoading [M3]

体现 L3 "三态合一" 容器组件的最简实现：

```tsx
// packages/ui-patterns/src/nx-loading.tsx
import * as React from 'react';
import { Button, Skeleton, cn } from '@mb/ui-primitives';

export interface NxLoadingProps {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  loadingText: React.ReactNode;
  errorText: React.ReactNode;
  emptyText: React.ReactNode;
  retryLabel?: React.ReactNode;
  onRetry?: () => void;
  variant?: 'skeleton' | 'spinner';
  children?: React.ReactNode;
  className?: string;
}

export function NxLoading(props: NxLoadingProps): React.JSX.Element {
  const {
    loading = false,
    error,
    empty = false,
    loadingText,
    errorText,
    emptyText,
    retryLabel,
    onRetry,
    variant = 'skeleton',
    children,
    className,
  } = props;

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn('flex flex-col gap-2 p-4', className)}
      >
        {variant === 'skeleton' ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{loadingText}</span>
        )}
        <span className="sr-only">{loadingText}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className={cn('flex flex-col items-center gap-3 p-6 text-center', className)}
      >
        <div className="text-sm text-destructive">{errorText}</div>
        {onRetry && retryLabel ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={cn('flex flex-col items-center gap-2 p-6 text-center', className)}>
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 12. 引用关系与下游

### 12.1 上游依赖

- L1 [`@mb/ui-tokens`](./02-ui-tokens-theme.md) — 间接依赖（通过 L2 消费）
- L2 [`@mb/ui-primitives`](./03-ui-primitives.md) — 所有视觉元素的来源
- 第三方：TanStack Table v8 / React Hook Form / Zod / date-fns

### 12.2 下游消费方

- L4 [`@mb/app-shell`](./05-app-shell.md) — 在 NxTable / NxForm 之上构建运维 UI（菜单管理等）
- L5 `apps/web-admin` — 业务页面通过 L3 组件 + L5 业务字段实现具体功能

### 12.3 横向引用

- 业务语义扫描脚本规则见 [10-quality-gates.md §4.10](./10-quality-gates.md)
- L3 反面教材见 [11-antipatterns.md §6 / §7](./11-antipatterns.md)
- 详细 L5 使用示例（订单列表的全链路）见 [06-routing-and-data.md §7](./06-routing-and-data.md)

<!-- verify: cd client && pnpm -F @mb/ui-patterns test && pnpm -F @mb/ui-patterns storybook:build -->

<!-- verify: cd client && pnpm -F @mb/ui-patterns tsc --noEmit -->

---

[← 返回 README](./README.md)
