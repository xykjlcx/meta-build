import { cn } from '@mb/ui-primitives';
import { Search } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/**
 * 全局搜索占位组件（UI-only）。
 * - 桌面端：宽搜索框 + ⌘K 快捷键标记
 * - 点击 / ⌘K / Ctrl+K：弹出 toast 提示功能开发中
 */
export function GlobalSearchPlaceholder({ className }: { className?: string }) {
  const { t } = useTranslation('shell');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toast(t('search.comingSoon'), { description: t('search.comingSoonDesc') });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [t]);

  return (
    <button
      type="button"
      onClick={() => toast(t('search.comingSoon'), { description: t('search.comingSoonDesc') })}
      className={cn(
        'inline-flex h-8 w-full max-w-xs items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted',
        className,
      )}
    >
      <Search className="size-3.5 shrink-0" />
      <span className="flex-1 truncate text-left">{t('search.placeholder')}</span>
      <kbd className="pointer-events-none ml-auto hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}
