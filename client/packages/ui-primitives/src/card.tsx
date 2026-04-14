import type * as React from 'react';
import { cn } from './lib/utils';

/** Card 组件属性 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 卡片根容器 */
function Card({ className, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

/** CardHeader 组件属性 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 卡片头部 */
function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

/** CardTitle 组件属性 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 卡片标题 */
function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <div
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

/** CardDescription 组件属性 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 卡片描述文本 */
function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
  return <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

/** CardContent 组件属性 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 卡片内容区域 */
function CardContent({ className, ref, ...props }: CardContentProps) {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
}

/** CardFooter 组件属性 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLDivElement>;
}

/** 卡片底部 */
function CardFooter({ className, ref, ...props }: CardFooterProps) {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
