import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from './label';

describe('Label', () => {
  it('应该渲染标签文本', () => {
    render(<Label>用户名</Label>);
    const label = screen.getByText('用户名');
    expect(label).toBeDefined();
    expect(label.tagName).toBe('LABEL');
  });

  it('应该应用默认样式类', () => {
    render(<Label>标签</Label>);
    const label = screen.getByText('标签');
    expect(label.className).toContain('text-sm');
    expect(label.className).toContain('font-medium');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLLabelElement | null };
    render(<Label ref={ref}>标签</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it('应该支持 htmlFor 属性', () => {
    render(<Label htmlFor="email">邮箱</Label>);
    const label = screen.getByText('邮箱');
    expect(label.getAttribute('for')).toBe('email');
  });

  it('应该合并自定义 className', () => {
    render(<Label className="custom-label">标签</Label>);
    expect(screen.getByText('标签').className).toContain('custom-label');
  });
});
