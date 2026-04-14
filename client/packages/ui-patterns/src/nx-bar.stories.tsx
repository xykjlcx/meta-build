import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@mb/ui-primitives';
import { NxBar } from './nx-bar';

const meta = {
  title: 'Patterns/NxBar',
  component: NxBar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof NxBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedCount: 3,
    selectedTemplate: '已选择 {count} 项',
    actions: null,
    onClear: () => {},
    clearLabel: '清除',
  },
};

export const WithActions: Story = {
  args: {
    selectedCount: 5,
    selectedTemplate: '{count} items selected',
    actions: null,
    onClear: () => {},
    clearLabel: 'Clear',
  },
  render: (args) => (
    <NxBar
      {...args}
      actions={
        <>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </>
      }
    />
  ),
};

export const Fixed: Story = {
  args: {
    selectedCount: 2,
    selectedTemplate: '已选择 {count} 项',
    actions: null,
    fixed: true,
    onClear: () => {},
    clearLabel: '清除',
  },
  render: (args) => (
    <NxBar
      {...args}
      actions={
        <Button variant="outline" size="sm">
          Export
        </Button>
      }
    />
  ),
};

export const NoSelection: Story = {
  args: {
    selectedCount: 0,
    selectedTemplate: '{count} selected',
    actions: null,
  },
};
