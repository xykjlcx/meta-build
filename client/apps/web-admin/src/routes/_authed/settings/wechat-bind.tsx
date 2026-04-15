import { type WeChatBindingView, wechatBindingApi } from '@mb/api-sdk';
import { requireAuth } from '@mb/app-shell';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mb/ui-primitives';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authed/settings/wechat-bind')({
  beforeLoad: requireAuth(),
  component: WechatBindPage,
});

function WechatBindPage() {
  const { t } = useTranslation('notice');
  const [bindings, setBindings] = useState<WeChatBindingView[]>([]);
  const [loading, setLoading] = useState(false);

  // 查询绑定状态 — 后端返回 WeChatBindingView[] 直接体
  const fetchBindings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await wechatBindingApi.myBindings();
      setBindings(result ?? []);
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, []);

  // 公众号绑定 — 后端返回 { state: string }，前端拼接微信 OAuth URL
  const handleBindMP = useCallback(async () => {
    try {
      const result = await wechatBindingApi.generateMpOauthState();
      // 用 state 拼接微信 OAuth 授权 URL（appId 由后端 WeChatProperties 管理，
      // 前端通过 env 变量获取或由后端返回完整 URL。v1 先用 placeholder）
      const appId = import.meta.env.VITE_WECHAT_MP_APP_ID ?? '';
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/v1/wechat/bind-mp`);
      const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${result.state}#wechat_redirect`;
      window.location.href = authUrl;
    } catch {
      toast.error(t('wechatError.authUrlFailed'));
    }
  }, [t]);

  // 解绑 — 后端 DELETE /api/v1/wechat/unbind/{platform}（path variable）
  const handleUnbind = useCallback(
    async (platform: string) => {
      try {
        await wechatBindingApi.unbind(platform);
        toast.success(t('wechat.unbind'));
        fetchBindings();
      } catch {
        toast.error(t('wechatError.unbindFailed'));
      }
    },
    [fetchBindings, t],
  );

  // 初始化加载
  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  const mpBinding = bindings.find((b) => b.platform === 'MP');
  const miniBinding = bindings.find((b) => b.platform === 'MINI');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('settings.wechatBinding')}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 公众号绑定 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('wechat.bindMP')}</CardTitle>
            <CardDescription>{t('settings.mpDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {mpBinding ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{t('wechat.bound')}</Badge>
                  <span className="text-sm">{mpBinding.nickname}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUnbind('MP')}>
                  {t('wechat.unbind')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{t('wechat.unbound')}</Badge>
                <Button size="sm" onClick={handleBindMP} disabled={loading}>
                  {t('wechat.bindMP')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 小程序绑定 — 仅在小程序 WebView 环境下显示 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('wechat.bindMini')}</CardTitle>
            <CardDescription>{t('settings.miniDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {miniBinding ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{t('wechat.bound')}</Badge>
                  <span className="text-sm">{miniBinding.nickname}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUnbind('MINI')}>
                  {t('wechat.unbind')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{t('wechat.unbound')}</Badge>
                <span className="text-sm text-muted-foreground">
                  {t('settings.miniNotInWebview')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
