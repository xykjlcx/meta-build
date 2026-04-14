import { authApi } from '@mb/api-sdk';
import { SidebarLayout, toCurrentUser } from '@mb/app-shell';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    // ensureQueryData：有缓存用缓存，过期了发请求等结果
    try {
      const dto = await context.queryClient.ensureQueryData({
        queryKey: ['auth', 'me'],
        queryFn: () => authApi.getCurrentUser(),
        staleTime: 5 * 60_000,
      });
      // DTO 的 permissions 是 string[]，需要转换为 ReadonlySet<string>
      return { currentUser: toCurrentUser(dto) };
    } catch {
      throw redirect({
        to: '/auth/login',
        search: { redirect: window.location.pathname },
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
