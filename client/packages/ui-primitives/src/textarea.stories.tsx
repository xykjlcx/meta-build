import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './textarea';

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: '请输入详细内容...' },
};
export const WithValue: Story = {
  args: { defaultValue: '这是一段已有的文本内容，可以编辑。' },
};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: '不可编辑的内容' },
};
