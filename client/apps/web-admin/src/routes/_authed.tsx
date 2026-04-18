import { authApi, noticeApi } from '@mb/api-sdk';
import { LayoutResolver, NotificationBadge, toCurrentUser, useSseConnection } from '@mb/app-shell';
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { SseHandlers } from '../features/notice/components/sse-handlers';
import { resolveMenuHref } from '../menu-route-map';

async function waitForMockRuntimeReady() {
  if (typeof window === 'undefined') {
    return;
  }

  const runtime = window as unknown as Record<string, unknown>;
  if (!runtime.__msw_enabled__) {
    return;
  }

  const startedAt = performance.now();
  while (performance.now() - startedAt < 3000) {
    if (runtime.__msw_ready__ && navigator.serviceWorker.controller) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

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
    await waitForMockRuntimeReady();
    const result = await noticeApi.getUnreadCount();
    return result.count ?? 0;
  }, []);

  return (
    <LayoutResolver
      notificationSlot={
        <NotificationBadge
          queryFn={unreadQueryFn}
          queryKey={['/api/v1/notices/unread-count']}
          onClick={() => navigate({ to: '/notices', search: { edit: undefined } })}
        />
      }
      resolveMenuHref={resolveMenuHref}
    >
      <SseHandlers />
      <Outlet />
    </LayoutResolver>
  );
}
