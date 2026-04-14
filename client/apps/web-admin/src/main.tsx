import {
  DialogContainer,
  I18nProvider,
  ThemeProvider,
  ToastContainer,
  createQueryClient,
} from '@mb/app-shell';
import { initTheme } from '@mb/ui-tokens';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerBusinessResources } from './i18n/register';
import { createAppRouter } from './router';
import './styles.css';

// 在 React 渲染前应用主题，避免闪烁
initTheme();

// 注册业务模块的 i18n 资源
registerBusinessResources();

const queryClient = createQueryClient();
const router = createAppRouter({ queryClient });

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
          <ToastContainer />
          <DialogContainer />
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
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
