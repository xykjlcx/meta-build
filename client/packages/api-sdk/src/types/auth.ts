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

export type UserSummary = GeneratedUserSummary;

export interface LoginVo extends Omit<GeneratedLoginVo, 'user'> {
  user: UserSummary | null;
}

export type CurrentUserVo = GeneratedCurrentUserVo;
