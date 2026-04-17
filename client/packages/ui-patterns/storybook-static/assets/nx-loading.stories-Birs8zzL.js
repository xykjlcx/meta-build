import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { B as H, c as n, S as r } from './table-BAJRp_jF.js';
import './index-B3e6rcmj.js';
import './index-JG1J0hlI.js';
import './_commonjsHelpers-Cpj98o6Y.js';
const f = ['w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-4/5'];
function M({ rows: a, text: t }) {
  return e.jsxs('div', {
    className: 'flex flex-col gap-3',
    children: [
      Array.from({ length: a }, (l, s) =>
        e.jsx(r, { className: n('h-4', f[s % f.length]) }, `row-${String(s)}`),
      ),
      e.jsx('p', { className: 'mt-1 text-sm text-muted-foreground', children: t }),
    ],
  });
}
function P({ rows: a, text: t }) {
  return e.jsxs('div', {
    className: 'flex flex-col gap-2',
    children: [
      e.jsxs('div', {
        className: 'flex gap-4',
        children: [
          e.jsx(r, { className: 'h-4 w-1/4' }),
          e.jsx(r, { className: 'h-4 w-1/4' }),
          e.jsx(r, { className: 'h-4 w-1/4' }),
          e.jsx(r, { className: 'h-4 w-1/4' }),
        ],
      }),
      e.jsx(r, { className: 'h-px w-full' }),
      Array.from({ length: a }, (l, s) =>
        e.jsxs(
          'div',
          {
            className: 'flex gap-4',
            children: [
              e.jsx(r, { className: 'h-4 w-1/4' }),
              e.jsx(r, { className: 'h-4 w-1/4' }),
              e.jsx(r, { className: 'h-4 w-1/4' }),
              e.jsx(r, { className: 'h-4 w-1/4' }),
            ],
          },
          `table-row-${String(s)}`,
        ),
      ),
      e.jsx('p', { className: 'mt-1 text-sm text-muted-foreground', children: t }),
    ],
  });
}
function G({ rows: a, text: t }) {
  return e.jsxs('div', {
    className: 'flex flex-col gap-3',
    children: [
      e.jsx(r, { className: 'h-6 w-1/3' }),
      e.jsx(r, { className: 'h-px w-full' }),
      Array.from({ length: a }, (l, s) =>
        e.jsx(r, { className: n('h-4', f[s % f.length]) }, `detail-${String(s)}`),
      ),
      e.jsx('p', { className: 'mt-1 text-sm text-muted-foreground', children: t }),
    ],
  });
}
function J() {
  return e.jsxs('svg', {
    className: 'size-8 animate-spin text-muted-foreground',
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': 'true',
    children: [
      e.jsx('circle', {
        className: 'opacity-25',
        cx: '12',
        cy: '12',
        r: '10',
        stroke: 'currentColor',
        strokeWidth: '4',
      }),
      e.jsx('path', {
        className: 'opacity-75',
        fill: 'currentColor',
        d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z',
      }),
    ],
  });
}
function U({
  loading: a = !1,
  error: t,
  empty: l = !1,
  loadingText: s,
  errorText: W,
  emptyText: O,
  retryLabel: j,
  onRetry: y,
  variant: o = 'skeleton',
  rows: g = 5,
  children: F,
  className: h,
}) {
  return t
    ? e.jsxs('div', {
        role: 'alert',
        className: n('flex flex-col items-center justify-center gap-3 py-12 text-center', h),
        children: [
          e.jsx('p', { className: 'text-sm text-destructive', children: W }),
          y && j && e.jsx(H, { variant: 'outline', size: 'sm', onClick: y, children: j }),
        ],
      })
    : a
      ? e.jsxs('div', {
          className: n('py-6', h),
          children: [
            o === 'spinner' &&
              e.jsxs('div', {
                className: 'flex flex-col items-center justify-center gap-3 py-6',
                children: [
                  e.jsx(J, {}),
                  e.jsx('p', { className: 'text-sm text-muted-foreground', children: s }),
                ],
              }),
            o === 'skeleton' && e.jsx(M, { rows: g, text: s }),
            o === 'skeleton-table' && e.jsx(P, { rows: g, text: s }),
            o === 'skeleton-detail' && e.jsx(G, { rows: g, text: s }),
          ],
        })
      : l
        ? e.jsx('div', {
            className: n('flex items-center justify-center py-12 text-center', h),
            children: e.jsx('p', { className: 'text-sm text-muted-foreground', children: O }),
          })
        : e.jsx(e.Fragment, { children: F });
}
U.__docgenInfo = {
  description: `三态容器：loading / error / empty / children

优先级：error > loading > empty > children`,
  methods: [],
  displayName: 'NxLoading',
  props: {
    loading: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '是否处于加载状态',
      defaultValue: { value: 'false', computed: !1 },
    },
    error: {
      required: !1,
      tsType: { name: 'unknown' },
      description: '错误对象（truthy 即视为错误状态）',
    },
    empty: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '是否为空数据状态',
      defaultValue: { value: 'false', computed: !1 },
    },
    loadingText: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '加载中提示文案（REQUIRED，由调用方注入）',
    },
    errorText: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '错误提示文案（REQUIRED，由调用方注入）',
    },
    emptyText: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '空数据提示文案（REQUIRED，由调用方注入）',
    },
    retryLabel: { required: !1, tsType: { name: 'ReactNode' }, description: '重试按钮文案' },
    onRetry: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '() => void',
        signature: { arguments: [], return: { name: 'void' } },
      },
      description: '重试回调',
    },
    variant: {
      required: !1,
      tsType: {
        name: 'union',
        raw: "'skeleton' | 'spinner' | 'skeleton-table' | 'skeleton-detail'",
        elements: [
          { name: 'literal', value: "'skeleton'" },
          { name: 'literal', value: "'spinner'" },
          { name: 'literal', value: "'skeleton-table'" },
          { name: 'literal', value: "'skeleton-detail'" },
        ],
      },
      description: '加载态视觉变体',
      defaultValue: { value: "'skeleton'", computed: !1 },
    },
    rows: {
      required: !1,
      tsType: { name: 'number' },
      description: '骨架行数，默认 5',
      defaultValue: { value: '5', computed: !1 },
    },
    children: { required: !1, tsType: { name: 'ReactNode' }, description: '正常内容' },
    className: { required: !1, tsType: { name: 'string' }, description: '' },
  },
};
const re = {
    title: 'Patterns/NxLoading',
    component: U,
    args: {
      loadingText: '加载中...',
      errorText: '加载失败',
      emptyText: '暂无数据',
      retryLabel: '重试',
    },
  },
  i = { args: { children: e.jsx('p', { children: '内容已加载' }) } },
  c = { args: { loading: !0, variant: 'skeleton' } },
  d = { args: { loading: !0, variant: 'spinner' } },
  m = { args: { loading: !0, variant: 'skeleton-table', rows: 5 } },
  u = { args: { loading: !0, variant: 'skeleton-detail', rows: 5 } },
  p = { args: { error: new globalThis.Error('fail'), onRetry: () => alert('重试') } },
  x = { args: { empty: !0 } };
