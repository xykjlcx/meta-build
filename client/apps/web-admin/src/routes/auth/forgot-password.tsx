import { BasicLayout } from '@mb/app-shell';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation('shell');
  return (
    <BasicLayout>
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-card-foreground">
            {t('auth.forgotPassword')}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">M3 占位页面</p>
          <Link to="/auth/login" className="text-sm text-primary underline">
            {t('auth.login')}
          </Link>
        </div>
      </div>
    </BasicLayout>
  );
}
