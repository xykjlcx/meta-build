import { C as I } from './chevron-right-BOrzOjK1.js';
import { c as _ } from './createLucideIcon-D27BUxB9.js';
import { S as y } from './index-DuVyFFjR.js';
import { j as r } from './jsx-runtime-BjG_zV1W.js';
import { c } from './utils-BQHNewu7.js';
import './index-B3e6rcmj.js';
import './_commonjsHelpers-Cpj98o6Y.js'; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const N = [
    ['circle', { cx: '12', cy: '12', r: '1', key: '41hilf' }],
    ['circle', { cx: '19', cy: '12', r: '1', key: '1wjl8i' }],
    ['circle', { cx: '5', cy: '12', r: '1', key: '1pcz8c' }],
  ],
  L = _('ellipsis', N);
function m({ ...e }) {
  return r.jsx('nav', { 'aria-label': 'breadcrumb', 'data-slot': 'breadcrumb', ...e });
}
function u({ className: e, ...a }) {
  return r.jsx('ol', {
    'data-slot': 'breadcrumb-list',
    className: c(
      'flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5',
      e,
    ),
    ...a,
  });
}
function s({ className: e, ...a }) {
  return r.jsx('li', {
    'data-slot': 'breadcrumb-item',
    className: c('inline-flex items-center gap-1.5', e),
    ...a,
  });
}
function i({ asChild: e, className: a, ...o }) {
  const g = e ? y : 'a';
  return r.jsx(g, {
    'data-slot': 'breadcrumb-link',
    className: c('transition-colors hover:text-foreground', a),
    ...o,
  });
}
function l({ className: e, ...a }) {
  return r.jsx('span', {
    'data-slot': 'breadcrumb-page',
    role: 'link',
    'aria-disabled': 'true',
    'aria-current': 'page',
    className: c('font-normal text-foreground', e),
    ...a,
  });
}
function n({ children: e, className: a, ...o }) {
  return r.jsx('li', {
    'data-slot': 'breadcrumb-separator',
    role: 'presentation',
    'aria-hidden': 'true',
    className: c('[&>svg]:size-3.5', a),
    ...o,
    children: e ?? r.jsx(I, {}),
  });
}
function j({ className: e, ...a }) {
  return r.jsxs('span', {
    'data-slot': 'breadcrumb-ellipsis',
    role: 'presentation',
    'aria-hidden': 'true',
    className: c('flex size-9 items-center justify-center', e),
    ...a,
    children: [
      r.jsx(L, { className: 'size-4' }),
      r.jsx('span', { className: 'sr-only', children: 'More' }),
    ],
  });
}
m.__docgenInfo = { description: '', methods: [], displayName: 'Breadcrumb' };
u.__docgenInfo = { description: '', methods: [], displayName: 'BreadcrumbList' };
s.__docgenInfo = { description: '', methods: [], displayName: 'BreadcrumbItem' };
i.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'BreadcrumbLink',
  props: { asChild: { required: !1, tsType: { name: 'boolean' }, description: '' } },
};
l.__docgenInfo = { description: '', methods: [], displayName: 'BreadcrumbPage' };
n.__docgenInfo = { description: '', methods: [], displayName: 'BreadcrumbSeparator' };
j.__docgenInfo = { description: '', methods: [], displayName: 'BreadcrumbEllipsis' };
const w = {
    title: 'Primitives/Breadcrumb',
    component: m,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  t = {
    render: () =>
      r.jsx(m, {
        children: r.jsxs(u, {
          children: [
            r.jsx(s, { children: r.jsx(i, { href: '/', children: '首页' }) }),
            r.jsx(n, {}),
            r.jsx(s, { children: r.jsx(i, { href: '/products', children: '产品' }) }),
            r.jsx(n, {}),
            r.jsx(s, { children: r.jsx(l, { children: '详情' }) }),
          ],
        }),
      }),
  },
  d = {
    render: () =>
      r.jsx(m, {
        children: r.jsxs(u, {
          children: [
            r.jsx(s, { children: r.jsx(i, { href: '/', children: '首页' }) }),
            r.jsx(n, {}),
            r.jsx(s, { children: r.jsx(j, {}) }),
            r.jsx(n, {}),
            r.jsx(s, { children: r.jsx(l, { children: '当前页' }) }),
          ],
        }),
      }),
  };
var b, p, B;
t.parameters = {
  ...t.parameters,
  docs: {
    ...((b = t.parameters) == null ? void 0 : b.docs),
    source: {
      originalSource: `{
  render: () => <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">首页</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products">产品</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>详情</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
}`,
      ...((B = (p = t.parameters) == null ? void 0 : p.docs) == null ? void 0 : B.source),
    },
  },
};
var x, h, f;
d.parameters = {
  ...d.parameters,
  docs: {
    ...((x = d.parameters) == null ? void 0 : x.docs),
    source: {
      originalSource: `{
  render: () => <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">首页</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>当前页</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
}`,
      ...((f = (h = d.parameters) == null ? void 0 : h.docs) == null ? void 0 : f.source),
    },
  },
};
const D = ['Default', 'WithEllipsis'];
export { t as Default, d as WithEllipsis, D as __namedExportsOrder, w as default };
