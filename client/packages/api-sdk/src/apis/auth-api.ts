import { getClient } from '../config';
import type { LoginCommand, LoginView, CurrentUserView } from '../types/auth';

export const authApi = {
  login(cmd: LoginCommand): Promise<LoginView> {
    return getClient().request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
  },

  logout(): Promise<void> {
    return getClient().request('/api/v1/auth/logout', { method: 'POST' });
  },

  refresh(refreshToken: string): Promise<LoginView> {
    return getClient().request('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  },

  /** 获取当前登录用户信息（GET /auth/me，需认证） */
  getCurrentUser(): Promise<CurrentUserView> {
    return getClient().request('/api/v1/auth/me');
  },
};
