import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

describe('DropdownMenu', () => {
  it('应该渲染触发按钮', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>选项一</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByText('打开菜单')).toBeDefined();
  });

  it('点击触发按钮应该显示菜单内容', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>选项一</DropdownMenuItem>
          <DropdownMenuItem>选项二</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('打开菜单'));
    expect(screen.getByText('选项一')).toBeDefined();
    expect(screen.getByText('选项二')).toBeDefined();
    expect(screen.getByText('操作')).toBeDefined();
  });

  it('点击菜单项应该触发 onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onSelect}>选项一</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('打开菜单'));
    await user.click(screen.getByText('选项一'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('DropdownMenuLabel 应该包含正确样式', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>标签</DropdownMenuLabel>
          <DropdownMenuItem>选项</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('打开菜单'));
    expect(screen.getByText('标签').className).toContain('font-semibold');
  });
});
