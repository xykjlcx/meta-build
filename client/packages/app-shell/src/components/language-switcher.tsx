import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@mb/ui-primitives';
import { useLanguage } from '../i18n';

/**
 * 语言切换下拉菜单。
 * 消费 useLanguage() 获取当前语言和支持的语言列表。
 */
export function LanguageSwitcher() {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation('shell');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('language.switch')}>
          <Globe className="size-4" />
          <span className="hidden sm:inline">{supportedLanguages[language].label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(supportedLanguages) as [typeof language, { label: string }][]).map(
          ([key, { label }]) => (
            <DropdownMenuItem key={key} onClick={() => setLanguage(key)}>
              {label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
