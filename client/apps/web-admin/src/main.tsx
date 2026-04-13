import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-card-foreground">Meta-Build</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="mb-4">
            <label htmlFor="username" className="mb-1 block text-sm text-muted-foreground">
              用户名
            </label>
            <input
              id="username"
              type="text"
              placeholder="请输入用户名"
              className="h-[var(--size-control-height)] w-full rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors duration-[var(--duration-fast)] focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="mb-1 block text-sm text-muted-foreground">
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              className="h-[var(--size-control-height)] w-full rounded-md border border-input bg-background px-3 text-foreground outline-none transition-colors duration-[var(--duration-fast)] focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="h-[var(--size-control-height)] w-full rounded-md bg-primary text-primary-foreground transition-opacity duration-[var(--duration-fast)] hover:opacity-90"
          >
            登录
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">M1 Mock — 接口尚未接入</p>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <LoginPage />
    </StrictMode>,
  );
}
