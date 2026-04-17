import { r as a } from './index-B3e6rcmj.js';
import { c as V } from './index-BAgrSUEs.js';
import { R as G, C as J, A as K, c as O, a as Q } from './index-BVSSuIN4.js';
import { P as D } from './index-BsSyydlo.js';
import { D as Z } from './index-CnCkN4Kb.js';
import { u as B, c as l } from './index-DclwlaNk.js';
import { u as q } from './index-DuVyFFjR.js';
import { P as Y } from './index-Tk7B4GT7.js';
import { P as X } from './index-npCAFBsl.js';
import { j as r } from './jsx-runtime-BjG_zV1W.js';
import { c as z } from './utils-BQHNewu7.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
import './index-CLFlh7pk.js';
import './index-D61X6AnJ.js';
var T,
  S = 'HoverCard',
  [A] = V(S, [O]),
  b = O(),
  [ee, N] = A(S),
  L = (e) => {
    const {
        __scopeHoverCard: o,
        children: n,
        open: s,
        defaultOpen: i,
        onOpenChange: c,
        openDelay: f = 700,
        closeDelay: m = 300,
      } = e,
      d = b(o),
      v = a.useRef(0),
      u = a.useRef(0),
      h = a.useRef(!1),
      p = a.useRef(!1),
      [C, t] = B({ prop: s, defaultProp: i ?? !1, onChange: c, caller: S }),
      x = a.useCallback(() => {
        clearTimeout(u.current), (v.current = window.setTimeout(() => t(!0), f));
      }, [f, t]),
      g = a.useCallback(() => {
        clearTimeout(v.current),
          !h.current && !p.current && (u.current = window.setTimeout(() => t(!1), m));
      }, [m, t]),
      W = a.useCallback(() => t(!1), [t]);
    return (
      a.useEffect(
        () => () => {
          clearTimeout(v.current), clearTimeout(u.current);
        },
        [],
      ),
      r.jsx(ee, {
        scope: o,
        open: C,
        onOpenChange: t,
        onOpen: x,
        onClose: g,
        onDismiss: W,
        hasSelectionRef: h,
        isPointerDownOnContentRef: p,
        children: r.jsx(G, { ...d, children: n }),
      })
    );
  };
L.displayName = S;
var I = 'HoverCardTrigger',
  M = a.forwardRef((e, o) => {
    const { __scopeHoverCard: n, ...s } = e,
      i = N(I, n),
      c = b(n);
    return r.jsx(K, {
      asChild: !0,
      ...c,
      children: r.jsx(Y.a, {
        'data-state': i.open ? 'open' : 'closed',
        ...s,
        ref: o,
        onPointerEnter: l(e.onPointerEnter, H(i.onOpen)),
        onPointerLeave: l(e.onPointerLeave, H(i.onClose)),
        onFocus: l(e.onFocus, i.onOpen),
        onBlur: l(e.onBlur, i.onClose),
        onTouchStart: l(e.onTouchStart, (f) => f.preventDefault()),
      }),
    });
  });
M.displayName = I;
var w = 'HoverCardPortal',
  [re, te] = A(w, { forceMount: void 0 }),
  k = (e) => {
    const { __scopeHoverCard: o, forceMount: n, children: s, container: i } = e,
      c = N(w, o);
    return r.jsx(re, {
      scope: o,
      forceMount: n,
      children: r.jsx(D, {
        present: n || c.open,
        children: r.jsx(X, { asChild: !0, container: i, children: s }),
      }),
    });
  };
k.displayName = w;
var R = 'HoverCardContent',
  F = a.forwardRef((e, o) => {
    const n = te(R, e.__scopeHoverCard),
      { forceMount: s = n.forceMount, ...i } = e,
      c = N(R, e.__scopeHoverCard);
    return r.jsx(D, {
      present: s || c.open,
      children: r.jsx(oe, {
        'data-state': c.open ? 'open' : 'closed',
        ...i,
        onPointerEnter: l(e.onPointerEnter, H(c.onOpen)),
        onPointerLeave: l(e.onPointerLeave, H(c.onClose)),
        ref: o,
      }),
    });
  });
