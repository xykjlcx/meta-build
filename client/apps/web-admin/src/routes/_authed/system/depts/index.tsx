import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { DeptPage } from '../../../../features/upms/pages/dept-page';

export const Route = createFileRoute('/_authed/system/depts/')({
  beforeLoad: requireAuth({ permission: 'iam:dept:list' }),
  component: DeptPage,
});
