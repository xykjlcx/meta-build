import { authApi } from '@mb/api-sdk';
import { SidebarLayout } from '@mb/app-shell';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    // ensureQueryData：有缓存用缓存，过期了发请求等结果
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
