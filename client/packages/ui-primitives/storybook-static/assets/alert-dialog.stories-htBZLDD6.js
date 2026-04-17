import { B as _ } from './button-BqedyRxs.js';
import { r as i } from './index-B3e6rcmj.js';
import { c as J } from './index-BAgrSUEs.js';
import { c as re } from './index-DclwlaNk.js';
import { a as K, u as h } from './index-DuVyFFjR.js';
import {
  c as N,
  R as Q,
  T as U,
  W as X,
  C as Z,
  P as ae,
  b as ee,
  O as oe,
  D as te,
  a as y,
} from './index-H2JHQ55g.js';
import { j as t } from './jsx-runtime-BjG_zV1W.js';
import { c as n } from './utils-BQHNewu7.js';
import './index-D1SQP9Z-.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-CXzmB-r4.js';
import './index-CnCkN4Kb.js';
import './index-Tk7B4GT7.js';
import './index-JG1J0hlI.js';
import './index-CLFlh7pk.js';
import './index-D8RfjXkI.js';
import './index-npCAFBsl.js';
import './index-BsSyydlo.js';
var j = 'AlertDialog',
  [le] = J(j, [N]),
  s = N(),
  C = (e) => {
    const { __scopeAlertDialog: a, ...o } = e,
      r = s(a);
    return t.jsx(Q, { ...r, ...o, modal: !0 });
  };
C.displayName = j;
var ie = 'AlertDialogTrigger',
  b = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, ...r } = e,
      l = s(o);
    return t.jsx(U, { ...l, ...r, ref: a });
  });
b.displayName = ie;
var se = 'AlertDialogPortal',
  T = (e) => {
    const { __scopeAlertDialog: a, ...o } = e,
      r = s(a);
    return t.jsx(ae, { ...r, ...o });
  };
T.displayName = se;
var ne = 'AlertDialogOverlay',
  E = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, ...r } = e,
      l = s(o);
    return t.jsx(oe, { ...l, ...r, ref: a });
  });
E.displayName = ne;
var d = 'AlertDialogContent',
  [de, ce] = le(d),
  ge = K('AlertDialogContent'),
  R = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, children: r, ...l } = e,
      u = s(o),
      g = i.useRef(null),
      Y = h(a, g),
      f = i.useRef(null);
    return t.jsx(X, {
      contentName: d,
      titleName: w,
      docsSlug: 'alert-dialog',
      children: t.jsx(de, {
        scope: o,
        cancelRef: f,
        children: t.jsxs(Z, {
          role: 'alertdialog',
          ...u,
          ...l,
          ref: Y,
          onOpenAutoFocus: re(l.onOpenAutoFocus, (c) => {
            var A;
            c.preventDefault(), (A = f.current) == null || A.focus({ preventScroll: !0 });
          }),
          onPointerDownOutside: (c) => c.preventDefault(),
          onInteractOutside: (c) => c.preventDefault(),
          children: [t.jsx(ge, { children: r }), t.jsx(ue, { contentRef: g })],
        }),
      }),
    });
  });
R.displayName = d;
var w = 'AlertDialogTitle',
  P = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, ...r } = e,
      l = s(o);
    return t.jsx(ee, { ...l, ...r, ref: a });
  });
P.displayName = w;
var S = 'AlertDialogDescription',
  I = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, ...r } = e,
      l = s(o);
    return t.jsx(te, { ...l, ...r, ref: a });
  });
I.displayName = S;
var pe = 'AlertDialogAction',
  O = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, ...r } = e,
      l = s(o);
    return t.jsx(y, { ...l, ...r, ref: a });
  });
O.displayName = pe;
var z = 'AlertDialogCancel',
  $ = i.forwardRef((e, a) => {
    const { __scopeAlertDialog: o, ...r } = e,
      { cancelRef: l } = ce(z, o),
      u = s(o),
      g = h(a, l);
    return t.jsx(y, { ...u, ...r, ref: g });
  });
