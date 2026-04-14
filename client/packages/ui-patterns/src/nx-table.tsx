import {
  Button,
  Checkbox,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@mb/ui-primitives';
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

// ─── 类型 ───────────────────────────────────────────────

/** 分页状态，page 从 1 开始（与后端 PageResult 对齐） */
export interface NxTablePagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NxTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  loading?: boolean;
  emptyText?: ReactNode;
  onRowClick?: (row: TData) => void;
  pagination?: NxTablePagination;
  onPaginationChange?: (next: NxTablePagination) => void;
  /** 分页信息模板，包含 {total}、{page}、{pages} 占位符。不传则不渲染分页信息文案 */
  paginationInfoTemplate?: string;
  /** 上一页按钮文案。不传则显示 SVG 箭头图标 */
  previousLabel?: ReactNode;
  /** 下一页按钮文案。不传则显示 SVG 箭头图标 */
  nextLabel?: ReactNode;
  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (next: RowSelectionState) => void;
  /** 批量操作栏，选中行时显示 */
  batchActions?: ReactNode;
  className?: string;
}

// ─── 常量 ───────────────────────────────────────────────

const SKELETON_ROWS = 5;

// ─── 组件 ───────────────────────────────────────────────

function NxTable<TData>({
  data,
  columns,
  getRowId,
  loading = false,
  emptyText,
  onRowClick,
  pagination,
  onPaginationChange,
  paginationInfoTemplate,
  previousLabel,
  nextLabel,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  batchActions,
  className,
}: NxTableProps<TData>) {
  // 当 rowSelection 受控时，自动插入 checkbox 列到最前面
  const finalColumns: ColumnDef<TData, unknown>[] =
    rowSelection !== undefined
      ? [
          {
            id: '__select',
            header: ({ table }) => (
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
          } satisfies ColumnDef<TData, unknown>,
          ...columns,
        ]
      : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),

    // 手动分页（服务端分页）
    manualPagination: true,
    pageCount: pagination?.totalPages ?? -1,

    // 手动排序（服务端排序）
    manualSorting: true,
    state: {
      sorting: sorting ?? [],
      rowSelection: rowSelection ?? {},
    },
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      const next = typeof updater === 'function' ? updater(sorting ?? []) : updater;
      onSortingChange(next);
    },
    onRowSelectionChange: (updater) => {
      if (!onRowSelectionChange) return;
      const next = typeof updater === 'function' ? updater(rowSelection ?? {}) : updater;
      onRowSelectionChange(next);
    },
    enableRowSelection: rowSelection !== undefined,
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const colCount = finalColumns.length;

  // 选中行数量
  const selectedCount = Object.keys(rowSelection ?? {}).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 批量操作栏 */}
      {batchActions && selectedCount > 0 && (
        <div className="flex items-center gap-2">{batchActions}</div>
      )}

      <Table>
        <TableHeader>
          {headerGroups.map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    className={cn(canSort && 'cursor-pointer select-none')}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {/* 排序指示符 */}
                    {sorted === 'asc' && ' ↑'}
                    {sorted === 'desc' && ' ↓'}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {/* loading 状态：skeleton 行 */}
          {loading &&
            Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
              // biome-ignore lint: 静态 skeleton 行用 index 做 key 是安全的
              <TableRow key={`skeleton-${rowIdx}`}>
                {Array.from({ length: colCount }).map((_, colIdx) => (
                  // biome-ignore lint: 同上
                  <TableCell key={`skeleton-${rowIdx}-${colIdx}`}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {/* 空状态 */}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                {emptyText}
              </TableCell>
            </TableRow>
          )}

          {/* 数据行 */}
          {!loading &&
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={(e) => {
                  if (!onRowClick) return;
                  // 排除 checkbox 列的点击
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-slot="checkbox"]')) return;
                  onRowClick(row.original);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {/* 分页栏 */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          {paginationInfoTemplate ? (
            <span className="text-sm text-muted-foreground">
              {paginationInfoTemplate
                .replace('{total}', String(pagination.totalElements))
                .replace('{page}', String(pagination.page))
                .replace('{pages}', String(pagination.totalPages))}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              {...(!previousLabel && { 'aria-label': 'previous page' })}
              disabled={pagination.page <= 1}
              onClick={() =>
                onPaginationChange?.({
                  ...pagination,
                  page: pagination.page - 1,
                })
              }
            >
              {previousLabel ?? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              {...(!nextLabel && { 'aria-label': 'next page' })}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                onPaginationChange?.({
                  ...pagination,
                  page: pagination.page + 1,
                })
              }
            >
              {nextLabel ?? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { NxTable };
export type { NxTableProps as NxTablePropsExport };
