import { useEffect } from 'react';
import { sseEventBus } from './event-bus';

/**
 * 订阅 SSE 事件。
 *
 * 组件 mount 时注册，unmount 时自动取消。
 * handler 变化时自动重新订阅。
 */
export function useSseSubscription(event: string, handler: (data: unknown) => void): void {
  useEffect(() => {
    sseEventBus.on(event, handler);
    return () => {
      sseEventBus.off(event, handler);
    };
  }, [event, handler]);
}
