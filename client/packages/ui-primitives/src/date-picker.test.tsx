import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Calendar, DatePicker } from './date-picker';

describe('Calendar', () => {
  it('应该渲染日历', () => {
    render(<Calendar data-testid="calendar" />);
    expect(screen.getByTestId('calendar')).toBeDefined();
  });

  it('应该应用主题样式', () => {
    render(<Calendar data-testid="calendar" />);
    expect(screen.getByTestId('calendar').className).toContain('p-3');
  });
});

describe('DatePicker', () => {
  it('应该渲染日期选择器触发按钮', () => {
    render(<DatePicker placeholder="选择日期" />);
    const trigger = screen.getByRole('button');
    expect(trigger).toBeDefined();
    expect(screen.getByText('选择日期')).toBeDefined();
  });

  it('应该显示已选中的日期', () => {
    const date = new Date(2026, 0, 15);
    render(<DatePicker value={date} />);
    // 中文日期格式化 2026/01/15
    expect(screen.getByText('2026/01/15')).toBeDefined();
  });

  it('应该支持自定义格式化', () => {
    const date = new Date(2026, 0, 15);
    render(
      <DatePicker
        value={date}
        formatDate={(d) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
      />,
    );
    expect(screen.getByText('2026-01-15')).toBeDefined();
  });

  it('应该应用主题样式', () => {
    render(<DatePicker placeholder="选择日期" />);
    const trigger = screen.getByRole('button');
    expect(trigger.className).toContain('border-input');
    expect(trigger.className).toContain('bg-background');
  });

  it('disabled 状态应该禁用', () => {
    render(<DatePicker placeholder="选择日期" disabled />);
    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });

  it('未选日期时应该显示 placeholder 样式', () => {
    render(<DatePicker placeholder="请选择" />);
    expect(screen.getByRole('button').className).toContain('text-muted-foreground');
  });

  it('应该合并自定义 className', () => {
    render(<DatePicker placeholder="选择日期" className="custom-picker" />);
    expect(screen.getByRole('button').className).toContain('custom-picker');
  });
});
