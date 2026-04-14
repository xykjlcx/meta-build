# M2 补充交接：shadcn/ui v4 升级 + 生态能力

> M2 合并 main 后的第二轮大调整。M3 session 必读，读完后 `git merge main` 拿代码并更新计划。

---

## 一、L2 组件已升级为 shadcn/ui v4 原版

M2 初版是 AI 从零手写的 30 个组件，视觉效果不如 shadcn 官网。已做整体替换：从 shadcn/ui GitHub v4 registry 拉取原版源码，替换 28 个组件。

### 依赖变更

| 变更 | 说明 |
|------|------|
| 19 个 `@radix-ui/react-*` 分包 | 全部移除 |
| `radix-ui` 统一包 | 新增，替代上述分包 |
| `sonner` | 新增，替代 Radix Toast |
| `@radix-ui/react-toast` | 已移除 |

### 组件变更明细

| 类别 | 组件 | 处理方式 |
|------|------|---------|
| 替换为 shadcn 原版 | Button, Input, Textarea, Label, Checkbox, RadioGroup, Switch, Slider, Select, Dialog, AlertDialog, Tooltip, Popover, HoverCard, Tabs, Breadcrumb, DropdownMenu, NavigationMenu, Command, Card, Badge, Avatar, Separator, Skeleton, Accordion, Table | 26 个，从 GitHub registry 拉取 |
| 新增 | Calendar（shadcn 独立日历组件）、Sonner（替代 Toast） | 2 个 |
| 保留自有实现 | Combobox（cmdk 方案，shadcn 用 @base-ui/react 我们不跟）、DatePicker（基于 Calendar 组合）、Drawer（Dialog-based，shadcn 用 vaul 我们不跟） | 3 个，仅更新 radix-ui import 路径 |
| 已删除 | toast.tsx、use-toast.ts | 被 Sonner 替代 |

### API 变更（影响 M3 消费代码）

| 组件 | 旧 API | 新 API |
|------|--------|--------|
| Dialog | `closeLabel: string` prop | `showCloseButton: boolean` |
| Badge | 5 variants（含 success） | success 移除，新增 ghost + link |
| Button | 4 sizes（default/sm/lg/icon） | 新增 xs/icon-xs/icon-sm/icon-lg |
| Button | 默认高度 h-10 | 改为 h-9 |
| Toast | `import { useToast, Toaster } from '@mb/ui-primitives'` | 删除。改用 `import { toast } from 'sonner'` + `import { Toaster } from '@mb/ui-primitives'` |
| Tooltip | bg-popover/text-popover-foreground | 反转为 bg-foreground/text-background |
| 所有组件 | 无 data-slot | 全部新增 `data-slot` 属性 |

---

## 二、已验证的技术结论

### 主题切换：正常工作

实测 `@theme`（非 inline）+ `[data-theme='dark']` CSS 变量覆盖方案：

- 切换 `data-theme="dark"` 后，`--color-background` 从 `oklch(1 0 0)` → `oklch(0.145 0 0)` ✓
- body 背景、卡片、输入框、按钮颜色全部正确反转 ✓
- 不需要改 `@theme inline`，不需要改双层变量桥接

### 质量门禁：全绿

197 tests 通过，7 个质量门禁（check:types / check:theme / test / lint / lint:css / build / check:env）全部通过。

---

## 三、shadcn 生态能力（M3 应利用）

### 1. 创建 components.json（P1）

shadcn 的 CLI、Claude Code Skills、MCP server 全部依赖此文件。建议在 `client/packages/ui-primitives/` 创建：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/storybook.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@mb/ui-primitives",
    "utils": "@mb/ui-primitives/lib/utils"
  }
}
```

### 2. 安装 shadcn Claude Code skill（P1）

```bash
pnpm dlx skills add shadcn/ui
```

安装后 Claude Code 自动检测 `components.json`，生成代码时知道项目框架、Tailwind 版本、别名配置。

### 3. 补 sidebar-* 8 个 token（P1，做 Sidebar 前必须）

shadcn 的 Sidebar 组件依赖这 8 个 CSS 变量：

```
--color-sidebar / --color-sidebar-foreground
--color-sidebar-primary / --color-sidebar-primary-foreground
--color-sidebar-accent / --color-sidebar-accent-foreground
--color-sidebar-border
--color-sidebar-ring
```

需要：
- 3 套主题 CSS 各加 8 个变量
- `tailwind-theme.css` 的 `@theme` 块加 8 个映射
- `TOTAL_TOKENS` 常量 46 → 54
- 校验脚本自动适应（已从 registry 派生，不需要手改数字）

### 4. shadcn CLI 常用命令

```bash
# 查看组件文档（直接拉到上下文）
pnpm dlx shadcn@latest docs sidebar

# 预览组件生成内容（不写文件）
pnpm dlx shadcn@latest add sidebar --dry-run

# 对比本地组件和 shadcn 最新版差异
pnpm dlx shadcn@latest diff button

# Monorepo 指定子包
pnpm dlx shadcn@latest add sheet --cwd packages/ui-primitives
```

### 5. data-slot 属性

所有 L2 组件已有 `data-slot` 标记。M3 的 L3 组件包裹 L2 时可以用 CSS 属性选择器精确覆盖：

```css
[data-slot="trigger"] { /* 样式覆盖 */ }
```

### 6. 未来可用（不急）

| 能力 | 时机 | 说明 |
|------|------|------|
| `chart-1~5` 5 个 token | M5+ | 仪表盘图表需要 |
| Radius `calc()` 派生 | 按需 | 当前 4 级独立值够用 |
| Registry 系统 | M7 开源 | 把 MB 组件以 shadcn registry 分发 |
| Preset 系统 | M6 | 客户一键换肤 |
| `migrate rtl` | 有 RTL 需求时 | CSS 物理属性转逻辑属性 |

---

## 四、M3 的行动项

1. `git merge main` 拿到 shadcn 升级代码
2. 创建 `components.json`
3. 做 Sidebar 前补 8 个 sidebar token
4. 注意 Toast → Sonner 的 API 变化，计划中涉及 Toast 的部分需调整
5. 可选：安装 shadcn skill + MCP server 提升开发效率
