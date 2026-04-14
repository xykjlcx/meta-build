import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from './lib/utils';

/* ------------------------------------------------------------------ */
/*  Command 底层组件（cmdk 封装）                                       */
/* ------------------------------------------------------------------ */

/** Command 容器属性 */
export interface CommandProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 命令面板容器 */
function Command({ className, ref, ...props }: CommandProps) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

/** CommandInput 属性 */
export interface CommandInputProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLInputElement>;
}

/** 命令面板搜索输入框 */
function CommandInput({ className, ref, ...props }: CommandInputProps) {
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2 h-4 w-4 shrink-0 opacity-50"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

/** CommandList 属性 */
export interface CommandListProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 命令面板列表容器 */
function CommandList({ className, ref, ...props }: CommandListProps) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  );
}

/** CommandEmpty 属性 */
export interface CommandEmptyProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 命令面板空状态 */
function CommandEmpty({ ref, ...props }: CommandEmptyProps) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}

/** CommandGroup 属性 */
export interface CommandGroupProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 命令面板分组 */
function CommandGroup({ className, ref, ...props }: CommandGroupProps) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

/** CommandItem 属性 */
export interface CommandItemProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 命令面板选项 */
function CommandItem({ className, ref, ...props }: CommandItemProps) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/** CommandSeparator 属性 */
export interface CommandSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 命令面板分隔线 */
function CommandSeparator({ className, ref, ...props }: CommandSeparatorProps) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Combobox = Popover + Command 组合                                   */
/* ------------------------------------------------------------------ */

/** Combobox 选项定义 */
export interface ComboboxOption {
  /** 选项值 */
  value: string;
  /** 选项显示标签 */
  label: string;
}

/** Combobox 组件属性 */
export interface ComboboxProps {
  /** 选项列表 */
  options: ComboboxOption[];
  /** 当前选中值 */
  value?: string;
  /** 值变更回调 */
  onValueChange?: (value: string) => void;
  /** 占位提示文字 */
  placeholder?: string;
  /** 搜索框占位提示 */
  searchPlaceholder?: string;
  /** 空结果提示文字 */
  emptyText?: string;
  /** 自定义 className */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/** 可搜索下拉选择器 */
function Combobox({
  options,
  value,
  onValueChange,
  placeholder = '请选择...',
  searchPlaceholder = '搜索...',
  emptyText = '无匹配结果',
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          {selectedLabel ?? (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          sideOffset={4}
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  Combobox,
};
