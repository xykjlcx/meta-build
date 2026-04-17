import { Input, cn } from '@mb/ui-primitives';
import type { ComponentProps } from 'react';

// ─── 类型 ───────────────────────────────────────────────

export interface SearchInputProps extends Omit<ComponentProps<typeof Input>, 'type'> {
  /**
   * 显示在输入框右侧的快捷键提示文字，如 '⌘K'。
   * 不传时不渲染快捷键提示区域。
   */
  shortcut?: string;
}

// ─── 内联搜索图标（不依赖 lucide-react）───────────────────

/**
 * 16×16 放大镜 SVG，对应 lucide-react SearchIcon。
 * 使用内联 SVG 避免 L3 引入 lucide-react 直接依赖。
 */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// ─── 组件 ───────────────────────────────────────────────

/**
 * SearchInput — 搜索输入框
 *
 * Input + 左置放大镜图标的组合组件，兼容 classic 和 lark-console 两种 Style。
 * 照抄 nxboot-v2 的飞书风实现：默认 `bg-muted`（在 lark-console 下 = page bg 同色，隐身），
 * focus 时变 `bg-card`（白底）+ 显示蓝边框。hover 切到 `bg-muted/80` 略加深。
 *
 * @example
 * <SearchInput placeholder="搜索..." onChange={(e) => setQ(e.target.value)} />
 *
 * @example
 * // 带快捷键提示
 * <SearchInput placeholder="搜索" shortcut="⌘K" />
 */
export function SearchInput({ className, shortcut, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {/* 左侧放大镜图标，pointer-events-none 不拦截点击 */}
      <SearchIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-[var(--color-placeholder)]" />

      {/* 主输入框 */}
      <Input
        type="search"
        className={cn(
          // 去掉默认边框和阴影，使用 muted 背景（lark-console 下 = page bg 同色）
          'border-0 bg-muted pl-8.5 shadow-none',
          // hover 状态略微加深
          'hover:bg-muted/80',
          // focus 时变白底 + 显示边框
          'focus-visible:border focus-visible:border-ring focus-visible:bg-card',
          // 有 shortcut 时右侧留出空间
          shortcut && 'pr-12',
        )}
        {...props}
      />

      {/* 右侧快捷键提示（可选） */}
      {shortcut && (
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
          {shortcut}
        </span>
      )}
    </div>
  );
}
