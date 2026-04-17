import { o as Ne, r as l } from './index-B3e6rcmj.js';
import { R as Ie, P as Re, O as _e, C as je } from './index-H2JHQ55g.js';
import { j as S } from './jsx-runtime-BjG_zV1W.js';
import './index-JG1J0hlI.js';
import { u as V } from './index-CXzmB-r4.js';
import { b as O } from './index-DuVyFFjR.js';
import './dialog-D1j1OD2J.js';
import { c as Ae } from './createLucideIcon-D27BUxB9.js'; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
import { c as $ } from './utils-BQHNewu7.js';
const $e = [
    ['path', { d: 'm21 21-4.34-4.34', key: '14j7rj' }],
    ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
  ],
  Pe = Ae('search', $e);
var pe = 1,
  Me = 0.9,
  De = 0.8,
  Le = 0.17,
  te = 0.1,
  re = 0.999,
  Ve = 0.9999,
  Oe = 0.99,
  Fe = /[\\\/_+.#"@\[\(\{&]/,
  Ke = /[\\\/_+.#"@\[\(\{&]/g,
  ze = /[\s-]/,
  he = /[\s-]/g;
function le(e, t, r, i, a, o, c) {
  if (o === t.length) return a === e.length ? pe : Oe;
  var m = `${a},${o}`;
  if (c[m] !== void 0) return c[m];
  for (var p = i.charAt(o), s = r.indexOf(p, a), v = 0, h, k, w, I; s >= 0; )
    (h = le(e, t, r, i, s + 1, o + 1, c)),
      h > v &&
        (s === a
          ? (h *= pe)
          : Fe.test(e.charAt(s - 1))
            ? ((h *= De),
              (w = e.slice(a, s - 1).match(Ke)),
              w && a > 0 && (h *= Math.pow(re, w.length)))
            : ze.test(e.charAt(s - 1))
              ? ((h *= Me),
                (I = e.slice(a, s - 1).match(he)),
                I && a > 0 && (h *= Math.pow(re, I.length)))
              : ((h *= Le), a > 0 && (h *= Math.pow(re, s - a))),
        e.charAt(s) !== t.charAt(o) && (h *= Ve)),
      ((h < te && r.charAt(s - 1) === i.charAt(o + 1)) ||
        (i.charAt(o + 1) === i.charAt(o) && r.charAt(s - 1) !== i.charAt(o))) &&
        ((k = le(e, t, r, i, s + 1, o + 2, c)), k * te > h && (h = k * te)),
      h > v && (v = h),
      (s = r.indexOf(p, s + 1));
  return (c[m] = v), v;
}
function ve(e) {
  return e.toLowerCase().replace(he, ' ');
}
function qe(e, t, r) {
  return (e = r && r.length > 0 ? `${e + ' ' + r.join(' ')}` : e), le(e, t, ve(e), ve(t), 0, 0, {});
}
var Te = Symbol.for('react.lazy'),
  W = Ne[' use '.trim().toString()];
function We(e) {
  return typeof e == 'object' && e !== null && 'then' in e;
}
function be(e) {
  return (
    e != null &&
    typeof e == 'object' &&
    '$$typeof' in e &&
    e.$$typeof === Te &&
    '_payload' in e &&
    We(e._payload)
  );
}
function Be(e) {
  const t = Ge(e),
    r = l.forwardRef((i, a) => {
      let { children: o, ...c } = i;
      be(o) && typeof W == 'function' && (o = W(o._payload));
      const m = l.Children.toArray(o),
        p = m.find(Ue);
      if (p) {
        const s = p.props.children,
          v = m.map((h) =>
            h === p
              ? l.Children.count(s) > 1
                ? l.Children.only(null)
                : l.isValidElement(s)
                  ? s.props.children
                  : null
              : h,
          );
        return S.jsx(t, {
          ...c,
          ref: a,
          children: l.isValidElement(s) ? l.cloneElement(s, void 0, v) : null,
        });
      }
      return S.jsx(t, { ...c, ref: a, children: o });
    });
  return (r.displayName = `${e}.Slot`), r;
}
function Ge(e) {
  const t = l.forwardRef((r, i) => {
    let { children: a, ...o } = r;
    if ((be(a) && typeof W == 'function' && (a = W(a._payload)), l.isValidElement(a))) {
      const c = Ze(a),
        m = Ye(o, a.props);
      return a.type !== l.Fragment && (m.ref = i ? O(i, c) : c), l.cloneElement(a, m);
    }
    return l.Children.count(a) > 1 ? l.Children.only(null) : null;
  });
  return (t.displayName = `${e}.SlotClone`), t;
}
var He = Symbol('radix.slottable');
function Ue(e) {
  return (
    l.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === He
  );
}
function Ye(e, t) {
  const r = { ...t };
  for (const i in t) {
    const a = e[i],
      o = t[i];
    /^on[A-Z]/.test(i)
      ? a && o
        ? (r[i] = (...m) => {
            const p = o(...m);
            return a(...m), p;
          })
        : a && (r[i] = a)
      : i === 'style'
        ? (r[i] = { ...a, ...o })
        : i === 'className' && (r[i] = [a, o].filter(Boolean).join(' '));
  }
  return { ...e, ...r };
}
function Ze(e) {
  var i, a;
  let t = (i = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : i.get,
    r = t && 'isReactWarning' in t && t.isReactWarning;
  return r
    ? e.ref
    : ((t = (a = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : a.get),
      (r = t && 'isReactWarning' in t && t.isReactWarning),
      r ? e.props.ref : e.props.ref || e.ref);
}
var Je = [
    'a',
    'button',
    'div',
    'form',
    'h2',
    'h3',
    'img',
    'input',
    'label',
    'li',
    'nav',
    'ol',
    'p',
    'select',
    'span',
    'svg',
    'ul',
  ],
  _ = Je.reduce((e, t) => {
    const r = Be(`Primitive.${t}`),
      i = l.forwardRef((a, o) => {
        const { asChild: c, ...m } = a,
          p = c ? r : t;
        return (
          typeof window < 'u' && (window[Symbol.for('radix-ui')] = !0), S.jsx(p, { ...m, ref: o })
        );
      });
    return (i.displayName = `Primitive.${t}`), { ...e, [t]: i };
  }, {}),
  K = '[cmdk-group=""]',
  ne = '[cmdk-group-items=""]',
  Xe = '[cmdk-group-heading=""]',
  ye = '[cmdk-item=""]',
  ge = `${ye}:not([aria-disabled="true"])`,
  ae = 'cmdk-item-select',
  D = 'data-value',
  Qe = (e, t, r) => qe(e, t, r),
  xe = l.createContext(void 0),
  z = () => l.useContext(xe),
  we = l.createContext(void 0),
  oe = () => l.useContext(we),
  Ee = l.createContext(void 0),
  Ce = l.forwardRef((e, t) => {
    const r = L(() => {
        var n, d;
        return {
          search: '',
          value: (d = (n = e.value) != null ? n : e.defaultValue) != null ? d : '',
          selectedItemId: void 0,
          filtered: { count: 0, items: new Map(), groups: new Set() },
        };
      }),
      i = L(() => new Set()),
      a = L(() => new Map()),
      o = L(() => new Map()),
      c = L(() => new Set()),
      m = Se(e),
      {
        label: p,
        children: s,
        value: v,
        onValueChange: h,
        filter: k,
        shouldFilter: w,
        loop: I,
        disablePointerSelection: G = !1,
        vimBindings: j = !0,
        ...q
      } = e,
      H = V(),
      ie = V(),
      U = V(),
      N = l.useRef(null),
      y = ct();
    A(() => {
      if (v !== void 0) {
        const n = v.trim();
        (r.current.value = n), E.emit();
      }
    }, [v]),
      A(() => {
        y(6, se);
      }, []);
    const E = l.useMemo(
        () => ({
          subscribe: (n) => (c.current.add(n), () => c.current.delete(n)),
          snapshot: () => r.current,
          setState: (n, d, f) => {
            var u, g, b, C;
            if (!Object.is(r.current[n], d)) {
              if (((r.current[n] = d), n === 'search')) X(), Z(), y(1, J);
              else if (n === 'value') {
                if (
                  document.activeElement.hasAttribute('cmdk-input') ||
                  document.activeElement.hasAttribute('cmdk-root')
                ) {
                  const x = document.getElementById(U);
                  x ? x.focus() : (u = document.getElementById(H)) == null || u.focus();
                }
                if (
                  (y(7, () => {
                    var x;
                    (r.current.selectedItemId = (x = M()) == null ? void 0 : x.id), E.emit();
                  }),
                  f || y(5, se),
                  ((g = m.current) == null ? void 0 : g.value) !== void 0)
                ) {
                  const x = d ?? '';
                  (C = (b = m.current).onValueChange) == null || C.call(b, x);
                  return;
                }
              }
              E.emit();
            }
          },
          emit: () => {
            c.current.forEach((n) => n());
          },
        }),
        [],
      ),
      Y = l.useMemo(
        () => ({
          value: (n, d, f) => {
            var u;
            d !== ((u = o.current.get(n)) == null ? void 0 : u.value) &&
              (o.current.set(n, { value: d, keywords: f }),
              r.current.filtered.items.set(n, ue(d, f)),
              y(2, () => {
                Z(), E.emit();
              }));
          },
          item: (n, d) => (
            i.current.add(n),
            d && (a.current.has(d) ? a.current.get(d).add(n) : a.current.set(d, new Set([n]))),
            y(3, () => {
              X(), Z(), r.current.value || J(), E.emit();
            }),
            () => {
              o.current.delete(n), i.current.delete(n), r.current.filtered.items.delete(n);
              const f = M();
              y(4, () => {
                X(), (f == null ? void 0 : f.getAttribute('id')) === n && J(), E.emit();
              });
            }
          ),
          group: (n) => (
            a.current.has(n) || a.current.set(n, new Set()),
            () => {
              o.current.delete(n), a.current.delete(n);
            }
          ),
          filter: () => m.current.shouldFilter,
          label: p || e['aria-label'],
          getDisablePointerSelection: () => m.current.disablePointerSelection,
          listId: H,
          inputId: U,
          labelId: ie,
          listInnerRef: N,
        }),
        [],
      );
    function ue(n, d) {
      var f, u;
      const g = (u = (f = m.current) == null ? void 0 : f.filter) != null ? u : Qe;
      return n ? g(n, r.current.search, d) : 0;
    }
    function Z() {
      if (!r.current.search || m.current.shouldFilter === !1) return;
      const n = r.current.filtered.items,
        d = [];
      r.current.filtered.groups.forEach((u) => {
        let g = a.current.get(u),
          b = 0;
        g.forEach((C) => {
          const x = n.get(C);
          b = Math.max(x, b);
        }),
          d.push([u, b]);
      });
      const f = N.current;
      F()
        .sort((u, g) => {
          var b, C;
          const x = u.getAttribute('id'),
            T = g.getAttribute('id');
          return ((b = n.get(T)) != null ? b : 0) - ((C = n.get(x)) != null ? C : 0);
        })
        .forEach((u) => {
          const g = u.closest(ne);
          g
            ? g.appendChild(u.parentElement === g ? u : u.closest(`${ne} > *`))
            : f.appendChild(u.parentElement === f ? u : u.closest(`${ne} > *`));
        }),
        d
          .sort((u, g) => g[1] - u[1])
          .forEach((u) => {
            var g;
            const b =
              (g = N.current) == null
                ? void 0
                : g.querySelector(`${K}[${D}="${encodeURIComponent(u[0])}"]`);
            b == null || b.parentElement.appendChild(b);
          });
    }
    function J() {
      const n = F().find((f) => f.getAttribute('aria-disabled') !== 'true'),
        d = n == null ? void 0 : n.getAttribute(D);
      E.setState('value', d || void 0);
    }
    function X() {
      var n, d, f, u;
      if (!r.current.search || m.current.shouldFilter === !1) {
        r.current.filtered.count = i.current.size;
        return;
      }
      r.current.filtered.groups = new Set();
      let g = 0;
      for (const b of i.current) {
        const C = (d = (n = o.current.get(b)) == null ? void 0 : n.value) != null ? d : '',
          x = (u = (f = o.current.get(b)) == null ? void 0 : f.keywords) != null ? u : [],
          T = ue(C, x);
        r.current.filtered.items.set(b, T), T > 0 && g++;
      }
      for (const [b, C] of a.current)
        for (const x of C)
          if (r.current.filtered.items.get(x) > 0) {
            r.current.filtered.groups.add(b);
            break;
          }
      r.current.filtered.count = g;
    }
    function se() {
      var n, d, f;
      const u = M();
      u &&
        (((n = u.parentElement) == null ? void 0 : n.firstChild) === u &&
          ((f = (d = u.closest(K)) == null ? void 0 : d.querySelector(Xe)) == null ||
            f.scrollIntoView({ block: 'nearest' })),
        u.scrollIntoView({ block: 'nearest' }));
    }
    function M() {
      var n;
      return (n = N.current) == null ? void 0 : n.querySelector(`${ye}[aria-selected="true"]`);
    }
    function F() {
      var n;
      return Array.from(((n = N.current) == null ? void 0 : n.querySelectorAll(ge)) || []);
    }
    function Q(n) {
      const d = F()[n];
      d && E.setState('value', d.getAttribute(D));
    }
    function ee(n) {
      var d;
      let f = M(),
        u = F(),
        g = u.findIndex((C) => C === f),
        b = u[g + n];
      (d = m.current) != null &&
        d.loop &&
        (b = g + n < 0 ? u[u.length - 1] : g + n === u.length ? u[0] : u[g + n]),
        b && E.setState('value', b.getAttribute(D));
    }
    function ce(n) {
      let d = M(),
        f = d == null ? void 0 : d.closest(K),
        u;
      while (f && !u)
        (f = n > 0 ? ut(f, K) : st(f, K)), (u = f == null ? void 0 : f.querySelector(ge));
      u ? E.setState('value', u.getAttribute(D)) : ee(n);
    }
    const de = () => Q(F().length - 1),
      me = (n) => {
        n.preventDefault(), n.metaKey ? de() : n.altKey ? ce(1) : ee(1);
      },
      fe = (n) => {
        n.preventDefault(), n.metaKey ? Q(0) : n.altKey ? ce(-1) : ee(-1);
      };
    return l.createElement(
      _.div,
      {
        ref: t,
        tabIndex: -1,
        ...q,
        'cmdk-root': '',
        onKeyDown: (n) => {
          var d;
          (d = q.onKeyDown) == null || d.call(q, n);
          const f = n.nativeEvent.isComposing || n.keyCode === 229;
          if (!(n.defaultPrevented || f))
            switch (n.key) {
              case 'n':
              case 'j': {
                j && n.ctrlKey && me(n);
                break;
              }
              case 'ArrowDown': {
                me(n);
                break;
              }
              case 'p':
              case 'k': {
                j && n.ctrlKey && fe(n);
                break;
              }
              case 'ArrowUp': {
                fe(n);
                break;
              }
              case 'Home': {
                n.preventDefault(), Q(0);
                break;
              }
              case 'End': {
                n.preventDefault(), de();
                break;
              }
              case 'Enter': {
                n.preventDefault();
                const u = M();
                if (u) {
                  const g = new Event(ae);
                  u.dispatchEvent(g);
                }
              }
            }
        },
      },
      l.createElement(
        'label',
        { 'cmdk-label': '', htmlFor: Y.inputId, id: Y.labelId, style: mt },
        p,
      ),
      B(e, (n) =>
        l.createElement(we.Provider, { value: E }, l.createElement(xe.Provider, { value: Y }, n)),
      ),
    );
  }),
  et = l.forwardRef((e, t) => {
    var r, i;
    const a = V(),
      o = l.useRef(null),
      c = l.useContext(Ee),
      m = z(),
      p = Se(e),
      s =
        (i = (r = p.current) == null ? void 0 : r.forceMount) != null
          ? i
          : c == null
            ? void 0
            : c.forceMount;
    A(() => {
      if (!s) return m.item(a, c == null ? void 0 : c.id);
    }, [s]);
    const v = ke(a, o, [e.value, e.children, o], e.keywords),
      h = oe(),
      k = R((y) => y.value && y.value === v.current),
      w = R((y) => (s || m.filter() === !1 ? !0 : y.search ? y.filtered.items.get(a) > 0 : !0));
    l.useEffect(() => {
      const y = o.current;
      if (!(!y || e.disabled)) return y.addEventListener(ae, I), () => y.removeEventListener(ae, I);
    }, [w, e.onSelect, e.disabled]);
    function I() {
      var y, E;
      G(), (E = (y = p.current).onSelect) == null || E.call(y, v.current);
    }
    function G() {
      h.setState('value', v.current, !0);
    }
    if (!w) return null;
    const { disabled: j, value: q, onSelect: H, forceMount: ie, keywords: U, ...N } = e;
    return l.createElement(
      _.div,
      {
        ref: O(o, t),
        ...N,
        id: a,
        'cmdk-item': '',
        role: 'option',
        'aria-disabled': !!j,
        'aria-selected': !!k,
        'data-disabled': !!j,
        'data-selected': !!k,
        onPointerMove: j || m.getDisablePointerSelection() ? void 0 : G,
        onClick: j ? void 0 : I,
      },
      e.children,
    );
  }),
  tt = l.forwardRef((e, t) => {
    const { heading: r, children: i, forceMount: a, ...o } = e,
      c = V(),
      m = l.useRef(null),
      p = l.useRef(null),
      s = V(),
      v = z(),
      h = R((w) => (a || v.filter() === !1 ? !0 : w.search ? w.filtered.groups.has(c) : !0));
    A(() => v.group(c), []), ke(c, m, [e.value, e.heading, p]);
    const k = l.useMemo(() => ({ id: c, forceMount: a }), [a]);
    return l.createElement(
      _.div,
      { ref: O(m, t), ...o, 'cmdk-group': '', role: 'presentation', hidden: h ? void 0 : !0 },
      r &&
        l.createElement('div', { ref: p, 'cmdk-group-heading': '', 'aria-hidden': !0, id: s }, r),
      B(e, (w) =>
        l.createElement(
          'div',
          { 'cmdk-group-items': '', role: 'group', 'aria-labelledby': r ? s : void 0 },
          l.createElement(Ee.Provider, { value: k }, w),
        ),
      ),
    );
  }),
  rt = l.forwardRef((e, t) => {
    const { alwaysRender: r, ...i } = e,
      a = l.useRef(null),
      o = R((c) => !c.search);
    return !r && !o
      ? null
      : l.createElement(_.div, { ref: O(a, t), ...i, 'cmdk-separator': '', role: 'separator' });
  }),
  nt = l.forwardRef((e, t) => {
    const { onValueChange: r, ...i } = e,
      a = e.value != null,
      o = oe(),
      c = R((s) => s.search),
      m = R((s) => s.selectedItemId),
      p = z();
    return (
      l.useEffect(() => {
        e.value != null && o.setState('search', e.value);
      }, [e.value]),
      l.createElement(_.input, {
        ref: t,
        ...i,
        'cmdk-input': '',
        autoComplete: 'off',
        autoCorrect: 'off',
        spellCheck: !1,
        'aria-autocomplete': 'list',
        role: 'combobox',
        'aria-expanded': !0,
        'aria-controls': p.listId,
        'aria-labelledby': p.labelId,
        'aria-activedescendant': m,
        id: p.inputId,
        type: 'text',
        value: a ? e.value : c,
        onChange: (s) => {
          a || o.setState('search', s.target.value), r == null || r(s.target.value);
        },
      })
    );
  }),
  lt = l.forwardRef((e, t) => {
    const { children: r, label: i = 'Suggestions', ...a } = e,
      o = l.useRef(null),
      c = l.useRef(null),
      m = R((s) => s.selectedItemId),
      p = z();
    return (
      l.useEffect(() => {
        if (c.current && o.current) {
          let s = c.current,
            v = o.current,
            h,
            k = new ResizeObserver(() => {
              h = requestAnimationFrame(() => {
                const w = s.offsetHeight;
                v.style.setProperty('--cmdk-list-height', w.toFixed(1) + 'px');
              });
            });
          return (
            k.observe(s),
            () => {
              cancelAnimationFrame(h), k.unobserve(s);
            }
          );
        }
      }, []),
      l.createElement(
        _.div,
        {
          ref: O(o, t),
          ...a,
          'cmdk-list': '',
          role: 'listbox',
          tabIndex: -1,
          'aria-activedescendant': m,
          'aria-label': i,
          id: p.listId,
        },
        B(e, (s) =>
          l.createElement('div', { ref: O(c, p.listInnerRef), 'cmdk-list-sizer': '' }, s),
        ),
      )
    );
  }),
  at = l.forwardRef((e, t) => {
    const {
      open: r,
      onOpenChange: i,
      overlayClassName: a,
      contentClassName: o,
      container: c,
      ...m
    } = e;
    return l.createElement(
      Ie,
      { open: r, onOpenChange: i },
      l.createElement(
        Re,
        { container: c },
        l.createElement(_e, { 'cmdk-overlay': '', className: a }),
        l.createElement(
          je,
          { 'aria-label': e.label, 'cmdk-dialog': '', className: o },
          l.createElement(Ce, { ref: t, ...m }),
        ),
      ),
    );
  }),
  ot = l.forwardRef((e, t) =>
    R((r) => r.filtered.count === 0)
      ? l.createElement(_.div, { ref: t, ...e, 'cmdk-empty': '', role: 'presentation' })
      : null,
  ),
  it = l.forwardRef((e, t) => {
    const { progress: r, children: i, label: a = 'Loading...', ...o } = e;
    return l.createElement(
      _.div,
      {
        ref: t,
        ...o,
        'cmdk-loading': '',
        role: 'progressbar',
        'aria-valuenow': r,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': a,
      },
      B(e, (c) => l.createElement('div', { 'aria-hidden': !0 }, c)),
    );
  }),
  P = Object.assign(Ce, {
    List: lt,
    Item: et,
    Input: nt,
    Group: tt,
    Separator: rt,
    Dialog: at,
    Empty: ot,
    Loading: it,
  });
function ut(e, t) {
  let r = e.nextElementSibling;
  while (r) {
    if (r.matches(t)) return r;
    r = r.nextElementSibling;
  }
}
function st(e, t) {
  let r = e.previousElementSibling;
  while (r) {
    if (r.matches(t)) return r;
    r = r.previousElementSibling;
  }
}
function Se(e) {
  const t = l.useRef(e);
  return (
    A(() => {
      t.current = e;
    }),
    t
  );
}
var A = typeof window > 'u' ? l.useEffect : l.useLayoutEffect;
function L(e) {
  const t = l.useRef();
  return t.current === void 0 && (t.current = e()), t;
}
function R(e) {
  const t = oe(),
    r = () => e(t.snapshot());
  return l.useSyncExternalStore(t.subscribe, r, r);
}
function ke(e, t, r, i = []) {
  const a = l.useRef(),
    o = z();
  return (
    A(() => {
      var c;
      const m = (() => {
          var s;
          for (const v of r) {
            if (typeof v == 'string') return v.trim();
            if (typeof v == 'object' && 'current' in v)
              return v.current
                ? (s = v.current.textContent) == null
                  ? void 0
                  : s.trim()
                : a.current;
          }
        })(),
        p = i.map((s) => s.trim());
      o.value(e, m, p), (c = t.current) == null || c.setAttribute(D, m), (a.current = m);
    }),
    a
  );
}
var ct = () => {
  const [e, t] = l.useState(),
    r = L(() => new Map());
  return (
    A(() => {
      r.current.forEach((i) => i()), (r.current = new Map());
    }, [e]),
    (i, a) => {
      r.current.set(i, a), t({});
    }
  );
};
function dt(e) {
  const t = e.type;
  return typeof t == 'function' ? t(e.props) : 'render' in t ? t.render(e.props) : e;
}
function B({ asChild: e, children: t }, r) {
  return e && l.isValidElement(t)
    ? l.cloneElement(dt(t), { ref: t.ref }, r(t.props.children))
    : r(t);
}
var mt = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};
function ft({ className: e, ...t }) {
  return S.jsx(P, {
    'data-slot': 'command',
    className: $(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      e,
    ),
    ...t,
  });
}
function pt({ className: e, ...t }) {
  return S.jsxs('div', {
    'data-slot': 'command-input-wrapper',
    className: 'flex h-9 items-center gap-2 border-b px-3',
    children: [
      S.jsx(Pe, { className: 'size-4 shrink-0 opacity-50' }),
      S.jsx(P.Input, {
        'data-slot': 'command-input',
        className: $(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          e,
        ),
        ...t,
      }),
    ],
  });
}
function vt({ className: e, ...t }) {
  return S.jsx(P.List, {
    'data-slot': 'command-list',
    className: $('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto', e),
    ...t,
  });
}
function gt({ ...e }) {
  return S.jsx(P.Empty, {
    'data-slot': 'command-empty',
    className: 'py-6 text-center text-sm',
    ...e,
  });
}
function ht({ className: e, ...t }) {
  return S.jsx(P.Group, {
    'data-slot': 'command-group',
    className: $(
      'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
      e,
    ),
    ...t,
  });
}
function bt({ className: e, ...t }) {
  return S.jsx(P.Separator, {
    'data-slot': 'command-separator',
    className: $('-mx-1 h-px bg-border', e),
    ...t,
  });
}
function yt({ className: e, ...t }) {
  return S.jsx(P.Item, {
    'data-slot': 'command-item',
    className: $(
      "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
      e,
    ),
    ...t,
  });
}
function xt({ className: e, ...t }) {
  return S.jsx('span', {
    'data-slot': 'command-shortcut',
    className: $('ml-auto text-xs tracking-widest text-muted-foreground', e),
    ...t,
  });
}
ft.__docgenInfo = { description: '', methods: [], displayName: 'Command' };
pt.__docgenInfo = { description: '', methods: [], displayName: 'CommandInput' };
vt.__docgenInfo = { description: '', methods: [], displayName: 'CommandList' };
gt.__docgenInfo = { description: '', methods: [], displayName: 'CommandEmpty' };
ht.__docgenInfo = { description: '', methods: [], displayName: 'CommandGroup' };
yt.__docgenInfo = { description: '', methods: [], displayName: 'CommandItem' };
xt.__docgenInfo = { description: '', methods: [], displayName: 'CommandShortcut' };
bt.__docgenInfo = { description: '', methods: [], displayName: 'CommandSeparator' };
export { ft as C, pt as a, vt as b, gt as c, ht as d, yt as e, xt as f, bt as g };
