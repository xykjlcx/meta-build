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
}

let client: HttpClient | null = null;

export function configureApiSdk(config: ApiSdkConfig): void {
  client = createHttpClient(
    config.basePath,
    [
      createAuthInterceptor(config.getToken),
      createLanguageInterceptor(config.getLanguage),
      createRequestIdInterceptor(),
    ],
    [createErrorInterceptor(config)],
  );
}

export function getClient(): HttpClient {
  if (!client) throw new Error('@mb/api-sdk not configured. Call configureApiSdk() first.');
  return client;
}
