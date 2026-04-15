import { Badge } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';
import { NOTICE_STATUS, type NoticeStatusValue } from '../constants';

interface StatusConfig {
  variant: 'secondary' | 'default' | 'destructive';
  className?: string;
  labelKey: 'status.draft' | 'status.published' | 'status.revoked';
}

const STATUS_CONFIG: Record<NoticeStatusValue, StatusConfig> = {
  [NOTICE_STATUS.DRAFT]: { variant: 'secondary', labelKey: 'status.draft' },
  [NOTICE_STATUS.PUBLISHED]: {
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
    labelKey: 'status.published',
  },
  [NOTICE_STATUS.REVOKED]: { variant: 'destructive', labelKey: 'status.revoked' },
};

export function NoticeStatusBadge({ status }: { status: NoticeStatusValue }) {
  const { t } = useTranslation('notice');
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[NOTICE_STATUS.DRAFT];
  return (
    <Badge variant={config.variant} className={config.className}>
      {t(config.labelKey)}
    </Badge>
  );
}
