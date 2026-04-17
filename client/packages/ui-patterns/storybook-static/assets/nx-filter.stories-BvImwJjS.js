import { r as a } from './index-B3e6rcmj.js';
import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { c as E, L as O, I as d, B as h } from './table-BAJRp_jF.js';
import './index-JG1J0hlI.js';
import './_commonjsHelpers-Cpj98o6Y.js';
const V = a.createContext(null);
function D() {
  const t = a.useContext(V);
  if (!t) throw new Error('NxFilterField 必须放在 NxFilter 内部使用');
  return t;
}
function u({
  value: t,
  defaultValue: l,
  onChange: r,
  resetLabel: m,
  applyLabel: x,
  children: f,
  className: F,
}) {
  const [s, o] = a.useState({ ...t });
  a.useEffect(() => {
    o({ ...t });
  }, [t]);
  const C = a.useCallback((N, q) => {
      o((R) => ({ ...R, [N]: q }));
    }, []),
    T = a.useCallback(
      (N) => {
        N.preventDefault(), r(s);
      },
      [s, r],
    ),
    I = a.useCallback(() => {
      o({ ...l }), r({ ...l });
    }, [l, r]);
  return e.jsx(V.Provider, {
    value: { draft: s, setField: C },
    children: e.jsxs('form', {
      onSubmit: T,
      className: E('flex flex-wrap items-end gap-4', F),
      'data-slot': 'nx-filter',
      children: [
        f,
        e.jsxs('div', {
          className: 'flex items-end gap-2',
          children: [
            e.jsx(h, { type: 'button', variant: 'outline', onClick: I, children: m }),
            e.jsx(h, { type: 'submit', children: x }),
          ],
        }),
      ],
    }),
  });
}
function n({ name: t, label: l, children: r }) {
  const { draft: m, setField: x } = D(),
    f = m[t] ?? '',
    F = a.isValidElement(r)
      ? a.cloneElement(r, {
          ...r.props,
          value: f,
          onChange: (s) => {
            const o = s && typeof s == 'object' && 'target' in s ? s.target.value : s;
            x(t, o);
          },
        })
      : r;
  return e.jsxs('div', {
    className: 'flex flex-col gap-1.5',
    'data-slot': 'filter-field',
    children: [e.jsx(O, { children: l }), F],
  });
}
u.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxFilter',
  props: {
    value: { required: !0, tsType: { name: 'TFilter' }, description: '受控值' },
    defaultValue: {
      required: !0,
      tsType: { name: 'TFilter' },
      description: '重置时恢复到的默认值',
    },
    onChange: {
      required: !0,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(next: TFilter) => void',
        signature: {
          arguments: [{ type: { name: 'TFilter' }, name: 'next' }],
          return: { name: 'void' },
        },
      },
      description: '同步到 URL 或状态',
    },
    resetLabel: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '重置按钮文案 — 必传，零默认文案',
    },
    applyLabel: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '查询按钮文案 — 必传，零默认文案',
    },
    children: { required: !0, tsType: { name: 'ReactNode' }, description: 'NxFilterField 集合' },
    className: { required: !1, tsType: { name: 'string' }, description: '' },
  },
};
n.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxFilterField',
  props: {
    name: { required: !0, tsType: { name: 'string' }, description: '必须与 value 中的 key 对应' },
    label: { required: !0, tsType: { name: 'ReactNode' }, description: '' },
    children: {
      required: !0,
      tsType: { name: 'ReactElement' },
      description: 'L2 Input / Select 等',
    },
  },
};
const W = {
    title: 'Patterns/NxFilter',
    component: u,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
  },
  i = {
    args: {
      value: { keyword: '' },
      defaultValue: { keyword: '' },
      onChange: () => {},
      resetLabel: '重置',
      applyLabel: '查询',
      children: null,
    },
    render: () => {
      const t = { keyword: '' },
        [l, r] = a.useState(t);
      return e.jsxs('div', {
        className: 'space-y-4',
        children: [
          e.jsx(u, {
            value: l,
            defaultValue: t,
            onChange: r,
            resetLabel: '重置',
            applyLabel: '查询',
            children: e.jsx(n, {
              name: 'keyword',
              label: '关键词',
              children: e.jsx(d, { placeholder: '请输入关键词' }),
            }),
          }),
          e.jsx('pre', {
            className: 'text-sm text-muted-foreground',
            children: JSON.stringify(l, null, 2),
          }),
        ],
      });
    },
  },
  c = {
    args: { ...i.args },
    render: () => {
      const t = { name: '', email: '', phone: '' },
        [l, r] = a.useState(t);
      return e.jsxs('div', {
        className: 'space-y-4',
        children: [
          e.jsxs(u, {
            value: l,
            defaultValue: t,
            onChange: r,
            resetLabel: '重置',
            applyLabel: '查询',
            children: [
              e.jsx(n, {
                name: 'name',
                label: '姓名',
                children: e.jsx(d, { placeholder: '请输入姓名' }),
              }),
              e.jsx(n, {
                name: 'email',
                label: '邮箱',
                children: e.jsx(d, { placeholder: '请输入邮箱' }),
              }),
              e.jsx(n, {
                name: 'phone',
                label: '电话',
                children: e.jsx(d, { placeholder: '请输入电话' }),
              }),
            ],
          }),
          e.jsx('pre', {
            className: 'text-sm text-muted-foreground',
            children: JSON.stringify(l, null, 2),
          }),
        ],
      });
    },
  },
  p = {
    args: { ...i.args },
    render: () => {
      const t = { keyword: '', status: '' },
        [l, r] = a.useState({ keyword: '预设值', status: '启用' });
      return e.jsxs('div', {
        className: 'space-y-4',
        children: [
          e.jsx('p', {
            className: 'text-sm text-muted-foreground',
            children: '点击重置按钮清空所有筛选条件',
          }),
          e.jsxs(u, {
            value: l,
            defaultValue: t,
            onChange: r,
            resetLabel: '重置',
            applyLabel: '查询',
            children: [
              e.jsx(n, {
                name: 'keyword',
                label: '关键词',
                children: e.jsx(d, { placeholder: '请输入关键词' }),
              }),
              e.jsx(n, {
                name: 'status',
                label: '状态',
                children: e.jsx(d, { placeholder: '请输入状态' }),
              }),
            ],
          }),
          e.jsx('pre', {
            className: 'text-sm text-muted-foreground',
            children: JSON.stringify(l, null, 2),
          }),
        ],
      });
    },
  };
