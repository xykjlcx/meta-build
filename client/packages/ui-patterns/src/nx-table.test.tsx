import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import { NxTable } from './nx-table';

// ─── 测试数据 ─────────────────────────────────────────

interface MockData {
  id: string;
  name: string;
  age: number;
}

const columns: ColumnDef<MockData, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
];

const mockData: MockData[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];

// ─── 测试用例 ─────────────────────────────────────────

describe('NxTable', () => {
  it('渲染列头和数据行', () => {
    render(<NxTable data={mockData} columns={columns} getRowId={(r) => r.id} />);

    // 列头
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // 数据行
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('loading 状态渲染 skeleton', () => {
    render(<NxTable data={[]} columns={columns} loading />);

    // 不应该显示数据
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();

    // skeleton 元素应该存在（通过 data-slot 查找）
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('empty 状态渲染 emptyText', () => {
    render(<NxTable data={[]} columns={columns} emptyText="No records found" />);

    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('onRowClick 触发（点击行）', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    render(
      <NxTable
        data={mockData}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={handleRowClick}
      />,
    );

    await user.click(screen.getByText('Alice'));

    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('分页显示 + onPaginationChange 回调', async () => {
    const user = userEvent.setup();
    const handlePaginationChange = vi.fn();

    render(
      <NxTable
        data={mockData}
        columns={columns}
        getRowId={(r) => r.id}
        pagination={{ page: 1, size: 10, totalElements: 25, totalPages: 3 }}
        onPaginationChange={handlePaginationChange}
      />,
    );

    // 显示分页信息
    expect(screen.getByText('25 items, page 1 / 3')).toBeInTheDocument();

    // Previous 按钮应该被禁用（第 1 页）
    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    expect(prevBtn).toBeDisabled();

    // 点击 Next
    const nextBtn = screen.getByRole('button', { name: 'Next' });
    await user.click(nextBtn);

    expect(handlePaginationChange).toHaveBeenCalledWith({
      page: 2,
      size: 10,
      totalElements: 25,
      totalPages: 3,
    });
  });

  it('排序 + onSortingChange 回调', async () => {
    const user = userEvent.setup();
    const handleSortingChange = vi.fn();

    render(
      <NxTable
        data={mockData}
        columns={columns}
        getRowId={(r) => r.id}
        sorting={[]}
        onSortingChange={handleSortingChange}
      />,
    );

    // 点击 Name 列头触发排序
    await user.click(screen.getByText('Name'));

    expect(handleSortingChange).toHaveBeenCalledTimes(1);
    // TanStack Table 的默认行为：第一次点击 → asc
    expect(handleSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
  });

  it('行选择 + onRowSelectionChange 回调', async () => {
    const user = userEvent.setup();
    const handleRowSelectionChange = vi.fn();

    render(
      <NxTable
        data={mockData}
        columns={columns}
        getRowId={(r) => r.id}
        rowSelection={{}}
        onRowSelectionChange={handleRowSelectionChange}
      />,
    );

    // checkbox 应该存在（checkbox 列 + 每行一个 = 3 个）
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3); // 全选 + 2 行

    // 点击第一行的 checkbox（index 1，0 是全选）
    await user.click(checkboxes[1]!);

    expect(handleRowSelectionChange).toHaveBeenCalled();
  });

  it('最后一页 Next 按钮被禁用', () => {
    render(
      <NxTable
        data={mockData}
        columns={columns}
        getRowId={(r) => r.id}
        pagination={{ page: 3, size: 10, totalElements: 25, totalPages: 3 }}
      />,
    );

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    expect(nextBtn).toBeDisabled();

    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    expect(prevBtn).not.toBeDisabled();
  });
});
