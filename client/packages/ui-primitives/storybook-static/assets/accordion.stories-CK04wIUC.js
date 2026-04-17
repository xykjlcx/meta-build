import { C as je } from './chevron-down-DwYvEpJJ.js';
import { r as m, R as u } from './index-B3e6rcmj.js';
import { u as _e, c as re } from './index-BAgrSUEs.js';
import { P as Re } from './index-BsSyydlo.js';
import { u as ce } from './index-CXzmB-r4.js';
import { c as Ne, u as ye } from './index-Cjm6v2LU.js';
import { u as G, c as ne } from './index-DclwlaNk.js';
import { u as te } from './index-DuVyFFjR.js';
import { P as y } from './index-Tk7B4GT7.js';
import { j as o } from './jsx-runtime-BjG_zV1W.js';
import { c as L } from './utils-BQHNewu7.js';
import './createLucideIcon-D27BUxB9.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
var E = 'Collapsible',
  [we, ie] = re(E),
  [Pe, K] = we(E),
  ae = m.forwardRef((e, n) => {
    const {
        __scopeCollapsible: r,
        open: c,
        defaultOpen: i,
        disabled: t,
        onOpenChange: a,
        ...l
      } = e,
      [d, p] = G({ prop: c, defaultProp: i ?? !1, onChange: a, caller: E });
    return o.jsx(Pe, {
      scope: r,
      disabled: t,
      contentId: ce(),
      open: d,
      onOpenToggle: m.useCallback(() => p((f) => !f), [p]),
      children: o.jsx(y.div, {
        'data-state': F(d),
        'data-disabled': t ? '' : void 0,
        ...l,
        ref: n,
      }),
    });
  });
ae.displayName = E;
var se = 'CollapsibleTrigger',
  le = m.forwardRef((e, n) => {
    const { __scopeCollapsible: r, ...c } = e,
      i = K(se, r);
    return o.jsx(y.button, {
      type: 'button',
      'aria-controls': i.contentId,
      'aria-expanded': i.open || !1,
      'data-state': F(i.open),
      'data-disabled': i.disabled ? '' : void 0,
      disabled: i.disabled,
      ...c,
      ref: n,
      onClick: ne(e.onClick, i.onOpenToggle),
    });
  });
le.displayName = se;
var z = 'CollapsibleContent',
  de = m.forwardRef((e, n) => {
    const { forceMount: r, ...c } = e,
      i = K(z, e.__scopeCollapsible);
    return o.jsx(Re, {
      present: r || i.open,
      children: ({ present: t }) => o.jsx(Te, { ...c, ref: n, present: t }),
    });
  });
de.displayName = z;
var Te = m.forwardRef((e, n) => {
  const { __scopeCollapsible: r, present: c, children: i, ...t } = e,
    a = K(z, r),
    [l, d] = m.useState(c),
    p = m.useRef(null),
    f = te(n, p),
    g = m.useRef(0),
    b = g.current,
    A = m.useRef(0),
    R = A.current,
    v = a.open || l,
    C = m.useRef(v),
    h = m.useRef(void 0);
  return (
    m.useEffect(() => {
      const s = requestAnimationFrame(() => (C.current = !1));
      return () => cancelAnimationFrame(s);
    }, []),
    _e(() => {
      const s = p.current;
      if (s) {
        (h.current = h.current || {
          transitionDuration: s.style.transitionDuration,
          animationName: s.style.animationName,
        }),
          (s.style.transitionDuration = '0s'),
          (s.style.animationName = 'none');
        const I = s.getBoundingClientRect();
        (g.current = I.height),
          (A.current = I.width),
          C.current ||
            ((s.style.transitionDuration = h.current.transitionDuration),
            (s.style.animationName = h.current.animationName)),
          d(c);
      }
    }, [a.open, c]),
    o.jsx(y.div, {
      'data-state': F(a.open),
      'data-disabled': a.disabled ? '' : void 0,
      id: a.contentId,
      hidden: !v,
      ...t,
      ref: f,
      style: {
        '--radix-collapsible-content-height': b ? `${b}px` : void 0,
        '--radix-collapsible-content-width': R ? `${R}px` : void 0,
        ...e.style,
      },
      children: v && i,
    })
  );
});
function F(e) {
  return e ? 'open' : 'closed';
}
var Ee = ae,
  Se = le,
  De = de,
  x = 'Accordion',
  Oe = ['Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'],
  [B, Me, ke] = Ne(x),
  [S] = re(x, [ke, ie]),
  U = ie(),
  pe = u.forwardRef((e, n) => {
    const { type: r, ...c } = e,
      i = c,
      t = c;
    return o.jsx(B.Provider, {
      scope: e.__scopeAccordion,
      children: r === 'multiple' ? o.jsx(Le, { ...t, ref: n }) : o.jsx(He, { ...i, ref: n }),
    });
  });
