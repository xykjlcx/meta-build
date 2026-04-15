## 03 - L2 原子组件库 ui-primitives

> **关注点**：L2 `@mb/ui-primitives` 的隔离哲学、42 个原子组件清单、shadcn 式文案 props 约定、CVA variants 风格、Storybook 规范、L2 白名单依赖。
>
> L2 是 meta-build 千人千面的"骨架层"——上层永不直接 import Radix，所有底层 UI 库的更换由 L2 内部消化。

---

## 1. 决策结论 [M2]

### 1.1 一句话定位

`@mb/ui-primitives` 是 meta-build 前端的**底层 UI 库隔离层**，提供 42 个 shadcn 风格的原子组件（M2 shadcn/ui v4 升级后扩充），所有组件源码作为使用者资产存在，由使用者直接修改 `*.tsx` 文件完成定制（**不是**通过 theme override 或 props 注入样式）。

### 1.2 核心约定速查

| 项 | 决策 |
|---|---|
| 风格来源 | shadcn/ui 模式（源码持有，不依赖远端版本） |
| 底层库 | Radix UI 原语（无样式、无障碍支持完备） |
| 样式方案 | Tailwind CSS v4 + CVA（class-variance-authority）+ 语义 class（消费 L1 token） |
| 文案处理 | **零内部 i18n**——所有用户可见文案通过 props 传入（shadcn 模式） |
| 类型 | TypeScript strict + React 19 ref-as-prop + 完整泛型 |
| 测试 | Vitest + @testing-library/react |
| 文档 | Storybook 7+，每个 variant 一个 story |
| 包名 | `@mb/ui-primitives` |
| 发布 | **不发布到 npm**，作为脚手架源码直接 import |

### 1.3 milestone 状态

| 子任务 | milestone |
|---|---|
| 42 个原子组件最小可用版本 | [M2] |
| 全部组件 Storybook stories | [M2] |
| Vitest 单元测试覆盖 | [M2] |
| Visual Regression 快照 | [M6] |
| 第二变体（如 antd 风格） | v1.5+ |

---

## 2. L2 哲学：隔离底层 UI 库

### 2.1 为什么要 wrap Radix [M2]

直接让 L3 / L4 / L5 import `@radix-ui/react-dialog` 会导致三个问题：

1. **底层库锁定**：所有上层代码绑死 Radix API。将来想换 antd / Material UI / Ark UI 时，要改 200+ 处 import
2. **样式不一致**：每个使用者都要在调用点重复写 Tailwind class。100 个 `<Dialog>` 调用 = 100 个稍微不同的样式
3. **AI 认知负担**：让 AI 记住"`<Dialog.Root><Dialog.Trigger><Dialog.Portal><Dialog.Overlay><Dialog.Content>...`"的复杂组合，远不如让它写 `<Dialog open={...} onOpenChange={...}>`

L2 的存在就是把这三个问题在一个层级集中解决。

### 2.2 对上层屏蔽的承诺

| 上层 | 看见 | 看不见 |
|---|---|---|
| L3 `@mb/ui-patterns` | `import { Dialog, Button, Input } from '@mb/ui-primitives'` | `@radix-ui/*` 任何子包 |
| L4 `@mb/app-shell` | 同上 | 同上 |
| L5 `apps/web-admin` | 同上 | 同上 |

**硬约束**：L3 / L4 / L5 的 `import` 白名单中**没有** `@radix-ui/*`。由 dependency-cruiser + `no-restricted-imports` 在 CI 拦截。

### 2.3 使用者改 L2 的标准动作

shadcn 模式的精髓是 **使用者持有源码，直接修改 `*.tsx` 文件**。不是通过 theme override，不是通过传入样式 props，不是 fork npm 包。

```text
使用者要把 Button 的圆角改成 rounded-full：
1. 打开 client/packages/ui-primitives/src/button.tsx
2. 修改 buttonVariants 里的 base class，把 'rounded-md' 改成 'rounded-full'
3. 保存，热更新自动生效
4. 全站所有 Button 自动应用新圆角
```

