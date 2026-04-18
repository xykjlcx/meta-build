import { Button } from '@mb/ui-primitives';
import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './page-header';
import { StatusBadge } from './status-badge';

const meta = {
  title: 'Patterns/PageHeader',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: '用户管理',
    description: '管理系统用户、角色分配和重置密码等操作。',
  },
};

export const WithEyebrowAndMeta: Story = {
  args: {
    eyebrow: '系统管理 / 用户',
    title: '用户管理',
    description: '当前页面展示用户列表与基础状态信息。',
    meta: (
      <div className="flex items-center gap-2">
        <StatusBadge tone="active" label="在线" />
        <span className="text-sm text-muted-foreground">最近同步：2026-04-18 10:30</span>
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    title: '公告列表',
    description: '管理公告草稿、发布和撤回。',
    actions: (
      <>
        <Button variant="outline">导出</Button>
        <Button>新建公告</Button>
      </>
    ),
  },
};
