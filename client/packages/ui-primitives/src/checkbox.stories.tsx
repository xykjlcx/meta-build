import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { 'aria-label': '复选框' },
};
export const Checked: Story = {
  args: { checked: true, 'aria-label': '已选中' },
};
export const Disabled: Story = {
  args: { disabled: true, 'aria-label': '禁用' },
};
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">我已阅读并同意服务条款</Label>
    </div>
  ),
};
