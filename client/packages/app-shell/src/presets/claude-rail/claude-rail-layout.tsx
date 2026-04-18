/**
 * ClaudeRailLayout — Plan A "claude-rail" preset（窄图标轨道侧栏）。
 *
 * 100% 还原 Claude Design `layout--rail`（styles/app.css:234-249 + bg-blobs:86-101）：
 * - 外层 bg-background relative overflow-hidden + <BgBlobs /> 装饰（复用 claude-inset 视觉）
 * - Topbar 保留 classic / inset 的完整结构（品牌 + HeaderTab + 搜索 + 功能区 + user menu）
 * - Sidebar 窄 rail (w-16)：border-r bg-sidebar，一级图标轨道
 *   · 每个菜单项用 Tooltip 承载 label，Link 上带 aria-label 供屏幕阅读器
 *   · 只渲染 icon，不渲染 label 文字，不渲染二级菜单（窄轨道装不下）
 *   · 二级导航由跳转后的页面内导航表达
 * - Main flex-1 overflow-y-auto（&lt;main&gt; 元素隐式 role=main，无需显式 role 属性 / 保留 id="main-content"）
 *
 * 与 claude-classic 差异：外层加 bg-blobs + Sidebar 从 w-60 语义列表变 w-16 图标轨道
 * 与 claude-inset 差异：不是内嵌白卡片，而是 Topbar 直接贴顶 + rail 侧栏直接贴左
 */

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
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Bell, ChevronDown, HelpCircle, Inbox, LogOut, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../auth';
import { BgBlobs } from '../../components/bg-blobs';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { HeaderTabSwitcher } from '../../components/header-tab-switcher';
import { SystemSwitcherPopover } from '../../components/system-switcher-popover';
import { ThemeCustomizer } from '../../components/theme-customizer';
import type { ShellLayoutProps } from '../../layouts/types';
import { type MenuNode, resolveMenuIcon } from '../../menu';
import { isDisplayNode } from '../../menu/menu-utils';
import { useActiveModule } from '../../menu/use-active-module';

export function ClaudeRailLayout({
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

  const { activeModuleId, setActiveModule, activeSubmenu } = useActiveModule({
    menuTree,
    currentPathname,
    resolveMenuHref,
  });

  const handleNavigate = (href: string) => {
    void navigate({ to: href as never });
  };

  return (
    <TooltipProvider>
      <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
        {/* bg-blobs 背景装饰：brand 色左上（opacity 0.35）+ info 色右下（opacity 0.22） */}
        <BgBlobs />

        <RailTopbar
          menuTree={menuTree}
          activeModuleId={activeModuleId}
          onModuleChange={setActiveModule}
          currentUser={currentUser}
          notificationSlot={notificationSlot}
          systems={systems}
          isLoggingOut={isLoggingOut}
          onLogout={() => logout()}
        />

        <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
          <RailSidebar
            activeSubmenu={activeSubmenu}
            currentPathname={currentPathname}
            resolveMenuHref={resolveMenuHref}
            onNavigate={handleNavigate}
          />

          <main
            id="main-content"
            className="flex-1 min-w-0 overflow-y-auto"
            aria-label={t('layout.mainContent', { defaultValue: 'Main content' })}
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── RailTopbar ─────────────────────────────────────────────
//
// 与 classic 差异：relative z-10（浮于 bg-blobs 之上）

function RailTopbar({
  menuTree,
  activeModuleId,
  onModuleChange,
  currentUser,
  notificationSlot,
  systems,
  isLoggingOut,
  onLogout,
}: {
  menuTree: MenuNode[];
  activeModuleId: number | null;
  onModuleChange: (id: number) => void;
  currentUser: ShellLayoutProps['currentUser'];
  notificationSlot?: ShellLayoutProps['notificationSlot'];
  systems?: ShellLayoutProps['systems'];
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const { t } = useTranslation('shell');

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
      {/* 品牌：M 小方块 + meta-build 文字 */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground"
        >
          M
        </div>
        <span className="text-[14px] font-semibold tracking-tight">meta-build</span>
      </div>

      {/* HeaderTab（顶层模块切换） */}
      <HeaderTabSwitcher
        menuTree={menuTree}
        activeModuleId={activeModuleId}
        onModuleChange={onModuleChange}
        className="ml-2"
      />

      {/* 搜索区（中间） */}
      <div className="ml-auto flex min-w-0 flex-1 max-w-[420px] justify-end">
        <SearchInput
          placeholder={t('search.placeholder')}
          shortcut="⌘K"
          readOnly
          onClick={() => toast(t('search.comingSoon'), { description: t('search.comingSoonDesc') })}
          className="w-full cursor-pointer"
        />
      </div>

      {/* 右侧功能区 */}
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('topbar.help', { defaultValue: 'Help' })}
        >
          <HelpCircle className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('topbar.inbox', { defaultValue: 'Inbox' })}
        >
          <Inbox className="size-4" />
        </Button>

        {notificationSlot ?? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('topbar.notifications', { defaultValue: 'Notifications' })}
          >
            <Bell className="size-4" />
          </Button>
        )}

        {/* 九宫格 systems switcher（Task 11.5） */}
        {systems && systems.length > 0 && <SystemSwitcherPopover systems={systems} />}

        <DarkModeToggle />
        <ThemeCustomizer />

        {/* 竖分割线 */}
        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

        {/* User menu */}
        <RailUserMenu currentUser={currentUser} isLoggingOut={isLoggingOut} onLogout={onLogout} />
      </div>
    </header>
  );
}

