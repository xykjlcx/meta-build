import { configureApiSdk } from '@mb/api-sdk';
import {
  DialogContainer,
  GlobalErrorBoundary,
  I18nProvider,
  ThemeProvider,
  ToastContainer,
  createQueryClient,
  getAccessToken,
  i18n,
} from '@mb/app-shell';
import { initTheme } from '@mb/ui-tokens';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerBusinessResources } from './i18n/register';
import { createAppRouter } from './router';
import './styles.css';

// Phase 1: 同步初始化（React 渲染前）
initTheme();
registerBusinessResources();

// api-sdk 配置（必须在 router 创建前，因为 beforeLoad 会调用 authApi）
configureApiSdk({
  basePath: '',
  getToken: () => getAccessToken(),
  getLanguage: () => i18n.language,
  onUnauthenticated: () => {
    window.location.href = '/auth/login';
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
          <ThemeProvider>
            <RouterProvider router={router} />
            <ToastContainer />
            <DialogContainer />
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

async function enableMocking() {
  if (import.meta.env.PROD) return;
  const { worker } = await import('./mock/browser');
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
