import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { NoticeListPage } from '../../../features/notice/pages/notice-list-page';

export const Route = createFileRoute('/_authed/notices/')({
  beforeLoad: requireAuth({ permission: 'notice:notice:list' }),
  component: NoticeListPage,
});
