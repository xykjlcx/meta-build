import { Popover as PopoverPrimitive } from 'radix-ui';
import * as React from 'react';
import { Calendar } from './calendar';
import { cn } from './lib/utils';

/* ------------------------------------------------------------------ */
/*  DatePicker = Popover + Calendar                                     */
/* ------------------------------------------------------------------ */

/** DatePicker 组件属性 */
export interface DatePickerProps {
  /** 当前选中日期 */
  value?: Date;
  /** 日期变更回调 */
  onValueChange?: (date: Date | undefined) => void;
  /** 占位提示文字 */
  placeholder?: string;
  /** 日期格式化函数 */
  formatDate?: (date: Date) => string;
  /** 自定义 className */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/** 默认日期格式化 */
function defaultFormatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** 日期选择器组件（单日期选择） */
function DatePicker({
  value,
  onValueChange,
  placeholder,
  formatDate = defaultFormatDate,
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value ? formatDate(value) : (placeholder ?? '')}
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 opacity-50"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          sideOffset={4}
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onValueChange?.(date);
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DatePicker };
