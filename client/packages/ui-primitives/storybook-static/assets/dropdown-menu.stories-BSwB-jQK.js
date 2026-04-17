import { r as s } from './index-B3e6rcmj.js';
import { c as Se } from './index-BAgrSUEs.js';
import { R as En, A as Nn, C as Tn, a as jn, c as ye } from './index-BVSSuIN4.js';
import { P as q } from './index-BsSyydlo.js';
import { u as Ee } from './index-CLFlh7pk.js';
import { u as _e } from './index-CXzmB-r4.js';
import { u as Dn, c as Rn } from './index-Cjm6v2LU.js';
import { D as In } from './index-CnCkN4Kb.js';
import { F as Pn, u as Sn, h as bn, R as yn } from './index-D8RfjXkI.js';
import { I as On, c as Pe, R as kn } from './index-DGdrn48I.js';
import { c as v, u as xn } from './index-DclwlaNk.js';
import { u as F, c as _n, b as be } from './index-DuVyFFjR.js';
import { d as Cn, P as N } from './index-Tk7B4GT7.js';
import { P as An } from './index-npCAFBsl.js';
import { j as r } from './jsx-runtime-BjG_zV1W.js';
import { c as L } from './utils-BQHNewu7.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
import './index-D61X6AnJ.js';
var re = ['Enter', ' '],
  Ln = ['ArrowDown', 'PageUp', 'Home'],
  Ne = ['ArrowUp', 'PageDown', 'End'],
  Fn = [...Ln, ...Ne],
  Gn = { ltr: [...re, 'ArrowRight'], rtl: [...re, 'ArrowLeft'] },
  Kn = { ltr: ['ArrowLeft'], rtl: ['ArrowRight'] },
  G = 'Menu',
  [O, Un, $n] = Rn(G),
  [b, Te] = Se(G, [$n, ye, Pe]),
  Z = ye(),
  je = Pe(),
  [Bn, S] = b(G),
  [Vn, K] = b(G),
  Ae = (e) => {
    const { __scopeMenu: t, open: n = !1, children: o, dir: a, onOpenChange: c, modal: i = !0 } = e,
      l = Z(t),
      [m, M] = s.useState(null),
      p = s.useRef(!1),
      u = Ee(c),
      f = Dn(a);
    return (
      s.useEffect(() => {
        const g = () => {
            (p.current = !0),
              document.addEventListener('pointerdown', w, { capture: !0, once: !0 }),
              document.addEventListener('pointermove', w, { capture: !0, once: !0 });
          },
          w = () => (p.current = !1);
        return (
          document.addEventListener('keydown', g, { capture: !0 }),
          () => {
            document.removeEventListener('keydown', g, { capture: !0 }),
              document.removeEventListener('pointerdown', w, { capture: !0 }),
              document.removeEventListener('pointermove', w, { capture: !0 });
          }
        );
      }, []),
      r.jsx(En, {
        ...l,
        children: r.jsx(Bn, {
          scope: t,
          open: n,
          onOpenChange: u,
          content: m,
          onContentChange: M,
          children: r.jsx(Vn, {
            scope: t,
            onClose: s.useCallback(() => u(!1), [u]),
            isUsingKeyboardRef: p,
            dir: f,
            modal: i,
            children: o,
          }),
        }),
      })
    );
  };
Ae.displayName = G;
var Xn = 'MenuAnchor',
  ce = s.forwardRef((e, t) => {
    const { __scopeMenu: n, ...o } = e,
      a = Z(n);
    return r.jsx(Nn, { ...a, ...o, ref: t });
  });
ce.displayName = Xn;
var ue = 'MenuPortal',
  [Yn, Oe] = b(ue, { forceMount: void 0 }),
  ke = (e) => {
    const { __scopeMenu: t, forceMount: n, children: o, container: a } = e,
      c = S(ue, t);
    return r.jsx(Yn, {
      scope: t,
      forceMount: n,
      children: r.jsx(q, {
        present: n || c.open,
        children: r.jsx(An, { asChild: !0, container: a, children: o }),
      }),
    });
  };
