import type { AppPermission } from '@mb/api-sdk';

export interface CurrentUser {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  permissions: ReadonlySet<AppPermission>;
  roles: ReadonlySet<string>;
  hasPermission(code: AppPermission): boolean;
  hasAnyPermission(...codes: AppPermission[]): boolean;
  hasAllPermissions(...codes: AppPermission[]): boolean;
  isAdmin: boolean;
}

export const ANONYMOUS: CurrentUser = {
  isAuthenticated: false,
  userId: null,
  username: null,
  permissions: new Set(),
  roles: new Set(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  isAdmin: false,
};
