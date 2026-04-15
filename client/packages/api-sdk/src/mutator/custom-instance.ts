import { getClient } from '../config';

/**
 * orval mutator — 薄包装，委托给现有 HttpClient。
 *
 * 所有拦截器（auth token / Accept-Language / X-Request-ID / error / 401 refresh）
 * 在 HttpClient 内部处理，mutator 不需要重复实现。
 *
 * 签名匹配 orval fetch 模式要求：(url: string, options: RequestInit) => Promise<T>
 */
export const customInstance = async <T>(url: string, options: RequestInit): Promise<T> => {
  return getClient().request<T>(url, options);
};

export default customInstance;
