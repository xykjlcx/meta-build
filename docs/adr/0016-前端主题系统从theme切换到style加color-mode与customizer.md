# ADR-0016：前端主题系统从 Theme 切换到 Style + ColorMode + Customizer

## 状态

已采纳

## 日期

2026-04-16

## 背景

M2-M5 阶段前端主题系统采用 `default / dark / compact` 三个平铺 theme：

- `dark` 同时承担“视觉风格”和“色彩模式”两种职责
- `compact` 同时承担“高密度预设”和“主题切换项”两种职责
- `ThemeProvider` / `themeRegistry` / `data-theme` 把多个维度压扁成一个字符串

这套模型在早期落地快，但到前端壳层重设计阶段暴露出 3 个问题：

1. **概念混淆**：`dark` 不是风格，只是色彩模式；`compact` 不是风格，而是密度/尺寸偏好
2. **组合能力弱**：无法表达“同一风格下切浅色/深色”“同一布局下切不同圆角/内容宽度”
3. **运行时定制受限**：ThemeSwitcher 只能切一个 theme 字符串，无法扩展为真正的 ThemeCustomizer 面板

问题本质不是命名不好，而是“多个独立演化维度被塞进一个枚举值”。

## 决策

前端主题系统从单一 `Theme` 模型切换为 4 个正交维度：

1. **Style**
   - 表示视觉风格预设，如 `classic` / `ocean` / `forest`
   - 由 `StyleRegistry` 注册
   - 每个 style 同时定义 light / dark 两套颜色变量

2. **ColorMode**
   - 独立表达浅色 / 深色
   - 取值仅 `light | dark`
   - 不再把 dark 视为独立 theme

3. **Customizer CSS 维度**
   - `scale`
   - `radius`
   - `contentLayout`
   - 通过 `body` data attribute + CSS 变量覆盖实现
   - 不引入额外 React Context

4. **兼容迁移**
   - 旧 `mb-theme=default|dark|compact` 只作为迁移输入读取一次
   - 迁移后写入新 key：
     - `mb_style`
     - `mb_color_mode`
     - `mb_scale`
     - `mb_radius`
   - 然后删除旧 key

### DOM 约定

- `<html data-theme-style="classic">`
- `<html data-theme-color-mode="dark">`
- `<body data-theme-scale="xs">`
- `<body data-theme-radius="sm">`
- `<body data-theme-content-layout="centered">`

### Provider 约定

- `ThemeProvider` 更名为 `StyleProvider`
- `useTheme()` 更名为 `useStyle()`
- React mount 前的首帧防闪烁不再通过 `initTheme()` 完成，而改为 `index.html` 内联脚本

## 结果

### 正面结果

- 概念边界清晰：风格、深浅色、密度、圆角不再混为一谈
- 运行时定制能力显著增强，ThemeCustomizer 有了稳定的模型基础
- style 可以继续扩展，而不需要复制一整套 `default-dark-compact` 风格矩阵
- 文档和实现能围绕“正交维度”组织，而不是围绕历史枚举名组织

### 代价

- `ThemeProvider` / `useTheme` / `themeRegistry` / `initTheme` 成为迁移期兼容 API，需要阶段性保留后再删除
- Storybook、主题完整性脚本、应用入口、L4 Header 工具栏需要一起更新
- 旧 `compact` 预设不再被视为 first-class theme，用户认知需要迁移

## 为什么不选其他方案

### 方案 A：继续保留 `default / dark / compact`

短期最省事，但每增加一个运行时维度都会继续把不同概念压到同一个 theme 字符串里，复杂度只会越滚越大。

### 方案 B：新增 `density` 维度，同时保留旧 Theme 模型

这是“双轨模型”，不是解法。`dark` 和 `compact` 的职责污染依然存在，只是外面再包一层。

### 方案 C：直接上 JSON/TS 主题源和编译器

违背前端既定原则：主题源数据仍然是 CSS 文件本身，不能为了这次重构引入新的主题 DSL 或编译步骤。
