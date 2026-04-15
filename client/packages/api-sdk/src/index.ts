// === 手写类型（保留，不被 orval 替代）===
export type { PageResult, ProblemDetail } from './types/common';
export type {
  LoginCommand,
  LoginView,
  UserSummary,
  RefreshCommand,
  CurrentUserView,
} from './types/auth';
export type { MenuNodeDto, CurrentUserMenuView } from './types/menu';
export type { AppPermission } from './types/permission';
export { ALL_APP_PERMISSIONS } from './types/permission';

// === orval 生成的类型和 hooks ===
// 生成代码（generated/）不入 git，由消费方（web-admin）直接导入。
// api-sdk 只导出手写类型和 HTTP 工具。
// 使用方式：import { useXxx } from '@mb/api-sdk/generated/endpoints/...'

// === 错误 ===
export { ProblemDetailError, isProblemDetail } from './errors';

// === 配置 ===
export { configureApiSdk } from './config';
export type { ApiSdkConfig } from './config';

// === HTTP 工具 ===
export type { RequestOptions } from './http-client';
export { triggerDownload } from './http-client';

// === API 门面（手写，保留）===
export { authApi } from './apis/auth-api';
export { menuApi } from './apis/menu-api';
