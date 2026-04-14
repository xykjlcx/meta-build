import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('应该渲染文本域', () => {
    render(<Textarea placeholder="请输入内容" />);
    const el = screen.getByPlaceholderText('请输入内容');
    expect(el).toBeDefined();
    expect(el.tagName).toBe('TEXTAREA');
  });

  it('应该应用默认样式类', () => {
    render(<Textarea data-testid="textarea" />);
    const el = screen.getByTestId('textarea');
    expect(el.className).toContain('border-input');
    expect(el.className).toContain('bg-transparent');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('应该响应 onChange', async () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} placeholder="输入" />);
    await userEvent.type(screen.getByPlaceholderText('输入'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('disabled 状态应该禁用输入', () => {
    render(<Textarea disabled data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toHaveProperty('disabled', true);
  });

  it('应该合并自定义 className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />);
    expect(screen.getByTestId('textarea').className).toContain('custom-class');
  });
});
