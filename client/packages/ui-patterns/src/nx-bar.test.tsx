import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NxBar } from './nx-bar';

describe('NxBar', () => {
  it('selectedCount=0 时不渲染', () => {
    const { container } = render(
      <NxBar selectedCount={0} selectedTemplate="{count} selected" actions={null} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('selectedCount>0 时显示文案（template 中 {count} 被替换）', () => {
    render(
      <NxBar selectedCount={5} selectedTemplate="已选择 {count} 项" actions={null} />,
    );
    expect(screen.getByText('已选择 5 项')).toBeDefined();
  });

  it('点击清除按钮触发 onClear 回调', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <NxBar
        selectedCount={3}
        selectedTemplate="{count} selected"
        actions={null}
        onClear={onClear}
        clearLabel="清除"
      />,
    );
    await user.click(screen.getByRole('button', { name: '清除' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('actions slot 正确渲染', () => {
    render(
      <NxBar
        selectedCount={2}
        selectedTemplate="{count} selected"
        actions={<button type="button">批量删除</button>}
      />,
    );
    expect(screen.getByRole('button', { name: '批量删除' })).toBeDefined();
  });

  it('fixed=true 时包含 fixed class', () => {
    const { container } = render(
      <NxBar
        selectedCount={1}
        selectedTemplate="{count} selected"
        actions={null}
        fixed
      />,
    );
    const bar = container.firstElementChild!;
    expect(bar.className).toContain('fixed');
  });
});