$.displayName = z;
var ue = ({ contentRef: e }) => {
    const a = `\`${d}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${d}\` by passing a \`${S}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${d}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
    return (
      i.useEffect(() => {
        var r;
        document.getElementById(
          (r = e.current) == null ? void 0 : r.getAttribute('aria-describedby'),
        ) || console.warn(a);
      }, [a, e]),
      null
    );
  },
  me = C,
  fe = b,
  Ae = T,
  De = E,
  ve = R,
  xe = O,
  _e = $,
  he = P,
  ye = I;
function m({ ...e }) {
  return t.jsx(me, { 'data-slot': 'alert-dialog', ...e });
}
function M({ ...e }) {
  return t.jsx(fe, { 'data-slot': 'alert-dialog-trigger', ...e });
}
function F({ ...e }) {
  return t.jsx(Ae, { 'data-slot': 'alert-dialog-portal', ...e });
}
function q({ className: e, ...a }) {
  return t.jsx(De, {
    'data-slot': 'alert-dialog-overlay',
    className: n(
      'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      e,
    ),
    ...a,
  });
}
function V({ className: e, size: a = 'default', ...o }) {
  return t.jsxs(F, {
    children: [
      t.jsx(q, {}),
      t.jsx(ve, {
        'data-slot': 'alert-dialog-content',
        'data-size': a,
        className: n(
          'group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg',
          e,
        ),
        ...o,
      }),
    ],
  });
}
function H({ className: e, ...a }) {
  return t.jsx('div', {
    'data-slot': 'alert-dialog-header',
    className: n(
      'grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
      e,
    ),
    ...a,
  });
}
function L({ className: e, ...a }) {
  return t.jsx('div', {
    'data-slot': 'alert-dialog-footer',
    className: n(
      'flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
      e,
    ),
    ...a,
  });
}
function B({ className: e, ...a }) {
  return t.jsx(he, {
    'data-slot': 'alert-dialog-title',
    className: n(
      'text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
      e,
    ),
    ...a,
  });
}
function G({ className: e, ...a }) {
  return t.jsx(ye, {
    'data-slot': 'alert-dialog-description',
    className: n('text-sm text-muted-foreground', e),
    ...a,
  });
}
function W({ className: e, variant: a = 'default', size: o = 'default', ...r }) {
  return t.jsx(_, {
    variant: a,
    size: o,
    asChild: !0,
    children: t.jsx(xe, { 'data-slot': 'alert-dialog-action', className: n(e), ...r }),
  });
}
function k({ className: e, variant: a = 'outline', size: o = 'default', ...r }) {
  return t.jsx(_, {
    variant: a,
    size: o,
    asChild: !0,
    children: t.jsx(_e, { 'data-slot': 'alert-dialog-cancel', className: n(e), ...r }),
  });
}
m.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialog' };
W.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'AlertDialogAction',
  props: {
    variant: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
    size: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
  },
};
k.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'AlertDialogCancel',
  props: {
    variant: { defaultValue: { value: "'outline'", computed: !1 }, required: !1 },
    size: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
  },
};
V.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'AlertDialogContent',
  props: {
    size: {
      required: !1,
      tsType: {
        name: 'union',
        raw: "'default' | 'sm'",
        elements: [
          { name: 'literal', value: "'default'" },
          { name: 'literal', value: "'sm'" },
        ],
      },
      description: '',
      defaultValue: { value: "'default'", computed: !1 },
    },
  },
};
G.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogDescription' };
L.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogFooter' };
H.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogHeader' };
q.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogOverlay' };
F.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogPortal' };
B.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogTitle' };
M.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogTrigger' };
const He = {
    title: 'Primitives/AlertDialog',
    component: m,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  p = {
    render: () =>
      t.jsxs(m, {
        children: [
          t.jsx(M, {
            asChild: !0,
            children: t.jsx('button', {
              type: 'button',
              className: 'rounded-md border border-destructive px-4 py-2 text-sm text-destructive',
              children: '删除账户',
            }),
          }),
          t.jsxs(V, {
            children: [
              t.jsxs(H, {
                children: [
                  t.jsx(B, { children: '确认删除？' }),
                  t.jsx(G, { children: '此操作不可撤销。您的账户和所有数据将被永久删除。' }),
                ],
              }),
              t.jsxs(L, {
                children: [t.jsx(k, { children: '取消' }), t.jsx(W, { children: '确认删除' })],
              }),
            ],
          }),
        ],
      }),
  };
var D, v, x;
p.parameters = {
  ...p.parameters,
  docs: {
    ...((D = p.parameters) == null ? void 0 : D.docs),
    source: {
      originalSource: `{
  render: () => <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className="rounded-md border border-destructive px-4 py-2 text-sm text-destructive">
          删除账户
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作不可撤销。您的账户和所有数据将被永久删除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction>确认删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
}`,
      ...((x = (v = p.parameters) == null ? void 0 : v.docs) == null ? void 0 : x.source),
    },
  },
};
const Le = ['Default'];
export { p as Default, Le as __namedExportsOrder, He as default };
