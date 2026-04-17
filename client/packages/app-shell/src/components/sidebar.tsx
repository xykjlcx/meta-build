import { Button, cn } from '@mb/ui-primitives';
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  PanelLeft,
  PanelLeftClose,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CurrentUser } from '../auth';
import type { MenuNode } from '../menu';

interface SidebarProps {
  menuTree: MenuNode[];
  currentUser: CurrentUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

/**
 * Inset 侧边栏。
 * 只消费 preset 传入的数据，不直接读取菜单/用户 hook。
 */
export function Sidebar({
  menuTree,
  currentUser,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const { t } = useTranslation('shell');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (menuTree.length === 0) {
      return;
    }

    setExpandedIds((prev) => {
      const next = { ...prev };
      for (const node of menuTree) {
        if (node.menuType === 'DIRECTORY' && next[node.id] === undefined) {
          next[node.id] = true;
        }
      }
      return next;
    });
  }, [menuTree]);

  const sidebarWidth = mobileOpen
    ? 'min(19rem, calc(100vw - 1.5rem))'
    : collapsed
      ? 'var(--size-sidebar-width-collapsed)'
      : 'var(--size-sidebar-width)';

  return (
    <aside
      className={cn(
        'fixed inset-y-3 left-3 z-40 flex flex-col overflow-hidden rounded-[calc(var(--radius-xl)+0.9rem)] border border-sidebar-border/85 bg-sidebar/94 text-sidebar-foreground shadow-[0_32px_90px_-36px_rgba(15,23,42,0.58)] backdrop-blur-xl transition-[transform,width] duration-300 ease-out lg:sticky lg:top-4 lg:left-auto lg:z-10 lg:h-[calc(100vh-2rem)]',
        mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] lg:translate-x-0',
      )}
      style={{ width: sidebarWidth }}
    >
      <div className="relative border-b border-sidebar-border/80 px-3 pb-3 pt-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(120%_120%_at_0%_0%,color-mix(in_oklab,var(--color-sidebar-primary)_16%,transparent),transparent_62%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <LayoutGrid className="size-[1.125rem]" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Meta Build</div>
                <div className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/72">
                  <Sparkles className="size-3" />
                  <span className="truncate">{t('sidebar.tagline')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCloseMobile}
              aria-label={t('sidebar.close')}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            >
              <X className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
              className="hidden text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
            >
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {menuTree
            .filter((node) => node.visible !== false)
            .map((node) => (
              <MenuTreeItem
                key={node.id}
                node={node}
                collapsed={collapsed}
                depth={0}
                expandedIds={expandedIds}
                onToggleExpanded={(id) =>
                  setExpandedIds((prev) => ({
                    ...prev,
                    [id]: !prev[id],
                  }))
                }
              />
            ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border/80 p-2.5">
        <div
          className={cn(
            'rounded-[calc(var(--radius-lg)+0.25rem)] border border-sidebar-border/70 bg-sidebar-accent/55 p-2.5',
            collapsed && 'flex justify-center p-2',
          )}
        >
          {collapsed ? (
            <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              {currentUser.username?.slice(0, 1).toUpperCase() ?? 'M'}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-sidebar-foreground">
                {currentUser.username ?? t('sidebar.operatorFallback')}
              </div>
              <div className="text-[11px] text-sidebar-foreground/72">
                {t('sidebar.operatorRole')}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function MenuTreeItem({
  node,
  collapsed,
  depth,
  expandedIds,
  onToggleExpanded,
}: {
  node: MenuNode;
  collapsed: boolean;
  depth: number;
  expandedIds: Record<number, boolean>;
  onToggleExpanded: (id: number) => void;
}) {
  const hasChildren = node.children.some(
    (child) => child.visible !== false && child.menuType !== 'BUTTON',
  );
  const isExpanded = expandedIds[node.id] ?? false;

  if (node.menuType === 'BUTTON') {
    return null;
  }

  const handleClick = () => {
    if (node.menuType === 'DIRECTORY' && hasChildren) {
      onToggleExpanded(node.id);
    }
  };

  const indentation = collapsed ? 0 : 10 + depth * 12;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group flex w-full items-center gap-2 rounded-[calc(var(--radius-md)+0.125rem)] px-2 py-2 text-left text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          node.menuType === 'DIRECTORY' && 'font-medium',
        )}
        style={{ paddingLeft: collapsed ? 8 : indentation }}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-sidebar-border/60 bg-sidebar-accent/45 text-[11px] font-semibold">
          {node.name.slice(0, 1).toUpperCase()}
        </span>

        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/70" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0 text-sidebar-foreground/70" />
              ))}
          </>
        )}
      </button>

      {hasChildren && isExpanded && !collapsed && (
        <div className="mt-1 space-y-1">
          {node.children
            .filter((child) => child.visible !== false)
            .map((child) => (
              <MenuTreeItem
                key={child.id}
                node={child}
                collapsed={collapsed}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggleExpanded={onToggleExpanded}
              />
            ))}
        </div>
      )}
    </div>
  );
}
