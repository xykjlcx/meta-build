import * as React from 'react';
import { cn } from './lib/utils';

/** Skeleton 组件属性 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 骨架屏占位组件 */
function Skeleton({ className, ref, ...props }: SkeletonProps) {
  return (
    <div
      ref={ref}
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
