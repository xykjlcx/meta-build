import {
  getRecipientsQueryKey,
  useRecipients,
} from '@mb/api-sdk/generated/endpoints/公告管理/公告管理';
import type { RecipientView } from '@mb/api-sdk/generated/models';
import { NxTable } from '@mb/ui-patterns';
import type { NxTablePagination } from '@mb/ui-patterns';
import { Badge } from '@mb/ui-primitives';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RecipientsTabProps {
  noticeId: number;
}

export function RecipientsTab({ noticeId }: RecipientsTabProps) {
  const { t } = useTranslation('notice');
  const [pagination, setPagination] = useState<NxTablePagination>({
    page: 1,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  const recipientsParams = { page: pagination.page, size: pagination.size };
  const { data, isLoading } = useRecipients(noticeId, recipientsParams, {
    query: { queryKey: getRecipientsQueryKey(noticeId, recipientsParams) },
  });

  // orval 响应结构：{ data: PageResultRecipientView, status, headers }
  const pageResult = (
    data as
      | { data?: { content?: RecipientView[]; totalElements?: number; totalPages?: number } }
      | undefined
  )?.data;
  const recipients: RecipientView[] = pageResult?.content ?? [];
  const totalElements = pageResult?.totalElements ?? 0;
  const totalPages = pageResult?.totalPages ?? 0;

  const currentPagination = useMemo(
    () => ({ ...pagination, totalElements, totalPages }),
    [pagination, totalElements, totalPages],
  );

  const columns = useMemo<ColumnDef<RecipientView, unknown>[]>(
    () => [
      {
        accessorKey: 'username',
        header: () => t('common:username', { defaultValue: '用户名' }),
      },
      {
        accessorKey: 'readAt',
        header: t('detail.readStatus'),
        cell: ({ getValue }) => {
          const readAt = getValue<string>();
          if (readAt) {
            return (
              <Badge variant="default">
                {t('read.readLabel')} · {new Date(readAt).toLocaleString()}
              </Badge>
            );
          }
          return <Badge variant="secondary">{t('read.unread')}</Badge>;
        },
      },
    ],
    [t],
  );

  return (
    <NxTable
      data={recipients}
      columns={columns}
      loading={isLoading}
      pagination={currentPagination}
      onPaginationChange={setPagination}
      emptyText={t('list.empty')}
    />
  );
}
