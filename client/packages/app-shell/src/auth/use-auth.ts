import { type LoginCommand, type LoginView, authApi } from '@mb/api-sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

const ACCESS_TOKEN_KEY = 'mb_access_token';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

/**
 * 登录成功后缓存用户信息到 queryClient，
 * 这样 useCurrentUser 可以直接读取，不需要额外的 /me 请求。
 */
function cacheLoginUser(queryClient: ReturnType<typeof useQueryClient>, result: LoginView) {
  if (result.user) {
    queryClient.setQueryData(['auth', 'currentUser'], result.user);
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (cmd: LoginCommand) => authApi.login(cmd),
    onSuccess: (result) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      cacheLoginUser(queryClient, result);
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
