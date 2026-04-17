import { r as o } from './index-B3e6rcmj.js';
import { fn as pe } from './index-DgAF9SIF.js';
import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { s as L, t as fe, F as he, u as ue, a as w, o as xe } from './nx-form-BOcfYuQR.js';
import {
  k as $,
  I as F,
  D as U,
  i as X,
  j as Y,
  s as ce,
  r as de,
  l as ee,
  B as i,
  q as ie,
  o as le,
  t as me,
  n as ne,
  p as oe,
  A as se,
  m as te,
} from './table-BAJRp_jF.js';
import './index-JG1J0hlI.js';
import './_commonjsHelpers-Cpj98o6Y.js';
function d({
  open: t,
  onOpenChange: a,
  title: r,
  description: s,
  side: D = 'right',
  schema: j,
  defaultValues: b,
  onSubmit: g,
  submitLabel: y,
  cancelLabel: c,
  closeLabel: m,
  dirtyConfirmText: p,
  children: C,
}) {
  return j
    ? e.jsx(De, {
        open: t,
        onOpenChange: a,
        title: r,
        description: s,
        side: D,
        schema: j,
        defaultValues: b,
        onSubmit: g,
        submitLabel: y,
        cancelLabel: c,
        closeLabel: m,
        dirtyConfirmText: p,
        children: C,
      })
    : e.jsx(U, {
        open: t,
        onOpenChange: a,
        children: e.jsxs(X, {
          side: D,
          closeLabel: m,
          children: [
            e.jsxs(Y, { children: [e.jsx($, { children: r }), s && e.jsx(ee, { children: s })] }),
            e.jsx('div', { className: 'flex-1 overflow-auto px-6', children: C }),
          ],
        }),
      });
}
function De({
  open: t,
  onOpenChange: a,
  title: r,
  description: s,
  side: D,
  schema: j,
  defaultValues: b,
  onSubmit: g,
  submitLabel: y,
  cancelLabel: c,
  closeLabel: m,
  dirtyConfirmText: p,
  children: C,
}) {
  const [O, N] = o.useState(!1),
    l = ue({ resolver: fe(j), defaultValues: b }),
    { isDirty: S } = l.formState,
    v = o.useCallback(
      (u) => {
        if (!u && S && p) {
          N(!0);
          return;
        }
        u || l.reset(), a(u);
      },
      [S, p, a, l],
    ),
    ae = o.useCallback(() => {
      N(!1), l.reset(), a(!1);
    }, [a, l]);
  return e.jsxs(e.Fragment, {
    children: [
      e.jsx(U, {
        open: t,
        onOpenChange: v,
        children: e.jsxs(X, {
          side: D,
          closeLabel: m,
          children: [
            e.jsxs(Y, { children: [e.jsx($, { children: r }), s && e.jsx(ee, { children: s })] }),
            e.jsx(he, {
              ...l,
              children: e.jsxs('form', {
                onSubmit: g ? l.handleSubmit(g) : (u) => u.preventDefault(),
                className: 'flex flex-1 flex-col overflow-hidden',
                noValidate: !0,
                children: [
                  e.jsx('div', { className: 'flex-1 space-y-4 overflow-auto px-6', children: C }),
                  e.jsxs(te, {
                    children: [
                      c &&
                        e.jsx(i, {
                          type: 'button',
                          variant: 'outline',
                          onClick: () => v(!1),
                          children: c,
                        }),
                      y && e.jsx(i, { type: 'submit', children: y }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
      }),
      e.jsx(se, {
        open: O,
        onOpenChange: N,
        children: e.jsxs(ne, {
          children: [
            e.jsxs(le, { children: [e.jsx(oe, { children: p }), e.jsx(ie, {})] }),
            e.jsxs(de, {
              children: [
                e.jsx(ce, { children: c }),
                e.jsx(me, { variant: 'destructive', onClick: ae, children: m }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
d.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxDrawer',
  props: {
    open: { required: !0, tsType: { name: 'boolean' }, description: '' },
    onOpenChange: {
      required: !0,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(open: boolean) => void',
        signature: {
          arguments: [{ type: { name: 'boolean' }, name: 'open' }],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    title: { required: !0, tsType: { name: 'ReactNode' }, description: '' },
    description: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    side: {
      required: !1,
      tsType: {
        name: 'union',
        raw: "'left' | 'right' | 'top' | 'bottom'",
        elements: [
          { name: 'literal', value: "'left'" },
          { name: 'literal', value: "'right'" },
          { name: 'literal', value: "'top'" },
          { name: 'literal', value: "'bottom'" },
        ],
      },
      description: '',
      defaultValue: { value: "'right'", computed: !1 },
    },
    schema: {
      required: !1,
      tsType: {
        name: 'ZodSchema',
        elements: [{ name: 'TFormValues' }],
        raw: 'ZodSchema<TFormValues>',
      },
      description: '',
    },
    defaultValues: {
      required: !1,
      tsType: {
        name: 'DefaultValues',
        elements: [{ name: 'TFormValues' }],
        raw: 'DefaultValues<TFormValues>',
      },
      description: '',
    },
    onSubmit: {
      required: !1,
      tsType: {
        name: 'SubmitHandler',
        elements: [{ name: 'TFormValues' }],
        raw: 'SubmitHandler<TFormValues>',
      },
      description: '',
    },
    submitLabel: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    cancelLabel: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    closeLabel: {
      required: !0,
      tsType: { name: 'string' },
      description: '关闭按钮的 ARIA 标签（无障碍）',
    },
    dirtyConfirmText: {
      required: !1,
      tsType: { name: 'ReactNode' },
      description: '脏检查确认文案 — 有值时启用脏检查',
    },
    children: { required: !0, tsType: { name: 'ReactNode' }, description: '' },
  },
};
const Ne = {
    title: 'Patterns/NxDrawer',
    component: d,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  re = xe({ name: L().min(2, 'At least 2 characters'), email: L().email('Invalid email') }),
  n = {
    args: {
      open: !0,
      onOpenChange: pe(),
      title: 'Detail',
      description: 'View item details',
      closeLabel: 'Close drawer',
      children: null,
    },
    render: () => {
      const [a, r] = o.useState(!1);
      return e.jsxs(e.Fragment, {
        children: [
          e.jsx(i, { onClick: () => r(!0), children: 'Open Display Drawer' }),
          e.jsx(d, {
            open: a,
            onOpenChange: r,
            title: 'Item Detail',
            description: 'Read-only information',
            closeLabel: 'Close drawer',
            children: e.jsxs('dl', {
              className: 'space-y-3',
              children: [
                e.jsxs('div', {
                  children: [
                    e.jsx('dt', {
                      className: 'text-sm font-medium text-muted-foreground',
                      children: 'Name',
                    }),
                    e.jsx('dd', { children: 'Alice' }),
                  ],
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('dt', {
                      className: 'text-sm font-medium text-muted-foreground',
                      children: 'Email',
                    }),
                    e.jsx('dd', { children: 'alice@example.com' }),
                  ],
                }),
              ],
            }),
          }),
        ],
      });
    },
  },
  f = {
    args: { ...n.args },
    render: () => {
      const [a, r] = o.useState(!1);
      return e.jsxs(e.Fragment, {
        children: [
          e.jsx(i, { onClick: () => r(!0), children: 'Open Form Drawer' }),
          e.jsxs(d, {
            open: a,
            onOpenChange: r,
            title: 'Add Item',
            closeLabel: 'Close drawer',
            schema: re,
            defaultValues: { name: '', email: '' },
            onSubmit: (s) => {
              r(!1);
            },
            submitLabel: 'Save',
            cancelLabel: 'Cancel',
            children: [
              e.jsx(w, {
                name: 'name',
                label: 'Name',
                required: !0,
                children: e.jsx(F, { placeholder: 'Enter name' }),
              }),
              e.jsx(w, {
                name: 'email',
                label: 'Email',
                required: !0,
                children: e.jsx(F, { placeholder: 'Enter email' }),
              }),
            ],
          }),
        ],
      });
    },
  },
  h = {
    args: { ...n.args },
    render: () => {
      const [a, r] = o.useState(!1);
      return e.jsxs(e.Fragment, {
        children: [
          e.jsx(i, { onClick: () => r(!0), children: 'Open Dirty Check Drawer' }),
          e.jsxs(d, {
            open: a,
            onOpenChange: r,
            title: 'Edit Item',
            closeLabel: 'Close drawer',
            schema: re,
            defaultValues: { name: 'Alice', email: 'alice@example.com' },
            onSubmit: (s) => {
              r(!1);
            },
            submitLabel: 'Save',
            cancelLabel: 'Cancel',
            dirtyConfirmText: 'Discard unsaved changes?',
            children: [
              e.jsx(w, {
                name: 'name',
                label: 'Name',
                required: !0,
                children: e.jsx(F, { placeholder: 'Enter name' }),
              }),
              e.jsx(w, {
                name: 'email',
                label: 'Email',
                required: !0,
                children: e.jsx(F, { placeholder: 'Enter email' }),
              }),
            ],
          }),
        ],
      });
    },
  },
  x = {
    args: { ...n.args },
    render: () => {
      const [a, r] = o.useState(!1);
      return e.jsxs(e.Fragment, {
        children: [
          e.jsx(i, { onClick: () => r(!0), children: 'Open Left Drawer' }),
          e.jsx(d, {
            open: a,
            onOpenChange: r,
            title: 'Left Drawer',
            description: 'Opens from the left side',
            closeLabel: 'Close drawer',
            side: 'left',
            children: e.jsx('p', { children: 'Content on the left.' }),
          }),
        ],
      });
    },
  };
var T, V, q, k, A;
n.parameters = {
  ...n.parameters,
  docs: {
    ...((T = n.parameters) == null ? void 0 : T.docs),
    source: {
      originalSource: `{
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Detail',
    description: 'View item details',
    closeLabel: 'Close drawer',
    children: null
  },
  render: function DisplayStory() {
    const [open, setOpen] = useState(false);
    return <>
        <Button onClick={() => setOpen(true)}>Open Display Drawer</Button>
        <NxDrawer open={open} onOpenChange={setOpen} title="Item Detail" description="Read-only information" closeLabel="Close drawer">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd>Alice</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd>alice@example.com</dd>
            </div>
          </dl>
        </NxDrawer>
      </>;
  }
}`,
      ...((q = (V = n.parameters) == null ? void 0 : V.docs) == null ? void 0 : q.source),
    },
    description: {
      story: '纯展示模式 — 无表单，只有标题和内容',
      ...((A = (k = n.parameters) == null ? void 0 : k.docs) == null ? void 0 : A.description),
    },
  },
};
var E, I, B, R, _;
f.parameters = {
  ...f.parameters,
  docs: {
    ...((E = f.parameters) == null ? void 0 : E.docs),
    source: {
      originalSource: `{
  args: {
    ...Display.args
  },
  render: function FormModeStory() {
    const [open, setOpen] = useState(false);
    return <>
        <Button onClick={() => setOpen(true)}>Open Form Drawer</Button>
        <NxDrawer<FormValues> open={open} onOpenChange={setOpen} title="Add Item" closeLabel="Close drawer" schema={schema} defaultValues={{
        name: '',
        email: ''
      }} onSubmit={_data => {
        setOpen(false);
      }} submitLabel="Save" cancelLabel="Cancel">
          <NxFormField<FormValues> name="name" label="Name" required>
            <Input placeholder="Enter name" />
          </NxFormField>
          <NxFormField<FormValues> name="email" label="Email" required>
            <Input placeholder="Enter email" />
          </NxFormField>
        </NxDrawer>
      </>;
  }
}`,
      ...((B = (I = f.parameters) == null ? void 0 : I.docs) == null ? void 0 : B.source),
    },
    description: {
      story: '表单模式 — 有 schema + submit',
      ...((_ = (R = f.parameters) == null ? void 0 : R.docs) == null ? void 0 : _.description),
    },
  },
};
var M, H, P, W, Z;
h.parameters = {
  ...h.parameters,
  docs: {
    ...((M = h.parameters) == null ? void 0 : M.docs),
    source: {
      originalSource: `{
  args: {
    ...Display.args
  },
  render: function DirtyCheckStory() {
    const [open, setOpen] = useState(false);
    return <>
        <Button onClick={() => setOpen(true)}>Open Dirty Check Drawer</Button>
        <NxDrawer<FormValues> open={open} onOpenChange={setOpen} title="Edit Item" closeLabel="Close drawer" schema={schema} defaultValues={{
        name: 'Alice',
        email: 'alice@example.com'
      }} onSubmit={_data => {
        setOpen(false);
      }} submitLabel="Save" cancelLabel="Cancel" dirtyConfirmText="Discard unsaved changes?">
          <NxFormField<FormValues> name="name" label="Name" required>
            <Input placeholder="Enter name" />
          </NxFormField>
          <NxFormField<FormValues> name="email" label="Email" required>
            <Input placeholder="Enter email" />
          </NxFormField>
        </NxDrawer>
      </>;
  }
}`,
      ...((P = (H = h.parameters) == null ? void 0 : H.docs) == null ? void 0 : P.source),
    },
    description: {
      story: '脏检查模式 — 修改表单后关闭会弹确认',
      ...((Z = (W = h.parameters) == null ? void 0 : W.docs) == null ? void 0 : Z.description),
    },
  },
};
var z, G, J, K, Q;
x.parameters = {
  ...x.parameters,
  docs: {
    ...((z = x.parameters) == null ? void 0 : z.docs),
    source: {
      originalSource: `{
  args: {
    ...Display.args
  },
  render: function LeftSideStory() {
    const [open, setOpen] = useState(false);
    return <>
        <Button onClick={() => setOpen(true)}>Open Left Drawer</Button>
        <NxDrawer open={open} onOpenChange={setOpen} title="Left Drawer" description="Opens from the left side" closeLabel="Close drawer" side="left">
          <p>Content on the left.</p>
        </NxDrawer>
      </>;
  }
}`,
      ...((J = (G = x.parameters) == null ? void 0 : G.docs) == null ? void 0 : J.source),
    },
    description: {
      story: '左侧打开',
      ...((Q = (K = x.parameters) == null ? void 0 : K.docs) == null ? void 0 : Q.description),
    },
  },
};
const Oe = ['Display', 'FormMode', 'WithDirtyCheck', 'LeftSide'];
export {
  n as Display,
  f as FormMode,
  x as LeftSide,
  h as WithDirtyCheck,
  Oe as __namedExportsOrder,
  Ne as default,
};
