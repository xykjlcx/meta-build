import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: '请输入内容...' },
};
export const WithValue: Story = {
  args: { defaultValue: '已有内容' },
};
export const Password: Story = {
  args: { type: 'password', placeholder: '请输入密码' },
};
export const Disabled: Story = {
  args: { disabled: true, placeholder: '不可编辑', defaultValue: '禁用状态' },
};
export const File: Story = {
  args: { type: 'file' },
};
