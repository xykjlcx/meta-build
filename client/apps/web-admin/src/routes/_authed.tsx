import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authApi } from '@mb/api-sdk';
import { SidebarLayout } from '@mb/app-shell';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData({
        queryKey: ['auth', 'me'],
        queryFn: () => authApi.getCurrentUser(),
        staleTime: 5 * 60_000,
      });
      return { currentUser: user };
    } catch {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.pathname },
      });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
}
