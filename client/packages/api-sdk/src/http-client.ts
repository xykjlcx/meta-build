import { ProblemDetailError } from './errors';

export type RequestInterceptor = (
  url: string,
  init: RequestInit,
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

export interface HttpClient {
  request<T>(url: string, init?: RequestInit): Promise<T>;
}

export interface HttpClientOptions {
  basePath: string;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
  /** 尝试刷新 token，成功返回新 access token，失败返回 null */
  tryRefreshToken?: () => Promise<string | null>;
  /** refresh 失败或未配置时的回调（跳登录页） */
  onUnauthenticated?: () => void;
}

export function createHttpClient(options: HttpClientOptions): HttpClient;
/** @deprecated 使用 options 对象形式 */
export function createHttpClient(
  basePath: string,
  requestInterceptors: RequestInterceptor[],
  responseInterceptors: ResponseInterceptor[],
): HttpClient;
export function createHttpClient(
  optionsOrBasePath: HttpClientOptions | string,
  requestInterceptors?: RequestInterceptor[],
  responseInterceptors?: ResponseInterceptor[],
): HttpClient {
  const opts: HttpClientOptions =
    typeof optionsOrBasePath === 'string'
      ? {
          basePath: optionsOrBasePath,
          requestInterceptors: requestInterceptors!,
          responseInterceptors: responseInterceptors!,
        }
      : optionsOrBasePath;

  // refresh 锁：防止并发请求同时触发多次 refresh
  let refreshPromise: Promise<string | null> | null = null;

  async function executeRequest<T>(url: string, init: RequestInit): Promise<T> {
    let finalUrl = `${opts.basePath}${url}`;
    let finalInit = { ...init };

    for (const interceptor of opts.requestInterceptors) {
      const result = await interceptor(finalUrl, finalInit);
      finalUrl = result.url;
      finalInit = result.init;
    }

    let response = await fetch(finalUrl, finalInit);

    for (const interceptor of opts.responseInterceptors) {
      response = await interceptor(response);
    }

    // 204 No Content — 调用方应声明 Promise<void>，此时 undefined as T 对 void 类型安全
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  return {
    async request<T>(url: string, init: RequestInit = {}): Promise<T> {
      try {
        return await executeRequest<T>(url, init);
      } catch (err) {
        if (!(err instanceof ProblemDetailError) || err.status !== 401) {
          throw err;
        }

        // 401 → 尝试 refresh token
        if (opts.tryRefreshToken) {
          // 复用正在进行的 refresh 请求（并发安全）
          if (!refreshPromise) {
            refreshPromise = opts.tryRefreshToken().finally(() => {
              refreshPromise = null;
            });
          }

          const newToken = await refreshPromise;
          if (newToken) {
            // refresh 成功 → 用新 token 重试原请求
            const retryInit = { ...init };
            const headers = new Headers(retryInit.headers);
            headers.set('Authorization', `Bearer ${newToken}`);
            retryInit.headers = headers;
            try {
              return await executeRequest<T>(url, retryInit);
            } catch (retryErr) {
              // 重试也 401 → 不再递归，直接失败
              if (retryErr instanceof ProblemDetailError && retryErr.status === 401) {
                opts.onUnauthenticated?.();
              }
              throw retryErr;
            }
          }
        }

        // refresh 失败或未配置 → 跳登录页
        opts.onUnauthenticated?.();
        throw err;
      }
    },
  };
}
