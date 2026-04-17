import { c as I } from './index-D1SQP9Z-.js';
import {
  D as F,
  R as H,
  C as O,
  a as P,
  T as R,
  P as S,
  O as V,
  b as k,
} from './index-H2JHQ55g.js';
import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { c as a } from './utils-BQHNewu7.js';
import { X as L } from './x-0qQuNm2G.js';
import './createLucideIcon-D27BUxB9.js';
import './index-B3e6rcmj.js';
import './_commonjsHelpers-Cpj98o6Y.js';
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
function s({ ...r }) {
  return e.jsx(H, { 'data-slot': 'drawer', ...r });
}
function i({ ...r }) {
  return e.jsx(R, { 'data-slot': 'drawer-trigger', ...r });
}
function y({ ...r }) {
  return e.jsx(S, { 'data-slot': 'drawer-portal', ...r });
}
function j({ className: r, ...t }) {
  return e.jsx(V, {
    'data-slot': 'drawer-overlay',
    className: a(
      'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      r,
    ),
    ...t,
  });
}
const q = I(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: { side: 'right' },
  },
);
function l({ side: r = 'right', className: t, children: T, closeLabel: _, ...C }) {
  return e.jsxs(y, {
    children: [
      e.jsx(j, {}),
      e.jsxs(O, {
        'data-slot': 'drawer-content',
        className: a(q({ side: r }), t),
        ...C,
        children: [
          T,
          e.jsxs(P, {
            className:
              'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
            children: [
              e.jsx(L, { className: 'h-4 w-4' }),
              e.jsx('span', { className: 'sr-only', children: _ }),
            ],
          }),
        ],
      }),
    ],
  });
}
function c({ className: r, ...t }) {
  return e.jsx('div', {
    'data-slot': 'drawer-header',
    className: a('flex flex-col space-y-2 text-center sm:text-left', r),
    ...t,
  });
}
function N({ className: r, ...t }) {
  return e.jsx('div', {
    'data-slot': 'drawer-footer',
    className: a('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', r),
    ...t,
  });
}
function m({ className: r, ...t }) {
  return e.jsx(k, {
    'data-slot': 'drawer-title',
    className: a('text-lg font-semibold leading-none tracking-tight', r),
    ...t,
  });
}
function v({ className: r, ...t }) {
  return e.jsx(F, {
    'data-slot': 'drawer-description',
    className: a('text-sm text-muted-foreground', r),
    ...t,
  });
}
s.__docgenInfo = { description: '', methods: [], displayName: 'Drawer' };
i.__docgenInfo = { description: '', methods: [], displayName: 'DrawerTrigger' };
y.__docgenInfo = { description: '', methods: [], displayName: 'DrawerPortal' };
j.__docgenInfo = { description: '', methods: [], displayName: 'DrawerOverlay' };
l.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DrawerContent',
  props: {
    closeLabel: {
      required: !0,
      tsType: { name: 'string' },
      description: '关闭按钮的 ARIA 标签（L2 不假设默认语言，使用方通过 t() 传入）',
    },
    side: { defaultValue: { value: "'right'", computed: !1 }, required: !1 },
  },
};
c.__docgenInfo = { description: '', methods: [], displayName: 'DrawerHeader' };
N.__docgenInfo = { description: '', methods: [], displayName: 'DrawerFooter' };
m.__docgenInfo = { description: '', methods: [], displayName: 'DrawerTitle' };
v.__docgenInfo = { description: '', methods: [], displayName: 'DrawerDescription' };
const se = {
    title: 'Primitives/Drawer',
    component: s,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  o = {
    render: () =>
      e.jsxs(s, {
        children: [
          e.jsx(i, {
            asChild: !0,
            children: e.jsx('button', {
              type: 'button',
              className: 'rounded-md border px-4 py-2 text-sm',
              children: '右侧抽屉',
            }),
          }),
          e.jsxs(l, {
            closeLabel: '关闭',
            children: [
              e.jsxs(c, {
                children: [e.jsx(m, { children: '设置' }), e.jsx(v, { children: '修改应用设置' })],
              }),
              e.jsx('div', { className: 'p-4', children: '设置内容区域' }),
              e.jsx(N, {
                children: e.jsx('button', {
                  type: 'button',
                  className: 'rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
                  children: '保存',
                }),
              }),
            ],
          }),
        ],
      }),
  },
  n = {
    render: () =>
      e.jsxs(s, {
        children: [
          e.jsx(i, {
            asChild: !0,
            children: e.jsx('button', {
              type: 'button',
              className: 'rounded-md border px-4 py-2 text-sm',
              children: '左侧抽屉',
            }),
          }),
          e.jsxs(l, {
            side: 'left',
            closeLabel: '关闭',
            children: [
              e.jsx(c, { children: e.jsx(m, { children: '导航' }) }),
              e.jsx('div', { className: 'p-4', children: '导航菜单区域' }),
            ],
          }),
        ],
      }),
  },
  d = {
    render: () =>
      e.jsxs(s, {
        children: [
          e.jsx(i, {
            asChild: !0,
            children: e.jsx('button', {
              type: 'button',
              className: 'rounded-md border px-4 py-2 text-sm',
              children: '底部抽屉',
            }),
          }),
          e.jsxs(l, {
            side: 'bottom',
            closeLabel: '关闭',
            children: [
              e.jsx(c, { children: e.jsx(m, { children: '操作菜单' }) }),
              e.jsx('div', { className: 'p-4', children: '操作选项列表' }),
            ],
          }),
        ],
      }),
  };
var p, u, x;
o.parameters = {
  ...o.parameters,
  docs: {
    ...((p = o.parameters) == null ? void 0 : p.docs),
    source: {
      originalSource: `{
  render: () => <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          右侧抽屉
        </button>
      </DrawerTrigger>
      <DrawerContent closeLabel="关闭">
        <DrawerHeader>
          <DrawerTitle>设置</DrawerTitle>
          <DrawerDescription>修改应用设置</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">设置内容区域</div>
        <DrawerFooter>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            保存
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
}`,
      ...((x = (u = o.parameters) == null ? void 0 : u.docs) == null ? void 0 : x.source),
    },
  },
};
var w, f, g;
n.parameters = {
  ...n.parameters,
  docs: {
    ...((w = n.parameters) == null ? void 0 : w.docs),
    source: {
      originalSource: `{
  render: () => <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          左侧抽屉
        </button>
      </DrawerTrigger>
      <DrawerContent side="left" closeLabel="关闭">
        <DrawerHeader>
          <DrawerTitle>导航</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">导航菜单区域</div>
      </DrawerContent>
    </Drawer>
}`,
      ...((g = (f = n.parameters) == null ? void 0 : f.docs) == null ? void 0 : g.source),
    },
  },
};
var h, D, b;
d.parameters = {
  ...d.parameters,
  docs: {
    ...((h = d.parameters) == null ? void 0 : h.docs),
    source: {
      originalSource: `{
  render: () => <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          底部抽屉
        </button>
      </DrawerTrigger>
      <DrawerContent side="bottom" closeLabel="关闭">
        <DrawerHeader>
          <DrawerTitle>操作菜单</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">操作选项列表</div>
      </DrawerContent>
    </Drawer>
}`,
      ...((b = (D = d.parameters) == null ? void 0 : D.docs) == null ? void 0 : b.source),
    },
  },
};
const oe = ['Right', 'Left', 'Bottom'];
export { d as Bottom, n as Left, o as Right, oe as __namedExportsOrder, se as default };
