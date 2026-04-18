import { requireAuth } from '@mb/app-shell';
import { createFileRoute } from '@tanstack/react-router';
import { MenuPage } from '../../../../features/upms/pages/menu-page';

export const Route = createFileRoute('/_authed/system/menus/')({
  beforeLoad: requireAuth({ permission: 'iam:menu:list' }),
  component: MenuPage,
});
