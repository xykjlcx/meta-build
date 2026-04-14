import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('应该渲染开关', () => {
    render(<Switch aria-label="切换" />);
    expect(screen.getByRole('switch')).toBeDefined();
  });

  it('应该应用默认样式类', () => {
    render(<Switch aria-label="切换" />);
    const sw = screen.getByRole('switch');
    expect(sw.className).toContain('rounded-full');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Switch ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('应该响应 onCheckedChange', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch aria-label="切换" onCheckedChange={onCheckedChange} />,
    );
    await userEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('disabled 状态应该禁用', () => {
    render(<Switch disabled aria-label="禁用" />);
    expect(screen.getByRole('switch')).toHaveProperty('disabled', true);
  });

  it('应该支持受控 checked 状态', () => {
    render(<Switch checked aria-label="已开启" />);
    expect(
      screen.getByRole('switch').getAttribute('data-state'),
    ).toBe('checked');
  });

  it('未选中时应显示 unchecked 状态', () => {
    render(<Switch checked={false} aria-label="已关闭" />);
    expect(
      screen.getByRole('switch').getAttribute('data-state'),
    ).toBe('unchecked');
  });
});
