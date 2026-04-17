import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './status-badge';
import type { StatusTone } from './status-badge';

const meta = {
  title: 'Patterns/StatusBadge',
  component: StatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 默认态：7 种 tone 全部展示 */
export const AllTones: Story = {
  args: { tone: 'active' },
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(['active', 'pending', 'disabled', 'low', 'medium', 'high', 'neutral'] as StatusTone[]).map(
        (tone) => (
          <StatusBadge key={tone} tone={tone} />
        ),
      )}
    </div>
  ),
};

/** 使用自定义 label（调用方 i18n 场景） */
export const CustomLabel: Story = {
  args: {
    tone: 'active',
    label: 'Active',
  },
};

/** active — 成功软色 */
export const Active: Story = {
  args: { tone: 'active' },
};

/** pending — 警告软色 */
export const Pending: Story = {
  args: { tone: 'pending' },
};

/** disabled — 破坏性软色 */
export const Disabled: Story = {
  args: { tone: 'disabled' },
};

/** low — 低严重度（neutral 灰色） */
export const Low: Story = {
  args: { tone: 'low' },
};

/** medium — 中严重度（警告软色） */
export const Medium: Story = {
  args: { tone: 'medium' },
};

/** high — 高严重度（破坏性软色） */
export const High: Story = {
  args: { tone: 'high' },
};

/** neutral — 通用中性档 */
export const Neutral: Story = {
  args: { tone: 'neutral' },
};
