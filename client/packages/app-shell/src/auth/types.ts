import type { AppPermission } from '@mb/api-sdk';

export interface CurrentUser {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  deptId: number | null;
  permissions: ReadonlySet<AppPermission>;
  hasPermission(code: AppPermission): boolean;
  hasAnyPermission(...codes: AppPermission[]): boolean;
  hasAllPermissions(...codes: AppPermission[]): boolean;
}

export const ANONYMOUS: CurrentUser = {
  isAuthenticated: false,
  userId: null,
  username: null,
  deptId: null,
  permissions: new Set(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
};
