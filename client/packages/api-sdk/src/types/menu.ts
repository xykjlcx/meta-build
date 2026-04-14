export interface MenuNodeDto {
  id: number;
  parentId: number | null;
  name: string;
  icon: string | null;
  path: string | null;
  kind: 'directory' | 'menu' | 'button';
  permissionCode: string | null;
  isOrphan: boolean;
  children: MenuNodeDto[];
}

export interface UserMenuPayload {
  tree: MenuNodeDto[];
  permissions: string[];
}
