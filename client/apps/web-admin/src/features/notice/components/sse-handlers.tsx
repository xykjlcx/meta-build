import { noticeQueryKeys } from '@mb/api-sdk';
import { useAuth, useSseSubscription } from '@mb/app-shell';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/**
 * SSE 全局事件处理器。
 *
 * 放在 _authed layout 内，登录后生效。
 * 处理：踢人下线 / 权限变更 / 公告发布推送 / 系统广播 / session-replaced。
 */
export function SseHandlers() {
  const { t } = useTranslation('notice');
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  // 踢人下线
  useSseSubscription(
    'force-logout',
    useCallback(
      (data: unknown) => {
        const { reason } = data as { reason?: string };
        toast.error(t('sse.forceLogout', { reason: reason ?? '' }));
        logout();
      },
      [t, logout],
    ),
  );

  // 权限变更 → 刷新用户信息缓存
  useSseSubscription(
    'permission-changed',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    }, [queryClient]),
  );

  // 公告发布推送 → toast + 刷新列表和未读计数
  useSseSubscription(
    'notice-published',
    useCallback(
      (data: unknown) => {
        const { title } = data as { id?: number; title?: string };
        toast.info(`${t('title')}: ${title}`);
        queryClient.invalidateQueries({ queryKey: noticeQueryKeys.list() });
        queryClient.invalidateQueries({ queryKey: noticeQueryKeys.unreadCount() });
      },
      [t, queryClient],
    ),
  );

  // 系统广播 → toast（后续可升级为全局 banner）
  useSseSubscription(
    'system-broadcast',
    useCallback((data: unknown) => {
      const { message } = data as { message?: string };
      if (message) {
        toast.info(message, { duration: 10000 });
      }
    }, []),
  );

  // session-replaced（多 tab 场景）
  useSseSubscription(
    'session-replaced',
    useCallback(() => {
      toast.info(t('sse.sessionReplaced'));
    }, [t]),
  );

  return null;
}
