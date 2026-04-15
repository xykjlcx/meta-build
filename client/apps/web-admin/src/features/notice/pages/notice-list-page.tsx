import {
  getList4QueryKey,
  getUnreadCountQueryKey,
  useBatchDelete,
  useBatchPublish,
  useDelete2,
  useDuplicate,
  useList4,
  usePublish,
  useRevoke,
} from '@mb/api-sdk/generated/endpoints/公告管理/公告管理';
import type { NoticeView } from '@mb/api-sdk/generated/models';
import { useCurrentUser } from '@mb/app-shell';
import { NxBar, NxTable } from '@mb/ui-patterns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BatchConfirmDialog } from '../components/batch-confirm-dialog';
import { NoticeDialog } from '../components/notice-dialog';
import { NoticeStatusBadge } from '../components/notice-status-badge';
import { NOTICE_STATUS, type NoticeStatusValue, PAGE_SIZE } from '../constants';

// ─── debounce hook ──────────────────────────────────────
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── 列表页组件 ─────────────────────────────────────────
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 列表页包含筛选/批量操作/权限条件渲染
export function NoticeListPage() {
  const { t } = useTranslation('notice');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ─── 筛选状态 ───────────────────────────────────────
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounced(keyword, 300);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 分页状态
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE });

  // 行选择状态
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Dialog 状态（新增/编辑）
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);

  // 单条操作确认框
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'publish' | 'revoke';
    id: number;
  } | null>(null);

  // 批量操作确认框
  const [batchConfirm, setBatchConfirm] = useState<{
    action: 'publish' | 'delete';
    total: number;
    valid: number;
    invalid: number;
    validIds: number[];
  } | null>(null);

  // ─── 数据查询 ───────────────────────────────────────
  const { data, isLoading } = useList4({
    status: statusFilter !== 'ALL' ? Number(statusFilter) : undefined,
    keyword: debouncedKeyword || undefined,
    page: pagination.page,
    size: pagination.size,
  });

  // 从响应中提取数据和分页信息
  const notices: NoticeView[] =
    (data as { data?: { content?: NoticeView[] } })?.data?.content ?? [];
  const totalElements = (data as { data?: { totalElements?: number } })?.data?.totalElements ?? 0;
  const totalPages = (data as { data?: { totalPages?: number } })?.data?.totalPages ?? 0;

  // ─── Mutations ──────────────────────────────────────
  const deleteMutation = useDelete2();
  const publishMutation = usePublish();
  const revokeMutation = useRevoke();
  const duplicateMutation = useDuplicate();
  const batchPublishMutation = useBatchPublish();
  const batchDeleteMutation = useBatchDelete();

  // 刷新列表和未读计数
  const invalidateNotices = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getList4QueryKey() });
    queryClient.invalidateQueries({ queryKey: getUnreadCountQueryKey() });
  }, [queryClient]);

  // ─── 单条操作 ───────────────────────────────────────
  const handleConfirmAction = useCallback(() => {
    if (!confirmAction) return;

    const { type, id } = confirmAction;
    const onSuccess = () => {
      invalidateNotices();
      setConfirmAction(null);
    };

    switch (type) {
      case 'delete':
        deleteMutation.mutate({ id }, { onSuccess });
        break;
      case 'publish':
        publishMutation.mutate({ id, data: { targets: [{ targetType: 'ALL' }] } }, { onSuccess });
        break;
      case 'revoke':
        revokeMutation.mutate({ id }, { onSuccess });
        break;
    }
  }, [confirmAction, deleteMutation, publishMutation, revokeMutation, invalidateNotices]);

  // 复制为新建
  const handleDuplicate = useCallback(
    (id: number) => {
      duplicateMutation.mutate(
        { id },
        {
          onSuccess: () => {
            invalidateNotices();
            toast.success(t('action.duplicate'));
          },
        },
      );
    },
    [duplicateMutation, invalidateNotices, t],
  );

  // ─── 批量操作 ───────────────────────────────────────
  const selectedIds = useMemo(() => Object.keys(rowSelection).map(Number), [rowSelection]);

  const handleBatchAction = useCallback(
    (action: 'publish' | 'delete') => {
      const selected = notices.filter((n) => selectedIds.includes(n.id ?? -1));
      let validItems: NoticeView[];
      if (action === 'publish') {
        validItems = selected.filter((n) => n.status === NOTICE_STATUS.DRAFT);
      } else {
        validItems = selected.filter(
          (n) => n.status === NOTICE_STATUS.DRAFT || n.status === NOTICE_STATUS.REVOKED,
        );
      }
      setBatchConfirm({
        action,
        total: selected.length,
        valid: validItems.length,
        invalid: selected.length - validItems.length,
        validIds: validItems.map((n) => n.id ?? 0),
      });
    },
    [notices, selectedIds],
  );

  const handleBatchConfirm = useCallback(() => {
    if (!batchConfirm) return;
    const { action, validIds } = batchConfirm;
    const onSuccess = () => {
      invalidateNotices();
      setRowSelection({});
      setBatchConfirm(null);
    };

    if (action === 'publish') {
      batchPublishMutation.mutate({ data: { ids: validIds } }, { onSuccess });
    } else {
      batchDeleteMutation.mutate({ data: { ids: validIds } }, { onSuccess });
    }
  }, [batchConfirm, batchPublishMutation, batchDeleteMutation, invalidateNotices]);

  // ─── 导出 ──────────────────────────────────────────
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    const qs = params.toString();
    window.open(`/api/v1/notices/export${qs ? `?${qs}` : ''}`, '_blank');
  }, [statusFilter, debouncedKeyword]);

  // ─── 新增/编辑 ─────────────────────────────────────
  const handleCreate = useCallback(() => {
    setEditingNoticeId(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setEditingNoticeId(id);
    setDialogOpen(true);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setDialogOpen(false);
    setEditingNoticeId(null);
    invalidateNotices();
  }, [invalidateNotices]);

  // ─── 筛选重置 ───────────────────────────────────────
  const handleReset = useCallback(() => {
    setKeyword('');
    setStatusFilter('ALL');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // ─── 表格列定义 ─────────────────────────────────────
  const columns = useMemo<ColumnDef<NoticeView, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: t('form.title'),
        cell: ({ row }) => {
          const notice = row.original;
          const isUnread = !notice.read;
          return (
            <div className="flex items-center gap-2">
              {/* 未读指示点 */}
              {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />}
              <Link
                to="/notices/$id"
                params={{ id: String(notice.id) }}
                className={cn('hover:underline', isUnread && 'font-semibold')}
                onClick={(e) => e.stopPropagation()}
              >
                {notice.pinned && <Pin className="mr-1 inline size-3.5 text-amber-500" />}
                {notice.title}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('filter.status'),
        cell: ({ getValue }) => <NoticeStatusBadge status={getValue<NoticeStatusValue>()} />,
      },
      {
        accessorKey: 'startTime',
        header: t('form.startTime'),
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? new Date(val).toLocaleDateString() : '-';
        },
      },
      {
        id: 'readRate',
        header: t('list.readRate'),
        cell: ({ row }) => {
          const notice = row.original;
          const readCount = notice.readCount ?? 0;
          const total = notice.recipientCount ?? 0;
          if (total === 0) return <span className="text-muted-foreground">—</span>;
          const pct = Math.round((readCount / total) * 100);
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdByName',
        header: () => t('common:creator', { defaultValue: '创建人' }),
      },
      {
        accessorKey: 'createdAt',
        header: () => t('common:createdAt', { defaultValue: '创建时间' }),
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? new Date(val).toLocaleString() : '-';
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('common:actions', { defaultValue: '操作' })}</span>
        ),
        cell: ({ row }) => {
          const notice = row.original;
          const status = notice.status as NoticeStatusValue;

          // 收集次要操作
          const secondaryActions: Array<{
            key: string;
            icon: typeof Send;
            label: string;
            onClick: () => void;
            destructive?: boolean;
          }> = [];

          if (status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:publish')) {
            secondaryActions.push({
              key: 'publish',
              icon: Send,
              label: t('action.publish'),
              onClick: () => setConfirmAction({ type: 'publish', id: notice.id ?? 0 }),
            });
          }
          if (
            (status === NOTICE_STATUS.PUBLISHED || status === NOTICE_STATUS.REVOKED) &&
            user.hasPermission('notice:notice:create')
          ) {
            secondaryActions.push({
              key: 'duplicate',
              icon: Copy,
              label: t('action.duplicate'),
              onClick: () => handleDuplicate(notice.id ?? 0),
            });
          }
          if (status === NOTICE_STATUS.PUBLISHED && user.hasPermission('notice:notice:publish')) {
            secondaryActions.push({
              key: 'revoke',
              icon: Undo2,
              label: t('action.revoke'),
              onClick: () => setConfirmAction({ type: 'revoke', id: notice.id ?? 0 }),
            });
          }
          if (
            (status === NOTICE_STATUS.DRAFT || status === NOTICE_STATUS.REVOKED) &&
            user.hasPermission('notice:notice:delete')
          ) {
            secondaryActions.push({
              key: 'delete',
              icon: Trash2,
              label: t('action.delete'),
              onClick: () => setConfirmAction({ type: 'delete', id: notice.id ?? 0 }),
              destructive: true,
            });
          }

          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: 操作列 stopPropagation 防止触发行点击
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 主操作：草稿→编辑，其他→详情 */}
              {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:update') ? (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-primary"
                  onClick={() => handleEdit(notice.id ?? 0)}
                >
                  {t('action.edit')}
                </Button>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-primary"
                  onClick={() =>
                    navigate({ to: '/notices/$id', params: { id: String(notice.id) } })
                  }
                >
                  {t('detail.title')}
                </Button>
              )}

              {/* ⋯ 下拉次要操作 */}
              {secondaryActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <DropdownMenuItem
                          key={action.key}
                          className={action.destructive ? 'text-destructive' : undefined}
                          onClick={action.onClick}
                        >
                          <Icon className="mr-2 size-4" />
                          {action.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        },
      },
    ],
    [t, user, navigate, handleEdit, handleDuplicate],
  );

  // ─── 渲染 ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{t('breadcrumb.system')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('breadcrumb.notice')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面 Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.hasPermission('notice:notice:export') && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 size-4" />
              {t('list.export')}
            </Button>
          )}
          {user.hasPermission('notice:notice:create') && (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-1 size-4" />
              {t('action.create')}
            </Button>
          )}
        </div>
      </div>

      {/* 即时筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('filter.searchPlaceholder')}
            className="w-64 pl-9"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          />
        </div>

        {/* 状态下拉 */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('filter.allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('filter.allStatus')}</SelectItem>
            <SelectItem value="0">{t('status.draft')}</SelectItem>
            <SelectItem value="1">{t('status.published')}</SelectItem>
            <SelectItem value="2">{t('status.revoked')}</SelectItem>
          </SelectContent>
        </Select>

        {/* 重置按钮 */}
        <Button variant="link" size="sm" onClick={handleReset}>
          {t('filter.reset')}
        </Button>
      </div>

      {/* Card 包裹表格 + 分页 */}
      <Card>
        <CardContent className="p-0">
          <NxTable
            data={notices}
            columns={columns}
            getRowId={(row) => String(row.id)}
            loading={isLoading}
            emptyText={t('list.empty')}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onRowClick={(row) => navigate({ to: '/notices/$id', params: { id: String(row.id) } })}
            className="[&_thead_tr]:bg-muted/50"
          />

          {/* 自定义分页栏 */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length > 0
                ? t('pagination.selected', { selected: selectedIds.length, total: totalElements })
                : t('pagination.total', { total: totalElements })}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t('pagination.perPage')}</span>
              <Select
                value={String(pagination.size)}
                onValueChange={(v) => setPagination({ size: Number(v), page: 1 })}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                {t('pagination.pageInfo', {
                  page: pagination.page,
                  pages: totalPages || 1,
                })}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={pagination.page >= totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作栏 */}
      <NxBar
        selectedCount={selectedIds.length}
        selectedTemplate={t('batch.selected', { count: selectedIds.length })}
        onClear={() => setRowSelection({})}
        clearLabel={t('batch.clear')}
        fixed
        actions={
          <>
            {user.hasPermission('notice:notice:publish') && (
              <Button size="sm" onClick={() => handleBatchAction('publish')}>
                {t('batch.publish')}
              </Button>
            )}
            {user.hasPermission('notice:notice:delete') && (
              <Button size="sm" variant="destructive" onClick={() => handleBatchAction('delete')}>
                {t('batch.delete')}
              </Button>
            )}
          </>
        }
      />

      {/* 新增/编辑弹窗 */}
      <NoticeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        noticeId={editingNoticeId}
        onSuccess={handleDialogSuccess}
      />

      {/* 单条操作确认框 */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete' && t('action.delete')}
              {confirmAction?.type === 'publish' && t('action.publish')}
              {confirmAction?.type === 'revoke' && t('action.revoke')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete' && t('confirm.delete')}
              {confirmAction?.type === 'publish' && t('confirm.publish')}
              {confirmAction?.type === 'revoke' && t('confirm.revoke')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction?.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
            >
              {confirmAction?.type === 'delete' && t('action.delete')}
              {confirmAction?.type === 'publish' && t('action.publish')}
              {confirmAction?.type === 'revoke' && t('action.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量操作确认框 */}
      {batchConfirm && (
        <BatchConfirmDialog
          open={!!batchConfirm}
          onOpenChange={(open) => !open && setBatchConfirm(null)}
          action={batchConfirm.action}
          total={batchConfirm.total}
          valid={batchConfirm.valid}
          invalid={batchConfirm.invalid}
          onConfirm={handleBatchConfirm}
        />
      )}
    </div>
  );
}