var y, g, b;
i.parameters = {
  ...i.parameters,
  docs: {
    ...((y = i.parameters) == null ? void 0 : y.docs),
    source: {
      originalSource: `{
  args: {
    value: {
      keyword: ''
    },
    defaultValue: {
      keyword: ''
    },
    onChange: () => {},
    resetLabel: '重置',
    applyLabel: '查询',
    children: null
  },
  render: () => {
    const defaultValue = {
      keyword: ''
    };
    const [filter, setFilter] = useState(defaultValue);
    return <div className="space-y-4">
        <NxFilter value={filter} defaultValue={defaultValue} onChange={setFilter} resetLabel="重置" applyLabel="查询">
          <NxFilterField name="keyword" label="关键词">
            <Input placeholder="请输入关键词" />
          </NxFilterField>
        </NxFilter>
        <pre className="text-sm text-muted-foreground">{JSON.stringify(filter, null, 2)}</pre>
      </div>;
  }
}`,
      ...((b = (g = i.parameters) == null ? void 0 : g.docs) == null ? void 0 : b.source),
    },
  },
};
var j, v, L;
c.parameters = {
  ...c.parameters,
  docs: {
    ...((j = c.parameters) == null ? void 0 : j.docs),
    source: {
      originalSource: `{
  args: {
    ...Default.args
  },
  render: () => {
    const defaultValue = {
      name: '',
      email: '',
      phone: ''
    };
    const [filter, setFilter] = useState(defaultValue);
    return <div className="space-y-4">
        <NxFilter value={filter} defaultValue={defaultValue} onChange={setFilter} resetLabel="重置" applyLabel="查询">
          <NxFilterField name="name" label="姓名">
            <Input placeholder="请输入姓名" />
          </NxFilterField>
          <NxFilterField name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </NxFilterField>
          <NxFilterField name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </NxFilterField>
        </NxFilter>
        <pre className="text-sm text-muted-foreground">{JSON.stringify(filter, null, 2)}</pre>
      </div>;
  }
}`,
      ...((L = (v = c.parameters) == null ? void 0 : v.docs) == null ? void 0 : L.source),
    },
  },
};
var k, w, S;
p.parameters = {
  ...p.parameters,
  docs: {
    ...((k = p.parameters) == null ? void 0 : k.docs),
    source: {
      originalSource: `{
  args: {
    ...Default.args
  },
  render: () => {
    const defaultValue = {
      keyword: '',
      status: ''
    };
    const [filter, setFilter] = useState({
      keyword: '预设值',
      status: '启用'
    });
    return <div className="space-y-4">
        <p className="text-sm text-muted-foreground">点击重置按钮清空所有筛选条件</p>
        <NxFilter value={filter} defaultValue={defaultValue} onChange={setFilter} resetLabel="重置" applyLabel="查询">
          <NxFilterField name="keyword" label="关键词">
            <Input placeholder="请输入关键词" />
          </NxFilterField>
          <NxFilterField name="status" label="状态">
            <Input placeholder="请输入状态" />
          </NxFilterField>
        </NxFilter>
        <pre className="text-sm text-muted-foreground">{JSON.stringify(filter, null, 2)}</pre>
      </div>;
  }
}`,
      ...((S = (w = p.parameters) == null ? void 0 : w.docs) == null ? void 0 : S.source),
    },
  },
};
const A = ['Default', 'WithMultipleFields', 'Reset'];
export {
  i as Default,
  p as Reset,
  c as WithMultipleFields,
  A as __namedExportsOrder,
  W as default,
};