ke.displayName = ue;
var _ = 'MenuContent',
  [zn, ie] = b(_),
  Le = s.forwardRef((e, t) => {
    const n = Oe(_, e.__scopeMenu),
      { forceMount: o = n.forceMount, ...a } = e,
      c = S(_, e.__scopeMenu),
      i = K(_, e.__scopeMenu);
    return r.jsx(O.Provider, {
      scope: e.__scopeMenu,
      children: r.jsx(q, {
        present: o || c.open,
        children: r.jsx(O.Slot, {
          scope: e.__scopeMenu,
          children: i.modal ? r.jsx(Hn, { ...a, ref: t }) : r.jsx(Wn, { ...a, ref: t }),
        }),
      }),
    });
  }),
  Hn = s.forwardRef((e, t) => {
    const n = S(_, e.__scopeMenu),
      o = s.useRef(null),
      a = F(t, o);
    return (
      s.useEffect(() => {
        const c = o.current;
        if (c) return bn(c);
      }, []),
      r.jsx(de, {
        ...e,
        ref: a,
        trapFocus: n.open,
        disableOutsidePointerEvents: n.open,
        disableOutsideScroll: !0,
        onFocusOutside: v(e.onFocusOutside, (c) => c.preventDefault(), {
          checkForDefaultPrevented: !1,
        }),
        onDismiss: () => n.onOpenChange(!1),
      })
    );
  }),
  Wn = s.forwardRef((e, t) => {
    const n = S(_, e.__scopeMenu);
    return r.jsx(de, {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => n.onOpenChange(!1),
    });
  }),
  qn = _n('MenuContent.ScrollLock'),
  de = s.forwardRef((e, t) => {
    const {
        __scopeMenu: n,
        loop: o = !1,
        trapFocus: a,
        onOpenAutoFocus: c,
        onCloseAutoFocus: i,
        disableOutsidePointerEvents: l,
        onEntryFocus: m,
        onEscapeKeyDown: M,
        onPointerDownOutside: p,
        onFocusOutside: u,
        onInteractOutside: f,
        onDismiss: g,
        disableOutsideScroll: w,
        ...I
      } = e,
      y = S(_, n),
      T = K(_, n),
      U = Z(n),
      $ = je(n),
      Me = Un(n),
      [mn, ve] = s.useState(null),
      B = s.useRef(null),
      Mn = F(t, B, y.onContentChange),
      V = s.useRef(0),
      X = s.useRef(''),
      vn = s.useRef(0),
      ee = s.useRef(null),
      we = s.useRef('right'),
      ne = s.useRef(0),
      wn = w ? yn : s.Fragment,
      gn = w ? { as: qn, allowPinchZoom: !0 } : void 0,
      hn = (d) => {
        var E, he;
        const x = X.current + d,
          C = Me().filter((D) => !D.disabled),
          R = document.activeElement,
          te = (E = C.find((D) => D.ref.current === R)) == null ? void 0 : E.textValue,
          oe = C.map((D) => D.textValue),
          ge = ut(oe, x, te),
          j = (he = C.find((D) => D.textValue === ge)) == null ? void 0 : he.ref.current;
        (function D(xe) {
          (X.current = xe),
            window.clearTimeout(V.current),
            xe !== '' && (V.current = window.setTimeout(() => D(''), 1e3));
        })(x),
          j && setTimeout(() => j.focus());
      };
    s.useEffect(() => () => window.clearTimeout(V.current), []), Sn();
    const P = s.useCallback((d) => {
      var C, R;
      return (
        we.current === ((C = ee.current) == null ? void 0 : C.side) &&
        dt(d, (R = ee.current) == null ? void 0 : R.area)
      );
    }, []);
    return r.jsx(zn, {
      scope: n,
      searchRef: X,
      onItemEnter: s.useCallback(
        (d) => {
          P(d) && d.preventDefault();
        },
        [P],
      ),
      onItemLeave: s.useCallback(
        (d) => {
          var x;
          P(d) || ((x = B.current) == null || x.focus(), ve(null));
        },
        [P],
      ),
      onTriggerLeave: s.useCallback(
        (d) => {
          P(d) && d.preventDefault();
        },
        [P],
      ),
      pointerGraceTimerRef: vn,
      onPointerGraceIntentChange: s.useCallback((d) => {
        ee.current = d;
      }, []),
      children: r.jsx(wn, {
        ...gn,
        children: r.jsx(Pn, {
          asChild: !0,
          trapped: a,
          onMountAutoFocus: v(c, (d) => {
            var x;
            d.preventDefault(), (x = B.current) == null || x.focus({ preventScroll: !0 });
          }),
          onUnmountAutoFocus: i,
          children: r.jsx(In, {
            asChild: !0,
            disableOutsidePointerEvents: l,
            onEscapeKeyDown: M,
            onPointerDownOutside: p,
            onFocusOutside: u,
            onInteractOutside: f,
            onDismiss: g,
            children: r.jsx(kn, {
              asChild: !0,
              ...$,
              dir: T.dir,
              orientation: 'vertical',
              loop: o,
              currentTabStopId: mn,
              onCurrentTabStopIdChange: ve,
              onEntryFocus: v(m, (d) => {
                T.isUsingKeyboardRef.current || d.preventDefault();
              }),
              preventScrollOnEntryFocus: !0,
              children: r.jsx(Tn, {
                role: 'menu',
                'aria-orientation': 'vertical',
                'data-state': Qe(y.open),
                'data-radix-menu-content': '',
                dir: T.dir,
                ...U,
                ...I,
                ref: Mn,
                style: { outline: 'none', ...I.style },
                onKeyDown: v(I.onKeyDown, (d) => {
                  const C = d.target.closest('[data-radix-menu-content]') === d.currentTarget,
                    R = d.ctrlKey || d.altKey || d.metaKey,
                    te = d.key.length === 1;
                  C && (d.key === 'Tab' && d.preventDefault(), !R && te && hn(d.key));
                  const oe = B.current;
                  if (d.target !== oe || !Fn.includes(d.key)) return;
                  d.preventDefault();
                  const j = Me()
                    .filter((E) => !E.disabled)
                    .map((E) => E.ref.current);
                  Ne.includes(d.key) && j.reverse(), st(j);
                }),
                onBlur: v(e.onBlur, (d) => {
                  d.currentTarget.contains(d.target) ||
                    (window.clearTimeout(V.current), (X.current = ''));
                }),
                onPointerMove: v(
                  e.onPointerMove,
                  k((d) => {
                    const x = d.target,
                      C = ne.current !== d.clientX;
                    if (d.currentTarget.contains(x) && C) {
                      const R = d.clientX > ne.current ? 'right' : 'left';
                      (we.current = R), (ne.current = d.clientX);
                    }
                  }),
                ),
              }),
            }),
          }),
        }),
      }),
    });
  });
