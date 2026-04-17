/**
 * MixLayout 移动端行为集成测试
 *
 * 测试策略：
 * - mock `useAuth` 避免引入 TanStack Query + Router 依赖
 * - 用真实 StyleProvider + LayoutPresetProvider + I18nProvider wrap（行为接近生产环境）
 * - 移动端/桌面端区分是纯 CSS（Tailwind lg:hidden），不需要 matchMedia
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../i18n';
// 必须导入 registry（side-effect 入口），触发 inset/mix preset 注册到 layoutRegistry
// ThemeCustomizer 内部调用 layoutRegistry.get(presetId)，若未注册则抛异常
import '../../../layouts/registry';
import { LayoutPresetProvider } from '../../../layouts/layout-preset-provider';
import type { MenuNode } from '../../../menu';
import { StyleProvider } from '../../../theme/style-provider';
import { MixLayout } from '../mix-layout';

// mock useAuth，绕过 TanStack Query + Router 依赖
vi.mock('../../../auth', () => ({
  useAuth: () => ({
    logout: vi.fn(),
    isLoggingOut: false,
  }),
  useCurrentUser: () => null,
  getAccessToken: () => null,
  requireAuth: () => {},
  ANONYMOUS: {},
}));

// ---- Fixtures ----

const CURRENT_USER = {
  isAuthenticated: true,
  userId: 1,
  username: 'test-user',
  deptId: null,
  email: null,
  permissions: new Set() as ReadonlySet<never>,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
} as const;

/** 构造最小 MenuNode */
function makeNode(id: number, name: string, children: MenuNode[] = []): MenuNode {
  return {
    id,
    parentId: null,
    name,
    permissionCode: null,
    menuType: 'MENU',
    icon: null,
    sortOrder: id,
    visible: true,
    children,
  };
}

/** 3 个顶层模块，每个有 2 个子菜单 */
const MENU_TREE: MenuNode[] = [
  makeNode(1, '工作台', [makeNode(11, '概览'), makeNode(12, '数据')]),
  makeNode(2, '用户管理', [makeNode(21, '用户列表'), makeNode(22, '角色管理')]),
  makeNode(3, '系统配置', [makeNode(31, '基础设置'), makeNode(32, '权限设置')]),
];

// ---- Test Wrapper ----

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <StyleProvider>
        <LayoutPresetProvider>{children}</LayoutPresetProvider>
      </StyleProvider>
    </I18nProvider>
  );
}

function renderMixLayout(menuTree: MenuNode[] = MENU_TREE) {
  return render(
    <AllProviders>
      <MixLayout menuTree={menuTree} currentUser={CURRENT_USER}>
        <div data-testid="content">页面内容</div>
      </MixLayout>
    </AllProviders>,
  );
}

/** 找到汉堡按钮并 click，打开移动端抽屉 */
function openMobileDrawer() {
  // MixHeader 里的汉堡按钮：aria-label = t('sidebar.expand') = '展开侧边栏'
  // 折叠态下 sidebar 底部的展开按钮也叫 '展开侧边栏'，故用 getAllByRole 取 header 里的第一个
  const hamburgers = screen.getAllByRole('button', { name: '展开侧边栏' });
  // header 汉堡按钮始终是 DOM 里第一个同名按钮
  fireEvent.click(hamburgers[0]!);
}

// ---- 每个测试前清理 localStorage ----
beforeEach(() => {
  localStorage.clear();
});

// ---- Tests ----

describe('MixLayout 移动端抽屉', () => {
  it('打开移动端抽屉后，抽屉顶部渲染所有 3 个顶层模块', () => {
    renderMixLayout();
    openMobileDrawer();

    // MixSidebar 里模块切换器的 nav aria-label = '切换模块'
    const switcherNav = screen.getByRole('navigation', { name: '切换模块' });
    const moduleButtons = switcherNav.querySelectorAll('button');
    expect(moduleButtons).toHaveLength(3);

    // 逐一验证模块名
    expect(moduleButtons[0]?.textContent).toContain('工作台');
    expect(moduleButtons[1]?.textContent).toContain('用户管理');
    expect(moduleButtons[2]?.textContent).toContain('系统配置');
  });

  it('移动端点击第 2 个模块后，activeModule 切换，侧栏显示第 2 模块的子菜单', async () => {
    renderMixLayout();
    openMobileDrawer();

    const switcherNav = screen.getByRole('navigation', { name: '切换模块' });
    const moduleButtons = switcherNav.querySelectorAll('button');
    const secondModule = moduleButtons[1];
    expect(secondModule).toBeDefined();

    await act(async () => {
      fireEvent.click(secondModule!);
    });

    // 第 2 个模块的子菜单「用户列表」、「角色管理」应该在侧栏中可见
    expect(screen.getByText('用户列表')).toBeDefined();
    expect(screen.getByText('角色管理')).toBeDefined();
  });

  it('移动端切换模块后，抽屉保持开启（不自动关闭）', async () => {
    renderMixLayout();
    openMobileDrawer();

    const switcherNav = screen.getByRole('navigation', { name: '切换模块' });
    const moduleButtons = switcherNav.querySelectorAll('button');

    await act(async () => {
      fireEvent.click(moduleButtons[1]!);
    });

    // 抽屉仍然存在于 DOM，且模块切换器仍可见
    expect(screen.getByRole('navigation', { name: '切换模块' })).toBeDefined();
  });

  it('折叠态下打开移动端抽屉，aside style.width 使用 var(--sidebar-width) 而非折叠宽度', async () => {
    renderMixLayout();

    // 触发折叠：sidebar 底部的折叠按钮 aria-label = '收起侧边栏'
    const collapseBtn = screen.getByRole('button', { name: '收起侧边栏' });
    await act(async () => {
      fireEvent.click(collapseBtn);
    });

    // 再打开移动端抽屉
    openMobileDrawer();

    // aside 的 style.width 应该是 var(--sidebar-width)，而不是 var(--sidebar-collapsed-width)
    // 对应 MixSidebar 中的逻辑：mobileOpen ? 'var(--sidebar-width)' : collapsed ? '...' : '...'
    const aside = document.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside!.style.width).toBe('var(--sidebar-width)');
  });
});

describe('MixLayout 模块切换器条件渲染', () => {
  it('只有 1 个顶层模块时，不渲染模块切换器 nav', () => {
    const singleModule = [makeNode(1, '工作台', [makeNode(11, '概览')])];
    renderMixLayout(singleModule);
    openMobileDrawer();

    // modules.length <= 1 时不渲染切换器
    const switcherNav = screen.queryByRole('navigation', { name: '切换模块' });
    expect(switcherNav).toBeNull();
  });
});
