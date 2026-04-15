import { getClient } from '../config';
import type { CurrentUserMenuView, MenuNodeDto } from '../types/menu';

export const menuApi = {
  /** 获取当前用户菜单树+权限列表（GET /menus/current-user，需认证） */
  queryCurrentUserMenu(): Promise<CurrentUserMenuView> {
    return getClient().request('/api/v1/menus/current-user');
  },

  /** 获取菜单树（需 iam:menu:list 权限） */
  tree(): Promise<MenuNodeDto[]> {
    return getClient().request('/api/v1/menus');
  },

  /** 获取单个菜单详情 */
  getById(id: number): Promise<MenuNodeDto> {
    return getClient().request(`/api/v1/menus/${id}`);
  },
};
