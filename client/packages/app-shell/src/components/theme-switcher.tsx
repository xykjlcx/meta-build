import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@mb/ui-primitives';
import { type ThemeId, themeRegistry } from '@mb/ui-tokens';
import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

/**
 * 主题切换下拉菜单。
 * 消费 useTheme() + themeRegistry 渲染可选主题列表。
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('shell');

  // 主题 displayName 映射到 i18n key
  const themeNameKey = {
    default: 'theme.default',
    dark: 'theme.dark',
    compact: 'theme.compact',
  } as const satisfies Record<ThemeId, `theme.${string}`>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('theme.switch')}>
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeRegistry.map((meta) => (
          <DropdownMenuItem
            key={meta.id}
            onClick={() => setTheme(meta.id)}
            className={meta.id === theme ? 'bg-accent' : undefined}
          >
            {t(themeNameKey[meta.id])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
