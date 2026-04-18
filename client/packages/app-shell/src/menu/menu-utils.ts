import type { MenuNode } from './types';

export type MenuHrefResolver = (node: MenuNode) => string | null;

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

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function matchesMenuHref(currentPathname: string, href: string | null | undefined): boolean {
  if (!href) {
    return false;
  }

  const current = normalizePathname(currentPathname);
  const target = normalizePathname(href);

  if (current === target) {
    return true;
  }

  return current.startsWith(`${target}/`);
}

/**
 * 基于当前路由查找应高亮的叶子菜单。
 * 优先返回最深层匹配节点；未命中时返回 null，由调用方决定是否回退到首个叶子。
 */
export function findActiveLeafIdByPath(
  nodes: MenuNode[],
  currentPathname: string,
  resolveHref?: MenuHrefResolver,
): number | null {
  for (const node of nodes) {
    if (!isDisplayNode(node)) {
      continue;
    }

    const children = getDisplayChildren(node);
    if (children.length > 0) {
      const matchedChildId = findActiveLeafIdByPath(children, currentPathname, resolveHref);
      if (matchedChildId) {
        return matchedChildId;
      }
    }

    if (resolveHref && matchesMenuHref(currentPathname, resolveHref(node))) {
      return node.id;
    }
  }

  return null;
}

/**
 * 基于当前路由找到对应的菜单路径。
 * 返回从顶层模块到叶子菜单的完整链路；未命中时返回空数组。
 */
export function findMenuPathByPath(
  nodes: MenuNode[],
  currentPathname: string,
  resolveHref?: MenuHrefResolver,
): MenuNode[] {
  for (const node of nodes) {
    if (!isDisplayNode(node)) {
      continue;
    }

    const children = getDisplayChildren(node);
    if (children.length > 0) {
      const matchedChildren = findMenuPathByPath(children, currentPathname, resolveHref);
      if (matchedChildren.length > 0) {
        return [node, ...matchedChildren];
      }
    }

    if (resolveHref && matchesMenuHref(currentPathname, resolveHref(node))) {
      return [node];
    }
  }

  return [];
}
