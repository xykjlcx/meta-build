import {
  type NoticeTarget,
  type NoticeVo,
  noticeApi,
  noticeQueryKeys,
  useBatchDeleteNotices,
  useBatchPublishNotices,
  useDeleteNotice,
  useDuplicateNotice,
  useNoticeList,
  usePublishNotice,
  useRevokeNotice,
} from '@mb/api-sdk';
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
  Button,
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
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
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
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BatchConfirmDialog } from '../components/batch-confirm-dialog';
import { NoticeStatusBadge } from '../components/notice-status-badge';
import { TargetSelector } from '../components/target-selector';
import { NOTICE_STATUS, type NoticeStatusValue, PAGE_SIZE } from '../constants';

const NoticeDialog = lazy(async () => ({
  default: (await import('../components/notice-dialog')).NoticeDialog,
}));

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
  const search = useSearch({ from: '/_authed/notices/' });
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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [publishTargetNoticeId, setPublishTargetNoticeId] = useState<number | null>(null);

  // 批量操作确认框
  const [batchConfirm, setBatchConfirm] = useState<{
    action: 'publish' | 'delete';
    total: number;
    valid: number;
    invalid: number;
    validIds: number[];
  } | null>(null);

  // ─── 数据查询 ───────────────────────────────────────
  const { data, isLoading } = useNoticeList({
    status: statusFilter !== 'ALL' ? Number(statusFilter) : undefined,
    keyword: debouncedKeyword || undefined,
    page: pagination.page,
    size: pagination.size,
  });

  // 从响应中提取数据和分页信息
  const notices: NoticeVo[] = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  // ─── Mutations ──────────────────────────────────────
  const deleteMutation = useDeleteNotice();
  const publishMutation = usePublishNotice();
  const revokeMutation = useRevokeNotice();
  const duplicateMutation = useDuplicateNotice();
  const batchPublishMutation = useBatchPublishNotices();
  const batchDeleteMutation = useBatchDeleteNotices();

  // 刷新列表和未读计数
  const invalidateNotices = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
    queryClient.invalidateQueries({ queryKey: noticeQueryKeys.unreadCount() });
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
      case 'revoke':
        revokeMutation.mutate({ id }, { onSuccess });
        break;
    }
  }, [confirmAction, deleteMutation, revokeMutation, invalidateNotices]);

  const handlePublishRequest = useCallback((id: number) => {
    setPublishTargetNoticeId(id);
  }, []);

  const handlePublishTargetsConfirm = useCallback(
    (targets: NoticeTarget[]) => {
      if (!publishTargetNoticeId) return;

      publishMutation.mutate(
        { id: publishTargetNoticeId, data: { targets } },
        {
          onSuccess: () => {
            invalidateNotices();
            setPublishTargetNoticeId(null);
            toast.success(t('action.publish'));
          },
        },
      );
    },
    [invalidateNotices, publishMutation, publishTargetNoticeId, t],
  );

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
      let validItems: NoticeVo[];
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
    const exportParams = {
      status: statusFilter !== 'ALL' ? Number(statusFilter) : undefined,
      keyword: debouncedKeyword || undefined,
    };
    void noticeApi.downloadExport(exportParams);
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
    if (search.edit) {
      navigate({ to: '/notices', search: { edit: undefined }, replace: true });
    }
  }, [invalidateNotices, navigate, search.edit]);

  useEffect(() => {
    if (search.edit && Number.isFinite(search.edit)) {
      setEditingNoticeId(search.edit);
      setDialogOpen(true);
    }
  }, [search.edit]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open && search.edit) {
        setEditingNoticeId(null);
        navigate({ to: '/notices', search: { edit: undefined }, replace: true });
      }
    },
    [navigate, search.edit],
  );

  // ─── 筛选重置 ───────────────────────────────────────
  const handleReset = useCallback(() => {
    setKeyword('');
    setStatusFilter('ALL');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // ─── 表格列定义 ─────────────────────────────────────
  const columns = useMemo<ColumnDef<NoticeVo, unknown>[]>(
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
              {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
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
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
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
        cell: ({ row }) => (
          <NoticeRowActions
            notice={row.original}
            t={t as Translate}
            user={user}
            navigateToDetail={(id) => navigate({ to: '/notices/$id', params: { id: String(id) } })}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onPublish={handlePublishRequest}
            onConfirmAction={(action) => setConfirmAction(action)}
          />
        ),
      },
    ],
    [t, user, navigate, handleEdit, handleDuplicate, handlePublishRequest],
  );

  // ─── 渲染 ──────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* 页面标题（对齐飞书列表页：单行标题，无副标题）*/}
      <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>

      {/* 工具栏：筛选 + 操作按钮同一行（飞书列表页风格，减少垂直空间占用）*/}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* 左侧筛选区 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="notice-search-input"
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
            <SelectTrigger className="w-36" data-testid="notice-status-filter">
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

        {/* 右侧操作按钮区 */}
        <div className="flex items-center gap-2">
          {user.hasPermission('notice:notice:export') && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 size-4" />
              {t('list.export')}
            </Button>
          )}
          {user.hasPermission('notice:notice:create') && (
            <Button size="sm" onClick={handleCreate} data-testid="notice-create-button">
              <Plus className="mr-1 size-4" />
              {t('action.create')}
            </Button>
          )}
        </div>
      </div>

      {/* 表格 + 分页（无 Card 外框，直接贴 main 白底，对齐飞书列表风格）*/}
      <div>
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
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length > 0
              ? t('pagination.selected', { selected: selectedIds.length, total: totalElements })
              : t('pagination.total', { total: totalElements })}
          </span>
          <div className="flex items-center gap-3 text-sm">
            <Select
              value={String(pagination.size)}
              onValueChange={(v) => setPagination({ size: Number(v), page: 1 })}
            >
              <SelectTrigger size="sm" className="min-w-[6.5rem]">
                <SelectValue>
                  {t('pagination.perPageOption', { size: pagination.size })}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">{t('pagination.perPageOption', { size: 10 })}</SelectItem>
                <SelectItem value="20">{t('pagination.perPageOption', { size: 20 })}</SelectItem>
                <SelectItem value="50">{t('pagination.perPageOption', { size: 50 })}</SelectItem>
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
              size="icon-sm"
              data-testid="notice-pagination-prev"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              data-testid="notice-pagination-next"
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

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
      {dialogOpen && (
        <Suspense fallback={null}>
          <NoticeDialog
            open={dialogOpen}
            onOpenChange={handleDialogOpenChange}
            noticeId={editingNoticeId}
            onSuccess={handleDialogSuccess}
          />
        </Suspense>
      )}

      {/* 单条操作确认框 */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete' && t('action.delete')}
              {confirmAction?.type === 'revoke' && t('action.revoke')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete' && t('confirm.delete')}
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
              {confirmAction?.type === 'revoke' && t('action.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TargetSelector
        open={publishTargetNoticeId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPublishTargetNoticeId(null);
          }
        }}
        onConfirm={handlePublishTargetsConfirm}
      />

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

type ConfirmAction = {
  type: 'delete' | 'revoke';
  id: number;
};

interface NoticeRowAction {
  key: string;
  icon: typeof Send;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function NoticeRowActions({
  notice,
  t,
  user,
  navigateToDetail,
  onEdit,
  onDuplicate,
  onPublish,
  onConfirmAction,
}: {
  notice: NoticeVo;
  t: Translate;
  user: ReturnType<typeof useCurrentUser>;
  navigateToDetail: (id: number) => void;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  onPublish: (id: number) => void;
  onConfirmAction: (action: ConfirmAction) => void;
}) {
  const noticeId = notice.id ?? 0;
  const status = notice.status as NoticeStatusValue;
  const secondaryActions = buildSecondaryActions({
    noticeId,
    status,
    t,
    user,
    onDuplicate,
    onPublish,
    onConfirmAction,
  });

  const primaryAction =
    status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:update')
      ? {
          label: t('action.edit'),
          onClick: () => onEdit(noticeId),
          testId: `notice-action-edit-${noticeId}`,
        }
      : {
          label: t('detail.title'),
          onClick: () => navigateToDetail(noticeId),
          testId: `notice-action-detail-${noticeId}`,
        };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: 操作列 stopPropagation 防止触发行点击
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-primary"
        onClick={primaryAction.onClick}
        data-testid={primaryAction.testId}
      >
        {primaryAction.label}
      </Button>

      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t('common:actions', { defaultValue: '操作' })}
              data-testid={`notice-actions-menu-${noticeId}`}
            >
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
                  data-testid={`notice-action-${action.key}-${noticeId}`}
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
}

function buildSecondaryActions({
  noticeId,
  status,
  t,
  user,
  onDuplicate,
  onPublish,
  onConfirmAction,
}: {
  noticeId: number;
  status: NoticeStatusValue;
  t: Translate;
  user: ReturnType<typeof useCurrentUser>;
  onDuplicate: (id: number) => void;
  onPublish: (id: number) => void;
  onConfirmAction: (action: ConfirmAction) => void;
}): NoticeRowAction[] {
  const actions: NoticeRowAction[] = [];

  if (status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:publish')) {
    actions.push({
      key: 'publish',
      icon: Send,
      label: t('action.publish'),
      onClick: () => onPublish(noticeId),
    });
  }

  if (
    (status === NOTICE_STATUS.PUBLISHED || status === NOTICE_STATUS.REVOKED) &&
    user.hasPermission('notice:notice:create')
  ) {
    actions.push({
      key: 'duplicate',
      icon: Copy,
      label: t('action.duplicate'),
      onClick: () => onDuplicate(noticeId),
    });
  }

  if (status === NOTICE_STATUS.PUBLISHED && user.hasPermission('notice:notice:publish')) {
    actions.push({
      key: 'revoke',
      icon: Undo2,
      label: t('action.revoke'),
      onClick: () => onConfirmAction({ type: 'revoke', id: noticeId }),
    });
  }

  if (
    (status === NOTICE_STATUS.DRAFT || status === NOTICE_STATUS.REVOKED) &&
    user.hasPermission('notice:notice:delete')
  ) {
    actions.push({
      key: 'delete',
      icon: Trash2,
      label: t('action.delete'),
      onClick: () => onConfirmAction({ type: 'delete', id: noticeId }),
      destructive: true,
    });
  }

  return actions;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;
