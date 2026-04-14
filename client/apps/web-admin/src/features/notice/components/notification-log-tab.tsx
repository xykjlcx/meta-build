import { Badge } from '@mb/ui-primitives';
import { NxTable } from '@mb/ui-patterns';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// 发送记录需要 Plan B 的 notification-log API
// 此组件使用占位数据结构，Plan B 完成后接入实际 API

interface NotificationLogEntry {
  id: number;
  channelType: string;
  recipientName: string;
  status: number;
  errorMessage?: string;
  sentAt?: string;
}

interface NotificationLogTabProps {
  noticeId: number;
}

const STATUS_VARIANT: Record<number, 'secondary' | 'default' | 'destructive'> = {
  0: 'secondary',
  1: 'default',
  2: 'destructive',
};

export function NotificationLogTab({ noticeId: _noticeId }: NotificationLogTabProps) {
  const { t } = useTranslation('notice');

  // TODO: Plan B 完成后替换为 useNotificationLogs(noticeId) 生成的 hook
  const logs: NotificationLogEntry[] = [];
  const isLoading = false;

  const columns = useMemo<ColumnDef<NotificationLogEntry, unknown>[]>(
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
        accessorKey: 'recipientName',
        header: t('log.recipient'),
      },
      {
        accessorKey: 'status',
        header: t('log.status'),
        cell: ({ getValue }) => {
          const s = getValue<number>();
          const statusLabels: Record<number, string> = {
            0: t('log.statusLabel.0'),
            1: t('log.statusLabel.1'),
            2: t('log.statusLabel.2'),
          };
          return (
            <Badge variant={STATUS_VARIANT[s] ?? 'secondary'}>
              {statusLabels[s] ?? String(s)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'errorMessage',
        header: t('log.errorMessage'),
        cell: ({ getValue }) => getValue<string>() || '-',
      },
      {
        accessorKey: 'sentAt',
        header: t('log.sentAt'),
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val ? new Date(val).toLocaleString() : '-';
        },
      },
    ],
    [t],
  );

  return <NxTable data={logs} columns={columns} loading={isLoading} emptyText={t('list.empty')} />;
}
