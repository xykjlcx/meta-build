import { type AppPermission, type MenuVo, menuApi } from '@mb/api-sdk';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { MenuNode, UserMenuPayload } from './types';

function toMenuNode(dto: MenuVo): MenuNode {
  return {
    id: dto.id ?? 0,
    parentId: dto.parentId ?? null,
    name: dto.name ?? '',
    permissionCode: dto.permissionCode as MenuNode['permissionCode'],
    menuType: dto.menuType ?? 'MENU',
    icon: dto.icon ?? null,
    sortOrder: dto.sortOrder ?? null,
    visible: dto.visible ?? null,
    children: (dto.children ?? []).map(toMenuNode),
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
        tree: (payload.tree ?? []).map(toMenuNode),
        permissions: new Set(payload.permissions ?? []) as ReadonlySet<AppPermission>,
      } satisfies UserMenuPayload;
    },
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
