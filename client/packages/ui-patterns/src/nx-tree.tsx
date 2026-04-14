import { type ReactNode, useCallback } from 'react';
import { cn } from '@mb/ui-primitives';

// ─── 类型 ───────────────────────────────────────────────

export interface NxTreeNode {
  id: string;
  children?: NxTreeNode[];
}

export interface NxTreeProps<TNode extends NxTreeNode> {
  data: TNode[];
  /** 自定义节点渲染 */
  renderNode: (node: TNode, depth: number) => ReactNode;
  /** 受控展开状态 */
  expandedIds?: Set<string>;
  onExpandedChange?: (next: Set<string>) => void;
  /** v1.5 实现拖拽 */
  draggable?: boolean;
  /** v1.5 实现拖拽回调 */
  onDrop?: (dragId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  /** 空数据提示（REQUIRED，由调用方注入） */
  emptyText: ReactNode;
  className?: string;
}

// ─── 常量 ───────────────────────────────────────────────

/** 每层缩进像素 */
const INDENT_PX = 24;

// ─── 展开箭头（纯 SVG，不依赖 lucide-react） ──────────────

function ExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn(
        'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
        expanded && 'rotate-90',
      )}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 4l4 4-4 4z" />
    </svg>
  );
}

// ─── 内部递归节点 ───────────────────────────────────────

interface TreeNodeItemProps<TNode extends NxTreeNode> {
  node: TNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  renderNode: (node: TNode, depth: number) => ReactNode;
}

function TreeNodeItem<TNode extends NxTreeNode>({
  node,
  depth,
  expandedIds,
  onToggle,
  renderNode,
}: TreeNodeItemProps<TNode>) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        className="flex items-center gap-1 py-1"
        style={{ paddingLeft: depth * INDENT_PX }}
      >
        {/* 展开/收起按钮 */}
        {hasChildren ? (
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded hover:bg-accent"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ExpandIcon expanded={isExpanded} />
          </button>
        ) : (
          // 叶子节点占位，保持对齐
          <span className="size-5" aria-hidden="true" />
        )}

        {/* 调用方自定义内容 */}
        <span className="min-w-0 flex-1">{renderNode(node, depth)}</span>
      </div>

      {/* 递归渲染子节点 */}
      {hasChildren && isExpanded && (
        <ul role="group">
          {(node.children as TNode[]).map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              renderNode={renderNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── 主组件 ─────────────────────────────────────────────

function NxTree<TNode extends NxTreeNode>({
  data,
  renderNode,
  expandedIds = new Set(),
  onExpandedChange,
  // v1.5 实现拖拽逻辑
  draggable: _draggable,
  onDrop: _onDrop,
  emptyText,
  className,
}: NxTreeProps<TNode>) {
  const handleToggle = useCallback(
    (id: string) => {
      if (!onExpandedChange) return;
      const next = new Set(expandedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onExpandedChange(next);
    },
    [expandedIds, onExpandedChange],
  );

  // 空数据
  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-center', className)}>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul role="tree" className={className}>
      {data.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          renderNode={renderNode}
        />
      ))}
    </ul>
  );
}

export { NxTree };
