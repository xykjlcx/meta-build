import type { RequestInterceptor } from '../http-client';

export function createLanguageInterceptor(getLanguage: () => string): RequestInterceptor {
  return (url, init) => {
    const headers = new Headers(init.headers);
    headers.set('Accept-Language', getLanguage());
    return { url, init: { ...init, headers } };
  };
}
