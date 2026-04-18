import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __testPathname, renderWithShell } from '../../__tests__/test-utils';
import { ClaudeInsetLayout } from '../claude-inset-layout';

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

describe('ClaudeInsetLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders topbar, sidebar, main with inset card wrapper + bg-blobs decoration', () => {
    renderWithShell('/system/members', ClaudeInsetLayout);

    // 顶层基本结构
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();
    expect(screen.getByText('成员与部门')).toBeInTheDocument();

    // 关键视觉：main 区域带 rounded-xl + border + shadow-sm（内嵌白卡片）
    const main = screen.getByRole('main');
    expect(main.className).toMatch(/rounded-xl/);
    expect(main.className).toMatch(/border/);
    expect(main.className).toMatch(/shadow-sm/);

    // bg-blobs 装饰元素存在
    expect(screen.getByTestId('bg-blobs')).toBeInTheDocument();
  });
});
