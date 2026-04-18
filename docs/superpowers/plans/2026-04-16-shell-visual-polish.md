# Shell 视觉打磨实施计划

> **说明**：这是历史执行计划，不是当前真相。计划中的布局结构、组件命名和代码片段必须以当前仓库实际文件重新校验。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Inset 和 Module Switcher 两种布局的视觉效果对齐到原始参考（shadcnuikit / 飞书），打磨 ThemeCustomizer，清理临时文件。

**Architecture:** 只改视觉层（CSS class、组件结构），不改架构层（Registry、StyleProvider、LayoutResolver 不动）。所有改动封闭在 `app-shell/src/presets/`、`app-shell/src/components/` 和 web-admin 入口。

**Tech Stack:** React 19, shadcn/ui v4 Sidebar, Tailwind CSS v4, Radix UI

**参考网站：**
- Inset 布局：shadcnuikit.com/dashboard/default（极简纯色、bg-sidebar 铺底、白色圆角浮起卡片、毛玻璃 Header）
- Module Switcher：飞书管理后台（纯白 Header + 文字 Tab 下划线、扁平同色背景、border 分割）

---

### Task 0: 清理 + 启动 dev server 确认现状

**Files:**
- Delete: `client/apps/web-admin/visual-check.html`
- Delete: `client/apps/web-admin/src/visual-check.tsx`

- [ ] **Step 1: 删除 Codex 留下的临时文件**

- [ ] **Step 2: 启动 dev server 并截图确认当前状态**

Run: `cd /Users/ocean/Studio/01-workshop/02-软件开发/06-meta-build/client && pnpm dev`

用 Playwright 打开 http://localhost:5173/，截图记录 Inset 布局当前状态。

- [ ] **Step 3: 提交清理**

---

### Task 1: Inset Layout — 修复"浮起卡片"效果

**Files:**
- Modify: `client/packages/app-shell/src/presets/inset/inset-layout.tsx`

**目标视觉：** 最外层 bg-sidebar 灰色铺底 → 内容区白色圆角卡片浮起（m-2 ml-0 rounded-xl shadow-sm）

- [ ] **Step 1: 确认 SidebarProvider wrapper 的背景色**

shadcn Sidebar 的 inset variant 会自动让 `sidebar-wrapper` 有 `has-data-[variant=inset]:bg-sidebar`。检查当前是否生效。如果不生效，在 SidebarProvider 外层包一个带 `bg-sidebar` 的 div。

- [ ] **Step 2: 确认 SidebarInset 的浮起样式**

shadcn SidebarInset 自带 `md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm`。确认这些 class 是否生效。如果不生效，检查 Sidebar 组件的 data-variant 属性是否正确设置。

- [ ] **Step 3: 确认内容区底色**

SidebarInset 内部的内容包裹 div 应该有 `bg-muted/40`（微灰底色，衬托白色业务卡片）。

- [ ] **Step 4: 截图验证浮起卡片效果**

- [ ] **Step 5: 提交**

---

### Task 2: Inset Layout — 修复毛玻璃 Header

**Files:**
- Modify: `client/packages/app-shell/src/presets/inset/inset-layout.tsx`

**目标视觉：** Header 在 SidebarInset 内部，sticky + 半透明白色 + 毛玻璃模糊 + 顶部圆角与 SidebarInset 齐平

- [ ] **Step 1: Header 样式对齐**

```
className="bg-background/40 sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-md px-4 md:rounded-tl-xl md:rounded-tr-xl"
```

去掉任何花哨的阴影、渐变、额外圆角。

- [ ] **Step 2: Header 左侧内容**

左侧应该是：`SidebarTrigger` + `Separator` + 页面标题（或 Breadcrumb 占位文字）

- [ ] **Step 3: Header 右侧内容**

右侧工具栏：`LanguageSwitcher` + `ThemeCustomizer`（齿轮图标）+ `NotificationSlot` + `Separator` + 用户头像 + 退出按钮

- [ ] **Step 4: 截图验证毛玻璃效果**

滚动内容验证毛玻璃透视效果。

- [ ] **Step 5: 提交**

---

### Task 3: Inset Layout — 修复 Sidebar 内容

**Files:**
- Modify: `client/packages/app-shell/src/presets/inset/inset-layout.tsx`

**目标视觉：** shadcnuikit 风格的三段式 Sidebar：Header（Logo）+ Content（分组菜单 + 图标）+ Footer（用户信息）

- [ ] **Step 1: SidebarHeader — Logo 区**

```tsx
<SidebarHeader>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">M</div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Meta-Build</span>
          <span className="text-xs text-muted-foreground">Workspace</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarHeader>
```

- [ ] **Step 2: SidebarContent — 分组菜单**

