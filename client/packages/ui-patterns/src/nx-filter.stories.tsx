import { Input } from '@mb/ui-primitives';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NxFilter, NxFilterField } from './nx-filter';

const meta = {
  title: 'Patterns/NxFilter',
  component: NxFilter,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof NxFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    value: { keyword: '' },
    onChange: () => {},
    resetLabel: '重置',
    applyLabel: '查询',
    children: null,
  },
  render: () => {
    const [filter, setFilter] = useState({ keyword: '' });
    return (
      <div className="space-y-4">
        <NxFilter value={filter} onChange={setFilter} resetLabel="重置" applyLabel="查询">
          <NxFilterField name="keyword" label="关键词">
            <Input placeholder="请输入关键词" />
          </NxFilterField>
        </NxFilter>
        <pre className="text-sm text-muted-foreground">{JSON.stringify(filter, null, 2)}</pre>
      </div>
    );
  },
};

export const WithMultipleFields: Story = {
  args: {
    ...Default.args,
  },
  render: () => {
    const [filter, setFilter] = useState({
      name: '',
      email: '',
      phone: '',
    });
    return (
      <div className="space-y-4">
        <NxFilter value={filter} onChange={setFilter} resetLabel="重置" applyLabel="查询">
          <NxFilterField name="name" label="姓名">
            <Input placeholder="请输入姓名" />
          </NxFilterField>
          <NxFilterField name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </NxFilterField>
          <NxFilterField name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </NxFilterField>
        </NxFilter>
        <pre className="text-sm text-muted-foreground">{JSON.stringify(filter, null, 2)}</pre>
      </div>
    );
  },
};

export const Reset: Story = {
  args: {
    ...Default.args,
  },
  render: () => {
    const [filter, setFilter] = useState({
      keyword: '预设值',
      status: '启用',
    });
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">点击重置按钮清空所有筛选条件</p>
        <NxFilter value={filter} onChange={setFilter} resetLabel="重置" applyLabel="查询">
          <NxFilterField name="keyword" label="关键词">
            <Input placeholder="请输入关键词" />
          </NxFilterField>
          <NxFilterField name="status" label="状态">
            <Input placeholder="请输入状态" />
          </NxFilterField>
        </NxFilter>
        <pre className="text-sm text-muted-foreground">{JSON.stringify(filter, null, 2)}</pre>
      </div>
    );
  },
};
