import type {
  CurrentUserVo as GeneratedCurrentUserVo,
  LoginCmd as GeneratedLoginCmd,
  LoginVo as GeneratedLoginVo,
  RefreshCmd as GeneratedRefreshCmd,
  UserSummary as GeneratedUserSummary,
} from '../generated/models';

export interface LoginCmd extends Omit<GeneratedLoginCmd, 'username' | 'password'> {
  username: string;
  password: string;
  captchaToken?: string;
  captchaCode?: string;
}

export interface RefreshCmd extends Omit<GeneratedRefreshCmd, 'refreshToken'> {
  refreshToken: string;
}

export interface UserSummary extends Omit<GeneratedUserSummary, 'userId' | 'username' | 'deptId' | 'permissions'> {
  userId: number;
  username: string;
  deptId: number | null;
  permissions: string[];
}

export interface LoginVo extends Omit<GeneratedLoginVo, 'accessToken' | 'refreshToken' | 'expiresInSeconds' | 'user'> {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number | null;
  user: UserSummary | null;
}

export interface CurrentUserVo extends Omit<GeneratedCurrentUserVo, 'userId' | 'username' | 'deptId' | 'permissions' | 'roles' | 'isAdmin'> {
  userId: number;
  username: string;
  deptId: number | null;
  permissions: string[];
  roles: string[];
  isAdmin: boolean;
}
