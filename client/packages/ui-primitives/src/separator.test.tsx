import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from './separator';

describe('Separator', () => {
  it('应该渲染水平分隔线', () => {
    const { container } = render(<Separator />);
    const sep = container.firstChild as HTMLElement;
    expect(sep).toBeDefined();
    expect(sep.className).toContain('h-px');
    expect(sep.className).toContain('w-full');
  });

  it('应该渲染垂直分隔线', () => {
    const { container } = render(<Separator orientation="vertical" />);
    const sep = container.firstChild as HTMLElement;
    expect(sep.className).toContain('h-full');
    expect(sep.className).toContain('w-px');
  });

  it('应该包含 border 背景色', () => {
    const { container } = render(<Separator />);
    const sep = container.firstChild as HTMLElement;
    expect(sep.className).toContain('bg-border');
  });

  it('应该合并自定义 className', () => {
    const { container } = render(<Separator className="custom-sep" />);
    const sep = container.firstChild as HTMLElement;
    expect(sep.className).toContain('custom-sep');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('默认应该是装饰性的', () => {
    const { container } = render(<Separator />);
    const sep = container.firstChild as HTMLElement;
    expect(sep.getAttribute('role')).toBe('none');
  });
});
