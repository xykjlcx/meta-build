import { Button } from '@mb/ui-primitives';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMenu } from '../menu';
import type { MenuNode } from '../menu';

/**
 * 侧边栏导航。
 * - 消费 useMenu() 渲染菜单树
 * - 支持目录节点展开/收起
 * - 使用 sidebar color tokens
 */
export function Sidebar() {
  const { t } = useTranslation('shell');
  const { data } = useMenu();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200"
      style={{
        width: collapsed ? 'var(--size-sidebar-width-collapsed)' : 'var(--size-sidebar-width)',
      }}
    >
      {/* 顶部：Logo / 收起按钮 */}
      <div className="flex h-[var(--size-header-height)] items-center justify-between border-b border-sidebar-border px-3">
        {!collapsed && <span className="text-sm font-semibold">Meta Build</span>}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* 菜单树 */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {data?.tree.map((node) => (
          <MenuTreeItem key={node.id} node={node} collapsed={collapsed} depth={0} />
        ))}
      </nav>
    </aside>
  );
}

/** 递归菜单树项 */
function MenuTreeItem({
  node,
  collapsed,
  depth,
}: {
  node: MenuNode;
  collapsed: boolean;
  depth: number;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (node.kind === 'directory') {
      setExpanded((prev) => !prev);
    } else if (node.path) {
      navigate({ to: node.path });
    }
  }, [node, navigate]);

  // button 类型菜单不在侧边栏渲染
  if (node.kind === 'button') return null;

  const hasChildren = node.children.length > 0;
  const paddingLeft = collapsed ? 8 : 12 + depth * 16;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        style={{ paddingLeft }}
      >
        {/* 展开/收起指示器 */}
        {hasChildren && !collapsed ? (
          expanded ? (
            <ChevronDown className="size-3.5 shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}

        {!collapsed && <span className="truncate">{node.name}</span>}
      </button>

      {/* 子节点 */}
      {hasChildren && expanded && !collapsed && (
        <div>
          {node.children.map((child) => (
            <MenuTreeItem key={child.id} node={child} collapsed={collapsed} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
