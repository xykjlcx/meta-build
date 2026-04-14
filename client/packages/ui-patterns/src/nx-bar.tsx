import type { ReactNode } from 'react';
import { Button, cn } from '@mb/ui-primitives';

export interface NxBarProps {
  /** 当前选中的条目数量 */
  selectedCount: number;
  /** 选中提示文案模板，必须包含 {count} 占位符 */
  selectedTemplate: string;
  /** 操作按钮区域（渲染 slot，调用方放 Button 集合） */
  actions: ReactNode;
  /** 清除选中的回调 */
  onClear?: () => void;
  /** 清除按钮的文案 */
  clearLabel?: ReactNode;
  /** 是否 sticky 到视口底部 */
  fixed?: boolean;
  className?: string;
}

/**
 * NxBar — 批量操作栏
 *
 * 当有条目被选中时显示在页面底部，提供批量操作入口。
 * selectedCount <= 0 时不渲染。
 */
export function NxBar({
  selectedCount,
  selectedTemplate,
  actions,
  onClear,
  clearLabel,
  fixed = false,
  className,
}: NxBarProps) {
  if (selectedCount <= 0) return null;

  // 替换模板中的 {count} 占位符
  const text = selectedTemplate.replace('{count}', String(selectedCount));

  return (
    <div
      data-slot="nx-bar"
      className={cn(
        'flex items-center justify-between border-t bg-background px-4 py-3 shadow-lg',
        fixed && 'fixed bottom-0 left-0 right-0 z-50',
        className,
      )}
    >
      {/* 左侧：选中计数 + 清除按钮 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{text}</span>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            {clearLabel ?? 'Clear'}
          </Button>
        )}
      </div>

      {/* 右侧：操作区域 */}
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
