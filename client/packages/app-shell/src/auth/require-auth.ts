import type { AppPermission } from '@mb/api-sdk';
import { redirect } from '@tanstack/react-router';

export interface RequireAuthOptions {
  permission?: AppPermission;
}

export class ForbiddenError extends Error {
  readonly permission: AppPermission;
  constructor(permission: AppPermission) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = 'ForbiddenError';
    this.permission = permission;
  }
}

export function requireAuth(options: RequireAuthOptions = {}) {
  return ({ context }: { context: { currentUser?: { isAuthenticated: boolean; permissions: ReadonlySet<string> } } }) => {
    const user = context.currentUser;
    if (!user || !user.isAuthenticated) {
      throw redirect({ to: '/auth/login', search: { redirect: location.pathname } });
    }
    if (options.permission && !user.permissions.has(options.permission)) {
      throw new ForbiddenError(options.permission);
    }
  };
}
