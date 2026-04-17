import { r as n } from './index-B3e6rcmj.js';
import { j as e } from './jsx-runtime-BjG_zV1W.js';
import {
  h as $,
  b as H,
  P as M,
  c as N,
  C as Q,
  d as U,
  e as X,
  f as Y,
  g as Z,
  a as z,
} from './table-BAJRp_jF.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
function ee(r, s) {
  const [a, o] = n.useState(r);
  return (
    n.useEffect(() => {
      const m = setTimeout(() => o(r), s);
      return () => clearTimeout(m);
    }, [r, s]),
    a
  );
}
function x({
  value: r,
  onChange: s,
  fetcher: a,
  placeholder: o,
  loadingText: m,
  emptyText: O,
  size: T = 20,
  debounceMs: _ = 300,
  disabled: K,
}) {
  const b = n.useId(),
    [l, w] = n.useState(!1),
    [S, v] = n.useState(''),
    [f, j] = n.useState(!1),
    [i, C] = n.useState([]),
    L = ee(S, _),
    u = n.useRef(0),
    k = n.useRef(a);
  (k.current = a),
    n.useEffect(() => {
      if (!l) return;
      const t = ++u.current;
      j(!0),
        k
          .current({ keyword: L, page: 1, size: T })
          .then((g) => {
            t === u.current && C(g.options);
          })
          .catch(() => {
            t === u.current && C([]);
          })
          .finally(() => {
            t === u.current && j(!1);
          });
    }, [l, L, T]);
  const G = n.useCallback((t) => {
      w(t), t || v('');
    }, []),
    h = i.find((t) => t.value === r),
    J = h == null ? void 0 : h.label;
  return e.jsxs(M, {
    open: l,
    onOpenChange: G,
    children: [
      e.jsx(z, {
        asChild: !0,
        disabled: K,
        children: e.jsxs('button', {
          type: 'button',
          role: 'combobox',
          'aria-controls': b,
          'aria-expanded': l,
          className: N(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          ),
          children: [
            J ?? (o ? e.jsx('span', { className: 'text-muted-foreground', children: o }) : null),
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
      e.jsx(H, {
        className: 'w-[var(--radix-popover-trigger-width)] p-0',
        align: 'start',
        children: e.jsxs(Q, {
          shouldFilter: !1,
          children: [
            e.jsx(U, { value: S, onValueChange: v }),
            e.jsxs(X, {
              id: b,
              children: [
                f &&
                  e.jsx('div', {
                    className: 'py-6 text-center text-sm',
                    'data-testid': 'api-select-loading',
                    children: m,
                  }),
                !f && i.length === 0 && e.jsx(Y, { children: O }),
                !f &&
                  i.length > 0 &&
                  e.jsx(Z, {
                    children: i.map((t) => {
                      const g = t.searchText ?? String(t.value);
                      return e.jsxs(
                        $,
                        {
                          value: g,
                          disabled: t.disabled,
                          onSelect: () => {
                            s(t.value === r ? null : t.value), w(!1);
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
                              className: N(
                                'mr-2 h-4 w-4',
                                r === t.value ? 'opacity-100' : 'opacity-0',
                              ),
                              children: e.jsx('path', { d: 'M20 6 9 17l-5-5' }),
                            }),
                            t.label,
                          ],
                        },
                        String(t.value),
                      );
                    }),
                  }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
x.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'ApiSelect',
  props: {
    value: {
      required: !0,
      tsType: {
        name: 'union',
        raw: 'TValue | null',
        elements: [{ name: 'TValue' }, { name: 'null' }],
      },
      description: '',
    },
    onChange: {
      required: !0,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(next: TValue | null) => void',
        signature: {
          arguments: [
            {
              type: {
                name: 'union',
                raw: 'TValue | null',
                elements: [{ name: 'TValue' }, { name: 'null' }],
              },
              name: 'next',
            },
          ],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    fetcher: {
      required: !0,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(params: ApiSelectFetchParams) => Promise<ApiSelectFetchResult<TValue>>',
        signature: {
          arguments: [{ type: { name: 'ApiSelectFetchParams' }, name: 'params' }],
          return: {
            name: 'Promise',
            elements: [
              {
                name: 'ApiSelectFetchResult',
                elements: [{ name: 'TValue' }],
                raw: 'ApiSelectFetchResult<TValue>',
              },
            ],
            raw: 'Promise<ApiSelectFetchResult<TValue>>',
          },
        },
      },
      description: '',
    },
    placeholder: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    loadingText: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '加载中文案（必填，L3 零 i18n）',
    },
    emptyText: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '空结果文案（必填，L3 零 i18n）',
    },
    size: {
      required: !1,
      tsType: { name: 'number' },
      description: '每页条数，默认 20',
      defaultValue: { value: '20', computed: !1 },
    },
    debounceMs: {
      required: !1,
      tsType: { name: 'number' },
      description: '搜索防抖毫秒数，默认 300',
      defaultValue: { value: '300', computed: !1 },
    },
    cacheKey: { required: !1, tsType: { name: 'string' }, description: '预留缓存 key' },
    disabled: { required: !1, tsType: { name: 'boolean' }, description: '' },
  },
};
const V = [
  { value: '1', label: 'Alice Johnson' },
  { value: '2', label: 'Bob Smith' },
  { value: '3', label: 'Charlie Brown' },
  { value: '4', label: 'Diana Prince' },
  { value: '5', label: 'Edward Norton' },
];
function B(r) {
  return new Promise((s) => {
    setTimeout(() => {
      const a = r.keyword
        ? V.filter((o) => o.label.toLowerCase().includes(r.keyword.toLowerCase()))
        : V;
      s({ options: a, totalElements: a.length });
    }, 500);
  });
}
function te() {
  return new Promise(() => {});
}
function re() {
  return Promise.resolve({ options: [], totalElements: 0 });
}
function y({ fetcher: r, ...s }) {
  const [a, o] = n.useState(null);
  return e.jsx(x, { value: a, onChange: o, fetcher: r, ...s });
}
const ie = {
    title: 'Patterns/ApiSelect',
    component: x,
    args: {
      value: null,
      onChange: () => {},
      fetcher: B,
      placeholder: 'Select...',
      loadingText: 'Loading...',
      emptyText: 'No results found',
    },
  },
  c = {
    render: () =>
      e.jsx(y, {
        fetcher: B,
        placeholder: 'Select a user...',
        loadingText: 'Loading...',
        emptyText: 'No results found',
      }),
  },
  d = {
    render: () =>
      e.jsx(y, {
        fetcher: te,
        placeholder: 'Select a user...',
        loadingText: 'Loading...',
        emptyText: 'No results found',
      }),
  },
  p = {
    render: () =>
      e.jsx(y, {
        fetcher: re,
        placeholder: 'Select a user...',
        loadingText: 'Loading...',
        emptyText: 'No results found',
      }),
  };
var A, P, F;
c.parameters = {
  ...c.parameters,
  docs: {
    ...((A = c.parameters) == null ? void 0 : A.docs),
    source: {
      originalSource: `{
  render: () => <ApiSelectWrapper fetcher={mockFetcher} placeholder="Select a user..." loadingText="Loading..." emptyText="No results found" />
}`,
      ...((F = (P = c.parameters) == null ? void 0 : P.docs) == null ? void 0 : F.source),
    },
  },
};
var R, E, q;
d.parameters = {
  ...d.parameters,
  docs: {
    ...((R = d.parameters) == null ? void 0 : R.docs),
    source: {
      originalSource: `{
  render: () => <ApiSelectWrapper fetcher={loadingFetcher} placeholder="Select a user..." loadingText="Loading..." emptyText="No results found" />
}`,
      ...((q = (E = d.parameters) == null ? void 0 : E.docs) == null ? void 0 : q.source),
    },
  },
};
var I, W, D;
p.parameters = {
  ...p.parameters,
  docs: {
    ...((I = p.parameters) == null ? void 0 : I.docs),
    source: {
      originalSource: `{
  render: () => <ApiSelectWrapper fetcher={emptyFetcher} placeholder="Select a user..." loadingText="Loading..." emptyText="No results found" />
}`,
      ...((D = (W = p.parameters) == null ? void 0 : W.docs) == null ? void 0 : D.source),
    },
  },
};
const ue = ['Default', 'Loading', 'Empty'];
export { c as Default, p as Empty, d as Loading, ue as __namedExportsOrder, ie as default };
