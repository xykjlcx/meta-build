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
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { registerBusinessResources } from './i18n/register';
import { createAppRouter } from './router';
import './styles.css';

const mockReadyPromise = enableMocking();

// Phase 1: 同步初始化（React 渲染前）
registerBusinessResources();

// api-sdk 配置（必须在 router 创建前，因为 beforeLoad 会调用 authApi）
configureApiSdk({
  basePath: '',
  getToken: () => getAccessToken(),
  getLanguage: () => i18n.language,
  requestGate: async () => {
    if (import.meta.env.PROD) return;
    await mockReadyPromise;
  },
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

function dismissGlobalLoading() {
  const loadingEl = document.getElementById('app-loading');
  if (!loadingEl) {
    return;
  }

  loadingEl.classList.add('fade-out');
  window.setTimeout(() => loadingEl.remove(), 280);
}

function AppReadyEffect() {
  useEffect(() => {
    dismissGlobalLoading();
  }, []);

  return null;
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <StyleProvider defaultStyle="claude-warm" defaultColorMode="light">
            <AppReadyEffect />
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
  await worker.start({ onUnhandledRequest: 'bypass', waitUntilReady: true });
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    !navigator.serviceWorker.controller
  ) {
    const hasReloaded = window.sessionStorage.getItem('mb_msw_reloaded') === '1';
    if (!hasReloaded) {
      window.sessionStorage.setItem('mb_msw_reloaded', '1');
      window.location.reload();
      return new Promise<never>(() => {});
    }
  }
  window.sessionStorage.removeItem('mb_msw_reloaded');
  await waitForServiceWorkerControl();
  (window as unknown as Record<string, unknown>).__msw_enabled__ = true;
  (window as unknown as Record<string, unknown>).__msw_ready__ = true;
}

async function waitForServiceWorkerControl() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  await navigator.serviceWorker.ready;

  const startedAt = performance.now();
  while (!navigator.serviceWorker.controller && performance.now() - startedAt < 3000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  mockReadyPromise.then(() => {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}
