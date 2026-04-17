import { Popover, PopoverContent, PopoverTrigger, Separator, cn } from '@mb/ui-primitives';
import { BarChart2, Database, LayoutDashboard, Settings, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// ─── 九宫格 icon ───────────────────────────────────────────

function NineGridIcon() {
  return (
    <span className="grid h-[1.125rem] w-[1.125rem] grid-cols-3 gap-[0.125rem]">
      {Array.from({ length: 9 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 静态装饰图标，顺序固定
        <span key={index} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </span>
  );
}

// ─── 静态入口数据（v1 placeholder，不接业务）───────────────

const PRIMARY_ENTRIES = [
  { key: 'dashboard', labelZh: '工作台', labelEn: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', labelZh: '用户管理', labelEn: 'Users', icon: Users },
  { key: 'permissions', labelZh: '权限管理', labelEn: 'Permissions', icon: Shield },
];

const SECONDARY_ENTRIES = [
  { key: 'settings', labelZh: '系统设置', labelEn: 'Settings', icon: Settings },
  { key: 'analytics', labelZh: '数据看板', labelEn: 'Analytics', icon: BarChart2 },
  { key: 'apps', labelZh: '应用中心', labelEn: 'Apps', icon: Database },
];

// ─── 组件 ────────────────────────────────────────────────

/**
 * MixSubsystemSwitcher — 九宫格子系统切换器
 *
 * - v1 阶段：硬编码假入口（不接业务路由）
 * - Trigger：36x36 ghost icon button，里面是 3×3 圆点网格
 * - Popover：两组 3 列网格，Separator 分割，每项图标 + 文字
 */
export function MixSubsystemSwitcher() {
  const { t, i18n } = useTranslation('shell');
  const [open, setOpen] = useState(false);
  const isZh = i18n.language.startsWith('zh');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('mix.subsystemSwitcher')}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-icon-foreground)] transition-colors duration-[var(--duration-fast)]',
            open ? 'bg-secondary text-foreground' : 'hover:bg-secondary hover:text-foreground',
          )}
        >
          <NineGridIcon />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[20.5rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-card p-0"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {/* 主要入口 */}
        <div className="grid grid-cols-3 gap-x-1 gap-y-2 p-3">
          {PRIMARY_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center rounded-lg px-1.5 py-3 text-center transition-colors duration-[var(--duration-fast)] hover:bg-secondary"
              >
                <span className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[var(--color-sidebar-accent-foreground)]">
                  <Icon className="h-[1.125rem] w-[1.125rem]" />
                </span>
                <span className="text-[0.8125rem] font-medium leading-4 text-foreground">
                  {isZh ? entry.labelZh : entry.labelEn}
                </span>
              </button>
            );
          })}
        </div>
        <Separator />
        {/* 次要入口 */}
        <div className="grid grid-cols-3 gap-x-1 gap-y-2 p-3">
          {SECONDARY_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center rounded-lg px-1.5 py-3 text-center transition-colors duration-[var(--duration-fast)] hover:bg-secondary"
              >
                <span className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-[var(--color-icon-foreground)]">
                  <Icon className="h-[1.125rem] w-[1.125rem]" />
                </span>
                <span className="text-[0.8125rem] font-medium leading-4 text-foreground">
                  {isZh ? entry.labelZh : entry.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
