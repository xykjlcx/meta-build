import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'Primitives/Select',
  component: Select,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="请选择水果" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">苹果</SelectItem>
        <SelectItem value="banana">香蕉</SelectItem>
        <SelectItem value="orange">橙子</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="请选择城市" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>华东</SelectLabel>
          <SelectItem value="shanghai">上海</SelectItem>
          <SelectItem value="hangzhou">杭州</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>华南</SelectLabel>
          <SelectItem value="shenzhen">深圳</SelectItem>
          <SelectItem value="guangzhou">广州</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="不可选择" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">选项</SelectItem>
      </SelectContent>
    </Select>
  ),
};
