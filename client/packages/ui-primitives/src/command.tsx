import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from './lib/utils';
import { Dialog, DialogContent, type DialogContentProps } from './dialog';

/** Command 组件属性 */
export interface CommandProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive>>;
}

/** 命令面板根元素 */
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

/** CommandDialog 组件属性 */
export interface CommandDialogProps extends DialogContentProps {
  /** 对话框打开/关闭受控 */
  open?: boolean;
  /** 对话框打开状态变化回调 */
  onOpenChange?: (open: boolean) => void;
  /** 命令面板的子内容 */
  children?: React.ReactNode;
}

/** 命令面板对话框（Command 包装在 Dialog 中） */
function CommandDialog({
  children,
  open,
  onOpenChange,
  closeLabel,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 shadow-lg"
        closeLabel={closeLabel}
        {...props}
      >
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/** CommandInput 组件属性 */
export interface CommandInputProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Input>>;
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

/** CommandList 组件属性 */
export interface CommandListProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.List>>;
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

/** CommandEmpty 组件属性 */
export interface CommandEmptyProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Empty>>;
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

/** CommandGroup 组件属性 */
export interface CommandGroupProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Group>>;
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

/** CommandSeparator 组件属性 */
export interface CommandSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Separator>>;
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

/** CommandItem 组件属性 */
export interface CommandItemProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Item>>;
}

/** 命令面板选项 */
function CommandItem({ className, ref, ...props }: CommandItemProps) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled='true']:pointer-events-none data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground data-[disabled='true']:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

/** 命令面板快捷键提示 */
function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
