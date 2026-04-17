import {
  Avatar,
  AvatarFallback,
  Button,
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
  SidebarTrigger,
} from '@mb/ui-primitives';
import { ChevronDown, ChevronRight, ChevronsUpDown, LayoutGrid, LogOut, User } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth';
import { LanguageSwitcher } from '../../components/language-switcher';
import { ThemeCustomizer } from '../../components/theme-customizer';
import type { ShellLayoutProps } from '../../layouts/types';
import { resolveMenuIcon } from '../../menu';
import type { MenuNode } from '../../menu';

const INSET_SIDEBAR_VARS = {
  '--sidebar-width': '18rem',
  '--sidebar-width-mobile': '18rem',
  '--sidebar-width-icon': '3rem',
} as CSSProperties;

export function InsetLayout({
  children,
  menuTree,
  currentUser,
  notificationSlot,
}: ShellLayoutProps) {
  const { logout, isLoggingOut } = useAuth();

  return (
    <SidebarProvider style={INSET_SIDEBAR_VARS} className="bg-sidebar text-foreground">
      <InsetSidebar menuTree={menuTree} currentUser={currentUser} />

      <SidebarInset>
        <InsetHeader
          notificationSlot={notificationSlot}
          isLoggingOut={isLoggingOut}
          onLogout={() => logout()}
        />

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
}: Pick<ShellLayoutProps, 'menuTree' | 'currentUser'>) {
  const { t } = useTranslation('shell');
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
      {/* Logo — 对齐 shadcnuikit SidebarHeader 结构 */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5 data-[state=open]:bg-sidebar-accent">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-5">
                <LayoutGrid className="size-4" />
              </div>
              <span className="text-base font-medium truncate">Meta Build</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* 菜单 — Lucide 图标 + SidebarGroup 分组 */}
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

      {/* Footer — 用户信息（对齐 shadcnuikit 的 SidebarMenuButton 结构） */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentUser.username ?? t('sidebar.operatorFallback')}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t('sidebar.operatorRole')}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
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

// 菜单节点 — 用 Lucide SVG 图标代替首字母方块
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
  const Icon = resolveMenuIcon(node.icon);

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
          <Icon className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
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
        <Icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
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