pe.displayName = x;
var [ue, $e] = S(x),
  [me, Ve] = S(x, { collapsible: !1 }),
  He = u.forwardRef((e, n) => {
    const { value: r, defaultValue: c, onValueChange: i = () => {}, collapsible: t = !1, ...a } = e,
      [l, d] = G({ prop: r, defaultProp: c ?? '', onChange: i, caller: x });
    return o.jsx(ue, {
      scope: e.__scopeAccordion,
      value: u.useMemo(() => (l ? [l] : []), [l]),
      onItemOpen: d,
      onItemClose: u.useCallback(() => t && d(''), [t, d]),
      children: o.jsx(me, {
        scope: e.__scopeAccordion,
        collapsible: t,
        children: o.jsx(fe, { ...a, ref: n }),
      }),
    });
  }),
  Le = u.forwardRef((e, n) => {
    const { value: r, defaultValue: c, onValueChange: i = () => {}, ...t } = e,
      [a, l] = G({ prop: r, defaultProp: c ?? [], onChange: i, caller: x }),
      d = u.useCallback((f) => l((g = []) => [...g, f]), [l]),
      p = u.useCallback((f) => l((g = []) => g.filter((b) => b !== f)), [l]);
    return o.jsx(ue, {
      scope: e.__scopeAccordion,
      value: a,
      onItemOpen: d,
      onItemClose: p,
      children: o.jsx(me, {
        scope: e.__scopeAccordion,
        collapsible: !0,
        children: o.jsx(fe, { ...t, ref: n }),
      }),
    });
  }),
  [Ge, D] = S(x),
  fe = u.forwardRef((e, n) => {
    const { __scopeAccordion: r, disabled: c, dir: i, orientation: t = 'vertical', ...a } = e,
      l = u.useRef(null),
      d = te(l, n),
      p = Me(r),
      g = ye(i) === 'ltr',
      b = ne(e.onKeyDown, (A) => {
        var Y;
        if (!Oe.includes(A.key)) return;
        const R = A.target,
          v = p().filter((V) => {
            var J;
            return !((J = V.ref.current) != null && J.disabled);
          }),
          C = v.findIndex((V) => V.ref.current === R),
          h = v.length;
        if (C === -1) return;
        A.preventDefault();
        let s = C;
        const I = 0,
          M = h - 1,
          k = () => {
            (s = C + 1), s > M && (s = I);
          },
          $ = () => {
            (s = C - 1), s < I && (s = M);
          };
        switch (A.key) {
          case 'Home':
            s = I;
            break;
          case 'End':
            s = M;
            break;
          case 'ArrowRight':
            t === 'horizontal' && (g ? k() : $());
            break;
          case 'ArrowDown':
            t === 'vertical' && k();
            break;
          case 'ArrowLeft':
            t === 'horizontal' && (g ? $() : k());
            break;
          case 'ArrowUp':
            t === 'vertical' && $();
            break;
        }
        const Ie = s % h;
        (Y = v[Ie].ref.current) == null || Y.focus();
      });
    return o.jsx(Ge, {
      scope: r,
      disabled: c,
      direction: i,
      orientation: t,
      children: o.jsx(B.Slot, {
        scope: r,
        children: o.jsx(y.div, { ...a, 'data-orientation': t, ref: d, onKeyDown: c ? void 0 : b }),
      }),
    });
  }),
  T = 'AccordionItem',
  [Ke, q] = S(T),
  ge = u.forwardRef((e, n) => {
    const { __scopeAccordion: r, value: c, ...i } = e,
      t = D(T, r),
      a = $e(T, r),
      l = U(r),
      d = ce(),
      p = (c && a.value.includes(c)) || !1,
      f = t.disabled || e.disabled;
    return o.jsx(Ke, {
      scope: r,
      open: p,
      disabled: f,
      triggerId: d,
      children: o.jsx(Ee, {
        'data-orientation': t.orientation,
        'data-state': be(p),
        ...l,
        ...i,
        ref: n,
        disabled: f,
        open: p,
        onOpenChange: (g) => {
          g ? a.onItemOpen(c) : a.onItemClose(c);
        },
      }),
    });
  });
ge.displayName = T;
var xe = 'AccordionHeader',
  Ae = u.forwardRef((e, n) => {
    const { __scopeAccordion: r, ...c } = e,
      i = D(x, r),
      t = q(xe, r);
    return o.jsx(y.h3, {
      'data-orientation': i.orientation,
      'data-state': be(t.open),
      'data-disabled': t.disabled ? '' : void 0,
      ...c,
      ref: n,
    });
  });
Ae.displayName = xe;
var H = 'AccordionTrigger',
  ve = u.forwardRef((e, n) => {
    const { __scopeAccordion: r, ...c } = e,
      i = D(x, r),
      t = q(H, r),
      a = Ve(H, r),
      l = U(r);
    return o.jsx(B.ItemSlot, {
      scope: r,
      children: o.jsx(Se, {
        'aria-disabled': (t.open && !a.collapsible) || void 0,
        'data-orientation': i.orientation,
        id: t.triggerId,
        ...l,
        ...c,
        ref: n,
      }),
    });
  });
