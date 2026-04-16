import type {
  CurrentUserMenuVo as GeneratedCurrentUserMenuVo,
  MenuVo as GeneratedMenuVo,
} from '../generated/models';

export interface MenuVo extends Omit<
  GeneratedMenuVo,
  'id' | 'parentId' | 'name' | 'permissionCode' | 'menuType' | 'icon' | 'sortOrder' | 'visible' | 'children'
> {
  id: number;
  parentId: number | null;
  name: string;
  permissionCode: string | null;
  menuType: string;
  icon: string | null;
  sortOrder: number | null;
  visible: boolean | null;
  children: MenuVo[];
}

export interface CurrentUserMenuVo extends Omit<GeneratedCurrentUserMenuVo, 'tree' | 'permissions'> {
  tree: MenuVo[];
  permissions: string[];
}
