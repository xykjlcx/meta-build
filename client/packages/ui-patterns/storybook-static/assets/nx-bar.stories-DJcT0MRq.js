import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { B as o, c as q } from './table-BAJRp_jF.js';
import './index-B3e6rcmj.js';
import './index-JG1J0hlI.js';
import './_commonjsHelpers-Cpj98o6Y.js';
function c({
  selectedCount: t,
  selectedTemplate: h,
  actions: v,
  onClear: l,
  clearLabel: B,
  fixed: j = !1,
  className: y,
}) {
  if (t <= 0) return null;
  const z = h.replace('{count}', String(t));
  return e.jsxs('div', {
    'data-slot': 'nx-bar',
    className: q(
      'flex items-center justify-between border-t bg-background px-4 py-3 shadow-lg',
      j && 'fixed bottom-0 left-0 right-0 z-50',
      y,
    ),
    children: [
      e.jsxs('div', {
        className: 'flex items-center gap-3',
        children: [
          e.jsx('span', { className: 'text-sm font-medium', children: z }),
          l && e.jsx(o, { variant: 'ghost', size: 'sm', onClick: l, children: B }),
        ],
      }),
      e.jsx('div', { className: 'flex items-center gap-2', children: v }),
    ],
  });
}
c.__docgenInfo = {
  description: `NxBar — 批量操作栏

当有条目被选中时显示在页面底部，提供批量操作入口。
selectedCount <= 0 时不渲染。`,
  methods: [],
  displayName: 'NxBar',
  props: {
    selectedCount: { required: !0, tsType: { name: 'number' }, description: '当前选中的条目数量' },
    selectedTemplate: {
      required: !0,
      tsType: { name: 'string' },
      description: '选中提示文案模板，必须包含 {count} 占位符',
    },
    actions: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '操作按钮区域（渲染 slot，调用方放 Button 集合）',
    },
    onClear: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '() => void',
        signature: { arguments: [], return: { name: 'void' } },
      },
      description: '清除选中的回调',
    },
    clearLabel: { required: !1, tsType: { name: 'ReactNode' }, description: '清除按钮的文案' },
    fixed: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '是否 sticky 到视口底部',
      defaultValue: { value: 'false', computed: !1 },
    },
    className: { required: !1, tsType: { name: 'string' }, description: '' },
  },
};
const k = {
    title: 'Patterns/NxBar',
    component: c,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs'],
  },
  s = {
    args: {
      selectedCount: 3,
      selectedTemplate: '已选择 {count} 项',
      actions: null,
      onClear: () => {},
      clearLabel: '清除',
    },
  },
  r = {
    args: {
      selectedCount: 5,
      selectedTemplate: '{count} items selected',
      actions: null,
      onClear: () => {},
      clearLabel: 'Clear',
    },
    render: (t) =>
      e.jsx(c, {
        ...t,
        actions: e.jsxs(e.Fragment, {
          children: [
            e.jsx(o, { variant: 'destructive', size: 'sm', children: 'Delete' }),
            e.jsx(o, { variant: 'outline', size: 'sm', children: 'Export' }),
          ],
        }),
      }),
  },
  a = {
    args: {
      selectedCount: 2,
      selectedTemplate: '已选择 {count} 项',
      actions: null,
      fixed: !0,
      onClear: () => {},
      clearLabel: '清除',
    },
    render: (t) =>
      e.jsx(c, { ...t, actions: e.jsx(o, { variant: 'outline', size: 'sm', children: 'Export' }) }),
  },
  n = { args: { selectedCount: 0, selectedTemplate: '{count} selected', actions: null } };
var i, d, u;
s.parameters = {
  ...s.parameters,
  docs: {
    ...((i = s.parameters) == null ? void 0 : i.docs),
    source: {
      originalSource: `{
  args: {
    selectedCount: 3,
    selectedTemplate: '已选择 {count} 项',
    actions: null,
    onClear: () => {},
    clearLabel: '清除'
  }
}`,
      ...((u = (d = s.parameters) == null ? void 0 : d.docs) == null ? void 0 : u.source),
    },
  },
};
var m, p, x;
r.parameters = {
  ...r.parameters,
  docs: {
    ...((m = r.parameters) == null ? void 0 : m.docs),
    source: {
      originalSource: `{
  args: {
    selectedCount: 5,
    selectedTemplate: '{count} items selected',
    actions: null,
    onClear: () => {},
    clearLabel: 'Clear'
  },
  render: args => <NxBar {...args} actions={<>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </>} />
}`,
      ...((x = (p = r.parameters) == null ? void 0 : p.docs) == null ? void 0 : x.source),
    },
  },
};
var g, f, C;
a.parameters = {
  ...a.parameters,
  docs: {
    ...((g = a.parameters) == null ? void 0 : g.docs),
    source: {
      originalSource: `{
  args: {
    selectedCount: 2,
    selectedTemplate: '已选择 {count} 项',
    actions: null,
    fixed: true,
    onClear: () => {},
    clearLabel: '清除'
  },
  render: args => <NxBar {...args} actions={<Button variant="outline" size="sm">
          Export
        </Button>} />
}`,
      ...((C = (f = a.parameters) == null ? void 0 : f.docs) == null ? void 0 : C.source),
    },
  },
};
var N, T, b;
n.parameters = {
  ...n.parameters,
  docs: {
    ...((N = n.parameters) == null ? void 0 : N.docs),
    source: {
      originalSource: `{
  args: {
    selectedCount: 0,
    selectedTemplate: '{count} selected',
    actions: null
  }
}`,
      ...((b = (T = n.parameters) == null ? void 0 : T.docs) == null ? void 0 : b.source),
    },
  },
};
const w = ['Default', 'WithActions', 'Fixed', 'NoSelection'];
export {
  s as Default,
  a as Fixed,
  n as NoSelection,
  r as WithActions,
  w as __namedExportsOrder,
  k as default,
};
