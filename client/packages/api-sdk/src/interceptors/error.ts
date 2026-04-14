import type { ResponseInterceptor } from '../http-client';
import type { ProblemDetail } from '../types/common';
import { ProblemDetailError } from '../errors';

export interface ErrorHandlerOptions {
  onUnauthenticated: () => void;
  onForbidden: (err: ProblemDetailError) => void;
  onServerError: (err: ProblemDetailError) => void;
}

export function createErrorInterceptor(options: ErrorHandlerOptions): ResponseInterceptor {
  return async (response) => {
    if (response.ok) return response;

    const contentType = response.headers.get('Content-Type') ?? '';
    let payload: ProblemDetail;

    if (contentType.includes('application/problem+json') || contentType.includes('application/json')) {
      payload = await response.clone().json();
    } else {
      payload = {
        type: 'about:blank',
        status: response.status,
        title: response.statusText,
        detail: `Unexpected error: ${response.status} ${response.statusText}`,
      };
    }

    const err = new ProblemDetailError(payload);

    if (err.status === 401) { options.onUnauthenticated(); throw err; }
    if (err.status === 403) { options.onForbidden(err); throw err; }
    if (err.status >= 500) { options.onServerError(err); throw err; }

    throw err;
  };
}
