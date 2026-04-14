export type AppPermission =
  | 'iam.user.list'
  | 'iam.user.create'
  | 'iam.user.update'
  | 'iam.user.delete'
  | 'iam.role.list'
  | 'iam.role.assignPermission'
  | 'iam.menu.read'
  | 'iam.menu.write';

export const ALL_APP_PERMISSIONS: readonly AppPermission[] = [
  'iam.user.list',
  'iam.user.create',
  'iam.user.update',
  'iam.user.delete',
  'iam.role.list',
  'iam.role.assignPermission',
  'iam.menu.read',
  'iam.menu.write',
] as const;
