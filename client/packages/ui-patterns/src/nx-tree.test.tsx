import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { NxTreeNode } from './nx-tree';
import { NxTree } from './nx-tree';

// ─── 测试数据 ─────────────────────────────────────────

interface MockNode extends NxTreeNode {
  label: string;
  children?: MockNode[];
}

const treeData: MockNode[] = [
  {
    id: '1',
    label: 'Node 1',
    children: [
      { id: '1-1', label: 'Node 1-1', children: [] },
      {
        id: '1-2',
        label: 'Node 1-2',
        children: [{ id: '1-2-1', label: 'Node 1-2-1' }],
      },
    ],
  },
  { id: '2', label: 'Node 2', children: [] },
];

const renderLabel = (node: MockNode, _depth: number) => <span>{node.label}</span>;

// ─── 测试用例 ─────────────────────────────────────────

describe('NxTree', () => {
  it('渲染树结构（2 层嵌套，展开后可见子节点）', () => {
    const expandedIds = new Set(['1']);

    render(
      <NxTree
        data={treeData}
        renderNode={renderLabel}
        expandedIds={expandedIds}
        emptyText="No data"
      />,
    );

    // 顶层节点可见
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();

    // 展开 Node 1 后子节点可见
    expect(screen.getByText('Node 1-1')).toBeInTheDocument();
    expect(screen.getByText('Node 1-2')).toBeInTheDocument();

    // Node 1-2 未展开，深层子节点不可见
    expect(screen.queryByText('Node 1-2-1')).not.toBeInTheDocument();
  });

  it('renderNode 正确接收 node 和 depth 参数', () => {
    const renderFn = vi.fn((node: MockNode, depth: number) => (
      <span>{`${node.label}-d${depth}`}</span>
    ));

    const expandedIds = new Set(['1', '1-2']);

    render(
      <NxTree
        data={treeData}
        renderNode={renderFn}
        expandedIds={expandedIds}
        emptyText="No data"
      />,
    );

    // renderNode 被调用（所有可见节点）
    // 可见：Node 1(d0), Node 1-1(d1), Node 1-2(d1), Node 1-2-1(d2), Node 2(d0)
    expect(renderFn).toHaveBeenCalledTimes(5);

    // 验证 depth 参数
    expect(screen.getByText('Node 1-d0')).toBeInTheDocument();
    expect(screen.getByText('Node 1-1-d1')).toBeInTheDocument();
    expect(screen.getByText('Node 1-2-d1')).toBeInTheDocument();
    expect(screen.getByText('Node 1-2-1-d2')).toBeInTheDocument();
    expect(screen.getByText('Node 2-d0')).toBeInTheDocument();
  });

  it('展开/收起切换触发 onExpandedChange', async () => {
    const user = userEvent.setup();
    const handleExpandedChange = vi.fn();

    render(
      <NxTree
        data={treeData}
        renderNode={renderLabel}
        expandedIds={new Set()}
        onExpandedChange={handleExpandedChange}
        emptyText="No data"
      />,
    );

    // 点击 Node 1 的展开按钮
    // biome-ignore lint/style/noNonNullAssertion: getAllByRole 已保证非空
    const expandBtn = screen.getAllByRole('button', { name: 'Expand' })[0]!;
    await user.click(expandBtn);

    expect(handleExpandedChange).toHaveBeenCalledTimes(1);

    // 应该传入包含 '1' 的新 Set
    const newSet = handleExpandedChange.mock.calls[0]?.[0] as Set<string>;
    expect(newSet.has('1')).toBe(true);
  });

  it('收起已展开节点触发 onExpandedChange（移除 id）', async () => {
    const user = userEvent.setup();
    const handleExpandedChange = vi.fn();

    render(
      <NxTree
        data={treeData}
        renderNode={renderLabel}
        expandedIds={new Set(['1'])}
        onExpandedChange={handleExpandedChange}
        emptyText="No data"
      />,
    );

    // 点击 Node 1 的收起按钮
    const collapseBtn = screen.getByRole('button', { name: 'Collapse' });
    await user.click(collapseBtn);

    expect(handleExpandedChange).toHaveBeenCalledTimes(1);

    const newSet = handleExpandedChange.mock.calls[0]?.[0] as Set<string>;
    expect(newSet.has('1')).toBe(false);
  });

  it('空数据显示 emptyText', () => {
    render(<NxTree data={[]} renderNode={renderLabel} emptyText="No tree data" />);

    expect(screen.getByText('No tree data')).toBeInTheDocument();
    // 不应该渲染 tree role
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });

  it('深层嵌套正确缩进（paddingLeft 与 depth 成正比）', () => {
    const deepData: MockNode[] = [
      {
        id: 'a',
        label: 'Level 0',
        children: [
          {
            id: 'b',
            label: 'Level 1',
            children: [
              {
                id: 'c',
                label: 'Level 2',
                children: [{ id: 'd', label: 'Level 3' }],
              },
            ],
          },
        ],
      },
    ];

    const expandedIds = new Set(['a', 'b', 'c']);

    render(
      <NxTree
        data={deepData}
        renderNode={(node) => <span data-testid={`node-${node.id}`}>{node.label}</span>}
        expandedIds={expandedIds}
        emptyText="No data"
      />,
    );

    // 验证每层的 paddingLeft
    const nodeA = screen.getByTestId('node-a').closest('.flex') as HTMLElement;
    const nodeB = screen.getByTestId('node-b').closest('.flex') as HTMLElement;
    const nodeC = screen.getByTestId('node-c').closest('.flex') as HTMLElement;
    const nodeD = screen.getByTestId('node-d').closest('.flex') as HTMLElement;

    expect(nodeA.style.paddingLeft).toBe('0px');
    expect(nodeB.style.paddingLeft).toBe('24px');
    expect(nodeC.style.paddingLeft).toBe('48px');
    expect(nodeD.style.paddingLeft).toBe('72px');
  });

  it('叶子节点不显示展开/收起按钮', () => {
    render(
      <NxTree
        data={[{ id: 'leaf', label: 'Leaf Node' }]}
        renderNode={renderLabel}
        expandedIds={new Set()}
        emptyText="No data"
      />,
    );

    expect(screen.getByText('Leaf Node')).toBeInTheDocument();
    // 叶子节点无展开按钮
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
