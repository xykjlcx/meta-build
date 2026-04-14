import { getClient } from '../config';
import type { LoginCommand, LoginResult, CurrentUserDto } from '../types/auth';

export const authApi = {
  login(cmd: LoginCommand): Promise<LoginResult> {
    return getClient().request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
  },
  logout(): Promise<void> {
    return getClient().request('/api/v1/auth/logout', { method: 'POST' });
  },
  getCurrentUser(): Promise<CurrentUserDto> {
    return getClient().request('/api/v1/auth/me');
  },
};
