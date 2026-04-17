import { Button } from '@mb/ui-primitives';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStyle } from '../theme';

/**
 * 暗色模式切换按钮。
 * 与 ThemeCustomizer 内部的 colorMode 切换共用同一 StyleProvider state，两处状态自动同步。
 */
export function DarkModeToggle() {
  const { t } = useTranslation('shell');
  const { colorMode, setColorMode } = useStyle();
  const isDark = colorMode === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t(isDark ? 'header.switchToLight' : 'header.switchToDark')}
      onClick={() => setColorMode(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
