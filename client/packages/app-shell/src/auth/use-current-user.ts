import { type CurrentUserDto, authApi } from '@mb/api-sdk';
import { useQuery } from '@tanstack/react-query';
import { ANONYMOUS, type CurrentUser } from './types';

function toCurrentUser(dto: CurrentUserDto): CurrentUser {
  const permissions = new Set(dto.permissions) as ReadonlySet<string> as CurrentUser['permissions'];
  const roles = new Set(dto.roles);
  return {
    isAuthenticated: true,
    userId: dto.userId,
    username: dto.username,
    permissions,
    roles,
    hasPermission: (code) => permissions.has(code),
    hasAnyPermission: (...codes) => codes.some((c) => permissions.has(c)),
    hasAllPermissions: (...codes) => codes.every((c) => permissions.has(c)),
    isAdmin: dto.isAdmin,
  };
}

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