**不要做**：
- 不要新增 `<Button rounded="full">` 的 prop（污染 API）
- 不要在调用点写 `<Button className="rounded-full">`（破坏一致性）
- 不要新建 `<RoundedButton>` 包装组件（破坏 SSR/组件树）

### 2.4 未来多变体扩展路径 [v1.5+]

v1 只交付一套 shadcn 风格的 L2。v1.5+ 如果出现"想要 antd 风格"的需求，扩展路径是 **新增同名 package 的并行变体**，**不是**在现有 L2 内部加 prop 切换：

```text
client/packages/
├── ui-primitives/                # 默认（shadcn 风格，导出 @mb/ui-primitives）
└── ui-primitives-antd/           # 可选（antd 风格，导出 @mb/ui-primitives）
                                    使用者通过 pnpm-workspace.yaml 切换
```

切换方式：

```yaml
# client/pnpm-workspace.yaml（使用者修改）
packages:
  - 'packages/ui-tokens'
  - 'packages/ui-primitives-antd'   # 替换默认的 ui-primitives
  - 'packages/ui-patterns'
  - 'packages/app-shell'
  - 'apps/*'
```

两个 package 的 `package.json` 都声明 `"name": "@mb/ui-primitives"`，但只能启用其中一个。这一切的前提是 **L3 / L4 / L5 只依赖 `@mb/ui-primitives` 的 export 接口**，不绑定任何变体的内部细节。

> v1 不实现第二变体，只在 API 设计阶段保证未来能拆。`L3` 测试用 mock `@mb/ui-primitives` 的 export，可以提前验证"L3 不绑定 Radix"。

---

## 3. 42 个原子组件清单

按职责分 4 类。每个组件 1-2 行说明 + 底层 Radix 原语来源。所有组件都遵循 §4 的 API 约定。

### 3.1 输入类（11 个）[M2]

| # | 组件 | 文件 | Radix 原语 | 职责 |
|---|---|---|---|---|
| 1 | `Button` | `button.tsx` | 无（原生 `<button>` + Slot） | 5 variants × 4 sizes，支持 `asChild` 多态 |
| 2 | `Input` | `input.tsx` | 无（原生 `<input>`） | 文本输入，支持 disabled / invalid 状态 |
| 3 | `Textarea` | `textarea.tsx` | 无（原生 `<textarea>`） | 多行输入 |
| 4 | `Label` | `label.tsx` | `@radix-ui/react-label` | 关联 `<input>` 的语义化标签 |
| 5 | `Checkbox` | `checkbox.tsx` | `@radix-ui/react-checkbox` | 单个勾选框，支持三态 |
| 6 | `RadioGroup` | `radio-group.tsx` | `@radix-ui/react-radio-group` | 单选组 |
| 7 | `Switch` | `switch.tsx` | `@radix-ui/react-switch` | 开关切换 |
| 8 | `Slider` | `slider.tsx` | `@radix-ui/react-slider` | 滑块，单值 / 区间值 |
| 9 | `Select` | `select.tsx` | `@radix-ui/react-select` | 下拉单选 |
| 10 | `Combobox` | `combobox.tsx` | `@radix-ui/react-popover` + `cmdk` | 搜索下拉（client 侧搜索，异步版在 L3 `ApiSelect`） |
| 11 | `DatePicker` | `date-picker.tsx` | `@radix-ui/react-popover` + `react-day-picker` | 单日期选择，支持范围在 L3 复合 |

### 3.2 反馈类（7 个）[M2]

| # | 组件 | 文件 | Radix 原语 | 职责 |
|---|---|---|---|---|
| 12 | `Dialog` | `dialog.tsx` | `@radix-ui/react-dialog` | 模态对话框（中心定位） |
| 13 | `AlertDialog` | `alert-dialog.tsx` | `@radix-ui/react-alert-dialog` | 强阻塞确认对话框（删除等不可撤销操作） |
| 14 | `Drawer` | `drawer.tsx` | `@radix-ui/react-dialog` + 自定义动画 | 侧边抽屉（左 / 右 / 上 / 下） |
| 15 | `Tooltip` | `tooltip.tsx` | `@radix-ui/react-tooltip` | 鼠标悬停提示 |
| 16 | `Popover` | `popover.tsx` | `@radix-ui/react-popover` | 浮层容器（不强制遮罩） |
| 17 | `Toast` | `toast.tsx` | `@radix-ui/react-toast` | 全局通知（配合 `useToast` hook） |
| 18 | `HoverCard` | `hover-card.tsx` | `@radix-ui/react-hover-card` | 悬停展开卡片（用户头像预览等） |

