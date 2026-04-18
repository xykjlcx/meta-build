/**
 * Preset 测试共享 helper（claude-classic / claude-inset / claude-rail 共用）
 *
 * 设计要点：
 * 1. `__testPathname` 为 mutable ref，供 test 文件里的 `vi.mock('@tanstack/react-router', ...)`
 *    在运行时读取当前 URL；这样 `renderWithShell(initialPath, ...)` 就能让 Layout 的
 *    `useRouterState({ select })` 收到不同的 pathname。
 * 2. vi.mock 是文件级 hoisted，但 mock factory 内的箭头函数是 lazy 的；
 *    import 的 `__testPathname` 会指向同一个 module 实例，`.current` 写入生效。
 * 3. auth / api 相关全部避免真实使用 —— 测试文件应用 `vi.mock('../../../auth', ...)`
 *    以绕过 QueryClient 依赖。
 * 4. 提供一份稳定的 sample 数据（菜单树 / 权限 / systems / resolveMenuHref），多个 preset
 *    的测试套件共享，避免重复 fixtures。
 */

import { render } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { I18nProvider } from '../../i18n';
import type { ShellLayoutProps, SystemItem } from '../../layouts/types';
// 引入 layouts/registry 触发 inset/mix preset 注册（ThemeCustomizer 打开面板时会读取）
import '../../layouts/registry';
import type { CurrentUser } from '../../auth';
import { LayoutPresetProvider } from '../../layouts/layout-preset-provider';
import type { MenuNode } from '../../menu';
import { StyleProvider } from '../../theme/style-provider';

// ─── 动态 pathname（供 vi.mock 运行时读取）───────────────────

/** 可变引用，test 文件的 `vi.mock('@tanstack/react-router', ...)` 通过闭包读取。 */
export const __testPathname = { current: '/' };

export function setTestPathname(path: string): void {
  __testPathname.current = path;
}

// ─── Sample Fixtures ────────────────────────────────────────

/** 构造可展示的顶层菜单节点（DIRECTORY）。 */
export function mkNode(id: number, name: string, children: MenuNode[] = []): MenuNode {
  return {
    id,
    parentId: null,
    name,
    permissionCode: null,
    menuType: children.length > 0 ? 'DIRECTORY' : 'MENU',
    icon: null,
    sortOrder: id,
    visible: true,
    children,
  };
}

/** 构造可展示的子菜单节点（MENU + permissionCode）。 */
export function mkChild(
  id: number,
  parentId: number,
  name: string,
  permissionCode: string | null = null,
): MenuNode {
  return {
    id,
    parentId,
    name,
    // biome-ignore lint/suspicious/noExplicitAny: 测试 fixture 不强绑定 AppPermission 字面量集合
    permissionCode: permissionCode as any,
    menuType: 'MENU',
    icon: null,
    sortOrder: id,
    visible: true,
    children: [],
  };
}

/** 3 顶层模块（组织管理 / 内容 / 产品设置），每个带若干子菜单。 */
export const sampleMenuTree: MenuNode[] = [
  mkNode(1, '组织管理', [
    mkChild(11, 1, '成员与部门', 'iam:user:read'),
    mkChild(12, 1, '角色管理', 'iam:role:read'),
  ]),
  mkNode(2, '内容', [mkChild(21, 2, '公告管理', 'notice:read')]),
  mkNode(3, '产品设置', [mkChild(31, 3, '应用配置', 'config:read')]),
];

/** Admin 用户（含 4 个权限，可访问 sampleMenuTree 全部叶子）。 */
export const sampleCurrentUser: CurrentUser = {
  isAuthenticated: true,
  userId: 1,
  username: 'admin',
  deptId: null,
  email: 'admin@example.com',
  // biome-ignore lint/suspicious/noExplicitAny: 测试 fixture 不强绑定 AppPermission 字面量集合
  permissions: new Set(['iam:user:read', 'iam:role:read', 'notice:read', 'config:read']) as any,
  hasPermission: () => true,
  hasAnyPermission: () => true,
  hasAllPermissions: () => true,
};

/** 仅 1 个当前系统的九宫格数据（最小化，避免视觉断言干扰）。 */
export const sampleSystems: SystemItem[] = [
  {
    key: 'admin',
    labelKey: 'system.admin',
    icon: 'layout-dashboard',
    current: true,
    disabled: false,
  },
];

/** 把 menuTree 叶子节点映射到固定 URL 的 resolver（用于 URL-based 激活模块推导）。 */
export function sampleResolveMenuHref(node: MenuNode): string | null {
  switch (node.id) {
    case 11:
      return '/system/members';
    case 12:
      return '/system/roles';
    case 21:
      return '/notices';
    case 31:
      return '/settings/app';
    default:
      return null;
  }
}

// ─── Provider Wrapper ───────────────────────────────────────

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <StyleProvider>
        <LayoutPresetProvider>{children}</LayoutPresetProvider>
      </StyleProvider>
    </I18nProvider>
  );
}

// ─── renderWithShell ────────────────────────────────────────

type LayoutComponent = ComponentType<ShellLayoutProps>;

export interface RenderWithShellOverrides {
  menuTree?: MenuNode[];
  currentUser?: CurrentUser;
  systems?: SystemItem[];
  resolveMenuHref?: ShellLayoutProps['resolveMenuHref'];
  notificationSlot?: ReactNode;
  children?: ReactNode;
}

/**
 * 用 initialPath 写入 `__testPathname`，然后把 Layout 包在完整 Provider 树里渲染。
 * 测试文件必须自己 `vi.mock('@tanstack/react-router', ...)` + `vi.mock('../../../auth', ...)`，
 * mock 内用 `__testPathname.current` 读 pathname。
 */
export function renderWithShell(
  initialPath: string,
  Layout: LayoutComponent,
  overrides: RenderWithShellOverrides = {},
) {
  setTestPathname(initialPath);

  const props: ShellLayoutProps = {
    children: overrides.children ?? <div data-testid="content">页面内容</div>,
    menuTree: overrides.menuTree ?? sampleMenuTree,
    currentUser: overrides.currentUser ?? sampleCurrentUser,
    systems: overrides.systems ?? sampleSystems,
    resolveMenuHref: overrides.resolveMenuHref ?? sampleResolveMenuHref,
    notificationSlot: overrides.notificationSlot,
  };

  return render(
    <AllProviders>
      <Layout {...props} />
    </AllProviders>,
  );
}
