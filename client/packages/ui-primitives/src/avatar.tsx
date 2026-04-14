import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from './lib/utils';

/** Avatar 组件属性 */
export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>;
}

/** 头像根容器 */
function Avatar({ className, ref, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

/** AvatarImage 组件属性 */
export interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>>;
}

/** 头像图片 */
function AvatarImage({ className, ref, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      {...props}
    />
  );
}

/** AvatarFallback 组件属性 */
export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>>;
}

/** 头像回退（图片加载失败时显示） */
function AvatarFallback({ className, ref, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
