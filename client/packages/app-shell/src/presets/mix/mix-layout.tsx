import { Avatar, AvatarFallback, Button, cn } from '@mb/ui-primitives';
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeft,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth';
import { LanguageSwitcher } from '../../components/language-switcher';
import { ThemeCustomizer } from '../../components/theme-customizer';
import type { ShellLayoutProps } from '../../layouts/types';
import type { MenuNode } from '../../menu';

const MODULE_SWITCHER_SIDEBAR_WIDTH = '15rem';
const MODULE_SWITCHER_SIDEBAR_COLLAPSED = '3.125rem';

export function MixLayout({
  children,
  menuTree,
  currentUser,
  notificationSlot,
}: ShellLayoutProps) {
  const { t } = useTranslation('shell');
  const { logout, isLoggingOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { modules, activeModule, activeModuleId, resolvedSidebarNodes, setActiveModuleId } =
    useMixModules(menuTree);

  return (
    <div className="min-h-screen bg-muted text-foreground">
      <MixHeader
        modules={modules}
        activeModuleId={activeModuleId}
        currentUserName={currentUser.username}
        notificationSlot={notificationSlot}
        isLoggingOut={isLoggingOut}
        onLogout={() => logout()}
        onOpenMobileNav={() => setMobileOpen(true)}
        onSelectModule={setActiveModuleId}
      />

      <div className="flex min-h-[calc(100vh-var(--size-header-height))] bg-muted">
        {mobileOpen && (
          <button
            type="button"
            aria-label={t('sidebar.close')}
            className="fixed inset-0 z-30 bg-black/24 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <MixSidebar
          activeModule={activeModule}
          nodes={resolvedSidebarNodes}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
        />

        <div className="min-w-0 flex-1 bg-muted">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground lg:px-6">
            <span>{activeModule?.name ?? t('mix.moduleFallback')}</span>
            <ChevronRight className="size-4" />
            <span>{t('mix.workspaceLabel')}</span>
          </div>

          <main className="min-w-0 p-4 lg:p-6">
            <div className="mb-6">
              <div className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t('mix.presetLabel')}
              </div>
              <h1 className="mt-1 text-2xl font-semibold text-foreground">
                {activeModule?.name ?? t('mix.title')}
              </h1>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function useMixModules(menuTree: MenuNode[]) {
  const modules = useMemo(
    () => menuTree.filter((node) => node.visible !== false && node.menuType !== 'BUTTON'),
    [menuTree],
  );
  const [activeModuleId, setActiveModuleId] = useState<number | null>(modules[0]?.id ?? null);

  useEffect(() => {
    if (modules.length === 0) {
      setActiveModuleId(null);
      return;
    }

    setActiveModuleId((prev) => {
      if (prev && modules.some((node) => node.id === prev)) {
        return prev;
      }
      return modules[0]?.id ?? null;
    });
  }, [modules]);

  const activeModule = modules.find((node) => node.id === activeModuleId) ?? modules[0] ?? null;
  const sidebarNodes = activeModule
    ? activeModule.children.filter(
        (child) => child.visible !== false && child.menuType !== 'BUTTON',
      )
    : [];

  return {
    modules,
    activeModule,
    activeModuleId,
    resolvedSidebarNodes: activeModule && sidebarNodes.length === 0 ? [activeModule] : sidebarNodes,
    setActiveModuleId,
  };
}

function MixHeader({
  modules,
  activeModuleId,
  currentUserName,
  notificationSlot,
  isLoggingOut,
  onLogout,
  onOpenMobileNav,
  onSelectModule,
}: {
  modules: MenuNode[];
  activeModuleId: number | null;
  currentUserName: string | null;
  notificationSlot?: ShellLayoutProps['notificationSlot'];
  isLoggingOut: boolean;
  onLogout: () => void;
  onOpenMobileNav: () => void;
  onSelectModule: (id: number) => void;
}) {
  const { t } = useTranslation('shell');

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="flex h-(--size-header-height) items-center gap-4 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileNav}
          aria-label={t('sidebar.expand')}
          className="lg:hidden"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
            <LayoutGrid className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">Meta Build</div>
          </div>
        </div>

        <nav className="hidden min-w-0 flex-1 items-stretch gap-6 overflow-x-auto lg:flex">
          {modules.map((node) => {
            const active = node.id === activeModuleId;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectModule(node.id)}
                className={cn(
                  'relative flex h-full items-center border-b-2 border-transparent px-1 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground',
                  active && 'border-primary text-primary',
                )}
              >
                {node.name}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {notificationSlot}
          <LanguageSwitcher />
          <ThemeCustomizer />

          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1.5 md:flex">
            <Avatar size="sm">
              <AvatarFallback>
                <User className="size-3.5" />
              </AvatarFallback>
            </Avatar>
            <span className="max-w-24 truncate text-sm font-medium">
              {currentUserName ?? t('header.profile')}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-label={t('header.logout')}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function MixSidebar({
  activeModule,
  nodes,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: {
  activeModule: MenuNode | null;
  nodes: MenuNode[];
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}) {
  const { t } = useTranslation('shell');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const activeLeafId = useMemo(() => findFirstLeafId(nodes), [nodes]);

  useEffect(() => {
    if (nodes.length === 0) {
      return;
    }

    setExpandedIds((prev) => {
      const next = { ...prev };

      for (const node of nodes) {
        if (node.menuType === 'DIRECTORY' && next[node.id] === undefined) {
          next[node.id] = true;
        }
      }

      return next;
    });
  }, [nodes]);

  return (
    <aside
      className={cn(
        'fixed inset-y-(--size-header-height) left-0 z-40 flex border-r border-border bg-muted transition-[transform,width] duration-200 ease-out lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{
        width: collapsed ? MODULE_SWITCHER_SIDEBAR_COLLAPSED : MODULE_SWITCHER_SIDEBAR_WIDTH,
      }}
    >
      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between px-3 py-3">
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {activeModule?.name ?? t('mix.moduleFallback')}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t('mix.moduleSidebarHint')}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCloseMobile}
            aria-label={t('sidebar.close')}
            className="lg:hidden"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="space-y-1">
            {nodes.map((node) => (
              <ModuleNavItem
                key={node.id}
                node={node}
                depth={0}
                collapsed={collapsed}
                activeLeafId={activeLeafId}
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

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            className={cn(
              'flex w-full items-center rounded-md px-2 py-2 text-sm text-foreground/75 transition-colors hover:bg-background hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <PanelLeft className="size-4 shrink-0" />
            {!collapsed && <span className="ml-2">{t('sidebar.collapse')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

function ModuleNavItem({
  node,
  depth,
  collapsed,
  activeLeafId,
  expandedIds,
  onToggleExpanded,
}: {
  node: MenuNode;
  depth: number;
  collapsed: boolean;
  activeLeafId: number | null;
  expandedIds: Record<number, boolean>;
  onToggleExpanded: (id: number) => void;
}) {
  if (!isDisplayNode(node)) {
    return null;
  }

  const children = getDisplayChildren(node);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds[node.id] ?? true;
  const isActiveLeaf = node.id === activeLeafId;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            onToggleExpanded(node.id);
          }
        }}
        title={collapsed ? node.name : undefined}
        className={cn(
          'flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-foreground/75 transition-colors hover:bg-background hover:text-foreground',
          isActiveLeaf && !hasChildren && 'bg-background font-medium text-primary',
          collapsed && 'justify-center px-0',
        )}
        style={{ paddingLeft: collapsed ? undefined : `${0.75 + depth * 0.75}rem` }}
      >
        {collapsed ? (
          <span className="text-[11px] font-semibold text-foreground/70">
            {node.name.slice(0, 1).toUpperCase()}
          </span>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              ))}
          </>
        )}
      </button>

      {hasChildren && isExpanded && !collapsed && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <ModuleNavItem
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              activeLeafId={activeLeafId}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function isDisplayNode(node: MenuNode) {
  return node.visible !== false && node.menuType !== 'BUTTON';
}

function getDisplayChildren(node: MenuNode) {
  return node.children.filter(isDisplayNode);
}

function findFirstLeafId(nodes: MenuNode[]): number | null {
  for (const node of nodes) {
    if (!isDisplayNode(node)) {
      continue;
    }

    const children = getDisplayChildren(node);
    if (children.length === 0) {
      return node.id;
    }

    const leafId = findFirstLeafId(children);
    if (leafId) {
      return leafId;
    }
  }

  return null;
}
