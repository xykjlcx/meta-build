import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { NoticeDetailPage } from '../../../features/notice/pages/notice-detail-page';

export const Route = createFileRoute('/_authed/notices/$id')({
  beforeLoad: requireAuth({ permission: 'notice:notice:list' }),
  component: NoticeDetailPage,
});
