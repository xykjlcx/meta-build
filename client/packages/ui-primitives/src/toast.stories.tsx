import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './toast';
import { toast } from './use-toast';

const meta = {
  title: 'Primitives/Toast',
  component: Toaster,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
        <Toaster />
      </div>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <button
      type="button"
      className="rounded-md border px-4 py-2 text-sm"
      onClick={() => {
        toast({
          title: '操作成功',
          description: '您的更改已保存。',
        });
      }}
    >
      显示 Toast
    </button>
  ),
};

export const Destructive: Story = {
  render: () => (
    <button
      type="button"
      className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive"
      onClick={() => {
        toast({
          variant: 'destructive',
          title: '操作失败',
          description: '请检查输入后重试。',
        });
      }}
    >
      显示错误 Toast
    </button>
  ),
};
