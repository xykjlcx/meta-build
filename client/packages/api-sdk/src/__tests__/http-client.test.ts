import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHttpClient } from '../http-client';

describe('createHttpClient — blob 响应', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responseType=blob 时返回 Blob 对象', async () => {
    const blobContent = 'test file content';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Blob([blobContent], { type: 'application/octet-stream' }), {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      }),
    );

    const client = createHttpClient({
      basePath: '',
      requestInterceptors: [],
      responseInterceptors: [],
    });

    const result = await client.request<Blob>('/api/export', { responseType: 'blob' });

    expect(result).toBeInstanceOf(Blob);
    // 验证 Blob 内容正确
    const text = await result.text();
    expect(text).toBe(blobContent);
  });

  it('responseType 未设置时默认解析 JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = createHttpClient({
      basePath: '',
      requestInterceptors: [],
      responseInterceptors: [],
    });

    const result = await client.request<{ id: number; name: string }>('/api/users/1');
    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('responseType=blob 时 204 No Content 仍返回 undefined', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const client = createHttpClient({
      basePath: '',
      requestInterceptors: [],
      responseInterceptors: [],
    });

    const result = await client.request<void>('/api/noop', { responseType: 'blob' });
    expect(result).toBeUndefined();
  });
});
