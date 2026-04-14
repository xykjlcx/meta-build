import type { AppPermission } from '@mb/api-sdk';

/**
 * 前端菜单节点 — 由 api-sdk MenuNodeDto 转换而来。
 * 字段与后端 MenuView 一一对应。
 */
export interface MenuNode {
  id: number;
  parentId: number | null;
  name: string;
  permissionCode: AppPermission | null;
  /** 菜单类型（'DIRECTORY' / 'MENU' / 'BUTTON'） */
  menuType: string;
  icon: string | null;
  sortOrder: number | null;
  visible: boolean | null;
  children: MenuNode[];
}

export interface UserMenuPayload {
  tree: MenuNode[];
  permissions: ReadonlySet<AppPermission>;
}