Le.displayName = _;
var Zn = 'MenuGroup',
  le = s.forwardRef((e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return r.jsx(N.div, { role: 'group', ...o, ref: t });
  });
le.displayName = Zn;
var Jn = 'MenuLabel',
  Fe = s.forwardRef((e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return r.jsx(N.div, { ...o, ref: t });
  });
Fe.displayName = Jn;
var H = 'MenuItem',
  Ce = 'menu.itemSelect',
  J = s.forwardRef((e, t) => {
    const { disabled: n = !1, onSelect: o, ...a } = e,
      c = s.useRef(null),
      i = K(H, e.__scopeMenu),
      l = ie(H, e.__scopeMenu),
      m = F(t, c),
      M = s.useRef(!1),
      p = () => {
        const u = c.current;
        if (!n && u) {
          const f = new CustomEvent(Ce, { bubbles: !0, cancelable: !0 });
          u.addEventListener(Ce, (g) => (o == null ? void 0 : o(g)), { once: !0 }),
            Cn(u, f),
            f.defaultPrevented ? (M.current = !1) : i.onClose();
        }
      };
    return r.jsx(Ge, {
      ...a,
      ref: m,
      disabled: n,
      onClick: v(e.onClick, p),
      onPointerDown: (u) => {
        var f;
        (f = e.onPointerDown) == null || f.call(e, u), (M.current = !0);
      },
      onPointerUp: v(e.onPointerUp, (u) => {
        var f;
        M.current || (f = u.currentTarget) == null || f.click();
      }),
      onKeyDown: v(e.onKeyDown, (u) => {
        const f = l.searchRef.current !== '';
        n ||
          (f && u.key === ' ') ||
          (re.includes(u.key) && (u.currentTarget.click(), u.preventDefault()));
      }),
    });
  });
