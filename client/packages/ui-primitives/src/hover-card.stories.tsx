import type { Meta, StoryObj } from '@storybook/react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

const meta = {
  title: 'Primitives/HoverCard',
  component: HoverCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#" className="text-sm underline">
          @用户名
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">用户名</h4>
          <p className="text-sm text-muted-foreground">
            全栈开发者，专注于 React 和 TypeScript。
          </p>
          <p className="text-xs text-muted-foreground">已加入 2024 年 1 月</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
