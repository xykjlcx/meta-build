import { Slot } from '@radix-ui/react-slot';
import type * as React from 'react';
import { cn } from './lib/utils';

/** Breadcrumb 组件属性 */
export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<'nav'> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLElement>;
}

/** 面包屑导航根元素 */
function Breadcrumb({ ref, ...props }: BreadcrumbProps) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />;
}

/** BreadcrumbList 组件属性 */
export interface BreadcrumbListProps extends React.ComponentPropsWithoutRef<'ol'> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLOListElement>;
}

/** 面包屑有序列表 */
function BreadcrumbList({ className, ref, ...props }: BreadcrumbListProps) {
  return (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
        className,
      )}
      {...props}
    />
  );
}

/** BreadcrumbItem 组件属性 */
export interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<'li'> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLLIElement>;
}

/** 面包屑项 */
function BreadcrumbItem({ className, ref, ...props }: BreadcrumbItemProps) {
  return <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

/** BreadcrumbLink 组件属性 */
export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  /** 是否将链接渲染为子元素（多态模式） */
  asChild?: boolean;
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLAnchorElement>;
}

/** 面包屑链接 */
function BreadcrumbLink({ asChild, className, ref, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      className={cn('transition-colors hover:text-foreground', className)}
      {...props}
    />
  );
}

/** BreadcrumbPage 组件属性 */
export interface BreadcrumbPageProps extends React.ComponentPropsWithoutRef<'span'> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLSpanElement>;
}

/** 面包屑当前页（不可点击） */
function BreadcrumbPage({ className, ref, ...props }: BreadcrumbPageProps) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      tabIndex={0}
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  );
}

/** BreadcrumbSeparator 组件属性 */
export interface BreadcrumbSeparatorProps extends React.ComponentPropsWithoutRef<'li'> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLLIElement>;
}

/** 面包屑分隔符 */
function BreadcrumbSeparator({ children, className, ref, ...props }: BreadcrumbSeparatorProps) {
  return (
    <li
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', className)}
      {...props}
    >
      {children ?? (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </li>
  );
}

/** BreadcrumbEllipsis 组件属性 */
export interface BreadcrumbEllipsisProps extends React.ComponentPropsWithoutRef<'span'> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLSpanElement>;
}

/** 面包屑省略号 */
function BreadcrumbEllipsis({ className, ref, ...props }: BreadcrumbEllipsisProps) {
  return (
    <span
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