J.displayName = H;
var Ge = s.forwardRef((e, t) => {
    const { __scopeMenu: n, disabled: o = !1, textValue: a, ...c } = e,
      i = ie(H, n),
      l = je(n),
      m = s.useRef(null),
      M = F(t, m),
      [p, u] = s.useState(!1),
      [f, g] = s.useState('');
    return (
      s.useEffect(() => {
        const w = m.current;
        w && g((w.textContent ?? '').trim());
      }, [c.children]),
      r.jsx(O.ItemSlot, {
        scope: n,
        disabled: o,
        textValue: a ?? f,
        children: r.jsx(On, {
          asChild: !0,
          ...l,
          focusable: !o,
          children: r.jsx(N.div, {
            role: 'menuitem',
            'data-highlighted': p ? '' : void 0,
            'aria-disabled': o || void 0,
            'data-disabled': o ? '' : void 0,
            ...c,
            ref: M,
            onPointerMove: v(
              e.onPointerMove,
              k((w) => {
                o
                  ? i.onItemLeave(w)
                  : (i.onItemEnter(w),
                    w.defaultPrevented || w.currentTarget.focus({ preventScroll: !0 }));
              }),
            ),
            onPointerLeave: v(
              e.onPointerLeave,
              k((w) => i.onItemLeave(w)),
            ),
            onFocus: v(e.onFocus, () => u(!0)),
            onBlur: v(e.onBlur, () => u(!1)),
          }),
        }),
      })
    );
  }),
  Qn = 'MenuCheckboxItem',
  Ke = s.forwardRef((e, t) => {
    const { checked: n = !1, onCheckedChange: o, ...a } = e;
    return r.jsx(Xe, {
      scope: e.__scopeMenu,
      checked: n,
      children: r.jsx(J, {
        role: 'menuitemcheckbox',
        'aria-checked': W(n) ? 'mixed' : n,
        ...a,
        ref: t,
        'data-state': fe(n),
        onSelect: v(a.onSelect, () => (o == null ? void 0 : o(W(n) ? !0 : !n)), {
          checkForDefaultPrevented: !1,
        }),
      }),
    });
  });
Ke.displayName = Qn;
var Ue = 'MenuRadioGroup',
  [et, nt] = b(Ue, { value: void 0, onValueChange: () => {} }),
  $e = s.forwardRef((e, t) => {
    const { value: n, onValueChange: o, ...a } = e,
      c = Ee(o);
    return r.jsx(et, {
      scope: e.__scopeMenu,
      value: n,
      onValueChange: c,
      children: r.jsx(le, { ...a, ref: t }),
    });
  });
$e.displayName = Ue;
var Be = 'MenuRadioItem',
  Ve = s.forwardRef((e, t) => {
    const { value: n, ...o } = e,
      a = nt(Be, e.__scopeMenu),
      c = n === a.value;
    return r.jsx(Xe, {
      scope: e.__scopeMenu,
      checked: c,
      children: r.jsx(J, {
        role: 'menuitemradio',
        'aria-checked': c,
        ...o,
        ref: t,
        'data-state': fe(c),
        onSelect: v(
          o.onSelect,
          () => {
            var i;
            return (i = a.onValueChange) == null ? void 0 : i.call(a, n);
          },
          { checkForDefaultPrevented: !1 },
        ),
      }),
    });
  });
Ve.displayName = Be;
var pe = 'MenuItemIndicator',
  [Xe, tt] = b(pe, { checked: !1 }),
  Ye = s.forwardRef((e, t) => {
    const { __scopeMenu: n, forceMount: o, ...a } = e,
      c = tt(pe, n);
    return r.jsx(q, {
      present: o || W(c.checked) || c.checked === !0,
      children: r.jsx(N.span, { ...a, ref: t, 'data-state': fe(c.checked) }),
    });
  });
Ye.displayName = pe;
var ot = 'MenuSeparator',
  ze = s.forwardRef((e, t) => {
    const { __scopeMenu: n, ...o } = e;
    return r.jsx(N.div, { role: 'separator', 'aria-orientation': 'horizontal', ...o, ref: t });
  });
