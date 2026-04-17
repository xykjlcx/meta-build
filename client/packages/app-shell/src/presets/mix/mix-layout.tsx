import { SearchInput } from '@mb/ui-patterns';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@mb/ui-primitives';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Languages,
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
import type { ElementType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../auth';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { ThemeCustomizer } from '../../components/theme-customizer';
import { useLanguage } from '../../i18n';
import type { ShellLayoutProps } from '../../layouts/types';
import { resolveMenuIcon } from '../../menu';
import type { MenuNode } from '../../menu';
import { findFirstLeafId, getDisplayChildren, isDisplayNode } from '../../menu/menu-utils';
import { useStyle } from '../../theme';
import { MixSubsystemSwitcher } from './mix-subsystem-switcher';

export function MixLayout({ children, menuTree, currentUser, notificationSlot }: ShellLayoutProps) {
  const { t } = useTranslation('shell');
  const { logout, isLoggingOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { modules, activeModule, activeModuleId, resolvedSidebarNodes, setActiveModuleId } =
    useMixModules(menuTree);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
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

        <div className="flex min-h-[calc(100vh-var(--size-header-height))]">
          {/* 移动端遮罩 */}
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

          {/* 主内容区 */}
          <div className="min-w-0 flex-1 bg-background">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground lg:px-6">
              <span>{activeModule?.name ?? t('mix.moduleFallback')}</span>
              <ChevronRight className="size-4" />
              <span>{t('mix.workspaceLabel')}</span>
            </div>

            <main className="min-w-0 p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── useMixModules hook ───────────────────────────────────

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

// ─── MixHeader ────────────────────────────────────────────

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
    <header className="sticky top-0 z-20 border-b-0 bg-card">
      <div
        className="flex items-center"
        style={{
          height: 'var(--size-header-height)',
          paddingLeft: '1.25rem',
          paddingRight: '1.25rem',
        }}
      >
        {/* 移动端汉堡按钮 */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileNav}
          aria-label={t('sidebar.expand')}
          className="mr-2 lg:hidden"
        >
          <Menu className="size-4" />
        </Button>

        {/* 左区：品牌 logo + 应用名，宽度对齐 sidebar */}
        <div
          className="hidden shrink-0 items-center gap-2.5 lg:flex"
          style={{ width: 'var(--sidebar-width)', paddingRight: '1rem' }}
        >
          {/* Logo：正方形圆角 block，前景色底 + 背景色字 */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
            </svg>
          </div>
          <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-foreground">
            Meta Build
          </span>
        </div>

        {/* 中区：模块 Tab 导航（桌面端） */}
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
                className="nav-tab text-[14px] font-medium"
              >
                {node.name}
              </button>
            );
          })}
        </nav>

        {/* 右区：搜索 + 通知 + 设置 + 九宫格 + 用户 */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* 搜索框：桌面端显示完整搜索输入框 */}
          <SearchInput
            placeholder={t('search.placeholder')}
            shortcut="⌘K"
            readOnly
            onClick={() =>
              toast(t('search.comingSoon'), { description: t('search.comingSoonDesc') })
            }
            className="hidden w-56 cursor-pointer lg:flex"
          />

          {/* 通知插槽 */}
          {notificationSlot}

          {/* 通知铃铛（无 notificationSlot 时 fallback） */}
          {!notificationSlot && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('mix.notificationLabel')}
              className="hidden md:inline-flex"
            >
              <Bell className="size-[1.125rem] text-[var(--color-icon-foreground)]" />
            </Button>
          )}

          {/* 设置图标 */}
          <div className="hidden items-center gap-0.5 md:flex">
            <ThemeCustomizer />
            <DarkModeToggle />
          </div>

          {/* 竖分割线 */}
          <div className="mx-1 hidden h-5 w-px bg-border md:block" />

          {/* 九宫格切换器 */}
          <MixSubsystemSwitcher />

          {/* 用户头像 + DropdownMenu（桌面） */}
          <MixUserMenu currentUser={currentUser} isLoggingOut={isLoggingOut} onLogout={onLogout} />

          {/* 移动端 overflow 菜单 */}
          <MixMobileOverflowMenu onLogout={onLogout} isLoggingOut={isLoggingOut} />
        </div>
      </div>
    </header>
  );
}

