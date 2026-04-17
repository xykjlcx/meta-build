import type { AppPermission } from '@mb/api-sdk';

/**
 * 前端菜单节点 — 由 api-sdk MenuVo 转换而来。
 * 字段与后端 MenuVo 一一对应。
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

  /** 菜单项图标的背景方块色（hex / rgb 字符串，用于 campus 风格彩色方块） */
  iconBg?: string;

  /** 菜单项图标的背景方块色，引用 CSS token 名（如 "--color-orange-500"） */
  iconBgColor?: string;

  /** 菜单项右侧角标（数字或字符串） */
  badge?: string | number;
}

export interface UserMenuPayload {
  tree: MenuNode[];
  permissions: ReadonlySet<AppPermission>;
}
