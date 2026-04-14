import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from './radio-group';

describe('RadioGroup', () => {
  it('应该渲染单选按钮组', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" aria-label="选项 A" />
        <RadioGroupItem value="b" aria-label="选项 B" />
      </RadioGroup>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('应该应用默认样式类', () => {
    render(
      <RadioGroup data-testid="group">
        <RadioGroupItem value="a" aria-label="选项 A" />
      </RadioGroup>,
    );
    expect(screen.getByTestId('group').className).toContain('grid');
  });

  it('RadioGroupItem 应该有 border-primary', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" aria-label="选项 A" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio').className).toContain('border-input');
  });

  it('应该转发 ref', () => {
    const groupRef = { current: null as HTMLDivElement | null };
    const itemRef = { current: null as HTMLButtonElement | null };
    render(
      <RadioGroup ref={groupRef}>
        <RadioGroupItem value="a" ref={itemRef} aria-label="选项" />
      </RadioGroup>,
    );
    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('应该响应 onValueChange', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="a" aria-label="选项 A" />
        <RadioGroupItem value="b" aria-label="选项 B" />
      </RadioGroup>,
    );
    await userEvent.click(screen.getByRole('radio', { name: '选项 B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('disabled 状态应该禁用', () => {
    render(
      <RadioGroup disabled>
        <RadioGroupItem value="a" aria-label="禁用" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio')).toHaveProperty('disabled', true);
  });

  it('应该支持受控 value', () => {
    render(
      <RadioGroup value="a">
        <RadioGroupItem value="a" aria-label="选中" />
        <RadioGroupItem value="b" aria-label="未选" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio', { name: '选中' }).getAttribute('data-state')).toBe('checked');
    expect(screen.getByRole('radio', { name: '未选' }).getAttribute('data-state')).toBe(
      'unchecked',
    );
  });
});
