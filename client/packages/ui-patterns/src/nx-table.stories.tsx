import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import type { NxTablePagination } from './nx-table';
import type { SortingState, RowSelectionState } from '@tanstack/react-table';
import { NxTable } from './nx-table';

// ─── 测试数据 ─────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number;
}

const sampleData: User[] = [
  { id: '1', name: 'Alice Wang', email: 'alice@example.com', role: 'Admin', age: 30 },
  { id: '2', name: 'Bob Li', email: 'bob@example.com', role: 'Editor', age: 25 },
  { id: '3', name: 'Carol Zhang', email: 'carol@example.com', role: 'Viewer', age: 35 },
  { id: '4', name: 'Dave Chen', email: 'dave@example.com', role: 'Editor', age: 28 },
  { id: '5', name: 'Eve Liu', email: 'eve@example.com', role: 'Admin', age: 32 },
];

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'age', header: 'Age' },
];

// ─── Meta ─────────────────────────────────────────────

const meta: Meta<typeof NxTable<User>> = {
  title: 'L3/NxTable',
  component: NxTable,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof NxTable<User>>;

// ─── Stories ──────────────────────────────────────────

/** 基础用法：渲染列头和数据行 */
export const Default: Story = {
  render: () => <NxTable data={sampleData} columns={columns} getRowId={(r) => r.id} />,
};

/** Loading 状态：显示 skeleton 占位 */
export const Loading: Story = {
  render: () => <NxTable data={[]} columns={columns} loading />,
};

/** 空状态：无数据时显示提示 */
export const Empty: Story = {
  render: () => <NxTable data={[]} columns={columns} emptyText="No records found" />,
};

/** 排序：点击列头切换排序方向 */
export const WithSorting: Story = {
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([]);

    return (
      <NxTable
        data={sampleData}
        columns={columns}
        getRowId={(r) => r.id}
        sorting={sorting}
        onSortingChange={setSorting}
      />
    );
  },
};

/** 行选择：checkbox 选择行 */
export const WithSelection: Story = {
  render: () => {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    return (
      <NxTable
        data={sampleData}
        columns={columns}
        getRowId={(r) => r.id}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        batchActions={
          <span className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} selected
          </span>
        }
      />
    );
  },
};

/** 分页：底部分页控件 */
export const WithPagination: Story = {
  render: () => {
    const [pagination, setPagination] = useState<NxTablePagination>({
      page: 1,
      size: 2,
      totalElements: 5,
      totalPages: 3,
    });

    // 简单模拟分页切片
    const start = (pagination.page - 1) * pagination.size;
    const pageData = sampleData.slice(start, start + pagination.size);

    return (
      <NxTable
        data={pageData}
        columns={columns}
        getRowId={(r) => r.id}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    );
  },
};
