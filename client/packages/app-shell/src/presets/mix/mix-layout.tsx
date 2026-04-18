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
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  Bell,
  ChevronDown,
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
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../auth';
import { BreadcrumbNav } from '../../components/breadcrumb-nav';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { SystemSwitcherPopover } from '../../components/system-switcher-popover';
import { ThemeCustomizer } from '../../components/theme-customizer';
import { useLanguage } from '../../i18n';
import type { ShellLayoutProps } from '../../layouts/types';
import { resolveMenuIcon } from '../../menu';
import type { MenuNode } from '../../menu';
import {
  type MenuHrefResolver,
  findActiveLeafIdByPath,
  findFirstLeafId,
  findMenuPathByPath,
  getDisplayChildren,
  isDisplayNode,
} from '../../menu/menu-utils';
import { useStyle } from '../../theme';
import { MixSubsystemSwitcher } from './mix-subsystem-switcher';

export function MixLayout({
  children,
  menuTree,
  currentUser,
  notificationSlot,
  resolveMenuHref,
  systems,
}: ShellLayoutProps) {
  const { t } = useTranslation('shell');
  const { logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  const currentPathname = useRouterState({ select: (state) => state.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { modules, activeModule, activeModuleId, resolvedSidebarNodes, setActiveModuleId } =
    useMixModules(menuTree, currentPathname, resolveMenuHref);

  const handleNavigate = (href: string) => {
    void navigate({ to: href as never });
  };

  const breadcrumbItems = useMemo(() => {
    const matchedPath = findMenuPathByPath(menuTree, currentPathname, resolveMenuHref);
    if (matchedPath.length === 0) {
      return activeModule ? [{ label: activeModule.name }] : [];
    }

    return matchedPath.map((node, index) => ({
      label: node.name,
      href: index < matchedPath.length - 1 ? (resolveMenuHref?.(node) ?? undefined) : undefined,
    }));
  }, [activeModule, currentPathname, menuTree, resolveMenuHref]);

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <MixHeader
          modules={modules}
          activeModuleId={activeModuleId}
          currentUser={currentUser}
          notificationSlot={notificationSlot}
          systems={systems}
          isLoggingOut={isLoggingOut}
          onLogout={() => logout()}
          onOpenMobileNav={() => setMobileOpen(true)}
          onSelectModule={setActiveModuleId}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
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
            currentPathname={currentPathname}
            onCloseMobile={() => setMobileOpen(false)}
            onToggleCollapsed={() => setCollapsed((prev) => !prev)}
            onSelectModule={setActiveModuleId}
            resolveMenuHref={resolveMenuHref}
            onNavigate={handleNavigate}
          />

          {/* 主内容区容器：右侧整块区域滚动，breadcrumb 固定在顶部，白卡整体向上滚动到 breadcrumb 下方 */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-sidebar">
            {/* 面包屑栏：bg-sidebar 与 sidebar 同色，文字用 foreground 近黑（飞书实测 rgb(31,35,41)）*/}
            <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 bg-sidebar py-3 pr-4 pl-[0.3125rem] text-sm text-foreground lg:pr-6 lg:pl-[0.4375rem]">
              <BreadcrumbNav items={breadcrumbItems} />
            </div>

            {/* main：白色内容卡片只负责包裹内容，不锁死高度；滚动条属于右侧整块内容区 */}
            <main className="mr-2 min-h-[calc(100%-3rem)] min-w-0 shrink-0 rounded-lg bg-card p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── useMixModules hook ───────────────────────────────────

function useMixModules(
  menuTree: MenuNode[],
  currentPathname: string,
  resolveMenuHref?: MenuHrefResolver,
) {
  const modules = useMemo(
    () => menuTree.filter((node) => node.visible !== false && node.menuType !== 'BUTTON'),
    [menuTree],
  );
  const [activeModuleId, setActiveModuleId] = useState<number | null>(modules[0]?.id ?? null);
  const matchedModuleId = useMemo(() => {
    if (!resolveMenuHref) {
      return null;
    }

    for (const module of modules) {
      if (findActiveLeafIdByPath([module], currentPathname, resolveMenuHref)) {
        return module.id;
      }
    }

    return null;
  }, [currentPathname, modules, resolveMenuHref]);

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

  useEffect(() => {
    if (matchedModuleId) {
      setActiveModuleId(matchedModuleId);
    }
  }, [matchedModuleId]);

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
  systems,
  isLoggingOut,
  onLogout,
  onOpenMobileNav,
  onSelectModule,
}: {
  modules: MenuNode[];
  activeModuleId: number | null;
  currentUser: ShellLayoutProps['currentUser'];
  notificationSlot?: ShellLayoutProps['notificationSlot'];
  systems?: ShellLayoutProps['systems'];
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
          {/* Logo：正方形圆角 block，主题色底 + 主题前景色字（lark-console=蓝 / classic=黑，跟随 style 自动切换）*/}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
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

        {/* 中区：模块 Tab 导航（桌面端，shrink-0 不撑开，让搜索占据剩余）*/}
        <nav
          className="hidden shrink-0 items-stretch overflow-x-auto lg:flex"
          style={{ gap: 'var(--nav-tab-gap)' }}
        >
          {modules.map((node) => {
            const active = node.id === activeModuleId;
            const Icon = resolveMenuIcon(node.icon);
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectModule(node.id)}
                data-active={active ? 'true' : 'false'}
                className="nav-tab inline-flex items-center gap-1.5 text-[14px] font-medium"
              >
                <Icon className="size-4" aria-hidden="true" />
                {node.name}
              </button>
            );
          })}
        </nav>

        {/* 搜索区：桌面端占据中间剩余宽度（对齐飞书中央 544 宽、36 高搜索位）*/}
        <div className="hidden min-w-0 flex-1 justify-center pl-8 pr-4 lg:flex">
          <SearchInput
            placeholder={t('search.placeholder')}
            shortcut="⌘K"
            readOnly
            onClick={() =>
              toast(t('search.comingSoon'), { description: t('search.comingSoonDesc') })
            }
            className="w-full max-w-[500px] cursor-pointer [&_input]:h-9"
          />
        </div>

        {/* 右区：通知 + 设置 + 九宫格 + 用户 */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
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

          {/* 竖分割线：h-6 = 24px 对齐飞书实测 */}
          <div className="mx-1 hidden h-6 w-px bg-border md:block" />

          {/* 九宫格切换器：优先使用 L5 注入的 systems，fallback 到硬编码 placeholder */}
          {systems && systems.length > 0 ? (
            <SystemSwitcherPopover systems={systems} />
          ) : (
            <MixSubsystemSwitcher />
          )}

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
          {/* 头像 32×32 圆形（对齐飞书实测）*/}
          <Avatar>
            <AvatarFallback>
              <User className="size-4" />
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
  currentPathname,
  onCloseMobile,
  onToggleCollapsed,
  onSelectModule,
  resolveMenuHref,
  onNavigate,
}: {
  activeModule: MenuNode | null;
  nodes: MenuNode[];
  modules: MenuNode[];
  activeModuleId: number | null;
  collapsed: boolean;
  mobileOpen: boolean;
  currentPathname: string;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
  onSelectModule: (id: number) => void;
  resolveMenuHref?: MenuHrefResolver;
  onNavigate: (href: string) => void;
}) {
  const { t } = useTranslation('shell');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const activeLeafId = useMemo(
    () => findActiveLeafIdByPath(nodes, currentPathname, resolveMenuHref) ?? findFirstLeafId(nodes),
    [currentPathname, nodes, resolveMenuHref],
  );

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
        'fixed left-0 z-40 flex h-full bg-sidebar transition-[transform,width] duration-200 ease-out lg:static lg:h-auto lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
      style={{ width: sidebarWidth, top: 'var(--size-header-height)', bottom: 0 }}
    >
      <div className={cn('flex h-full w-full flex-col', collapsed && 'items-center')}>
        {/* Sidebar 顶部：仅移动端显示（模块名 + 关闭按钮）；desktop 对齐飞书直接从主导航区开始 */}
        <div
          className={cn(
            'flex items-center justify-between lg:hidden',
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
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* 移动端模块切换器：桌面态隐藏，移动端抽屉顶部显示所有顶层模块 */}
        {modules.length > 1 && (
          <nav
            className="border-b border-border px-[0.875rem] pb-2 lg:hidden"
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
                    className={cn('sidebar-item w-full rounded-[0.625rem] text-left text-[14px]')}
                  >
                    <span className="flex w-5 shrink-0 items-center justify-center">
                      <Icon className="size-[1.125rem]" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* 主导航区（对齐飞书：items 堆叠无间距，容器无侧边 padding）*/}
        <nav
          className={cn(
            'flex-1 overflow-y-auto px-[0.875rem] pt-3 pb-2',
            collapsed && 'w-full px-0',
          )}
          aria-label={activeModule?.name}
        >
          <div className={cn('space-y-0', collapsed && 'flex flex-col items-center')}>
            {nodes.map((node) => (
              <MenuItem
                key={node.id}
                node={node}
                depth={0}
                collapsed={collapsed}
                activeLeafId={activeLeafId}
                expandedIds={expandedIds}
                resolveMenuHref={resolveMenuHref}
                onNavigate={onNavigate}
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

        {/* 底部"收起导航"按钮（对齐飞书：无 border-t / 高度 48 / iconWrap 36×48 与 menu item 对齐）*/}
        <div
          className={cn(
            'mx-[0.875rem] mt-2 border-t border-border/80 pt-1.5 pb-1.5',
            collapsed && 'mx-0 w-full border-t-0 px-0 pt-2 pb-2',
          )}
        >
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            className={cn(
              'flex h-10.5 w-full items-center rounded-[0.625rem] text-[14px] text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-foreground',
              collapsed && 'mx-auto h-10 w-10 justify-center rounded-[var(--radius-md)]',
            )}
          >
            <span
              className={cn(
                'flex h-10.5 shrink-0 items-center justify-center',
                collapsed ? 'h-10 w-10' : 'ml-1.5 w-9',
              )}
            >
              <PanelLeft
                className={cn(
                  'transition-transform duration-200',
                  collapsed ? 'size-[1.125rem]' : 'size-5',
                  collapsed && 'rotate-180',
                )}
              />
            </span>
            {!collapsed && (
              <span className="flex h-10.5 min-w-0 flex-1 items-center">
                {t('sidebar.collapse')}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── MenuItem（一二级同构，对齐飞书管理后台真实结构）──────────
//
// 飞书 DOM 结构（2026-04-18 Agent Browser 实测）：
//   <a|div> padding=0 height=48                      ← 外层无 padding，无 gap
//     <div class="_1sO9DpVG"> 36×48 margin-left:6    ← iconWrap 固定尺寸
//       <img> 24×24 居中                              ← icon 仅一级渲染
//     <div class="nc9sYMTs"> flex-1 height=48 relative ← textWrap 紧贴 iconWrap
//       <div> 文字
//       <img> chevron: absolute right:7 top:0 14×14   ← 仅有子菜单的一级
//
// 关键哲学：
// - 一二级同构：iconWrap 始终占 36×48，二级不渲染 icon 但保留空占位 → 自动对齐一级 text 起点
// - 无 gap：iconWrap 紧贴 textWrap，靠 iconWrap 固定宽度制造视觉留白（6px 左 + 6px 右）
// - 无 border-l 缩进：二级通过空 iconWrap 天然缩进，不需要竖条
// - chevron 绝对定位于 textWrap 内：不占据 flex 布局空间
// - 激活态：透明背景 + icon/text 变蓝 + 500 字重，没有左蓝条（nxboot-v2 是自加优化）
//
// 历史注：曾有 ActiveIndicator（3px 左蓝条）、CollapsedNavItem / ModuleNavItem /
// TopNavItem / SubNavItem 4 个分立组件，2026-04-18 对标飞书真实 DOM 后合并为此单一 MenuItem。

type MenuItemProps = {
  node: MenuNode;
  depth: number;
  collapsed: boolean;
  activeLeafId: number | null;
  expandedIds: Record<number, boolean>;
  resolveMenuHref?: MenuHrefResolver;
  onNavigate: (href: string) => void;
  onToggleExpanded: (id: number) => void;
};

function CollapsedMenuItem({
  node,
  isActiveItem,
  onClick,
}: {
  node: MenuNode;
  isActiveItem: boolean;
  onClick: () => void;
}) {
  const Icon = resolveMenuIcon(node.icon);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          data-active={isActiveItem ? 'true' : 'false'}
          className={cn(
            'relative mx-auto inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--sidebar-fg,var(--color-sidebar-foreground))] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-foreground',
            isActiveItem && 'text-[var(--sidebar-item-active-fg)]',
          )}
        >
          <Icon className="size-[1.25rem]" strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{node.name}</TooltipContent>
    </Tooltip>
  );
}

function MenuItem({
  node,
  depth,
  collapsed,
  activeLeafId,
  expandedIds,
  resolveMenuHref,
  onNavigate,
  onToggleExpanded,
}: MenuItemProps) {
  if (!isDisplayNode(node)) return null;

  const children = getDisplayChildren(node);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds[node.id] ?? true;
  const isActiveLeaf = node.id === activeLeafId;
  const showIcon = depth === 0;
  const isActiveItem = isActiveLeaf && !hasChildren;
  const href = resolveMenuHref?.(node) ?? null;

  // 折叠态（仅顶层渲染，子级完全隐藏）
  if (collapsed && depth > 0) return null;
  if (collapsed) {
    return (
      <CollapsedMenuItem
        node={node}
        isActiveItem={isActiveItem}
        onClick={() => {
          if (href) {
            onNavigate(href);
          }
        }}
      />
    );
  }

  const Icon = resolveMenuIcon(node.icon);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            onToggleExpanded(node.id);
            return;
          }

          if (href) {
            onNavigate(href);
          }
        }}
        data-active={isActiveItem ? 'true' : 'false'}
        className={cn(
          // 外层 padding=0 / gap=0：iconWrap 的 ml 和固定宽度自然撑出留白（对齐飞书）
          'sidebar-item flex h-12 w-full items-center rounded-[0.625rem] px-0 text-[14px] text-[var(--sidebar-fg,var(--color-sidebar-foreground))] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--sidebar-item-hover-bg)]',
          isActiveItem && 'font-medium',
        )}
      >
        {/* iconWrap: 36×48 with ml:6 —— 飞书的"锚点块"，即使二级空占位也保留 */}
        <span className="ml-1 flex h-12 w-8 shrink-0 items-center justify-center">
          {showIcon && Icon && (
            <Icon
              className={cn(
                'size-[1.125rem]',
                isActiveItem && 'text-[var(--sidebar-item-active-fg)]',
              )}
              strokeWidth={1.75}
            />
          )}
        </span>
        {/* textWrap: flex-1 h-12 relative —— 紧贴 iconWrap，chevron 在其内部绝对定位 */}
        <span
          className={cn(
            'relative flex h-12 min-w-0 flex-1 items-center pr-6',
            isActiveItem && 'text-[var(--sidebar-item-active-fg)]',
          )}
        >
          <span className="truncate">{node.name}</span>
          {hasChildren && (
            <ChevronDown
              className={cn(
                'absolute right-[7px] top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground transition-transform duration-200',
                !isExpanded && '-rotate-90',
              )}
            />
          )}
        </span>
      </button>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <MenuItem
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              activeLeafId={activeLeafId}
              expandedIds={expandedIds}
              resolveMenuHref={resolveMenuHref}
              onNavigate={onNavigate}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
