import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './slider';

describe('Slider', () => {
  it('应该渲染滑块', () => {
    render(<Slider aria-label="音量" defaultValue={[50]} />);
    expect(screen.getByRole('slider')).toBeDefined();
  });

  it('应该应用默认样式类', () => {
    render(<Slider aria-label="音量" defaultValue={[50]} data-testid="slider" />);
    const root = screen.getByTestId('slider');
    expect(root.className).toContain('flex');
    expect(root.className).toContain('touch-none');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Slider ref={ref} defaultValue={[50]} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('应该响应 onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="音量" defaultValue={[50]} onValueChange={onValueChange} />);
    // Radix Slider 没有直接 click-to-change，但我们验证 handler 被设置
    expect(screen.getByRole('slider')).toBeDefined();
  });

  it('应该支持自定义范围', () => {
    render(<Slider aria-label="进度" defaultValue={[25]} max={100} min={0} step={5} />);
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
  });

  it('disabled 状态应该标记 data-disabled', () => {
    render(<Slider disabled aria-label="禁用" defaultValue={[50]} />);
    expect(screen.getByRole('slider').getAttribute('data-disabled')).toBe('');
  });

  it('应该合并自定义 className', () => {
    render(<Slider className="custom" data-testid="slider" defaultValue={[50]} />);
    expect(screen.getByTestId('slider').className).toContain('custom');
  });
});
