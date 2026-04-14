export interface RequestInterceptor {
  (url: string, init: RequestInit): Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };
}

export interface ResponseInterceptor {
  (response: Response): Promise<Response> | Response;
}

export interface HttpClient {
  request<T>(url: string, init?: RequestInit): Promise<T>;
}

export function createHttpClient(
  basePath: string,
  requestInterceptors: RequestInterceptor[],
  responseInterceptors: ResponseInterceptor[],
): HttpClient {
  return {
    async request<T>(url: string, init: RequestInit = {}): Promise<T> {
      let finalUrl = `${basePath}${url}`;
      let finalInit = { ...init };

      for (const interceptor of requestInterceptors) {
        const result = await interceptor(finalUrl, finalInit);
        finalUrl = result.url;
        finalInit = result.init;
      }

      let response = await fetch(finalUrl, finalInit);

      for (const interceptor of responseInterceptors) {
        response = await interceptor(response);
      }

      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    },
  };
}