F.displayName = R;
var oe = a.forwardRef((e, o) => {
    const {
        __scopeHoverCard: n,
        onEscapeKeyDown: s,
        onPointerDownOutside: i,
        onFocusOutside: c,
        onInteractOutside: f,
        ...m
      } = e,
      d = N(R, n),
      v = b(n),
      u = a.useRef(null),
      h = q(o, u),
      [p, C] = a.useState(!1);
    return (
      a.useEffect(() => {
        if (p) {
          const t = document.body;
          return (
            (T = t.style.userSelect || t.style.webkitUserSelect),
            (t.style.userSelect = 'none'),
            (t.style.webkitUserSelect = 'none'),
            () => {
              (t.style.userSelect = T), (t.style.webkitUserSelect = T);
            }
          );
        }
      }, [p]),
      a.useEffect(() => {
        if (u.current) {
          const t = () => {
            C(!1),
              (d.isPointerDownOnContentRef.current = !1),
              setTimeout(() => {
                var g;
                ((g = document.getSelection()) == null ? void 0 : g.toString()) !== '' &&
                  (d.hasSelectionRef.current = !0);
              });
          };
          return (
            document.addEventListener('pointerup', t),
            () => {
              document.removeEventListener('pointerup', t),
                (d.hasSelectionRef.current = !1),
                (d.isPointerDownOnContentRef.current = !1);
            }
          );
        }
      }, [d.isPointerDownOnContentRef, d.hasSelectionRef]),
      a.useEffect(() => {
        u.current && se(u.current).forEach((x) => x.setAttribute('tabindex', '-1'));
      }),
      r.jsx(Z, {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onInteractOutside: f,
        onEscapeKeyDown: s,
        onPointerDownOutside: i,
        onFocusOutside: l(c, (t) => {
          t.preventDefault();
        }),
        onDismiss: d.onDismiss,
        children: r.jsx(J, {
          ...v,
          ...m,
          onPointerDown: l(m.onPointerDown, (t) => {
            t.currentTarget.contains(t.target) && C(!0),
              (d.hasSelectionRef.current = !1),
              (d.isPointerDownOnContentRef.current = !0);
          }),
          ref: h,
          style: {
            ...m.style,
            userSelect: p ? 'text' : void 0,
            WebkitUserSelect: p ? 'text' : void 0,
            '--radix-hover-card-content-transform-origin': 'var(--radix-popper-transform-origin)',
            '--radix-hover-card-content-available-width': 'var(--radix-popper-available-width)',
            '--radix-hover-card-content-available-height': 'var(--radix-popper-available-height)',
            '--radix-hover-card-trigger-width': 'var(--radix-popper-anchor-width)',
            '--radix-hover-card-trigger-height': 'var(--radix-popper-anchor-height)',
          },
        }),
      })
    );
  }),
  ne = 'HoverCardArrow',
  ae = a.forwardRef((e, o) => {
    const { __scopeHoverCard: n, ...s } = e,
      i = b(n);
    return r.jsx(Q, { ...i, ...s, ref: o });
  });
ae.displayName = ne;
function H(e) {
  return (o) => (o.pointerType === 'touch' ? void 0 : e());
}
function se(e) {
  const o = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (s) => (s.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
    });
  while (n.nextNode()) o.push(n.currentNode);
  return o;
}
var ie = L,
  ce = M,
  de = k,
  le = F;
function E({ ...e }) {
  return r.jsx(ie, { 'data-slot': 'hover-card', ...e });
}
function U({ ...e }) {
  return r.jsx(ce, { 'data-slot': 'hover-card-trigger', ...e });
}
function $({ className: e, align: o = 'center', sideOffset: n = 4, ...s }) {
  return r.jsx(de, {
    'data-slot': 'hover-card-portal',
    children: r.jsx(le, {
      'data-slot': 'hover-card-content',
      align: o,
      sideOffset: n,
      className: z(
        'z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        e,
      ),
      ...s,
    }),
  });
}
E.__docgenInfo = { description: '', methods: [], displayName: 'HoverCard' };
U.__docgenInfo = { description: '', methods: [], displayName: 'HoverCardTrigger' };
$.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'HoverCardContent',
  props: {
    align: { defaultValue: { value: "'center'", computed: !1 }, required: !1 },
    sideOffset: { defaultValue: { value: '4', computed: !1 }, required: !1 },
  },
};
const Te = {
    title: 'Primitives/HoverCard',
    component: E,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  P = {
    render: () =>
      r.jsxs(E, {
        children: [
          r.jsx(U, {
            asChild: !0,
            children: r.jsx('a', {
              href: 'https://example.com',
              className: 'text-sm underline',
              children: '@用户名',
            }),
          }),
          r.jsx($, {
            children: r.jsxs('div', {
              className: 'flex flex-col gap-2',
              children: [
                r.jsx('h4', { className: 'text-sm font-semibold', children: '用户名' }),
                r.jsx('p', {
                  className: 'text-sm text-muted-foreground',
                  children: '全栈开发者，专注于 React 和 TypeScript。',
                }),
                r.jsx('p', {
                  className: 'text-xs text-muted-foreground',
                  children: '已加入 2024 年 1 月',
                }),
              ],
            }),
          }),
        ],
      }),
  };
var _, y, j;
P.parameters = {
  ...P.parameters,
  docs: {
    ...((_ = P.parameters) == null ? void 0 : _.docs),
    source: {
      originalSource: `{
  render: () => <HoverCard>
      <HoverCardTrigger asChild>
        <a href="https://example.com" className="text-sm underline">
          @用户名
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">用户名</h4>
          <p className="text-sm text-muted-foreground">全栈开发者，专注于 React 和 TypeScript。</p>
          <p className="text-xs text-muted-foreground">已加入 2024 年 1 月</p>
        </div>
      </HoverCardContent>
    </HoverCard>
}`,
      ...((j = (y = P.parameters) == null ? void 0 : y.docs) == null ? void 0 : j.source),
    },
  },
};
const we = ['Default'];
export { P as Default, we as __namedExportsOrder, Te as default };
