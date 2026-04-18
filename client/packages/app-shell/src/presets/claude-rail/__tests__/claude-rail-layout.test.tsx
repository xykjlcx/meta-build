import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __testPathname, renderWithShell } from '../../__tests__/test-utils';
import { ClaudeRailLayout } from '../claude-rail-layout';

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

describe('ClaudeRailLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders narrow rail sidebar (w-16) with icon-only items and bg-blobs', () => {
    renderWithShell('/system/members', ClaudeRailLayout);

    // HeaderTab 仍然存在（rail 保留模块切换）
    expect(screen.getByRole('tab', { name: '组织管理' })).toBeInTheDocument();

    // Sidebar：关键视觉 aside.w-16（窄轨道）
    const aside = screen.getByRole('complementary');
    expect(aside.className).toMatch(/w-16/);

    // rail 模式下菜单只展示图标，label 通过 Tooltip 暴露（不直接在 DOM 文本里）
    expect(screen.queryByText('成员与部门')).not.toBeInTheDocument();

    // 但 aria-label 携带 name，供屏幕阅读器
    expect(screen.getByRole('link', { name: '成员与部门' })).toBeInTheDocument();

    // bg-blobs 装饰仍然存在
    expect(screen.getByTestId('bg-blobs')).toBeInTheDocument();
  });
});
