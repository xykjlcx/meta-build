import type { AppPermission } from '@mb/api-sdk';
import type { MenuNode } from '@mb/app-shell';

const PATH_BY_PERMISSION: Partial<Record<AppPermission, string>> = {
  'iam:user:list': '/system/users',
  'iam:role:list': '/system/roles',
  'iam:dept:list': '/system/depts',
  'iam:menu:list': '/system/menus',
  'notice:notice:list': '/notices',
};

export function resolveMenuHref(node: MenuNode): string | null {
  if (node.permissionCode && PATH_BY_PERMISSION[node.permissionCode]) {
    return PATH_BY_PERMISSION[node.permissionCode] ?? null;
  }

  if (node.name === '微信绑定') {
    return '/settings/wechat-bind';
  }

  return null;
}
