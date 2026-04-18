import { useCallback, useEffect, useMemo, useState } from 'react';
import { findMenuPathByPath, isDisplayNode, type MenuHrefResolver } from './menu-utils';
import type { MenuNode } from './types';

const ACTIVE_MODULE_KEY = 'mb_active_module_id';

// SSR / Storybook / 非浏览器环境的安全 localStorage 访问
const hasWindow = () => typeof window !== 'undefined';

const safeGetItem = (key: string): string | null => {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 静默失败 */
  }
};

export interface UseActiveModuleParams {
  menuTree: MenuNode[];
  currentPathname: string;
  resolveMenuHref?: MenuHrefResolver;
}

export interface UseActiveModuleResult {
  activeModuleId: number | null;
  setActiveModule: (id: number) => void;
  activeModuleNode: MenuNode | null;
  /** 当前激活模块下的子菜单（Sidebar 消费） */
  activeSubmenu: MenuNode[];
}

/**
 * 根据 URL / localStorage / 第一个模块 三级 fallback 推导当前激活的模块。
 *
 * 推导顺序：
 * 1. 基于 `currentPathname` + `resolveMenuHref` 在菜单树中查找，命中则取路径的根节点
 * 2. 读 localStorage `mb_active_module_id`，若对应模块仍存在且可展示则用之
 * 3. 取 `menuTree` 中第一个可展示的模块
 */
export function useActiveModule({
  menuTree,
  currentPathname,
  resolveMenuHref,
}: UseActiveModuleParams): UseActiveModuleResult {
  const computeInitial = useCallback((): number | null => {
    // 1. URL 推导
    if (resolveMenuHref) {
      const path = findMenuPathByPath(menuTree, currentPathname, resolveMenuHref);
      if (path.length > 0 && path[0]?.id != null) {
        return path[0].id;
      }
    }
    // 2. localStorage
    const stored = safeGetItem(ACTIVE_MODULE_KEY);
    if (stored) {
      const id = Number(stored);
      if (!Number.isNaN(id) && menuTree.some((n) => n.id === id && isDisplayNode(n))) {
        return id;
      }
    }
    // 3. 第一个可显示模块
    const first = menuTree.find(isDisplayNode);
    return first ? first.id : null;
  }, [menuTree, currentPathname, resolveMenuHref]);

  const [activeModuleId, setActiveModuleIdState] = useState<number | null>(computeInitial);

  useEffect(() => {
    const next = computeInitial();
    setActiveModuleIdState(next);
  }, [computeInitial]);

  const setActiveModule = useCallback((id: number) => {
    setActiveModuleIdState(id);
    safeSetItem(ACTIVE_MODULE_KEY, String(id));
  }, []);

  const { activeModuleNode, activeSubmenu } = useMemo(() => {
    if (activeModuleId == null) {
      return { activeModuleNode: null, activeSubmenu: [] as MenuNode[] };
    }
    const node = menuTree.find((n) => n.id === activeModuleId) ?? null;
    return {
      activeModuleNode: node,
      activeSubmenu: node?.children ?? [],
    };
  }, [menuTree, activeModuleId]);

  return { activeModuleId, setActiveModule, activeModuleNode, activeSubmenu };
}
