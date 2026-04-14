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
import { NxBar, NxFilter, NxFilterField, NxTable } from '@mb/ui-patterns';
import type { NxTablePagination } from '@mb/ui-patterns';
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
import { Copy, Download, Eye, FilePenLine, Pin, Plus, Send, Trash2, Undo2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BatchConfirmDialog } from '../components/batch-confirm-dialog';
import { NoticeDrawer } from '../components/notice-drawer';
import { NoticeStatusBadge } from '../components/notice-status-badge';
import { NOTICE_STATUS, type NoticeStatusValue, PAGE_SIZE } from '../constants';

// ─── 筛选类型 ───────────────────────────────────────────
interface NoticeFilter {
  [key: string]: unknown;
  status: string;
  keyword: string;
  startTimeFrom: string;
  startTimeTo: string;
}

const DEFAULT_FILTER: NoticeFilter = {
  status: '',
  keyword: '',
  startTimeFrom: '',
  startTimeTo: '',
};

// ─── 列表页组件 ─────────────────────────────────────────
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 列表页包含筛选/批量操作/权限条件渲染
export function NoticeListPage() {
  const { t } = useTranslation('notice');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 筛选状态
  const [filter, setFilter] = useState<NoticeFilter>(DEFAULT_FILTER);

  // 分页状态
  const [pagination, setPagination] = useState<NxTablePagination>({
    page: 1,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  // 行选择状态
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Drawer 状态（新增/编辑）
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    status: filter.status ? Number(filter.status) : undefined,
    keyword: filter.keyword || undefined,
    startTimeFrom: filter.startTimeFrom || undefined,
    startTimeTo: filter.startTimeTo || undefined,
    page: pagination.page,
    size: pagination.size,
  });

  // 从响应中提取数据和分页信息
  const notices: NoticeView[] =
    (data as { data?: { content?: NoticeView[] } })?.data?.content ?? [];
  const totalElements = (data as { data?: { totalElements?: number } })?.data?.totalElements ?? 0;
  const totalPages = (data as { data?: { totalPages?: number } })?.data?.totalPages ?? 0;

  // 同步分页信息
  const currentPagination = useMemo(
    () => ({
      ...pagination,
      totalElements,
      totalPages,
    }),
    [pagination, totalElements, totalPages],
  );

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
    if (filter.status) params.set('status', filter.status);
    if (filter.keyword) params.set('keyword', filter.keyword);
    if (filter.startTimeFrom) params.set('startTimeFrom', filter.startTimeFrom);
    if (filter.startTimeTo) params.set('startTimeTo', filter.startTimeTo);
    const qs = params.toString();
    window.open(`/api/v1/notices/export${qs ? `?${qs}` : ''}`, '_blank');
  }, [filter]);

  // ─── 新增/编辑 ─────────────────────────────────────
  const handleCreate = useCallback(() => {
    setEditingNoticeId(null);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setEditingNoticeId(id);
    setDrawerOpen(true);
  }, []);

  const handleDrawerSuccess = useCallback(() => {
    setDrawerOpen(false);
    setEditingNoticeId(null);
    invalidateNotices();
  }, [invalidateNotices]);

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
            <Link
              to="/notices/$id"
              params={{ id: String(notice.id) }}
              className={cn('hover:underline', isUnread && 'font-bold')}
            >
              {notice.pinned && <Pin className="mr-1 inline size-3.5 text-amber-500" />}
              {notice.title}
            </Link>
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
        header: t('read.readLabel'),
        cell: ({ row }) => {
          const notice = row.original;
          if (
            notice.readCount !== undefined &&
            notice.recipientCount !== undefined &&
            notice.recipientCount > 0
          ) {
            return t('read.readRate', {
              read: notice.readCount,
              total: notice.recipientCount,
            });
          }
          return notice.read ? t('read.readLabel') : t('read.unread');
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
        header: '',
        cell: ({ row }) => {
          const notice = row.original;
          const status = notice.status as NoticeStatusValue;
          return (
            <div className="flex items-center gap-1">
              {/* 详情 — 所有状态可查看 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/notices/$id', params: { id: String(notice.id) } })}
              >
                <Eye className="size-4" />
              </Button>

              {/* 编辑 — 仅草稿 */}
              {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:update') && (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(notice.id ?? 0)}>
                  <FilePenLine className="size-4" />
                </Button>
              )}

              {/* 发布 — 仅草稿 */}
              {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:publish') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmAction({ type: 'publish', id: notice.id ?? 0 })}
                >
                  <Send className="size-4" />
                </Button>
              )}

              {/* 撤回 — 仅已发布 */}
              {status === NOTICE_STATUS.PUBLISHED &&
                user.hasPermission('notice:notice:publish') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAction({ type: 'revoke', id: notice.id ?? 0 })}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                )}

              {/* 复制为新建 — 已发布/已撤回 */}
              {(status === NOTICE_STATUS.PUBLISHED || status === NOTICE_STATUS.REVOKED) &&
                user.hasPermission('notice:notice:create') && (
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(notice.id ?? 0)}>
                    <Copy className="size-4" />
                  </Button>
                )}

              {/* 删除 — 草稿/已撤回 */}
              {(status === NOTICE_STATUS.DRAFT || status === NOTICE_STATUS.REVOKED) &&
                user.hasPermission('notice:notice:delete') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmAction({ type: 'delete', id: notice.id ?? 0 })}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
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
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('list.title')}</h1>
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

      {/* 筛选栏 */}
      <NxFilter
        value={filter}
        defaultValue={DEFAULT_FILTER}
        onChange={(next) => {
          setFilter(next as NoticeFilter);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        resetLabel={t('filter.reset')}
        applyLabel={t('filter.search')}
      >
        <NxFilterField name="status" label={t('filter.status')}>
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('filter.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('common:all', { defaultValue: '全部' })}</SelectItem>
              <SelectItem value="0">{t('status.draft')}</SelectItem>
              <SelectItem value="1">{t('status.published')}</SelectItem>
              <SelectItem value="2">{t('status.revoked')}</SelectItem>
            </SelectContent>
          </Select>
        </NxFilterField>
        <NxFilterField name="keyword" label={t('filter.keyword')}>
          <Input placeholder={t('filter.keyword')} className="w-48" />
        </NxFilterField>
        <NxFilterField name="startTimeFrom" label={t('filter.startTimeFrom')}>
          <Input type="date" className="w-40" />
        </NxFilterField>
        <NxFilterField name="startTimeTo" label={t('filter.startTimeTo')}>
          <Input type="date" className="w-40" />
        </NxFilterField>
      </NxFilter>

      {/* 数据表格 */}
      <NxTable
        data={notices}
        columns={columns}
        getRowId={(row) => String(row.id)}
        loading={isLoading}
        emptyText={t('list.empty')}
        pagination={currentPagination}
        onPaginationChange={setPagination}
        paginationInfoTemplate={t('pagination.info', {
          total: currentPagination.totalElements,
          page: currentPagination.page,
          pages: currentPagination.totalPages,
        })}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={(row) => navigate({ to: '/notices/$id', params: { id: String(row.id) } })}
      />

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

      {/* 新增/编辑抽屉 */}
      <NoticeDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        noticeId={editingNoticeId}
        onSuccess={handleDrawerSuccess}
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
