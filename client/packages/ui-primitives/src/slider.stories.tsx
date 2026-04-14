import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './slider';

const meta = {
  title: 'Primitives/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: [50], max: 100, step: 1 },
};
export const WithRange: Story = {
  args: { defaultValue: [25], max: 100, min: 0, step: 5 },
};
export const Disabled: Story = {
  args: { defaultValue: [30], disabled: true },
};
