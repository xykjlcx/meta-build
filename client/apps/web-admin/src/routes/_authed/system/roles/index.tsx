import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { RolePage } from '../../../../features/upms/pages/role-page';

export const Route = createFileRoute('/_authed/system/roles/')({
  beforeLoad: requireAuth({ permission: 'iam:role:list' }),
  component: RolePage,
});
