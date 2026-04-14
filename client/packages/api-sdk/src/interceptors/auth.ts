import type { RequestInterceptor } from '../http-client';

export function createAuthInterceptor(getToken: () => string | null): RequestInterceptor {
  return (url, init) => {
    const token = getToken();
    if (!token) return { url, init };
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return { url, init: { ...init, headers } };
  };
}
