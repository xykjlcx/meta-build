// === 手写类型（保留，不被 orval 替代）===
export type { PageResult, ProblemDetail } from './types/common';
export type {
  CurrentUserVo,
  LoginCmd,
  LoginVo,
  RefreshCmd,
  UserSummary,
} from './types/auth';
export type { CurrentUserMenuVo, MenuVo } from './types/menu';
export type { AppPermission } from './types/permission';
export { ALL_APP_PERMISSIONS } from './types/permission';
export type {
  NoticeBatchInput,
  NoticeBatchResult,
  NoticeCreateInput,
  NoticeDetailVo,
  NoticeExportParams,
  NoticeListParams,
  NotificationLogVo,
  NoticePublishInput,
  NoticeRecipientsParams,
  NoticeTarget,
  NoticeUnreadCount,
  NoticeUpdateInput,
  NoticeVo,
  RecipientVo,
} from './apis/notice-api';
export type { FileUploadVo } from './apis/file-api';
export type {
  WeChatBindingVo,
  WeChatMiniBindInput,
  WeChatMpBindInput,
  WeChatMpOauthState,
} from './apis/wechat-binding-api';

// === orval 生成的类型和 hooks ===
// generated/ 由 orval 生成并提交到仓库，作为契约快照的一部分。
// L5 业务代码优先通过本包导出的稳定 façade（如 noticeApi / useNoticeList）访问。
// 直接导入 generated/* 仅保留给 api-sdk 内部或迁移中的代码。

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
export { fileApi } from './apis/file-api';
export { menuApi } from './apis/menu-api';
export {
  noticeApi,
  noticeQueryKeys,
  useBatchDeleteNotices,
  useBatchPublishNotices,
  useCreateNotice,
  useDeleteNotice,
  useDuplicateNotice,
  useMarkNoticeRead,
  useNoticeDetail,
  useNoticeList,
  useNoticeNotificationLogs,
  useNoticeRecipients,
  usePublishNotice,
  useRevokeNotice,
  useUnreadNoticeCount,
  useUpdateNotice,
} from './apis/notice-api';
export {
  deleteDeptById,
  getDept,
  getDeptById,
  getGetDeptByIdQueryKey,
  getGetDeptQueryKey,
  postDept,
  useDeleteDeptById,
  useGetDept,
  useGetDeptById,
  usePostDept,
} from './generated/endpoints/dept-controller/dept-controller';
export {
  deleteMenuById,
  getGetMenuByIdQueryKey,
  getGetMenuQueryKey,
  getMenu,
  getMenuById,
  postMenu,
  useDeleteMenuById,
  useGetMenu,
  useGetMenuById,
  usePostMenu,
} from './generated/endpoints/menu-controller/menu-controller';
export {
  deleteRoleById,
  getGetRoleByIdQueryKey,
  getGetRoleQueryKey,
  getRole,
  getRoleById,
  postRole,
  putRoleById,
  putRoleByIdMenu,
  useDeleteRoleById,
  useGetRole,
  useGetRoleById,
  usePostRole,
  usePutRoleById,
  usePutRoleByIdMenu,
} from './generated/endpoints/role-controller/role-controller';
export {
  deleteUserById,
  getGetUserByIdQueryKey,
  getGetUserQueryKey,
  getUser,
  getUserById,
  postUser,
  postUserByIdResetPassword,
  putUserById,
  putUserByIdRole,
  useDeleteUserById,
  useGetUser,
  useGetUserById,
  usePostUser,
  usePostUserByIdResetPassword,
  usePutUserById,
  usePutUserByIdRole,
} from './generated/endpoints/user-controller/user-controller';
export type {
  DeptVo,
  GetRoleParams,
  GetUserParams,
  MenuCreateCmd,
  RoleCreateCmd,
  RoleVo,
  RoleUpdateCmd,
  UserCreateCmd,
  UserUpdateCmd,
  UserVo,
} from './generated/models';
export {
  useBindWechatMini,
  useBindWechatMp,
  useUnbindWechat,
  useWechatBindings,
  useWechatMpOauthState,
  wechatBindingApi,
  wechatBindingQueryKeys,
} from './apis/wechat-binding-api';
