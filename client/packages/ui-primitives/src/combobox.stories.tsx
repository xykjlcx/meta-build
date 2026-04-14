import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox } from './combobox';

const meta = {
  title: 'Primitives/Combobox',
  component: Combobox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
];

export const Default: Story = {
  args: {
    options: frameworks,
    placeholder: '选择框架...',
    searchPlaceholder: '搜索框架...',
    emptyText: '未找到框架',
  },
};

export const WithValue: Story = {
  args: {
    options: frameworks,
    value: 'react',
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="space-y-2">
        <Combobox
          options={frameworks}
          value={value}
          onValueChange={setValue}
          placeholder="选择框架..."
          searchPlaceholder="搜索框架..."
          emptyText="未找到框架"
          className="w-[200px]"
        />
        <p className="text-sm text-muted-foreground">当前值: {value || '无'}</p>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    options: frameworks,
    disabled: true,
    placeholder: '不可选择',
  },
};
