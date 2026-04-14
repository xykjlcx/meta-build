import { Input } from '@mb/ui-primitives';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NxFilter, NxFilterField } from './nx-filter';

type Filter = { keyword: string; status: string };

/** 渲染标准测试筛选栏 */
function renderFilter(overrides: Partial<React.ComponentProps<typeof NxFilter<Filter>>> = {}) {
  const onChange = vi.fn();
  const emptyFilter: Filter = { keyword: '', status: '' };
  const result = render(
    <NxFilter<Filter>
      value={overrides.value ?? emptyFilter}
      defaultValue={overrides.defaultValue ?? emptyFilter}
      onChange={overrides.onChange ?? onChange}
      resetLabel="重置"
      applyLabel="查询"
      {...overrides}
    >
      <NxFilterField name="keyword" label="关键词">
        <Input placeholder="请输入关键词" />
      </NxFilterField>
      <NxFilterField name="status" label="状态">
        <Input placeholder="请输入状态" />
      </NxFilterField>
    </NxFilter>,
  );
  return { ...result, onChange };
}

describe('NxFilter', () => {
  it('渲染字段和按钮', () => {
    renderFilter();

    expect(screen.getByText('关键词')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入关键词')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入状态')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查询' })).toBeInTheDocument();
  });

  it('输入后点击查询 → onChange 触发正确值', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilter();

    await user.type(screen.getByPlaceholderText('请输入关键词'), 'hello');
    await user.click(screen.getByRole('button', { name: '查询' }));

    expect(onChange).toHaveBeenCalledWith({ keyword: 'hello', status: '' });
  });

  it('点击重置 → onChange 触发清空值', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilter({
      value: { keyword: 'test', status: 'active' },
    });

    await user.click(screen.getByRole('button', { name: '重置' }));

    expect(onChange).toHaveBeenCalledWith({ keyword: '', status: '' });
  });

  it('多个字段联合筛选', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilter();

    await user.type(screen.getByPlaceholderText('请输入关键词'), 'foo');
    await user.type(screen.getByPlaceholderText('请输入状态'), 'bar');
    await user.click(screen.getByRole('button', { name: '查询' }));

    expect(onChange).toHaveBeenCalledWith({ keyword: 'foo', status: 'bar' });
  });

  it('受控值 value 正确回显到字段', () => {
    renderFilter({ value: { keyword: '已有值', status: '启用' } });

    expect(screen.getByPlaceholderText('请输入关键词')).toHaveValue('已有值');
    expect(screen.getByPlaceholderText('请输入状态')).toHaveValue('启用');
  });

  it('输入不会立即触发 onChange（draft 机制）', async () => {
    const user = userEvent.setup();
    const { onChange } = renderFilter();

    await user.type(screen.getByPlaceholderText('请输入关键词'), 'draft');

    // 还没点查询，onChange 不应被调用
    expect(onChange).not.toHaveBeenCalled();
  });
});
