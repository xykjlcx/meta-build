import { Badge } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';
import { NOTICE_STATUS, type NoticeStatusValue } from '../constants';

const STATUS_VARIANT: Record<NoticeStatusValue, 'secondary' | 'default' | 'destructive'> = {
  [NOTICE_STATUS.DRAFT]: 'secondary',
  [NOTICE_STATUS.PUBLISHED]: 'default',
  [NOTICE_STATUS.REVOKED]: 'destructive',
};

const STATUS_I18N_KEY = {
  [NOTICE_STATUS.DRAFT]: 'status.draft',
  [NOTICE_STATUS.PUBLISHED]: 'status.published',
  [NOTICE_STATUS.REVOKED]: 'status.revoked',
} as const;

export function NoticeStatusBadge({ status }: { status: NoticeStatusValue }) {
  const { t } = useTranslation('notice');
  const variant = STATUS_VARIANT[status] ?? 'secondary';
  const key = STATUS_I18N_KEY[status];

  return <Badge variant={variant}>{key ? t(key) : String(status)}</Badge>;
}
