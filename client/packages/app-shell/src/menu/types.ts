import type { AppPermission } from '@mb/api-sdk';

export interface MenuNode {
  id: number;
  parentId: number | null;
  name: string;
  icon: string | null;
  path: string | null;
  kind: 'directory' | 'menu' | 'button';
  permissionCode: AppPermission | null;
  isOrphan: boolean;
  children: MenuNode[];
}

export interface UserMenuPayload {
  tree: MenuNode[];
  permissions: ReadonlySet<AppPermission>;
}
