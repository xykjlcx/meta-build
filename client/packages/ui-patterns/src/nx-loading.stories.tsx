import type { Meta, StoryObj } from '@storybook/react';
import { NxLoading } from './nx-loading';

const meta = {
  title: 'Patterns/NxLoading',
  component: NxLoading,
  args: {
    loadingText: '加载中...',
    errorText: '加载失败',
    emptyText: '暂无数据',
    retryLabel: '重试',
  },
} satisfies Meta<typeof NxLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <p>内容已加载</p> },
};

export const Loading: Story = {
  args: { loading: true, variant: 'skeleton' },
};

export const Spinner: Story = {
  args: { loading: true, variant: 'spinner' },
};

export const SkeletonTable: Story = {
  args: { loading: true, variant: 'skeleton-table', rows: 5 },
};

export const SkeletonDetail: Story = {
  args: { loading: true, variant: 'skeleton-detail', rows: 5 },
};

export const ErrorState: Story = {
  args: { error: new globalThis.Error('fail'), onRetry: () => alert('重试') },
};

export const Empty: Story = {
  args: { empty: true },
};
