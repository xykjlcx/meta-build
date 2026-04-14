import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('应该渲染复选框', () => {
    render(<Checkbox aria-label="同意" />);
    const checkbox = screen.getByRole('checkbox', { name: '同意' });
    expect(checkbox).toBeDefined();
  });

  it('应该应用默认样式类', () => {
    render(<Checkbox aria-label="勾选" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('border-primary');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('应该响应 onCheckedChange', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="勾选" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('disabled 状态应该禁用', () => {
    render(<Checkbox disabled aria-label="禁用" />);
    expect(screen.getByRole('checkbox')).toHaveProperty('disabled', true);
  });

  it('应该支持受控 checked 状态', () => {
    render(<Checkbox checked aria-label="已选" />);
    expect(screen.getByRole('checkbox').getAttribute('data-state')).toBe('checked');
  });

  it('应该合并自定义 className', () => {
    render(<Checkbox className="custom" aria-label="自定义" />);
    expect(screen.getByRole('checkbox').className).toContain('custom');
  });
});
