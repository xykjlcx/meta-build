import { useQuery } from '@tanstack/react-query';
import { authApi, type CurrentUserView } from '@mb/api-sdk';
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
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
  return data ? toCurrentUser(data) : ANONYMOUS;
}
