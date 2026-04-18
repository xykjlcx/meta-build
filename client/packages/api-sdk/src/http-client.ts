import { ProblemDetailError } from './errors';

export type RequestInterceptor = (
  url: string,
  init: RequestInit,
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

/** 请求选项，在 RequestInit 基础上扩展 responseType */
export interface RequestOptions extends RequestInit {
  /** 响应类型：'json'（默认）或 'blob'（文件下载） */
  responseType?: 'json' | 'blob';
}

export interface HttpClient {
  request<T>(url: string, init?: RequestOptions): Promise<T>;
  requestWithMeta<T>(url: string, init?: RequestOptions): Promise<HttpResponseMeta<T>>;
}

export interface HttpClientOptions {
  basePath: string;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
  requestGate?: () => Promise<void>;
  /** 尝试刷新 token，成功返回新 access token，失败返回 null */
  tryRefreshToken?: () => Promise<string | null>;
  /** refresh 失败或未配置时的回调（跳登录页） */
  onUnauthenticated?: () => void;
}

export interface HttpResponseMeta<T> {
  data: T;
  status: number;
  headers: Headers;
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
  const opts = normalizeClientOptions(optionsOrBasePath, requestInterceptors, responseInterceptors);

  // refresh 锁：防止并发请求同时触发多次 refresh
  let refreshPromise: Promise<string | null> | null = null;

  async function executeRequest<T>(
    url: string,
    init: RequestOptions,
  ): Promise<HttpResponseMeta<T>> {
    await opts.requestGate?.();

    let finalUrl = `${opts.basePath}${url}`;
    const { responseType, ...fetchInit } = init;
    let finalInit: RequestInit = { ...fetchInit };

    for (const interceptor of opts.requestInterceptors) {
      const result = await interceptor(finalUrl, finalInit);
      finalUrl = result.url;
      finalInit = result.init;
    }

    let response = await fetch(finalUrl, finalInit);

    for (const interceptor of opts.responseInterceptors) {
      response = await interceptor(response);
    }

    return {
      data: await parseResponseBody<T>(response, responseType),
      status: response.status,
      headers: response.headers,
    };
  }

  async function requestWithRetry<T>(
    init: RequestOptions,
    executor: (requestInit: RequestOptions) => Promise<T>,
  ): Promise<T> {
    try {
      return await executor(init);
    } catch (err) {
      if (!(err instanceof ProblemDetailError) || err.status !== 401) {
        throw err;
      }

      return retryWithFreshToken(err, init, executor);
    }
  }

  async function retryWithFreshToken<T>(
    err: ProblemDetailError,
    init: RequestOptions,
    executor: (requestInit: RequestOptions) => Promise<T>,
  ): Promise<T> {
    const newToken = await resolveRefreshedToken();
    if (!newToken) {
      opts.onUnauthenticated?.();
      throw err;
    }

    try {
      return await executor(withAuthorization(init, newToken));
    } catch (retryErr) {
      if (retryErr instanceof ProblemDetailError && retryErr.status === 401) {
        opts.onUnauthenticated?.();
      }
      throw retryErr;
    }
  }

  async function resolveRefreshedToken(): Promise<string | null> {
    if (!opts.tryRefreshToken) {
      return null;
    }

    if (!refreshPromise) {
      refreshPromise = opts.tryRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  return {
    async request<T>(url: string, init: RequestOptions = {}): Promise<T> {
      const response = await requestWithRetry(init, (requestInit) =>
        executeRequest<T>(url, requestInit),
      );
      return response.data;
    },
    async requestWithMeta<T>(url: string, init: RequestOptions = {}): Promise<HttpResponseMeta<T>> {
      return requestWithRetry(init, (requestInit) => executeRequest<T>(url, requestInit));
    },
  };
}

function normalizeClientOptions(
  optionsOrBasePath: HttpClientOptions | string,
  requestInterceptors: RequestInterceptor[] = [],
  responseInterceptors: ResponseInterceptor[] = [],
): HttpClientOptions {
  if (typeof optionsOrBasePath !== 'string') {
    return optionsOrBasePath;
  }

  return {
    basePath: optionsOrBasePath,
    requestInterceptors,
    responseInterceptors,
  };
}

async function parseResponseBody<T>(
  response: Response,
  responseType?: RequestOptions['responseType'],
): Promise<T> {
  // 204 No Content — 调用方应声明 Promise<void>，此时 undefined as T 对 void 类型安全
  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === 'blob') {
    return (await response.blob()) as T;
  }

  return response.json() as Promise<T>;
}

function withAuthorization(init: RequestOptions, token: string): RequestOptions {
  const retryInit = { ...init };
  const headers = new Headers(retryInit.headers);
  headers.set('Authorization', `Bearer ${token}`);
  retryInit.headers = headers;
  return retryInit;
}

/**
 * 触发浏览器下载。配合 HttpClient blob 响应使用。
 * @param blob - 文件 Blob
 * @param filename - 下载文件名
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
