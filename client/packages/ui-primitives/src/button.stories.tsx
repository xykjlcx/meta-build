import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: '默认按钮' } };
export const Destructive: Story = {
  args: { variant: 'destructive', children: '危险操作' },
};
export const Outline: Story = {
  args: { variant: 'outline', children: '描边按钮' },
};
export const Secondary: Story = {
  args: { variant: 'secondary', children: '次要按钮' },
};
export const Ghost: Story = {
  args: { variant: 'ghost', children: '幽灵按钮' },
};
export const Link: Story = {
  args: { variant: 'link', children: '链接按钮' },
};
export const Small: Story = { args: { size: 'sm', children: '小按钮' } };
export const Large: Story = { args: { size: 'lg', children: '大按钮' } };
export const IconOnly: Story = {
  args: { size: 'icon', 'aria-label': '设置', children: '⚙' },
};
export const Disabled: Story = {
  args: { disabled: true, children: '禁用按钮' },
};
