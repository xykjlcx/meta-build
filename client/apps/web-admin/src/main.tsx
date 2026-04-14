import { initTheme } from '@mb/ui-tokens';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  I18nProvider,
  ThemeProvider,
  createQueryClient,
  ToastContainer,
  DialogContainer,
} from '@mb/app-shell';
import { createAppRouter } from './router';
import './styles.css';

// 在 React 渲染前应用主题，避免闪烁
initTheme();

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

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