菜单项渲染规则：
- depth 0（DIRECTORY）→ `SidebarGroup` + `SidebarGroupLabel`
- depth 1+（MENU）→ `SidebarMenuItem` + `SidebarMenuButton`
- 嵌套 DIRECTORY → `Collapsible` + `SidebarMenuSub` + `SidebarMenuSubButton`
- BUTTON → 不渲染
- 每个菜单项用 MenuNode.icon 对应的 Lucide 图标（没有 icon 用首字母 fallback）

- [ ] **Step 3: SidebarFooter — 用户信息**

```tsx
<SidebarFooter>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg">
        <Avatar className="size-8">...</Avatar>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{currentUser.username}</span>
          <span className="text-xs text-muted-foreground">管理员</span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

- [ ] **Step 4: SidebarRail**

确保 `<SidebarRail />` 存在（拖拽折叠手柄）。

- [ ] **Step 5: 截图验证 Sidebar 效果（展开 + 折叠）**

- [ ] **Step 6: 提交**

---

### Task 4: Inset Layout — 移动端 + 折叠测试

**Files:**
- Possibly modify: `client/packages/app-shell/src/presets/inset/inset-layout.tsx`

- [ ] **Step 1: 桌面端折叠**

点击 SidebarTrigger，验证 Sidebar 从 256px 收缩到 48px（icon 模式），菜单项只显示图标。

- [ ] **Step 2: 移动端 Sheet**

缩小浏览器到 < 1024px，验证 Sidebar 自动隐藏，点击 SidebarTrigger 弹出 Sheet（侧滑抽屉）。

- [ ] **Step 3: SidebarInset 折叠联动**

折叠 Sidebar 后，SidebarInset 的 ml 应该从 0 变为 2（`peer-data-[state=collapsed]:ml-2`）。

- [ ] **Step 4: 截图验证三种状态**

- [ ] **Step 5: 提交（如有修改）**

---

### Task 5: Module Switcher — 视觉对齐飞书

**Files:**
- Modify: `client/packages/app-shell/src/presets/module-switcher/module-switcher-layout.tsx`

**目标视觉：** 扁平企业风——纯白 Header + 文字 Tab + 同色灰底 + border 分割

- [ ] **Step 1: Header 改为纯白 + border**

```
className="flex h-14 items-center border-b bg-background px-4"
```

去掉所有毛玻璃、阴影。

- [ ] **Step 2: Module Tab 改为文字 + 下划线**

激活态：`border-b-2 border-primary text-primary font-medium`
非激活态：`text-muted-foreground hover:text-foreground`

去掉丸状按钮、圆角背景色。

- [ ] **Step 3: Sidebar + 内容区同色**

```
className="bg-muted"  // 或直接 bg-[#f2f3f5]
```

Sidebar 和内容区用同一个灰色背景，Sidebar 右侧 `border-r` 分割。

- [ ] **Step 4: 硬编码色值替换为 token**

`#3370ff` → `text-primary` / `border-primary`
`#f2f3f5` → `bg-muted`

- [ ] **Step 5: 截图验证飞书效果**

- [ ] **Step 6: 截图验证模块 Tab 切换**

- [ ] **Step 7: 提交**

---

### Task 6: ThemeCustomizer — 打磨

**Files:**
- Modify: `client/packages/app-shell/src/components/theme-customizer.tsx`

- [ ] **Step 1: 验证当前 ThemeCustomizer 面板**

截图面板展开状态，检查 6 个维度是否都正常渲染。

- [ ] **Step 2: 验证维度切换**

逐个切换每个维度，确认：
- 布局切换：Inset ↔ Module Switcher 实时生效
- 风格切换：Select 下拉正常
- 色彩模式：Light ↔ Dark 切换
- Scale：XS / Default / LG
- Radius：None / SM / MD / LG / XL
- Content Layout：Full / Centered（仅 Inset 可用）

- [ ] **Step 3: 如有视觉问题，修复**

- [ ] **Step 4: 提交（如有修改）**

---

### Task 7: 全量验证 + 截图存档

- [ ] **Step 1: 构建验证**

```bash
cd client && pnpm check:types
cd client && pnpm build
cd client && pnpm -F @mb/ui-tokens check:theme
```

- [ ] **Step 2: Inset Layout 截图存档**

- 桌面端展开态
- 桌面端折叠态（icon 模式）
- 移动端（768px）
- Dark mode
- Scale XS / LG
- Radius None / XL

- [ ] **Step 3: Module Switcher 截图存档**

- 桌面端展开态
- 模块 Tab 切换后
- Dark mode

- [ ] **Step 4: ThemeCustomizer 截图**

- 面板展开态
- 布局切换确认

- [ ] **Step 5: 最终提交**
