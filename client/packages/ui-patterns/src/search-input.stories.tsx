import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './search-input';

const meta = {
  title: 'Patterns/SearchInput',
  component: SearchInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 默认态：无 placeholder，无 shortcut */
export const Default: Story = {
  render: () => <SearchInput className="w-64" />,
};

/** 带 placeholder */
export const WithPlaceholder: Story = {
  render: () => <SearchInput placeholder="搜索用户名..." className="w-64" />,
};

/** 带快捷键提示 ⌘K */
export const WithShortcut: Story = {
  render: () => <SearchInput placeholder="搜索..." shortcut="⌘K" className="w-64" />,
};

/** 禁用态 */
export const Disabled: Story = {
  render: () => <SearchInput placeholder="不可用" disabled className="w-64" />,
};

/** 全宽（列表页筛选栏典型用法） */
export const FullWidth: Story = {
  render: () => (
    <div className="w-96">
      <SearchInput placeholder="搜索..." shortcut="⌘K" className="w-full" />
    </div>
  ),
};