### 3.3 导航类（5 个）[M2]

| # | 组件 | 文件 | Radix 原语 | 职责 |
|---|---|---|---|---|
| 19 | `Tabs` | `tabs.tsx` | `@radix-ui/react-tabs` | 标签页切换 |
| 20 | `Breadcrumb` | `breadcrumb.tsx` | 无（语义化 `<nav>` + `<ol>`） | 面包屑导航 |
| 21 | `DropdownMenu` | `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | 下拉菜单（用户菜单等） |
| 22 | `NavigationMenu` | `navigation-menu.tsx` | `@radix-ui/react-navigation-menu` | 顶部导航菜单（多级展开） |
| 23 | `Command` | `command.tsx` | `cmdk` | 命令面板（Cmd+K 风格） |

### 3.4 展示类（7 个）[M2]

| # | 组件 | 文件 | Radix 原语 | 职责 |
|---|---|---|---|---|
| 24 | `Card` | `card.tsx` | 无（语义化 `<div>`） | 卡片容器（含 Header / Content / Footer 子组件） |
| 25 | `Badge` | `badge.tsx` | 无（语义化 `<span>`） | 状态标签（5 variants） |
| 26 | `Avatar` | `avatar.tsx` | `@radix-ui/react-avatar` | 头像（含 fallback） |
| 27 | `Separator` | `separator.tsx` | `@radix-ui/react-separator` | 分隔线（横 / 竖） |
| 28 | `Skeleton` | `skeleton.tsx` | 无（动画 `<div>`） | 骨架屏占位 |
| 29 | `Accordion` | `accordion.tsx` | `@radix-ui/react-accordion` | 折叠面板（FAQ 等） |
| 30 | `Table` | `table.tsx` | 无（语义化 `<table>`） | 表格容器（含 TableHeader / TableBody / TableRow / TableHead / TableCell 子组件），L3 NxTable 的底层原子 |

> **总计 42 个原子组件**，每个组件对应一个文件。`Card` / `Dialog` / `AlertDialog` / `Drawer` / `Table` 等会导出多个子组件（`Card` / `CardHeader` / `CardContent` / `CardFooter`），统一打包在同一文件内导出。文件清单与决策表保持 1:1。

### 3.5 不在 L2 范围

下列内容**不属于** L2，由其他层承担：

| 不在 L2 | 应该在哪里 | 原因 |
|---|---|---|
| `NxTable` / `NxForm` 等数据表格、表单 | L3 `@mb/ui-patterns` | 需要 wrap TanStack Table / RHF，业务复合 |
| `Header` / `Sidebar` / 全局布局 | L4 `@mb/app-shell` | 需要 wrap 路由、菜单、Provider |
| 业务字段输入（`OrderStatusSelect` / `CustomerPicker`） | L5 `apps/web-admin/src/features/**` | 业务语义，L2/L3 都不能持有 |
| Icon 库本身 | 直接用 `lucide-react` | L1/L2 共用，不需要再 wrap |

---

## 4. 组件 API 约定

### 4.1 CVA variants 风格 [M2]

每个有多种视觉变体的组件用 `class-variance-authority` 定义 `*Variants`。base class 写在第一个参数，variants / defaultVariants 写在配置对象。

```ts
// packages/ui-primitives/src/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
```

**约定细节**：

| 项 | 规则 |
|---|---|
| base class | 包含布局 + 默认间距 + focus / disabled / a11y class |
| variants 数量 | 单组件不超过 3 个 variant 维度（避免组合爆炸） |
| defaultVariants | **必须**显式声明（不允许靠 `undefined` 隐式回退） |
| className 合并 | 使用 `cn()` 工具（基于 `clsx` + `tailwind-merge`） |

### 4.2 禁止内部消费 i18n（shadcn 模式硬约束）[M2]

L2 组件**绝对不**调用 `useTranslation()` / `t()` / `i18next` 任何 API。所有用户可见文案通过 props 传入，使用方在调用前完成翻译。

**反面写法**：

```tsx
// 禁止：L2 内部消费 i18n
import { useTranslation } from 'react-i18next';

export const Dialog = (props: DialogProps) => {
  const { t } = useTranslation('common');
  return (
    <RadixDialog.Close>{t('close')}</RadixDialog.Close>
  );
};
```

为什么禁止：

1. **独立可用性**：L2 应该能在没有 i18n provider 的 Storybook / 单元测试 / 第三方项目里直接 import 用
2. **零依赖**：L2 的依赖白名单不包含 `i18next` / `react-i18next`
3. **shadcn 一致性**：shadcn/ui 的所有组件都是 prop 注入文案，不内部消费 i18n
4. **避免双层 t() 调用**：上层用 `t()` 翻译完，再传给 L2，L2 内部又调一次 `t()` 是双重耦合

**正确写法**：

```tsx
// L2 内部：文案是 props
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  closeLabel?: string;
  children: React.ReactNode;
}
```

```tsx
// 使用方（L4 或 L5）：t() 在调用点
import { useTranslation } from 'react-i18next';
import { Dialog } from '@mb/ui-primitives';

export const ConfirmDeletePanel = () => {
  const { t } = useTranslation('common');
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={t('confirm.title')}
      description={t('confirm.description')}
      closeLabel={t('common.close')}
    >
      {/* ... */}
    </Dialog>
  );
};
```

### 4.3 shadcn 式文案 props 命名 [M2]

L2 文案 props 命名遵循 shadcn 习惯，统一以 `Label` / `Text` / `Title` / `Description` 后缀结尾。

| 模式 | 用途 | 示例 |
|---|---|---|
| `closeLabel` | 关闭按钮的 ARIA 标签 / 显示文字 | `<Dialog closeLabel="关闭" />` |
| `confirmLabel` | 确认按钮文字 | `<AlertDialog confirmLabel="删除" />` |
| `cancelLabel` | 取消按钮文字 | `<AlertDialog cancelLabel="取消" />` |
| `title` | 标题（React.ReactNode，可以是字符串或元素） | `<Dialog title="确认" />` |
| `description` | 描述（React.ReactNode） | `<Dialog description={t('desc')} />` |
| `placeholder` | 输入提示 | `<Input placeholder="请输入" />` |
| `emptyText` | 空状态文字 | （L3 用，L2 通常不需要） |

**强制规则**：

- 文案 props 类型只能是 `string` 或 `React.ReactNode`
- 永远不能是 `i18nKey: string`（那会反向把 i18n 知识塞进 L2）
- 永远不能是默认中文（默认值只能是 `undefined`，让使用方必须传）

### 4.4 主题消费走 Tailwind 语义 class [M2]

所有视觉相关的 class 都消费 L1 token，**不允许**任何形式的硬编码颜色 / 圆角 / 间距：

| 允许 | 禁止 |
|---|---|
| `bg-primary` / `text-foreground` / `border-input` | `bg-blue-500` / `text-[#fff]` / `border-gray-200` |
| `rounded-md` / `rounded-lg`（消费 token） | `rounded-[4px]` / `rounded-[6px]` |
| `h-10 px-4` / `h-screen` | `h-[40px]` / `h-[100vh]` |
| `text-sm` / `text-base` | `text-[14px]` |
| `gap-2` / `space-y-4` | `gap-[8px]` |

**为什么**：硬编码 = 主题切换失效 = 千人千面承诺破产。L1 主题切换的全部依赖就是上层组件用语义 class。

由 `stylelint` + Biome lint 在 CI 拦截。详见 [10-quality-gates.md](./10-quality-gates.md)。

### 4.5 ref-as-prop（React 19 原生 ref 转发）[M2]

所有 L2 组件通过 `ref` prop 转发 ref（React 19 原生支持，不需要 `forwardRef`）。让 L3 / L4 / L5 能拿到底层 DOM 节点用于聚焦、滚动等场景：

```tsx
function Button({ className, variant, size, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
```

React 19 中函数组件直接接收 `ref` 作为 props，不再需要 `React.forwardRef` 包装或 `displayName` 声明。

### 4.6 多态：asChild 模式 [M2]

shadcn / Radix 的 `asChild` 模式让组件可以"借壳"：把内部 DOM 替换为子元素，但保留事件 / a11y / 样式行为。基于 `@radix-ui/react-slot` 实现。

```tsx
import { Slot } from '@radix-ui/react-slot';

// asChild 时渲染 Slot（把 children 的根元素提升为渲染输出），否则渲染原生 button
const Comp = asChild ? Slot : 'button';
return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
```

**典型使用场景**：让 `<Button>` 渲染成 `<a>` 链接（路由跳转）：

```tsx
import { Link } from '@tanstack/react-router';
import { Button } from '@mb/ui-primitives';

<Button asChild variant="outline">
  <Link to="/orders">查看订单</Link>
</Button>
```

**约定**：所有可能"包装其他元素"的 L2 组件（`Button` / `Badge` / `Card` 等）都暴露 `asChild?: boolean` prop。

---

## 5. Storybook 规范

### 5.1 每个 variant 一个 story [M2]

L2 的每个组件**至少**对应一个 `.stories.tsx` 文件，每个 variant 维度上的每个值至少一个 story：

```text
button.tsx 的 variants：
  variant: default | destructive | outline | secondary | ghost | link  (6 个)
  size:    default | sm | lg | icon                                     (4 个)
→ button.stories.tsx 至少 10 个 story（6 + 4，不要求笛卡尔积）
```

### 5.2 故事命名 Component/Variant [M2]

Storybook 的 `title` 字段统一使用 `Primitives/<Component>` 前缀，stories 的导出名按 PascalCase：

```tsx
// packages/ui-primitives/src/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '默认按钮',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '危险操作',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '次要按钮',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: '小按钮',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: '大按钮',
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': '设置',
    children: '⚙',
  },
};
```

**Storybook 的核心价值**：

1. **可视化 variant 矩阵**：让 AI / 设计师 / 使用者一眼看到所有变体
2. **变更可见**：改 L1 token 后切到 Storybook 立刻看到全部组件的视觉变化
3. **回归基础**：M6 集成 Visual Regression Testing 时直接复用 stories

### 5.3 控件文档 [M2]

`tags: ['autodocs']` 让 Storybook 7 自动从 TypeScript 接口生成 props 文档。L2 组件的 props 接口必须有 JSDoc 注释（中文）：

```tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * 是否将按钮渲染为子元素（多态模式）。
   * 启用后会用 Radix Slot 把内部 button 替换为 children 的根元素。
   */
  asChild?: boolean;
}
```

### 5.4 Visual Regression 占位 [M6]

M2 阶段只产出 stories，**不**集成视觉回归。Visual Regression 的方案在 M6 决定（候选：Chromatic / Storybook Test Runner + Playwright / Percy），届时直接复用 M2 的 stories 作为基线。

---

## 6. L2 白名单依赖 [M2]

`packages/ui-primitives/package.json` 的 `dependencies` 严格限定在以下白名单：

| 包 | 用途 | 必需 |
|---|---|---|
| `react` | UI 框架 | 是 |
| `react-dom` | DOM 渲染 | 是（peer） |
| `@radix-ui/react-*` | 底层无样式 UI 原语 | 是（按需引入对应子包） |
| `@radix-ui/react-slot` | `asChild` 多态 | 是 |
| `class-variance-authority` | CVA variants | 是 |
| `clsx` | className 拼接 | 是 |
| `tailwind-merge` | Tailwind class 去重合并 | 是 |
| `lucide-react` | 图标库 | 是 |
| `cmdk` | Command 面板 / Combobox 搜索 | 是 |
| `react-day-picker` | DatePicker 日历内核 | 是 |
| `@mb/ui-tokens` | L1 设计令牌（CSS variables + Tailwind v4 `@theme` 配置） | 是（peer） |

**禁止依赖（违反即 dependency-cruiser 报错）**：

| 禁止 | 原因 |
|---|---|
| `react-i18next` / `i18next` / `intl-*` | L2 不消费 i18n（§4.2） |
| `@tanstack/react-table` / `@tanstack/react-query` / `@tanstack/react-router` | 这些是 L3 / L4 的基础设施 |
| `react-hook-form` / `zod` | L3 表单基础设施 |
| `axios` / `ky` / `swr` | 数据层 / 通信层不应在 L2 |
| `zustand` / `redux` / `jotai` | 全局状态在 L4 |
| `@mb/ui-patterns` / `@mb/app-shell` / `@mb/api-sdk` | 反向 import |

`dependency-cruiser` 配置详见 [01-layer-structure.md](./01-layer-structure.md) §4.3。

---

## 7. 完整代码示例

### 7.1 Button [M2]

最完整的 L2 组件参考实现，覆盖 §4 所有约定：CVA variants / ref-as-prop / asChild / className 合并。

```tsx
// packages/ui-primitives/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind class，处理冲突 class 自动去重。
 * 用法：cn('px-2', condition && 'px-4') → 'px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

```tsx
// packages/ui-primitives/src/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 是否将按钮渲染为子元素（多态模式）。
   * 启用后会用 Radix Slot 把内部 button 替换为 children 的根元素。
   */
  asChild?: boolean;
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLButtonElement>;
}

