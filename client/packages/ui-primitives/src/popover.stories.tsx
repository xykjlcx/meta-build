import type { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta = {
  title: 'Primitives/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          打开弹出框
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">尺寸设置</h4>
            <p className="text-sm text-muted-foreground">
              调整组件的宽度和高度。
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