ze.displayName = ot;
var rt = 'MenuArrow',
  He = s.forwardRef((e, t) => {
    const { __scopeMenu: n, ...o } = e,
      a = Z(n);
    return r.jsx(jn, { ...a, ...o, ref: t });
  });
He.displayName = rt;
var at = 'MenuSub',
  [_o, We] = b(at),
  A = 'MenuSubTrigger',
  qe = s.forwardRef((e, t) => {
    const n = S(A, e.__scopeMenu),
      o = K(A, e.__scopeMenu),
      a = We(A, e.__scopeMenu),
      c = ie(A, e.__scopeMenu),
      i = s.useRef(null),
      { pointerGraceTimerRef: l, onPointerGraceIntentChange: m } = c,
      M = { __scopeMenu: e.__scopeMenu },
      p = s.useCallback(() => {
        i.current && window.clearTimeout(i.current), (i.current = null);
      }, []);
    return (
      s.useEffect(() => p, [p]),
      s.useEffect(() => {
        const u = l.current;
        return () => {
          window.clearTimeout(u), m(null);
        };
      }, [l, m]),
      r.jsx(ce, {
        asChild: !0,
        ...M,
        children: r.jsx(Ge, {
          id: a.triggerId,
          'aria-haspopup': 'menu',
          'aria-expanded': n.open,
          'aria-controls': a.contentId,
          'data-state': Qe(n.open),
          ...e,
          ref: be(t, a.onTriggerChange),
          onClick: (u) => {
            var f;
            (f = e.onClick) == null || f.call(e, u),
              !(e.disabled || u.defaultPrevented) &&
                (u.currentTarget.focus(), n.open || n.onOpenChange(!0));
          },
          onPointerMove: v(
            e.onPointerMove,
            k((u) => {
              c.onItemEnter(u),
                !u.defaultPrevented &&
                  !e.disabled &&
                  !n.open &&
                  !i.current &&
                  (c.onPointerGraceIntentChange(null),
                  (i.current = window.setTimeout(() => {
                    n.onOpenChange(!0), p();
                  }, 100)));
            }),
          ),
          onPointerLeave: v(
            e.onPointerLeave,
            k((u) => {
              var g, w;
              p();
              const f = (g = n.content) == null ? void 0 : g.getBoundingClientRect();
              if (f) {
                const I = (w = n.content) == null ? void 0 : w.dataset.side,
                  y = I === 'right',
                  T = y ? -5 : 5,
                  U = f[y ? 'left' : 'right'],
                  $ = f[y ? 'right' : 'left'];
                c.onPointerGraceIntentChange({
                  area: [
                    { x: u.clientX + T, y: u.clientY },
                    { x: U, y: f.top },
                    { x: $, y: f.top },
                    { x: $, y: f.bottom },
                    { x: U, y: f.bottom },
                  ],
                  side: I,
                }),
                  window.clearTimeout(l.current),
                  (l.current = window.setTimeout(() => c.onPointerGraceIntentChange(null), 300));
              } else {
                if ((c.onTriggerLeave(u), u.defaultPrevented)) return;
                c.onPointerGraceIntentChange(null);
              }
            }),
          ),
          onKeyDown: v(e.onKeyDown, (u) => {
            var g;
            const f = c.searchRef.current !== '';
            e.disabled ||
              (f && u.key === ' ') ||
              (Gn[o.dir].includes(u.key) &&
                (n.onOpenChange(!0), (g = n.content) == null || g.focus(), u.preventDefault()));
          }),
        }),
      })
    );
  });
