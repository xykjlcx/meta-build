import { requireAuth } from '@mb/app-shell';
import { Button } from '@mb/ui-primitives';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authed/settings/')({
  beforeLoad: requireAuth(),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation('notice');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 微信绑定卡片 */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Smartphone className="size-5" />
            <h3 className="font-medium">{t('settings.wechatBinding')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t('settings.wechatBindingDesc')}</p>
          <Link to="/settings/wechat-bind">
            <Button variant="outline" size="sm">
              {t('settings.manageBinding')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
