import type { Meta, StoryObj } from '@storybook/react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

const meta = {
  title: 'Primitives/Command',
  component: Command,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-[350px] rounded-lg border shadow-md">
      <CommandInput placeholder="输入命令..." />
      <CommandList>
        <CommandEmpty>未找到结果</CommandEmpty>
        <CommandGroup heading="建议">
          <CommandItem>
            日历
            <CommandShortcut>Ctrl+C</CommandShortcut>
          </CommandItem>
          <CommandItem>
            搜索
            <CommandShortcut>Ctrl+F</CommandShortcut>
          </CommandItem>
          <CommandItem>设置</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="操作">
          <CommandItem>新建文件</CommandItem>
          <CommandItem>导出数据</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
