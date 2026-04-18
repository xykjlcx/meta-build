/**
 * ClaudeClassicLayout — Plan A "claude-classic" preset。
 *
 * 100% 还原 Claude Design `layout--classic`（styles/app.css:219-232 + components/shell.jsx:137-198）：
 * - Topbar 56px：品牌（M 小方块 + meta-build）+ HeaderTab + SearchInput + 右侧功能区
 * - 左侧 Sidebar 240px（原生 aside + 数组 map），按 activeModuleId 过滤子菜单
 * - 主内容 flex-1 overflow-y-auto
 *
 * 与 inset preset 的差异：
 * - **不**使用 shadcn Sidebar/SidebarProvider/SidebarInset 复合组件
 * - supportedDimensions 将在 Task 16 注册时声明为 []（customizer 不消费此 preset 的维度）
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
  TooltipProvider,
  cn,
} from '@mb/ui-primitives';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Bell, ChevronDown, HelpCircle, Inbox, LogOut, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../auth';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { HeaderTabSwitcher } from '../../components/header-tab-switcher';
import { SystemSwitcherPopover } from '../../components/system-switcher-popover';
import { ThemeCustomizer } from '../../components/theme-customizer';
import type { ShellLayoutProps } from '../../layouts/types';
import { type MenuNode, resolveMenuIcon } from '../../menu';
import { getDisplayChildren, isDisplayNode } from '../../menu/menu-utils';
import { useActiveModule } from '../../menu/use-active-module';

export function ClaudeClassicLayout({
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
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <ClassicTopbar
          menuTree={menuTree}
          activeModuleId={activeModuleId}
          onModuleChange={setActiveModule}
          currentUser={currentUser}
          notificationSlot={notificationSlot}
          systems={systems}
          isLoggingOut={isLoggingOut}
          onLogout={() => logout()}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ClassicSidebar
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

// ─── ClassicTopbar ──────────────────────────────────────────

function ClassicTopbar({
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
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
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
        <ClassicUserMenu
          currentUser={currentUser}
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

function ClassicUserMenu({
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

// ─── ClassicSidebar ─────────────────────────────────────────
//
// Claude Design 源是原生 <aside> + 数组 map（components/shell.jsx:177-196）：
// - 不走 shadcn Sidebar 复合
// - 每个一级菜单一行（icon + label），二级缩进显示
// - 激活状态用 data-active + 背景色区分

function ClassicSidebar({
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

  // 过滤出可展示节点
  const visibleNodes = activeSubmenu.filter(isDisplayNode);

  return (
    <aside
      className="w-60 shrink-0 border-r bg-card overflow-y-auto"
      aria-label={t('mix.moduleSidebarHint', { defaultValue: '二级导航' })}
    >
      <nav className="px-2 py-3 flex flex-col gap-0.5">
        {visibleNodes.map((node) => (
          <ClassicMenuItem
            key={node.id}
            node={node}
            depth={0}
            currentPathname={currentPathname}
            resolveMenuHref={resolveMenuHref}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function ClassicMenuItem({
  node,
  depth,
  currentPathname,
  resolveMenuHref,
  onNavigate,
}: {
  node: MenuNode;
  depth: number;
  currentPathname: string;
  resolveMenuHref?: ShellLayoutProps['resolveMenuHref'];
  onNavigate: (href: string) => void;
}) {
  const Icon = resolveMenuIcon(node.icon);
  const href = resolveMenuHref?.(node) ?? null;
  const children = getDisplayChildren(node);
  const hasChildren = children.length > 0;
  const isActive =
    href != null && (currentPathname === href || currentPathname.startsWith(`${href}/`));

  const content = (
    <span
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
        depth === 0 ? 'font-medium' : 'pl-8 font-normal text-muted-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60 hover:text-foreground',
      )}
    >
      {depth === 0 && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
      <span className="truncate">{node.name}</span>
    </span>
  );

  return (
    <div>
      {href ? (
        <Link
          to={href as never}
          onClick={(e) => {
            // 避免 Router mock 环境里真的做硬跳转，优先交给 navigate
            e.preventDefault();
            onNavigate(href);
          }}
          data-active={isActive ? 'true' : 'false'}
          className="block no-underline text-inherit"
        >
          {content}
        </Link>
      ) : (
        <div data-active={isActive ? 'true' : 'false'}>{content}</div>
      )}

      {hasChildren && (
        <div className="mt-0.5">
          {children.map((child) => (
            <ClassicMenuItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentPathname={currentPathname}
              resolveMenuHref={resolveMenuHref}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