var N, k, v;
i.parameters = {
  ...i.parameters,
  docs: {
    ...((N = i.parameters) == null ? void 0 : N.docs),
    source: {
      originalSource: `{
  args: {
    children: <p>内容已加载</p>
  }
}`,
      ...((v = (k = i.parameters) == null ? void 0 : k.docs) == null ? void 0 : v.source),
    },
  },
};
var w, S, T;
c.parameters = {
  ...c.parameters,
  docs: {
    ...((w = c.parameters) == null ? void 0 : w.docs),
    source: {
      originalSource: `{
  args: {
    loading: true,
    variant: 'skeleton'
  }
}`,
      ...((T = (S = c.parameters) == null ? void 0 : S.docs) == null ? void 0 : T.source),
    },
  },
};
var R, b, E;
d.parameters = {
  ...d.parameters,
  docs: {
    ...((R = d.parameters) == null ? void 0 : R.docs),
    source: {
      originalSource: `{
  args: {
    loading: true,
    variant: 'spinner'
  }
}`,
      ...((E = (b = d.parameters) == null ? void 0 : b.docs) == null ? void 0 : E.source),
    },
  },
};
var q, D, _;
m.parameters = {
  ...m.parameters,
  docs: {
    ...((q = m.parameters) == null ? void 0 : q.docs),
    source: {
      originalSource: `{
  args: {
    loading: true,
    variant: 'skeleton-table',
    rows: 5
  }
}`,
      ...((_ = (D = m.parameters) == null ? void 0 : D.docs) == null ? void 0 : _.source),
    },
  },
};
var L, $, I;
u.parameters = {
  ...u.parameters,
  docs: {
    ...((L = u.parameters) == null ? void 0 : L.docs),
    source: {
      originalSource: `{
  args: {
    loading: true,
    variant: 'skeleton-detail',
    rows: 5
  }
}`,
      ...((I = ($ = u.parameters) == null ? void 0 : $.docs) == null ? void 0 : I.source),
    },
  },
};
var V, C, z;
p.parameters = {
  ...p.parameters,
  docs: {
    ...((V = p.parameters) == null ? void 0 : V.docs),
    source: {
      originalSource: `{
  args: {
    error: new globalThis.Error('fail'),
    onRetry: () => alert('重试')
  }
}`,
      ...((z = (C = p.parameters) == null ? void 0 : C.docs) == null ? void 0 : z.source),
    },
  },
};
var A, B, Q;
x.parameters = {
  ...x.parameters,
  docs: {
    ...((A = x.parameters) == null ? void 0 : A.docs),
    source: {
      originalSource: `{
  args: {
    empty: true
  }
}`,
      ...((Q = (B = x.parameters) == null ? void 0 : B.docs) == null ? void 0 : Q.source),
    },
  },
};
const se = [
  'Default',
  'Loading',
  'Spinner',
  'SkeletonTable',
  'SkeletonDetail',
  'ErrorState',
  'Empty',
];
export {
  i as Default,
  x as Empty,
  p as ErrorState,
  c as Loading,
  u as SkeletonDetail,
  m as SkeletonTable,
  d as Spinner,
  se as __namedExportsOrder,
  re as default,
};
