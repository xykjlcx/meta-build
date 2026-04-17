import { cn } from '@mb/ui-primitives';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// PageHeader — 页面标题栏
// ---------------------------------------------------------------------------
// 视觉对齐飞书管理后台节奏：左区（eyebrow + 标题 + 描述 + meta） + 右区（actions）
// 通过消费 semantic token 实现：lark-console style 和 classic style 自动切换视觉

export interface PageHeaderProps {
  /**
   * 上方小标签（如模块面包屑、所属分类），12px + tracking
   * @since lark-console style
   */
  eyebrow?: ReactNode;
  /** 页面主标题 */
  title: ReactNode;
  /** 副标题 / 说明文字 */
  description?: ReactNode;
  /** 标题下方附加元数据区域（徽章、状态、统计等） */
  meta?: ReactNode;
  /** 右侧操作按钮区域 */
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader — 页面顶部标题区域
 *
 * 布局：左区（eyebrow + title + description + meta）+ 右区（actions）
 * 使用 semantic token，两个 style 下视觉自动切换。
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        'flex flex-col gap-4 px-6 pb-4 pt-5 md:flex-row md:items-start md:justify-between',
        className,
      )}
    >
      {/* 左区：eyebrow + 标题 + 描述 + meta */}
      <div className="space-y-1.5">
        {eyebrow ? (
          <div className="text-[12px] font-medium tracking-[0.04em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-[18px] font-semibold leading-7 tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-[14px] leading-[1.375rem] text-muted-foreground">
            {description}
          </p>
        ) : null}
        {meta ? <div className="pt-1">{meta}</div> : null}
      </div>

      {/* 右区：操作按钮 */}
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
