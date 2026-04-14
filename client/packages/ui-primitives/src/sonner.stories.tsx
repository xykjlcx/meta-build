import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Toaster } from './sonner';

const meta = {
  title: 'Primitives/Sonner',
  component: Toaster,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div>
      <Toaster />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => toast('默认提示')}
        >
          默认 Toast
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => toast.success('操作成功')}
        >
          成功 Toast
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => toast.error('操作失败')}
        >
          错误 Toast
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => toast.warning('注意事项')}
        >
          警告 Toast
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => toast.info('提示信息')}
        >
          信息 Toast
        </button>
      </div>
    </div>
  ),
};
