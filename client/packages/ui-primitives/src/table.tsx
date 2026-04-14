import type * as React from 'react';
import { cn } from './lib/utils';

/** Table 组件属性 */
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableElement>;
}

/** 表格根容器 */
function Table({ className, ref, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

/** TableHeader 组件属性 */
export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableSectionElement>;
}

/** 表格头部 */
function TableHeader({ className, ref, ...props }: TableHeaderProps) {
  return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />;
}

/** TableBody 组件属性 */
export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableSectionElement>;
}

/** 表格主体 */
function TableBody({ className, ref, ...props }: TableBodyProps) {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

/** TableFooter 组件属性 */
export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableSectionElement>;
}

/** 表格底部 */
function TableFooter({ className, ref, ...props }: TableFooterProps) {
  return (
    <tfoot
      ref={ref}
      className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

/** TableRow 组件属性 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableRowElement>;
}

/** 表格行 */
function TableRow({ className, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

/** TableHead 组件属性 */
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableCellElement>;
}

/** 表格列头 */
function TableHead({ className, ref, ...props }: TableHeadProps) {
  return (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  );
}

/** TableCell 组件属性 */
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableCellElement>;
}

/** 表格单元格 */
function TableCell({ className, ref, ...props }: TableCellProps) {
  return (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}

/** TableCaption 组件属性 */
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  /** DOM ref 转发（React 19 原生 ref-as-prop） */
  ref?: React.Ref<HTMLTableCaptionElement>;
}

/** 表格标题 */
function TableCaption({ className, ref, ...props }: TableCaptionProps) {
  return (
    <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