ve.displayName = H;
var Ce = 'AccordionContent',
  he = u.forwardRef((e, n) => {
    const { __scopeAccordion: r, ...c } = e,
      i = D(x, r),
      t = q(Ce, r),
      a = U(r);
    return o.jsx(De, {
      role: 'region',
      'aria-labelledby': t.triggerId,
      'data-orientation': i.orientation,
      ...a,
      ...c,
      ref: n,
      style: {
        '--radix-accordion-content-height': 'var(--radix-collapsible-content-height)',
        '--radix-accordion-content-width': 'var(--radix-collapsible-content-width)',
        ...e.style,
      },
    });
  });
he.displayName = Ce;
function be(e) {
  return e ? 'open' : 'closed';
}
var ze = pe,
  Fe = ge,
  Be = Ae,
  Ue = ve,
  qe = he;
function O({ ...e }) {
  return o.jsx(ze, { 'data-slot': 'accordion', ...e });
}
function j({ className: e, ...n }) {
  return o.jsx(Fe, {
    'data-slot': 'accordion-item',
    className: L('border-b last:border-b-0', e),
    ...n,
  });
}
function _({ className: e, children: n, ...r }) {
  return o.jsx(Be, {
    className: 'flex',
    children: o.jsxs(Ue, {
      'data-slot': 'accordion-trigger',
      className: L(
        'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
        e,
      ),
      ...r,
      children: [
        n,
        o.jsx(je, {
          className:
            'pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200',
        }),
      ],
    }),
  });
}
function N({ className: e, children: n, ...r }) {
  return o.jsx(qe, {
    'data-slot': 'accordion-content',
    className:
      'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    ...r,
    children: o.jsx('div', { className: L('pt-0 pb-4', e), children: n }),
  });
}
O.__docgenInfo = { description: '', methods: [], displayName: 'Accordion' };
j.__docgenInfo = { description: '', methods: [], displayName: 'AccordionItem' };
_.__docgenInfo = { description: '', methods: [], displayName: 'AccordionTrigger' };
N.__docgenInfo = { description: '', methods: [], displayName: 'AccordionContent' };
const so = {
    title: 'Primitives/Accordion',
    component: O,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  w = {
    args: { type: 'single', collapsible: !0 },
    render: (e) =>
      o.jsxs(O, {
        ...e,
        className: 'w-[400px]',
        children: [
          o.jsxs(j, {
            value: 'item-1',
            children: [
              o.jsx(_, { children: '这是可以退款的吗？' }),
              o.jsx(N, { children: '是的，可以在购买后 30 天内申请退款。' }),
            ],
          }),
          o.jsxs(j, {
            value: 'item-2',
            children: [
              o.jsx(_, { children: '支持哪些支付方式？' }),
              o.jsx(N, { children: '支持支付宝、微信支付和银行卡。' }),
            ],
          }),
          o.jsxs(j, {
            value: 'item-3',
            children: [
              o.jsx(_, { children: '如何联系客服？' }),
              o.jsx(N, { children: '您可以通过工单系统或在线聊天联系我们。' }),
            ],
          }),
        ],
      }),
  },
  P = {
    args: { type: 'multiple' },
    render: (e) =>
      o.jsxs(O, {
        ...e,
        className: 'w-[400px]',
        children: [
          o.jsxs(j, {
            value: 'item-1',
            children: [
              o.jsx(_, { children: '第一项' }),
              o.jsx(N, { children: '可以同时展开多项。' }),
            ],
          }),
          o.jsxs(j, {
            value: 'item-2',
            children: [
              o.jsx(_, { children: '第二项' }),
              o.jsx(N, { children: '试试同时展开多个。' }),
            ],
          }),
        ],
      }),
  };
var Q, W, X;
w.parameters = {
  ...w.parameters,
  docs: {
    ...((Q = w.parameters) == null ? void 0 : Q.docs),
    source: {
      originalSource: `{
  args: {
    type: 'single',
    collapsible: true
  },
  render: args => <Accordion {...args} className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>这是可以退款的吗？</AccordionTrigger>
        <AccordionContent>是的，可以在购买后 30 天内申请退款。</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>支持哪些支付方式？</AccordionTrigger>
        <AccordionContent>支持支付宝、微信支付和银行卡。</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>如何联系客服？</AccordionTrigger>
        <AccordionContent>您可以通过工单系统或在线聊天联系我们。</AccordionContent>
      </AccordionItem>
    </Accordion>
}`,
      ...((X = (W = w.parameters) == null ? void 0 : W.docs) == null ? void 0 : X.source),
    },
  },
};
var Z, ee, oe;
P.parameters = {
  ...P.parameters,
  docs: {
    ...((Z = P.parameters) == null ? void 0 : Z.docs),
    source: {
      originalSource: `{
  args: {
    type: 'multiple'
  },
  render: args => <Accordion {...args} className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>第一项</AccordionTrigger>
        <AccordionContent>可以同时展开多项。</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>第二项</AccordionTrigger>
        <AccordionContent>试试同时展开多个。</AccordionContent>
      </AccordionItem>
    </Accordion>
}`,
      ...((oe = (ee = P.parameters) == null ? void 0 : ee.docs) == null ? void 0 : oe.source),
    },
  },
};
const lo = ['Default', 'Multiple'];
export { w as Default, P as Multiple, lo as __namedExportsOrder, so as default };
