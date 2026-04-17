import type { AppPermission } from '@mb/api-sdk';

export interface CurrentUser {
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  deptId: number | null;
  /** 用户邮箱（可选，后端尚未返回时保持 null，由 UI fallback 兜底） */
  email: string | null;
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
  email: null,
  permissions: new Set(),
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
};
