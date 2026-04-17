import { C as ae } from './check-D7tbsjEZ.js';
import { u as ce } from './index-B0eQv26E.js';
import { r as i } from './index-B3e6rcmj.js';
import { c as se } from './index-BAgrSUEs.js';
import { P as de } from './index-BsSyydlo.js';
import { u as ie } from './index-D61X6AnJ.js';
import { c as B, u as ne } from './index-DclwlaNk.js';
import { u as W } from './index-DuVyFFjR.js';
import { P as N } from './index-Tk7B4GT7.js';
import { j as t } from './jsx-runtime-BjG_zV1W.js';
import { L as le } from './label-CzTCvMPw.js';
import { c as oe } from './utils-BQHNewu7.js';
import './createLucideIcon-D27BUxB9.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
var R = 'Checkbox',
  [ue] = se(R),
  [pe, S] = ue(R);
function me(r) {
  const {
      __scopeCheckbox: a,
      checked: c,
      children: u,
      defaultChecked: s,
      disabled: e,
      form: m,
      name: b,
      onCheckedChange: d,
      required: h,
      value: k = 'on',
      internal_do_not_use_render: l,
    } = r,
    [p, v] = ne({ prop: c, defaultProp: s ?? !1, onChange: d, caller: R }),
    [x, C] = i.useState(null),
    [g, o] = i.useState(null),
    n = i.useRef(!1),
    j = x ? !!m || !!x.closest('form') : !0,
    I = {
      checked: p,
      disabled: e,
      setChecked: v,
      control: x,
      setControl: C,
      name: b,
      form: m,
      value: k,
      hasConsumerStoppedPropagationRef: n,
      required: h,
      defaultChecked: f(s) ? !1 : s,
      isFormControl: j,
      bubbleInput: g,
      setBubbleInput: o,
    };
  return t.jsx(pe, { scope: a, ...I, children: be(l) ? l(I) : u });
}
var X = 'CheckboxTrigger',
  $ = i.forwardRef(({ __scopeCheckbox: r, onKeyDown: a, onClick: c, ...u }, s) => {
    const {
        control: e,
        value: m,
        disabled: b,
        checked: d,
        required: h,
        setControl: k,
        setChecked: l,
        hasConsumerStoppedPropagationRef: p,
        isFormControl: v,
        bubbleInput: x,
      } = S(X, r),
      C = W(s, k),
      g = i.useRef(d);
    return (
      i.useEffect(() => {
        const o = e == null ? void 0 : e.form;
        if (o) {
          const n = () => l(g.current);
          return o.addEventListener('reset', n), () => o.removeEventListener('reset', n);
        }
      }, [e, l]),
      t.jsx(N.button, {
        type: 'button',
        role: 'checkbox',
        'aria-checked': f(d) ? 'mixed' : d,
        'aria-required': h,
        'data-state': ee(d),
        'data-disabled': b ? '' : void 0,
        disabled: b,
        value: m,
        ...u,
        ref: C,
        onKeyDown: B(a, (o) => {
          o.key === 'Enter' && o.preventDefault();
        }),
        onClick: B(c, (o) => {
          l((n) => (f(n) ? !0 : !n)),
            x && v && ((p.current = o.isPropagationStopped()), p.current || o.stopPropagation());
        }),
      })
    );
  });
$.displayName = X;
var J = i.forwardRef((r, a) => {
  const {
    __scopeCheckbox: c,
    name: u,
    checked: s,
    defaultChecked: e,
    required: m,
    disabled: b,
    value: d,
    onCheckedChange: h,
    form: k,
    ...l
  } = r;
  return t.jsx(me, {
    __scopeCheckbox: c,
    checked: s,
    defaultChecked: e,
    disabled: b,
    required: m,
    onCheckedChange: h,
    name: u,
    form: k,
    value: d,
    internal_do_not_use_render: ({ isFormControl: p }) =>
      t.jsxs(t.Fragment, {
        children: [
          t.jsx($, { ...l, ref: a, __scopeCheckbox: c }),
          p && t.jsx(Z, { __scopeCheckbox: c }),
        ],
      }),
  });
});
J.displayName = R;
var Q = 'CheckboxIndicator',
  V = i.forwardRef((r, a) => {
    const { __scopeCheckbox: c, forceMount: u, ...s } = r,
      e = S(Q, c);
    return t.jsx(de, {
      present: u || f(e.checked) || e.checked === !0,
      children: t.jsx(N.span, {
        'data-state': ee(e.checked),
        'data-disabled': e.disabled ? '' : void 0,
        ...s,
        ref: a,
        style: { pointerEvents: 'none', ...r.style },
      }),
    });
  });
