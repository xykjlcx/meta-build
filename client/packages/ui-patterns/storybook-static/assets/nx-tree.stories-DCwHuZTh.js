import { r as g } from './index-B3e6rcmj.js';
import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { c as L } from './table-BAJRp_jF.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
const R = 24,
  z = new Set();
function B({ expanded: t }) {
  return e.jsx('svg', {
    className: L(
      'size-4 shrink-0 text-muted-foreground transition-transform duration-150',
      t && 'rotate-90',
    ),
    viewBox: '0 0 16 16',
    fill: 'currentColor',
    'aria-hidden': 'true',
    children: e.jsx('path', { d: 'M6 4l4 4-4 4z' }),
  });
}
function _({ node: t, depth: r, expandedIds: a, onToggle: n, renderNode: x }) {
  const m = t.children && t.children.length > 0,
    s = a.has(t.id);
  return e.jsxs('li', {
    role: 'treeitem',
    'aria-expanded': m ? s : void 0,
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-1 py-1',
        style: { paddingLeft: r * R },
        children: [
          m
            ? e.jsx('button', {
                type: 'button',
                className: 'flex size-5 items-center justify-center rounded hover:bg-accent',
                onClick: () => n(t.id),
                'aria-label': s ? 'Collapse' : 'Expand',
                children: e.jsx(B, { expanded: s }),
              })
            : e.jsx('span', { className: 'size-5', 'aria-hidden': 'true' }),
          e.jsx('span', { className: 'min-w-0 flex-1', children: x(t, r) }),
        ],
      }),
      m &&
        s &&
        e.jsx('ul', {
          role: 'group',
          children: t.children.map((i) =>
            e.jsx(_, { node: i, depth: r + 1, expandedIds: a, onToggle: n, renderNode: x }, i.id),
          ),
        }),
    ],
  });
}
function c({
  data: t,
  renderNode: r,
  expandedIds: a = z,
  onExpandedChange: n,
  draggable: x,
  onDrop: m,
  emptyText: s,
  className: i,
}) {
  const k = g.useCallback(
    (d) => {
      if (!n) return;
      const u = new Set(a);
      u.has(d) ? u.delete(d) : u.add(d), n(u);
    },
    [a, n],
  );
  return t.length === 0
    ? e.jsx('div', {
        className: L('flex items-center justify-center py-12 text-center', i),
        children: e.jsx('p', { className: 'text-sm text-muted-foreground', children: s }),
      })
    : e.jsx('ul', {
        role: 'tree',
        className: i,
        children: t.map((d) =>
          e.jsx(_, { node: d, depth: 0, expandedIds: a, onToggle: k, renderNode: r }, d.id),
        ),
      });
}
c.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxTree',
  props: {
    data: {
      required: !0,
      tsType: { name: 'Array', elements: [{ name: 'TNode' }], raw: 'TNode[]' },
      description: '',
    },
    renderNode: {
      required: !0,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(node: TNode, depth: number) => ReactNode',
        signature: {
          arguments: [
            { type: { name: 'TNode' }, name: 'node' },
            { type: { name: 'number' }, name: 'depth' },
          ],
          return: { name: 'ReactNode' },
        },
      },
      description: '自定义节点渲染',
    },
    expandedIds: {
      required: !1,
      tsType: { name: 'Set', elements: [{ name: 'string' }], raw: 'Set<string>' },
      description: '受控展开状态',
      defaultValue: { value: 'new Set<string>()', computed: !1 },
    },
    onExpandedChange: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(next: Set<string>) => void',
        signature: {
          arguments: [
            {
              type: { name: 'Set', elements: [{ name: 'string' }], raw: 'Set<string>' },
              name: 'next',
            },
          ],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    draggable: { required: !1, tsType: { name: 'boolean' }, description: 'v1.5 实现拖拽' },
    onDrop: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: "(dragId: string, targetId: string, position: 'before' | 'after' | 'inside') => void",
        signature: {
          arguments: [
            { type: { name: 'string' }, name: 'dragId' },
            { type: { name: 'string' }, name: 'targetId' },
            {
              type: {
                name: 'union',
                raw: "'before' | 'after' | 'inside'",
                elements: [
                  { name: 'literal', value: "'before'" },
                  { name: 'literal', value: "'after'" },
                  { name: 'literal', value: "'inside'" },
                ],
              },
              name: 'position',
            },
          ],
          return: { name: 'void' },
        },
      },
      description: 'v1.5 实现拖拽回调',
    },
    emptyText: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '空数据提示（REQUIRED，由调用方注入）',
    },
    className: { required: !1, tsType: { name: 'string' }, description: '' },
  },
};
const M = [
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
  ],
  A = [
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
  ],
  V = { title: 'L3/NxTree', component: c, parameters: { layout: 'padded' } },
  l = {
    render: () => {
      const [t, r] = g.useState(new Set(['dept-1']));
      return e.jsx(c, {
        data: M,
        renderNode: (a) => e.jsx('span', { className: 'text-sm', children: a.label }),
        expandedIds: t,
        onExpandedChange: r,
        emptyText: 'No data',
      });
    },
  },
  o = {
    render: () =>
      e.jsx(c, {
        data: [],
        renderNode: (t) => e.jsx('span', { children: t.label }),
        emptyText: 'No departments found',
      }),
  },
  p = {
    render: () => {
      const [t, r] = g.useState(new Set(['l0', 'l1', 'l2', 'l3', 'l4']));
      return e.jsx(c, {
        data: A,
        renderNode: (a, n) =>
          e.jsxs('span', {
            className: 'text-sm',
            children: [
              a.label,
              ' ',
              e.jsxs('span', {
                className: 'text-xs text-muted-foreground',
                children: ['(depth: ', n, ')'],
              }),
            ],
          }),
        expandedIds: t,
        onExpandedChange: r,
        emptyText: 'No data',
      });
    },
  };
