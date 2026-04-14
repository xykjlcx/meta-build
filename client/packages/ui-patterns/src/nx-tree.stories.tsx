import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { NxTreeNode } from './nx-tree';
import { NxTree } from './nx-tree';

// ─── 测试数据 ─────────────────────────────────────────

interface DemoNode extends NxTreeNode {
  label: string;
  children?: DemoNode[];
}

const sampleData: DemoNode[] = [
  {
    id: 'dept-1',
    label: 'Engineering',
    children: [
      {
        id: 'dept-1-1',
        label: 'Frontend',
        children: [
          { id: 'user-1', label: 'Alice' },
          { id: 'user-2', label: 'Bob' },
        ],
      },
      {
        id: 'dept-1-2',
        label: 'Backend',
        children: [
          { id: 'user-3', label: 'Carol' },
          { id: 'user-4', label: 'Dave' },
        ],
      },
    ],
  },
  {
    id: 'dept-2',
    label: 'Design',
    children: [
      { id: 'user-5', label: 'Eve' },
      { id: 'user-6', label: 'Frank' },
    ],
  },
  { id: 'dept-3', label: 'Marketing' },
];

const deepData: DemoNode[] = [
  {
    id: 'l0',
    label: 'Level 0',
    children: [
      {
        id: 'l1',
        label: 'Level 1',
        children: [
          {
            id: 'l2',
            label: 'Level 2',
            children: [
              {
                id: 'l3',
                label: 'Level 3',
                children: [
                  {
                    id: 'l4',
                    label: 'Level 4',
                    children: [{ id: 'l5', label: 'Level 5 (leaf)' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ─── Meta ─────────────────────────────────────────────

const meta: Meta<typeof NxTree<DemoNode>> = {
  title: 'L3/NxTree',
  component: NxTree,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof NxTree<DemoNode>>;

// ─── Stories ──────────────────────────────────────────

/** 默认用法：展开/收起交互 */
export const Default: Story = {
  render: () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['dept-1']));

    return (
      <NxTree
        data={sampleData}
        renderNode={(node) => <span className="text-sm">{node.label}</span>}
        expandedIds={expandedIds}
        onExpandedChange={setExpandedIds}
        emptyText="No data"
      />
    );
  },
};

/** 空状态 */
export const Empty: Story = {
  render: () => (
    <NxTree
      data={[]}
      renderNode={(node: DemoNode) => <span>{node.label}</span>}
      emptyText="No departments found"
    />
  ),
};

/** 深层嵌套（6 层） */
export const DeepNested: Story = {
  render: () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(
      new Set(['l0', 'l1', 'l2', 'l3', 'l4']),
    );

    return (
      <NxTree
        data={deepData}
        renderNode={(node, depth) => (
          <span className="text-sm">
            {node.label} <span className="text-xs text-muted-foreground">(depth: {depth})</span>
          </span>
        )}
        expandedIds={expandedIds}
        onExpandedChange={setExpandedIds}
        emptyText="No data"
      />
    );
  },
};
