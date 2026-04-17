import { B as r } from './button-BqedyRxs.js';
import {
  C as f,
  R as g,
  O as h,
  a as i,
  D as m,
  T as p,
  b as u,
  P as x,
} from './index-H2JHQ55g.js';
import { j as a } from './jsx-runtime-BjG_zV1W.js';
import { c as t } from './utils-BQHNewu7.js';
import { X as c } from './x-0qQuNm2G.js';
function D({ ...e }) {
  return a.jsx(g, { 'data-slot': 'dialog', ...e });
}
function y({ ...e }) {
  return a.jsx(p, { 'data-slot': 'dialog-trigger', ...e });
}
function l({ ...e }) {
  return a.jsx(x, { 'data-slot': 'dialog-portal', ...e });
}
function d({ className: e, ...o }) {
  return a.jsx(h, {
    'data-slot': 'dialog-overlay',
    className: t(
      'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      e,
    ),
    ...o,
  });
}
function _({ className: e, children: o, showCloseButton: s = !0, ...n }) {
  return a.jsxs(l, {
    'data-slot': 'dialog-portal',
    children: [
      a.jsx(d, {}),
      a.jsxs(f, {
        'data-slot': 'dialog-content',
        className: t(
          'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
          e,
        ),
        ...n,
        children: [
          o,
          s &&
            a.jsxs(i, {
              'data-slot': 'dialog-close',
              className:
                "absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [a.jsx(c, {}), a.jsx('span', { className: 'sr-only', children: 'Close' })],
            }),
        ],
      }),
    ],
  });
}
function j({ className: e, ...o }) {
  return a.jsx('div', {
    'data-slot': 'dialog-header',
    className: t('flex flex-col gap-2 text-center sm:text-left', e),
    ...o,
  });
}
function N({ className: e, showCloseButton: o = !1, children: s, ...n }) {
  return a.jsxs('div', {
    'data-slot': 'dialog-footer',
    className: t('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', e),
    ...n,
    children: [
      s,
      o && a.jsx(i, { asChild: !0, children: a.jsx(r, { variant: 'outline', children: 'Close' }) }),
    ],
  });
}
function v({ className: e, ...o }) {
  return a.jsx(u, {
    'data-slot': 'dialog-title',
    className: t('text-lg leading-none font-semibold', e),
    ...o,
  });
}
function b({ className: e, ...o }) {
  return a.jsx(m, {
    'data-slot': 'dialog-description',
    className: t('text-sm text-muted-foreground', e),
    ...o,
  });
}
D.__docgenInfo = { description: '', methods: [], displayName: 'Dialog' };
_.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DialogContent',
  props: {
    showCloseButton: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '',
      defaultValue: { value: 'true', computed: !1 },
    },
  },
};
b.__docgenInfo = { description: '', methods: [], displayName: 'DialogDescription' };
N.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DialogFooter',
  props: {
    showCloseButton: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '',
      defaultValue: { value: 'false', computed: !1 },
    },
  },
};
j.__docgenInfo = { description: '', methods: [], displayName: 'DialogHeader' };
d.__docgenInfo = { description: '', methods: [], displayName: 'DialogOverlay' };
l.__docgenInfo = { description: '', methods: [], displayName: 'DialogPortal' };
v.__docgenInfo = { description: '', methods: [], displayName: 'DialogTitle' };
y.__docgenInfo = { description: '', methods: [], displayName: 'DialogTrigger' };
export { D, y as a, _ as b, j as c, v as d, b as e, N as f };
