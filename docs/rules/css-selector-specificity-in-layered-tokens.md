---
title: CSS 多层 token 覆写中的 specificity 陷阱
type: pitfall
triggers: [CSS specificity, token 覆写, semantic CSS, :root, data-theme-style, 覆写失效, feishu, 主题]
scope: [前端]
---

# CSS 多层 token 覆写中的 specificity 陷阱

## 规则

在多层 CSS token 架构（primitive → semantic → component）中，semantic 层的 style 覆写 selector 必须至少为 `:root[data-theme-style='xxx']`（specificity 0,2,0），不能只用 `[data-theme-style='xxx']` 或光秃秃的 `:root`，否则会被 component 层的 `:root { ... }` 默认值静默覆盖。

## Why

**specificity 计分规则回顾**：
- `:root` = pseudo-class = (0,1,0)
- `[data-theme-style='feishu']` = attribute selector = (0,1,0)
- `:root[data-theme-style='feishu']` = pseudo-class + attribute = (0,2,0)

**陷阱的结构**：meta-build 的 CSS 加载顺序为 primitive.css → semantic-*.css → component.css。component.css 通过 `@import` 后置，其中 `:root { --token: value; }` 的 specificity 是 (0,1,0)。如果 semantic 层写的是 `[data-theme-style='feishu'] { --token: override; }`，两者 specificity 相同，后置的 component.css 胜出，覆写静默失效。

**额外陷阱——light/dark block 的 specificity 不对等**：

```css
/* light block — specificity (0,1,0) */
[data-theme-style='feishu'] {
  --mb-sidebar-bg: var(--color-blue-600);
}

/* dark block — specificity (0,2,0) */
[data-theme-style='feishu'][data-theme-color-mode='dark'] {
  --mb-sidebar-bg: var(--color-blue-900);
}
```

dark block 因为多了一个 attribute selector 天然比 light block 高一级。如果 W1 结构 token 在两个 block 都需要覆写，light block 会输给 component 层的 `:root { ... }` 默认值，而 dark block 不会——导致 light/dark 行为不对称，极难排查。

**具体事件**：2026-04-17 T10 视觉回归发现 feishu style 下的 W1 结构 token（sidebar 背景色等）在 light 模式无效，dark 模式正常。根因是 semantic-feishu.css 的 light block 用了 `[data-theme-style='feishu']`（0,1,0），被 component.css 的 `:root { ... }` 覆盖。修复 commit `e1654663`：将 feishu 的所有 block selector 升级为 `:root[data-theme-style='feishu']`（0,2,0）。

## How to apply

**写 semantic 覆写时**，selector 模板：

```css
/* 正确 ✓ */
:root[data-theme-style='feishu'] {
  --mb-sidebar-bg: var(--color-blue-600);
}

:root[data-theme-style='feishu'][data-theme-color-mode='dark'] {
  --mb-sidebar-bg: var(--color-blue-900);
}

/* 错误 ✗ — specificity 不足，被 component 层 :root 覆盖 */
[data-theme-style='feishu'] {
  --mb-sidebar-bg: var(--color-blue-600);
}
```

**诊断"覆写无效"时的标准流程**：

1. 打开浏览器 DevTools → Elements → 选中应用了覆写 token 的元素
2. 切到 "Styles" 面板，找到对应 CSS 自定义属性
3. 看哪条规则处于"胜出"状态（没有删除线）
4. 比对 specificity 数字（DevTools 的 Specificity 列直接显示）
5. 如果是被 `:root { ... }` 胜出，说明 semantic 层 selector specificity 不足 → 升级到 `:root[data-attr='value']`

**新增 style 时的检查清单**：

- [ ] semantic-*.css 的所有 block selector 是 `:root[data-theme-style='xxx']` 或更高，而非裸 `[data-theme-style='xxx']`
- [ ] light block 和 dark block 的 specificity 对等（都加了 `:root` 前缀）
- [ ] W1 结构 token 在 light + dark 两种模式下分别验证覆写生效

**参考**：`client/packages/ui-tokens/src/styles/semantic-feishu.css`（修复后版本），commit `e1654663`。
