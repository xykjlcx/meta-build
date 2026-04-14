import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Combobox,
} from './combobox';

describe('Command', () => {
  it('应该渲染命令面板', () => {
    render(
      <Command data-testid="cmd">
        <CommandInput placeholder="搜索" />
        <CommandList>
          <CommandEmpty>无结果</CommandEmpty>
          <CommandGroup>
            <CommandItem>选项一</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByTestId('cmd')).toBeDefined();
    expect(screen.getByPlaceholderText('搜索')).toBeDefined();
  });

  it('Command 应该应用主题样式', () => {
    render(<Command data-testid="cmd">内容</Command>);
    expect(screen.getByTestId('cmd').className).toContain('bg-popover');
  });

  it('CommandInput 应该转发 ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(
      <Command>
        <CommandInput ref={ref} />
      </Command>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('Combobox', () => {
  const options = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
  ];

  it('应该渲染下拉触发按钮', () => {
    render(<Combobox options={options} placeholder="选择框架" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDefined();
    expect(screen.getByText('选择框架')).toBeDefined();
  });

  it('应该显示已选中的标签', () => {
    render(<Combobox options={options} value="react" />);
    expect(screen.getByText('React')).toBeDefined();
  });

  it('应该应用主题样式', () => {
    render(<Combobox options={options} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('border-input');
    expect(trigger.className).toContain('bg-background');
  });

  it('disabled 状态应该禁用', () => {
    render(<Combobox options={options} disabled />);
    expect(screen.getByRole('combobox')).toHaveProperty('disabled', true);
  });

  it('应该合并自定义 className', () => {
    render(<Combobox options={options} className="custom-combo" />);
    expect(screen.getByRole('combobox').className).toContain('custom-combo');
  });
});