qe.displayName = A;
var Ze = 'MenuSubContent',
  Je = s.forwardRef((e, t) => {
    const n = Oe(_, e.__scopeMenu),
      { forceMount: o = n.forceMount, ...a } = e,
      c = S(_, e.__scopeMenu),
      i = K(_, e.__scopeMenu),
      l = We(Ze, e.__scopeMenu),
      m = s.useRef(null),
      M = F(t, m);
    return r.jsx(O.Provider, {
      scope: e.__scopeMenu,
      children: r.jsx(q, {
        present: o || c.open,
        children: r.jsx(O.Slot, {
          scope: e.__scopeMenu,
          children: r.jsx(de, {
            id: l.contentId,
            'aria-labelledby': l.triggerId,
            ...a,
            ref: M,
            align: 'start',
            side: i.dir === 'rtl' ? 'left' : 'right',
            disableOutsidePointerEvents: !1,
            disableOutsideScroll: !1,
            trapFocus: !1,
            onOpenAutoFocus: (p) => {
              var u;
              i.isUsingKeyboardRef.current && ((u = m.current) == null || u.focus()),
                p.preventDefault();
            },
            onCloseAutoFocus: (p) => p.preventDefault(),
            onFocusOutside: v(e.onFocusOutside, (p) => {
              p.target !== l.trigger && c.onOpenChange(!1);
            }),
            onEscapeKeyDown: v(e.onEscapeKeyDown, (p) => {
              i.onClose(), p.preventDefault();
            }),
            onKeyDown: v(e.onKeyDown, (p) => {
              var g;
              const u = p.currentTarget.contains(p.target),
                f = Kn[i.dir].includes(p.key);
              u &&
                f &&
                (c.onOpenChange(!1), (g = l.trigger) == null || g.focus(), p.preventDefault());
            }),
          }),
        }),
      }),
    });
  });
Je.displayName = Ze;
function Qe(e) {
  return e ? 'open' : 'closed';
}
function W(e) {
  return e === 'indeterminate';
}
function fe(e) {
  return W(e) ? 'indeterminate' : e ? 'checked' : 'unchecked';
}
function st(e) {
  const t = document.activeElement;
  for (const n of e) if (n === t || (n.focus(), document.activeElement !== t)) return;
}
function ct(e, t) {
  return e.map((n, o) => e[(t + o) % e.length]);
}
function ut(e, t, n) {
  const a = t.length > 1 && Array.from(t).every((M) => M === t[0]) ? t[0] : t,
    c = n ? e.indexOf(n) : -1;
  let i = ct(e, Math.max(c, 0));
  a.length === 1 && (i = i.filter((M) => M !== n));
  const m = i.find((M) => M.toLowerCase().startsWith(a.toLowerCase()));
  return m !== n ? m : void 0;
}
function it(e, t) {
  const { x: n, y: o } = e;
  let a = !1;
  for (let c = 0, i = t.length - 1; c < t.length; i = c++) {
    const l = t[c],
      m = t[i],
      M = l.x,
      p = l.y,
      u = m.x,
      f = m.y;
    p > o != f > o && n < ((u - M) * (o - p)) / (f - p) + M && (a = !a);
  }
  return a;
}
function dt(e, t) {
  if (!t) return !1;
  const n = { x: e.clientX, y: e.clientY };
  return it(n, t);
}
function k(e) {
  return (t) => (t.pointerType === 'mouse' ? e(t) : void 0);
}
var lt = Ae,
  pt = ce,
  ft = ke,
  mt = Le,
  Mt = le,
  vt = Fe,
  wt = J,
  gt = Ke,
  ht = $e,
  xt = Ve,
  _t = Ye,
  Ct = ze,
  Dt = He,
  Rt = qe,
  It = Je,
  Q = 'DropdownMenu',
  [bt] = Se(Q, [Te]),
  h = Te(),
  [St, en] = bt(Q),
  nn = (e) => {
    const {
        __scopeDropdownMenu: t,
        children: n,
        dir: o,
        open: a,
        defaultOpen: c,
        onOpenChange: i,
        modal: l = !0,
      } = e,
      m = h(t),
      M = s.useRef(null),
      [p, u] = xn({ prop: a, defaultProp: c ?? !1, onChange: i, caller: Q });
    return r.jsx(St, {
      scope: t,
      triggerId: _e(),
      triggerRef: M,
      contentId: _e(),
      open: p,
      onOpenChange: u,
      onOpenToggle: s.useCallback(() => u((f) => !f), [u]),
      modal: l,
      children: r.jsx(lt, { ...m, open: p, onOpenChange: u, dir: o, modal: l, children: n }),
    });
  };
