type Handler = (data: unknown) => void;

/**
 * SSE 事件总线 — 简易 EventEmitter。
 *
 * SSE 消息到达后通过 event-bus 分发给订阅者（各 useSseSubscription hook）。
 * 不用 React Context 避免不必要的 re-render。
 */
class SseEventBus {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[SSE EventBus] 处理 ${event} 事件时出错:`, err);
      }
    }
  }
}

export const sseEventBus = new SseEventBus();