V.displayName = Q;
var Y = 'CheckboxBubbleInput',
  Z = i.forwardRef(({ __scopeCheckbox: r, ...a }, c) => {
    const {
        control: u,
        hasConsumerStoppedPropagationRef: s,
        checked: e,
        defaultChecked: m,
        required: b,
        disabled: d,
        name: h,
        value: k,
        form: l,
        bubbleInput: p,
        setBubbleInput: v,
      } = S(Y, r),
      x = W(c, v),
      C = ce(e),
      g = ie(u);
    i.useEffect(() => {
      const n = p;
      if (!n) return;
      const j = window.HTMLInputElement.prototype,
        L = Object.getOwnPropertyDescriptor(j, 'checked').set,
        re = !s.current;
      if (C !== e && L) {
        const te = new Event('click', { bubbles: re });
        (n.indeterminate = f(e)), L.call(n, f(e) ? !1 : e), n.dispatchEvent(te);
      }
    }, [p, C, e, s]);
    const o = i.useRef(f(e) ? !1 : e);
    return t.jsx(N.input, {
      type: 'checkbox',
      'aria-hidden': !0,
      defaultChecked: m ?? o.current,
      required: b,
      disabled: d,
      name: h,
      value: k,
      form: l,
      ...a,
      tabIndex: -1,
      ref: x,
      style: {
        ...a.style,
        ...g,
        position: 'absolute',
        pointerEvents: 'none',
        opacity: 0,
        margin: 0,
        transform: 'translateX(-100%)',
      },
    });
  });
Z.displayName = Y;
function be(r) {
  return typeof r == 'function';
}
function f(r) {
  return r === 'indeterminate';
}
function ee(r) {
  return f(r) ? 'indeterminate' : r ? 'checked' : 'unchecked';
}
function w({ className: r, ...a }) {
  return t.jsx(J, {
    'data-slot': 'checkbox',
    className: oe(
      'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
      r,
    ),
    ...a,
    children: t.jsx(V, {
      'data-slot': 'checkbox-indicator',
      className: 'grid place-content-center text-current transition-none',
      children: t.jsx(ae, { className: 'size-3.5' }),
    }),
  });
}
w.__docgenInfo = { description: '', methods: [], displayName: 'Checkbox' };
const Se = {
    title: 'Primitives/Checkbox',
    component: w,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  y = { args: { 'aria-label': '复选框' } },
  _ = { args: { checked: !0, 'aria-label': '已选中' } },
  E = { args: { disabled: !0, 'aria-label': '禁用' } },
  P = {
    render: () =>
      t.jsxs('div', {
        className: 'flex items-center space-x-2',
        children: [
          t.jsx(w, { id: 'terms' }),
          t.jsx(le, { htmlFor: 'terms', children: '我已阅读并同意服务条款' }),
        ],
      }),
  };
var D, F, M;
y.parameters = {
  ...y.parameters,
  docs: {
    ...((D = y.parameters) == null ? void 0 : D.docs),
    source: {
      originalSource: `{
  args: {
    'aria-label': '复选框'
  }
}`,
      ...((M = (F = y.parameters) == null ? void 0 : F.docs) == null ? void 0 : M.source),
    },
  },
};
var T, q, A;
_.parameters = {
  ..._.parameters,
  docs: {
    ...((T = _.parameters) == null ? void 0 : T.docs),
    source: {
      originalSource: `{
  args: {
    checked: true,
    'aria-label': '已选中'
  }
}`,
      ...((A = (q = _.parameters) == null ? void 0 : q.docs) == null ? void 0 : A.source),
    },
  },
};
var O, z, H;
E.parameters = {
  ...E.parameters,
  docs: {
    ...((O = E.parameters) == null ? void 0 : O.docs),
    source: {
      originalSource: `{
  args: {
    disabled: true,
    'aria-label': '禁用'
  }
}`,
      ...((H = (z = E.parameters) == null ? void 0 : z.docs) == null ? void 0 : H.source),
    },
  },
};
var G, K, U;
P.parameters = {
  ...P.parameters,
  docs: {
    ...((G = P.parameters) == null ? void 0 : G.docs),
    source: {
      originalSource: `{
  render: () => <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">我已阅读并同意服务条款</Label>
    </div>
}`,
      ...((U = (K = P.parameters) == null ? void 0 : K.docs) == null ? void 0 : U.source),
    },
  },
};
const we = ['Default', 'Checked', 'Disabled', 'WithLabel'];
export {
  _ as Checked,
  y as Default,
  E as Disabled,
  P as WithLabel,
  we as __namedExportsOrder,
  Se as default,
};
