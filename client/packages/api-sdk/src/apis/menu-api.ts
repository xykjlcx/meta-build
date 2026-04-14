import { getClient } from '../config';
import type { UserMenuPayload } from '../types/menu';

export const menuApi = {
  queryCurrentUserMenu(): Promise<UserMenuPayload> {
    return getClient().request('/api/v1/menu/current');
  },
};
