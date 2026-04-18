import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { MenuNode } from '../types';
import { useActiveModule } from '../use-active-module';

const menu: MenuNode[] = [
  {
    id: 1,
    parentId: null,
    name: '组织管理',
    menuType: 'DIRECTORY',
    icon: null,
    sortOrder: 1,
    visible: true,
    permissionCode: null,
    children: [
      {
        id: 10,
        parentId: 1,
        name: '成员与部门',
        menuType: 'MENU',
        icon: null,
        sortOrder: 1,
        visible: true,
        permissionCode: null,
        children: [],
      },
    ],
  },
  {
    id: 2,
    parentId: null,
    name: '内容',
    menuType: 'DIRECTORY',
    icon: null,
    sortOrder: 2,
    visible: true,
    permissionCode: null,
    children: [],
  },
];

describe('useActiveModule', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('picks first module when no URL match and no localStorage', () => {
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/',
        resolveMenuHref: (n) => (n.id === 10 ? '/system/members' : null),
      }),
    );
    expect(result.current.activeModuleId).toBe(1);
  });

  it('picks module by URL match', () => {
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/system/members',
        resolveMenuHref: (n) => (n.id === 10 ? '/system/members' : null),
      }),
    );
    expect(result.current.activeModuleId).toBe(1);
  });

  it('persists active module to localStorage on setActiveModule', () => {
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/',
        resolveMenuHref: () => null,
      }),
    );
    act(() => {
      result.current.setActiveModule(2);
    });
    expect(result.current.activeModuleId).toBe(2);
    expect(window.localStorage.getItem('mb_active_module_id')).toBe('2');
  });

  it('restores from localStorage when no URL match', () => {
    window.localStorage.setItem('mb_active_module_id', '2');
    const { result } = renderHook(() =>
      useActiveModule({
        menuTree: menu,
        currentPathname: '/',
        resolveMenuHref: () => null,
      }),
    );
    expect(result.current.activeModuleId).toBe(2);
  });
});
