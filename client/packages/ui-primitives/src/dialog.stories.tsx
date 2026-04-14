import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta = {
  title: 'Primitives/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          打开对话框
        </button>
      </DialogTrigger>
      <DialogContent closeLabel="关闭">
        <DialogHeader>
          <DialogTitle>编辑个人信息</DialogTitle>
          <DialogDescription>
            修改您的个人信息，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">对话框内容区域</div>
        <DialogFooter>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
