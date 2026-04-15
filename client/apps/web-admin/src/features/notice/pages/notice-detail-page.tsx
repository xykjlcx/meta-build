import { triggerDownload } from '@mb/api-sdk';
import {
  getDetailQueryKey,
  getList4QueryKey,
  getUnreadCountQueryKey,
  useDelete2,
  useDetail,
  useDuplicate,
  useMarkRead,
  usePublish,
  useRevoke,
} from '@mb/api-sdk/generated/endpoints/公告管理/公告管理';
import type { NoticeDetailView, NoticeTarget } from '@mb/api-sdk/generated/models';
import { useCurrentUser } from '@mb/app-shell';
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
  Card,
  CardContent,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Copy, Download, FilePenLine, Pin, Send, Trash2, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { NoticeStatusBadge } from '../components/notice-status-badge';
import { NotificationLogTab } from '../components/notification-log-tab';
import { RecipientsTab } from '../components/recipients-tab';
import { TargetSelector } from '../components/target-selector';
import { NOTICE_STATUS, type NoticeStatusValue } from '../constants';
import { sanitizeHtml } from '../utils/sanitize';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 详情页包含多状态操作按钮的条件渲染
export function NoticeDetailPage() {
  const { t } = useTranslation('notice');
  const user = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams({ from: '/_authed/notices/$id' });
  const noticeId = Number(id);

  // 查询详情
  const { data: detailResponse, isLoading } = useDetail(noticeId, {
    query: { queryKey: getDetailQueryKey(noticeId) },
  });

  // orval 响应结构：{ data: NoticeDetailView, status, headers }
  const notice: NoticeDetailView | undefined = detailResponse;

  // 标记已读 — 使用 ref 避免 exhaustive-deps 重复触发
  const markReadMutation = useMarkRead();
  const markedRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: 当 noticeId 变化时重置标记
  useEffect(() => {
    markedRef.current = false;
  }, [noticeId]);
  useEffect(() => {
    if (noticeId && notice && !notice.read && !markedRef.current) {
      markedRef.current = true;
      markReadMutation.mutate(
        { id: noticeId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getUnreadCountQueryKey() });
            queryClient.invalidateQueries({ queryKey: getDetailQueryKey(noticeId) });
            queryClient.invalidateQueries({ queryKey: getList4QueryKey() });
          },
        },
      );
    }
  }, [noticeId, notice, markReadMutation, queryClient]);

  // Mutations
  const deleteMutation = useDelete2();
  const publishMutation = usePublish();
  const revokeMutation = useRevoke();
  const duplicateMutation = useDuplicate();

  // 确认框
  const [confirmAction, setConfirmAction] = useState<'delete' | 'revoke' | null>(null);
  const [targetSelectorOpen, setTargetSelectorOpen] = useState(false);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getList4QueryKey() });
    queryClient.invalidateQueries({ queryKey: getUnreadCountQueryKey() });
    queryClient.invalidateQueries({ queryKey: getDetailQueryKey(noticeId) });
  }, [queryClient, noticeId]);

  // 操作处理
  const handleDelete = useCallback(() => {
    deleteMutation.mutate(
      { id: noticeId },
      {
        onSuccess: () => {
          invalidateAll();
          navigate({ to: '/notices', search: { edit: undefined } });
        },
      },
    );
    setConfirmAction(null);
  }, [deleteMutation, noticeId, invalidateAll, navigate]);

  const handleRevoke = useCallback(() => {
    revokeMutation.mutate({ id: noticeId }, { onSuccess: invalidateAll });
    setConfirmAction(null);
  }, [revokeMutation, noticeId, invalidateAll]);

  const handlePublish = useCallback(
    (targets: NoticeTarget[]) => {
      publishMutation.mutate(
        { id: noticeId, data: { targets } },
        {
          onSuccess: () => {
            invalidateAll();
            toast.success(t('action.publish'));
          },
        },
      );
    },
    [publishMutation, noticeId, invalidateAll, t],
  );

  const handleDuplicate = useCallback(() => {
    duplicateMutation.mutate(
      { id: noticeId },
      {
        onSuccess: (result) => {
          invalidateAll();
          toast.success(t('action.duplicate'));
          const newId = result?.id;
          if (newId) {
            navigate({ to: '/notices/$id', params: { id: String(newId) } });
          }
        },
      },
    );
  }, [duplicateMutation, noticeId, invalidateAll, navigate, t]);

  // 附件下载
  const handleDownloadAttachment = useCallback(
    async (fileId: number, fileName: string) => {
      try {
        const response = await fetch(`/api/v1/files/${fileId}/download`);
        const blob = await response.blob();
        triggerDownload(blob, fileName);
      } catch {
        toast.error(t('upload.downloadFailed'));
      }
    },
    [t],
  );

  if (isLoading || !notice) {
    return <div className="p-6">{t('common:loading', { defaultValue: '加载中...' })}</div>;
  }

  const status = notice.status as NoticeStatusValue;

  return (
    <div className="space-y-6">
      {/* Header：返回按钮 + 标题 + 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('detail.backToList')}
            onClick={() => navigate({ to: '/notices', search: { edit: undefined } })}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">{t('detail.title')}</h1>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 编辑 — 仅草稿 */}
          {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:update') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/notices', search: { edit: noticeId } })}
            >
              <FilePenLine className="mr-1 size-4" />
              {t('action.edit')}
            </Button>
          )}

          {/* 发布 — 仅草稿 */}
          {status === NOTICE_STATUS.DRAFT && user.hasPermission('notice:notice:publish') && (
            <Button size="sm" onClick={() => setTargetSelectorOpen(true)}>
              <Send className="mr-1 size-4" />
              {t('action.publish')}
            </Button>
          )}

          {/* 撤回 — 仅已发布 */}
          {status === NOTICE_STATUS.PUBLISHED && user.hasPermission('notice:notice:publish') && (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction('revoke')}>
              <Undo2 className="mr-1 size-4" />
              {t('action.revoke')}
            </Button>
          )}

          {/* 复制为新建 — 已发布/已撤回 */}
          {(status === NOTICE_STATUS.PUBLISHED || status === NOTICE_STATUS.REVOKED) &&
            user.hasPermission('notice:notice:create') && (
              <Button variant="outline" size="sm" onClick={handleDuplicate}>
                <Copy className="mr-1 size-4" />
                {t('action.duplicate')}
              </Button>
            )}

          {/* 删除 — 草稿/已撤回 */}
          {(status === NOTICE_STATUS.DRAFT || status === NOTICE_STATUS.REVOKED) &&
            user.hasPermission('notice:notice:delete') && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmAction('delete')}>
                <Trash2 className="mr-1 size-4" />
                {t('action.delete')}
              </Button>
            )}
        </div>
      </div>

      {/* 内容 Card */}
      <Card>
        <CardContent className="p-6">
          {/* 元信息区 */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              {notice.pinned && <Pin className="size-4 text-amber-500" />}
              <h2 className="text-xl font-semibold">{notice.title}</h2>
              <NoticeStatusBadge status={status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {notice.createdByName && (
                <span>
                  {t('detail.createdBy')}: {notice.createdByName}
                </span>
              )}
              {notice.createdAt && (
                <span>
                  {t('detail.createdAt')}: {new Date(notice.createdAt).toLocaleString()}
                </span>
              )}
              {notice.startTime && (
                <span>
                  {t('form.startTime')}: {new Date(notice.startTime).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* 富文本内容 — DOMPurify 净化 */}
          <div
            className="prose prose-sm max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 已通过 DOMPurify 净化
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(notice.content ?? '') }}
          />

          {/* 附件列表 */}
          {notice.attachments && notice.attachments.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('detail.attachments')}</h3>
                <div className="flex flex-wrap gap-2">
                  {notice.attachments.map((att) => (
                    <Button
                      key={att.fileId}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownloadAttachment(att.fileId ?? 0, `attachment_${att.fileId}`)
                      }
                    >
                      <Download className="mr-1.5 size-3.5" />
                      {t('form.attachments')} #{att.sortOrder ?? att.fileId}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tab 区：接收人 + 发送记录 */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="recipients">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-2">
              <TabsTrigger value="recipients">{t('detail.recipients')}</TabsTrigger>
              <TabsTrigger value="log">{t('detail.notificationLog')}</TabsTrigger>
            </TabsList>
            <TabsContent value="recipients" className="p-4">
              <RecipientsTab noticeId={noticeId} />
            </TabsContent>
            <TabsContent value="log" className="p-4">
              <NotificationLogTab noticeId={noticeId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 目标选择器 */}
      <TargetSelector
        open={targetSelectorOpen}
        onOpenChange={setTargetSelectorOpen}
        onConfirm={handlePublish}
      />

      {/* 确认框 */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'delete' ? t('action.delete') : t('action.revoke')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete' ? t('confirm.delete') : t('confirm.revoke')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction === 'delete' ? handleDelete : handleRevoke}
            >
              {confirmAction === 'delete' ? t('action.delete') : t('action.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
