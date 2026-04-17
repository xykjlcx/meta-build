import type { MenuNode } from './types';

/** 判断节点是否应当展示（过滤 BUTTON 类型和 visible=false） */
export function isDisplayNode(node: MenuNode): boolean {
  return node.visible !== false && node.menuType !== 'BUTTON';
}

/** 获取节点的可展示子节点列表 */
export function getDisplayChildren(node: MenuNode): MenuNode[] {
  return node.children.filter(isDisplayNode);
}

/** 递归找第一个叶子节点 id（无子节点的可展示节点） */
export function findFirstLeafId(nodes: MenuNode[]): number | null {
  for (const node of nodes) {
    if (!isDisplayNode(node)) continue;
    const children = getDisplayChildren(node);
    if (children.length === 0) return node.id;
    const leafId = findFirstLeafId(children);
    if (leafId) return leafId;
  }
  return null;
}