nn.displayName = Q;
var tn = 'DropdownMenuTrigger',
  on = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, disabled: o = !1, ...a } = e,
      c = en(tn, n),
      i = h(n);
    return r.jsx(pt, {
      asChild: !0,
      ...i,
      children: r.jsx(N.button, {
        type: 'button',
        id: c.triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': c.open,
        'aria-controls': c.open ? c.contentId : void 0,
        'data-state': c.open ? 'open' : 'closed',
        'data-disabled': o ? '' : void 0,
        disabled: o,
        ...a,
        ref: be(t, c.triggerRef),
        onPointerDown: v(e.onPointerDown, (l) => {
          !o &&
            l.button === 0 &&
            l.ctrlKey === !1 &&
            (c.onOpenToggle(), c.open || l.preventDefault());
        }),
        onKeyDown: v(e.onKeyDown, (l) => {
          o ||
            (['Enter', ' '].includes(l.key) && c.onOpenToggle(),
            l.key === 'ArrowDown' && c.onOpenChange(!0),
            ['Enter', ' ', 'ArrowDown'].includes(l.key) && l.preventDefault());
        }),
      }),
    });
  });
on.displayName = tn;
var yt = 'DropdownMenuPortal',
  rn = (e) => {
    const { __scopeDropdownMenu: t, ...n } = e,
      o = h(t);
    return r.jsx(ft, { ...o, ...n });
  };
rn.displayName = yt;
var an = 'DropdownMenuContent',
  sn = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = en(an, n),
      c = h(n),
      i = s.useRef(!1);
    return r.jsx(mt, {
      id: a.contentId,
      'aria-labelledby': a.triggerId,
      ...c,
      ...o,
      ref: t,
      onCloseAutoFocus: v(e.onCloseAutoFocus, (l) => {
        var m;
        i.current || (m = a.triggerRef.current) == null || m.focus(),
          (i.current = !1),
          l.preventDefault();
      }),
      onInteractOutside: v(e.onInteractOutside, (l) => {
        const m = l.detail.originalEvent,
          M = m.button === 0 && m.ctrlKey === !0,
          p = m.button === 2 || M;
        (!a.modal || p) && (i.current = !0);
      }),
      style: {
        ...e.style,
        '--radix-dropdown-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
      },
    });
  });
sn.displayName = an;
var Pt = 'DropdownMenuGroup',
  Et = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(Mt, { ...a, ...o, ref: t });
  });
Et.displayName = Pt;
var Nt = 'DropdownMenuLabel',
  cn = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(vt, { ...a, ...o, ref: t });
  });
cn.displayName = Nt;
var Tt = 'DropdownMenuItem',
  un = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(wt, { ...a, ...o, ref: t });
  });
un.displayName = Tt;
var jt = 'DropdownMenuCheckboxItem',
  At = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(gt, { ...a, ...o, ref: t });
  });
At.displayName = jt;
var Ot = 'DropdownMenuRadioGroup',
  kt = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(ht, { ...a, ...o, ref: t });
  });
kt.displayName = Ot;
var Lt = 'DropdownMenuRadioItem',
  Ft = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(xt, { ...a, ...o, ref: t });
  });
Ft.displayName = Lt;
var Gt = 'DropdownMenuItemIndicator',
  Kt = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(_t, { ...a, ...o, ref: t });
  });
Kt.displayName = Gt;
var Ut = 'DropdownMenuSeparator',
  dn = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(Ct, { ...a, ...o, ref: t });
  });
dn.displayName = Ut;
var $t = 'DropdownMenuArrow',
  Bt = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(Dt, { ...a, ...o, ref: t });
  });
Bt.displayName = $t;
var Vt = 'DropdownMenuSubTrigger',
  Xt = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(Rt, { ...a, ...o, ref: t });
  });
Xt.displayName = Vt;
var Yt = 'DropdownMenuSubContent',
  zt = s.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...o } = e,
      a = h(n);
    return r.jsx(It, {
      ...a,
      ...o,
      ref: t,
      style: {
        ...e.style,
        '--radix-dropdown-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
      },
    });
  });
zt.displayName = Yt;
var Ht = nn,
  Wt = on,
  qt = rn,
  Zt = sn,
  Jt = cn,
  Qt = un,
  eo = dn;
