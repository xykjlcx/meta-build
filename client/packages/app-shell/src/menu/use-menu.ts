import { type MenuNodeDto, type AppPermission, menuApi } from '@mb/api-sdk';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { MenuNode, UserMenuPayload } from './types';

function toMenuNode(dto: MenuNodeDto): MenuNode {
  return {
    ...dto,
    permissionCode: dto.permissionCode as MenuNode['permissionCode'],
    children: dto.children.map(toMenuNode),
  };
}

/**
 * 当前用户菜单 + 权限 hook。
 *
 * 调用 GET /api/v1/menus/current-user，返回菜单树 + 权限集合。
 * 1 小时缓存，登录时 invalidate。
 */
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
