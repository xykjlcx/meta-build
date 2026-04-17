import { Badge } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';
import { NOTICE_STATUS, type NoticeStatusValue } from '../constants';

interface StatusConfig {
  variant: 'outline' | 'secondary';
  dotColor: string;
  labelKey: 'status.draft' | 'status.published' | 'status.revoked';
}

const STATUS_CONFIG: Record<NoticeStatusValue, StatusConfig> = {
  [NOTICE_STATUS.DRAFT]: {
    variant: 'outline',
    dotColor: 'bg-muted-foreground',
    labelKey: 'status.draft',
  },
  [NOTICE_STATUS.PUBLISHED]: {
    variant: 'outline',
    // 使用 semantic token `bg-success`；Tailwind 默认色板被 primitive.css `--color-*: initial`
    // 清空后 bg-emerald-500 等 utility 不再生成色值
    dotColor: 'bg-success',
    labelKey: 'status.published',
  },
  [NOTICE_STATUS.REVOKED]: {
    variant: 'secondary',
    dotColor: 'bg-muted-foreground',
    labelKey: 'status.revoked',
  },
};

export function NoticeStatusBadge({ status }: { status: NoticeStatusValue }) {
  const { t } = useTranslation('notice');
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[NOTICE_STATUS.DRAFT];
  return (
    <Badge variant={config.variant}>
      <span className={`size-1.5 rounded-full ${config.dotColor}`} />
      {t(config.labelKey)}
    </Badge>
  );
}
