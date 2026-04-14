import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthInterceptor } from '../interceptors/auth';
import { createLanguageInterceptor } from '../interceptors/language';
import { createRequestIdInterceptor } from '../interceptors/request-id';
import { createErrorInterceptor } from '../interceptors/error';
import { ProblemDetailError, isProblemDetail } from '../errors';

// ── Auth 拦截器 ──

describe('createAuthInterceptor', () => {
  it('有 token 时注入 Authorization header', () => {
    const interceptor = createAuthInterceptor(() => 'my-token');
    const result = interceptor('/api/test', { method: 'GET' });

    expect(result).toHaveProperty('url', '/api/test');
    const headers = (result as { url: string; init: RequestInit }).init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('无 token 时不注入 Authorization header', () => {
    const interceptor = createAuthInterceptor(() => null);
    const result = interceptor('/api/test', { method: 'GET' });

    expect(result).toHaveProperty('url', '/api/test');
    // init 应该原样返回，没有 Authorization
    const init = (result as { url: string; init: RequestInit }).init;
    const headers = new Headers(init.headers);
    expect(headers.has('Authorization')).toBe(false);
  });
});

// ── Language 拦截器 ──

describe('createLanguageInterceptor', () => {
  it('注入 Accept-Language header', () => {
    const interceptor = createLanguageInterceptor(() => 'zh-CN');
    const result = interceptor('/api/test', { method: 'GET' });

    const headers = (result as { url: string; init: RequestInit }).init.headers as Headers;
    expect(headers.get('Accept-Language')).toBe('zh-CN');
  });
});

// ── Request-ID 拦截器 ──

describe('createRequestIdInterceptor', () => {
  it('注入 X-Request-ID header（UUID 格式）', () => {
    const interceptor = createRequestIdInterceptor();
    const result = interceptor('/api/test', { method: 'GET' });

    const headers = (result as { url: string; init: RequestInit }).init.headers as Headers;
    const requestId = headers.get('X-Request-ID');
    expect(requestId).toBeTruthy();
    // UUID v4 格式：8-4-4-4-12
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

// ── Error 拦截器 ──

describe('createErrorInterceptor', () => {
  const onUnauthenticated = vi.fn();
  const onForbidden = vi.fn();
  const onServerError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeResponse(status: number, body?: unknown, contentType = 'application/json'): Response {
    const headers = new Headers();
    if (contentType) headers.set('Content-Type', contentType);

    return new Response(body ? JSON.stringify(body) : null, {
      status,
      statusText: status === 200 ? 'OK' : `Error ${status}`,
      headers,
    });
  }

  it('ok response 原样返回', async () => {
    const interceptor = createErrorInterceptor({ onUnauthenticated, onForbidden, onServerError });
    const original = makeResponse(200, { data: 'ok' });
    const result = await interceptor(original);

    expect(result).toBe(original);
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(onForbidden).not.toHaveBeenCalled();
    expect(onServerError).not.toHaveBeenCalled();
  });

  it('401 调用 onUnauthenticated 并 throw ProblemDetailError', async () => {
    const interceptor = createErrorInterceptor({ onUnauthenticated, onForbidden, onServerError });
    const response = makeResponse(401, { type: 'about:blank', status: 401, title: 'Unauthorized' });

    await expect(interceptor(response)).rejects.toThrow(ProblemDetailError);
    expect(onUnauthenticated).toHaveBeenCalledOnce();
    expect(onForbidden).not.toHaveBeenCalled();
    expect(onServerError).not.toHaveBeenCalled();
  });

  it('403 调用 onForbidden 并 throw ProblemDetailError', async () => {
    const interceptor = createErrorInterceptor({ onUnauthenticated, onForbidden, onServerError });
    const response = makeResponse(403, { type: 'about:blank', status: 403, title: 'Forbidden' });

    await expect(interceptor(response)).rejects.toThrow(ProblemDetailError);
    expect(onForbidden).toHaveBeenCalledOnce();
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(onServerError).not.toHaveBeenCalled();
  });

  it('500 调用 onServerError 并 throw ProblemDetailError', async () => {
    const interceptor = createErrorInterceptor({ onUnauthenticated, onForbidden, onServerError });
    const response = makeResponse(500, { type: 'about:blank', status: 500, title: 'Internal Server Error' });

    await expect(interceptor(response)).rejects.toThrow(ProblemDetailError);
    expect(onServerError).toHaveBeenCalledOnce();
    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(onForbidden).not.toHaveBeenCalled();
  });

  it('400 application/problem+json throw ProblemDetailError 但不调用任何 callback', async () => {
    const interceptor = createErrorInterceptor({ onUnauthenticated, onForbidden, onServerError });
    const body = {
      type: 'urn:metabuild:validation',
      status: 400,
      title: 'Bad Request',
      detail: 'Validation failed',
      errors: [{ field: 'username', message: 'must not be blank' }],
    };
    const response = makeResponse(400, body, 'application/problem+json');

    let caught: ProblemDetailError | undefined;
    try {
      await interceptor(response);
    } catch (e) {
      caught = e as ProblemDetailError;
    }

    expect(caught).toBeInstanceOf(ProblemDetailError);
    expect(caught!.status).toBe(400);
    expect(caught!.type).toBe('urn:metabuild:validation');
    expect(caught!.detail).toBe('Validation failed');
    expect(caught!.validationErrors).toHaveLength(1);
    expect(caught!.validationErrors[0]).toEqual({ field: 'username', message: 'must not be blank' });

    expect(onUnauthenticated).not.toHaveBeenCalled();
    expect(onForbidden).not.toHaveBeenCalled();
    expect(onServerError).not.toHaveBeenCalled();
  });

  it('非 JSON 响应构造默认 ProblemDetail', async () => {
    const interceptor = createErrorInterceptor({ onUnauthenticated, onForbidden, onServerError });
    const response = new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain' },
    });

    let caught: ProblemDetailError | undefined;
    try {
      await interceptor(response);
    } catch (e) {
      caught = e as ProblemDetailError;
    }

    expect(caught).toBeInstanceOf(ProblemDetailError);
    expect(caught!.status).toBe(404);
    expect(caught!.type).toBe('about:blank');
    expect(caught!.detail).toBe('Unexpected error: 404 Not Found');
  });
});

// ── ProblemDetailError + isProblemDetail ──

describe('ProblemDetailError', () => {
  it('正确构造所有字段', () => {
    const err = new ProblemDetailError({
      type: 'urn:metabuild:not-found',
      status: 404,
      title: 'Not Found',
      detail: 'User 123 not found',
      instance: '/api/v1/users/123',
      code: 'iam.user.notFound',
      traceId: 'abc-123',
      errors: [{ field: 'id', message: 'invalid' }],
    });

    expect(err.name).toBe('ProblemDetailError');
    expect(err.message).toBe('User 123 not found');
    expect(err.status).toBe(404);
    expect(err.type).toBe('urn:metabuild:not-found');
    expect(err.title).toBe('Not Found');
    expect(err.detail).toBe('User 123 not found');
    expect(err.instance).toBe('/api/v1/users/123');
    expect(err.code).toBe('iam.user.notFound');
    expect(err.traceId).toBe('abc-123');
    expect(err.validationErrors).toEqual([{ field: 'id', message: 'invalid' }]);
  });

  it('缺失字段使用默认值', () => {
    const err = new ProblemDetailError({ type: 'about:blank', status: 500 });

    expect(err.message).toBe('HTTP 500');
    expect(err.title).toBeNull();
    expect(err.detail).toBeNull();
    expect(err.instance).toBeNull();
    expect(err.code).toBeNull();
    expect(err.traceId).toBeNull();
    expect(err.validationErrors).toEqual([]);
  });
});

describe('isProblemDetail', () => {
  it('ProblemDetailError 实例返回 true', () => {
    const err = new ProblemDetailError({ type: 'about:blank', status: 400 });
    expect(isProblemDetail(err)).toBe(true);
  });

  it('普通 Error 返回 false', () => {
    expect(isProblemDetail(new Error('test'))).toBe(false);
  });

  it('非 Error 值返回 false', () => {
    expect(isProblemDetail('string')).toBe(false);
    expect(isProblemDetail(null)).toBe(false);
    expect(isProblemDetail(undefined)).toBe(false);
  });
});
