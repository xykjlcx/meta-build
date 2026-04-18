import { type AppPermission, type MenuVo, menuApi } from '@mb/api-sdk';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { MenuNode, UserMenuPayload } from './types';

async function waitForMockRuntimeReady() {
  if (typeof window === 'undefined') {
    return;
  }

  const runtime = window as unknown as Record<string, unknown>;
  if (!runtime.__msw_enabled__) {
    return;
  }

  const startedAt = performance.now();
  while (performance.now() - startedAt < 3000) {
    if (runtime.__msw_ready__ && navigator.serviceWorker.controller) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

function toMenuNode(dto: MenuVo): MenuNode {
  return {
    id: dto.id,
    parentId: dto.parentId,
    name: dto.name,
    permissionCode: dto.permissionCode as MenuNode['permissionCode'],
    menuType: dto.menuType,
    icon: dto.icon,
    sortOrder: dto.sortOrder,
    visible: dto.visible,
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
      await waitForMockRuntimeReady();
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
