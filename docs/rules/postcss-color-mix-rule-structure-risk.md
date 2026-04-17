---
title: color-mix() 在 semantic CSS 中可能破坏 rule 结构
type: pitfall
triggers: [color-mix, oklch, postcss, autoprefixer, semantic CSS, hover token, 覆写无效, rule 结构, @supports]
scope: [前端]
---

# `color-mix()` 在 semantic CSS 中可能破坏 rule 结构

## 规则

在 semantic token 层（`semantic-*.css`）避免使用 `color-mix(in oklch, var(--semantic-token) X%, transparent)` 这类"用 semantic var 做参数的 color-mix"。postcss（autoprefixer / preset-env / Vite 内置处理）在转写 oklch color-mix 时可能插入 `@supports` 嵌套块，破坏外层 selector 的大括号结构，导致后续规则"逃逸到全局"，覆写静默失效。

需要透明叠加效果时，改用 primitive 色板阶（`var(--color-blue-100)`、`var(--color-blue-800)` 等具体色值），直接赋值给 token，避免在 semantic 层做运算。

## Why

### postcss 转写的结构风险

`color-mix(in oklch, var(--x) 8%, transparent)` 不能被 postcss 静态分析（参数是运行时 CSS 变量），部分 postcss 插件（尤其是 autoprefixer oklch 处理路径）的降级策略是：

```css
/* 输入 */
[data-theme-style='feishu'] {
  --mb-hover-bg: color-mix(in oklch, var(--mb-primary) 8%, transparent);
  --mb-active-bg: color-mix(in oklch, var(--mb-primary) 12%, transparent);
}

/* postcss 可能输出（破坏性） */
[data-theme-style='feishu'] {
  --mb-hover-bg: /* sRGB fallback */;
}
@supports (color: oklch(0 0 0)) {
  [data-theme-style='feishu'] {
    --mb-hover-bg: color-mix(in oklch, var(--mb-primary) 8%, transparent);
  }
/* ← 这里的 @supports 块没有正确闭合外层 selector */
  --mb-active-bg: color-mix(in oklch, var(--mb-primary) 12%, transparent);  /* 逃逸到全局 */
}
```

逃逸到全局的规则不在 `[data-theme-style='feishu']` 条件下，相当于定义了全局 token，会意外覆盖 default style 的值，且在 DevTools 里极难发现（规则看起来"在 feishu block 里"但实际已逃逸）。

### 症状识别

这类 bug 的典型表现：
- feishu style 下 hover/active 状态的颜色表现异常（偶发，取决于 postcss 版本和具体 token）
- 切换回 default style 后，hover 颜色也不对（全局逃逸污染）
- DevTools 显示 token 有值，但值来源不对（来自意外的全局声明）
- `pnpm build` 后行为与 `pnpm dev` 不同（dev 的 postcss pipeline 与 build 有差异）

**具体事件**：2026-04-17 T4 Code Review 发现 `semantic-feishu.css` 中的 hover/active token 使用了 `color-mix(in oklch, var(--mb-primary) 8%, transparent)`，在 Vite build pipeline 下导致 rule 结构破坏。commit `0c01b32d`（初次发现）→ commit `e1654663`（最终修复）：light + dark block 全部改用 primitive 色板直接赋值。

## How to apply

**semantic 层写 hover/active/muted 类 token 时**，使用 primitive 色板而非 color-mix：

```css
/* 错误 ✗ — 用 semantic var 做 color-mix 参数 */
:root[data-theme-style='feishu'] {
  --mb-menu-item-hover-bg: color-mix(in oklch, var(--mb-primary) 8%, transparent);
}

/* 正确 ✓ — 直接引用 primitive 色板阶 */
:root[data-theme-style='feishu'] {
  --mb-menu-item-hover-bg: var(--color-blue-50);   /* light 模式 */
}

:root[data-theme-style='feishu'][data-theme-color-mode='dark'] {
  --mb-menu-item-hover-bg: var(--color-blue-950);  /* dark 模式 */
}
```

**层级规则**：

| 层 | color-mix 使用 | 说明 |
|----|---------------|------|
| primitive.css | 可以用（参数是具体色值，可静态分析） | `--color-blue-50: color-mix(in oklch, white 95%, blue)` |
| semantic-*.css | **禁止**用 `var()` 做参数的 color-mix | 改用 primitive 色板阶直接赋值 |
| component.css | 相对安全，但参数也应优先用 primitive var | 避免用 semantic var 做参数 |

**验证方法**：

```bash
# 检查 semantic CSS 中是否有 color-mix + var 组合
grep -n "color-mix.*var(" client/packages/ui-tokens/src/styles/semantic-*.css

# build 后检查 CSS 输出是否有意外的全局逃逸
pnpm build
grep -n "data-theme-style='feishu'" client/apps/web-admin/dist/assets/*.css | head -20
# 确认所有 feishu token 都在 selector block 内，没有裸露在外
```

**新增 style 文件的检查清单**：

- [ ] `semantic-*.css` 中无 `color-mix(in oklch, var(--`) 模式
- [ ] 所有 hover/active/muted 效果用 primitive 色板阶实现（参考 tailwind 的 50/100/200/800/900/950 阶）
- [ ] `pnpm build` 后 CSS 产物中 feishu selector block 结构完整（可用上方 grep 验证）

**参考**：`client/packages/ui-tokens/src/styles/semantic-feishu.css`（修复后版本），commit `e1654663`。
