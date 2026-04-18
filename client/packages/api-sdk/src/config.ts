import type { HttpClient } from './http-client';
import { createHttpClient } from './http-client';
import { createAuthInterceptor } from './interceptors/auth';
import type { ErrorHandlerOptions } from './interceptors/error';
import { createErrorInterceptor } from './interceptors/error';
import { createLanguageInterceptor } from './interceptors/language';
import { createRequestIdInterceptor } from './interceptors/request-id';

export interface ApiSdkConfig extends ErrorHandlerOptions {
  basePath: string;
  getToken: () => string | null;
  getLanguage: () => string;
  requestGate?: () => Promise<void>;
  /** 尝试刷新 token，成功返回新 access token，失败返回 null */
  tryRefreshToken?: () => Promise<string | null>;
}

let client: HttpClient | null = null;

export function configureApiSdk(config: ApiSdkConfig): void {
  client = createHttpClient({
    basePath: config.basePath,
    requestInterceptors: [
      createAuthInterceptor(config.getToken),
      createLanguageInterceptor(config.getLanguage),
      createRequestIdInterceptor(),
    ],
    responseInterceptors: [createErrorInterceptor(config)],
    requestGate: config.requestGate,
    tryRefreshToken: config.tryRefreshToken,
    onUnauthenticated: config.onUnauthenticated,
  });
}

export function getClient(): HttpClient {
  if (!client) throw new Error('@mb/api-sdk not configured. Call configureApiSdk() first.');
  return client;
}