// ─── MixUserMenu ──────────────────────────────────────────

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
          className="hidden items-center gap-2 rounded-md px-2 py-1 transition-colors duration-[var(--duration-fast)] hover:bg-secondary md:flex"
        >
          <Avatar size="sm">
            <AvatarFallback>
              <User className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left lg:block">
            <div className="max-w-24 truncate text-[14px] text-foreground">{displayName}</div>
          </div>
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

// ─── MixMobileOverflowMenu ────────────────────────────────

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

// ─── MixSidebar ───────────────────────────────────────────

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

  // 移动端抽屉宽度始终用完整宽度，忽略桌面态折叠状态
  const sidebarWidth = mobileOpen
    ? 'var(--sidebar-width)'
    : collapsed
      ? 'var(--sidebar-collapsed-width)'
      : 'var(--sidebar-width)';

  return (
    <aside
      className={cn(
        // bg-sidebar：lark-console 下 = #f2f3f5，和 page bg 同色，sidebar 融入背景
        'fixed inset-y-(--size-header-height) left-0 z-40 flex border-r border-border bg-sidebar transition-[transform,width] duration-200 ease-out lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{ width: sidebarWidth }}
    >
      <div className="flex h-full w-full flex-col">
        {/* Sidebar 顶部：模块名 + 移动端关闭按钮 */}
        <div
          className={cn(
            'flex items-center justify-between',
            collapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3',
          )}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-foreground">
                {activeModule?.name ?? t('mix.moduleFallback')}
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

        {/* 移动端模块切换器：桌面态隐藏，移动端抽屉顶部显示所有顶层模块 */}
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
                    className={cn('sidebar-item w-full text-left text-[14px]')}
                  >
                    <span className="flex w-4 shrink-0 items-center justify-center">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* 主导航区 */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label={activeModule?.name}>
          <div className="space-y-0.5 px-2">
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

        {/* 底部：折叠 / 展开按钮 */}
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <PanelLeft
              className={cn(
                'size-4 shrink-0 transition-transform duration-200',
                collapsed && 'rotate-180',
              )}
            />
            {!collapsed && <span>{t('sidebar.collapse')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── 激活态左边蓝条（可复用的小 span）─────────────────────

/** 3px 宽左侧蓝条，激活 nav item 的视觉锚点 */
function ActiveIndicator({ offset = 0 }: { offset?: number }) {
  return (
    <span
      className="absolute top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-[var(--sidebar-item-active-fg)]"
      style={{ left: offset === 0 ? 0 : `-${offset}rem` }}
    />
  );
}

// ─── 折叠态单条目（只显示图标 + Tooltip）────────────────────

function CollapsedNavItem({
  node,
  isActiveLeaf,
  hasChildren,
  Icon,
}: {
  node: MenuNode;
  isActiveLeaf: boolean;
  hasChildren: boolean;
  Icon: ElementType;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-active={isActiveLeaf && !hasChildren ? 'true' : 'false'}
          className="sidebar-item relative w-full justify-center px-0 text-[14px]"
        >
          {isActiveLeaf && !hasChildren && <ActiveIndicator />}
          <Icon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{node.name}</TooltipContent>
    </Tooltip>
  );
}

// ─── ModuleNavItem ────────────────────────────────────────

type NavItemSharedProps = {
  collapsed: boolean;
  activeLeafId: number | null;
  expandedIds: Record<number, boolean>;
  onToggleExpanded: (id: number) => void;
};

function ModuleNavItem({
  node,
  depth,
  collapsed,
  activeLeafId,
  expandedIds,
  onToggleExpanded,
}: { node: MenuNode; depth: number } & NavItemSharedProps) {
  if (!isDisplayNode(node)) return null;

  const children = getDisplayChildren(node);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds[node.id] ?? true;
  const isActiveLeaf = node.id === activeLeafId;
  const Icon = resolveMenuIcon(node.icon);

  // 折叠态：图标 only + Tooltip
  if (collapsed) {
    return (
      <CollapsedNavItem
        node={node}
        isActiveLeaf={isActiveLeaf}
        hasChildren={hasChildren}
        Icon={Icon}
      />
    );
  }

  // 子菜单项（depth > 0）
  if (depth > 0) {
    return (
      <SubNavItem
        node={node}
        childNodes={children}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        isActiveLeaf={isActiveLeaf}
        depth={depth}
        collapsed={collapsed}
        activeLeafId={activeLeafId}
        expandedIds={expandedIds}
        onToggleExpanded={onToggleExpanded}
      />
    );
  }

  // 顶层项：有子菜单展开/折叠，无子菜单为叶子
  return (
    <TopNavItem
      node={node}
      childNodes={children}
      hasChildren={hasChildren}
      isExpanded={isExpanded}
      isActiveLeaf={isActiveLeaf}
      Icon={Icon}
      collapsed={collapsed}
      activeLeafId={activeLeafId}
      expandedIds={expandedIds}
      onToggleExpanded={onToggleExpanded}
    />
  );
}

// ─── TopNavItem（depth === 0）────────────────────────────

function TopNavItem({
  node,
  childNodes,
  hasChildren,
  isExpanded,
  isActiveLeaf,
  Icon,
  collapsed,
  activeLeafId,
  expandedIds,
  onToggleExpanded,
}: {
  node: MenuNode;
  childNodes: MenuNode[];
  hasChildren: boolean;
  isExpanded: boolean;
  isActiveLeaf: boolean;
  Icon: ElementType;
} & NavItemSharedProps) {
  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onToggleExpanded(node.id)}
          className="flex h-11 w-full items-center gap-3 rounded-md px-4 text-[14px] text-[var(--sidebar-fg,var(--color-sidebar-foreground))] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)]"
        >
          <span className="flex w-4 shrink-0 items-center justify-center">
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
              isExpanded ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>
        {isExpanded && (
          <div className="ml-6 border-l border-border pl-2">
            <div className="space-y-0.5 py-1">
              {childNodes.map((child) => (
                <ModuleNavItem
                  key={child.id}
                  node={child}
                  depth={1}
                  collapsed={collapsed}
                  activeLeafId={activeLeafId}
                  expandedIds={expandedIds}
                  onToggleExpanded={onToggleExpanded}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 无子菜单的顶层叶子节点
  return (
    <button
      type="button"
      data-active={isActiveLeaf ? 'true' : 'false'}
      className="relative flex h-11 w-full items-center gap-3 rounded-md px-4 text-[14px] text-[var(--sidebar-fg,var(--color-sidebar-foreground))] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)] data-[active=true]:bg-[var(--sidebar-item-active-bg)] data-[active=true]:font-medium data-[active=true]:text-[var(--sidebar-item-active-fg)]"
    >
      {isActiveLeaf && <ActiveIndicator />}
      <span className="flex w-4 shrink-0 items-center justify-center">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{node.name}</span>
    </button>
  );
}

// ─── SubNavItem（depth > 0）──────────────────────────────

function SubNavItem({
  node,
  childNodes,
  hasChildren,
  isExpanded,
  isActiveLeaf,
  depth,
  collapsed,
  activeLeafId,
  expandedIds,
  onToggleExpanded,
}: {
  node: MenuNode;
  childNodes: MenuNode[];
  hasChildren: boolean;
  isExpanded: boolean;
  isActiveLeaf: boolean;
  depth: number;
} & NavItemSharedProps) {
  return (
    <div>
      <button
        type="button"
        data-active={isActiveLeaf && !hasChildren ? 'true' : 'false'}
        className="relative flex h-[2.375rem] w-full items-center gap-2 rounded-md px-3 text-[13px] text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-[var(--sidebar-item-active-fg)]"
      >
        {isActiveLeaf && !hasChildren && <ActiveIndicator offset={0.5625} />}
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {hasChildren &&
          (isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          ))}
      </button>

      {hasChildren && isExpanded && (
        <div className="ml-4 border-l border-border pl-2">
          <div className="space-y-0.5 py-0.5">
            {childNodes.map((child) => (
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
        </div>
      )}
    </div>
  );
}
