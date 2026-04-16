import { type NotificationLogVo, useNoticeNotificationLogs } from '@mb/api-sdk';
import { NxTable } from '@mb/ui-patterns';
import { Badge } from '@mb/ui-primitives';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationLogTabProps {
  noticeId: number;
}

const STATUS_VARIANT: Record<number, 'secondary' | 'default' | 'destructive'> = {
  0: 'secondary',
  1: 'default',
  2: 'destructive',
};

export function NotificationLogTab({ noticeId }: NotificationLogTabProps) {
  const { t } = useTranslation('notice');
  const { data, isLoading } = useNoticeNotificationLogs(noticeId);
  const logs = data ?? [];

  const columns = useMemo<ColumnDef<NotificationLogVo, unknown>[]>(
    () => [
      {
        accessorKey: 'channelType',
        header: t('log.channel'),
        cell: ({ getValue }) => {
          const channelType = getValue<string>();
          // 使用确定的 key 映射而非动态拼接，满足 i18n 类型安全
          const channelLabels: Record<string, string> = {
            IN_APP: t('log.channelType.IN_APP'),
            EMAIL: t('log.channelType.EMAIL'),
            WECHAT_MP: t('log.channelType.WECHAT_MP'),
            WECHAT_MINI: t('log.channelType.WECHAT_MINI'),
          };
          return channelLabels[channelType] ?? channelType;
        },
      },
      {
        accessorKey: 'recipientId',
        header: t('log.recipient'),
        cell: ({ getValue }) => {
          const recipientId = getValue<number | undefined>();
          return recipientId ? `#${recipientId}` : '-';
        },
      },
      {
        accessorKey: 'status',
        header: t('log.status'),
        cell: ({ getValue }) => {
          const s = getValue<number | undefined>() ?? 0;
          const statusLabels: Record<number, string> = {
            0: t('log.statusLabel.0'),
            1: t('log.statusLabel.1'),
            2: t('log.statusLabel.2'),
          };
          return (
            <Badge variant={STATUS_VARIANT[s] ?? 'secondary'}>{statusLabels[s] ?? String(s)}</Badge>
          );
        },
      },
      {
        accessorKey: 'errorMessage',
        header: t('log.errorMessage'),
        cell: ({ getValue }) => {
          const errorMessage = getValue<string | undefined>();
          return errorMessage || '-';
        },
      },
      {
        accessorKey: 'sentAt',
        header: t('log.sentAt'),
        cell: ({ getValue }) => {
          const sentAt = getValue<string | undefined>();
          return sentAt ? new Date(sentAt).toLocaleString() : '-';
        },
      },
    ],
    [t],
  );

  return <NxTable data={logs} columns={columns} loading={isLoading} emptyText={t('list.empty')} />;
}
