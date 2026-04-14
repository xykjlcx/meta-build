/**
 * 菜单节点 DTO — 对齐后端 MenuView record。
 *
 * 后端字段：id, parentId, name, permissionCode, menuType, icon, sortOrder, visible, children
 */
export interface MenuNodeDto {
  id: number;
  parentId: number | null;
  name: string;
  /** 权限码（冒号分隔，如 'iam:menu:list'） */
  permissionCode: string | null;
  /** 菜单类型：后端 menuType 字段（如 'DIRECTORY' / 'MENU' / 'BUTTON'） */
  menuType: string;
  icon: string | null;
  /** 排序序号 */
  sortOrder: number | null;
  /** 是否可见 */
  visible: boolean | null;
  children: MenuNodeDto[];
}

/**
 * 当前用户菜单+权限视图 — 对齐后端 CurrentUserMenuView record（GET /menus/current-user 响应）。
 */
export interface CurrentUserMenuView {
  tree: MenuNodeDto[];
  permissions: string[];
}