function Button({ className, variant, size, asChild = false, type, ref, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      type={asChild ? undefined : type ?? 'button'}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

### 7.2 Dialog [M2]

体现"shadcn 式文案 props"和 "wrap Radix 多组件" 的复合示例：

```tsx
// packages/ui-primitives/src/dialog.tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from './lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Overlay>> }) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * 关闭按钮的 ARIA 标签（用于无障碍读屏）。
   * 必填 — L2 不假设默认语言，使用方需通过 t() 传入。
   */
  closeLabel: string;
}

function DialogContent({
  className,
  children,
  closeLabel,
  ref,
  ...props
}: DialogContentProps & { ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Content>> }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & { ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Title>> }) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & { ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Description>> }) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

### 7.3 入口 index.ts [M2]

L2 的 barrel export 集中在 `packages/ui-primitives/src/index.ts`，作为上层 import 的唯一入口：

```ts
// packages/ui-primitives/src/index.ts
export * from './lib/utils';

// 输入类
export * from './button';
export * from './input';
export * from './textarea';
export * from './label';
export * from './checkbox';
export * from './radio-group';
export * from './switch';
export * from './slider';
export * from './select';
export * from './combobox';
export * from './date-picker';

// 反馈类
export * from './dialog';
export * from './alert-dialog';
export * from './drawer';
export * from './tooltip';
export * from './popover';
export * from './toast';
export * from './hover-card';

// 导航类
export * from './tabs';
export * from './breadcrumb';
export * from './dropdown-menu';
export * from './navigation-menu';
export * from './command';

// 展示类
export * from './card';
export * from './badge';
export * from './avatar';
export * from './separator';
export * from './skeleton';
export * from './accordion';
```

---

## 8. 测试规范

### 8.1 单元测试 [M2]

每个 L2 组件**至少**有一个 `*.test.tsx` 文件，覆盖：

| 测试维度 | 范围 |
|---|---|
| 渲染 | 默认 props 渲染不报错 |
| variant 切换 | 每个 variant 渲染输出包含对应 class |
| ref 转发 | ref 能拿到底层 DOM |
| 受控状态 | onChange / onOpenChange 等回调正常触发 |
| a11y | role / aria-* 属性正确 |

```tsx
// packages/ui-primitives/src/button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('应该渲染默认 variant', () => {
    render(<Button>点我</Button>);
    const btn = screen.getByRole('button', { name: '点我' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('bg-primary');
  });

  it('应该应用 destructive variant', () => {
    render(<Button variant="destructive">删除</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-destructive');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>带 ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('应该响应 onClick', async () => {
    const onClick = vi.fn();
    const { container } = render(<Button onClick={onClick}>点击</Button>);
    container.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('asChild 模式应该渲染为子元素', () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: '链接按钮' });
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('bg-primary');
  });
});
```

### 8.2 测试 i18n 隔离 [M2]

L2 必须能在没有 i18n provider 的环境下渲染。专门一个测试文件验证：

```tsx
// packages/ui-primitives/src/__tests__/no-i18n-dependency.test.tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button, Dialog, DialogContent, DialogTrigger } from '../index';

