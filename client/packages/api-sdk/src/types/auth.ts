export interface LoginCommand {
  username: string;
  password: string;
  captchaCode?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserDto {
  userId: number;
  username: string;
  permissions: string[];
  roles: string[];
  isAdmin: boolean;
}
