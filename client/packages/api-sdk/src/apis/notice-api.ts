import { getClient } from '../config';
import {
  deleteNoticeBatch,
  deleteNoticeById,
  getGetNoticeByIdQueryKey,
  getGetNoticeByIdRecipientQueryKey,
  getGetNoticeExportUrl,
  getGetNoticeQueryKey,
  getGetNoticeUnreadCountQueryKey,
  getNotice,
  getNoticeById,
  getNoticeByIdRecipient,
  getNoticeUnreadCount,
  postNotice,
  postNoticeBatchPublish,
  postNoticeByIdDuplicate,
  postNoticeByIdPublish,
  postNoticeByIdRevoke,
  putNoticeById,
  putNoticeByIdRead,
  useDeleteNoticeBatch,
  useDeleteNoticeById,
  useGetNotice,
  useGetNoticeById,
  useGetNoticeByIdRecipient,
  useGetNoticeUnreadCount,
  usePostNotice,
  usePostNoticeBatchPublish,
  usePostNoticeByIdDuplicate,
  usePostNoticeByIdPublish,
  usePostNoticeByIdRevoke,
  usePutNoticeById,
  usePutNoticeByIdRead,
} from '../generated/endpoints/公告管理/公告管理';
import {
  getGetNotificationLogQueryKey,
  getNotificationLog,
  useGetNotificationLog,
} from '../generated/endpoints/通知发送记录/通知发送记录';
import type {
  BatchIdsCommand,
  BatchResultView,
  NoticeDetailView as GeneratedNoticeDetailView,
  NoticeTarget as GeneratedNoticeTarget,
  NoticeView as GeneratedNoticeView,
  NotificationLogView as GeneratedNotificationLogView,
  RecipientView as GeneratedRecipientView,
  GetNoticeByIdRecipientParams,
  GetNoticeExportParams,
  GetNoticeParams,
  GetNoticeUnreadCount200,
  NoticeCreateCommand,
  NoticePublishCommand,
  NoticeUpdateCommand,
} from '../generated/models';
import { triggerDownload } from '../http-client';

export type NoticeView = GeneratedNoticeView;
export type NoticeDetailView = GeneratedNoticeDetailView;
export type NoticeTarget = GeneratedNoticeTarget;
export type RecipientView = GeneratedRecipientView;
export type NotificationLogView = GeneratedNotificationLogView;
export type NoticeListParams = GetNoticeParams;
export type NoticeRecipientsParams = GetNoticeByIdRecipientParams;
export type NoticeCreateInput = NoticeCreateCommand;
export type NoticeUpdateInput = NoticeUpdateCommand;
export type NoticePublishInput = NoticePublishCommand;
export type NoticeBatchInput = BatchIdsCommand;
export type NoticeBatchResult = BatchResultView;
export type NoticeUnreadCount = GetNoticeUnreadCount200;
export type NoticeExportParams = GetNoticeExportParams;

export const noticeQueryKeys = {
  list: getGetNoticeQueryKey,
  detail: getGetNoticeByIdQueryKey,
  recipients: getGetNoticeByIdRecipientQueryKey,
  unreadCount: getGetNoticeUnreadCountQueryKey,
  notificationLogs: (noticeId: number) =>
    getGetNotificationLogQueryKey({ module: 'notice', referenceId: String(noticeId) }),
};

export const noticeApi = {
  list: getNotice,
  detail: getNoticeById,
  create: postNotice,
  update: putNoticeById,
  remove: deleteNoticeById,
  publish: postNoticeByIdPublish,
  revoke: postNoticeByIdRevoke,
  duplicate: postNoticeByIdDuplicate,
  batchPublish: postNoticeBatchPublish,
  batchDelete: deleteNoticeBatch,
  recipients: getNoticeByIdRecipient,
  getUnreadCount: getNoticeUnreadCount,
  async exportFile(params?: NoticeExportParams): Promise<Blob> {
    return getClient().request<Blob>(getGetNoticeExportUrl(params), {
      method: 'GET',
      responseType: 'blob',
    });
  },
  async downloadExport(params?: NoticeExportParams, filename = 'notices.xlsx'): Promise<void> {
    const blob = await noticeApi.exportFile(params);
    triggerDownload(blob, filename);
  },
  markRead: putNoticeByIdRead,
  notificationLogs(noticeId: number) {
    return getNotificationLog({ module: 'notice', referenceId: String(noticeId) });
  },
};

export const useNoticeList = useGetNotice;
export const useNoticeDetail = useGetNoticeById;
export const useCreateNotice = usePostNotice;
export const useUpdateNotice = usePutNoticeById;
export const useDeleteNotice = useDeleteNoticeById;
export const usePublishNotice = usePostNoticeByIdPublish;
export const useRevokeNotice = usePostNoticeByIdRevoke;
export const useDuplicateNotice = usePostNoticeByIdDuplicate;
export const useBatchPublishNotices = usePostNoticeBatchPublish;
export const useBatchDeleteNotices = useDeleteNoticeBatch;
export const useNoticeRecipients = useGetNoticeByIdRecipient;
export const useUnreadNoticeCount = useGetNoticeUnreadCount;
export const useMarkNoticeRead = usePutNoticeByIdRead;
export function useNoticeNotificationLogs(noticeId: number) {
  return useGetNotificationLog(
    { module: 'notice', referenceId: String(noticeId) },
    {
      query: {
        enabled: noticeId > 0,
        queryKey: noticeQueryKeys.notificationLogs(noticeId),
      },
    },
  );
}
