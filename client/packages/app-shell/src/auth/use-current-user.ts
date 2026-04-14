import { useQuery } from '@tanstack/react-query';
import { authApi, ProblemDetailError, type CurrentUserView } from '@mb/api-sdk';
import { ANONYMOUS, type CurrentUser } from './types';

export function toCurrentUser(dto: CurrentUserView): CurrentUser {
  const permissions = new Set(dto.permissions) as ReadonlySet<string> as CurrentUser['permissions'];
  return {
    isAuthenticated: true,
    userId: dto.userId,
    username: dto.username,
    deptId: dto.deptId,
    permissions,
    hasPermission: (code) => permissions.has(code),
    hasAnyPermission: (...codes) => codes.some((c) => permissions.has(c)),
    hasAllPermissions: (...codes) => codes.every((c) => permissions.has(c)),
  };
}

/**
 * 当前用户信息 hook。
 *
 * 调用 GET /api/v1/auth/me 获取用户信息，5 分钟缓存。
 * 未认证时返回 ANONYMOUS（不抛错）。
 */
export function useCurrentUser(): CurrentUser {
  const { data, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: 1, // 允许重试一次（网络抖动）
    throwOnError: false,
  });

  if (error) {
    // 401 → 真的未登录；其他错误 → 网络问题，仍返回 ANONYMOUS 但 log 警告
    if (error instanceof ProblemDetailError && error.status === 401) {
      return ANONYMOUS;
    }
    console.warn('[useCurrentUser] 获取用户信息失败，非 401 错误:', error.message);
  }

  return data ? toCurrentUser(data) : ANONYMOUS;
}
