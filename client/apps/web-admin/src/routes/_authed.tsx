import { authApi } from '@mb/api-sdk';
import { customInstance } from '@mb/api-sdk/mutator/custom-instance';
import { NotificationBadge, SidebarLayout, toCurrentUser, useSseConnection } from '@mb/app-shell';
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { SseHandlers } from '../features/notice/components/sse-handlers';

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
  // SSE 连接管理（登录后自动建连）
  useSseConnection();
  const navigate = useNavigate();

  // L5 注入未读计数查询函数给 L4 的 NotificationBadge
  const unreadQueryFn = useCallback(async () => {
    const result = await customInstance<{ count: number }>('/api/v1/notices/unread-count', {
      method: 'GET',
    });
    return result.count ?? 0;
  }, []);

  return (
    <SidebarLayout
      notificationSlot={
        <NotificationBadge
          queryFn={unreadQueryFn}
          queryKey={['/api/v1/notices/unread-count']}
          onClick={() => navigate({ to: '/notices' })}
        />
      }
    >
      <SseHandlers />
      <Outlet />
    </SidebarLayout>
  );
}
