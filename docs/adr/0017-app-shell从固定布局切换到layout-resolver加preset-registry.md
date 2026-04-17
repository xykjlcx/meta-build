# ADR-0017：App Shell 从固定布局切换到 Layout Resolver + Preset Registry

## 状态

已采纳

## 日期

2026-04-16

## 背景

M3 以来，L4 壳层把认证后页面的布局直接写死为：

- `SidebarLayout`
- `TopLayout`
- `BasicLayout`

这种模型在初版落地时足够简单，但随着前端整体优化，出现了两个问题：

1. **布局扩展成本高**：新增一种壳层，需要 L5 路由显式改 import 和装配方式
2. **定制入口不统一**：布局选择、布局切换、布局可用列表没有单一注册点

同时，壳层重设计已经明确需要至少两种认证后布局：

- `inset`
- `mix`

继续把它们作为零散组件直接暴露，会让“布局即契约”的边界越来越模糊。

## 决策

认证后壳层统一切换为：

1. **`LayoutResolver`**
   - 作为 `/_authed` 唯一使用的布局入口
   - 负责读取当前 preset id
   - 负责注入 `menuTree` / `currentUser` / `notificationSlot`
   - 负责选择并渲染具体布局组件

2. **`PresetRegistry`**
   - 用显式注册表维护所有可用的 authed layout preset
   - preset 至少包含：
     - `id`
     - `name`
     - `component`
   - 注册表必须显式声明 `defaultLayoutId`

3. **禁止隐式默认值**
   - 默认 preset **不能**依赖“第一个 import 的副作用顺序”
   - `import 即注册` 可以保留为装配手段，但默认布局必须通过显式配置给出

4. **布局边界**
   - `BasicLayout` 继续保留，作为无菜单/登录页布局
   - `InsetLayout` 成为新的认证后默认布局
   - `MixLayout` 作为第二个正式 preset

5. **迁移期兼容**
   - `SidebarLayout` / `TopLayout` 在迁移期允许保留为 compatibility wrapper 或 deprecated export
   - 但 canonical spec 和后续实现不再把它们视为长期一等概念

## 结果

### 正面结果

- `/_authed` 的入口统一，L5 不再知道具体是哪种壳
- preset 列表、默认值、可切换性有单一事实源
- ThemeCustomizer 可以直接消费 registry 渲染布局切换 UI
- 新增第三种布局时，只需要扩展 preset registry，不需要重写路由装配逻辑

### 代价

- `@mb/app-shell` 的公共导出需要阶段性兼容
- 文档、i18n、Storybook、壳层组件目录结构都要一起调整
- layout 与 header/sidebar 组件的职责边界需要重新整理

## 为什么不选其他方案

### 方案 A：继续暴露固定的 `SidebarLayout / TopLayout / BasicLayout`

适合初版，不适合后续“运行时可切换布局”的目标。布局一旦需要动态切换，固定组件直连就会失去统一装配点。

### 方案 B：继续使用 side-effect import，并让“第一个注册者”成为默认布局

这对 bundler 友好，但对 AI 和维护者都不友好。默认值依赖 import 顺序，本质是隐式契约，不满足 meta-build “可 grep、可验证、可推理”的要求。

### 方案 C：把布局选择逻辑放到 L5 业务代码

会削弱 L4 “换壳不换业务”的核心承诺。布局选择必须是壳层基础设施职责，不应回流到业务路由。
