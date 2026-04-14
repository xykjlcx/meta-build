import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type * as React from 'react';
import { cn } from './lib/utils';

/** Separator 组件属性 */
export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<React.ElementRef<typeof SeparatorPrimitive.Root>>;
}

/** 分隔线，支持水平/垂直方向 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ref,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
