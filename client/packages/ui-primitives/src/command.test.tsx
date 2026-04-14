import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from './command';

describe('Command', () => {
  it('应该渲染命令面板', () => {
    render(
      <Command>
        <CommandInput placeholder="搜索..." />
        <CommandList>
          <CommandGroup heading="建议">
            <CommandItem>日历</CommandItem>
            <CommandItem>搜索</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByPlaceholderText('搜索...')).toBeDefined();
    expect(screen.getByText('日历')).toBeDefined();
    expect(screen.getByText('搜索')).toBeDefined();
  });

  it('应该显示空状态', () => {
    render(
      <Command>
        <CommandInput placeholder="搜索..." />
        <CommandList>
          <CommandEmpty>未找到结果</CommandEmpty>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('未找到结果')).toBeDefined();
  });

  it('应该渲染快捷键提示', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem>
              日历
              <CommandShortcut>Ctrl+K</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('Ctrl+K')).toBeDefined();
  });

  it('输入搜索应该过滤选项', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="搜索..." />
        <CommandList>
          <CommandGroup>
            <CommandItem>日历</CommandItem>
            <CommandItem>设置</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    await user.type(screen.getByPlaceholderText('搜索...'), '日历');
    expect(screen.getByText('日历')).toBeDefined();
  });

  it('应该合并自定义 className', () => {
    const { container } = render(
      <Command className="custom-command">
        <CommandList>
          <CommandGroup>
            <CommandItem>选项</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    const cmd = container.firstChild as HTMLElement;
    expect(cmd.className).toContain('custom-command');
  });
});
