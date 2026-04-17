# ADR-0018：废弃 Compact 主题，改为 Style + Customizer 维度组合

## 状态

已采纳

## 日期

2026-04-16

## 背景

现有 `compact` theme 是历史产物。它混合了多种变化：

- 圆角更小
- 部分尺寸更紧凑
- 动效更快
- 颜色仍与 `default` 基本一致

这意味着 `compact` 并不是一个真正的“视觉风格”，而是一组偏好组合。把它继续当作独立主题，会和新的 `Style + ColorMode + Customizer` 模型发生直接冲突。

同时，实际使用价值有限：

- `compact` 不是品牌风格
- 不是独立色彩体系
- 用户可以通过更细粒度的运行时定制替代它

## 决策

1. **废弃 `compact` 作为独立 theme/style**
   - 不再把 `compact` 注册到新的 `StyleRegistry`
   - 不再在 ThemeCustomizer 中展示为风格项

2. **迁移策略**
   - 旧 `mb-theme=compact` 迁移为：
     - `mb_style=classic`
     - `mb_scale=xs`
     - `mb_radius=sm`
   - 这是 best-effort 映射，不追求 100% 复刻旧 compact 的每一项细节

3. **明确不保真的项**
   - 旧 compact 中关于 `size-*`、`duration-*` 的细微差异，不单独新增维度去保真
   - 当前 v2 不新增 `density` 维度

4. **文档策略**
   - canonical spec 中将 compact 标记为历史兼容，不再作为推荐扩展路径
   - 新扩展指南以 `style + colorMode + scale + radius` 为主

## 结果

### 正面结果

- 主题模型更干净，不再把“高密度偏好”伪装成 theme
- ThemeCustomizer 的交互维度更一致
- 减少一个需要长期维护的主题文件和一条心智分支

### 代价

- 旧用户如果非常依赖 compact 的精细尺寸/动效手感，会感到行为不完全一致
- 文档和迁移脚本需要显式说明“这是有意简化，不是 bug”

## 为什么不选其他方案

### 方案 A：保留 compact，继续作为独立风格项

会把 v2 的正交模型重新拉回“枚举塞职责”的老路，违背 ADR-0016。

### 方案 B：新增 `density` 维度，完整复刻 compact

理论上更完整，但这次重构的核心不是把历史预设 1:1 神还原，而是把模型简化到“刚好够用”。为一个低使用率旧预设引入新维度，收益不够。

### 方案 C：直接删除 compact 且不做迁移

对已有 localStorage 用户不友好，也会在升级时制造不必要的“设置丢失”感知。
