import { createFileRoute } from '@tanstack/react-router';
import { BasicLayout, useAuth } from '@mb/app-shell';
import { Button, Input, Label } from '@mb/ui-primitives';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search['redirect'] === 'string' ? search['redirect'] : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation('shell');
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    login({ username, password });
  };

  return (
    <BasicLayout>
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-card-foreground">
            Meta-Build
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? t('auth.login') + '...' : t('auth.login')}
            </Button>
          </form>
        </div>
      </div>
    </BasicLayout>
  );
}
