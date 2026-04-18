import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@mb/ui-primitives';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuNode } from '../menu';
import { isDisplayNode } from '../menu/menu-utils';

export interface HeaderTabSwitcherProps {
  menuTree: MenuNode[];
  activeModuleId: number | null;
  onModuleChange: (moduleId: number) => void;
  /** 最多显示几个 tab，超过的塞入"更多"下拉。默认 5。 */
  maxTabs?: number;
  className?: string;
}

/**
 * 顶部模块切换器（claude-* preset 共享组件）。
 * 展示顶层模块为横向 tab，超过 maxTabs 时把溢出项收纳进"更多"下拉。
 *
 * 设计要点：
 * - role="tablist" + role="tab" + aria-selected/aria-controls 遵循 WAI-ARIA
 * - ArrowLeft/ArrowRight 循环切换 inlineModules（不含下拉里的溢出项）
 * - tabIndex: 激活 tab = 0，其它 = -1（roving tabindex 模式）
 */
export function HeaderTabSwitcher({
  menuTree,
  activeModuleId,
  onModuleChange,
  maxTabs = 5,
  className,
}: HeaderTabSwitcherProps) {
  const { t } = useTranslation('shell');
  const modules = menuTree.filter(isDisplayNode);

  // 超过 maxTabs：前 maxTabs-1 个作为 tab，剩下合并到下拉
  const inlineCount = modules.length > maxTabs ? maxTabs - 1 : modules.length;
  const inlineModules = modules.slice(0, inlineCount);
  const overflowModules = modules.slice(inlineCount);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIdx = (idx + delta + inlineModules.length) % inlineModules.length;
    const next = inlineModules[nextIdx];
    if (next) onModuleChange(next.id);
  };

  return (
    <div role="tablist" className={cn('flex items-center gap-1', className)}>
      {inlineModules.map((m, idx) => {
        const active = m.id === activeModuleId;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="main-content"
            tabIndex={active ? 0 : -1}
            onClick={() => onModuleChange(m.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'px-3 h-8 rounded-md text-sm font-medium transition-colors',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
            )}
          >
            {m.name}
          </button>
        );
      })}

      {overflowModules.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('layout.headerTabs.more', { defaultValue: 'More' })}
              className="h-8"
            >
              <MoreHorizontal className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {overflowModules.map((m) => (
              <DropdownMenuItem key={m.id} onClick={() => onModuleChange(m.id)}>
                {m.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
