import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

describe('Select', () => {
  it('应该渲染选择器触发按钮', () => {
    render(
      <Select>
        <SelectTrigger aria-label="选择">
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">选项 A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeDefined();
  });

  it('触发按钮应该包含主题样式', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('border-input');
    expect(trigger.className).toContain('bg-background');
  });

  it('应该转发 trigger ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('disabled 状态应该禁用', () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveProperty('disabled', true);
  });

  it('应该显示 placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="请选择类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('请选择类型')).toBeDefined();
  });

  it('应该显示已选中的值', () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">选项 A</SelectItem>
          <SelectItem value="b">选项 B</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('选项 A')).toBeDefined();
  });

  it('应该合并自定义 className', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole('combobox').className).toContain('custom-trigger');
  });
});
