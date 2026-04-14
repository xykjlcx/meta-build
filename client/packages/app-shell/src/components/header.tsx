import { useTranslation } from 'react-i18next';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback, Button, Separator } from '@mb/ui-primitives';
import { useCurrentUser, useAuth } from '../auth';
import { LanguageSwitcher } from './language-switcher';
import { ThemeSwitcher } from './theme-switcher';

/**
 * 顶部 Header 栏（用于 SidebarLayout）。
 * 右侧工具栏：语言切换 + 主题切换 + 用户头像 + 退出。
 */
export function Header() {
  const { t } = useTranslation('shell');
  const user = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();

  return (
    <header className="flex h-[var(--size-header-height)] shrink-0 items-center justify-between border-b bg-background px-4">
      {/* 左侧：面包屑等将来放这里 */}
      <div />

      {/* 右侧工具栏 */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeSwitcher />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>
              <User className="size-3" />
            </AvatarFallback>
          </Avatar>
          {user.isAuthenticated && user.username && (
            <span className="hidden text-sm font-medium sm:inline">{user.username}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          disabled={isLoggingOut}
          aria-label={t('header.logout')}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">{t('header.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
