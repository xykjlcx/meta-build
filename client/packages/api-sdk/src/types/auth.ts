/**
 * 登录命令 — 对齐后端 LoginCommand record。
 */
export interface LoginCommand {
  username: string;
  password: string;
  /** 验证码 token（失败次数达阈值时必填） */
  captchaToken?: string;
  /** 验证码（失败次数达阈值时必填） */
  captchaCode?: string;
}

/**
 * Token 刷新命令 — 对齐后端 RefreshCommand record。
 */
export interface RefreshCommand {
  refreshToken: string;
}

/**
 * 登录/刷新成功返回的用户摘要 — 对齐后端 LoginView.UserSummary record。
 */
export interface UserSummary {
  userId: number;
  username: string;
  deptId: number | null;
  permissions: string[];
}

/**
 * 登录/刷新成功视图 — 对齐后端 LoginView record。
 *
 * 注意：后端没有独立的 /me 端点，当前用户信息通过 LoginView.user 返回。
 */
export interface LoginView {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number | null;
  user: UserSummary | null;
}

/**
 * 当前用户视图 — 对齐后端 CurrentUserView record（GET /auth/me 响应）。
 */
export interface CurrentUserView {
  userId: number;
  username: string;
  deptId: number | null;
  permissions: string[];
  roles: string[];
  isAdmin: boolean;
}
