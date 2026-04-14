// 类型
export type { PageResult, ProblemDetail } from './types/common';
export type { LoginCommand, LoginView, UserSummary, RefreshCommand, CurrentUserView } from './types/auth';
export type { MenuNodeDto, CurrentUserMenuView } from './types/menu';
export type { AppPermission } from './types/permission';
export { ALL_APP_PERMISSIONS } from './types/permission';

// 错误
export { ProblemDetailError, isProblemDetail } from './errors';

// HTTP 客户端扩展
export type { RequestOptions } from './http-client';
export { triggerDownload } from './http-client';

// 配置
export { configureApiSdk } from './config';
export type { ApiSdkConfig } from './config';

// API 门面
export { authApi } from './apis/auth-api';
export { menuApi } from './apis/menu-api';
