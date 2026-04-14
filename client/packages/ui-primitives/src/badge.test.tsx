import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('应该渲染默认 variant', () => {
    render(<Badge>标签</Badge>);
    const badge = screen.getByText('标签');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('bg-primary');
  });

  it('应该应用 secondary variant', () => {
    render(<Badge variant="secondary">次要</Badge>);
    expect(screen.getByText('次要').className).toContain('bg-secondary');
  });

  it('应该应用 destructive variant', () => {
    render(<Badge variant="destructive">危险</Badge>);
    expect(screen.getByText('危险').className).toContain('bg-destructive');
  });

  it('应该应用 outline variant', () => {
    render(<Badge variant="outline">描边</Badge>);
    expect(screen.getByText('描边').className).toContain('text-foreground');
  });

  it('应该应用 success variant', () => {
    render(<Badge variant="success">成功</Badge>);
    expect(screen.getByText('成功').className).toContain('bg-success');
  });

  it('应该合并自定义 className', () => {
    render(<Badge className="custom-badge">自定义</Badge>);
    expect(screen.getByText('自定义').className).toContain('custom-badge');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Badge ref={ref}>带 ref</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('应该包含圆角样式', () => {
    render(<Badge>圆角</Badge>);
    expect(screen.getByText('圆角').className).toContain('rounded-full');
  });
});
