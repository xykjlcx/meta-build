import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from './lib/utils';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

/** AlertDialogOverlay 组件属性 */
export interface AlertDialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>;
}

/** 警告对话框遮罩层 */
function AlertDialogOverlay({
  className,
  ref,
  ...props
}: AlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

/** AlertDialogContent 组件属性 */
export interface AlertDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Content>>;
}

/** 警告对话框内容区域 */
function AlertDialogContent({
  className,
  ref,
  ...props
}: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

/** 警告对话框头部 */
function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-2 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  );
}

/** 警告对话框底部 */
function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className,
      )}
      {...props}
    />
  );
}

/** AlertDialogTitle 组件属性 */
export interface AlertDialogTitleProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Title>>;
}

/** 警告对话框标题 */
function AlertDialogTitle({
  className,
  ref,
  ...props
}: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  );
}

/** AlertDialogDescription 组件属性 */
export interface AlertDialogDescriptionProps
  extends React.ComponentPropsWithoutRef<
    typeof AlertDialogPrimitive.Description
  > {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Description>>;
}

/** 警告对话框描述 */
function AlertDialogDescription({
  className,
  ref,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/** AlertDialogAction 组件属性 */
export interface AlertDialogActionProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Action>>;
}

/** 警告对话框确认按钮 */
function AlertDialogAction({
  className,
  ref,
  ...props
}: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/** AlertDialogCancel 组件属性 */
export interface AlertDialogCancelProps
  extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>;
}

/** 警告对话框取消按钮 */
function AlertDialogCancel({
  className,
  ref,
  ...props
}: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        'mt-2 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:mt-0',
        className,
      )}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
