import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { menuApi, type MenuNodeDto, type AppPermission } from '@mb/api-sdk';
import type { MenuNode, UserMenuPayload } from './types';

function toMenuNode(dto: MenuNodeDto): MenuNode {
  return {
    ...dto,
    permissionCode: dto.permissionCode as MenuNode['permissionCode'],
    children: dto.children.map(toMenuNode),
  };
}

export function useMenu(): UseQueryResult<UserMenuPayload, Error> {
  return useQuery({
    queryKey: ['app-shell', 'menu', 'current-user'],
    queryFn: async () => {
      const payload = await menuApi.queryCurrentUserMenu();
      return {
        tree: payload.tree.map(toMenuNode),
        permissions: new Set(payload.permissions) as ReadonlySet<AppPermission>,
      } satisfies UserMenuPayload;
    },
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