var h, f, N, b, y;
l.parameters = {
  ...l.parameters,
  docs: {
    ...((h = l.parameters) == null ? void 0 : h.docs),
    source: {
      originalSource: `{
  render: () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['dept-1']));
    return <NxTree data={sampleData} renderNode={node => <span className="text-sm">{node.label}</span>} expandedIds={expandedIds} onExpandedChange={setExpandedIds} emptyText="No data" />;
  }
}`,
      ...((N = (f = l.parameters) == null ? void 0 : f.docs) == null ? void 0 : N.source),
    },
    description: {
      story: '默认用法：展开/收起交互',
      ...((y = (b = l.parameters) == null ? void 0 : b.docs) == null ? void 0 : y.description),
    },
  },
};
var T, j, v, E, S;
o.parameters = {
  ...o.parameters,
  docs: {
    ...((T = o.parameters) == null ? void 0 : T.docs),
    source: {
      originalSource: `{
  render: () => <NxTree data={[]} renderNode={(node: DemoNode) => <span>{node.label}</span>} emptyText="No departments found" />
}`,
      ...((v = (j = o.parameters) == null ? void 0 : j.docs) == null ? void 0 : v.source),
    },
    description: {
      story: '空状态',
      ...((S = (E = o.parameters) == null ? void 0 : E.docs) == null ? void 0 : S.description),
    },
  },
};
var I, w, D, C, q;
p.parameters = {
  ...p.parameters,
  docs: {
    ...((I = p.parameters) == null ? void 0 : I.docs),
    source: {
      originalSource: `{
  render: () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['l0', 'l1', 'l2', 'l3', 'l4']));
    return <NxTree data={deepData} renderNode={(node, depth) => <span className="text-sm">
            {node.label} <span className="text-xs text-muted-foreground">(depth: {depth})</span>
          </span>} expandedIds={expandedIds} onExpandedChange={setExpandedIds} emptyText="No data" />;
  }
}`,
      ...((D = (w = p.parameters) == null ? void 0 : w.docs) == null ? void 0 : D.source),
    },
    description: {
      story: '深层嵌套（6 层）',
      ...((q = (C = p.parameters) == null ? void 0 : C.docs) == null ? void 0 : q.description),
    },
  },
};
const X = ['Default', 'Empty', 'DeepNested'];
export { p as DeepNested, l as Default, o as Empty, X as __namedExportsOrder, V as default };
