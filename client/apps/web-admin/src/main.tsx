import { configureApiSdk } from '@mb/api-sdk';
import type { LoginVo } from '@mb/api-sdk';
import {
  DialogContainer,
  GlobalErrorBoundary,
  I18nProvider,
  StyleProvider,
  ToastContainer,
  createQueryClient,
  getAccessToken,
  i18n,
} from '@mb/app-shell';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerBusinessResources } from './i18n/register';
import { createAppRouter } from './router';
import './styles.css';

// Phase 1: 同步初始化（React 渲染前）
registerBusinessResources();

// api-sdk 配置（必须在 router 创建前，因为 beforeLoad 会调用 authApi）
configureApiSdk({
  basePath: '',
  getToken: () => getAccessToken(),
  getLanguage: () => i18n.language,
  tryRefreshToken: async () => {
    const refreshToken = localStorage.getItem('mb_refresh_token');
    if (!refreshToken) return null;
    try {
      // 直接用 fetch 发 refresh 请求，绕过 http-client 的 401 retry 逻辑，避免死锁
      const resp = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!resp.ok) return null;
      const result: LoginVo = await resp.json();
      if (!result.accessToken || !result.refreshToken) {
        return null;
      }
      localStorage.setItem('mb_access_token', result.accessToken);
      localStorage.setItem('mb_refresh_token', result.refreshToken);
      return result.accessToken;
    } catch {
      return null;
    }
  },
  onUnauthenticated: () => {
    // replace 不在 history 中留下当前页面，避免用户后退到 401 页面
    const currentPath = window.location.pathname + window.location.search;
    window.location.replace(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  },
  onForbidden: (err) => {
    console.error('[403]', err.message);
  },
  onServerError: (err) => {
    console.error('[5xx]', err.message);
  },
});

const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <StyleProvider>
            <RouterProvider router={router} />
            <ToastContainer />
            <DialogContainer />
          </StyleProvider>
        </I18nProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

async function enableMocking() {
  if (import.meta.env.PROD) return;
  const { worker } = await import('./mock/browser');
  (window as unknown as Record<string, unknown>).__msw_enabled__ = true;
  return worker.start({ onUnhandledRequest: 'bypass' });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  enableMocking().then(() => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
