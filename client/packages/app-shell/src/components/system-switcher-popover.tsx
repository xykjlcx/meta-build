import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from '@mb/ui-primitives';
import {
  BarChart3,
  BookOpen,
  GitBranch,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Package,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import type { SystemItem } from '../layouts/types';

/**
 * 九宫格"系统级切换"Popover（Google Apps / O365 App Launcher 视觉语言）。
 *
 * - 数据由 L5（web-admin）硬编码注入（Q9：v1 前端静态）
 * - 当前系统高亮（`current: true`）
 * - 未上线系统 `disabled` 置灰，Tooltip 显示"敬请期待"
 * - Lucide 图标按 `icon` 字段映射，未命中 fallback 为 LayoutGrid
 */
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  wallet: Wallet,
  'users-round': UsersRound,
  package: Package,
  'bar-chart-3': BarChart3,
  'book-open': BookOpen,
  'git-branch': GitBranch,
  'message-square': MessageSquare,
  'more-horizontal': MoreHorizontal,
};

export interface SystemSwitcherPopoverProps {
  systems: SystemItem[];
}

export function SystemSwitcherPopover({ systems }: SystemSwitcherPopoverProps) {
  const { t } = useTranslation('shell');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('system.switcher', { defaultValue: 'Systems' })}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="grid grid-cols-3 gap-1">
          {systems.map((s) => {
            const Icon = ICON_MAP[s.icon] ?? LayoutGrid;
            const tile = (
              <button
                type="button"
                disabled={s.disabled}
                className={cn(
                  'w-full flex flex-col items-center justify-center gap-1 p-3 rounded-md text-xs',
                  'transition-colors',
                  s.current && 'bg-accent text-accent-foreground',
                  !s.current && !s.disabled && 'hover:bg-accent/60',
                  s.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <Icon className="h-5 w-5" />
                {/* labelKey 来自 L5 注入的 SystemItem（string），t() 类型窄化到 shell namespace 字面量，
                    运行时仍按 key 查表，因此用 `as never` 旁路类型检查 */}
                <span>{t(s.labelKey as never)}</span>
              </button>
            );
            if (s.disabled) {
              // 原生 disabled button 不响应 hover，需用 <span> 包裹以触发 Tooltip
              return (
                <Tooltip key={s.key}>
                  <TooltipTrigger asChild>
                    <span className="block">{tile}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('system.comingSoon', { defaultValue: '敬请期待' })}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={s.key}>{tile}</div>;
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('system.placeholder', { defaultValue: '更多系统即将推出' })}
        </p>
      </PopoverContent>
    </Popover>
  );
}
