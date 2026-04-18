import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('应该渲染骨架屏', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeDefined();
  });

  it('应该包含脉冲动画样式', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
  });

  it('应该包含中性骨架底色', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('bg-border/70');
  });

  it('应该包含圆角样式', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-md');
  });

  it('应该合并自定义 className', () => {
    const { container } = render(<Skeleton className="h-4 w-[250px]" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-4');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