function me({ ...e }) {
  return r.jsx(Ht, { 'data-slot': 'dropdown-menu', ...e });
}
function ln({ ...e }) {
  return r.jsx(Wt, { 'data-slot': 'dropdown-menu-trigger', ...e });
}
function pn({ className: e, sideOffset: t = 4, ...n }) {
  return r.jsx(qt, {
    children: r.jsx(Zt, {
      'data-slot': 'dropdown-menu-content',
      sideOffset: t,
      className: L(
        'z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        e,
      ),
      ...n,
    }),
  });
}
function z({ className: e, inset: t, variant: n = 'default', ...o }) {
  return r.jsx(Qt, {
    'data-slot': 'dropdown-menu-item',
    'data-inset': t,
    'data-variant': n,
    className: L(
      "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
      e,
    ),
    ...o,
  });
}
function fn({ className: e, inset: t, ...n }) {
  return r.jsx(Jt, {
    'data-slot': 'dropdown-menu-label',
    'data-inset': t,
    className: L('px-2 py-1.5 text-sm font-medium data-[inset]:pl-8', e),
    ...n,
  });
}
function ae({ className: e, ...t }) {
  return r.jsx(eo, {
    'data-slot': 'dropdown-menu-separator',
    className: L('-mx-1 my-1 h-px bg-border', e),
    ...t,
  });
}
function se({ className: e, ...t }) {
  return r.jsx('span', {
    'data-slot': 'dropdown-menu-shortcut',
    className: L('ml-auto text-xs tracking-widest text-muted-foreground', e),
    ...t,
  });
}
me.__docgenInfo = { description: '', methods: [], displayName: 'DropdownMenu' };
ln.__docgenInfo = { description: '', methods: [], displayName: 'DropdownMenuTrigger' };
pn.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DropdownMenuContent',
  props: { sideOffset: { defaultValue: { value: '4', computed: !1 }, required: !1 } },
};
fn.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DropdownMenuLabel',
  props: { inset: { required: !1, tsType: { name: 'boolean' }, description: '' } },
};
z.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DropdownMenuItem',
  props: {
    inset: { required: !1, tsType: { name: 'boolean' }, description: '' },
    variant: {
      required: !1,
      tsType: {
        name: 'union',
        raw: "'default' | 'destructive'",
        elements: [
          { name: 'literal', value: "'default'" },
          { name: 'literal', value: "'destructive'" },
        ],
      },
      description: '',
      defaultValue: { value: "'default'", computed: !1 },
    },
  },
};
ae.__docgenInfo = { description: '', methods: [], displayName: 'DropdownMenuSeparator' };
se.__docgenInfo = { description: '', methods: [], displayName: 'DropdownMenuShortcut' };
const Co = {
    title: 'Primitives/DropdownMenu',
    component: me,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  Y = {
    render: () =>
      r.jsxs(me, {
        children: [
          r.jsx(ln, {
            asChild: !0,
            children: r.jsx('button', {
              type: 'button',
              className: 'rounded-md border px-4 py-2 text-sm',
              children: '打开菜单',
            }),
          }),
          r.jsxs(pn, {
            className: 'w-56',
            children: [
              r.jsx(fn, { children: '我的账户' }),
              r.jsx(ae, {}),
              r.jsxs(z, { children: ['个人信息', r.jsx(se, { children: 'Ctrl+P' })] }),
              r.jsxs(z, { children: ['设置', r.jsx(se, { children: 'Ctrl+S' })] }),
              r.jsx(ae, {}),
              r.jsx(z, { children: '退出登录' }),
            ],
          }),
        ],
      }),
  };
var De, Re, Ie;
Y.parameters = {
  ...Y.parameters,
  docs: {
    ...((De = Y.parameters) == null ? void 0 : De.docs),
    source: {
      originalSource: `{
  render: () => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          打开菜单
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>我的账户</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          个人信息
          <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          设置
          <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>退出登录</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
}`,
      ...((Ie = (Re = Y.parameters) == null ? void 0 : Re.docs) == null ? void 0 : Ie.source),
    },
  },
};
const Do = ['Default'];
export { Y as Default, Do as __namedExportsOrder, Co as default };
