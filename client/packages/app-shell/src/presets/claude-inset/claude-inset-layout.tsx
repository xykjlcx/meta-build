/**
 * ClaudeInsetLayout — Plan A "claude-inset" preset。
 *
 * 100% 还原 Claude Design `layout--inset`（styles/app.css:219-250 + bg-blobs:86-101）：
 * - 外层 bg-sidebar 暖深色铺底 + relative overflow-hidden
 * - bg-blobs 背景装饰（两个模糊圆形渐变绝对定位，brand 色左上 + info 色右下）—— claude-inset 的视觉标志
 * - Topbar 贴顶 + bg-background/60 backdrop-blur-md（毛玻璃感）
 * - 主体 aside + main 都 rounded-xl border shadow-sm（内嵌白卡片），外边距 m-2 mt-0
 * - aside bg-sidebar/80 backdrop-blur-sm / main bg-background/90 backdrop-blur-sm
 *
 * Topbar + Sidebar nav 内部 JSX 与 claude-classic 完全一致（Plan 明确"不抽共享 Topbar 组件"）。
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
import { BgBlobs } from '../../components/bg-blobs';
import { DarkModeToggle } from '../../components/dark-mode-toggle';
import { HeaderTabSwitcher } from '../../components/header-tab-switcher';
import { SystemSwitcherPopover } from '../../components/system-switcher-popover';
import { ThemeCustomizer } from '../../components/theme-customizer';
import type { ShellLayoutProps } from '../../layouts/types';
import { type MenuNode, resolveMenuIcon } from '../../menu';
import { getDisplayChildren, isDisplayNode } from '../../menu/menu-utils';
import { useActiveModule } from '../../menu/use-active-module';

export function ClaudeInsetLayout({
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
      <div className="relative flex h-screen flex-col overflow-hidden bg-sidebar text-foreground">
        {/* bg-blobs 背景装饰：brand 色左上（opacity 0.35）+ info 色右下（opacity 0.22） */}
        <BgBlobs />

        <InsetTopbar
          menuTree={menuTree}
          activeModuleId={activeModuleId}
          onModuleChange={setActiveModule}
          currentUser={currentUser}
          notificationSlot={notificationSlot}
          systems={systems}
          isLoggingOut={isLoggingOut}
          onLogout={() => logout()}
        />

        <div className="relative z-10 flex min-h-0 flex-1 gap-2 overflow-hidden m-2 mt-0">
          <InsetSidebar
            activeSubmenu={activeSubmenu}
            currentPathname={currentPathname}
            resolveMenuHref={resolveMenuHref}
            onNavigate={handleNavigate}
          />

          <main
            id="main-content"
            className="flex-1 min-w-0 overflow-y-auto rounded-xl border bg-background/90 shadow-sm backdrop-blur-sm"
            aria-label={t('layout.mainContent', { defaultValue: 'Main content' })}
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── InsetTopbar ────────────────────────────────────────────
//
// 与 classic 差异：relative z-10 + bg-background/60 backdrop-blur-md（毛玻璃）

function InsetTopbar({
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
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/60 px-4 backdrop-blur-md">
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
        <InsetUserMenu currentUser={currentUser} isLoggingOut={isLoggingOut} onLogout={onLogout} />
      </div>
    </header>
  );
}

function InsetUserMenu({
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

// ─── InsetSidebar ───────────────────────────────────────────
//
// 与 classic 差异：rounded-xl + bg-sidebar/80 + backdrop-blur-sm + border-sidebar-border（去掉 border-r）

function InsetSidebar({
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
      className="w-60 shrink-0 overflow-y-auto rounded-xl border border-sidebar-border bg-sidebar/80 text-sidebar-foreground backdrop-blur-sm"
      aria-label={t('mix.moduleSidebarHint', { defaultValue: '二级导航' })}
    >
      <nav className="px-2 py-3 flex flex-col gap-0.5">
        {visibleNodes.map((node) => (
          <InsetMenuItem
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

function InsetMenuItem({
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
            <InsetMenuItem
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
