import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@mb/ui-primitives';
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  Settings,
  User,
} from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type CurrentUser, useAuth } from '../../auth';
import { LanguageSwitcher } from '../../components/language-switcher';
import { ThemeCustomizer } from '../../components/theme-customizer';
import type { ShellLayoutProps } from '../../layouts/types';
import { resolveMenuIcon } from '../../menu';
import type { MenuNode } from '../../menu';

// Sidebar 宽度对齐 shadcnuikit.com/dashboard/default（256px）
const INSET_SIDEBAR_VARS = {
  '--sidebar-width': '16rem',
  '--sidebar-width-mobile': '16rem',
  '--sidebar-width-icon': '3rem',
} as CSSProperties;

export function InsetLayout({
  children,
  menuTree,
  currentUser,
  notificationSlot,
  heroSlot,
  sidebarHeaderSlot,
  sidebarFooterSlot,
  sidebarAboveFooterSlot,
}: ShellLayoutProps) {
  const { logout, isLoggingOut } = useAuth();

  return (
    <SidebarProvider style={INSET_SIDEBAR_VARS} className="bg-sidebar text-foreground">
      <InsetSidebar
        menuTree={menuTree}
        currentUser={currentUser}
        headerSlot={sidebarHeaderSlot}
        footerSlot={sidebarFooterSlot}
        aboveFooterSlot={sidebarAboveFooterSlot}
        onLogout={() => logout()}
      />

      <SidebarInset>
        <InsetHeader
          notificationSlot={notificationSlot}
          isLoggingOut={isLoggingOut}
          onLogout={() => logout()}
        />

        {heroSlot}

        <div className="flex flex-1 flex-col bg-muted/40">
          <main className="content-wrapper flex-1 p-4 md:p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function InsetSidebar({
  menuTree,
  currentUser,
  headerSlot,
  footerSlot,
  aboveFooterSlot,
  onLogout,
}: {
  menuTree: MenuNode[];
  currentUser: CurrentUser;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  aboveFooterSlot?: ReactNode;
  onLogout: () => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const visibleNodes = useMemo(() => menuTree.filter(isDisplayNode), [menuTree]);
  const activeLeafId = useMemo(() => findFirstLeafId(visibleNodes), [visibleNodes]);

  useEffect(() => {
    if (visibleNodes.length === 0) return;
    setExpandedIds((prev) => {
      const next = { ...prev };
      for (const node of visibleNodes) {
        if (node.menuType === 'DIRECTORY' && next[node.id] === undefined) {
          next[node.id] = true;
        }
      }
      return next;
    });
  }, [visibleNodes]);

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/* Header：使用者可 override，未传则使用默认 Logo + 双行文字 + 切换器 */}
      <SidebarHeader>{headerSlot ?? <DefaultSidebarHeader />}</SidebarHeader>

      {/* Content：菜单 */}
      <SidebarContent>
        {visibleNodes.map((node) => {
          const childNodes = getDisplayChildren(node);

          if (node.menuType === 'DIRECTORY' && childNodes.length > 0) {
            return (
              <SidebarGroup key={node.id}>
                <SidebarGroupLabel>{node.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {childNodes.map((child) => (
                      <InsetMenuNode
                        key={child.id}
                        node={child}
                        depth={0}
                        activeLeafId={activeLeafId}
                        expandedIds={expandedIds}
                        onToggleExpanded={(id) =>
                          setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
                        }
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <SidebarGroup key={node.id}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <InsetMenuNode
                    node={node}
                    depth={0}
                    activeLeafId={activeLeafId}
                    expandedIds={expandedIds}
                    onToggleExpanded={(id) =>
                      setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
                    }
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer 之上的装饰/CTA 位（使用者传入才渲染） */}
      {aboveFooterSlot && (
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">{aboveFooterSlot}</div>
      )}

      {/* Footer：使用者可 override，未传则使用默认 Avatar + 三点菜单 */}
      <SidebarFooter>
        {footerSlot ?? <DefaultSidebarFooter currentUser={currentUser} onLogout={onLogout} />}
      </SidebarFooter>

      {/* shadcn 官方拖拽折叠手柄 */}
      <SidebarRail />
    </Sidebar>
  );
}

function DefaultSidebarHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          {/* 左：方块 logo */}
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <LayoutGrid className="size-4" />
          </div>

          {/* 中：双行文字（icon 折叠时自动 hidden） */}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Meta Build</span>
            <span className="truncate text-xs text-muted-foreground">Workspace</span>
          </div>

          {/* 右：切换器图标 */}
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function DefaultSidebarFooter({
  currentUser,
  onLogout,
}: {
  currentUser: CurrentUser;
  onLogout: () => void;
}) {
  const { t } = useTranslation('shell');
  const displayName = currentUser.username ?? t('sidebar.operatorFallback');
  const displayEmail = currentUser.email ?? t('sidebar.emailFallback');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={t('sidebar.userMenu')}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
              </div>
              <MoreHorizontal className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="min-w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              {t('sidebar.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onLogout()}>
              <LogOut className="mr-2 size-4" />
              {t('sidebar.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function InsetHeader({
  notificationSlot,
  isLoggingOut,
  onLogout,
}: {
  notificationSlot?: ShellLayoutProps['notificationSlot'];
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const { t } = useTranslation('shell');

  return (
    <header className="sticky top-0 z-50 flex h-(--size-header-height) shrink-0 items-center gap-2 border-b bg-background/40 px-4 backdrop-blur-md md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <span className="text-sm text-muted-foreground">{t('header.workspace')}</span>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {notificationSlot}
        <LanguageSwitcher />
        <ThemeCustomizer />

        <Separator
          orientation="vertical"
          className="mx-1 hidden data-[orientation=vertical]:h-4 md:block"
        />

        <Avatar size="sm" className="hidden md:flex">
          <AvatarFallback>
            <User className="size-3.5" />
          </AvatarFallback>
        </Avatar>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-label={t('header.logout')}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}

/**
 * 菜单项图标渲染：
 * - 当 node 有 iconBg / iconBgColor 时渲染彩色方块（campus 风格）
 * - 否则渲染裸 Lucide 图标（shadcn-classic 风格）
 */
function MenuNodeIcon({ node }: { node: MenuNode }) {
  const Icon = resolveMenuIcon(node.icon);

  if (node.iconBg || node.iconBgColor) {
    const bgStyle: CSSProperties = node.iconBgColor
      ? { backgroundColor: `var(${node.iconBgColor})` }
      : { backgroundColor: node.iconBg };
    return (
      <div
        className="flex aspect-square size-6 shrink-0 items-center justify-center rounded-md text-white"
        style={bgStyle}
      >
        <Icon className="size-3.5" />
      </div>
    );
  }

  return <Icon className="size-4 shrink-0" />;
}

function MenuNodeBadge({ badge }: { badge: string | number }) {
  return (
    <span className="ml-auto rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold text-sidebar-accent-foreground">
      {badge}
    </span>
  );
}

// 菜单节点渲染
function InsetMenuNode({
  node,
  depth,
  activeLeafId,
  expandedIds,
  onToggleExpanded,
}: {
  node: MenuNode;
  depth: number;
  activeLeafId: number | null;
  expandedIds: Record<number, boolean>;
  onToggleExpanded: (id: number) => void;
}) {
  const children = getDisplayChildren(node);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds[node.id] ?? true;
  const isActiveLeaf = activeLeafId === node.id;

  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          isActive={isActiveLeaf && !hasChildren}
          onClick={() => {
            if (hasChildren) onToggleExpanded(node.id);
          }}
        >
          <MenuNodeIcon node={node} />
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          {node.badge !== undefined && <MenuNodeBadge badge={node.badge} />}
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/55" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-sidebar-foreground/55" />
            ))}
        </SidebarMenuButton>

        {hasChildren && isExpanded && (
          <SidebarMenuSub>
            {children.map((child) => (
              <InsetMenuNode
                key={child.id}
                node={child}
                depth={depth + 1}
                activeLeafId={activeLeafId}
                expandedIds={expandedIds}
                onToggleExpanded={onToggleExpanded}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        type="button"
        isActive={isActiveLeaf && !hasChildren}
        onClick={() => {
          if (hasChildren) onToggleExpanded(node.id);
        }}
      >
        <MenuNodeIcon node={node} />
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.badge !== undefined && <MenuNodeBadge badge={node.badge} />}
        {hasChildren &&
          (isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-sidebar-foreground/55" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-sidebar-foreground/55" />
          ))}
      </SidebarMenuSubButton>

      {hasChildren && isExpanded && (
        <SidebarMenuSub>
          {children.map((child) => (
            <InsetMenuNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeLeafId={activeLeafId}
              expandedIds={expandedIds}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
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
    if (!isDisplayNode(node)) continue;
    const children = getDisplayChildren(node);
    if (children.length === 0) return node.id;
    const leafId = findFirstLeafId(children);
    if (leafId) return leafId;
  }
  return null;
}
