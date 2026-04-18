import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { UserPage } from '../../../../features/upms/pages/user-page';

export const Route = createFileRoute('/_authed/system/users/')({
  beforeLoad: requireAuth({ permission: 'iam:user:list' }),
  component: UserPage,
});
