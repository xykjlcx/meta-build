import { c as _ } from './index-D1SQP9Z-.js';
import { S as O } from './index-DuVyFFjR.js';
import { j as V } from './jsx-runtime-BjG_zV1W.js';
import { c as B } from './utils-BQHNewu7.js';
import './index-B3e6rcmj.js';
import './_commonjsHelpers-Cpj98o6Y.js';
const q = _(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);
function S({ className: w, variant: o = 'default', asChild: k = !1, ...j }) {
  const D = k ? O : 'span';
  return V.jsx(D, {
    'data-slot': 'badge',
    'data-variant': o,
    className: B(q({ variant: o }), w),
    ...j,
  });
}
S.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'Badge',
  props: {
    asChild: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '',
      defaultValue: { value: 'false', computed: !1 },
    },
    variant: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
  },
};
const P = {
    title: 'Primitives/Badge',
    component: S,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  e = { args: { children: '默认' } },
  r = { args: { variant: 'secondary', children: '次要' } },
  a = { args: { variant: 'destructive', children: '危险' } },
  t = { args: { variant: 'outline', children: '描边' } },
  s = { args: { variant: 'ghost', children: '幽灵' } };
var n, i, c;
e.parameters = {
  ...e.parameters,
  docs: {
    ...((n = e.parameters) == null ? void 0 : n.docs),
    source: {
      originalSource: `{
  args: {
    children: '默认'
  }
}`,
      ...((c = (i = e.parameters) == null ? void 0 : i.docs) == null ? void 0 : c.source),
    },
  },
};
var d, u, l;
r.parameters = {
  ...r.parameters,
  docs: {
    ...((d = r.parameters) == null ? void 0 : d.docs),
    source: {
      originalSource: `{
  args: {
    variant: 'secondary',
    children: '次要'
  }
}`,
      ...((l = (u = r.parameters) == null ? void 0 : u.docs) == null ? void 0 : l.source),
    },
  },
};
var p, g, m;
a.parameters = {
  ...a.parameters,
  docs: {
    ...((p = a.parameters) == null ? void 0 : p.docs),
    source: {
      originalSource: `{
  args: {
    variant: 'destructive',
    children: '危险'
  }
}`,
      ...((m = (g = a.parameters) == null ? void 0 : g.docs) == null ? void 0 : m.source),
    },
  },
};
var v, f, h;
t.parameters = {
  ...t.parameters,
  docs: {
    ...((v = t.parameters) == null ? void 0 : v.docs),
    source: {
      originalSource: `{
  args: {
    variant: 'outline',
    children: '描边'
  }
}`,
      ...((h = (f = t.parameters) == null ? void 0 : f.docs) == null ? void 0 : h.source),
    },
  },
};
var b, x, y;
s.parameters = {
  ...s.parameters,
  docs: {
    ...((b = s.parameters) == null ? void 0 : b.docs),
    source: {
      originalSource: `{
  args: {
    variant: 'ghost',
    children: '幽灵'
  }
}`,
      ...((y = (x = s.parameters) == null ? void 0 : x.docs) == null ? void 0 : y.source),
    },
  },
};
const R = ['Default', 'Secondary', 'Destructive', 'Outline', 'Ghost'];
export {
  e as Default,
  a as Destructive,
  s as Ghost,
  t as Outline,
  r as Secondary,
  R as __namedExportsOrder,
  P as default,
};
