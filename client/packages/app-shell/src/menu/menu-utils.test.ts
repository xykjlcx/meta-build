import { describe, expect, it } from 'vitest';
import {
  findActiveLeafIdByPath,
  findFirstLeafId,
  findMenuPathByPath,
  matchesMenuHref,
} from './menu-utils';
import type { MenuNode } from './types';

function makeNode(
  id: number,
  name: string,
  overrides: Partial<MenuNode> = {},
  children: MenuNode[] = [],
): MenuNode {
  return {
    id,
    parentId: null,
    name,
    permissionCode: null,
    menuType: 'MENU',
    icon: null,
    sortOrder: id,
    visible: true,
    children,
    ...overrides,
  };
}

describe('menu-utils', () => {
  const menuTree = [
    makeNode(1, '系统管理', { menuType: 'DIRECTORY' }, [
      makeNode(2, '用户管理', { permissionCode: 'iam:user:list' }),
      makeNode(3, '角色管理', { permissionCode: 'iam:role:list' }),
      makeNode(4, '菜单管理', { menuType: 'DIRECTORY' }, [
        makeNode(5, '菜单列表', { permissionCode: 'iam:menu:list' }),
        makeNode(6, '新增菜单', { menuType: 'BUTTON', permissionCode: 'iam:menu:create' }),
      ]),
    ]),
  ] satisfies MenuNode[];

  const resolveHref = (node: MenuNode) => {
    if (node.permissionCode === 'iam:user:list') {
      return '/system/users';
    }
    if (node.permissionCode === 'iam:role:list') {
      return '/system/roles';
    }
    if (node.permissionCode === 'iam:menu:list') {
      return '/system/menus';
    }
    return null;
  };

  it('能匹配精确路径和详情子路径', () => {
    expect(matchesMenuHref('/system/users', '/system/users')).toBe(true);
    expect(matchesMenuHref('/system/users/42', '/system/users')).toBe(true);
    expect(matchesMenuHref('/system/roles', '/system/users')).toBe(false);
  });

  it('基于当前路由找到最深层可展示菜单节点', () => {
    expect(findActiveLeafIdByPath(menuTree, '/system/users', resolveHref)).toBe(2);
    expect(findActiveLeafIdByPath(menuTree, '/system/menus/88', resolveHref)).toBe(5);
  });

  it('基于当前路由返回完整菜单链路', () => {
    expect(
      findMenuPathByPath(menuTree, '/system/menus', resolveHref).map((node) => node.name),
    ).toEqual(['系统管理', '菜单管理', '菜单列表']);
  });

  it('未命中路由时允许调用方回退到首个叶子，且跳过 BUTTON', () => {
    expect(findActiveLeafIdByPath(menuTree, '/unknown', resolveHref)).toBeNull();
    expect(findFirstLeafId(menuTree)).toBe(2);
  });
});
