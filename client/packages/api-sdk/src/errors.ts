import type { ProblemDetail } from './types/common';

export class ProblemDetailError extends Error {
  readonly status: number;
  readonly type: string;
  readonly title: string | null;
  readonly detail: string | null;
  readonly instance: string | null;
  readonly code: string | null;
  readonly traceId: string | null;
  readonly validationErrors: ReadonlyArray<{ field: string; message: string }>;

  constructor(payload: ProblemDetail) {
    super(payload.detail ?? payload.title ?? `HTTP ${payload.status}`);
    this.name = 'ProblemDetailError';
    this.status = payload.status ?? 0;
    this.type = payload.type ?? 'about:blank';
    this.title = payload.title ?? null;
    this.detail = payload.detail ?? null;
    this.instance = payload.instance ?? null;
    this.code = payload.code ?? null;
    this.traceId = payload.traceId ?? null;
    this.validationErrors = (payload.errors as ReadonlyArray<{ field: string; message: string }>) ?? [];
  }
}

export function isProblemDetail(error: unknown): error is ProblemDetailError {
  return error instanceof ProblemDetailError;
}