describe('L2 i18n 隔离', () => {
  it('Button 在无 I18nextProvider 环境下应该正常渲染', () => {
    expect(() => render(<Button>测试</Button>)).not.toThrow();
  });

  it('Dialog 文案 props 应该按字面量渲染（不查 i18n）', () => {
    const { getByText } = render(
      <Dialog open>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭弹窗">
          <div>正文</div>
        </DialogContent>
      </Dialog>,
    );
    expect(getByText('打开')).toBeDefined();
  });
});
```

<!-- verify: cd client && pnpm -F @mb/ui-primitives test -->

---

## 9. 使用者扩展 L2 的工作流

### 9.1 修改现有原子组件 [使用者动作]

```text
场景：把 Button 默认圆角从 rounded-md 改成 rounded-full

1. 打开 client/packages/ui-primitives/src/button.tsx
2. 在 buttonVariants 的 base class 里把 'rounded-md' 改成 'rounded-full'
3. 同步修改 size.sm / size.lg / size.icon 中的 'rounded-md'
4. 保存
5. 运行 pnpm -F @mb/ui-primitives test 验证测试通过
6. 启动 pnpm -F @mb/ui-primitives storybook 视觉确认全部 variant
7. 完成 — 全站 Button 自动更新
```

### 9.2 添加新原子组件 [使用者动作]

```text
场景：新增一个 Pagination 原子组件

