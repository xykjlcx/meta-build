import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('应该渲染文本输入框', () => {
    render(<Input placeholder="请输入" />);
    const input = screen.getByPlaceholderText('请输入');
    expect(input).toBeDefined();
    expect(input.tagName).toBe('INPUT');
  });

  it('应该应用默认样式类', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input.className).toContain('border-input');
    expect(input.className).toContain('bg-background');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('应该响应 onChange', async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} placeholder="输入" />);
    await userEvent.type(screen.getByPlaceholderText('输入'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('disabled 状态应该禁用输入', () => {
    render(<Input disabled data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveProperty('disabled', true);
  });

  it('应该支持不同 type', () => {
    render(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input').getAttribute('type')).toBe('password');
  });

  it('应该合并自定义 className', () => {
    render(<Input className="custom-class" data-testid="input" />);
    expect(screen.getByTestId('input').className).toContain('custom-class');
  });
});
