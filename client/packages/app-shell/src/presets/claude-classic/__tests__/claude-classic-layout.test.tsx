import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __testPathname, renderWithShell } from '../../__tests__/test-utils';
import { ClaudeClassicLayout } from '../claude-classic-layout';

// mock useAuth，绕过 TanStack Query 依赖
vi.mock('../../../auth', async () => {
  const actual = await vi.importActual<typeof import('../../../auth')>('../../../auth');
  return {
    ...actual,
    useAuth: () => ({
      logout: vi.fn(),
      isLoggingOut: false,
    }),
  };
});

// mock 整个 TanStack Router 模块，避免在测试里搭 Router 实例
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: __testPathname.current } }),
  // biome-ignore lint/suspicious/noExplicitAny: mock 组件不需要强类型
  Link: ({ children, to, ...rest }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...rest}>
      {children}
    </a>
  ),
}));

describe('ClaudeClassicLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders topbar (brand), HeaderTabs, sidebar and main region', () => {
    renderWithShell('/system/members', ClaudeClassicLayout);

    // 品牌文字
    expect(screen.getByText(/meta-build/i)).toBeInTheDocument();

    // HeaderTab 3 个顶层模块
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '内容' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '产品设置' })).toBeInTheDocument();

    // 九宫格 systems switcher（sampleSystems 有 1 条，aria-label = '切换系统' / 'Systems'）
    expect(screen.getByRole('button', { name: /切换系统|Systems/i })).toBeInTheDocument();

    // Sidebar（在 /system/members 下激活的是组织管理，子菜单 = 成员与部门 / 角色管理）
    expect(screen.getByText('成员与部门')).toBeInTheDocument();
    expect(screen.getByText('角色管理')).toBeInTheDocument();

    // 主内容区
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('filters sidebar by active module（切 Tab 后 Sidebar 随之变化）', async () => {
    renderWithShell('/system/members', ClaudeClassicLayout);

    // 初始在组织管理 → 看到"成员与部门"，看不到"公告管理"
    expect(screen.getByText('成员与部门')).toBeInTheDocument();
    expect(screen.queryByText('公告管理')).not.toBeInTheDocument();

    // 点击"内容" tab
    fireEvent.click(screen.getByRole('tab', { name: '内容' }));

    // Sidebar 切到内容模块 → 显示"公告管理"，不再显示"成员与部门"
    expect(await screen.findByText('公告管理')).toBeInTheDocument();
    expect(screen.queryByText('成员与部门')).not.toBeInTheDocument();
  });

  it('picks active module from URL on initial render', () => {
    renderWithShell('/notices', ClaudeClassicLayout);

    // URL /notices 对应 id=21（父节点 id=2 "内容"）
    expect(screen.getByRole('tab', { name: '内容' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '组织管理' })).toHaveAttribute('aria-selected', 'false');

    // Sidebar 里应该是内容模块的子菜单
    expect(screen.getByText('公告管理')).toBeInTheDocument();
  });
});
