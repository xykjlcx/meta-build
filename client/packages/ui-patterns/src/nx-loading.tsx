import type { ReactNode } from 'react';
import { Button, Skeleton, cn } from '@mb/ui-primitives';

export interface NxLoadingProps {
  /** 是否处于加载状态 */
  loading?: boolean;
  /** 错误对象（truthy 即视为错误状态） */
  error?: unknown;
  /** 是否为空数据状态 */
  empty?: boolean;
  /** 加载中提示文案（REQUIRED，由调用方注入） */
  loadingText: ReactNode;
  /** 错误提示文案（REQUIRED，由调用方注入） */
  errorText: ReactNode;
  /** 空数据提示文案（REQUIRED，由调用方注入） */
  emptyText: ReactNode;
  /** 重试按钮文案 */
  retryLabel?: ReactNode;
  /** 重试回调 */
  onRetry?: () => void;
  /** 加载态视觉变体 */
  variant?: 'skeleton' | 'spinner' | 'skeleton-table' | 'skeleton-detail';
  /** 骨架行数，默认 5 */
  rows?: number;
  /** 正常内容 */
  children?: ReactNode;
  className?: string;
}

// 骨架屏宽度交替，避免所有行一样宽
const ROW_WIDTHS = ['w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-4/5'];

function SkeletonRows({ rows, text }: { rows: number; text: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', ROW_WIDTHS[i % ROW_WIDTHS.length])}
        />
      ))}
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SkeletonTable({ rows, text }: { rows: number; text: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {/* 表头 */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-px w-full" />
      {/* 表体 */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function SkeletonDetail({ rows, text }: { rows: number; text: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {/* 标题 */}
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-px w-full" />
      {/* 内容行 */}
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', ROW_WIDTHS[i % ROW_WIDTHS.length])}
        />
      ))}
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="size-8 animate-spin text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * 三态容器：loading / error / empty / children
 *
 * 优先级：error > loading > empty > children
 */
function NxLoading({
  loading = false,
  error,
  empty = false,
  loadingText,
  errorText,
  emptyText,
  retryLabel,
  onRetry,
  variant = 'skeleton',
  rows = 5,
  children,
  className,
}: NxLoadingProps) {
  // 优先级 1：错误
  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          'flex flex-col items-center justify-center gap-3 py-12 text-center',
          className,
        )}
      >
        <p className="text-sm text-destructive">{errorText}</p>
        {onRetry && retryLabel && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  // 优先级 2：加载中
  if (loading) {
    return (
      <div className={cn('py-6', className)}>
        {variant === 'spinner' && (
          <div className="flex flex-col items-center justify-center gap-3 py-6">
            <Spinner />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        )}
        {variant === 'skeleton' && (
          <SkeletonRows rows={rows} text={loadingText} />
        )}
        {variant === 'skeleton-table' && (
          <SkeletonTable rows={rows} text={loadingText} />
        )}
        {variant === 'skeleton-detail' && (
          <SkeletonDetail rows={rows} text={loadingText} />
        )}
      </div>
    );
  }

  // 优先级 3：空数据
  if (empty) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-12 text-center',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  // 优先级 4：正常内容
  return <>{children}</>;
}

export { NxLoading };
