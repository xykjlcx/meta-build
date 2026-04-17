import { e as A, d as I, C as V, a as W, b as _, c as z } from './command-83YOuc5f.js';
import { r as L } from './index-B3e6rcmj.js';
import { R as B, C as F, T as G, P as M } from './index-tTUmRSZg.js';
import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { c as f } from './utils-BQHNewu7.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-H2JHQ55g.js';
import './index-DclwlaNk.js';
import './index-BAgrSUEs.js';
import './index-DuVyFFjR.js';
import './index-CXzmB-r4.js';
import './index-CnCkN4Kb.js';
import './index-Tk7B4GT7.js';
import './index-JG1J0hlI.js';
import './index-CLFlh7pk.js';
import './index-D8RfjXkI.js';
import './index-npCAFBsl.js';
import './index-BsSyydlo.js';
import './dialog-D1j1OD2J.js';
import './button-BqedyRxs.js';
import './index-D1SQP9Z-.js';
import './x-0qQuNm2G.js';
import './createLucideIcon-D27BUxB9.js';
import './index-BVSSuIN4.js';
import './index-D61X6AnJ.js';
function m({
  options: a,
  value: o,
  onValueChange: d,
  placeholder: c,
  searchPlaceholder: O,
  emptyText: p,
  className: D,
  disabled: E,
}) {
  var x;
  const [u, h] = L.useState(!1),
    R = (x = a.find((r) => r.value === o)) == null ? void 0 : x.label;
  return e.jsxs(B, {
    open: u,
    onOpenChange: h,
    children: [
      e.jsx(G, {
        asChild: !0,
        disabled: E,
        children: e.jsxs('button', {
          type: 'button',
          role: 'combobox',
          'aria-controls': 'combobox-listbox',
          'aria-expanded': u,
          className: f(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            D,
          ),
          children: [
            R ?? (c ? e.jsx('span', { className: 'text-muted-foreground', children: c }) : null),
            e.jsxs('svg', {
              'aria-hidden': 'true',
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              className: 'ml-2 h-4 w-4 shrink-0 opacity-50',
              children: [
                e.jsx('path', { d: 'm7 15 5 5 5-5' }),
                e.jsx('path', { d: 'm7 9 5-5 5 5' }),
              ],
            }),
          ],
        }),
      }),
      e.jsx(M, {
        children: e.jsx(F, {
          className:
            'z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          sideOffset: 4,
          align: 'start',
          children: e.jsxs(V, {
            children: [
              e.jsx(W, { placeholder: O }),
              e.jsxs(_, {
                children: [
                  p && e.jsx(z, { children: p }),
                  e.jsx(I, {
                    children: a.map((r) =>
                      e.jsxs(
                        A,
                        {
                          value: r.value,
                          onSelect: (g) => {
                            d == null || d(g === o ? '' : g), h(!1);
                          },
                          children: [
                            e.jsx('svg', {
                              'aria-hidden': 'true',
                              xmlns: 'http://www.w3.org/2000/svg',
                              viewBox: '0 0 24 24',
                              fill: 'none',
                              stroke: 'currentColor',
                              strokeWidth: '2',
                              strokeLinecap: 'round',
                              strokeLinejoin: 'round',
                              className: f(
                                'mr-2 h-4 w-4',
                                o === r.value ? 'opacity-100' : 'opacity-0',
                              ),
                              children: e.jsx('path', { d: 'M20 6 9 17l-5-5' }),
                            }),
                            r.label,
                          ],
                        },
                        r.value,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
    ],
  });
}
m.__docgenInfo = {
  description: '可搜索下拉选择器',
  methods: [],
  displayName: 'Combobox',
  props: {
    options: {
      required: !0,
      tsType: { name: 'Array', elements: [{ name: 'ComboboxOption' }], raw: 'ComboboxOption[]' },
      description: '选项列表',
    },
    value: { required: !1, tsType: { name: 'string' }, description: '当前选中值' },
    onValueChange: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(value: string) => void',
        signature: {
          arguments: [{ type: { name: 'string' }, name: 'value' }],
          return: { name: 'void' },
        },
      },
      description: '值变更回调',
    },
    placeholder: { required: !1, tsType: { name: 'string' }, description: '占位提示文字' },
    searchPlaceholder: { required: !1, tsType: { name: 'string' }, description: '搜索框占位提示' },
    emptyText: { required: !1, tsType: { name: 'string' }, description: '空结果提示文字' },
    className: { required: !1, tsType: { name: 'string' }, description: '自定义 className' },
    disabled: { required: !1, tsType: { name: 'boolean' }, description: '是否禁用' },
  },
};
const ge = {
    title: 'Primitives/Combobox',
    component: m,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  s = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'Solid' },
  ],
  t = {
    args: {
      options: s,
      placeholder: '选择框架...',
      searchPlaceholder: '搜索框架...',
      emptyText: '未找到框架',
    },
  },
  n = { args: { options: s, value: 'react' } },
  l = {
    args: {
      options: s,
      placeholder: '选择框架...',
      searchPlaceholder: '搜索框架...',
      emptyText: '未找到框架',
    },
    render: () => {
      const [a, o] = L.useState('');
      return e.jsxs('div', {
        className: 'space-y-2',
        children: [
          e.jsx(m, {
            options: s,
            value: a,
            onValueChange: o,
            placeholder: '选择框架...',
            searchPlaceholder: '搜索框架...',
            emptyText: '未找到框架',
            className: 'w-[200px]',
          }),
          e.jsxs('p', {
            className: 'text-sm text-muted-foreground',
            children: ['当前值: ', a || '无'],
          }),
        ],
      });
    },
  },
  i = { args: { options: s, disabled: !0, placeholder: '不可选择' } };
var b, v, y;
t.parameters = {
  ...t.parameters,
  docs: {
    ...((b = t.parameters) == null ? void 0 : b.docs),
    source: {
      originalSource: `{
  args: {
    options: frameworks,
    placeholder: '选择框架...',
    searchPlaceholder: '搜索框架...',
    emptyText: '未找到框架'
  }
}`,
      ...((y = (v = t.parameters) == null ? void 0 : v.docs) == null ? void 0 : y.source),
    },
  },
};
var w, j, C;
n.parameters = {
  ...n.parameters,
  docs: {
    ...((w = n.parameters) == null ? void 0 : w.docs),
    source: {
      originalSource: `{
  args: {
    options: frameworks,
    value: 'react'
  }
}`,
      ...((C = (j = n.parameters) == null ? void 0 : j.docs) == null ? void 0 : C.source),
    },
  },
};
var k, T, N;
l.parameters = {
  ...l.parameters,
  docs: {
    ...((k = l.parameters) == null ? void 0 : k.docs),
    source: {
      originalSource: `{
  args: {
    options: frameworks,
    placeholder: '选择框架...',
    searchPlaceholder: '搜索框架...',
    emptyText: '未找到框架'
  },
  render: () => {
    const [value, setValue] = useState('');
    return <div className="space-y-2">
        <Combobox options={frameworks} value={value} onValueChange={setValue} placeholder="选择框架..." searchPlaceholder="搜索框架..." emptyText="未找到框架" className="w-[200px]" />
        <p className="text-sm text-muted-foreground">当前值: {value || '无'}</p>
      </div>;
  }
}`,
      ...((N = (T = l.parameters) == null ? void 0 : T.docs) == null ? void 0 : N.source),
    },
  },
};
var P, S, q;
i.parameters = {
  ...i.parameters,
  docs: {
    ...((P = i.parameters) == null ? void 0 : P.docs),
    source: {
      originalSource: `{
  args: {
    options: frameworks,
    disabled: true,
    placeholder: '不可选择'
  }
}`,
      ...((q = (S = i.parameters) == null ? void 0 : S.docs) == null ? void 0 : q.source),
    },
  },
};
const fe = ['Default', 'WithValue', 'Controlled', 'Disabled'];
export {
  l as Controlled,
  t as Default,
  i as Disabled,
  n as WithValue,
  fe as __namedExportsOrder,
  ge as default,
};
