import { Badge, cn } from '@mb/ui-primitives';
import type { ComponentProps } from 'react';

// ─── 类型 ───────────────────────────────────────────────

/**
 * StatusBadge 支持的语义档位：
 * - active / pending / disabled：记录/成员状态三档
 * - low / medium / high：严重程度三档
 * - neutral：通用中性档
 */
export type StatusTone = 'active' | 'pending' | 'disabled' | 'low' | 'medium' | 'high' | 'neutral';

export interface StatusBadgeProps {
  /** 状态档位，决定配色 */
  tone: StatusTone;
  /**
   * 显示文案。
   * 不传时使用中文内置 fallback，调用方可通过 i18n 覆盖。
   */
  label?: string;
  className?: string;
}

// ─── 映射 ───────────────────────────────────────────────

/** tone → Badge variant */
const variantMap: Record<StatusTone, NonNullable<ComponentProps<typeof Badge>['variant']>> = {
  active: 'success-soft',
  pending: 'warning-soft',
  disabled: 'destructive-soft',
  low: 'secondary',
  medium: 'warning-soft',
  high: 'destructive-soft',
  neutral: 'secondary',
};

/** tone → 中文默认文案（不传 label 时的 fallback） */
const defaultLabelMap: Record<StatusTone, string> = {
  active: '正常',
  pending: '待激活',
  disabled: '停用',
  low: '低',
  medium: '中',
  high: '高',
  neutral: '-',
};

// ─── 组件 ───────────────────────────────────────────────

/**
 * StatusBadge — 语义状态徽章
 *
 * 基于 L2 Badge 的语义包装，覆盖 7 种常见业务状态档位（active/pending/disabled/low/medium/high/neutral）。
 * 颜色全部消费 CSS token，在 classic 和 lark-console 两种 style 下均视觉合理。
 *
 * @example
 * // 使用默认中文 label
 * <StatusBadge tone="active" />
 *
 * @example
 * // 调用方负责 i18n
 * <StatusBadge tone="pending" label={t('status.pending')} />
 */
export function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  const variant = variantMap[tone];
  const text = label ?? defaultLabelMap[tone];

  return (
    <Badge variant={variant} className={cn('px-2.5 py-0.5 text-[12px]', className)}>
      {text}
    </Badge>
  );
}
