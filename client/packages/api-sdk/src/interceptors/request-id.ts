import type { RequestInterceptor } from '../http-client';

export function createRequestIdInterceptor(): RequestInterceptor {
  return (url, init) => {
    const headers = new Headers(init.headers);
    headers.set('X-Request-ID', crypto.randomUUID());
    return { url, init: { ...init, headers } };
  };
}
