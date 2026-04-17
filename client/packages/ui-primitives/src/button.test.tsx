import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('应该渲染默认 variant', () => {
    render(<Button>点我</Button>);
    const btn = screen.getByRole('button', { name: '点我' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('bg-primary');
  });

  it('应该应用 destructive variant', () => {
    render(<Button variant="destructive">删除</Button>);
    expect(screen.getByRole('button').className).toContain('bg-destructive');
  });

  it('应该应用 outline variant', () => {
    render(<Button variant="outline">描边</Button>);
    // 改用 border-strong token 后，class 名为 border-[var(--color-border-strong)]
    expect(screen.getByRole('button').className).toContain('border-[var(--color-border-strong)]');
  });

  it('应该应用 sm 尺寸', () => {
    render(<Button size="sm">小按钮</Button>);
    // 改用 control-height token 后，class 名为 h-[var(--size-control-height-sm)]
    expect(screen.getByRole('button').className).toContain('h-[var(--size-control-height-sm)]');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>带 ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('应该响应 onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>点击</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('asChild 模式应该渲染为子元素', () => {
    render(
      <Button asChild>
        <a href="/test">链接按钮</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: '链接按钮' });
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('bg-primary');
  });

  it('传入 type 时应该正确设置', () => {
    render(<Button type="submit">提交按钮</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('disabled 状态应该包含 disabled 样式', () => {
    render(<Button disabled>禁用</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('disabled:opacity-50');
    expect(btn).toHaveProperty('disabled', true);
  });
});
