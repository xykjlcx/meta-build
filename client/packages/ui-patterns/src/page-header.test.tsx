import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('应该渲染一级标题', () => {
    render(<PageHeader title="用户管理" />);
    expect(screen.getByRole('heading', { level: 1, name: '用户管理' })).toBeDefined();
  });

  it('应该按需渲染 eyebrow、description 和 meta', () => {
    render(
      <PageHeader
        eyebrow="系统管理 / 用户"
        title="用户管理"
        description="管理用户基础资料"
        meta={<span>共 12 条</span>}
      />,
    );

    expect(screen.getByText('系统管理 / 用户')).toBeDefined();
    expect(screen.getByText('管理用户基础资料')).toBeDefined();
    expect(screen.getByText('共 12 条')).toBeDefined();
  });

  it('应该按需渲染右侧 actions 区域', () => {
    render(<PageHeader title="公告管理" actions={<button type="button">新建</button>} />);
    expect(screen.getByRole('button', { name: '新建' })).toBeDefined();
  });

  it('不传可选内容时不应该渲染多余节点', () => {
    const { container } = render(<PageHeader title="仪表盘" />);
    expect(container.querySelector('p')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('应该合并自定义 className', () => {
    const { container } = render(<PageHeader title="设置" className="custom-page-header" />);
    const header = container.querySelector('[data-slot="page-header"]');
    expect(header?.className).toContain('custom-page-header');
  });
});
