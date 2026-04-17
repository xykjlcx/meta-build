import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@mb/ui-primitives';
import {
  ChevronDown,
  ChevronRight,
  Languages,
  LayoutGrid,
  LogOut,
  Menu,
  MoreVertical,
  PanelLeft,
  Settings,
  Settings2,
  SunMoon,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../auth';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { GlobalSearchPlaceholder } from '../../components/global-search-placeholder';
import { LanguageSwitcher } from '../../components/language-switcher';
import { ThemeCustomizer } from '../../components/theme-customizer';
import { useLanguage } from '../../i18n';
import type { ShellLayoutProps } from '../../layouts/types';
import { resolveMenuIcon } from '../../menu';
import type { MenuNode } from '../../menu';
import { findFirstLeafId, getDisplayChildren, isDisplayNode } from '../../menu/menu-utils';
import { useStyle } from '../../theme';

export function MixLayout({ children, menuTree, currentUser, notificationSlot }: ShellLayoutProps) {
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
        currentUser={currentUser}
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
          modules={modules}
          activeModuleId={activeModuleId}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((prev) => !prev)}
          onSelectModule={setActiveModuleId}
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
  currentUser,
  notificationSlot,
  isLoggingOut,
  onLogout,
  onOpenMobileNav,
  onSelectModule,
}: {
  modules: MenuNode[];
  activeModuleId: number | null;
  currentUser: ShellLayoutProps['currentUser'];
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
        {/* 移动端汉堡按钮 */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileNav}
          aria-label={t('sidebar.expand')}
          className="lg:hidden"
        >
          <Menu className="size-4" />
        </Button>

        {/* Logo + 品牌名 */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
            <LayoutGrid className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">Meta Build</div>
          </div>
        </div>

        {/* 桌面端模块 Tab 导航 */}
        <nav
          className="hidden min-w-0 flex-1 items-stretch overflow-x-auto lg:flex"
          style={{ gap: 'var(--nav-tab-gap)' }}
        >
          {modules.map((node) => {
            const active = node.id === activeModuleId;

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectModule(node.id)}
                data-active={active ? 'true' : 'false'}
                className="nav-tab text-sm font-medium"
              >
                {node.name}
              </button>
            );
          })}
        </nav>

        {/* 右侧控件区 */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {/* 桌面端搜索框 */}
          <GlobalSearchPlaceholder className="hidden md:inline-flex" />

          {notificationSlot}

          {/* 桌面端控件组 */}
          <div className="hidden items-center gap-1 md:flex">
            <LanguageSwitcher />
            <ThemeCustomizer />
            <DarkModeToggle />
          </div>

          {/* 桌面端 Avatar + DropdownMenu */}
          <MixUserMenu currentUser={currentUser} isLoggingOut={isLoggingOut} onLogout={onLogout} />

          {/* 移动端 overflow 菜单 */}
          <MixMobileOverflowMenu onLogout={onLogout} isLoggingOut={isLoggingOut} />
        </div>
      </div>
    </header>
  );
}

/**
 * 桌面端 Avatar + DropdownMenu（Settings + Logout）
 * 仅在 md: 以上显示。不从公共层提取——这是 mix 自己的最简版本。
 */
function MixUserMenu({
  currentUser,
  isLoggingOut,
  onLogout,
}: {
  currentUser: ShellLayoutProps['currentUser'];
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const { t } = useTranslation('shell');
  const displayName = currentUser.username ?? t('sidebar.operatorFallback');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('sidebar.userMenu')}
          className="hidden items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1.5 md:flex"
        >
          <Avatar size="sm">
            <AvatarFallback>
              <User className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          <span className="max-w-24 truncate text-sm font-medium">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" />
          {t('sidebar.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 size-4" />
          {t('sidebar.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 移动端（<768px）overflow 菜单。
 * - Toggle Dark：直接切换 colorMode
 * - Switch Language：循环切换已支持语言
 * - Customize Theme：弹 toast 提示
 * - Logout：直接触发
 */
function MixMobileOverflowMenu({
  onLogout,
  isLoggingOut,
}: {
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  const { t } = useTranslation('shell');
  const { colorMode, setColorMode } = useStyle();
  const { language, setLanguage, supportedLanguages } = useLanguage();

  function cycleLanguage() {
    const keys = Object.keys(supportedLanguages) as (typeof language)[];
    if (keys.length === 0) return;
    const idx = keys.indexOf(language);
    const next = keys[(idx + 1) % keys.length] ?? keys[0];
    if (next) setLanguage(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('header.moreOptions')}
          className="md:hidden"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => cycleLanguage()}>
          <Languages className="mr-2 size-4" />
          {t('language.switch')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}>
          <SunMoon className="mr-2 size-4" />
          {t('header.toggleDark')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast(t('theme.customize'), { description: t('search.comingSoonDesc') })}
        >
          <Settings2 className="mr-2 size-4" />
          {t('theme.customize')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 size-4" />
          {t('header.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MixSidebar({
  activeModule,
  nodes,
  modules,
  activeModuleId,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
  onSelectModule,
}: {
  activeModule: MenuNode | null;
  nodes: MenuNode[];
  modules: MenuNode[];
  activeModuleId: number | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  onSelectModule: (id: number) => void;
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

  // 移动端抽屉宽度始终用完整宽度，忽略桌面态折叠状态（I8 修复）
  const sidebarWidth = mobileOpen
    ? 'var(--sidebar-width)'
    : collapsed
      ? 'var(--sidebar-collapsed-width)'
      : 'var(--sidebar-width)';

  return (
    <aside
      className={cn(
        'fixed inset-y-(--size-header-height) left-0 z-40 flex border-r border-border bg-muted transition-[transform,width] duration-200 ease-out lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{ width: sidebarWidth }}
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

        {/* 移动端模块切换器（C1 修复）：桌面态隐藏，移动端抽屉顶部显示所有顶层模块 */}
        {modules.length > 1 && (
          <nav
            className="lg:hidden border-b border-border px-2 pb-2"
            aria-label={t('mix.moduleSwitcherLabel')}
          >
            <div className="space-y-0.5">
              {modules.map((mod) => {
                const Icon = resolveMenuIcon(mod.icon);
                const isActive = mod.id === activeModuleId;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectModule(mod.id)}
                    data-active={isActive ? 'true' : 'false'}
                    className={cn(
                      'sidebar-item w-full text-left text-sm',
                      isActive && 'bg-background text-foreground font-medium',
                    )}
                  >
                    <span className="w-4 shrink-0 inline-flex items-center justify-center">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <nav className="flex-1 overflow-y-auto px-2 pb-3 pt-2">
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

  // resolveMenuIcon 永远非空（未匹配时 fallback 到 FileText）
  const Icon = resolveMenuIcon(node.icon);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) onToggleExpanded(node.id);
        }}
        title={collapsed ? node.name : undefined}
        data-active={isActiveLeaf && !hasChildren ? 'true' : 'false'}
        className={cn('sidebar-item w-full text-left text-sm', collapsed && 'justify-center px-0')}
        style={{ paddingLeft: collapsed ? undefined : `${0.75 + depth * 0.75}rem` }}
      >
        {collapsed ? (
          <Icon className="size-4" />
        ) : (
          <>
            <span className="w-4 shrink-0 inline-flex items-center justify-center">
              <Icon className="size-4" />
            </span>
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
