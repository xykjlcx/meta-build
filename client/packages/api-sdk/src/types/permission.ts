/**
 * 权限码类型 — 与后端 @RequirePermission 注解一一对应。
 * 格式：`模块:资源:操作`（冒号分隔）。
 */
export type AppPermission =
  // iam:user
  | 'iam:user:list'
  | 'iam:user:detail'
  | 'iam:user:create'
  | 'iam:user:update'
  | 'iam:user:delete'
  | 'iam:user:resetPassword'
  | 'iam:user:assignRole'
  // iam:role
  | 'iam:role:list'
  | 'iam:role:detail'
  | 'iam:role:create'
  | 'iam:role:update'
  | 'iam:role:delete'
  | 'iam:role:assignMenu'
  // iam:dept
  | 'iam:dept:list'
  | 'iam:dept:detail'
  | 'iam:dept:create'
  | 'iam:dept:delete'
  // iam:menu
  | 'iam:menu:list'
  | 'iam:menu:detail'
  | 'iam:menu:create'
  | 'iam:menu:delete'
  // config
  | 'config:config:list'
  | 'config:config:detail'
  | 'config:config:set'
  | 'config:config:delete'
  // dict
  | 'dict:type:list'
  | 'dict:type:detail'
  | 'dict:type:create'
  | 'dict:type:delete'
  | 'dict:data:list'
  | 'dict:data:create'
  | 'dict:data:delete'
  // notification
  | 'notification:notification:list'
  | 'notification:notification:create'
  | 'notification:notification:read'
  | 'notification:notification:delete'
  // job
  | 'job:log:list'
  // monitor
  | 'monitor:server:list'
  // oplog
  | 'oplog:log:list'
  // file
  | 'file:file:upload'
  | 'file:file:download'
  | 'file:file:delete'
  // notice
  | 'notice:notice:list'
  | 'notice:notice:detail'
  | 'notice:notice:create'
  | 'notice:notice:update'
  | 'notice:notice:delete'
  | 'notice:notice:publish'
  | 'notice:notice:export';

export const ALL_APP_PERMISSIONS: readonly AppPermission[] = [
  // iam:user
  'iam:user:list',
  'iam:user:detail',
  'iam:user:create',
  'iam:user:update',
  'iam:user:delete',
  'iam:user:resetPassword',
  'iam:user:assignRole',
  // iam:role
  'iam:role:list',
  'iam:role:detail',
  'iam:role:create',
  'iam:role:update',
  'iam:role:delete',
  'iam:role:assignMenu',
  // iam:dept
  'iam:dept:list',
  'iam:dept:detail',
  'iam:dept:create',
  'iam:dept:delete',
  // iam:menu
  'iam:menu:list',
  'iam:menu:detail',
  'iam:menu:create',
  'iam:menu:delete',
  // config
  'config:config:list',
  'config:config:detail',
  'config:config:set',
  'config:config:delete',
  // dict
  'dict:type:list',
  'dict:type:detail',
  'dict:type:create',
  'dict:type:delete',
  'dict:data:list',
  'dict:data:create',
  'dict:data:delete',
  // notification
  'notification:notification:list',
  'notification:notification:create',
  'notification:notification:read',
  'notification:notification:delete',
  // job
  'job:log:list',
  // monitor
  'monitor:server:list',
  // oplog
  'oplog:log:list',
  // file
  'file:file:upload',
  'file:file:download',
  'file:file:delete',
  // notice
  'notice:notice:list',
  'notice:notice:detail',
  'notice:notice:create',
  'notice:notice:update',
  'notice:notice:delete',
  'notice:notice:publish',
  'notice:notice:export',
] as const;
