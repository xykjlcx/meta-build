import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useEffect } from 'react';
import { getAccessToken, useCurrentUser } from '../auth';
import { sseEventBus } from './event-bus';

const MOCK_SSE_CHANNEL = 'mb-mock-sse';

/**
 * SSE 连接管理 hook。
 *
 * 登录后自动建连，登出/组件卸载时自动断开。
 * 收到消息后分发到 sseEventBus。
 * session-replaced 事件表示同一用户在其他 tab 建连，旧连接被踢。
 */
export function useSseConnection(): void {
  const user = useCurrentUser();

  useEffect(() => {
    if (!user.isAuthenticated) return;

    if (
      typeof window !== 'undefined' &&
      (window as unknown as Record<string, unknown>).__msw_enabled__
    ) {
      return connectMockSse(user.userId ?? 0);
    }

    const ctrl = new AbortController();
    const token = getAccessToken();
    if (!token) return;

    fetchEventSource('/api/v1/sse/connect', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: ctrl.signal,
      onmessage(ev) {
        // 多 tab 场景：旧连接被踢，不重连
        if (ev.event === 'session-replaced') {
          ctrl.abort();
          sseEventBus.emit('session-replaced', {});
          return;
        }

        // 分发到订阅者
        try {
          const data = ev.data ? JSON.parse(ev.data) : {};
          sseEventBus.emit(ev.event, data);
        } catch {
          console.warn('[SSE] 解析消息失败:', ev.data);
        }
      },
      onclose() {
        // 服务端关闭 — fetch-event-source 内置重连
      },
      onerror(err) {
        // 401 → 不重连，触发登出
        if (err instanceof Response && err.status === 401) {
          ctrl.abort();
          sseEventBus.emit('force-logout', { reason: 'token expired' });
          throw err; // 停止重连
        }
        // 其他错误 → fetch-event-source 内置指数退避重连
      },
    });

    return () => ctrl.abort();
  }, [user.isAuthenticated, user.userId]);
}

function connectMockSse(userId: number) {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return undefined;
  }

  const tabId = crypto.randomUUID();
  const ownerKey = `mb_mock_sse_owner:${userId}`;
  const channel = new BroadcastChannel(MOCK_SSE_CHANNEL);

  const handleMessage = (event: MessageEvent) => {
    const payload = event.data as
      | { type?: 'event'; event?: string; data?: unknown }
      | { type?: 'session-replaced'; targetTabId?: string };

    if (payload.type === 'event' && payload.event) {
      sseEventBus.emit(payload.event, payload.data ?? {});
      return;
    }

    if (payload.type === 'session-replaced' && payload.targetTabId === tabId) {
      sseEventBus.emit('session-replaced', {});
    }
  };

  channel.addEventListener('message', handleMessage);

  const previousOwner = window.localStorage.getItem(ownerKey);
  if (previousOwner && previousOwner !== tabId) {
    channel.postMessage({
      type: 'session-replaced',
      targetTabId: previousOwner,
    });
  }
  window.localStorage.setItem(ownerKey, tabId);

  return () => {
    channel.removeEventListener('message', handleMessage);
    if (window.localStorage.getItem(ownerKey) === tabId) {
      window.localStorage.removeItem(ownerKey);
    }
    channel.close();
  };
}
