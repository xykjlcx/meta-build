import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta = {
  title: 'Primitives/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px]">
      <div className="text-sm font-medium">标题</div>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground">内容区域</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <span>首页</span>
      <Separator orientation="vertical" />
      <span>文档</span>
      <Separator orientation="vertical" />
      <span>源码</span>
    </div>
  ),
};