function RailUserMenu({
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
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-accent/60"
        >
          <Avatar className="size-7">
            <AvatarFallback>
              <User className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-[13px] md:inline">{displayName}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
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

// ─── RailSidebar ────────────────────────────────────────────
//
// 窄轨道：w-16 图标列 + Tooltip 承载 label（side="right"）。
// 不渲染二级菜单 —— 二级导航由跳转后的页面内导航表达（Plan A 目标只到一级 rail）。

function RailSidebar({
  activeSubmenu,
  currentPathname,
  resolveMenuHref,
  onNavigate,
}: {
  activeSubmenu: MenuNode[];
  currentPathname: string;
  resolveMenuHref?: ShellLayoutProps['resolveMenuHref'];
  onNavigate: (href: string) => void;
}) {
  const { t } = useTranslation('shell');

  const visibleNodes = activeSubmenu.filter(isDisplayNode);

  return (
    <aside
      className="w-16 shrink-0 overflow-y-auto border-r bg-sidebar text-sidebar-foreground"
      aria-label={t('mix.moduleSidebarHint', { defaultValue: '二级导航' })}
    >
      <nav className="p-2 flex flex-col gap-1 items-center">
        {visibleNodes.map((node) => (
          <RailMenuItem
            key={node.id}
            node={node}
            currentPathname={currentPathname}
            resolveMenuHref={resolveMenuHref}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function RailMenuItem({
  node,
  currentPathname,
  resolveMenuHref,
  onNavigate,
}: {
  node: MenuNode;
  currentPathname: string;
  resolveMenuHref?: ShellLayoutProps['resolveMenuHref'];
  onNavigate: (href: string) => void;
}) {
  const Icon = resolveMenuIcon(node.icon);
  const href = resolveMenuHref?.(node) ?? null;
  const isActive =
    href != null && (currentPathname === href || currentPathname.startsWith(`${href}/`));

  const iconClassName = cn(
    'grid h-10 w-10 place-items-center rounded-md transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Link
            to={href as never}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(href);
            }}
            aria-label={node.name}
            data-active={isActive ? 'true' : 'false'}
            className={iconClassName}
          >
            <Icon className="size-5" strokeWidth={1.75} />
          </Link>
        ) : (
          <span
            role="img"
            aria-label={node.name}
            data-active={isActive ? 'true' : 'false'}
            className={iconClassName}
          >
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right">{node.name}</TooltipContent>
    </Tooltip>
  );
}
