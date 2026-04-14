import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

describe('Popover', () => {
  it('应该渲染触发按钮', () => {
    render(
      <Popover>
        <PopoverTrigger>点击</PopoverTrigger>
        <PopoverContent>弹出内容</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('点击')).toBeDefined();
  });

  it('点击触发按钮应该显示弹出内容', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>点击</PopoverTrigger>
        <PopoverContent>弹出内容</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByText('点击'));
    expect(screen.getByText('弹出内容')).toBeDefined();
  });

  it('PopoverContent 应该包含语义化 token 样式', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>点击</PopoverTrigger>
        <PopoverContent>样式测试</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByText('点击'));
    const content = screen.getByText('样式测试');
    expect(content.className).toContain('bg-popover');
    expect(content.className).toContain('text-popover-foreground');
  });

  it('应该合并自定义 className', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>点击</PopoverTrigger>
        <PopoverContent className="custom-popover">内容</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByText('点击'));
    expect(screen.getByText('内容').className).toContain('custom-popover');
  });

  it('应该包含动画类', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>点击</PopoverTrigger>
        <PopoverContent>动画内容</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByText('点击'));
    const content = screen.getByText('动画内容');
    expect(content.className).toContain('data-[state=open]:animate-in');
  });

  it('defaultOpen 应该直接显示内容', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>触发</PopoverTrigger>
        <PopoverContent>默认显示</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText('默认显示')).toBeDefined();
  });
});
