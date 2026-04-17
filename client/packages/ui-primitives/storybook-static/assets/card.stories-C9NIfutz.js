import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { c as t } from './utils-BQHNewu7.js';
function n({ className: r, ...a }) {
  return e.jsx('div', {
    'data-slot': 'card',
    className: t(
      'flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm',
      r,
    ),
    ...a,
  });
}
function u({ className: r, ...a }) {
  return e.jsx('div', {
    'data-slot': 'card-header',
    className: t(
      '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
      r,
    ),
    ...a,
  });
}
function C({ className: r, ...a }) {
  return e.jsx('div', {
    'data-slot': 'card-title',
    className: t('leading-none font-semibold', r),
    ...a,
  });
}
function f({ className: r, ...a }) {
  return e.jsx('div', {
    'data-slot': 'card-description',
    className: t('text-sm text-muted-foreground', r),
    ...a,
  });
}
function o({ className: r, ...a }) {
  return e.jsx('div', { 'data-slot': 'card-content', className: t('px-6', r), ...a });
}
function g({ className: r, ...a }) {
  return e.jsx('div', {
    'data-slot': 'card-footer',
    className: t('flex items-center px-6 [.border-t]:pt-6', r),
    ...a,
  });
}
n.__docgenInfo = { description: '', methods: [], displayName: 'Card' };
u.__docgenInfo = { description: '', methods: [], displayName: 'CardHeader' };
g.__docgenInfo = { description: '', methods: [], displayName: 'CardFooter' };
C.__docgenInfo = { description: '', methods: [], displayName: 'CardTitle' };
f.__docgenInfo = { description: '', methods: [], displayName: 'CardDescription' };
o.__docgenInfo = { description: '', methods: [], displayName: 'CardContent' };
const j = {
    title: 'Primitives/Card',
    component: n,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  d = {
    render: () =>
      e.jsxs(n, {
        className: 'w-[350px]',
        children: [
          e.jsxs(u, {
            children: [
              e.jsx(C, { children: '创建项目' }),
              e.jsx(f, { children: '部署新项目只需一分钟。' }),
            ],
          }),
          e.jsx(o, {
            children: e.jsx('p', {
              className: 'text-sm text-muted-foreground',
              children: '项目配置区域',
            }),
          }),
          e.jsx(g, {
            children: e.jsx('button', {
              type: 'button',
              className: 'rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
              children: '创建',
            }),
          }),
        ],
      }),
  },
  s = {
    render: () =>
      e.jsx(n, {
        className: 'w-[350px]',
        children: e.jsx(o, {
          className: 'pt-6',
          children: e.jsx('p', { className: 'text-sm', children: '简单卡片，只有内容区域。' }),
        }),
      }),
  };
var c, i, m;
d.parameters = {
  ...d.parameters,
  docs: {
    ...((c = d.parameters) == null ? void 0 : c.docs),
    source: {
      originalSource: `{
  render: () => <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>创建项目</CardTitle>
        <CardDescription>部署新项目只需一分钟。</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">项目配置区域</p>
      </CardContent>
      <CardFooter>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          创建
        </button>
      </CardFooter>
    </Card>
}`,
      ...((m = (i = d.parameters) == null ? void 0 : i.docs) == null ? void 0 : m.source),
    },
  },
};
var l, p, x;
s.parameters = {
  ...s.parameters,
  docs: {
    ...((l = s.parameters) == null ? void 0 : l.docs),
    source: {
      originalSource: `{
  render: () => <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p className="text-sm">简单卡片，只有内容区域。</p>
      </CardContent>
    </Card>
}`,
      ...((x = (p = s.parameters) == null ? void 0 : p.docs) == null ? void 0 : x.source),
    },
  },
};
const y = ['Default', 'SimpleCard'];
export { d as Default, s as SimpleCard, y as __namedExportsOrder, j as default };
