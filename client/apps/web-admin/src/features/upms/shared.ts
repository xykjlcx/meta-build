import type { DeptVo, MenuVo } from '@mb/api-sdk';

export interface TreeOption {
  value: number;
  label: string;
}

interface NamedTreeNode {
  id: number;
  name: string;
  children: NamedTreeNode[];
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString();
}

export function buildExpandedIds<T extends { id: number; children: T[] }>(nodes: T[]) {
  const expandedIds = new Set<string>();

  function walk(items: T[]) {
    for (const item of items) {
      if (item.children.length > 0) {
        expandedIds.add(String(item.id));
        walk(item.children);
      }
    }
  }

  walk(nodes);
  return expandedIds;
}

export function flattenDeptOptions(nodes: DeptVo[], depth = 0): TreeOption[] {
  return nodes.flatMap((node) => [
    {
      value: node.id,
      label: `${'  '.repeat(depth)}${node.name}`,
    },
    ...flattenDeptOptions(node.children, depth + 1),
  ]);
}

export function flattenMenuOptions(nodes: MenuVo[], depth = 0): TreeOption[] {
  return nodes.flatMap((node) => [
    {
      value: node.id,
      label: `${'  '.repeat(depth)}${node.name}`,
    },
    ...flattenMenuOptions(node.children, depth + 1),
  ]);
}

export function findTreeNodeName(
  nodes: NamedTreeNode[],
  targetId: number | null | undefined,
): string | null {
  if (targetId == null) {
    return null;
  }

  for (const node of nodes) {
    if (node.id === targetId) {
      return node.name;
    }
    const childName = findTreeNodeName(node.children, targetId);
    if (childName) {
      return childName;
    }
  }

  return null;
}
