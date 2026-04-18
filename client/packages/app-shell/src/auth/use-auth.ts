import { type LoginCmd, authApi } from '@mb/api-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

const ACCESS_TOKEN_KEY = 'mb_access_token';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (cmd: LoginCmd) => authApi.login(cmd),
    onSuccess: (result) => {
      if (!result.accessToken || !result.refreshToken) {
        throw new Error('登录响应缺少 token');
      }
      localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      // 登录后清空上一会话的查询缓存，避免沿用旧账号的用户信息或业务数据。
      queryClient.clear();
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') ?? '/';
      navigate({ to: redirectTo });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      queryClient.clear();
      navigate({ to: '/auth/login' });
    },
  });

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