1. 在 client/packages/ui-primitives/src/ 下新建 pagination.tsx
2. 按 §4 的 API 约定实现（CVA + ref-as-prop + 文案 props 显式）
3. 在同目录新建 pagination.stories.tsx
4. 在同目录新建 pagination.test.tsx
5. 在 src/index.ts 末尾追加 export * from './pagination';
6. 运行 pnpm -F @mb/ui-primitives test && pnpm -F @mb/ui-primitives build
7. 上层（L3 / L4 / L5）即可 import { Pagination } from '@mb/ui-primitives'
```

### 9.3 改坏了的检测 [使用者保护]

| 改坏方式 | 检测机制 |
|---|---|
| 用了硬编码颜色 `bg-red-500` | `stylelint` + Biome 报错 |
| 加了 `import { useTranslation }` | dependency-cruiser 报错（白名单不含） |
| 用了 `react-hook-form` | dependency-cruiser 报错 |
| 改了 props 类型导致上层 TS 编译失败 | `pnpm -r tsc --noEmit` 报错 |
| 改了 variant 但没更新 stories | Storybook 文档自动更新（无错误，靠 review） |
| 漏声明 `ref` prop | TS 类型定义不接受 `ref` prop，使用方编译失败 |

---

## 10. 引用关系与下游

### 10.1 上游依赖

- L1 [`@mb/ui-tokens`](./02-ui-tokens-theme.md) — 提供 Tailwind v4 `@theme` 配置和 CSS variables，L2 通过语义 class 消费
- 第三方 Radix UI / class-variance-authority / clsx / tailwind-merge / lucide-react

### 10.2 下游消费方

- L3 [`@mb/ui-patterns`](./04-ui-patterns.md) — 在 L2 之上组合复杂业务组件（NxTable / NxForm 等）
- L4 [`@mb/app-shell`](./05-app-shell.md) — 在 L2 之上构建布局壳（Header / Sidebar）
- L5 `apps/web-admin` — 业务代码可直接 import L2（合法的跨级 import）

### 10.3 横向引用

- 主题切换的具体语义 token 清单见 [02-ui-tokens-theme.md §3](./02-ui-tokens-theme.md)
- 千人千面硬约束的整体表见 [10-quality-gates.md §2 / §3](./10-quality-gates.md)
- L2 的反面教材见 [11-antipatterns.md §3 / §7](./11-antipatterns.md)

<!-- verify: cd client && pnpm -F @mb/ui-primitives test && pnpm -F @mb/ui-primitives storybook:build -->

<!-- verify: cd client && pnpm -F @mb/ui-primitives tsc --noEmit -->

---

[← 返回 README](./README.md)
