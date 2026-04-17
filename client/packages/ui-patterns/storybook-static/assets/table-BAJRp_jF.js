import { o as cr, r as l, R as rt } from './index-B3e6rcmj.js';
import { O as $a, r as wn } from './index-JG1J0hlI.js';
import { j as h } from './jsx-runtime-BjG_zV1W.js';
function Cn(e) {
  var t,
    r,
    n = '';
  if (typeof e == 'string' || typeof e == 'number') n += e;
  else if (typeof e == 'object')
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++) e[t] && (r = Cn(e[t])) && (n && (n += ' '), (n += r));
    } else for (r in e) e[r] && (n && (n += ' '), (n += r));
  return n;
}
function kn() {
  for (var e, t, r = 0, n = '', o = arguments.length; r < o; r++)
    (e = arguments[r]) && (t = Cn(e)) && (n && (n += ' '), (n += t));
  return n;
}
const za = (e, t) => {
    const r = new Array(e.length + t.length);
    for (let n = 0; n < e.length; n++) r[n] = e[n];
    for (let n = 0; n < t.length; n++) r[e.length + n] = t[n];
    return r;
  },
  Fa = (e, t) => ({ classGroupId: e, validator: t }),
  En = (e = new Map(), t = null, r) => ({ nextPart: e, validators: t, classGroupId: r }),
  Ct = '-',
  $r = [],
  Wa = 'arbitrary..',
  Ba = (e) => {
    const t = Ha(e),
      { conflictingClassGroups: r, conflictingClassGroupModifiers: n } = e;
    return {
      getClassGroupId: (s) => {
        if (s.startsWith('[') && s.endsWith(']')) return Va(s);
        const i = s.split(Ct),
          d = i[0] === '' && i.length > 1 ? 1 : 0;
        return An(i, d, t);
      },
      getConflictingClassGroupIds: (s, i) => {
        if (i) {
          const d = n[s],
            c = r[s];
          return d ? (c ? za(c, d) : d) : c || $r;
        }
        return r[s] || $r;
      },
    };
  },
  An = (e, t, r) => {
    if (e.length - t === 0) return r.classGroupId;
    const o = e[t],
      a = r.nextPart.get(o);
    if (a) {
      const c = An(e, t + 1, a);
      if (c) return c;
    }
    const s = r.validators;
    if (s === null) return;
    const i = t === 0 ? e.join(Ct) : e.slice(t).join(Ct),
      d = s.length;
    for (let c = 0; c < d; c++) {
      const u = s[c];
      if (u.validator(i)) return u.classGroupId;
    }
  },
  Va = (e) =>
    e.slice(1, -1).indexOf(':') === -1
      ? void 0
      : (() => {
          const t = e.slice(1, -1),
            r = t.indexOf(':'),
            n = t.slice(0, r);
          return n ? Wa + n : void 0;
        })(),
  Ha = (e) => {
    const { theme: t, classGroups: r } = e;
    return Ua(r, t);
  },
  Ua = (e, t) => {
    const r = En();
    for (const n in e) {
      const o = e[n];
      dr(o, r, n, t);
    }
    return r;
  },
  dr = (e, t, r, n) => {
    const o = e.length;
    for (let a = 0; a < o; a++) {
      const s = e[a];
      Ga(s, t, r, n);
    }
  },
  Ga = (e, t, r, n) => {
    if (typeof e == 'string') {
      Ya(e, t, r);
      return;
    }
    if (typeof e == 'function') {
      qa(e, t, r, n);
      return;
    }
    Xa(e, t, r, n);
  },
  Ya = (e, t, r) => {
    const n = e === '' ? t : Sn(t, e);
    n.classGroupId = r;
  },
  qa = (e, t, r, n) => {
    if (Ka(e)) {
      dr(e(n), t, r, n);
      return;
    }
    t.validators === null && (t.validators = []), t.validators.push(Fa(r, e));
  },
  Xa = (e, t, r, n) => {
    const o = Object.entries(e),
      a = o.length;
    for (let s = 0; s < a; s++) {
      const [i, d] = o[s];
      dr(d, Sn(t, i), r, n);
    }
  },
  Sn = (e, t) => {
    let r = e;
    const n = t.split(Ct),
      o = n.length;
    for (let a = 0; a < o; a++) {
      const s = n[a];
      let i = r.nextPart.get(s);
      i || ((i = En()), r.nextPart.set(s, i)), (r = i);
    }
    return r;
  },
  Ka = (e) => 'isThemeGetter' in e && e.isThemeGetter === !0,
  Za = (e) => {
    if (e < 1) return { get: () => {}, set: () => {} };
    let t = 0,
      r = Object.create(null),
      n = Object.create(null);
    const o = (a, s) => {
      (r[a] = s), t++, t > e && ((t = 0), (n = r), (r = Object.create(null)));
    };
    return {
      get(a) {
        let s = r[a];
        if (s !== void 0) return s;
        if ((s = n[a]) !== void 0) return o(a, s), s;
      },
      set(a, s) {
        a in r ? (r[a] = s) : o(a, s);
      },
    };
  },
  er = '!',
  zr = ':',
  Qa = [],
  Fr = (e, t, r, n, o) => ({
    modifiers: e,
    hasImportantModifier: t,
    baseClassName: r,
    maybePostfixModifierPosition: n,
    isExternal: o,
  }),
  Ja = (e) => {
    const { prefix: t, experimentalParseClassName: r } = e;
    let n = (o) => {
      const a = [];
      let s = 0,
        i = 0,
        d = 0,
        c;
      const u = o.length;
      for (let g = 0; g < u; g++) {
        const b = o[g];
        if (s === 0 && i === 0) {
          if (b === zr) {
            a.push(o.slice(d, g)), (d = g + 1);
            continue;
          }
          if (b === '/') {
            c = g;
            continue;
          }
        }
        b === '[' ? s++ : b === ']' ? s-- : b === '(' ? i++ : b === ')' && i--;
      }
      const f = a.length === 0 ? o : o.slice(d);
      let m = f,
        p = !1;
      f.endsWith(er)
        ? ((m = f.slice(0, -1)), (p = !0))
        : f.startsWith(er) && ((m = f.slice(1)), (p = !0));
      const v = c && c > d ? c - d : void 0;
      return Fr(a, p, m, v);
    };
    if (t) {
      const o = t + zr,
        a = n;
      n = (s) => (s.startsWith(o) ? a(s.slice(o.length)) : Fr(Qa, !1, s, void 0, !0));
    }
    if (r) {
      const o = n;
      n = (a) => r({ className: a, parseClassName: o });
    }
    return n;
  },
  es = (e) => {
    const t = new Map();
    return (
      e.orderSensitiveModifiers.forEach((r, n) => {
        t.set(r, 1e6 + n);
      }),
      (r) => {
        const n = [];
        let o = [];
        for (let a = 0; a < r.length; a++) {
          const s = r[a],
            i = s[0] === '[',
            d = t.has(s);
          i || d ? (o.length > 0 && (o.sort(), n.push(...o), (o = [])), n.push(s)) : o.push(s);
        }
        return o.length > 0 && (o.sort(), n.push(...o)), n;
      }
    );
  },
  ts = (e) => ({ cache: Za(e.cacheSize), parseClassName: Ja(e), sortModifiers: es(e), ...Ba(e) }),
  rs = /\s+/,
  ns = (e, t) => {
    const {
        parseClassName: r,
        getClassGroupId: n,
        getConflictingClassGroupIds: o,
        sortModifiers: a,
      } = t,
      s = [],
      i = e.trim().split(rs);
    let d = '';
    for (let c = i.length - 1; c >= 0; c -= 1) {
      const u = i[c],
        {
          isExternal: f,
          modifiers: m,
          hasImportantModifier: p,
          baseClassName: v,
          maybePostfixModifierPosition: g,
        } = r(u);
      if (f) {
        d = u + (d.length > 0 ? ' ' + d : d);
        continue;
      }
      let b = !!g,
        y = n(b ? v.substring(0, g) : v);
      if (!y) {
        if (!b) {
          d = u + (d.length > 0 ? ' ' + d : d);
          continue;
        }
        if (((y = n(v)), !y)) {
          d = u + (d.length > 0 ? ' ' + d : d);
          continue;
        }
        b = !1;
      }
      const w = m.length === 0 ? '' : m.length === 1 ? m[0] : a(m).join(':'),
        A = p ? w + er : w,
        C = A + y;
      if (s.indexOf(C) > -1) continue;
      s.push(C);
      const R = o(y, b);
      for (let E = 0; E < R.length; ++E) {
        const S = R[E];
        s.push(A + S);
      }
      d = u + (d.length > 0 ? ' ' + d : d);
    }
    return d;
  },
  os = (...e) => {
    let t = 0,
      r,
      n,
      o = '';
    while (t < e.length) (r = e[t++]) && (n = Rn(r)) && (o && (o += ' '), (o += n));
    return o;
  },
  Rn = (e) => {
    if (typeof e == 'string') return e;
    let t,
      r = '';
    for (let n = 0; n < e.length; n++) e[n] && (t = Rn(e[n])) && (r && (r += ' '), (r += t));
    return r;
  },
  as = (e, ...t) => {
    let r, n, o, a;
    const s = (d) => {
        const c = t.reduce((u, f) => f(u), e());
        return (r = ts(c)), (n = r.cache.get), (o = r.cache.set), (a = i), i(d);
      },
      i = (d) => {
        const c = n(d);
        if (c) return c;
        const u = ns(d, r);
        return o(d, u), u;
      };
    return (a = s), (...d) => a(os(...d));
  },
  ss = [],
  Z = (e) => {
    const t = (r) => r[e] || ss;
    return (t.isThemeGetter = !0), t;
  },
  Pn = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
  Nn = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
  is = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,
  ls = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  cs =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  ds = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
  us = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  fs =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  xe = (e) => is.test(e),
  M = (e) => !!e && !Number.isNaN(Number(e)),
  we = (e) => !!e && Number.isInteger(Number(e)),
  zt = (e) => e.endsWith('%') && M(e.slice(0, -1)),
  ge = (e) => ls.test(e),
  On = () => !0,
  ms = (e) => cs.test(e) && !ds.test(e),
  ur = () => !1,
  ps = (e) => us.test(e),
  gs = (e) => fs.test(e),
  hs = (e) => !N(e) && !_(e),
  vs = (e) => Ne(e, Tn, ur),
  N = (e) => Pn.test(e),
  Me = (e) => Ne(e, In, ms),
  Wr = (e) => Ne(e, As, M),
  bs = (e) => Ne(e, jn, On),
  ys = (e) => Ne(e, Mn, ur),
  Br = (e) => Ne(e, _n, ur),
  xs = (e) => Ne(e, Dn, gs),
  ut = (e) => Ne(e, Ln, ps),
  _ = (e) => Nn.test(e),
  nt = (e) => Fe(e, In),
  ws = (e) => Fe(e, Mn),
  Vr = (e) => Fe(e, _n),
  Cs = (e) => Fe(e, Tn),
  ks = (e) => Fe(e, Dn),
  ft = (e) => Fe(e, Ln, !0),
  Es = (e) => Fe(e, jn, !0),
  Ne = (e, t, r) => {
    const n = Pn.exec(e);
    return n ? (n[1] ? t(n[1]) : r(n[2])) : !1;
  },
  Fe = (e, t, r = !1) => {
    const n = Nn.exec(e);
    return n ? (n[1] ? t(n[1]) : r) : !1;
  },
  _n = (e) => e === 'position' || e === 'percentage',
  Dn = (e) => e === 'image' || e === 'url',
  Tn = (e) => e === 'length' || e === 'size' || e === 'bg-size',
  In = (e) => e === 'length',
  As = (e) => e === 'number',
  Mn = (e) => e === 'family-name',
  jn = (e) => e === 'number' || e === 'weight',
  Ln = (e) => e === 'shadow',
  Ss = () => {
    const e = Z('color'),
      t = Z('font'),
      r = Z('text'),
      n = Z('font-weight'),
      o = Z('tracking'),
      a = Z('leading'),
      s = Z('breakpoint'),
      i = Z('container'),
      d = Z('spacing'),
      c = Z('radius'),
      u = Z('shadow'),
      f = Z('inset-shadow'),
      m = Z('text-shadow'),
      p = Z('drop-shadow'),
      v = Z('blur'),
      g = Z('perspective'),
      b = Z('aspect'),
      y = Z('ease'),
      w = Z('animate'),
      A = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'],
      C = () => [
        'center',
        'top',
        'bottom',
        'left',
        'right',
        'top-left',
        'left-top',
        'top-right',
        'right-top',
        'bottom-right',
        'right-bottom',
        'bottom-left',
        'left-bottom',
      ],
      R = () => [...C(), _, N],
      E = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'],
      S = () => ['auto', 'contain', 'none'],
      k = () => [_, N, d],
      j = () => [xe, 'full', 'auto', ...k()],
      W = () => [we, 'none', 'subgrid', _, N],
      U = () => ['auto', { span: ['full', we, _, N] }, we, _, N],
      G = () => [we, 'auto', _, N],
      q = () => ['auto', 'min', 'max', 'fr', _, N],
      F = () => [
        'start',
        'end',
        'center',
        'between',
        'around',
        'evenly',
        'stretch',
        'baseline',
        'center-safe',
        'end-safe',
      ],
      Y = () => ['start', 'end', 'center', 'stretch', 'center-safe', 'end-safe'],
      z = () => ['auto', ...k()],
      B = () => [
        xe,
        'auto',
        'full',
        'dvw',
        'dvh',
        'lvw',
        'lvh',
        'svw',
        'svh',
        'min',
        'max',
        'fit',
        ...k(),
      ],
      I = () => [xe, 'screen', 'full', 'dvw', 'lvw', 'svw', 'min', 'max', 'fit', ...k()],
      X = () => [xe, 'screen', 'full', 'lh', 'dvh', 'lvh', 'svh', 'min', 'max', 'fit', ...k()],
      O = () => [e, _, N],
      ie = () => [...C(), Vr, Br, { position: [_, N] }],
      x = () => ['no-repeat', { repeat: ['', 'x', 'y', 'space', 'round'] }],
      D = () => ['auto', 'cover', 'contain', Cs, vs, { size: [_, N] }],
      L = () => [zt, nt, Me],
      P = () => ['', 'none', 'full', c, _, N],
      T = () => ['', M, nt, Me],
      V = () => ['solid', 'dashed', 'dotted', 'double'],
      K = () => [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity',
      ],
      $ = () => [M, zt, Vr, Br],
      le = () => ['', 'none', v, _, N],
      De = () => ['none', M, _, N],
      Te = () => ['none', M, _, N],
      pe = () => [M, _, N],
      Ie = () => [xe, 'full', ...k()];
    return {
      cacheSize: 500,
      theme: {
        animate: ['spin', 'ping', 'pulse', 'bounce'],
        aspect: ['video'],
        blur: [ge],
        breakpoint: [ge],
        color: [On],
        container: [ge],
        'drop-shadow': [ge],
        ease: ['in', 'out', 'in-out'],
        font: [hs],
        'font-weight': [
          'thin',
          'extralight',
          'light',
          'normal',
          'medium',
          'semibold',
          'bold',
          'extrabold',
          'black',
        ],
        'inset-shadow': [ge],
        leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
        perspective: ['dramatic', 'near', 'normal', 'midrange', 'distant', 'none'],
        radius: [ge],
        shadow: [ge],
        spacing: ['px', M],
        text: [ge],
        'text-shadow': [ge],
        tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'],
      },
      classGroups: {
        aspect: [{ aspect: ['auto', 'square', xe, N, _, b] }],
        container: ['container'],
        columns: [{ columns: [M, N, _, i] }],
        'break-after': [{ 'break-after': A() }],
        'break-before': [{ 'break-before': A() }],
        'break-inside': [{ 'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'] }],
        'box-decoration': [{ 'box-decoration': ['slice', 'clone'] }],
        box: [{ box: ['border', 'content'] }],
        display: [
          'block',
          'inline-block',
          'inline',
          'flex',
          'inline-flex',
          'table',
          'inline-table',
          'table-caption',
          'table-cell',
          'table-column',
          'table-column-group',
          'table-footer-group',
          'table-header-group',
          'table-row-group',
          'table-row',
          'flow-root',
          'grid',
          'inline-grid',
          'contents',
          'list-item',
          'hidden',
        ],
        sr: ['sr-only', 'not-sr-only'],
        float: [{ float: ['right', 'left', 'none', 'start', 'end'] }],
        clear: [{ clear: ['left', 'right', 'both', 'none', 'start', 'end'] }],
        isolation: ['isolate', 'isolation-auto'],
        'object-fit': [{ object: ['contain', 'cover', 'fill', 'none', 'scale-down'] }],
        'object-position': [{ object: R() }],
        overflow: [{ overflow: E() }],
        'overflow-x': [{ 'overflow-x': E() }],
        'overflow-y': [{ 'overflow-y': E() }],
        overscroll: [{ overscroll: S() }],
        'overscroll-x': [{ 'overscroll-x': S() }],
        'overscroll-y': [{ 'overscroll-y': S() }],
        position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
        inset: [{ inset: j() }],
        'inset-x': [{ 'inset-x': j() }],
        'inset-y': [{ 'inset-y': j() }],
        start: [{ 'inset-s': j(), start: j() }],
        end: [{ 'inset-e': j(), end: j() }],
        'inset-bs': [{ 'inset-bs': j() }],
        'inset-be': [{ 'inset-be': j() }],
        top: [{ top: j() }],
        right: [{ right: j() }],
        bottom: [{ bottom: j() }],
        left: [{ left: j() }],
        visibility: ['visible', 'invisible', 'collapse'],
        z: [{ z: [we, 'auto', _, N] }],
        basis: [{ basis: [xe, 'full', 'auto', i, ...k()] }],
        'flex-direction': [{ flex: ['row', 'row-reverse', 'col', 'col-reverse'] }],
        'flex-wrap': [{ flex: ['nowrap', 'wrap', 'wrap-reverse'] }],
        flex: [{ flex: [M, xe, 'auto', 'initial', 'none', N] }],
        grow: [{ grow: ['', M, _, N] }],
        shrink: [{ shrink: ['', M, _, N] }],
        order: [{ order: [we, 'first', 'last', 'none', _, N] }],
        'grid-cols': [{ 'grid-cols': W() }],
        'col-start-end': [{ col: U() }],
        'col-start': [{ 'col-start': G() }],
        'col-end': [{ 'col-end': G() }],
        'grid-rows': [{ 'grid-rows': W() }],
        'row-start-end': [{ row: U() }],
        'row-start': [{ 'row-start': G() }],
        'row-end': [{ 'row-end': G() }],
        'grid-flow': [{ 'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'] }],
        'auto-cols': [{ 'auto-cols': q() }],
        'auto-rows': [{ 'auto-rows': q() }],
        gap: [{ gap: k() }],
        'gap-x': [{ 'gap-x': k() }],
        'gap-y': [{ 'gap-y': k() }],
        'justify-content': [{ justify: [...F(), 'normal'] }],
        'justify-items': [{ 'justify-items': [...Y(), 'normal'] }],
        'justify-self': [{ 'justify-self': ['auto', ...Y()] }],
        'align-content': [{ content: ['normal', ...F()] }],
        'align-items': [{ items: [...Y(), { baseline: ['', 'last'] }] }],
        'align-self': [{ self: ['auto', ...Y(), { baseline: ['', 'last'] }] }],
        'place-content': [{ 'place-content': F() }],
        'place-items': [{ 'place-items': [...Y(), 'baseline'] }],
        'place-self': [{ 'place-self': ['auto', ...Y()] }],
        p: [{ p: k() }],
        px: [{ px: k() }],
        py: [{ py: k() }],
        ps: [{ ps: k() }],
        pe: [{ pe: k() }],
        pbs: [{ pbs: k() }],
        pbe: [{ pbe: k() }],
        pt: [{ pt: k() }],
        pr: [{ pr: k() }],
        pb: [{ pb: k() }],
        pl: [{ pl: k() }],
        m: [{ m: z() }],
        mx: [{ mx: z() }],
        my: [{ my: z() }],
        ms: [{ ms: z() }],
        me: [{ me: z() }],
        mbs: [{ mbs: z() }],
        mbe: [{ mbe: z() }],
        mt: [{ mt: z() }],
        mr: [{ mr: z() }],
        mb: [{ mb: z() }],
        ml: [{ ml: z() }],
        'space-x': [{ 'space-x': k() }],
        'space-x-reverse': ['space-x-reverse'],
        'space-y': [{ 'space-y': k() }],
        'space-y-reverse': ['space-y-reverse'],
        size: [{ size: B() }],
        'inline-size': [{ inline: ['auto', ...I()] }],
        'min-inline-size': [{ 'min-inline': ['auto', ...I()] }],
        'max-inline-size': [{ 'max-inline': ['none', ...I()] }],
        'block-size': [{ block: ['auto', ...X()] }],
        'min-block-size': [{ 'min-block': ['auto', ...X()] }],
        'max-block-size': [{ 'max-block': ['none', ...X()] }],
        w: [{ w: [i, 'screen', ...B()] }],
        'min-w': [{ 'min-w': [i, 'screen', 'none', ...B()] }],
        'max-w': [{ 'max-w': [i, 'screen', 'none', 'prose', { screen: [s] }, ...B()] }],
        h: [{ h: ['screen', 'lh', ...B()] }],
        'min-h': [{ 'min-h': ['screen', 'lh', 'none', ...B()] }],
        'max-h': [{ 'max-h': ['screen', 'lh', ...B()] }],
        'font-size': [{ text: ['base', r, nt, Me] }],
        'font-smoothing': ['antialiased', 'subpixel-antialiased'],
        'font-style': ['italic', 'not-italic'],
        'font-weight': [{ font: [n, Es, bs] }],
        'font-stretch': [
          {
            'font-stretch': [
              'ultra-condensed',
              'extra-condensed',
              'condensed',
              'semi-condensed',
              'normal',
              'semi-expanded',
              'expanded',
              'extra-expanded',
              'ultra-expanded',
              zt,
              N,
            ],
          },
        ],
        'font-family': [{ font: [ws, ys, t] }],
        'font-features': [{ 'font-features': [N] }],
        'fvn-normal': ['normal-nums'],
        'fvn-ordinal': ['ordinal'],
        'fvn-slashed-zero': ['slashed-zero'],
        'fvn-figure': ['lining-nums', 'oldstyle-nums'],
        'fvn-spacing': ['proportional-nums', 'tabular-nums'],
        'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
        tracking: [{ tracking: [o, _, N] }],
        'line-clamp': [{ 'line-clamp': [M, 'none', _, Wr] }],
        leading: [{ leading: [a, ...k()] }],
        'list-image': [{ 'list-image': ['none', _, N] }],
        'list-style-position': [{ list: ['inside', 'outside'] }],
        'list-style-type': [{ list: ['disc', 'decimal', 'none', _, N] }],
        'text-alignment': [{ text: ['left', 'center', 'right', 'justify', 'start', 'end'] }],
        'placeholder-color': [{ placeholder: O() }],
        'text-color': [{ text: O() }],
        'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
        'text-decoration-style': [{ decoration: [...V(), 'wavy'] }],
        'text-decoration-thickness': [{ decoration: [M, 'from-font', 'auto', _, Me] }],
        'text-decoration-color': [{ decoration: O() }],
        'underline-offset': [{ 'underline-offset': [M, 'auto', _, N] }],
        'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
        'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
        'text-wrap': [{ text: ['wrap', 'nowrap', 'balance', 'pretty'] }],
        indent: [{ indent: k() }],
        'vertical-align': [
          {
            align: [
              'baseline',
              'top',
              'middle',
              'bottom',
              'text-top',
              'text-bottom',
              'sub',
              'super',
              _,
              N,
            ],
          },
        ],
        whitespace: [
          { whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'] },
        ],
        break: [{ break: ['normal', 'words', 'all', 'keep'] }],
        wrap: [{ wrap: ['break-word', 'anywhere', 'normal'] }],
        hyphens: [{ hyphens: ['none', 'manual', 'auto'] }],
        content: [{ content: ['none', _, N] }],
        'bg-attachment': [{ bg: ['fixed', 'local', 'scroll'] }],
        'bg-clip': [{ 'bg-clip': ['border', 'padding', 'content', 'text'] }],
        'bg-origin': [{ 'bg-origin': ['border', 'padding', 'content'] }],
        'bg-position': [{ bg: ie() }],
        'bg-repeat': [{ bg: x() }],
        'bg-size': [{ bg: D() }],
        'bg-image': [
          {
            bg: [
              'none',
              {
                linear: [{ to: ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'] }, we, _, N],
                radial: ['', _, N],
                conic: [we, _, N],
              },
              ks,
              xs,
            ],
          },
        ],
        'bg-color': [{ bg: O() }],
        'gradient-from-pos': [{ from: L() }],
        'gradient-via-pos': [{ via: L() }],
        'gradient-to-pos': [{ to: L() }],
        'gradient-from': [{ from: O() }],
        'gradient-via': [{ via: O() }],
        'gradient-to': [{ to: O() }],
        rounded: [{ rounded: P() }],
        'rounded-s': [{ 'rounded-s': P() }],
        'rounded-e': [{ 'rounded-e': P() }],
        'rounded-t': [{ 'rounded-t': P() }],
        'rounded-r': [{ 'rounded-r': P() }],
        'rounded-b': [{ 'rounded-b': P() }],
        'rounded-l': [{ 'rounded-l': P() }],
        'rounded-ss': [{ 'rounded-ss': P() }],
        'rounded-se': [{ 'rounded-se': P() }],
        'rounded-ee': [{ 'rounded-ee': P() }],
        'rounded-es': [{ 'rounded-es': P() }],
        'rounded-tl': [{ 'rounded-tl': P() }],
        'rounded-tr': [{ 'rounded-tr': P() }],
        'rounded-br': [{ 'rounded-br': P() }],
        'rounded-bl': [{ 'rounded-bl': P() }],
        'border-w': [{ border: T() }],
        'border-w-x': [{ 'border-x': T() }],
        'border-w-y': [{ 'border-y': T() }],
        'border-w-s': [{ 'border-s': T() }],
        'border-w-e': [{ 'border-e': T() }],
        'border-w-bs': [{ 'border-bs': T() }],
        'border-w-be': [{ 'border-be': T() }],
        'border-w-t': [{ 'border-t': T() }],
        'border-w-r': [{ 'border-r': T() }],
        'border-w-b': [{ 'border-b': T() }],
        'border-w-l': [{ 'border-l': T() }],
        'divide-x': [{ 'divide-x': T() }],
        'divide-x-reverse': ['divide-x-reverse'],
        'divide-y': [{ 'divide-y': T() }],
        'divide-y-reverse': ['divide-y-reverse'],
        'border-style': [{ border: [...V(), 'hidden', 'none'] }],
        'divide-style': [{ divide: [...V(), 'hidden', 'none'] }],
        'border-color': [{ border: O() }],
        'border-color-x': [{ 'border-x': O() }],
        'border-color-y': [{ 'border-y': O() }],
        'border-color-s': [{ 'border-s': O() }],
        'border-color-e': [{ 'border-e': O() }],
        'border-color-bs': [{ 'border-bs': O() }],
        'border-color-be': [{ 'border-be': O() }],
        'border-color-t': [{ 'border-t': O() }],
        'border-color-r': [{ 'border-r': O() }],
        'border-color-b': [{ 'border-b': O() }],
        'border-color-l': [{ 'border-l': O() }],
        'divide-color': [{ divide: O() }],
        'outline-style': [{ outline: [...V(), 'none', 'hidden'] }],
        'outline-offset': [{ 'outline-offset': [M, _, N] }],
        'outline-w': [{ outline: ['', M, nt, Me] }],
        'outline-color': [{ outline: O() }],
        shadow: [{ shadow: ['', 'none', u, ft, ut] }],
        'shadow-color': [{ shadow: O() }],
        'inset-shadow': [{ 'inset-shadow': ['none', f, ft, ut] }],
        'inset-shadow-color': [{ 'inset-shadow': O() }],
        'ring-w': [{ ring: T() }],
        'ring-w-inset': ['ring-inset'],
        'ring-color': [{ ring: O() }],
        'ring-offset-w': [{ 'ring-offset': [M, Me] }],
        'ring-offset-color': [{ 'ring-offset': O() }],
        'inset-ring-w': [{ 'inset-ring': T() }],
        'inset-ring-color': [{ 'inset-ring': O() }],
        'text-shadow': [{ 'text-shadow': ['none', m, ft, ut] }],
        'text-shadow-color': [{ 'text-shadow': O() }],
        opacity: [{ opacity: [M, _, N] }],
        'mix-blend': [{ 'mix-blend': [...K(), 'plus-darker', 'plus-lighter'] }],
        'bg-blend': [{ 'bg-blend': K() }],
        'mask-clip': [
          { 'mask-clip': ['border', 'padding', 'content', 'fill', 'stroke', 'view'] },
          'mask-no-clip',
        ],
        'mask-composite': [{ mask: ['add', 'subtract', 'intersect', 'exclude'] }],
        'mask-image-linear-pos': [{ 'mask-linear': [M] }],
        'mask-image-linear-from-pos': [{ 'mask-linear-from': $() }],
        'mask-image-linear-to-pos': [{ 'mask-linear-to': $() }],
        'mask-image-linear-from-color': [{ 'mask-linear-from': O() }],
        'mask-image-linear-to-color': [{ 'mask-linear-to': O() }],
        'mask-image-t-from-pos': [{ 'mask-t-from': $() }],
        'mask-image-t-to-pos': [{ 'mask-t-to': $() }],
        'mask-image-t-from-color': [{ 'mask-t-from': O() }],
        'mask-image-t-to-color': [{ 'mask-t-to': O() }],
        'mask-image-r-from-pos': [{ 'mask-r-from': $() }],
        'mask-image-r-to-pos': [{ 'mask-r-to': $() }],
        'mask-image-r-from-color': [{ 'mask-r-from': O() }],
        'mask-image-r-to-color': [{ 'mask-r-to': O() }],
        'mask-image-b-from-pos': [{ 'mask-b-from': $() }],
        'mask-image-b-to-pos': [{ 'mask-b-to': $() }],
        'mask-image-b-from-color': [{ 'mask-b-from': O() }],
        'mask-image-b-to-color': [{ 'mask-b-to': O() }],
        'mask-image-l-from-pos': [{ 'mask-l-from': $() }],
        'mask-image-l-to-pos': [{ 'mask-l-to': $() }],
        'mask-image-l-from-color': [{ 'mask-l-from': O() }],
        'mask-image-l-to-color': [{ 'mask-l-to': O() }],
        'mask-image-x-from-pos': [{ 'mask-x-from': $() }],
        'mask-image-x-to-pos': [{ 'mask-x-to': $() }],
        'mask-image-x-from-color': [{ 'mask-x-from': O() }],
        'mask-image-x-to-color': [{ 'mask-x-to': O() }],
        'mask-image-y-from-pos': [{ 'mask-y-from': $() }],
        'mask-image-y-to-pos': [{ 'mask-y-to': $() }],
        'mask-image-y-from-color': [{ 'mask-y-from': O() }],
        'mask-image-y-to-color': [{ 'mask-y-to': O() }],
        'mask-image-radial': [{ 'mask-radial': [_, N] }],
        'mask-image-radial-from-pos': [{ 'mask-radial-from': $() }],
        'mask-image-radial-to-pos': [{ 'mask-radial-to': $() }],
        'mask-image-radial-from-color': [{ 'mask-radial-from': O() }],
        'mask-image-radial-to-color': [{ 'mask-radial-to': O() }],
        'mask-image-radial-shape': [{ 'mask-radial': ['circle', 'ellipse'] }],
        'mask-image-radial-size': [
          { 'mask-radial': [{ closest: ['side', 'corner'], farthest: ['side', 'corner'] }] },
        ],
        'mask-image-radial-pos': [{ 'mask-radial-at': C() }],
        'mask-image-conic-pos': [{ 'mask-conic': [M] }],
        'mask-image-conic-from-pos': [{ 'mask-conic-from': $() }],
        'mask-image-conic-to-pos': [{ 'mask-conic-to': $() }],
        'mask-image-conic-from-color': [{ 'mask-conic-from': O() }],
        'mask-image-conic-to-color': [{ 'mask-conic-to': O() }],
        'mask-mode': [{ mask: ['alpha', 'luminance', 'match'] }],
        'mask-origin': [
          { 'mask-origin': ['border', 'padding', 'content', 'fill', 'stroke', 'view'] },
        ],
        'mask-position': [{ mask: ie() }],
        'mask-repeat': [{ mask: x() }],
        'mask-size': [{ mask: D() }],
        'mask-type': [{ 'mask-type': ['alpha', 'luminance'] }],
        'mask-image': [{ mask: ['none', _, N] }],
        filter: [{ filter: ['', 'none', _, N] }],
        blur: [{ blur: le() }],
        brightness: [{ brightness: [M, _, N] }],
        contrast: [{ contrast: [M, _, N] }],
        'drop-shadow': [{ 'drop-shadow': ['', 'none', p, ft, ut] }],
        'drop-shadow-color': [{ 'drop-shadow': O() }],
        grayscale: [{ grayscale: ['', M, _, N] }],
        'hue-rotate': [{ 'hue-rotate': [M, _, N] }],
        invert: [{ invert: ['', M, _, N] }],
        saturate: [{ saturate: [M, _, N] }],
        sepia: [{ sepia: ['', M, _, N] }],
        'backdrop-filter': [{ 'backdrop-filter': ['', 'none', _, N] }],
        'backdrop-blur': [{ 'backdrop-blur': le() }],
        'backdrop-brightness': [{ 'backdrop-brightness': [M, _, N] }],
        'backdrop-contrast': [{ 'backdrop-contrast': [M, _, N] }],
        'backdrop-grayscale': [{ 'backdrop-grayscale': ['', M, _, N] }],
        'backdrop-hue-rotate': [{ 'backdrop-hue-rotate': [M, _, N] }],
        'backdrop-invert': [{ 'backdrop-invert': ['', M, _, N] }],
        'backdrop-opacity': [{ 'backdrop-opacity': [M, _, N] }],
        'backdrop-saturate': [{ 'backdrop-saturate': [M, _, N] }],
        'backdrop-sepia': [{ 'backdrop-sepia': ['', M, _, N] }],
        'border-collapse': [{ border: ['collapse', 'separate'] }],
        'border-spacing': [{ 'border-spacing': k() }],
        'border-spacing-x': [{ 'border-spacing-x': k() }],
        'border-spacing-y': [{ 'border-spacing-y': k() }],
        'table-layout': [{ table: ['auto', 'fixed'] }],
        caption: [{ caption: ['top', 'bottom'] }],
        transition: [
          { transition: ['', 'all', 'colors', 'opacity', 'shadow', 'transform', 'none', _, N] },
        ],
        'transition-behavior': [{ transition: ['normal', 'discrete'] }],
        duration: [{ duration: [M, 'initial', _, N] }],
        ease: [{ ease: ['linear', 'initial', y, _, N] }],
        delay: [{ delay: [M, _, N] }],
        animate: [{ animate: ['none', w, _, N] }],
        backface: [{ backface: ['hidden', 'visible'] }],
        perspective: [{ perspective: [g, _, N] }],
        'perspective-origin': [{ 'perspective-origin': R() }],
        rotate: [{ rotate: De() }],
        'rotate-x': [{ 'rotate-x': De() }],
        'rotate-y': [{ 'rotate-y': De() }],
        'rotate-z': [{ 'rotate-z': De() }],
        scale: [{ scale: Te() }],
        'scale-x': [{ 'scale-x': Te() }],
        'scale-y': [{ 'scale-y': Te() }],
        'scale-z': [{ 'scale-z': Te() }],
        'scale-3d': ['scale-3d'],
        skew: [{ skew: pe() }],
        'skew-x': [{ 'skew-x': pe() }],
        'skew-y': [{ 'skew-y': pe() }],
        transform: [{ transform: [_, N, '', 'none', 'gpu', 'cpu'] }],
        'transform-origin': [{ origin: R() }],
        'transform-style': [{ transform: ['3d', 'flat'] }],
        translate: [{ translate: Ie() }],
        'translate-x': [{ 'translate-x': Ie() }],
        'translate-y': [{ 'translate-y': Ie() }],
        'translate-z': [{ 'translate-z': Ie() }],
        'translate-none': ['translate-none'],
        accent: [{ accent: O() }],
        appearance: [{ appearance: ['none', 'auto'] }],
        'caret-color': [{ caret: O() }],
        'color-scheme': [
          { scheme: ['normal', 'dark', 'light', 'light-dark', 'only-dark', 'only-light'] },
        ],
        cursor: [
          {
            cursor: [
              'auto',
              'default',
              'pointer',
              'wait',
              'text',
              'move',
              'help',
              'not-allowed',
              'none',
              'context-menu',
              'progress',
              'cell',
              'crosshair',
              'vertical-text',
              'alias',
              'copy',
              'no-drop',
              'grab',
              'grabbing',
              'all-scroll',
              'col-resize',
              'row-resize',
              'n-resize',
              'e-resize',
              's-resize',
              'w-resize',
              'ne-resize',
              'nw-resize',
              'se-resize',
              'sw-resize',
              'ew-resize',
              'ns-resize',
              'nesw-resize',
              'nwse-resize',
              'zoom-in',
              'zoom-out',
              _,
              N,
            ],
          },
        ],
        'field-sizing': [{ 'field-sizing': ['fixed', 'content'] }],
        'pointer-events': [{ 'pointer-events': ['auto', 'none'] }],
        resize: [{ resize: ['none', '', 'y', 'x'] }],
        'scroll-behavior': [{ scroll: ['auto', 'smooth'] }],
        'scroll-m': [{ 'scroll-m': k() }],
        'scroll-mx': [{ 'scroll-mx': k() }],
        'scroll-my': [{ 'scroll-my': k() }],
        'scroll-ms': [{ 'scroll-ms': k() }],
        'scroll-me': [{ 'scroll-me': k() }],
        'scroll-mbs': [{ 'scroll-mbs': k() }],
        'scroll-mbe': [{ 'scroll-mbe': k() }],
        'scroll-mt': [{ 'scroll-mt': k() }],
        'scroll-mr': [{ 'scroll-mr': k() }],
        'scroll-mb': [{ 'scroll-mb': k() }],
        'scroll-ml': [{ 'scroll-ml': k() }],
        'scroll-p': [{ 'scroll-p': k() }],
        'scroll-px': [{ 'scroll-px': k() }],
        'scroll-py': [{ 'scroll-py': k() }],
        'scroll-ps': [{ 'scroll-ps': k() }],
        'scroll-pe': [{ 'scroll-pe': k() }],
        'scroll-pbs': [{ 'scroll-pbs': k() }],
        'scroll-pbe': [{ 'scroll-pbe': k() }],
        'scroll-pt': [{ 'scroll-pt': k() }],
        'scroll-pr': [{ 'scroll-pr': k() }],
        'scroll-pb': [{ 'scroll-pb': k() }],
        'scroll-pl': [{ 'scroll-pl': k() }],
        'snap-align': [{ snap: ['start', 'end', 'center', 'align-none'] }],
        'snap-stop': [{ snap: ['normal', 'always'] }],
        'snap-type': [{ snap: ['none', 'x', 'y', 'both'] }],
        'snap-strictness': [{ snap: ['mandatory', 'proximity'] }],
        touch: [{ touch: ['auto', 'none', 'manipulation'] }],
        'touch-x': [{ 'touch-pan': ['x', 'left', 'right'] }],
        'touch-y': [{ 'touch-pan': ['y', 'up', 'down'] }],
        'touch-pz': ['touch-pinch-zoom'],
        select: [{ select: ['none', 'text', 'all', 'auto'] }],
        'will-change': [{ 'will-change': ['auto', 'scroll', 'contents', 'transform', _, N] }],
        fill: [{ fill: ['none', ...O()] }],
        'stroke-w': [{ stroke: [M, nt, Me, Wr] }],
        stroke: [{ stroke: ['none', ...O()] }],
        'forced-color-adjust': [{ 'forced-color-adjust': ['auto', 'none'] }],
      },
      conflictingClassGroups: {
        overflow: ['overflow-x', 'overflow-y'],
        overscroll: ['overscroll-x', 'overscroll-y'],
        inset: [
          'inset-x',
          'inset-y',
          'inset-bs',
          'inset-be',
          'start',
          'end',
          'top',
          'right',
          'bottom',
          'left',
        ],
        'inset-x': ['right', 'left'],
        'inset-y': ['top', 'bottom'],
        flex: ['basis', 'grow', 'shrink'],
        gap: ['gap-x', 'gap-y'],
        p: ['px', 'py', 'ps', 'pe', 'pbs', 'pbe', 'pt', 'pr', 'pb', 'pl'],
        px: ['pr', 'pl'],
        py: ['pt', 'pb'],
        m: ['mx', 'my', 'ms', 'me', 'mbs', 'mbe', 'mt', 'mr', 'mb', 'ml'],
        mx: ['mr', 'ml'],
        my: ['mt', 'mb'],
        size: ['w', 'h'],
        'font-size': ['leading'],
        'fvn-normal': [
          'fvn-ordinal',
          'fvn-slashed-zero',
          'fvn-figure',
          'fvn-spacing',
          'fvn-fraction',
        ],
        'fvn-ordinal': ['fvn-normal'],
        'fvn-slashed-zero': ['fvn-normal'],
        'fvn-figure': ['fvn-normal'],
        'fvn-spacing': ['fvn-normal'],
        'fvn-fraction': ['fvn-normal'],
        'line-clamp': ['display', 'overflow'],
        rounded: [
          'rounded-s',
          'rounded-e',
          'rounded-t',
          'rounded-r',
          'rounded-b',
          'rounded-l',
          'rounded-ss',
          'rounded-se',
          'rounded-ee',
          'rounded-es',
          'rounded-tl',
          'rounded-tr',
          'rounded-br',
          'rounded-bl',
        ],
        'rounded-s': ['rounded-ss', 'rounded-es'],
        'rounded-e': ['rounded-se', 'rounded-ee'],
        'rounded-t': ['rounded-tl', 'rounded-tr'],
        'rounded-r': ['rounded-tr', 'rounded-br'],
        'rounded-b': ['rounded-br', 'rounded-bl'],
        'rounded-l': ['rounded-tl', 'rounded-bl'],
        'border-spacing': ['border-spacing-x', 'border-spacing-y'],
        'border-w': [
          'border-w-x',
          'border-w-y',
          'border-w-s',
          'border-w-e',
          'border-w-bs',
          'border-w-be',
          'border-w-t',
          'border-w-r',
          'border-w-b',
          'border-w-l',
        ],
        'border-w-x': ['border-w-r', 'border-w-l'],
        'border-w-y': ['border-w-t', 'border-w-b'],
        'border-color': [
          'border-color-x',
          'border-color-y',
          'border-color-s',
          'border-color-e',
          'border-color-bs',
          'border-color-be',
          'border-color-t',
          'border-color-r',
          'border-color-b',
          'border-color-l',
        ],
        'border-color-x': ['border-color-r', 'border-color-l'],
        'border-color-y': ['border-color-t', 'border-color-b'],
        translate: ['translate-x', 'translate-y', 'translate-none'],
        'translate-none': ['translate', 'translate-x', 'translate-y', 'translate-z'],
        'scroll-m': [
          'scroll-mx',
          'scroll-my',
          'scroll-ms',
          'scroll-me',
          'scroll-mbs',
          'scroll-mbe',
          'scroll-mt',
          'scroll-mr',
          'scroll-mb',
          'scroll-ml',
        ],
        'scroll-mx': ['scroll-mr', 'scroll-ml'],
        'scroll-my': ['scroll-mt', 'scroll-mb'],
        'scroll-p': [
          'scroll-px',
          'scroll-py',
          'scroll-ps',
          'scroll-pe',
          'scroll-pbs',
          'scroll-pbe',
          'scroll-pt',
          'scroll-pr',
          'scroll-pb',
          'scroll-pl',
        ],
        'scroll-px': ['scroll-pr', 'scroll-pl'],
        'scroll-py': ['scroll-pt', 'scroll-pb'],
        touch: ['touch-x', 'touch-y', 'touch-pz'],
        'touch-x': ['touch'],
        'touch-y': ['touch'],
        'touch-pz': ['touch'],
      },
      conflictingClassGroupModifiers: { 'font-size': ['leading'] },
      orderSensitiveModifiers: [
        '*',
        '**',
        'after',
        'backdrop',
        'before',
        'details-content',
        'file',
        'first-letter',
        'first-line',
        'marker',
        'placeholder',
        'selection',
      ],
    };
  },
  Rs = as(Ss);
function H(...e) {
  return Rs(kn(e));
}
const Hr = (e) => (typeof e == 'boolean' ? `${e}` : e === 0 ? '0' : e),
  Ur = kn,
  $n = (e, t) => (r) => {
    var n;
    if ((t == null ? void 0 : t.variants) == null)
      return Ur(e, r == null ? void 0 : r.class, r == null ? void 0 : r.className);
    const { variants: o, defaultVariants: a } = t,
      s = Object.keys(o).map((c) => {
        const u = r == null ? void 0 : r[c],
          f = a == null ? void 0 : a[c];
        if (u === null) return null;
        const m = Hr(u) || Hr(f);
        return o[c][m];
      }),
      i =
        r &&
        Object.entries(r).reduce((c, u) => {
          const [f, m] = u;
          return m === void 0 || (c[f] = m), c;
        }, {}),
      d =
        t == null || (n = t.compoundVariants) === null || n === void 0
          ? void 0
          : n.reduce((c, u) => {
              const { class: f, className: m, ...p } = u;
              return Object.entries(p).every((v) => {
                const [g, b] = v;
                return Array.isArray(b) ? b.includes({ ...a, ...i }[g]) : { ...a, ...i }[g] === b;
              })
                ? [...c, f, m]
                : c;
            }, []);
    return Ur(e, s, d, r == null ? void 0 : r.class, r == null ? void 0 : r.className);
  };
function Gr(e, t) {
  if (typeof e == 'function') return e(t);
  e != null && (e.current = t);
}
function Ee(...e) {
  return (t) => {
    let r = !1;
    const n = e.map((o) => {
      const a = Gr(o, t);
      return !r && typeof a == 'function' && (r = !0), a;
    });
    if (r)
      return () => {
        for (let o = 0; o < n.length; o++) {
          const a = n[o];
          typeof a == 'function' ? a() : Gr(e[o], null);
        }
      };
  };
}
function ee(...e) {
  return l.useCallback(Ee(...e), e);
}
function Nt(e) {
  const t = Ns(e),
    r = l.forwardRef((n, o) => {
      const { children: a, ...s } = n,
        i = l.Children.toArray(a),
        d = i.find(_s);
      if (d) {
        const c = d.props.children,
          u = i.map((f) =>
            f === d
              ? l.Children.count(c) > 1
                ? l.Children.only(null)
                : l.isValidElement(c)
                  ? c.props.children
                  : null
              : f,
          );
        return h.jsx(t, {
          ...s,
          ref: o,
          children: l.isValidElement(c) ? l.cloneElement(c, void 0, u) : null,
        });
      }
      return h.jsx(t, { ...s, ref: o, children: a });
    });
  return (r.displayName = `${e}.Slot`), r;
}
var Ps = Nt('Slot');
function Ns(e) {
  const t = l.forwardRef((r, n) => {
    const { children: o, ...a } = r;
    if (l.isValidElement(o)) {
      const s = Ts(o),
        i = Ds(a, o.props);
      return o.type !== l.Fragment && (i.ref = n ? Ee(n, s) : s), l.cloneElement(o, i);
    }
    return l.Children.count(o) > 1 ? l.Children.only(null) : null;
  });
  return (t.displayName = `${e}.SlotClone`), t;
}
var zn = Symbol('radix.slottable');
function Os(e) {
  const t = ({ children: r }) => h.jsx(h.Fragment, { children: r });
  return (t.displayName = `${e}.Slottable`), (t.__radixId = zn), t;
}
function _s(e) {
  return (
    l.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === zn
  );
}
function Ds(e, t) {
  const r = { ...t };
  for (const n in t) {
    const o = e[n],
      a = t[n];
    /^on[A-Z]/.test(n)
      ? o && a
        ? (r[n] = (...i) => {
            const d = a(...i);
            return o(...i), d;
          })
        : o && (r[n] = o)
      : n === 'style'
        ? (r[n] = { ...o, ...a })
        : n === 'className' && (r[n] = [o, a].filter(Boolean).join(' '));
  }
  return { ...e, ...r };
}
function Ts(e) {
  var n, o;
  let t = (n = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : n.get,
    r = t && 'isReactWarning' in t && t.isReactWarning;
  return r
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : o.get),
      (r = t && 'isReactWarning' in t && t.isReactWarning),
      r ? e.props.ref : e.props.ref || e.ref);
}
var Is = [
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
  Q = Is.reduce((e, t) => {
    const r = Nt(`Primitive.${t}`),
      n = l.forwardRef((o, a) => {
        const { asChild: s, ...i } = o,
          d = s ? r : t;
        return (
          typeof window < 'u' && (window[Symbol.for('radix-ui')] = !0), h.jsx(d, { ...i, ref: a })
        );
      });
    return (n.displayName = `Primitive.${t}`), { ...e, [t]: n };
  }, {});
function Ms(e, t) {
  e && wn.flushSync(() => e.dispatchEvent(t));
}
function js(e, t) {
  const r = l.createContext(t),
    n = (a) => {
      const { children: s, ...i } = a,
        d = l.useMemo(() => i, Object.values(i));
      return h.jsx(r.Provider, { value: d, children: s });
    };
  n.displayName = e + 'Provider';
  function o(a) {
    const s = l.useContext(r);
    if (s) return s;
    if (t !== void 0) return t;
    throw new Error(`\`${a}\` must be used within \`${e}\``);
  }
  return [n, o];
}
function st(e, t = []) {
  let r = [];
  function n(a, s) {
    const i = l.createContext(s),
      d = r.length;
    r = [...r, s];
    const c = (f) => {
      var y;
      const { scope: m, children: p, ...v } = f,
        g = ((y = m == null ? void 0 : m[e]) == null ? void 0 : y[d]) || i,
        b = l.useMemo(() => v, Object.values(v));
      return h.jsx(g.Provider, { value: b, children: p });
    };
    c.displayName = a + 'Provider';
    function u(f, m) {
      var g;
      const p = ((g = m == null ? void 0 : m[e]) == null ? void 0 : g[d]) || i,
        v = l.useContext(p);
      if (v) return v;
      if (s !== void 0) return s;
      throw new Error(`\`${f}\` must be used within \`${a}\``);
    }
    return [c, u];
  }
  const o = () => {
    const a = r.map((s) => l.createContext(s));
    return (i) => {
      const d = (i == null ? void 0 : i[e]) || a;
      return l.useMemo(() => ({ [`__scope${e}`]: { ...i, [e]: d } }), [i, d]);
    };
  };
  return (o.scopeName = e), [n, Ls(o, ...t)];
}
function Ls(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const r = () => {
    const n = e.map((o) => ({ useScope: o(), scopeName: o.scopeName }));
    return (a) => {
      const s = n.reduce((i, { useScope: d, scopeName: c }) => {
        const f = d(a)[`__scope${c}`];
        return { ...i, ...f };
      }, {});
      return l.useMemo(() => ({ [`__scope${t.scopeName}`]: s }), [s]);
    };
  };
  return (r.scopeName = t.scopeName), r;
}
function J(e, t, { checkForDefaultPrevented: r = !0 } = {}) {
  return (o) => {
    if ((e == null || e(o), r === !1 || !o.defaultPrevented)) return t == null ? void 0 : t(o);
  };
}
var Ae = globalThis != null && globalThis.document ? l.useLayoutEffect : () => {},
  $s = cr[' useInsertionEffect '.trim().toString()] || Ae;
function fr({ prop: e, defaultProp: t, onChange: r = () => {}, caller: n }) {
  const [o, a, s] = zs({ defaultProp: t, onChange: r }),
    i = e !== void 0,
    d = i ? e : o;
  {
    const u = l.useRef(e !== void 0);
    l.useEffect(() => {
      const f = u.current;
      f !== i &&
        console.warn(
          `${n} is changing from ${f ? 'controlled' : 'uncontrolled'} to ${i ? 'controlled' : 'uncontrolled'}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`,
        ),
        (u.current = i);
    }, [i, n]);
  }
  const c = l.useCallback(
    (u) => {
      var f;
      if (i) {
        const m = Fs(u) ? u(e) : u;
        m !== e && ((f = s.current) == null || f.call(s, m));
      } else a(u);
    },
    [i, e, a, s],
  );
  return [d, c];
}
function zs({ defaultProp: e, onChange: t }) {
  const [r, n] = l.useState(e),
    o = l.useRef(r),
    a = l.useRef(t);
  return (
    $s(() => {
      a.current = t;
    }, [t]),
    l.useEffect(() => {
      var s;
      o.current !== r && ((s = a.current) == null || s.call(a, r), (o.current = r));
    }, [r, o]),
    [r, n, a]
  );
}
function Fs(e) {
  return typeof e == 'function';
}
function Ws(e, t) {
  return l.useReducer((r, n) => t[r][n] ?? r, e);
}
var We = (e) => {
  const { present: t, children: r } = e,
    n = Bs(t),
    o = typeof r == 'function' ? r({ present: n.isPresent }) : l.Children.only(r),
    a = ee(n.ref, Vs(o));
  return typeof r == 'function' || n.isPresent ? l.cloneElement(o, { ref: a }) : null;
};
We.displayName = 'Presence';
function Bs(e) {
  const [t, r] = l.useState(),
    n = l.useRef(null),
    o = l.useRef(e),
    a = l.useRef('none'),
    s = e ? 'mounted' : 'unmounted',
    [i, d] = Ws(s, {
      mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
      unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
      unmounted: { MOUNT: 'mounted' },
    });
  return (
    l.useEffect(() => {
      const c = mt(n.current);
      a.current = i === 'mounted' ? c : 'none';
    }, [i]),
    Ae(() => {
      const c = n.current,
        u = o.current;
      if (u !== e) {
        const m = a.current,
          p = mt(c);
        e
          ? d('MOUNT')
          : p === 'none' || (c == null ? void 0 : c.display) === 'none'
            ? d('UNMOUNT')
            : d(u && m !== p ? 'ANIMATION_OUT' : 'UNMOUNT'),
          (o.current = e);
      }
    }, [e, d]),
    Ae(() => {
      if (t) {
        let c;
        const u = t.ownerDocument.defaultView ?? window,
          f = (p) => {
            const g = mt(n.current).includes(CSS.escape(p.animationName));
            if (p.target === t && g && (d('ANIMATION_END'), !o.current)) {
              const b = t.style.animationFillMode;
              (t.style.animationFillMode = 'forwards'),
                (c = u.setTimeout(() => {
                  t.style.animationFillMode === 'forwards' && (t.style.animationFillMode = b);
                }));
            }
          },
          m = (p) => {
            p.target === t && (a.current = mt(n.current));
          };
        return (
          t.addEventListener('animationstart', m),
          t.addEventListener('animationcancel', f),
          t.addEventListener('animationend', f),
          () => {
            u.clearTimeout(c),
              t.removeEventListener('animationstart', m),
              t.removeEventListener('animationcancel', f),
              t.removeEventListener('animationend', f);
          }
        );
      } else d('ANIMATION_END');
    }, [t, d]),
    {
      isPresent: ['mounted', 'unmountSuspended'].includes(i),
      ref: l.useCallback((c) => {
        (n.current = c ? getComputedStyle(c) : null), r(c);
      }, []),
    }
  );
}
function mt(e) {
  return (e == null ? void 0 : e.animationName) || 'none';
}
function Vs(e) {
  var n, o;
  let t = (n = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : n.get,
    r = t && 'isReactWarning' in t && t.isReactWarning;
  return r
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : o.get),
      (r = t && 'isReactWarning' in t && t.isReactWarning),
      r ? e.props.ref : e.props.ref || e.ref);
}
var Hs = cr[' useId '.trim().toString()] || (() => {}),
  Us = 0;
function ue(e) {
  const [t, r] = l.useState(Hs());
  return (
    Ae(() => {
      r((n) => n ?? String(Us++));
    }, [e]),
    e || (t ? `radix-${t}` : '')
  );
}
function Ke(e) {
  const t = l.useRef(e);
  return (
    l.useEffect(() => {
      t.current = e;
    }),
    l.useMemo(
      () =>
        (...r) => {
          var n;
          return (n = t.current) == null ? void 0 : n.call(t, ...r);
        },
      [],
    )
  );
}
function Gs(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Ke(e);
  l.useEffect(() => {
    const n = (o) => {
      o.key === 'Escape' && r(o);
    };
    return (
      t.addEventListener('keydown', n, { capture: !0 }),
      () => t.removeEventListener('keydown', n, { capture: !0 })
    );
  }, [r, t]);
}
var Ys = 'DismissableLayer',
  tr = 'dismissableLayer.update',
  qs = 'dismissableLayer.pointerDownOutside',
  Xs = 'dismissableLayer.focusOutside',
  Yr,
  Fn = l.createContext({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set(),
  }),
  mr = l.forwardRef((e, t) => {
    const {
        disableOutsidePointerEvents: r = !1,
        onEscapeKeyDown: n,
        onPointerDownOutside: o,
        onFocusOutside: a,
        onInteractOutside: s,
        onDismiss: i,
        ...d
      } = e,
      c = l.useContext(Fn),
      [u, f] = l.useState(null),
      m =
        (u == null ? void 0 : u.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      [, p] = l.useState({}),
      v = ee(t, (S) => f(S)),
      g = Array.from(c.layers),
      [b] = [...c.layersWithOutsidePointerEventsDisabled].slice(-1),
      y = g.indexOf(b),
      w = u ? g.indexOf(u) : -1,
      A = c.layersWithOutsidePointerEventsDisabled.size > 0,
      C = w >= y,
      R = Qs((S) => {
        const k = S.target,
          j = [...c.branches].some((W) => W.contains(k));
        !C || j || (o == null || o(S), s == null || s(S), S.defaultPrevented || i == null || i());
      }, m),
      E = Js((S) => {
        const k = S.target;
        [...c.branches].some((W) => W.contains(k)) ||
          (a == null || a(S), s == null || s(S), S.defaultPrevented || i == null || i());
      }, m);
    return (
      Gs((S) => {
        w === c.layers.size - 1 &&
          (n == null || n(S), !S.defaultPrevented && i && (S.preventDefault(), i()));
      }, m),
      l.useEffect(() => {
        if (u)
          return (
            r &&
              (c.layersWithOutsidePointerEventsDisabled.size === 0 &&
                ((Yr = m.body.style.pointerEvents), (m.body.style.pointerEvents = 'none')),
              c.layersWithOutsidePointerEventsDisabled.add(u)),
            c.layers.add(u),
            qr(),
            () => {
              r &&
                c.layersWithOutsidePointerEventsDisabled.size === 1 &&
                (m.body.style.pointerEvents = Yr);
            }
          );
      }, [u, m, r, c]),
      l.useEffect(
        () => () => {
          u && (c.layers.delete(u), c.layersWithOutsidePointerEventsDisabled.delete(u), qr());
        },
        [u, c],
      ),
      l.useEffect(() => {
        const S = () => p({});
        return document.addEventListener(tr, S), () => document.removeEventListener(tr, S);
      }, []),
      h.jsx(Q.div, {
        ...d,
        ref: v,
        style: { pointerEvents: A ? (C ? 'auto' : 'none') : void 0, ...e.style },
        onFocusCapture: J(e.onFocusCapture, E.onFocusCapture),
        onBlurCapture: J(e.onBlurCapture, E.onBlurCapture),
        onPointerDownCapture: J(e.onPointerDownCapture, R.onPointerDownCapture),
      })
    );
  });
mr.displayName = Ys;
var Ks = 'DismissableLayerBranch',
  Zs = l.forwardRef((e, t) => {
    const r = l.useContext(Fn),
      n = l.useRef(null),
      o = ee(t, n);
    return (
      l.useEffect(() => {
        const a = n.current;
        if (a)
          return (
            r.branches.add(a),
            () => {
              r.branches.delete(a);
            }
          );
      }, [r.branches]),
      h.jsx(Q.div, { ...e, ref: o })
    );
  });
Zs.displayName = Ks;
function Qs(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Ke(e),
    n = l.useRef(!1),
    o = l.useRef(() => {});
  return (
    l.useEffect(() => {
      const a = (i) => {
          if (i.target && !n.current) {
            const d = () => {
              Wn(qs, r, c, { discrete: !0 });
            };
            const c = { originalEvent: i };
            i.pointerType === 'touch'
              ? (t.removeEventListener('click', o.current),
                (o.current = d),
                t.addEventListener('click', o.current, { once: !0 }))
              : d();
          } else t.removeEventListener('click', o.current);
          n.current = !1;
        },
        s = window.setTimeout(() => {
          t.addEventListener('pointerdown', a);
        }, 0);
      return () => {
        window.clearTimeout(s),
          t.removeEventListener('pointerdown', a),
          t.removeEventListener('click', o.current);
      };
    }, [t, r]),
    { onPointerDownCapture: () => (n.current = !0) }
  );
}
function Js(e, t = globalThis == null ? void 0 : globalThis.document) {
  const r = Ke(e),
    n = l.useRef(!1);
  return (
    l.useEffect(() => {
      const o = (a) => {
        a.target && !n.current && Wn(Xs, r, { originalEvent: a }, { discrete: !1 });
      };
      return t.addEventListener('focusin', o), () => t.removeEventListener('focusin', o);
    }, [t, r]),
    { onFocusCapture: () => (n.current = !0), onBlurCapture: () => (n.current = !1) }
  );
}
function qr() {
  const e = new CustomEvent(tr);
  document.dispatchEvent(e);
}
function Wn(e, t, r, { discrete: n }) {
  const o = r.originalEvent.target,
    a = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: r });
  t && o.addEventListener(e, t, { once: !0 }), n ? Ms(o, a) : o.dispatchEvent(a);
}
var Ft = 'focusScope.autoFocusOnMount',
  Wt = 'focusScope.autoFocusOnUnmount',
  Xr = { bubbles: !1, cancelable: !0 },
  ei = 'FocusScope',
  pr = l.forwardRef((e, t) => {
    const { loop: r = !1, trapped: n = !1, onMountAutoFocus: o, onUnmountAutoFocus: a, ...s } = e,
      [i, d] = l.useState(null),
      c = Ke(o),
      u = Ke(a),
      f = l.useRef(null),
      m = ee(t, (g) => d(g)),
      p = l.useRef({
        paused: !1,
        pause() {
          this.paused = !0;
        },
        resume() {
          this.paused = !1;
        },
      }).current;
    l.useEffect(() => {
      if (n) {
        const g = (A) => {
            if (p.paused || !i) return;
            const C = A.target;
            i.contains(C) ? (f.current = C) : Ce(f.current, { select: !0 });
          },
          b = (A) => {
            if (p.paused || !i) return;
            const C = A.relatedTarget;
            C !== null && (i.contains(C) || Ce(f.current, { select: !0 }));
          },
          y = (A) => {
            if (document.activeElement === document.body)
              for (const R of A) R.removedNodes.length > 0 && Ce(i);
          };
        document.addEventListener('focusin', g), document.addEventListener('focusout', b);
        const w = new MutationObserver(y);
        return (
          i && w.observe(i, { childList: !0, subtree: !0 }),
          () => {
            document.removeEventListener('focusin', g),
              document.removeEventListener('focusout', b),
              w.disconnect();
          }
        );
      }
    }, [n, i, p.paused]),
      l.useEffect(() => {
        if (i) {
          Zr.add(p);
          const g = document.activeElement;
          if (!i.contains(g)) {
            const y = new CustomEvent(Ft, Xr);
            i.addEventListener(Ft, c),
              i.dispatchEvent(y),
              y.defaultPrevented ||
                (ti(si(Bn(i)), { select: !0 }), document.activeElement === g && Ce(i));
          }
          return () => {
            i.removeEventListener(Ft, c),
              setTimeout(() => {
                const y = new CustomEvent(Wt, Xr);
                i.addEventListener(Wt, u),
                  i.dispatchEvent(y),
                  y.defaultPrevented || Ce(g ?? document.body, { select: !0 }),
                  i.removeEventListener(Wt, u),
                  Zr.remove(p);
              }, 0);
          };
        }
      }, [i, c, u, p]);
    const v = l.useCallback(
      (g) => {
        if ((!r && !n) || p.paused) return;
        const b = g.key === 'Tab' && !g.altKey && !g.ctrlKey && !g.metaKey,
          y = document.activeElement;
        if (b && y) {
          const w = g.currentTarget,
            [A, C] = ri(w);
          A && C
            ? !g.shiftKey && y === C
              ? (g.preventDefault(), r && Ce(A, { select: !0 }))
              : g.shiftKey && y === A && (g.preventDefault(), r && Ce(C, { select: !0 }))
            : y === w && g.preventDefault();
        }
      },
      [r, n, p.paused],
    );
    return h.jsx(Q.div, { tabIndex: -1, ...s, ref: m, onKeyDown: v });
  });
pr.displayName = ei;
function ti(e, { select: t = !1 } = {}) {
  const r = document.activeElement;
  for (const n of e) if ((Ce(n, { select: t }), document.activeElement !== r)) return;
}
function ri(e) {
  const t = Bn(e),
    r = Kr(t, e),
    n = Kr(t.reverse(), e);
  return [r, n];
}
function Bn(e) {
  const t = [],
    r = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => {
        const o = n.tagName === 'INPUT' && n.type === 'hidden';
        return n.disabled || n.hidden || o
          ? NodeFilter.FILTER_SKIP
          : n.tabIndex >= 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
      },
    });
  while (r.nextNode()) t.push(r.currentNode);
  return t;
}
function Kr(e, t) {
  for (const r of e) if (!ni(r, { upTo: t })) return r;
}
function ni(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === 'hidden') return !0;
  while (e) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === 'none') return !0;
    e = e.parentElement;
  }
  return !1;
}
function oi(e) {
  return e instanceof HTMLInputElement && 'select' in e;
}
function Ce(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const r = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== r && oi(e) && t && e.select();
  }
}
var Zr = ai();
function ai() {
  let e = [];
  return {
    add(t) {
      const r = e[0];
      t !== r && (r == null || r.pause()), (e = Qr(e, t)), e.unshift(t);
    },
    remove(t) {
      var r;
      (e = Qr(e, t)), (r = e[0]) == null || r.resume();
    },
  };
}
function Qr(e, t) {
  const r = [...e],
    n = r.indexOf(t);
  return n !== -1 && r.splice(n, 1), r;
}
function si(e) {
  return e.filter((t) => t.tagName !== 'A');
}
var ii = 'Portal',
  gr = l.forwardRef((e, t) => {
    var i;
    const { container: r, ...n } = e,
      [o, a] = l.useState(!1);
    Ae(() => a(!0), []);
    const s =
      r ||
      (o && ((i = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : i.body));
    return s ? $a.createPortal(h.jsx(Q.div, { ...n, ref: t }), s) : null;
  });
gr.displayName = ii;
var Bt = 0;
function Vn() {
  l.useEffect(() => {
    const e = document.querySelectorAll('[data-radix-focus-guard]');
    return (
      document.body.insertAdjacentElement('afterbegin', e[0] ?? Jr()),
      document.body.insertAdjacentElement('beforeend', e[1] ?? Jr()),
      Bt++,
      () => {
        Bt === 1 &&
          document.querySelectorAll('[data-radix-focus-guard]').forEach((t) => t.remove()),
          Bt--;
      }
    );
  }, []);
}
function Jr() {
  const e = document.createElement('span');
  return (
    e.setAttribute('data-radix-focus-guard', ''),
    (e.tabIndex = 0),
    (e.style.outline = 'none'),
    (e.style.opacity = '0'),
    (e.style.position = 'fixed'),
    (e.style.pointerEvents = 'none'),
    e
  );
}
var ce = function () {
  return (
    (ce =
      Object.assign ||
      ((t) => {
        for (var r, n = 1, o = arguments.length; n < o; n++) {
          r = arguments[n];
          for (var a in r) Object.prototype.hasOwnProperty.call(r, a) && (t[a] = r[a]);
        }
        return t;
      })),
    ce.apply(this, arguments)
  );
};
function Hn(e, t) {
  var r = {};
  for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && t.indexOf(n) < 0 && (r[n] = e[n]);
  if (e != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var o = 0, n = Object.getOwnPropertySymbols(e); o < n.length; o++)
      t.indexOf(n[o]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(e, n[o]) &&
        (r[n[o]] = e[n[o]]);
  return r;
}
function li(e, t, r) {
  if (r || arguments.length === 2)
    for (var n = 0, o = t.length, a; n < o; n++)
      (a || !(n in t)) && (a || (a = Array.prototype.slice.call(t, 0, n)), (a[n] = t[n]));
  return e.concat(a || Array.prototype.slice.call(t));
}
var yt = 'right-scroll-bar-position',
  xt = 'width-before-scroll-bar',
  ci = 'with-scroll-bars-hidden',
  di = '--removed-body-scroll-bar-size';
function Vt(e, t) {
  return typeof e == 'function' ? e(t) : e && (e.current = t), e;
}
function ui(e, t) {
  var r = l.useState(() => ({
    value: e,
    callback: t,
    facade: {
      get current() {
        return r.value;
      },
      set current(n) {
        var o = r.value;
        o !== n && ((r.value = n), r.callback(n, o));
      },
    },
  }))[0];
  return (r.callback = t), r.facade;
}
var fi = typeof window < 'u' ? l.useLayoutEffect : l.useEffect,
  en = new WeakMap();
function mi(e, t) {
  var r = ui(null, (n) => e.forEach((o) => Vt(o, n)));
  return (
    fi(() => {
      var n = en.get(r);
      if (n) {
        var o = new Set(n),
          a = new Set(e),
          s = r.current;
        o.forEach((i) => {
          a.has(i) || Vt(i, null);
        }),
          a.forEach((i) => {
            o.has(i) || Vt(i, s);
          });
      }
      en.set(r, e);
    }, [e]),
    r
  );
}
function pi(e) {
  return e;
}
function gi(e, t) {
  t === void 0 && (t = pi);
  var r = [],
    n = !1,
    o = {
      read: () => {
        if (n)
          throw new Error(
            'Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.',
          );
        return r.length ? r[r.length - 1] : e;
      },
      useMedium: (a) => {
        var s = t(a, n);
        return (
          r.push(s),
          () => {
            r = r.filter((i) => i !== s);
          }
        );
      },
      assignSyncMedium: (a) => {
        for (n = !0; r.length; ) {
          var s = r;
          (r = []), s.forEach(a);
        }
        r = { push: (i) => a(i), filter: () => r };
      },
      assignMedium: (a) => {
        n = !0;
        var s = [];
        if (r.length) {
          var i = r;
          (r = []), i.forEach(a), (s = r);
        }
        var d = () => {
            var u = s;
            (s = []), u.forEach(a);
          },
          c = () => Promise.resolve().then(d);
        c(),
          (r = {
            push: (u) => {
              s.push(u), c();
            },
            filter: (u) => ((s = s.filter(u)), r),
          });
      },
    };
  return o;
}
function hi(e) {
  e === void 0 && (e = {});
  var t = gi(null);
  return (t.options = ce({ async: !0, ssr: !1 }, e)), t;
}
var Un = (e) => {
  var t = e.sideCar,
    r = Hn(e, ['sideCar']);
  if (!t) throw new Error('Sidecar: please provide `sideCar` property to import the right car');
  var n = t.read();
  if (!n) throw new Error('Sidecar medium not found');
  return l.createElement(n, ce({}, r));
};
Un.isSideCarExport = !0;
function vi(e, t) {
  return e.useMedium(t), Un;
}
var Gn = hi(),
  Ht = () => {},
  Ot = l.forwardRef((e, t) => {
    var r = l.useRef(null),
      n = l.useState({ onScrollCapture: Ht, onWheelCapture: Ht, onTouchMoveCapture: Ht }),
      o = n[0],
      a = n[1],
      s = e.forwardProps,
      i = e.children,
      d = e.className,
      c = e.removeScrollBar,
      u = e.enabled,
      f = e.shards,
      m = e.sideCar,
      p = e.noRelative,
      v = e.noIsolation,
      g = e.inert,
      b = e.allowPinchZoom,
      y = e.as,
      w = y === void 0 ? 'div' : y,
      A = e.gapMode,
      C = Hn(e, [
        'forwardProps',
        'children',
        'className',
        'removeScrollBar',
        'enabled',
        'shards',
        'sideCar',
        'noRelative',
        'noIsolation',
        'inert',
        'allowPinchZoom',
        'as',
        'gapMode',
      ]),
      R = m,
      E = mi([r, t]),
      S = ce(ce({}, C), o);
    return l.createElement(
      l.Fragment,
      null,
      u &&
        l.createElement(R, {
          sideCar: Gn,
          removeScrollBar: c,
          shards: f,
          noRelative: p,
          noIsolation: v,
          inert: g,
          setCallbacks: a,
          allowPinchZoom: !!b,
          lockRef: r,
          gapMode: A,
        }),
      s
        ? l.cloneElement(l.Children.only(i), ce(ce({}, S), { ref: E }))
        : l.createElement(w, ce({}, S, { className: d, ref: E }), i),
    );
  });
Ot.defaultProps = { enabled: !0, removeScrollBar: !0, inert: !1 };
Ot.classNames = { fullWidth: xt, zeroRight: yt };
var bi = () => {
  if (typeof __webpack_nonce__ < 'u') return __webpack_nonce__;
};
function yi() {
  if (!document) return null;
  var e = document.createElement('style');
  e.type = 'text/css';
  var t = bi();
  return t && e.setAttribute('nonce', t), e;
}
function xi(e, t) {
  e.styleSheet ? (e.styleSheet.cssText = t) : e.appendChild(document.createTextNode(t));
}
function wi(e) {
  var t = document.head || document.getElementsByTagName('head')[0];
  t.appendChild(e);
}
var Ci = () => {
    var e = 0,
      t = null;
    return {
      add: (r) => {
        e == 0 && (t = yi()) && (xi(t, r), wi(t)), e++;
      },
      remove: () => {
        e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), (t = null));
      },
    };
  },
  ki = () => {
    var e = Ci();
    return (t, r) => {
      l.useEffect(
        () => (
          e.add(t),
          () => {
            e.remove();
          }
        ),
        [t && r],
      );
    };
  },
  Yn = () => {
    var e = ki(),
      t = (r) => {
        var n = r.styles,
          o = r.dynamic;
        return e(n, o), null;
      };
    return t;
  },
  Ei = { left: 0, top: 0, right: 0, gap: 0 },
  Ut = (e) => Number.parseInt(e || '', 10) || 0,
  Ai = (e) => {
    var t = window.getComputedStyle(document.body),
      r = t[e === 'padding' ? 'paddingLeft' : 'marginLeft'],
      n = t[e === 'padding' ? 'paddingTop' : 'marginTop'],
      o = t[e === 'padding' ? 'paddingRight' : 'marginRight'];
    return [Ut(r), Ut(n), Ut(o)];
  },
  Si = (e) => {
    if ((e === void 0 && (e = 'margin'), typeof window > 'u')) return Ei;
    var t = Ai(e),
      r = document.documentElement.clientWidth,
      n = window.innerWidth;
    return { left: t[0], top: t[1], right: t[2], gap: Math.max(0, n - r + t[2] - t[0]) };
  },
  Ri = Yn(),
  Ye = 'data-scroll-locked',
  Pi = (e, t, r, n) => {
    var o = e.left,
      a = e.top,
      s = e.right,
      i = e.gap;
    return (
      r === void 0 && (r = 'margin'),
      `
  .`
        .concat(
          ci,
          ` {
   overflow: hidden `,
        )
        .concat(
          n,
          `;
   padding-right: `,
        )
        .concat(i, 'px ')
        .concat(
          n,
          `;
  }
  body[`,
        )
        .concat(
          Ye,
          `] {
    overflow: hidden `,
        )
        .concat(
          n,
          `;
    overscroll-behavior: contain;
    `,
        )
        .concat(
          [
            t && 'position: relative '.concat(n, ';'),
            r === 'margin' &&
              `
    padding-left: `
                .concat(
                  o,
                  `px;
    padding-top: `,
                )
                .concat(
                  a,
                  `px;
    padding-right: `,
                )
                .concat(
                  s,
                  `px;
    margin-left:0;
    margin-top:0;
    margin-right: `,
                )
                .concat(i, 'px ')
                .concat(
                  n,
                  `;
    `,
                ),
            r === 'padding' && 'padding-right: '.concat(i, 'px ').concat(n, ';'),
          ]
            .filter(Boolean)
            .join(''),
          `
  }
  
  .`,
        )
        .concat(
          yt,
          ` {
    right: `,
        )
        .concat(i, 'px ')
        .concat(
          n,
          `;
  }
  
  .`,
        )
        .concat(
          xt,
          ` {
    margin-right: `,
        )
        .concat(i, 'px ')
        .concat(
          n,
          `;
  }
  
  .`,
        )
        .concat(yt, ' .')
        .concat(
          yt,
          ` {
    right: 0 `,
        )
        .concat(
          n,
          `;
  }
  
  .`,
        )
        .concat(xt, ' .')
        .concat(
          xt,
          ` {
    margin-right: 0 `,
        )
        .concat(
          n,
          `;
  }
  
  body[`,
        )
        .concat(
          Ye,
          `] {
    `,
        )
        .concat(di, ': ')
        .concat(
          i,
          `px;
  }
`,
        )
    );
  },
  tn = () => {
    var e = Number.parseInt(document.body.getAttribute(Ye) || '0', 10);
    return isFinite(e) ? e : 0;
  },
  Ni = () => {
    l.useEffect(
      () => (
        document.body.setAttribute(Ye, (tn() + 1).toString()),
        () => {
          var e = tn() - 1;
          e <= 0 ? document.body.removeAttribute(Ye) : document.body.setAttribute(Ye, e.toString());
        }
      ),
      [],
    );
  },
  Oi = (e) => {
    var t = e.noRelative,
      r = e.noImportant,
      n = e.gapMode,
      o = n === void 0 ? 'margin' : n;
    Ni();
    var a = l.useMemo(() => Si(o), [o]);
    return l.createElement(Ri, { styles: Pi(a, !t, o, r ? '' : '!important') });
  },
  rr = !1;
if (typeof window < 'u')
  try {
    var pt = Object.defineProperty({}, 'passive', { get: () => ((rr = !0), !0) });
    window.addEventListener('test', pt, pt), window.removeEventListener('test', pt, pt);
  } catch {
    rr = !1;
  }
var Be = rr ? { passive: !1 } : !1,
  _i = (e) => e.tagName === 'TEXTAREA',
  qn = (e, t) => {
    if (!(e instanceof Element)) return !1;
    var r = window.getComputedStyle(e);
    return r[t] !== 'hidden' && !(r.overflowY === r.overflowX && !_i(e) && r[t] === 'visible');
  },
  Di = (e) => qn(e, 'overflowY'),
  Ti = (e) => qn(e, 'overflowX'),
  rn = (e, t) => {
    var r = t.ownerDocument,
      n = t;
    do {
      typeof ShadowRoot < 'u' && n instanceof ShadowRoot && (n = n.host);
      var o = Xn(e, n);
      if (o) {
        var a = Kn(e, n),
          s = a[1],
          i = a[2];
        if (s > i) return !0;
      }
      n = n.parentNode;
    } while (n && n !== r.body);
    return !1;
  },
  Ii = (e) => {
    var t = e.scrollTop,
      r = e.scrollHeight,
      n = e.clientHeight;
    return [t, r, n];
  },
  Mi = (e) => {
    var t = e.scrollLeft,
      r = e.scrollWidth,
      n = e.clientWidth;
    return [t, r, n];
  },
  Xn = (e, t) => (e === 'v' ? Di(t) : Ti(t)),
  Kn = (e, t) => (e === 'v' ? Ii(t) : Mi(t)),
  ji = (e, t) => (e === 'h' && t === 'rtl' ? -1 : 1),
  Li = (e, t, r, n, o) => {
    var a = ji(e, window.getComputedStyle(t).direction),
      s = a * n,
      i = r.target,
      d = t.contains(i),
      c = !1,
      u = s > 0,
      f = 0,
      m = 0;
    do {
      if (!i) break;
      var p = Kn(e, i),
        v = p[0],
        g = p[1],
        b = p[2],
        y = g - b - a * v;
      (v || y) && Xn(e, i) && ((f += y), (m += v));
      var w = i.parentNode;
      i = w && w.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? w.host : w;
    } while ((!d && i !== document.body) || (d && (t.contains(i) || t === i)));
    return ((u && Math.abs(f) < 1) || (!u && Math.abs(m) < 1)) && (c = !0), c;
  },
  gt = (e) =>
    'changedTouches' in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0],
  nn = (e) => [e.deltaX, e.deltaY],
  on = (e) => (e && 'current' in e ? e.current : e),
  $i = (e, t) => e[0] === t[0] && e[1] === t[1],
  zi = (e) =>
    `
  .block-interactivity-`
      .concat(
        e,
        ` {pointer-events: none;}
  .allow-interactivity-`,
      )
      .concat(
        e,
        ` {pointer-events: all;}
`,
      ),
  Fi = 0,
  Ve = [];
function Wi(e) {
  var t = l.useRef([]),
    r = l.useRef([0, 0]),
    n = l.useRef(),
    o = l.useState(Fi++)[0],
    a = l.useState(Yn)[0],
    s = l.useRef(e);
  l.useEffect(() => {
    s.current = e;
  }, [e]),
    l.useEffect(() => {
      if (e.inert) {
        document.body.classList.add('block-interactivity-'.concat(o));
        var g = li([e.lockRef.current], (e.shards || []).map(on), !0).filter(Boolean);
        return (
          g.forEach((b) => b.classList.add('allow-interactivity-'.concat(o))),
          () => {
            document.body.classList.remove('block-interactivity-'.concat(o)),
              g.forEach((b) => b.classList.remove('allow-interactivity-'.concat(o)));
          }
        );
      }
    }, [e.inert, e.lockRef.current, e.shards]);
  var i = l.useCallback((g, b) => {
      if (('touches' in g && g.touches.length === 2) || (g.type === 'wheel' && g.ctrlKey))
        return !s.current.allowPinchZoom;
      var y = gt(g),
        w = r.current,
        A = 'deltaX' in g ? g.deltaX : w[0] - y[0],
        C = 'deltaY' in g ? g.deltaY : w[1] - y[1],
        R,
        E = g.target,
        S = Math.abs(A) > Math.abs(C) ? 'h' : 'v';
      if ('touches' in g && S === 'h' && E.type === 'range') return !1;
      var k = window.getSelection(),
        j = k && k.anchorNode,
        W = j ? j === E || j.contains(E) : !1;
      if (W) return !1;
      var U = rn(S, E);
      if (!U) return !0;
      if ((U ? (R = S) : ((R = S === 'v' ? 'h' : 'v'), (U = rn(S, E))), !U)) return !1;
      if ((!n.current && 'changedTouches' in g && (A || C) && (n.current = R), !R)) return !0;
      var G = n.current || R;
      return Li(G, b, g, G === 'h' ? A : C);
    }, []),
    d = l.useCallback((g) => {
      var b = g;
      if (!(!Ve.length || Ve[Ve.length - 1] !== a)) {
        var y = 'deltaY' in b ? nn(b) : gt(b),
          w = t.current.filter(
            (R) =>
              R.name === b.type &&
              (R.target === b.target || b.target === R.shadowParent) &&
              $i(R.delta, y),
          )[0];
        if (w && w.should) {
          b.cancelable && b.preventDefault();
          return;
        }
        if (!w) {
          var A = (s.current.shards || [])
              .map(on)
              .filter(Boolean)
              .filter((R) => R.contains(b.target)),
            C = A.length > 0 ? i(b, A[0]) : !s.current.noIsolation;
          C && b.cancelable && b.preventDefault();
        }
      }
    }, []),
    c = l.useCallback((g, b, y, w) => {
      var A = { name: g, delta: b, target: y, should: w, shadowParent: Bi(y) };
      t.current.push(A),
        setTimeout(() => {
          t.current = t.current.filter((C) => C !== A);
        }, 1);
    }, []),
    u = l.useCallback((g) => {
      (r.current = gt(g)), (n.current = void 0);
    }, []),
    f = l.useCallback((g) => {
      c(g.type, nn(g), g.target, i(g, e.lockRef.current));
    }, []),
    m = l.useCallback((g) => {
      c(g.type, gt(g), g.target, i(g, e.lockRef.current));
    }, []);
  l.useEffect(
    () => (
      Ve.push(a),
      e.setCallbacks({ onScrollCapture: f, onWheelCapture: f, onTouchMoveCapture: m }),
      document.addEventListener('wheel', d, Be),
      document.addEventListener('touchmove', d, Be),
      document.addEventListener('touchstart', u, Be),
      () => {
        (Ve = Ve.filter((g) => g !== a)),
          document.removeEventListener('wheel', d, Be),
          document.removeEventListener('touchmove', d, Be),
          document.removeEventListener('touchstart', u, Be);
      }
    ),
    [],
  );
  var p = e.removeScrollBar,
    v = e.inert;
  return l.createElement(
    l.Fragment,
    null,
    v ? l.createElement(a, { styles: zi(o) }) : null,
    p ? l.createElement(Oi, { noRelative: e.noRelative, gapMode: e.gapMode }) : null,
  );
}
function Bi(e) {
  for (var t = null; e !== null; )
    e instanceof ShadowRoot && ((t = e.host), (e = e.host)), (e = e.parentNode);
  return t;
}
const Vi = vi(Gn, Wi);
var hr = l.forwardRef((e, t) => l.createElement(Ot, ce({}, e, { ref: t, sideCar: Vi })));
hr.classNames = Ot.classNames;
var Hi = (e) => {
    if (typeof document > 'u') return null;
    var t = Array.isArray(e) ? e[0] : e;
    return t.ownerDocument.body;
  },
  He = new WeakMap(),
  ht = new WeakMap(),
  vt = {},
  Gt = 0,
  Zn = (e) => e && (e.host || Zn(e.parentNode)),
  Ui = (e, t) =>
    t
      .map((r) => {
        if (e.contains(r)) return r;
        var n = Zn(r);
        return n && e.contains(n)
          ? n
          : (console.error('aria-hidden', r, 'in not contained inside', e, '. Doing nothing'),
            null);
      })
      .filter((r) => !!r),
  Gi = (e, t, r, n) => {
    var o = Ui(t, Array.isArray(e) ? e : [e]);
    vt[r] || (vt[r] = new WeakMap());
    var a = vt[r],
      s = [],
      i = new Set(),
      d = new Set(o),
      c = (f) => {
        !f || i.has(f) || (i.add(f), c(f.parentNode));
      };
    o.forEach(c);
    var u = (f) => {
      !f ||
        d.has(f) ||
        Array.prototype.forEach.call(f.children, (m) => {
          if (i.has(m)) u(m);
          else
            try {
              var p = m.getAttribute(n),
                v = p !== null && p !== 'false',
                g = (He.get(m) || 0) + 1,
                b = (a.get(m) || 0) + 1;
              He.set(m, g),
                a.set(m, b),
                s.push(m),
                g === 1 && v && ht.set(m, !0),
                b === 1 && m.setAttribute(r, 'true'),
                v || m.setAttribute(n, 'true');
            } catch (y) {
              console.error('aria-hidden: cannot operate on ', m, y);
            }
        });
    };
    return (
      u(t),
      i.clear(),
      Gt++,
      () => {
        s.forEach((f) => {
          var m = He.get(f) - 1,
            p = a.get(f) - 1;
          He.set(f, m),
            a.set(f, p),
            m || (ht.has(f) || f.removeAttribute(n), ht.delete(f)),
            p || f.removeAttribute(r);
        }),
          Gt--,
          Gt || ((He = new WeakMap()), (He = new WeakMap()), (ht = new WeakMap()), (vt = {}));
      }
    );
  },
  Qn = (e, t, r) => {
    r === void 0 && (r = 'data-aria-hidden');
    var n = Array.from(Array.isArray(e) ? e : [e]),
      o = Hi(e);
    return o
      ? (n.push.apply(n, Array.from(o.querySelectorAll('[aria-live], script'))),
        Gi(n, o, r, 'aria-hidden'))
      : () => null;
  },
  _t = 'Dialog',
  [Jn, eo] = st(_t),
  [Yi, se] = Jn(_t),
  to = (e) => {
    const {
        __scopeDialog: t,
        children: r,
        open: n,
        defaultOpen: o,
        onOpenChange: a,
        modal: s = !0,
      } = e,
      i = l.useRef(null),
      d = l.useRef(null),
      [c, u] = fr({ prop: n, defaultProp: o ?? !1, onChange: a, caller: _t });
    return h.jsx(Yi, {
      scope: t,
      triggerRef: i,
      contentRef: d,
      contentId: ue(),
      titleId: ue(),
      descriptionId: ue(),
      open: c,
      onOpenChange: u,
      onOpenToggle: l.useCallback(() => u((f) => !f), [u]),
      modal: s,
      children: r,
    });
  };
to.displayName = _t;
var ro = 'DialogTrigger',
  no = l.forwardRef((e, t) => {
    const { __scopeDialog: r, ...n } = e,
      o = se(ro, r),
      a = ee(t, o.triggerRef);
    return h.jsx(Q.button, {
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': o.open,
      'aria-controls': o.contentId,
      'data-state': yr(o.open),
      ...n,
      ref: a,
      onClick: J(e.onClick, o.onOpenToggle),
    });
  });
no.displayName = ro;
var vr = 'DialogPortal',
  [qi, oo] = Jn(vr, { forceMount: void 0 }),
  ao = (e) => {
    const { __scopeDialog: t, forceMount: r, children: n, container: o } = e,
      a = se(vr, t);
    return h.jsx(qi, {
      scope: t,
      forceMount: r,
      children: l.Children.map(n, (s) =>
        h.jsx(We, {
          present: r || a.open,
          children: h.jsx(gr, { asChild: !0, container: o, children: s }),
        }),
      ),
    });
  };
ao.displayName = vr;
var kt = 'DialogOverlay',
  so = l.forwardRef((e, t) => {
    const r = oo(kt, e.__scopeDialog),
      { forceMount: n = r.forceMount, ...o } = e,
      a = se(kt, e.__scopeDialog);
    return a.modal
      ? h.jsx(We, { present: n || a.open, children: h.jsx(Ki, { ...o, ref: t }) })
      : null;
  });
so.displayName = kt;
var Xi = Nt('DialogOverlay.RemoveScroll'),
  Ki = l.forwardRef((e, t) => {
    const { __scopeDialog: r, ...n } = e,
      o = se(kt, r);
    return h.jsx(hr, {
      as: Xi,
      allowPinchZoom: !0,
      shards: [o.contentRef],
      children: h.jsx(Q.div, {
        'data-state': yr(o.open),
        ...n,
        ref: t,
        style: { pointerEvents: 'auto', ...n.style },
      }),
    });
  }),
  Le = 'DialogContent',
  io = l.forwardRef((e, t) => {
    const r = oo(Le, e.__scopeDialog),
      { forceMount: n = r.forceMount, ...o } = e,
      a = se(Le, e.__scopeDialog);
    return h.jsx(We, {
      present: n || a.open,
      children: a.modal ? h.jsx(Zi, { ...o, ref: t }) : h.jsx(Qi, { ...o, ref: t }),
    });
  });
io.displayName = Le;
var Zi = l.forwardRef((e, t) => {
    const r = se(Le, e.__scopeDialog),
      n = l.useRef(null),
      o = ee(t, r.contentRef, n);
    return (
      l.useEffect(() => {
        const a = n.current;
        if (a) return Qn(a);
      }, []),
      h.jsx(lo, {
        ...e,
        ref: o,
        trapFocus: r.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: J(e.onCloseAutoFocus, (a) => {
          var s;
          a.preventDefault(), (s = r.triggerRef.current) == null || s.focus();
        }),
        onPointerDownOutside: J(e.onPointerDownOutside, (a) => {
          const s = a.detail.originalEvent,
            i = s.button === 0 && s.ctrlKey === !0;
          (s.button === 2 || i) && a.preventDefault();
        }),
        onFocusOutside: J(e.onFocusOutside, (a) => a.preventDefault()),
      })
    );
  }),
  Qi = l.forwardRef((e, t) => {
    const r = se(Le, e.__scopeDialog),
      n = l.useRef(!1),
      o = l.useRef(!1);
    return h.jsx(lo, {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      onCloseAutoFocus: (a) => {
        var s, i;
        (s = e.onCloseAutoFocus) == null || s.call(e, a),
          a.defaultPrevented ||
            (n.current || (i = r.triggerRef.current) == null || i.focus(), a.preventDefault()),
          (n.current = !1),
          (o.current = !1);
      },
      onInteractOutside: (a) => {
        var d, c;
        (d = e.onInteractOutside) == null || d.call(e, a),
          a.defaultPrevented ||
            ((n.current = !0), a.detail.originalEvent.type === 'pointerdown' && (o.current = !0));
        const s = a.target;
        ((c = r.triggerRef.current) == null ? void 0 : c.contains(s)) && a.preventDefault(),
          a.detail.originalEvent.type === 'focusin' && o.current && a.preventDefault();
      },
    });
  }),
  lo = l.forwardRef((e, t) => {
    const { __scopeDialog: r, trapFocus: n, onOpenAutoFocus: o, onCloseAutoFocus: a, ...s } = e,
      i = se(Le, r),
      d = l.useRef(null),
      c = ee(t, d);
    return (
      Vn(),
      h.jsxs(h.Fragment, {
        children: [
          h.jsx(pr, {
            asChild: !0,
            loop: !0,
            trapped: n,
            onMountAutoFocus: o,
            onUnmountAutoFocus: a,
            children: h.jsx(mr, {
              role: 'dialog',
              id: i.contentId,
              'aria-describedby': i.descriptionId,
              'aria-labelledby': i.titleId,
              'data-state': yr(i.open),
              ...s,
              ref: c,
              onDismiss: () => i.onOpenChange(!1),
            }),
          }),
          h.jsxs(h.Fragment, {
            children: [
              h.jsx(el, { titleId: i.titleId }),
              h.jsx(rl, { contentRef: d, descriptionId: i.descriptionId }),
            ],
          }),
        ],
      })
    );
  }),
  br = 'DialogTitle',
  co = l.forwardRef((e, t) => {
    const { __scopeDialog: r, ...n } = e,
      o = se(br, r);
    return h.jsx(Q.h2, { id: o.titleId, ...n, ref: t });
  });
co.displayName = br;
var uo = 'DialogDescription',
  fo = l.forwardRef((e, t) => {
    const { __scopeDialog: r, ...n } = e,
      o = se(uo, r);
    return h.jsx(Q.p, { id: o.descriptionId, ...n, ref: t });
  });
fo.displayName = uo;
var mo = 'DialogClose',
  po = l.forwardRef((e, t) => {
    const { __scopeDialog: r, ...n } = e,
      o = se(mo, r);
    return h.jsx(Q.button, {
      type: 'button',
      ...n,
      ref: t,
      onClick: J(e.onClick, () => o.onOpenChange(!1)),
    });
  });
po.displayName = mo;
function yr(e) {
  return e ? 'open' : 'closed';
}
var go = 'DialogTitleWarning',
  [Ji, ho] = js(go, { contentName: Le, titleName: br, docsSlug: 'dialog' }),
  el = ({ titleId: e }) => {
    const t = ho(go),
      r = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
    return (
      l.useEffect(() => {
        e && (document.getElementById(e) || console.error(r));
      }, [r, e]),
      null
    );
  },
  tl = 'DialogDescriptionWarning',
  rl = ({ contentRef: e, descriptionId: t }) => {
    const n = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${ho(tl).contentName}}.`;
    return (
      l.useEffect(() => {
        var a;
        const o = (a = e.current) == null ? void 0 : a.getAttribute('aria-describedby');
        t && o && (document.getElementById(t) || console.warn(n));
      }, [n, e, t]),
      null
    );
  },
  xr = to,
  nl = no,
  wr = ao,
  Cr = so,
  kr = io,
  vo = co,
  bo = fo,
  Er = po,
  yo = 'AlertDialog',
  [ol] = st(yo, [eo]),
  be = eo(),
  xo = (e) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = be(t);
    return h.jsx(xr, { ...n, ...r, modal: !0 });
  };
xo.displayName = yo;
var al = 'AlertDialogTrigger',
  sl = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, ...n } = e,
      o = be(r);
    return h.jsx(nl, { ...o, ...n, ref: t });
  });
sl.displayName = al;
var il = 'AlertDialogPortal',
  wo = (e) => {
    const { __scopeAlertDialog: t, ...r } = e,
      n = be(t);
    return h.jsx(wr, { ...n, ...r });
  };
wo.displayName = il;
var ll = 'AlertDialogOverlay',
  Co = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, ...n } = e,
      o = be(r);
    return h.jsx(Cr, { ...o, ...n, ref: t });
  });
Co.displayName = ll;
var qe = 'AlertDialogContent',
  [cl, dl] = ol(qe),
  ul = Os('AlertDialogContent'),
  ko = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, children: n, ...o } = e,
      a = be(r),
      s = l.useRef(null),
      i = ee(t, s),
      d = l.useRef(null);
    return h.jsx(Ji, {
      contentName: qe,
      titleName: Eo,
      docsSlug: 'alert-dialog',
      children: h.jsx(cl, {
        scope: r,
        cancelRef: d,
        children: h.jsxs(kr, {
          role: 'alertdialog',
          ...a,
          ...o,
          ref: i,
          onOpenAutoFocus: J(o.onOpenAutoFocus, (c) => {
            var u;
            c.preventDefault(), (u = d.current) == null || u.focus({ preventScroll: !0 });
          }),
          onPointerDownOutside: (c) => c.preventDefault(),
          onInteractOutside: (c) => c.preventDefault(),
          children: [h.jsx(ul, { children: n }), h.jsx(ml, { contentRef: s })],
        }),
      }),
    });
  });
ko.displayName = qe;
var Eo = 'AlertDialogTitle',
  Ao = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, ...n } = e,
      o = be(r);
    return h.jsx(vo, { ...o, ...n, ref: t });
  });
Ao.displayName = Eo;
var So = 'AlertDialogDescription',
  Ro = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, ...n } = e,
      o = be(r);
    return h.jsx(bo, { ...o, ...n, ref: t });
  });
Ro.displayName = So;
var fl = 'AlertDialogAction',
  Po = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, ...n } = e,
      o = be(r);
    return h.jsx(Er, { ...o, ...n, ref: t });
  });
Po.displayName = fl;
var No = 'AlertDialogCancel',
  Oo = l.forwardRef((e, t) => {
    const { __scopeAlertDialog: r, ...n } = e,
      { cancelRef: o } = dl(No, r),
      a = be(r),
      s = ee(t, o);
    return h.jsx(Er, { ...a, ...n, ref: s });
  });
Oo.displayName = No;
var ml = ({ contentRef: e }) => {
    const t = `\`${qe}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${qe}\` by passing a \`${So}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${qe}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
    return (
      l.useEffect(() => {
        var n;
        document.getElementById(
          (n = e.current) == null ? void 0 : n.getAttribute('aria-describedby'),
        ) || console.warn(t);
      }, [t, e]),
      null
    );
  },
  pl = xo,
  gl = wo,
  hl = Co,
  vl = ko,
  bl = Po,
  yl = Oo,
  xl = Ao,
  wl = Ro;
function Cl(e) {
  const t = l.useRef({ value: e, previous: e });
  return l.useMemo(
    () => (
      t.current.value !== e && ((t.current.previous = t.current.value), (t.current.value = e)),
      t.current.previous
    ),
    [e],
  );
}
function _o(e) {
  const [t, r] = l.useState(void 0);
  return (
    Ae(() => {
      if (e) {
        r({ width: e.offsetWidth, height: e.offsetHeight });
        const n = new ResizeObserver((o) => {
          if (!Array.isArray(o) || !o.length) return;
          const a = o[0];
          let s, i;
          if ('borderBoxSize' in a) {
            const d = a.borderBoxSize,
              c = Array.isArray(d) ? d[0] : d;
            (s = c.inlineSize), (i = c.blockSize);
          } else (s = e.offsetWidth), (i = e.offsetHeight);
          r({ width: s, height: i });
        });
        return n.observe(e, { box: 'border-box' }), () => n.unobserve(e);
      } else r(void 0);
    }, [e]),
    t
  );
}
var Dt = 'Checkbox',
  [kl] = st(Dt),
  [El, Ar] = kl(Dt);
function Al(e) {
  const {
      __scopeCheckbox: t,
      checked: r,
      children: n,
      defaultChecked: o,
      disabled: a,
      form: s,
      name: i,
      onCheckedChange: d,
      required: c,
      value: u = 'on',
      internal_do_not_use_render: f,
    } = e,
    [m, p] = fr({ prop: r, defaultProp: o ?? !1, onChange: d, caller: Dt }),
    [v, g] = l.useState(null),
    [b, y] = l.useState(null),
    w = l.useRef(!1),
    A = v ? !!s || !!v.closest('form') : !0,
    C = {
      checked: m,
      disabled: a,
      setChecked: p,
      control: v,
      setControl: g,
      name: i,
      form: s,
      value: u,
      hasConsumerStoppedPropagationRef: w,
      required: c,
      defaultChecked: ke(o) ? !1 : o,
      isFormControl: A,
      bubbleInput: b,
      setBubbleInput: y,
    };
  return h.jsx(El, { scope: t, ...C, children: Sl(f) ? f(C) : n });
}
var Do = 'CheckboxTrigger',
  To = l.forwardRef(({ __scopeCheckbox: e, onKeyDown: t, onClick: r, ...n }, o) => {
    const {
        control: a,
        value: s,
        disabled: i,
        checked: d,
        required: c,
        setControl: u,
        setChecked: f,
        hasConsumerStoppedPropagationRef: m,
        isFormControl: p,
        bubbleInput: v,
      } = Ar(Do, e),
      g = ee(o, u),
      b = l.useRef(d);
    return (
      l.useEffect(() => {
        const y = a == null ? void 0 : a.form;
        if (y) {
          const w = () => f(b.current);
          return y.addEventListener('reset', w), () => y.removeEventListener('reset', w);
        }
      }, [a, f]),
      h.jsx(Q.button, {
        type: 'button',
        role: 'checkbox',
        'aria-checked': ke(d) ? 'mixed' : d,
        'aria-required': c,
        'data-state': zo(d),
        'data-disabled': i ? '' : void 0,
        disabled: i,
        value: s,
        ...n,
        ref: g,
        onKeyDown: J(t, (y) => {
          y.key === 'Enter' && y.preventDefault();
        }),
        onClick: J(r, (y) => {
          f((w) => (ke(w) ? !0 : !w)),
            v && p && ((m.current = y.isPropagationStopped()), m.current || y.stopPropagation());
        }),
      })
    );
  });
To.displayName = Do;
var Io = l.forwardRef((e, t) => {
  const {
    __scopeCheckbox: r,
    name: n,
    checked: o,
    defaultChecked: a,
    required: s,
    disabled: i,
    value: d,
    onCheckedChange: c,
    form: u,
    ...f
  } = e;
  return h.jsx(Al, {
    __scopeCheckbox: r,
    checked: o,
    defaultChecked: a,
    disabled: i,
    required: s,
    onCheckedChange: c,
    name: n,
    form: u,
    value: d,
    internal_do_not_use_render: ({ isFormControl: m }) =>
      h.jsxs(h.Fragment, {
        children: [
          h.jsx(To, { ...f, ref: t, __scopeCheckbox: r }),
          m && h.jsx($o, { __scopeCheckbox: r }),
        ],
      }),
  });
});
Io.displayName = Dt;
var Mo = 'CheckboxIndicator',
  jo = l.forwardRef((e, t) => {
    const { __scopeCheckbox: r, forceMount: n, ...o } = e,
      a = Ar(Mo, r);
    return h.jsx(We, {
      present: n || ke(a.checked) || a.checked === !0,
      children: h.jsx(Q.span, {
        'data-state': zo(a.checked),
        'data-disabled': a.disabled ? '' : void 0,
        ...o,
        ref: t,
        style: { pointerEvents: 'none', ...e.style },
      }),
    });
  });
jo.displayName = Mo;
var Lo = 'CheckboxBubbleInput',
  $o = l.forwardRef(({ __scopeCheckbox: e, ...t }, r) => {
    const {
        control: n,
        hasConsumerStoppedPropagationRef: o,
        checked: a,
        defaultChecked: s,
        required: i,
        disabled: d,
        name: c,
        value: u,
        form: f,
        bubbleInput: m,
        setBubbleInput: p,
      } = Ar(Lo, e),
      v = ee(r, p),
      g = Cl(a),
      b = _o(n);
    l.useEffect(() => {
      const w = m;
      if (!w) return;
      const A = window.HTMLInputElement.prototype,
        R = Object.getOwnPropertyDescriptor(A, 'checked').set,
        E = !o.current;
      if (g !== a && R) {
        const S = new Event('click', { bubbles: E });
        (w.indeterminate = ke(a)), R.call(w, ke(a) ? !1 : a), w.dispatchEvent(S);
      }
    }, [m, g, a, o]);
    const y = l.useRef(ke(a) ? !1 : a);
    return h.jsx(Q.input, {
      type: 'checkbox',
      'aria-hidden': !0,
      defaultChecked: s ?? y.current,
      required: i,
      disabled: d,
      name: c,
      value: u,
      form: f,
      ...t,
      tabIndex: -1,
      ref: v,
      style: {
        ...t.style,
        ...b,
        position: 'absolute',
        pointerEvents: 'none',
        opacity: 0,
        margin: 0,
        transform: 'translateX(-100%)',
      },
    });
  });
$o.displayName = Lo;
function Sl(e) {
  return typeof e == 'function';
}
function ke(e) {
  return e === 'indeterminate';
}
function zo(e) {
  return ke(e) ? 'indeterminate' : e ? 'checked' : 'unchecked';
}
const Rl = ['top', 'right', 'bottom', 'left'],
  Se = Math.min,
  te = Math.max,
  Et = Math.round,
  bt = Math.floor,
  fe = (e) => ({ x: e, y: e }),
  Pl = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };
function nr(e, t, r) {
  return te(e, Se(t, r));
}
function he(e, t) {
  return typeof e == 'function' ? e(t) : e;
}
function ve(e) {
  return e.split('-')[0];
}
function Je(e) {
  return e.split('-')[1];
}
function Sr(e) {
  return e === 'x' ? 'y' : 'x';
}
function Rr(e) {
  return e === 'y' ? 'height' : 'width';
}
function de(e) {
  const t = e[0];
  return t === 't' || t === 'b' ? 'y' : 'x';
}
function Pr(e) {
  return Sr(de(e));
}
function Nl(e, t, r) {
  r === void 0 && (r = !1);
  const n = Je(e),
    o = Pr(e),
    a = Rr(o);
  let s =
    o === 'x' ? (n === (r ? 'end' : 'start') ? 'right' : 'left') : n === 'start' ? 'bottom' : 'top';
  return t.reference[a] > t.floating[a] && (s = At(s)), [s, At(s)];
}
function Ol(e) {
  const t = At(e);
  return [or(e), t, or(t)];
}
function or(e) {
  return e.includes('start') ? e.replace('start', 'end') : e.replace('end', 'start');
}
const an = ['left', 'right'],
  sn = ['right', 'left'],
  _l = ['top', 'bottom'],
  Dl = ['bottom', 'top'];
function Tl(e, t, r) {
  switch (e) {
    case 'top':
    case 'bottom':
      return r ? (t ? sn : an) : t ? an : sn;
    case 'left':
    case 'right':
      return t ? _l : Dl;
    default:
      return [];
  }
}
function Il(e, t, r, n) {
  const o = Je(e);
  let a = Tl(ve(e), r === 'start', n);
  return o && ((a = a.map((s) => s + '-' + o)), t && (a = a.concat(a.map(or)))), a;
}
function At(e) {
  const t = ve(e);
  return Pl[t] + e.slice(t.length);
}
function Ml(e) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e };
}
function Fo(e) {
  return typeof e != 'number' ? Ml(e) : { top: e, right: e, bottom: e, left: e };
}
function St(e) {
  const { x: t, y: r, width: n, height: o } = e;
  return { width: n, height: o, top: r, left: t, right: t + n, bottom: r + o, x: t, y: r };
}
function ln(e, t, r) {
  const { reference: n, floating: o } = e;
  const a = de(t),
    s = Pr(t),
    i = Rr(s),
    d = ve(t),
    c = a === 'y',
    u = n.x + n.width / 2 - o.width / 2,
    f = n.y + n.height / 2 - o.height / 2,
    m = n[i] / 2 - o[i] / 2;
  let p;
  switch (d) {
    case 'top':
      p = { x: u, y: n.y - o.height };
      break;
    case 'bottom':
      p = { x: u, y: n.y + n.height };
      break;
    case 'right':
      p = { x: n.x + n.width, y: f };
      break;
    case 'left':
      p = { x: n.x - o.width, y: f };
      break;
    default:
      p = { x: n.x, y: n.y };
  }
  switch (Je(t)) {
    case 'start':
      p[s] -= m * (r && c ? -1 : 1);
      break;
    case 'end':
      p[s] += m * (r && c ? -1 : 1);
      break;
  }
  return p;
}
async function jl(e, t) {
  var r;
  t === void 0 && (t = {});
  const { x: n, y: o, platform: a, rects: s, elements: i, strategy: d } = e,
    {
      boundary: c = 'clippingAncestors',
      rootBoundary: u = 'viewport',
      elementContext: f = 'floating',
      altBoundary: m = !1,
      padding: p = 0,
    } = he(t, e),
    v = Fo(p),
    b = i[m ? (f === 'floating' ? 'reference' : 'floating') : f],
    y = St(
      await a.getClippingRect({
        element:
          (r = await (a.isElement == null ? void 0 : a.isElement(b))) == null || r
            ? b
            : b.contextElement ||
              (await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(i.floating))),
        boundary: c,
        rootBoundary: u,
        strategy: d,
      }),
    ),
    w =
      f === 'floating'
        ? { x: n, y: o, width: s.floating.width, height: s.floating.height }
        : s.reference,
    A = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(i.floating)),
    C = (await (a.isElement == null ? void 0 : a.isElement(A)))
      ? (await (a.getScale == null ? void 0 : a.getScale(A))) || { x: 1, y: 1 }
      : { x: 1, y: 1 },
    R = St(
      a.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: i,
            rect: w,
            offsetParent: A,
            strategy: d,
          })
        : w,
    );
  return {
    top: (y.top - R.top + v.top) / C.y,
    bottom: (R.bottom - y.bottom + v.bottom) / C.y,
    left: (y.left - R.left + v.left) / C.x,
    right: (R.right - y.right + v.right) / C.x,
  };
}
const Ll = 50,
  $l = async (e, t, r) => {
    const {
        placement: n = 'bottom',
        strategy: o = 'absolute',
        middleware: a = [],
        platform: s,
      } = r,
      i = s.detectOverflow ? s : { ...s, detectOverflow: jl },
      d = await (s.isRTL == null ? void 0 : s.isRTL(t));
    let c = await s.getElementRects({ reference: e, floating: t, strategy: o }),
      { x: u, y: f } = ln(c, n, d),
      m = n,
      p = 0;
    const v = {};
    for (let g = 0; g < a.length; g++) {
      const b = a[g];
      if (!b) continue;
      const { name: y, fn: w } = b,
        {
          x: A,
          y: C,
          data: R,
          reset: E,
        } = await w({
          x: u,
          y: f,
          initialPlacement: n,
          placement: m,
          strategy: o,
          middlewareData: v,
          rects: c,
          platform: i,
          elements: { reference: e, floating: t },
        });
      (u = A ?? u),
        (f = C ?? f),
        (v[y] = { ...v[y], ...R }),
        E &&
          p < Ll &&
          (p++,
          typeof E == 'object' &&
            (E.placement && (m = E.placement),
            E.rects &&
              (c =
                E.rects === !0
                  ? await s.getElementRects({ reference: e, floating: t, strategy: o })
                  : E.rects),
            ({ x: u, y: f } = ln(c, m, d))),
          (g = -1));
    }
    return { x: u, y: f, placement: m, strategy: o, middlewareData: v };
  },
  zl = (e) => ({
    name: 'arrow',
    options: e,
    async fn(t) {
      const { x: r, y: n, placement: o, rects: a, platform: s, elements: i, middlewareData: d } = t,
        { element: c, padding: u = 0 } = he(e, t) || {};
      if (c == null) return {};
      const f = Fo(u),
        m = { x: r, y: n },
        p = Pr(o),
        v = Rr(p),
        g = await s.getDimensions(c),
        b = p === 'y',
        y = b ? 'top' : 'left',
        w = b ? 'bottom' : 'right',
        A = b ? 'clientHeight' : 'clientWidth',
        C = a.reference[v] + a.reference[p] - m[p] - a.floating[v],
        R = m[p] - a.reference[p],
        E = await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(c));
      let S = E ? E[A] : 0;
      (!S || !(await (s.isElement == null ? void 0 : s.isElement(E)))) &&
        (S = i.floating[A] || a.floating[v]);
      const k = C / 2 - R / 2,
        j = S / 2 - g[v] / 2 - 1,
        W = Se(f[y], j),
        U = Se(f[w], j),
        G = W,
        q = S - g[v] - U,
        F = S / 2 - g[v] / 2 + k,
        Y = nr(G, F, q),
        z =
          !d.arrow &&
          Je(o) != null &&
          F !== Y &&
          a.reference[v] / 2 - (F < G ? W : U) - g[v] / 2 < 0,
        B = z ? (F < G ? F - G : F - q) : 0;
      return {
        [p]: m[p] + B,
        data: { [p]: Y, centerOffset: F - Y - B, ...(z && { alignmentOffset: B }) },
        reset: z,
      };
    },
  }),
  Fl = (e) => (
    e === void 0 && (e = {}),
    {
      name: 'flip',
      options: e,
      async fn(t) {
        var r, n;
        const {
            placement: o,
            middlewareData: a,
            rects: s,
            initialPlacement: i,
            platform: d,
            elements: c,
          } = t,
          {
            mainAxis: u = !0,
            crossAxis: f = !0,
            fallbackPlacements: m,
            fallbackStrategy: p = 'bestFit',
            fallbackAxisSideDirection: v = 'none',
            flipAlignment: g = !0,
            ...b
          } = he(e, t);
        if ((r = a.arrow) != null && r.alignmentOffset) return {};
        const y = ve(o),
          w = de(i),
          A = ve(i) === i,
          C = await (d.isRTL == null ? void 0 : d.isRTL(c.floating)),
          R = m || (A || !g ? [At(i)] : Ol(i)),
          E = v !== 'none';
        !m && E && R.push(...Il(i, g, v, C));
        const S = [i, ...R],
          k = await d.detectOverflow(t, b),
          j = [];
        let W = ((n = a.flip) == null ? void 0 : n.overflows) || [];
        if ((u && j.push(k[y]), f)) {
          const F = Nl(o, s, C);
          j.push(k[F[0]], k[F[1]]);
        }
        if (((W = [...W, { placement: o, overflows: j }]), !j.every((F) => F <= 0))) {
          var U, G;
          const F = (((U = a.flip) == null ? void 0 : U.index) || 0) + 1,
            Y = S[F];
          if (
            Y &&
            (!(f === 'alignment' ? w !== de(Y) : !1) ||
              W.every((I) => (de(I.placement) === w ? I.overflows[0] > 0 : !0)))
          )
            return { data: { index: F, overflows: W }, reset: { placement: Y } };
          let z =
            (G = W.filter((B) => B.overflows[0] <= 0).sort(
              (B, I) => B.overflows[1] - I.overflows[1],
            )[0]) == null
              ? void 0
              : G.placement;
          if (!z)
            switch (p) {
              case 'bestFit': {
                var q;
                const B =
                  (q = W.filter((I) => {
                    if (E) {
                      const X = de(I.placement);
                      return X === w || X === 'y';
                    }
                    return !0;
                  })
                    .map((I) => [
                      I.placement,
                      I.overflows.filter((X) => X > 0).reduce((X, O) => X + O, 0),
                    ])
                    .sort((I, X) => I[1] - X[1])[0]) == null
                    ? void 0
                    : q[0];
                B && (z = B);
                break;
              }
              case 'initialPlacement':
                z = i;
                break;
            }
          if (o !== z) return { reset: { placement: z } };
        }
        return {};
      },
    }
  );
function cn(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width,
  };
}
function dn(e) {
  return Rl.some((t) => e[t] >= 0);
}
const Wl = (e) => (
    e === void 0 && (e = {}),
    {
      name: 'hide',
      options: e,
      async fn(t) {
        const { rects: r, platform: n } = t,
          { strategy: o = 'referenceHidden', ...a } = he(e, t);
        switch (o) {
          case 'referenceHidden': {
            const s = await n.detectOverflow(t, { ...a, elementContext: 'reference' }),
              i = cn(s, r.reference);
            return { data: { referenceHiddenOffsets: i, referenceHidden: dn(i) } };
          }
          case 'escaped': {
            const s = await n.detectOverflow(t, { ...a, altBoundary: !0 }),
              i = cn(s, r.floating);
            return { data: { escapedOffsets: i, escaped: dn(i) } };
          }
          default:
            return {};
        }
      },
    }
  ),
  Wo = new Set(['left', 'top']);
async function Bl(e, t) {
  const { placement: r, platform: n, elements: o } = e,
    a = await (n.isRTL == null ? void 0 : n.isRTL(o.floating)),
    s = ve(r),
    i = Je(r),
    d = de(r) === 'y',
    c = Wo.has(s) ? -1 : 1,
    u = a && d ? -1 : 1,
    f = he(t, e);
  let {
    mainAxis: m,
    crossAxis: p,
    alignmentAxis: v,
  } = typeof f == 'number'
    ? { mainAxis: f, crossAxis: 0, alignmentAxis: null }
    : { mainAxis: f.mainAxis || 0, crossAxis: f.crossAxis || 0, alignmentAxis: f.alignmentAxis };
  return (
    i && typeof v == 'number' && (p = i === 'end' ? v * -1 : v),
    d ? { x: p * u, y: m * c } : { x: m * c, y: p * u }
  );
}
const Vl = (e) => (
    e === void 0 && (e = 0),
    {
      name: 'offset',
      options: e,
      async fn(t) {
        var r, n;
        const { x: o, y: a, placement: s, middlewareData: i } = t,
          d = await Bl(t, e);
        return s === ((r = i.offset) == null ? void 0 : r.placement) &&
          (n = i.arrow) != null &&
          n.alignmentOffset
          ? {}
          : { x: o + d.x, y: a + d.y, data: { ...d, placement: s } };
      },
    }
  ),
  Hl = (e) => (
    e === void 0 && (e = {}),
    {
      name: 'shift',
      options: e,
      async fn(t) {
        const { x: r, y: n, placement: o, platform: a } = t,
          {
            mainAxis: s = !0,
            crossAxis: i = !1,
            limiter: d = {
              fn: (y) => {
                const { x: w, y: A } = y;
                return { x: w, y: A };
              },
            },
            ...c
          } = he(e, t),
          u = { x: r, y: n },
          f = await a.detectOverflow(t, c),
          m = de(ve(o)),
          p = Sr(m);
        let v = u[p],
          g = u[m];
        if (s) {
          const y = p === 'y' ? 'top' : 'left',
            w = p === 'y' ? 'bottom' : 'right',
            A = v + f[y],
            C = v - f[w];
          v = nr(A, v, C);
        }
        if (i) {
          const y = m === 'y' ? 'top' : 'left',
            w = m === 'y' ? 'bottom' : 'right',
            A = g + f[y],
            C = g - f[w];
          g = nr(A, g, C);
        }
        const b = d.fn({ ...t, [p]: v, [m]: g });
        return { ...b, data: { x: b.x - r, y: b.y - n, enabled: { [p]: s, [m]: i } } };
      },
    }
  ),
  Ul = (e) => (
    e === void 0 && (e = {}),
    {
      options: e,
      fn(t) {
        const { x: r, y: n, placement: o, rects: a, middlewareData: s } = t,
          { offset: i = 0, mainAxis: d = !0, crossAxis: c = !0 } = he(e, t),
          u = { x: r, y: n },
          f = de(o),
          m = Sr(f);
        let p = u[m],
          v = u[f];
        const g = he(i, t),
          b =
            typeof g == 'number'
              ? { mainAxis: g, crossAxis: 0 }
              : { mainAxis: 0, crossAxis: 0, ...g };
        if (d) {
          const A = m === 'y' ? 'height' : 'width',
            C = a.reference[m] - a.floating[A] + b.mainAxis,
            R = a.reference[m] + a.reference[A] - b.mainAxis;
          p < C ? (p = C) : p > R && (p = R);
        }
        if (c) {
          var y, w;
          const A = m === 'y' ? 'width' : 'height',
            C = Wo.has(ve(o)),
            R =
              a.reference[f] -
              a.floating[A] +
              ((C && ((y = s.offset) == null ? void 0 : y[f])) || 0) +
              (C ? 0 : b.crossAxis),
            E =
              a.reference[f] +
              a.reference[A] +
              (C ? 0 : ((w = s.offset) == null ? void 0 : w[f]) || 0) -
              (C ? b.crossAxis : 0);
          v < R ? (v = R) : v > E && (v = E);
        }
        return { [m]: p, [f]: v };
      },
    }
  ),
  Gl = (e) => (
    e === void 0 && (e = {}),
    {
      name: 'size',
      options: e,
      async fn(t) {
        var r, n;
        const { placement: o, rects: a, platform: s, elements: i } = t,
          { apply: d = () => {}, ...c } = he(e, t),
          u = await s.detectOverflow(t, c),
          f = ve(o),
          m = Je(o),
          p = de(o) === 'y',
          { width: v, height: g } = a.floating;
        let b, y;
        f === 'top' || f === 'bottom'
          ? ((b = f),
            (y =
              m === ((await (s.isRTL == null ? void 0 : s.isRTL(i.floating))) ? 'start' : 'end')
                ? 'left'
                : 'right'))
          : ((y = f), (b = m === 'end' ? 'top' : 'bottom'));
        const w = g - u.top - u.bottom,
          A = v - u.left - u.right,
          C = Se(g - u[b], w),
          R = Se(v - u[y], A),
          E = !t.middlewareData.shift;
        let S = C,
          k = R;
        if (
          ((r = t.middlewareData.shift) != null && r.enabled.x && (k = A),
          (n = t.middlewareData.shift) != null && n.enabled.y && (S = w),
          E && !m)
        ) {
          const W = te(u.left, 0),
            U = te(u.right, 0),
            G = te(u.top, 0),
            q = te(u.bottom, 0);
          p
            ? (k = v - 2 * (W !== 0 || U !== 0 ? W + U : te(u.left, u.right)))
            : (S = g - 2 * (G !== 0 || q !== 0 ? G + q : te(u.top, u.bottom)));
        }
        await d({ ...t, availableWidth: k, availableHeight: S });
        const j = await s.getDimensions(i.floating);
        return v !== j.width || g !== j.height ? { reset: { rects: !0 } } : {};
      },
    }
  );
function Tt() {
  return typeof window < 'u';
}
function et(e) {
  return Bo(e) ? (e.nodeName || '').toLowerCase() : '#document';
}
function re(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function me(e) {
  var t;
  return (t = (Bo(e) ? e.ownerDocument : e.document) || window.document) == null
    ? void 0
    : t.documentElement;
}
function Bo(e) {
  return Tt() ? e instanceof Node || e instanceof re(e).Node : !1;
}
function oe(e) {
  return Tt() ? e instanceof Element || e instanceof re(e).Element : !1;
}
function ye(e) {
  return Tt() ? e instanceof HTMLElement || e instanceof re(e).HTMLElement : !1;
}
function un(e) {
  return !Tt() || typeof ShadowRoot > 'u'
    ? !1
    : e instanceof ShadowRoot || e instanceof re(e).ShadowRoot;
}
function it(e) {
  const { overflow: t, overflowX: r, overflowY: n, display: o } = ae(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + n + r) && o !== 'inline' && o !== 'contents';
}
function Yl(e) {
  return /^(table|td|th)$/.test(et(e));
}
function It(e) {
  try {
    if (e.matches(':popover-open')) return !0;
  } catch {}
  try {
    return e.matches(':modal');
  } catch {
    return !1;
  }
}
const ql = /transform|translate|scale|rotate|perspective|filter/,
  Xl = /paint|layout|strict|content/,
  je = (e) => !!e && e !== 'none';
let Yt;
function Nr(e) {
  const t = oe(e) ? ae(e) : e;
  return (
    je(t.transform) ||
    je(t.translate) ||
    je(t.scale) ||
    je(t.rotate) ||
    je(t.perspective) ||
    (!Or() && (je(t.backdropFilter) || je(t.filter))) ||
    ql.test(t.willChange || '') ||
    Xl.test(t.contain || '')
  );
}
function Kl(e) {
  let t = Re(e);
  while (ye(t) && !Ze(t)) {
    if (Nr(t)) return t;
    if (It(t)) return null;
    t = Re(t);
  }
  return null;
}
function Or() {
  return (
    Yt == null &&
      (Yt = typeof CSS < 'u' && CSS.supports && CSS.supports('-webkit-backdrop-filter', 'none')),
    Yt
  );
}
function Ze(e) {
  return /^(html|body|#document)$/.test(et(e));
}
function ae(e) {
  return re(e).getComputedStyle(e);
}
function Mt(e) {
  return oe(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function Re(e) {
  if (et(e) === 'html') return e;
  const t = e.assignedSlot || e.parentNode || (un(e) && e.host) || me(e);
  return un(t) ? t.host : t;
}
function Vo(e) {
  const t = Re(e);
  return Ze(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : ye(t) && it(t) ? t : Vo(t);
}
function at(e, t, r) {
  var n;
  t === void 0 && (t = []), r === void 0 && (r = !0);
  const o = Vo(e),
    a = o === ((n = e.ownerDocument) == null ? void 0 : n.body),
    s = re(o);
  if (a) {
    const i = ar(s);
    return t.concat(s, s.visualViewport || [], it(o) ? o : [], i && r ? at(i) : []);
  } else return t.concat(o, at(o, [], r));
}
function ar(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function Ho(e) {
  const t = ae(e);
  let r = Number.parseFloat(t.width) || 0,
    n = Number.parseFloat(t.height) || 0;
  const o = ye(e),
    a = o ? e.offsetWidth : r,
    s = o ? e.offsetHeight : n,
    i = Et(r) !== a || Et(n) !== s;
  return i && ((r = a), (n = s)), { width: r, height: n, $: i };
}
function _r(e) {
  return oe(e) ? e : e.contextElement;
}
function Xe(e) {
  const t = _r(e);
  if (!ye(t)) return fe(1);
  const r = t.getBoundingClientRect(),
    { width: n, height: o, $: a } = Ho(t);
  let s = (a ? Et(r.width) : r.width) / n,
    i = (a ? Et(r.height) : r.height) / o;
  return (
    (!s || !Number.isFinite(s)) && (s = 1), (!i || !Number.isFinite(i)) && (i = 1), { x: s, y: i }
  );
}
const Zl = fe(0);
function Uo(e) {
  const t = re(e);
  return !Or() || !t.visualViewport
    ? Zl
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function Ql(e, t, r) {
  return t === void 0 && (t = !1), !r || (t && r !== re(e)) ? !1 : t;
}
function $e(e, t, r, n) {
  t === void 0 && (t = !1), r === void 0 && (r = !1);
  const o = e.getBoundingClientRect(),
    a = _r(e);
  let s = fe(1);
  t && (n ? oe(n) && (s = Xe(n)) : (s = Xe(e)));
  const i = Ql(a, r, n) ? Uo(a) : fe(0);
  let d = (o.left + i.x) / s.x,
    c = (o.top + i.y) / s.y,
    u = o.width / s.x,
    f = o.height / s.y;
  if (a) {
    const m = re(a),
      p = n && oe(n) ? re(n) : n;
    let v = m,
      g = ar(v);
    while (g && n && p !== v) {
      const b = Xe(g),
        y = g.getBoundingClientRect(),
        w = ae(g),
        A = y.left + (g.clientLeft + Number.parseFloat(w.paddingLeft)) * b.x,
        C = y.top + (g.clientTop + Number.parseFloat(w.paddingTop)) * b.y;
      (d *= b.x), (c *= b.y), (u *= b.x), (f *= b.y), (d += A), (c += C), (v = re(g)), (g = ar(v));
    }
  }
  return St({ width: u, height: f, x: d, y: c });
}
function jt(e, t) {
  const r = Mt(e).scrollLeft;
  return t ? t.left + r : $e(me(e)).left + r;
}
function Go(e, t) {
  const r = e.getBoundingClientRect(),
    n = r.left + t.scrollLeft - jt(e, r),
    o = r.top + t.scrollTop;
  return { x: n, y: o };
}
function Jl(e) {
  const { elements: t, rect: r, offsetParent: n, strategy: o } = e;
  const a = o === 'fixed',
    s = me(n),
    i = t ? It(t.floating) : !1;
  if (n === s || (i && a)) return r;
  let d = { scrollLeft: 0, scrollTop: 0 },
    c = fe(1);
  const u = fe(0),
    f = ye(n);
  if ((f || (!f && !a)) && ((et(n) !== 'body' || it(s)) && (d = Mt(n)), f)) {
    const p = $e(n);
    (c = Xe(n)), (u.x = p.x + n.clientLeft), (u.y = p.y + n.clientTop);
  }
  const m = s && !f && !a ? Go(s, d) : fe(0);
  return {
    width: r.width * c.x,
    height: r.height * c.y,
    x: r.x * c.x - d.scrollLeft * c.x + u.x + m.x,
    y: r.y * c.y - d.scrollTop * c.y + u.y + m.y,
  };
}
function ec(e) {
  return Array.from(e.getClientRects());
}
function tc(e) {
  const t = me(e),
    r = Mt(e),
    n = e.ownerDocument.body,
    o = te(t.scrollWidth, t.clientWidth, n.scrollWidth, n.clientWidth),
    a = te(t.scrollHeight, t.clientHeight, n.scrollHeight, n.clientHeight);
  let s = -r.scrollLeft + jt(e);
  const i = -r.scrollTop;
  return (
    ae(n).direction === 'rtl' && (s += te(t.clientWidth, n.clientWidth) - o),
    { width: o, height: a, x: s, y: i }
  );
}
const fn = 25;
function rc(e, t) {
  const r = re(e),
    n = me(e),
    o = r.visualViewport;
  let a = n.clientWidth,
    s = n.clientHeight,
    i = 0,
    d = 0;
  if (o) {
    (a = o.width), (s = o.height);
    const u = Or();
    (!u || (u && t === 'fixed')) && ((i = o.offsetLeft), (d = o.offsetTop));
  }
  const c = jt(n);
  if (c <= 0) {
    const u = n.ownerDocument,
      f = u.body,
      m = getComputedStyle(f),
      p =
        (u.compatMode === 'CSS1Compat' &&
          Number.parseFloat(m.marginLeft) + Number.parseFloat(m.marginRight)) ||
        0,
      v = Math.abs(n.clientWidth - f.clientWidth - p);
    v <= fn && (a -= v);
  } else c <= fn && (a += c);
  return { width: a, height: s, x: i, y: d };
}
function nc(e, t) {
  const r = $e(e, !0, t === 'fixed'),
    n = r.top + e.clientTop,
    o = r.left + e.clientLeft,
    a = ye(e) ? Xe(e) : fe(1),
    s = e.clientWidth * a.x,
    i = e.clientHeight * a.y,
    d = o * a.x,
    c = n * a.y;
  return { width: s, height: i, x: d, y: c };
}
function mn(e, t, r) {
  let n;
  if (t === 'viewport') n = rc(e, r);
  else if (t === 'document') n = tc(me(e));
  else if (oe(t)) n = nc(t, r);
  else {
    const o = Uo(e);
    n = { x: t.x - o.x, y: t.y - o.y, width: t.width, height: t.height };
  }
  return St(n);
}
function Yo(e, t) {
  const r = Re(e);
  return r === t || !oe(r) || Ze(r) ? !1 : ae(r).position === 'fixed' || Yo(r, t);
}
function oc(e, t) {
  const r = t.get(e);
  if (r) return r;
  let n = at(e, [], !1).filter((i) => oe(i) && et(i) !== 'body'),
    o = null;
  const a = ae(e).position === 'fixed';
  let s = a ? Re(e) : e;
  while (oe(s) && !Ze(s)) {
    const i = ae(s),
      d = Nr(s);
    !d && i.position === 'fixed' && (o = null),
      (
        a
          ? !d && !o
          : (!d &&
              i.position === 'static' &&
              !!o &&
              (o.position === 'absolute' || o.position === 'fixed')) ||
            (it(s) && !d && Yo(e, s))
      )
        ? (n = n.filter((u) => u !== s))
        : (o = i),
      (s = Re(s));
  }
  return t.set(e, n), n;
}
function ac(e) {
  const { element: t, boundary: r, rootBoundary: n, strategy: o } = e;
  const s = [...(r === 'clippingAncestors' ? (It(t) ? [] : oc(t, this._c)) : [].concat(r)), n],
    i = mn(t, s[0], o);
  let d = i.top,
    c = i.right,
    u = i.bottom,
    f = i.left;
  for (let m = 1; m < s.length; m++) {
    const p = mn(t, s[m], o);
    (d = te(p.top, d)), (c = Se(p.right, c)), (u = Se(p.bottom, u)), (f = te(p.left, f));
  }
  return { width: c - f, height: u - d, x: f, y: d };
}
function sc(e) {
  const { width: t, height: r } = Ho(e);
  return { width: t, height: r };
}
function ic(e, t, r) {
  const n = ye(t),
    o = me(t),
    a = r === 'fixed',
    s = $e(e, !0, a, t);
  let i = { scrollLeft: 0, scrollTop: 0 };
  const d = fe(0);
  function c() {
    d.x = jt(o);
  }
  if (n || (!n && !a))
    if (((et(t) !== 'body' || it(o)) && (i = Mt(t)), n)) {
      const p = $e(t, !0, a, t);
      (d.x = p.x + t.clientLeft), (d.y = p.y + t.clientTop);
    } else o && c();
  a && !n && o && c();
  const u = o && !n && !a ? Go(o, i) : fe(0),
    f = s.left + i.scrollLeft - d.x - u.x,
    m = s.top + i.scrollTop - d.y - u.y;
  return { x: f, y: m, width: s.width, height: s.height };
}
function qt(e) {
  return ae(e).position === 'static';
}
function pn(e, t) {
  if (!ye(e) || ae(e).position === 'fixed') return null;
  if (t) return t(e);
  let r = e.offsetParent;
  return me(e) === r && (r = r.ownerDocument.body), r;
}
function qo(e, t) {
  const r = re(e);
  if (It(e)) return r;
  if (!ye(e)) {
    let o = Re(e);
    while (o && !Ze(o)) {
      if (oe(o) && !qt(o)) return o;
      o = Re(o);
    }
    return r;
  }
  let n = pn(e, t);
  while (n && Yl(n) && qt(n)) n = pn(n, t);
  return n && Ze(n) && qt(n) && !Nr(n) ? r : n || Kl(e) || r;
}
const lc = async function (e) {
  const t = this.getOffsetParent || qo,
    r = this.getDimensions,
    n = await r(e.floating);
  return {
    reference: ic(e.reference, await t(e.floating), e.strategy),
    floating: { x: 0, y: 0, width: n.width, height: n.height },
  };
};
function cc(e) {
  return ae(e).direction === 'rtl';
}
const dc = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Jl,
  getDocumentElement: me,
  getClippingRect: ac,
  getOffsetParent: qo,
  getElementRects: lc,
  getClientRects: ec,
  getDimensions: sc,
  getScale: Xe,
  isElement: oe,
  isRTL: cc,
};
function Xo(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function uc(e, t) {
  let r = null,
    n;
  const o = me(e);
  function a() {
    var i;
    clearTimeout(n), (i = r) == null || i.disconnect(), (r = null);
  }
  function s(i, d) {
    i === void 0 && (i = !1), d === void 0 && (d = 1), a();
    const c = e.getBoundingClientRect(),
      { left: u, top: f, width: m, height: p } = c;
    if ((i || t(), !m || !p)) return;
    const v = bt(f),
      g = bt(o.clientWidth - (u + m)),
      b = bt(o.clientHeight - (f + p)),
      y = bt(u),
      A = {
        rootMargin: -v + 'px ' + -g + 'px ' + -b + 'px ' + -y + 'px',
        threshold: te(0, Se(1, d)) || 1,
      };
    let C = !0;
    function R(E) {
      const S = E[0].intersectionRatio;
      if (S !== d) {
        if (!C) return s();
        S
          ? s(!1, S)
          : (n = setTimeout(() => {
              s(!1, 1e-7);
            }, 1e3));
      }
      S === 1 && !Xo(c, e.getBoundingClientRect()) && s(), (C = !1);
    }
    try {
      r = new IntersectionObserver(R, { ...A, root: o.ownerDocument });
    } catch {
      r = new IntersectionObserver(R, A);
    }
    r.observe(e);
  }
  return s(!0), a;
}
function fc(e, t, r, n) {
  n === void 0 && (n = {});
  const {
      ancestorScroll: o = !0,
      ancestorResize: a = !0,
      elementResize: s = typeof ResizeObserver == 'function',
      layoutShift: i = typeof IntersectionObserver == 'function',
      animationFrame: d = !1,
    } = n,
    c = _r(e),
    u = o || a ? [...(c ? at(c) : []), ...(t ? at(t) : [])] : [];
  u.forEach((y) => {
    o && y.addEventListener('scroll', r, { passive: !0 }), a && y.addEventListener('resize', r);
  });
  const f = c && i ? uc(c, r) : null;
  let m = -1,
    p = null;
  s &&
    ((p = new ResizeObserver((y) => {
      const [w] = y;
      w &&
        w.target === c &&
        p &&
        t &&
        (p.unobserve(t),
        cancelAnimationFrame(m),
        (m = requestAnimationFrame(() => {
          var A;
          (A = p) == null || A.observe(t);
        }))),
        r();
    })),
    c && !d && p.observe(c),
    t && p.observe(t));
  let v,
    g = d ? $e(e) : null;
  d && b();
  function b() {
    const y = $e(e);
    g && !Xo(g, y) && r(), (g = y), (v = requestAnimationFrame(b));
  }
  return (
    r(),
    () => {
      var y;
      u.forEach((w) => {
        o && w.removeEventListener('scroll', r), a && w.removeEventListener('resize', r);
      }),
        f == null || f(),
        (y = p) == null || y.disconnect(),
        (p = null),
        d && cancelAnimationFrame(v);
    }
  );
}
const mc = Vl,
  pc = Hl,
  gc = Fl,
  hc = Gl,
  vc = Wl,
  gn = zl,
  bc = Ul,
  yc = (e, t, r) => {
    const n = new Map(),
      o = { platform: dc, ...r },
      a = { ...o.platform, _c: n };
    return $l(e, t, { ...o, platform: a });
  };
var xc = typeof document < 'u',
  wc = () => {},
  wt = xc ? l.useLayoutEffect : wc;
function Rt(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (typeof e == 'function' && e.toString() === t.toString()) return !0;
  let r, n, o;
  if (e && t && typeof e == 'object') {
    if (Array.isArray(e)) {
      if (((r = e.length), r !== t.length)) return !1;
      for (n = r; n-- !== 0; ) if (!Rt(e[n], t[n])) return !1;
      return !0;
    }
    if (((o = Object.keys(e)), (r = o.length), r !== Object.keys(t).length)) return !1;
    for (n = r; n-- !== 0; ) if (!{}.hasOwnProperty.call(t, o[n])) return !1;
    for (n = r; n-- !== 0; ) {
      const a = o[n];
      if (!(a === '_owner' && e.$$typeof) && !Rt(e[a], t[a])) return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Ko(e) {
  return typeof window > 'u' ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function hn(e, t) {
  const r = Ko(e);
  return Math.round(t * r) / r;
}
function Xt(e) {
  const t = l.useRef(e);
  return (
    wt(() => {
      t.current = e;
    }),
    t
  );
}
function Cc(e) {
  e === void 0 && (e = {});
  const {
      placement: t = 'bottom',
      strategy: r = 'absolute',
      middleware: n = [],
      platform: o,
      elements: { reference: a, floating: s } = {},
      transform: i = !0,
      whileElementsMounted: d,
      open: c,
    } = e,
    [u, f] = l.useState({
      x: 0,
      y: 0,
      strategy: r,
      placement: t,
      middlewareData: {},
      isPositioned: !1,
    }),
    [m, p] = l.useState(n);
  Rt(m, n) || p(n);
  const [v, g] = l.useState(null),
    [b, y] = l.useState(null),
    w = l.useCallback((I) => {
      I !== E.current && ((E.current = I), g(I));
    }, []),
    A = l.useCallback((I) => {
      I !== S.current && ((S.current = I), y(I));
    }, []),
    C = a || v,
    R = s || b,
    E = l.useRef(null),
    S = l.useRef(null),
    k = l.useRef(u),
    j = d != null,
    W = Xt(d),
    U = Xt(o),
    G = Xt(c),
    q = l.useCallback(() => {
      if (!E.current || !S.current) return;
      const I = { placement: t, strategy: r, middleware: m };
      U.current && (I.platform = U.current),
        yc(E.current, S.current, I).then((X) => {
          const O = { ...X, isPositioned: G.current !== !1 };
          F.current &&
            !Rt(k.current, O) &&
            ((k.current = O),
            wn.flushSync(() => {
              f(O);
            }));
        });
    }, [m, t, r, U, G]);
  wt(() => {
    c === !1 &&
      k.current.isPositioned &&
      ((k.current.isPositioned = !1), f((I) => ({ ...I, isPositioned: !1 })));
  }, [c]);
  const F = l.useRef(!1);
  wt(
    () => (
      (F.current = !0),
      () => {
        F.current = !1;
      }
    ),
    [],
  ),
    wt(() => {
      if ((C && (E.current = C), R && (S.current = R), C && R)) {
        if (W.current) return W.current(C, R, q);
        q();
      }
    }, [C, R, q, W, j]);
  const Y = l.useMemo(
      () => ({ reference: E, floating: S, setReference: w, setFloating: A }),
      [w, A],
    ),
    z = l.useMemo(() => ({ reference: C, floating: R }), [C, R]),
    B = l.useMemo(() => {
      const I = { position: r, left: 0, top: 0 };
      if (!z.floating) return I;
      const X = hn(z.floating, u.x),
        O = hn(z.floating, u.y);
      return i
        ? {
            ...I,
            transform: 'translate(' + X + 'px, ' + O + 'px)',
            ...(Ko(z.floating) >= 1.5 && { willChange: 'transform' }),
          }
        : { position: r, left: X, top: O };
    }, [r, i, z.floating, u.x, u.y]);
  return l.useMemo(
    () => ({ ...u, update: q, refs: Y, elements: z, floatingStyles: B }),
    [u, q, Y, z, B],
  );
}
const kc = (e) => {
    function t(r) {
      return {}.hasOwnProperty.call(r, 'current');
    }
    return {
      name: 'arrow',
      options: e,
      fn(r) {
        const { element: n, padding: o } = typeof e == 'function' ? e(r) : e;
        return n && t(n)
          ? n.current != null
            ? gn({ element: n.current, padding: o }).fn(r)
            : {}
          : n
            ? gn({ element: n, padding: o }).fn(r)
            : {};
      },
    };
  },
  Ec = (e, t) => {
    const r = mc(e);
    return { name: r.name, fn: r.fn, options: [e, t] };
  },
  Ac = (e, t) => {
    const r = pc(e);
    return { name: r.name, fn: r.fn, options: [e, t] };
  },
  Sc = (e, t) => ({ fn: bc(e).fn, options: [e, t] }),
  Rc = (e, t) => {
    const r = gc(e);
    return { name: r.name, fn: r.fn, options: [e, t] };
  },
  Pc = (e, t) => {
    const r = hc(e);
    return { name: r.name, fn: r.fn, options: [e, t] };
  },
  Nc = (e, t) => {
    const r = vc(e);
    return { name: r.name, fn: r.fn, options: [e, t] };
  },
  Oc = (e, t) => {
    const r = kc(e);
    return { name: r.name, fn: r.fn, options: [e, t] };
  };
var _c = 'Arrow',
  Zo = l.forwardRef((e, t) => {
    const { children: r, width: n = 10, height: o = 5, ...a } = e;
    return h.jsx(Q.svg, {
      ...a,
      ref: t,
      width: n,
      height: o,
      viewBox: '0 0 30 10',
      preserveAspectRatio: 'none',
      children: e.asChild ? r : h.jsx('polygon', { points: '0,0 30,0 15,10' }),
    });
  });
Zo.displayName = _c;
var Dc = Zo,
  Dr = 'Popper',
  [Qo, Jo] = st(Dr),
  [Tc, ea] = Qo(Dr),
  ta = (e) => {
    const { __scopePopper: t, children: r } = e,
      [n, o] = l.useState(null);
    return h.jsx(Tc, { scope: t, anchor: n, onAnchorChange: o, children: r });
  };
ta.displayName = Dr;
var ra = 'PopperAnchor',
  na = l.forwardRef((e, t) => {
    const { __scopePopper: r, virtualRef: n, ...o } = e,
      a = ea(ra, r),
      s = l.useRef(null),
      i = ee(t, s),
      d = l.useRef(null);
    return (
      l.useEffect(() => {
        const c = d.current;
        (d.current = (n == null ? void 0 : n.current) || s.current),
          c !== d.current && a.onAnchorChange(d.current);
      }),
      n ? null : h.jsx(Q.div, { ...o, ref: i })
    );
  });
na.displayName = ra;
var Tr = 'PopperContent',
  [Ic, Mc] = Qo(Tr),
  oa = l.forwardRef((e, t) => {
    var V, K, $, le, De, Te;
    const {
        __scopePopper: r,
        side: n = 'bottom',
        sideOffset: o = 0,
        align: a = 'center',
        alignOffset: s = 0,
        arrowPadding: i = 0,
        avoidCollisions: d = !0,
        collisionBoundary: c = [],
        collisionPadding: u = 0,
        sticky: f = 'partial',
        hideWhenDetached: m = !1,
        updatePositionStrategy: p = 'optimized',
        onPlaced: v,
        ...g
      } = e,
      b = ea(Tr, r),
      [y, w] = l.useState(null),
      A = ee(t, (pe) => w(pe)),
      [C, R] = l.useState(null),
      E = _o(C),
      S = (E == null ? void 0 : E.width) ?? 0,
      k = (E == null ? void 0 : E.height) ?? 0,
      j = n + (a !== 'center' ? '-' + a : ''),
      W = typeof u == 'number' ? u : { top: 0, right: 0, bottom: 0, left: 0, ...u },
      U = Array.isArray(c) ? c : [c],
      G = U.length > 0,
      q = { padding: W, boundary: U.filter(Lc), altBoundary: G },
      {
        refs: F,
        floatingStyles: Y,
        placement: z,
        isPositioned: B,
        middlewareData: I,
      } = Cc({
        strategy: 'fixed',
        placement: j,
        whileElementsMounted: (...pe) => fc(...pe, { animationFrame: p === 'always' }),
        elements: { reference: b.anchor },
        middleware: [
          Ec({ mainAxis: o + k, alignmentAxis: s }),
          d && Ac({ mainAxis: !0, crossAxis: !1, limiter: f === 'partial' ? Sc() : void 0, ...q }),
          d && Rc({ ...q }),
          Pc({
            ...q,
            apply: ({ elements: pe, rects: Ie, availableWidth: Ia, availableHeight: Ma }) => {
              const { width: ja, height: La } = Ie.reference,
                dt = pe.floating.style;
              dt.setProperty('--radix-popper-available-width', `${Ia}px`),
                dt.setProperty('--radix-popper-available-height', `${Ma}px`),
                dt.setProperty('--radix-popper-anchor-width', `${ja}px`),
                dt.setProperty('--radix-popper-anchor-height', `${La}px`);
            },
          }),
          C && Oc({ element: C, padding: i }),
          $c({ arrowWidth: S, arrowHeight: k }),
          m && Nc({ strategy: 'referenceHidden', ...q }),
        ],
      }),
      [X, O] = ia(z),
      ie = Ke(v);
    Ae(() => {
      B && (ie == null || ie());
    }, [B, ie]);
    const x = (V = I.arrow) == null ? void 0 : V.x,
      D = (K = I.arrow) == null ? void 0 : K.y,
      L = (($ = I.arrow) == null ? void 0 : $.centerOffset) !== 0,
      [P, T] = l.useState();
    return (
      Ae(() => {
        y && T(window.getComputedStyle(y).zIndex);
      }, [y]),
      h.jsx('div', {
        ref: F.setFloating,
        'data-radix-popper-content-wrapper': '',
        style: {
          ...Y,
          transform: B ? Y.transform : 'translate(0, -200%)',
          minWidth: 'max-content',
          zIndex: P,
          '--radix-popper-transform-origin': [
            (le = I.transformOrigin) == null ? void 0 : le.x,
            (De = I.transformOrigin) == null ? void 0 : De.y,
          ].join(' '),
          ...(((Te = I.hide) == null ? void 0 : Te.referenceHidden) && {
            visibility: 'hidden',
            pointerEvents: 'none',
          }),
        },
        dir: e.dir,
        children: h.jsx(Ic, {
          scope: r,
          placedSide: X,
          onArrowChange: R,
          arrowX: x,
          arrowY: D,
          shouldHideArrow: L,
          children: h.jsx(Q.div, {
            'data-side': X,
            'data-align': O,
            ...g,
            ref: A,
            style: { ...g.style, animation: B ? void 0 : 'none' },
          }),
        }),
      })
    );
  });
oa.displayName = Tr;
var aa = 'PopperArrow',
  jc = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
  sa = l.forwardRef((t, r) => {
    const { __scopePopper: n, ...o } = t,
      a = Mc(aa, n),
      s = jc[a.placedSide];
    return h.jsx('span', {
      ref: a.onArrowChange,
      style: {
        position: 'absolute',
        left: a.arrowX,
        top: a.arrowY,
        [s]: 0,
        transformOrigin: { top: '', right: '0 0', bottom: 'center 0', left: '100% 0' }[
          a.placedSide
        ],
        transform: {
          top: 'translateY(100%)',
          right: 'translateY(50%) rotate(90deg) translateX(-50%)',
          bottom: 'rotate(180deg)',
          left: 'translateY(50%) rotate(-90deg) translateX(50%)',
        }[a.placedSide],
        visibility: a.shouldHideArrow ? 'hidden' : void 0,
      },
      children: h.jsx(Dc, { ...o, ref: r, style: { ...o.style, display: 'block' } }),
    });
  });
sa.displayName = aa;
function Lc(e) {
  return e !== null;
}
var $c = (e) => ({
  name: 'transformOrigin',
  options: e,
  fn(t) {
    var b, y, w;
    const { placement: r, rects: n, middlewareData: o } = t,
      s = ((b = o.arrow) == null ? void 0 : b.centerOffset) !== 0,
      i = s ? 0 : e.arrowWidth,
      d = s ? 0 : e.arrowHeight,
      [c, u] = ia(r),
      f = { start: '0%', center: '50%', end: '100%' }[u],
      m = (((y = o.arrow) == null ? void 0 : y.x) ?? 0) + i / 2,
      p = (((w = o.arrow) == null ? void 0 : w.y) ?? 0) + d / 2;
    let v = '',
      g = '';
    return (
      c === 'bottom'
        ? ((v = s ? f : `${m}px`), (g = `${-d}px`))
        : c === 'top'
          ? ((v = s ? f : `${m}px`), (g = `${n.floating.height + d}px`))
          : c === 'right'
            ? ((v = `${-d}px`), (g = s ? f : `${p}px`))
            : c === 'left' && ((v = `${n.floating.width + d}px`), (g = s ? f : `${p}px`)),
      { data: { x: v, y: g } }
    );
  },
});
function ia(e) {
  const [t, r = 'center'] = e.split('-');
  return [t, r];
}
var zc = ta,
  la = na,
  Fc = oa,
  Wc = sa,
  Bc = 'Label',
  ca = l.forwardRef((e, t) =>
    h.jsx(Q.label, {
      ...e,
      ref: t,
      onMouseDown: (r) => {
        var o;
        r.target.closest('button, input, select, textarea') ||
          ((o = e.onMouseDown) == null || o.call(e, r),
          !r.defaultPrevented && r.detail > 1 && r.preventDefault());
      },
    }),
  );
ca.displayName = Bc;
var Vc = ca,
  Lt = 'Popover',
  [da] = st(Lt, [Jo]),
  lt = Jo(),
  [Hc, Oe] = da(Lt),
  ua = (e) => {
    const {
        __scopePopover: t,
        children: r,
        open: n,
        defaultOpen: o,
        onOpenChange: a,
        modal: s = !1,
      } = e,
      i = lt(t),
      d = l.useRef(null),
      [c, u] = l.useState(!1),
      [f, m] = fr({ prop: n, defaultProp: o ?? !1, onChange: a, caller: Lt });
    return h.jsx(zc, {
      ...i,
      children: h.jsx(Hc, {
        scope: t,
        contentId: ue(),
        triggerRef: d,
        open: f,
        onOpenChange: m,
        onOpenToggle: l.useCallback(() => m((p) => !p), [m]),
        hasCustomAnchor: c,
        onCustomAnchorAdd: l.useCallback(() => u(!0), []),
        onCustomAnchorRemove: l.useCallback(() => u(!1), []),
        modal: s,
        children: r,
      }),
    });
  };
ua.displayName = Lt;
var fa = 'PopoverAnchor',
  Uc = l.forwardRef((e, t) => {
    const { __scopePopover: r, ...n } = e,
      o = Oe(fa, r),
      a = lt(r),
      { onCustomAnchorAdd: s, onCustomAnchorRemove: i } = o;
    return l.useEffect(() => (s(), () => i()), [s, i]), h.jsx(la, { ...a, ...n, ref: t });
  });
Uc.displayName = fa;
var ma = 'PopoverTrigger',
  pa = l.forwardRef((e, t) => {
    const { __scopePopover: r, ...n } = e,
      o = Oe(ma, r),
      a = lt(r),
      s = ee(t, o.triggerRef),
      i = h.jsx(Q.button, {
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': o.open,
        'aria-controls': o.contentId,
        'data-state': ya(o.open),
        ...n,
        ref: s,
        onClick: J(e.onClick, o.onOpenToggle),
      });
    return o.hasCustomAnchor ? i : h.jsx(la, { asChild: !0, ...a, children: i });
  });
pa.displayName = ma;
var Ir = 'PopoverPortal',
  [Gc, Yc] = da(Ir, { forceMount: void 0 }),
  ga = (e) => {
    const { __scopePopover: t, forceMount: r, children: n, container: o } = e,
      a = Oe(Ir, t);
    return h.jsx(Gc, {
      scope: t,
      forceMount: r,
      children: h.jsx(We, {
        present: r || a.open,
        children: h.jsx(gr, { asChild: !0, container: o, children: n }),
      }),
    });
  };
ga.displayName = Ir;
var Qe = 'PopoverContent',
  ha = l.forwardRef((e, t) => {
    const r = Yc(Qe, e.__scopePopover),
      { forceMount: n = r.forceMount, ...o } = e,
      a = Oe(Qe, e.__scopePopover);
    return h.jsx(We, {
      present: n || a.open,
      children: a.modal ? h.jsx(Xc, { ...o, ref: t }) : h.jsx(Kc, { ...o, ref: t }),
    });
  });
ha.displayName = Qe;
var qc = Nt('PopoverContent.RemoveScroll'),
  Xc = l.forwardRef((e, t) => {
    const r = Oe(Qe, e.__scopePopover),
      n = l.useRef(null),
      o = ee(t, n),
      a = l.useRef(!1);
    return (
      l.useEffect(() => {
        const s = n.current;
        if (s) return Qn(s);
      }, []),
      h.jsx(hr, {
        as: qc,
        allowPinchZoom: !0,
        children: h.jsx(va, {
          ...e,
          ref: o,
          trapFocus: r.open,
          disableOutsidePointerEvents: !0,
          onCloseAutoFocus: J(e.onCloseAutoFocus, (s) => {
            var i;
            s.preventDefault(), a.current || (i = r.triggerRef.current) == null || i.focus();
          }),
          onPointerDownOutside: J(
            e.onPointerDownOutside,
            (s) => {
              const i = s.detail.originalEvent,
                d = i.button === 0 && i.ctrlKey === !0,
                c = i.button === 2 || d;
              a.current = c;
            },
            { checkForDefaultPrevented: !1 },
          ),
          onFocusOutside: J(e.onFocusOutside, (s) => s.preventDefault(), {
            checkForDefaultPrevented: !1,
          }),
        }),
      })
    );
  }),
  Kc = l.forwardRef((e, t) => {
    const r = Oe(Qe, e.__scopePopover),
      n = l.useRef(!1),
      o = l.useRef(!1);
    return h.jsx(va, {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      onCloseAutoFocus: (a) => {
        var s, i;
        (s = e.onCloseAutoFocus) == null || s.call(e, a),
          a.defaultPrevented ||
            (n.current || (i = r.triggerRef.current) == null || i.focus(), a.preventDefault()),
          (n.current = !1),
          (o.current = !1);
      },
      onInteractOutside: (a) => {
        var d, c;
        (d = e.onInteractOutside) == null || d.call(e, a),
          a.defaultPrevented ||
            ((n.current = !0), a.detail.originalEvent.type === 'pointerdown' && (o.current = !0));
        const s = a.target;
        ((c = r.triggerRef.current) == null ? void 0 : c.contains(s)) && a.preventDefault(),
          a.detail.originalEvent.type === 'focusin' && o.current && a.preventDefault();
      },
    });
  }),
  va = l.forwardRef((e, t) => {
    const {
        __scopePopover: r,
        trapFocus: n,
        onOpenAutoFocus: o,
        onCloseAutoFocus: a,
        disableOutsidePointerEvents: s,
        onEscapeKeyDown: i,
        onPointerDownOutside: d,
        onFocusOutside: c,
        onInteractOutside: u,
        ...f
      } = e,
      m = Oe(Qe, r),
      p = lt(r);
    return (
      Vn(),
      h.jsx(pr, {
        asChild: !0,
        loop: !0,
        trapped: n,
        onMountAutoFocus: o,
        onUnmountAutoFocus: a,
        children: h.jsx(mr, {
          asChild: !0,
          disableOutsidePointerEvents: s,
          onInteractOutside: u,
          onEscapeKeyDown: i,
          onPointerDownOutside: d,
          onFocusOutside: c,
          onDismiss: () => m.onOpenChange(!1),
          children: h.jsx(Fc, {
            'data-state': ya(m.open),
            role: 'dialog',
            id: m.contentId,
            ...p,
            ...f,
            ref: t,
            style: {
              ...f.style,
              '--radix-popover-content-transform-origin': 'var(--radix-popper-transform-origin)',
              '--radix-popover-content-available-width': 'var(--radix-popper-available-width)',
              '--radix-popover-content-available-height': 'var(--radix-popper-available-height)',
              '--radix-popover-trigger-width': 'var(--radix-popper-anchor-width)',
              '--radix-popover-trigger-height': 'var(--radix-popper-anchor-height)',
            },
          }),
        }),
      })
    );
  }),
  ba = 'PopoverClose',
  Zc = l.forwardRef((e, t) => {
    const { __scopePopover: r, ...n } = e,
      o = Oe(ba, r);
    return h.jsx(Q.button, {
      type: 'button',
      ...n,
      ref: t,
      onClick: J(e.onClick, () => o.onOpenChange(!1)),
    });
  });
Zc.displayName = ba;
var Qc = 'PopoverArrow',
  Jc = l.forwardRef((e, t) => {
    const { __scopePopover: r, ...n } = e,
      o = lt(r);
    return h.jsx(Wc, { ...o, ...n, ref: t });
  });
Jc.displayName = Qc;
function ya(e) {
  return e ? 'open' : 'closed';
}
var ed = ua,
  td = pa,
  rd = ga,
  nd = ha;
const od = $n(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
function Mr({ className: e, variant: t = 'default', size: r = 'default', asChild: n = !1, ...o }) {
  const a = n ? Ps : 'button';
  return h.jsx(a, {
    'data-slot': 'button',
    'data-variant': t,
    'data-size': r,
    className: H(od({ variant: t, size: r, className: e })),
    ...o,
  });
}
Mr.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'Button',
  props: {
    asChild: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '',
      defaultValue: { value: 'false', computed: !1 },
    },
    variant: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
    size: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
  },
};
function ad({ className: e, type: t, ...r }) {
  return h.jsx('input', {
    type: t,
    'data-slot': 'input',
    className: H(
      'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
      'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
      'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
      e,
    ),
    ...r,
  });
}
ad.__docgenInfo = { description: '', methods: [], displayName: 'Input' };
function sd({ className: e, ...t }) {
  return h.jsx(Vc, {
    'data-slot': 'label',
    className: H(
      'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      e,
    ),
    ...t,
  });
}
sd.__docgenInfo = { description: '', methods: [], displayName: 'Label' }; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const xa = (...e) =>
  e
    .filter((t, r, n) => !!t && t.trim() !== '' && n.indexOf(t) === r)
    .join(' ')
    .trim(); /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const id = (e) => e.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ld = (e) =>
  e.replace(/^([A-Z])|[\s-_]+(\w)/g, (t, r, n) => (n ? n.toUpperCase() : r.toLowerCase())); /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const vn = (e) => {
  const t = ld(e);
  return t.charAt(0).toUpperCase() + t.slice(1);
}; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var Kt = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const cd = (e) => {
    for (const t in e) if (t.startsWith('aria-') || t === 'role' || t === 'title') return !0;
    return !1;
  },
  dd = l.createContext({}),
  ud = () => l.useContext(dd),
  fd = l.forwardRef(
    (
      {
        color: e,
        size: t,
        strokeWidth: r,
        absoluteStrokeWidth: n,
        className: o = '',
        children: a,
        iconNode: s,
        ...i
      },
      d,
    ) => {
      const {
          size: c = 24,
          strokeWidth: u = 2,
          absoluteStrokeWidth: f = !1,
          color: m = 'currentColor',
          className: p = '',
        } = ud() ?? {},
        v = (n ?? f) ? (Number(r ?? u) * 24) / Number(t ?? c) : (r ?? u);
      return l.createElement(
        'svg',
        {
          ref: d,
          ...Kt,
          width: t ?? c ?? Kt.width,
          height: t ?? c ?? Kt.height,
          stroke: e ?? m,
          strokeWidth: v,
          className: xa('lucide', p, o),
          ...(!a && !cd(i) && { 'aria-hidden': 'true' }),
          ...i,
        },
        [...s.map(([g, b]) => l.createElement(g, b)), ...(Array.isArray(a) ? a : [a])],
      );
    },
  ); /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const jr = (e, t) => {
  const r = l.forwardRef(({ className: n, ...o }, a) =>
    l.createElement(fd, {
      ref: a,
      iconNode: t,
      className: xa(`lucide-${id(vn(e))}`, `lucide-${e}`, n),
      ...o,
    }),
  );
  return (r.displayName = vn(e)), r;
}; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const md = [['path', { d: 'M20 6 9 17l-5-5', key: '1gmf2c' }]],
  pd = jr('check', md); /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const gd = [
    ['path', { d: 'm21 21-4.34-4.34', key: '14j7rj' }],
    ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
  ],
  hd = jr('search', gd); /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const vd = [
    ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
    ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
  ],
  bd = jr('x', vd);
function yd({ className: e, ...t }) {
  return h.jsx(Io, {
    'data-slot': 'checkbox',
    className: H(
      'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
      e,
    ),
    ...t,
    children: h.jsx(jo, {
      'data-slot': 'checkbox-indicator',
      className: 'grid place-content-center text-current transition-none',
      children: h.jsx(pd, { className: 'size-3.5' }),
    }),
  });
}
yd.__docgenInfo = { description: '', methods: [], displayName: 'Checkbox' };
var bn = 1,
  xd = 0.9,
  wd = 0.8,
  Cd = 0.17,
  Zt = 0.1,
  Qt = 0.999,
  kd = 0.9999,
  Ed = 0.99,
  Ad = /[\\\/_+.#"@\[\(\{&]/,
  Sd = /[\\\/_+.#"@\[\(\{&]/g,
  Rd = /[\s-]/,
  wa = /[\s-]/g;
function sr(e, t, r, n, o, a, s) {
  if (a === t.length) return o === e.length ? bn : Ed;
  var i = `${o},${a}`;
  if (s[i] !== void 0) return s[i];
  for (var d = n.charAt(a), c = r.indexOf(d, o), u = 0, f, m, p, v; c >= 0; )
    (f = sr(e, t, r, n, c + 1, a + 1, s)),
      f > u &&
        (c === o
          ? (f *= bn)
          : Ad.test(e.charAt(c - 1))
            ? ((f *= wd),
              (p = e.slice(o, c - 1).match(Sd)),
              p && o > 0 && (f *= Math.pow(Qt, p.length)))
            : Rd.test(e.charAt(c - 1))
              ? ((f *= xd),
                (v = e.slice(o, c - 1).match(wa)),
                v && o > 0 && (f *= Math.pow(Qt, v.length)))
              : ((f *= Cd), o > 0 && (f *= Math.pow(Qt, c - o))),
        e.charAt(c) !== t.charAt(a) && (f *= kd)),
      ((f < Zt && r.charAt(c - 1) === n.charAt(a + 1)) ||
        (n.charAt(a + 1) === n.charAt(a) && r.charAt(c - 1) !== n.charAt(a))) &&
        ((m = sr(e, t, r, n, c + 1, a + 2, s)), m * Zt > f && (f = m * Zt)),
      f > u && (u = f),
      (c = r.indexOf(d, c + 1));
  return (s[i] = u), u;
}
function yn(e) {
  return e.toLowerCase().replace(wa, ' ');
}
function Pd(e, t, r) {
  return (e = r && r.length > 0 ? `${e + ' ' + r.join(' ')}` : e), sr(e, t, yn(e), yn(t), 0, 0, {});
}
var Nd = Symbol.for('react.lazy'),
  Pt = cr[' use '.trim().toString()];
function Od(e) {
  return typeof e == 'object' && e !== null && 'then' in e;
}
function Ca(e) {
  return (
    e != null &&
    typeof e == 'object' &&
    '$$typeof' in e &&
    e.$$typeof === Nd &&
    '_payload' in e &&
    Od(e._payload)
  );
}
function _d(e) {
  const t = Dd(e),
    r = l.forwardRef((n, o) => {
      let { children: a, ...s } = n;
      Ca(a) && typeof Pt == 'function' && (a = Pt(a._payload));
      const i = l.Children.toArray(a),
        d = i.find(Id);
      if (d) {
        const c = d.props.children,
          u = i.map((f) =>
            f === d
              ? l.Children.count(c) > 1
                ? l.Children.only(null)
                : l.isValidElement(c)
                  ? c.props.children
                  : null
              : f,
          );
        return h.jsx(t, {
          ...s,
          ref: o,
          children: l.isValidElement(c) ? l.cloneElement(c, void 0, u) : null,
        });
      }
      return h.jsx(t, { ...s, ref: o, children: a });
    });
  return (r.displayName = `${e}.Slot`), r;
}
function Dd(e) {
  const t = l.forwardRef((r, n) => {
    let { children: o, ...a } = r;
    if ((Ca(o) && typeof Pt == 'function' && (o = Pt(o._payload)), l.isValidElement(o))) {
      const s = jd(o),
        i = Md(a, o.props);
      return o.type !== l.Fragment && (i.ref = n ? Ee(n, s) : s), l.cloneElement(o, i);
    }
    return l.Children.count(o) > 1 ? l.Children.only(null) : null;
  });
  return (t.displayName = `${e}.SlotClone`), t;
}
var Td = Symbol('radix.slottable');
function Id(e) {
  return (
    l.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === Td
  );
}
function Md(e, t) {
  const r = { ...t };
  for (const n in t) {
    const o = e[n],
      a = t[n];
    /^on[A-Z]/.test(n)
      ? o && a
        ? (r[n] = (...i) => {
            const d = a(...i);
            return o(...i), d;
          })
        : o && (r[n] = o)
      : n === 'style'
        ? (r[n] = { ...o, ...a })
        : n === 'className' && (r[n] = [o, a].filter(Boolean).join(' '));
  }
  return { ...e, ...r };
}
function jd(e) {
  var n, o;
  let t = (n = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : n.get,
    r = t && 'isReactWarning' in t && t.isReactWarning;
  return r
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : o.get),
      (r = t && 'isReactWarning' in t && t.isReactWarning),
      r ? e.props.ref : e.props.ref || e.ref);
}
var Ld = [
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
  _e = Ld.reduce((e, t) => {
    const r = _d(`Primitive.${t}`),
      n = l.forwardRef((o, a) => {
        const { asChild: s, ...i } = o,
          d = s ? r : t;
        return (
          typeof window < 'u' && (window[Symbol.for('radix-ui')] = !0), h.jsx(d, { ...i, ref: a })
        );
      });
    return (n.displayName = `Primitive.${t}`), { ...e, [t]: n };
  }, {}),
  ot = '[cmdk-group=""]',
  Jt = '[cmdk-group-items=""]',
  $d = '[cmdk-group-heading=""]',
  ka = '[cmdk-item=""]',
  xn = `${ka}:not([aria-disabled="true"])`,
  ir = 'cmdk-item-select',
  Ue = 'data-value',
  zd = (e, t, r) => Pd(e, t, r),
  Ea = l.createContext(void 0),
  ct = () => l.useContext(Ea),
  Aa = l.createContext(void 0),
  Lr = () => l.useContext(Aa),
  Sa = l.createContext(void 0),
  Ra = l.forwardRef((e, t) => {
    const r = Ge(() => {
        var x, D;
        return {
          search: '',
          value: (D = (x = e.value) != null ? x : e.defaultValue) != null ? D : '',
          selectedItemId: void 0,
          filtered: { count: 0, items: new Map(), groups: new Set() },
        };
      }),
      n = Ge(() => new Set()),
      o = Ge(() => new Map()),
      a = Ge(() => new Map()),
      s = Ge(() => new Set()),
      i = Pa(e),
      {
        label: d,
        children: c,
        value: u,
        onValueChange: f,
        filter: m,
        shouldFilter: p,
        loop: v,
        disablePointerSelection: g = !1,
        vimBindings: b = !0,
        ...y
      } = e,
      w = ue(),
      A = ue(),
      C = ue(),
      R = l.useRef(null),
      E = Kd();
    ze(() => {
      if (u !== void 0) {
        const x = u.trim();
        (r.current.value = x), S.emit();
      }
    }, [u]),
      ze(() => {
        E(6, q);
      }, []);
    const S = l.useMemo(
        () => ({
          subscribe: (x) => (s.current.add(x), () => s.current.delete(x)),
          snapshot: () => r.current,
          setState: (x, D, L) => {
            var P, T, V, K;
            if (!Object.is(r.current[x], D)) {
              if (((r.current[x] = D), x === 'search')) G(), W(), E(1, U);
              else if (x === 'value') {
                if (
                  document.activeElement.hasAttribute('cmdk-input') ||
                  document.activeElement.hasAttribute('cmdk-root')
                ) {
                  const $ = document.getElementById(C);
                  $ ? $.focus() : (P = document.getElementById(w)) == null || P.focus();
                }
                if (
                  (E(7, () => {
                    var $;
                    (r.current.selectedItemId = ($ = F()) == null ? void 0 : $.id), S.emit();
                  }),
                  L || E(5, q),
                  ((T = i.current) == null ? void 0 : T.value) !== void 0)
                ) {
                  const $ = D ?? '';
                  (K = (V = i.current).onValueChange) == null || K.call(V, $);
                  return;
                }
              }
              S.emit();
            }
          },
          emit: () => {
            s.current.forEach((x) => x());
          },
        }),
        [],
      ),
      k = l.useMemo(
        () => ({
          value: (x, D, L) => {
            var P;
            D !== ((P = a.current.get(x)) == null ? void 0 : P.value) &&
              (a.current.set(x, { value: D, keywords: L }),
              r.current.filtered.items.set(x, j(D, L)),
              E(2, () => {
                W(), S.emit();
              }));
          },
          item: (x, D) => (
            n.current.add(x),
            D && (o.current.has(D) ? o.current.get(D).add(x) : o.current.set(D, new Set([x]))),
            E(3, () => {
              G(), W(), r.current.value || U(), S.emit();
            }),
            () => {
              a.current.delete(x), n.current.delete(x), r.current.filtered.items.delete(x);
              const L = F();
              E(4, () => {
                G(), (L == null ? void 0 : L.getAttribute('id')) === x && U(), S.emit();
              });
            }
          ),
          group: (x) => (
            o.current.has(x) || o.current.set(x, new Set()),
            () => {
              a.current.delete(x), o.current.delete(x);
            }
          ),
          filter: () => i.current.shouldFilter,
          label: d || e['aria-label'],
          getDisablePointerSelection: () => i.current.disablePointerSelection,
          listId: w,
          inputId: C,
          labelId: A,
          listInnerRef: R,
        }),
        [],
      );
    function j(x, D) {
      var L, P;
      const T = (P = (L = i.current) == null ? void 0 : L.filter) != null ? P : zd;
      return x ? T(x, r.current.search, D) : 0;
    }
    function W() {
      if (!r.current.search || i.current.shouldFilter === !1) return;
      const x = r.current.filtered.items,
        D = [];
      r.current.filtered.groups.forEach((P) => {
        let T = o.current.get(P),
          V = 0;
        T.forEach((K) => {
          const $ = x.get(K);
          V = Math.max($, V);
        }),
          D.push([P, V]);
      });
      const L = R.current;
      Y()
        .sort((P, T) => {
          var V, K;
          const $ = P.getAttribute('id'),
            le = T.getAttribute('id');
          return ((V = x.get(le)) != null ? V : 0) - ((K = x.get($)) != null ? K : 0);
        })
        .forEach((P) => {
          const T = P.closest(Jt);
          T
            ? T.appendChild(P.parentElement === T ? P : P.closest(`${Jt} > *`))
            : L.appendChild(P.parentElement === L ? P : P.closest(`${Jt} > *`));
        }),
        D.sort((P, T) => T[1] - P[1]).forEach((P) => {
          var T;
          const V =
            (T = R.current) == null
              ? void 0
              : T.querySelector(`${ot}[${Ue}="${encodeURIComponent(P[0])}"]`);
          V == null || V.parentElement.appendChild(V);
        });
    }
    function U() {
      const x = Y().find((L) => L.getAttribute('aria-disabled') !== 'true'),
        D = x == null ? void 0 : x.getAttribute(Ue);
      S.setState('value', D || void 0);
    }
    function G() {
      var x, D, L, P;
      if (!r.current.search || i.current.shouldFilter === !1) {
        r.current.filtered.count = n.current.size;
        return;
      }
      r.current.filtered.groups = new Set();
      let T = 0;
      for (const V of n.current) {
        const K = (D = (x = a.current.get(V)) == null ? void 0 : x.value) != null ? D : '',
          $ = (P = (L = a.current.get(V)) == null ? void 0 : L.keywords) != null ? P : [],
          le = j(K, $);
        r.current.filtered.items.set(V, le), le > 0 && T++;
      }
      for (const [V, K] of o.current)
        for (const $ of K)
          if (r.current.filtered.items.get($) > 0) {
            r.current.filtered.groups.add(V);
            break;
          }
      r.current.filtered.count = T;
    }
    function q() {
      var x, D, L;
      const P = F();
      P &&
        (((x = P.parentElement) == null ? void 0 : x.firstChild) === P &&
          ((L = (D = P.closest(ot)) == null ? void 0 : D.querySelector($d)) == null ||
            L.scrollIntoView({ block: 'nearest' })),
        P.scrollIntoView({ block: 'nearest' }));
    }
    function F() {
      var x;
      return (x = R.current) == null ? void 0 : x.querySelector(`${ka}[aria-selected="true"]`);
    }
    function Y() {
      var x;
      return Array.from(((x = R.current) == null ? void 0 : x.querySelectorAll(xn)) || []);
    }
    function z(x) {
      const D = Y()[x];
      D && S.setState('value', D.getAttribute(Ue));
    }
    function B(x) {
      var D;
      let L = F(),
        P = Y(),
        T = P.findIndex((K) => K === L),
        V = P[T + x];
      (D = i.current) != null &&
        D.loop &&
        (V = T + x < 0 ? P[P.length - 1] : T + x === P.length ? P[0] : P[T + x]),
        V && S.setState('value', V.getAttribute(Ue));
    }
    function I(x) {
      let D = F(),
        L = D == null ? void 0 : D.closest(ot),
        P;
      while (L && !P)
        (L = x > 0 ? qd(L, ot) : Xd(L, ot)), (P = L == null ? void 0 : L.querySelector(xn));
      P ? S.setState('value', P.getAttribute(Ue)) : B(x);
    }
    const X = () => z(Y().length - 1),
      O = (x) => {
        x.preventDefault(), x.metaKey ? X() : x.altKey ? I(1) : B(1);
      },
      ie = (x) => {
        x.preventDefault(), x.metaKey ? z(0) : x.altKey ? I(-1) : B(-1);
      };
    return l.createElement(
      _e.div,
      {
        ref: t,
        tabIndex: -1,
        ...y,
        'cmdk-root': '',
        onKeyDown: (x) => {
          var D;
          (D = y.onKeyDown) == null || D.call(y, x);
          const L = x.nativeEvent.isComposing || x.keyCode === 229;
          if (!(x.defaultPrevented || L))
            switch (x.key) {
              case 'n':
              case 'j': {
                b && x.ctrlKey && O(x);
                break;
              }
              case 'ArrowDown': {
                O(x);
                break;
              }
              case 'p':
              case 'k': {
                b && x.ctrlKey && ie(x);
                break;
              }
              case 'ArrowUp': {
                ie(x);
                break;
              }
              case 'Home': {
                x.preventDefault(), z(0);
                break;
              }
              case 'End': {
                x.preventDefault(), X();
                break;
              }
              case 'Enter': {
                x.preventDefault();
                const P = F();
                if (P) {
                  const T = new Event(ir);
                  P.dispatchEvent(T);
                }
              }
            }
        },
      },
      l.createElement(
        'label',
        { 'cmdk-label': '', htmlFor: k.inputId, id: k.labelId, style: Qd },
        d,
      ),
      $t(e, (x) =>
        l.createElement(Aa.Provider, { value: S }, l.createElement(Ea.Provider, { value: k }, x)),
      ),
    );
  }),
  Fd = l.forwardRef((e, t) => {
    var r, n;
    const o = ue(),
      a = l.useRef(null),
      s = l.useContext(Sa),
      i = ct(),
      d = Pa(e),
      c =
        (n = (r = d.current) == null ? void 0 : r.forceMount) != null
          ? n
          : s == null
            ? void 0
            : s.forceMount;
    ze(() => {
      if (!c) return i.item(o, s == null ? void 0 : s.id);
    }, [c]);
    const u = Na(o, a, [e.value, e.children, a], e.keywords),
      f = Lr(),
      m = Pe((E) => E.value && E.value === u.current),
      p = Pe((E) => (c || i.filter() === !1 ? !0 : E.search ? E.filtered.items.get(o) > 0 : !0));
    l.useEffect(() => {
      const E = a.current;
      if (!(!E || e.disabled)) return E.addEventListener(ir, v), () => E.removeEventListener(ir, v);
    }, [p, e.onSelect, e.disabled]);
    function v() {
      var E, S;
      g(), (S = (E = d.current).onSelect) == null || S.call(E, u.current);
    }
    function g() {
      f.setState('value', u.current, !0);
    }
    if (!p) return null;
    const { disabled: b, value: y, onSelect: w, forceMount: A, keywords: C, ...R } = e;
    return l.createElement(
      _e.div,
      {
        ref: Ee(a, t),
        ...R,
        id: o,
        'cmdk-item': '',
        role: 'option',
        'aria-disabled': !!b,
        'aria-selected': !!m,
        'data-disabled': !!b,
        'data-selected': !!m,
        onPointerMove: b || i.getDisablePointerSelection() ? void 0 : g,
        onClick: b ? void 0 : v,
      },
      e.children,
    );
  }),
  Wd = l.forwardRef((e, t) => {
    const { heading: r, children: n, forceMount: o, ...a } = e,
      s = ue(),
      i = l.useRef(null),
      d = l.useRef(null),
      c = ue(),
      u = ct(),
      f = Pe((p) => (o || u.filter() === !1 ? !0 : p.search ? p.filtered.groups.has(s) : !0));
    ze(() => u.group(s), []), Na(s, i, [e.value, e.heading, d]);
    const m = l.useMemo(() => ({ id: s, forceMount: o }), [o]);
    return l.createElement(
      _e.div,
      { ref: Ee(i, t), ...a, 'cmdk-group': '', role: 'presentation', hidden: f ? void 0 : !0 },
      r &&
        l.createElement('div', { ref: d, 'cmdk-group-heading': '', 'aria-hidden': !0, id: c }, r),
      $t(e, (p) =>
        l.createElement(
          'div',
          { 'cmdk-group-items': '', role: 'group', 'aria-labelledby': r ? c : void 0 },
          l.createElement(Sa.Provider, { value: m }, p),
        ),
      ),
    );
  }),
  Bd = l.forwardRef((e, t) => {
    const { alwaysRender: r, ...n } = e,
      o = l.useRef(null),
      a = Pe((s) => !s.search);
    return !r && !a
      ? null
      : l.createElement(_e.div, { ref: Ee(o, t), ...n, 'cmdk-separator': '', role: 'separator' });
  }),
  Vd = l.forwardRef((e, t) => {
    const { onValueChange: r, ...n } = e,
      o = e.value != null,
      a = Lr(),
      s = Pe((c) => c.search),
      i = Pe((c) => c.selectedItemId),
      d = ct();
    return (
      l.useEffect(() => {
        e.value != null && a.setState('search', e.value);
      }, [e.value]),
      l.createElement(_e.input, {
        ref: t,
        ...n,
        'cmdk-input': '',
        autoComplete: 'off',
        autoCorrect: 'off',
        spellCheck: !1,
        'aria-autocomplete': 'list',
        role: 'combobox',
        'aria-expanded': !0,
        'aria-controls': d.listId,
        'aria-labelledby': d.labelId,
        'aria-activedescendant': i,
        id: d.inputId,
        type: 'text',
        value: o ? e.value : s,
        onChange: (c) => {
          o || a.setState('search', c.target.value), r == null || r(c.target.value);
        },
      })
    );
  }),
  Hd = l.forwardRef((e, t) => {
    const { children: r, label: n = 'Suggestions', ...o } = e,
      a = l.useRef(null),
      s = l.useRef(null),
      i = Pe((c) => c.selectedItemId),
      d = ct();
    return (
      l.useEffect(() => {
        if (s.current && a.current) {
          let c = s.current,
            u = a.current,
            f,
            m = new ResizeObserver(() => {
              f = requestAnimationFrame(() => {
                const p = c.offsetHeight;
                u.style.setProperty('--cmdk-list-height', p.toFixed(1) + 'px');
              });
            });
          return (
            m.observe(c),
            () => {
              cancelAnimationFrame(f), m.unobserve(c);
            }
          );
        }
      }, []),
      l.createElement(
        _e.div,
        {
          ref: Ee(a, t),
          ...o,
          'cmdk-list': '',
          role: 'listbox',
          tabIndex: -1,
          'aria-activedescendant': i,
          'aria-label': n,
          id: d.listId,
        },
        $t(e, (c) =>
          l.createElement('div', { ref: Ee(s, d.listInnerRef), 'cmdk-list-sizer': '' }, c),
        ),
      )
    );
  }),
  Ud = l.forwardRef((e, t) => {
    const {
      open: r,
      onOpenChange: n,
      overlayClassName: o,
      contentClassName: a,
      container: s,
      ...i
    } = e;
    return l.createElement(
      xr,
      { open: r, onOpenChange: n },
      l.createElement(
        wr,
        { container: s },
        l.createElement(Cr, { 'cmdk-overlay': '', className: o }),
        l.createElement(
          kr,
          { 'aria-label': e.label, 'cmdk-dialog': '', className: a },
          l.createElement(Ra, { ref: t, ...i }),
        ),
      ),
    );
  }),
  Gd = l.forwardRef((e, t) =>
    Pe((r) => r.filtered.count === 0)
      ? l.createElement(_e.div, { ref: t, ...e, 'cmdk-empty': '', role: 'presentation' })
      : null,
  ),
  Yd = l.forwardRef((e, t) => {
    const { progress: r, children: n, label: o = 'Loading...', ...a } = e;
    return l.createElement(
      _e.div,
      {
        ref: t,
        ...a,
        'cmdk-loading': '',
        role: 'progressbar',
        'aria-valuenow': r,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-label': o,
      },
      $t(e, (s) => l.createElement('div', { 'aria-hidden': !0 }, s)),
    );
  }),
  tt = Object.assign(Ra, {
    List: Hd,
    Item: Fd,
    Input: Vd,
    Group: Wd,
    Separator: Bd,
    Dialog: Ud,
    Empty: Gd,
    Loading: Yd,
  });
function qd(e, t) {
  let r = e.nextElementSibling;
  while (r) {
    if (r.matches(t)) return r;
    r = r.nextElementSibling;
  }
}
function Xd(e, t) {
  let r = e.previousElementSibling;
  while (r) {
    if (r.matches(t)) return r;
    r = r.previousElementSibling;
  }
}
function Pa(e) {
  const t = l.useRef(e);
  return (
    ze(() => {
      t.current = e;
    }),
    t
  );
}
var ze = typeof window > 'u' ? l.useEffect : l.useLayoutEffect;
function Ge(e) {
  const t = l.useRef();
  return t.current === void 0 && (t.current = e()), t;
}
function Pe(e) {
  const t = Lr(),
    r = () => e(t.snapshot());
  return l.useSyncExternalStore(t.subscribe, r, r);
}
function Na(e, t, r, n = []) {
  const o = l.useRef(),
    a = ct();
  return (
    ze(() => {
      var s;
      const i = (() => {
          var c;
          for (const u of r) {
            if (typeof u == 'string') return u.trim();
            if (typeof u == 'object' && 'current' in u)
              return u.current
                ? (c = u.current.textContent) == null
                  ? void 0
                  : c.trim()
                : o.current;
          }
        })(),
        d = n.map((c) => c.trim());
      a.value(e, i, d), (s = t.current) == null || s.setAttribute(Ue, i), (o.current = i);
    }),
    o
  );
}
var Kd = () => {
  const [e, t] = l.useState(),
    r = Ge(() => new Map());
  return (
    ze(() => {
      r.current.forEach((n) => n()), (r.current = new Map());
    }, [e]),
    (n, o) => {
      r.current.set(n, o), t({});
    }
  );
};
function Zd(e) {
  const t = e.type;
  return typeof t == 'function' ? t(e.props) : 'render' in t ? t.render(e.props) : e;
}
function $t({ asChild: e, children: t }, r) {
  return e && l.isValidElement(t)
    ? l.cloneElement(Zd(t), { ref: t.ref }, r(t.props.children))
    : r(t);
}
var Qd = {
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
function Jd({ className: e, ...t }) {
  return h.jsx(tt, {
    'data-slot': 'command',
    className: H(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      e,
    ),
    ...t,
  });
}
function eu({ className: e, ...t }) {
  return h.jsxs('div', {
    'data-slot': 'command-input-wrapper',
    className: 'flex h-9 items-center gap-2 border-b px-3',
    children: [
      h.jsx(hd, { className: 'size-4 shrink-0 opacity-50' }),
      h.jsx(tt.Input, {
        'data-slot': 'command-input',
        className: H(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          e,
        ),
        ...t,
      }),
    ],
  });
}
function tu({ className: e, ...t }) {
  return h.jsx(tt.List, {
    'data-slot': 'command-list',
    className: H('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto', e),
    ...t,
  });
}
function ru({ ...e }) {
  return h.jsx(tt.Empty, {
    'data-slot': 'command-empty',
    className: 'py-6 text-center text-sm',
    ...e,
  });
}
function nu({ className: e, ...t }) {
  return h.jsx(tt.Group, {
    'data-slot': 'command-group',
    className: H(
      'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
      e,
    ),
    ...t,
  });
}
function ou({ className: e, ...t }) {
  return h.jsx(tt.Item, {
    'data-slot': 'command-item',
    className: H(
      "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
      e,
    ),
    ...t,
  });
}
Jd.__docgenInfo = { description: '', methods: [], displayName: 'Command' };
eu.__docgenInfo = { description: '', methods: [], displayName: 'CommandInput' };
tu.__docgenInfo = { description: '', methods: [], displayName: 'CommandList' };
ru.__docgenInfo = { description: '', methods: [], displayName: 'CommandEmpty' };
nu.__docgenInfo = { description: '', methods: [], displayName: 'CommandGroup' };
ou.__docgenInfo = { description: '', methods: [], displayName: 'CommandItem' };
function au({ ...e }) {
  return h.jsx(pl, { 'data-slot': 'alert-dialog', ...e });
}
function Oa({ ...e }) {
  return h.jsx(gl, { 'data-slot': 'alert-dialog-portal', ...e });
}
function _a({ className: e, ...t }) {
  return h.jsx(hl, {
    'data-slot': 'alert-dialog-overlay',
    className: H(
      'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      e,
    ),
    ...t,
  });
}
function su({ className: e, size: t = 'default', ...r }) {
  return h.jsxs(Oa, {
    children: [
      h.jsx(_a, {}),
      h.jsx(vl, {
        'data-slot': 'alert-dialog-content',
        'data-size': t,
        className: H(
          'group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg',
          e,
        ),
        ...r,
      }),
    ],
  });
}
function iu({ className: e, ...t }) {
  return h.jsx('div', {
    'data-slot': 'alert-dialog-header',
    className: H(
      'grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
      e,
    ),
    ...t,
  });
}
function lu({ className: e, ...t }) {
  return h.jsx('div', {
    'data-slot': 'alert-dialog-footer',
    className: H(
      'flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
      e,
    ),
    ...t,
  });
}
function cu({ className: e, ...t }) {
  return h.jsx(xl, {
    'data-slot': 'alert-dialog-title',
    className: H(
      'text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
      e,
    ),
    ...t,
  });
}
function du({ className: e, ...t }) {
  return h.jsx(wl, {
    'data-slot': 'alert-dialog-description',
    className: H('text-sm text-muted-foreground', e),
    ...t,
  });
}
function uu({ className: e, variant: t = 'default', size: r = 'default', ...n }) {
  return h.jsx(Mr, {
    variant: t,
    size: r,
    asChild: !0,
    children: h.jsx(bl, { 'data-slot': 'alert-dialog-action', className: H(e), ...n }),
  });
}
function fu({ className: e, variant: t = 'outline', size: r = 'default', ...n }) {
  return h.jsx(Mr, {
    variant: t,
    size: r,
    asChild: !0,
    children: h.jsx(yl, { 'data-slot': 'alert-dialog-cancel', className: H(e), ...n }),
  });
}
au.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialog' };
uu.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'AlertDialogAction',
  props: {
    variant: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
    size: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
  },
};
fu.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'AlertDialogCancel',
  props: {
    variant: { defaultValue: { value: "'outline'", computed: !1 }, required: !1 },
    size: { defaultValue: { value: "'default'", computed: !1 }, required: !1 },
  },
};
su.__docgenInfo = {
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
du.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogDescription' };
lu.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogFooter' };
iu.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogHeader' };
_a.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogOverlay' };
Oa.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogPortal' };
cu.__docgenInfo = { description: '', methods: [], displayName: 'AlertDialogTitle' };
function mu({ ...e }) {
  return h.jsx(xr, { 'data-slot': 'drawer', ...e });
}
function Da({ ...e }) {
  return h.jsx(wr, { 'data-slot': 'drawer-portal', ...e });
}
function Ta({ className: e, ...t }) {
  return h.jsx(Cr, {
    'data-slot': 'drawer-overlay',
    className: H(
      'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      e,
    ),
    ...t,
  });
}
const pu = $n(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: { side: 'right' },
  },
);
function gu({ side: e = 'right', className: t, children: r, closeLabel: n, ...o }) {
  return h.jsxs(Da, {
    children: [
      h.jsx(Ta, {}),
      h.jsxs(kr, {
        'data-slot': 'drawer-content',
        className: H(pu({ side: e }), t),
        ...o,
        children: [
          r,
          h.jsxs(Er, {
            className:
              'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
            children: [
              h.jsx(bd, { className: 'h-4 w-4' }),
              h.jsx('span', { className: 'sr-only', children: n }),
            ],
          }),
        ],
      }),
    ],
  });
}
function hu({ className: e, ...t }) {
  return h.jsx('div', {
    'data-slot': 'drawer-header',
    className: H('flex flex-col space-y-2 text-center sm:text-left', e),
    ...t,
  });
}
function vu({ className: e, ...t }) {
  return h.jsx('div', {
    'data-slot': 'drawer-footer',
    className: H('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', e),
    ...t,
  });
}
function bu({ className: e, ...t }) {
  return h.jsx(vo, {
    'data-slot': 'drawer-title',
    className: H('text-lg font-semibold leading-none tracking-tight', e),
    ...t,
  });
}
function yu({ className: e, ...t }) {
  return h.jsx(bo, {
    'data-slot': 'drawer-description',
    className: H('text-sm text-muted-foreground', e),
    ...t,
  });
}
mu.__docgenInfo = { description: '', methods: [], displayName: 'Drawer' };
Da.__docgenInfo = { description: '', methods: [], displayName: 'DrawerPortal' };
Ta.__docgenInfo = { description: '', methods: [], displayName: 'DrawerOverlay' };
gu.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'DrawerContent',
  props: {
    closeLabel: {
      required: !0,
      tsType: { name: 'string' },
      description: '关闭按钮的 ARIA 标签（L2 不假设默认语言，使用方通过 t() 传入）',
    },
    side: { defaultValue: { value: "'right'", computed: !1 }, required: !1 },
  },
};
hu.__docgenInfo = { description: '', methods: [], displayName: 'DrawerHeader' };
vu.__docgenInfo = { description: '', methods: [], displayName: 'DrawerFooter' };
bu.__docgenInfo = { description: '', methods: [], displayName: 'DrawerTitle' };
yu.__docgenInfo = { description: '', methods: [], displayName: 'DrawerDescription' };
function xu({ ...e }) {
  return h.jsx(ed, { 'data-slot': 'popover', ...e });
}
function wu({ ...e }) {
  return h.jsx(td, { 'data-slot': 'popover-trigger', ...e });
}
function Cu({ className: e, align: t = 'center', sideOffset: r = 4, ...n }) {
  return h.jsx(rd, {
    children: h.jsx(nd, {
      'data-slot': 'popover-content',
      align: t,
      sideOffset: r,
      className: H(
        'z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        e,
      ),
      ...n,
    }),
  });
}
xu.__docgenInfo = { description: '', methods: [], displayName: 'Popover' };
wu.__docgenInfo = { description: '', methods: [], displayName: 'PopoverTrigger' };
Cu.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'PopoverContent',
  props: {
    align: { defaultValue: { value: "'center'", computed: !1 }, required: !1 },
    sideOffset: { defaultValue: { value: '4', computed: !1 }, required: !1 },
  },
};
function ku(e) {
  if (typeof document > 'u') return;
  const t = document.head || document.getElementsByTagName('head')[0],
    r = document.createElement('style');
  (r.type = 'text/css'),
    t.appendChild(r),
    r.styleSheet ? (r.styleSheet.cssText = e) : r.appendChild(document.createTextNode(e));
}
Array(12).fill(0);
let lr = 1;
class Eu {
  constructor() {
    (this.subscribe = (t) => (
      this.subscribers.push(t),
      () => {
        const r = this.subscribers.indexOf(t);
        this.subscribers.splice(r, 1);
      }
    )),
      (this.publish = (t) => {
        this.subscribers.forEach((r) => r(t));
      }),
      (this.addToast = (t) => {
        this.publish(t), (this.toasts = [...this.toasts, t]);
      }),
      (this.create = (t) => {
        var r;
        const { message: n, ...o } = t,
          a =
            typeof (t == null ? void 0 : t.id) == 'number' ||
            ((r = t.id) == null ? void 0 : r.length) > 0
              ? t.id
              : lr++,
          s = this.toasts.find((d) => d.id === a),
          i = t.dismissible === void 0 ? !0 : t.dismissible;
        return (
          this.dismissedToasts.has(a) && this.dismissedToasts.delete(a),
          s
            ? (this.toasts = this.toasts.map((d) =>
                d.id === a
                  ? (this.publish({ ...d, ...t, id: a, title: n }),
                    { ...d, ...t, id: a, dismissible: i, title: n })
                  : d,
              ))
            : this.addToast({ title: n, ...o, dismissible: i, id: a }),
          a
        );
      }),
      (this.dismiss = (t) => (
        t
          ? (this.dismissedToasts.add(t),
            requestAnimationFrame(() => this.subscribers.forEach((r) => r({ id: t, dismiss: !0 }))))
          : this.toasts.forEach((r) => {
              this.subscribers.forEach((n) => n({ id: r.id, dismiss: !0 }));
            }),
        t
      )),
      (this.message = (t, r) => this.create({ ...r, message: t })),
      (this.error = (t, r) => this.create({ ...r, message: t, type: 'error' })),
      (this.success = (t, r) => this.create({ ...r, type: 'success', message: t })),
      (this.info = (t, r) => this.create({ ...r, type: 'info', message: t })),
      (this.warning = (t, r) => this.create({ ...r, type: 'warning', message: t })),
      (this.loading = (t, r) => this.create({ ...r, type: 'loading', message: t })),
      (this.promise = (t, r) => {
        if (!r) return;
        let n;
        r.loading !== void 0 &&
          (n = this.create({
            ...r,
            promise: t,
            type: 'loading',
            message: r.loading,
            description: typeof r.description != 'function' ? r.description : void 0,
          }));
        const o = Promise.resolve(t instanceof Function ? t() : t);
        let a = n !== void 0,
          s;
        const i = o
            .then(async (c) => {
              if (((s = ['resolve', c]), rt.isValidElement(c)))
                (a = !1), this.create({ id: n, type: 'default', message: c });
              else if (Su(c) && !c.ok) {
                a = !1;
                const f =
                    typeof r.error == 'function'
                      ? await r.error(`HTTP error! status: ${c.status}`)
                      : r.error,
                  m =
                    typeof r.description == 'function'
                      ? await r.description(`HTTP error! status: ${c.status}`)
                      : r.description,
                  v = typeof f == 'object' && !rt.isValidElement(f) ? f : { message: f };
                this.create({ id: n, type: 'error', description: m, ...v });
              } else if (c instanceof Error) {
                a = !1;
                const f = typeof r.error == 'function' ? await r.error(c) : r.error,
                  m = typeof r.description == 'function' ? await r.description(c) : r.description,
                  v = typeof f == 'object' && !rt.isValidElement(f) ? f : { message: f };
                this.create({ id: n, type: 'error', description: m, ...v });
              } else if (r.success !== void 0) {
                a = !1;
                const f = typeof r.success == 'function' ? await r.success(c) : r.success,
                  m = typeof r.description == 'function' ? await r.description(c) : r.description,
                  v = typeof f == 'object' && !rt.isValidElement(f) ? f : { message: f };
                this.create({ id: n, type: 'success', description: m, ...v });
              }
            })
            .catch(async (c) => {
              if (((s = ['reject', c]), r.error !== void 0)) {
                a = !1;
                const u = typeof r.error == 'function' ? await r.error(c) : r.error,
                  f = typeof r.description == 'function' ? await r.description(c) : r.description,
                  p = typeof u == 'object' && !rt.isValidElement(u) ? u : { message: u };
                this.create({ id: n, type: 'error', description: f, ...p });
              }
            })
            .finally(() => {
              a && (this.dismiss(n), (n = void 0)), r.finally == null || r.finally.call(r);
            }),
          d = () =>
            new Promise((c, u) => i.then(() => (s[0] === 'reject' ? u(s[1]) : c(s[1]))).catch(u));
        return typeof n != 'string' && typeof n != 'number'
          ? { unwrap: d }
          : Object.assign(n, { unwrap: d });
      }),
      (this.custom = (t, r) => {
        const n = (r == null ? void 0 : r.id) || lr++;
        return this.create({ jsx: t(n), id: n, ...r }), n;
      }),
      (this.getActiveToasts = () => this.toasts.filter((t) => !this.dismissedToasts.has(t.id))),
      (this.subscribers = []),
      (this.toasts = []),
      (this.dismissedToasts = new Set());
  }
}
const ne = new Eu(),
  Au = (e, t) => {
    const r = (t == null ? void 0 : t.id) || lr++;
    return ne.addToast({ title: e, ...t, id: r }), r;
  },
  Su = (e) =>
    e &&
    typeof e == 'object' &&
    'ok' in e &&
    typeof e.ok == 'boolean' &&
    'status' in e &&
    typeof e.status == 'number',
  Ru = Au,
  Pu = () => ne.toasts,
  Nu = () => ne.getActiveToasts();
Object.assign(
  Ru,
  {
    success: ne.success,
    info: ne.info,
    warning: ne.warning,
    error: ne.error,
    custom: ne.custom,
    message: ne.message,
    promise: ne.promise,
    dismiss: ne.dismiss,
    loading: ne.loading,
  },
  { getHistory: Pu, getToasts: Nu },
);
ku(
  "[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);background:var(--normal-bg);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}",
);
function Ou({ className: e, ...t }) {
  return h.jsx('div', {
    'data-slot': 'skeleton',
    className: H('animate-pulse rounded-md bg-accent', e),
    ...t,
  });
}
Ou.__docgenInfo = { description: '', methods: [], displayName: 'Skeleton' };
function _u({ className: e, ...t }) {
  return h.jsx('div', {
    'data-slot': 'table-container',
    className: 'relative w-full overflow-x-auto',
    children: h.jsx('table', {
      'data-slot': 'table',
      className: H('w-full caption-bottom text-sm', e),
      ...t,
    }),
  });
}
function Du({ className: e, ...t }) {
  return h.jsx('thead', { 'data-slot': 'table-header', className: H('[&_tr]:border-b', e), ...t });
}
function Tu({ className: e, ...t }) {
  return h.jsx('tbody', {
    'data-slot': 'table-body',
    className: H('[&_tr:last-child]:border-0', e),
    ...t,
  });
}
function Iu({ className: e, ...t }) {
  return h.jsx('tr', {
    'data-slot': 'table-row',
    className: H(
      'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
      e,
    ),
    ...t,
  });
}
function Mu({ className: e, ...t }) {
  return h.jsx('th', {
    'data-slot': 'table-head',
    className: H(
      'h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      e,
    ),
    ...t,
  });
}
function ju({ className: e, ...t }) {
  return h.jsx('td', {
    'data-slot': 'table-cell',
    className: H(
      'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      e,
    ),
    ...t,
  });
}
_u.__docgenInfo = { description: '', methods: [], displayName: 'Table' };
Du.__docgenInfo = { description: '', methods: [], displayName: 'TableHeader' };
Tu.__docgenInfo = { description: '', methods: [], displayName: 'TableBody' };
Mu.__docgenInfo = { description: '', methods: [], displayName: 'TableHead' };
Iu.__docgenInfo = { description: '', methods: [], displayName: 'TableRow' };
ju.__docgenInfo = { description: '', methods: [], displayName: 'TableCell' };
export {
  au as A,
  Mr as B,
  Jd as C,
  mu as D,
  ad as I,
  sd as L,
  xu as P,
  Ou as S,
  _u as T,
  wu as a,
  Cu as b,
  H as c,
  eu as d,
  tu as e,
  ru as f,
  nu as g,
  ou as h,
  gu as i,
  hu as j,
  bu as k,
  yu as l,
  vu as m,
  su as n,
  iu as o,
  cu as p,
  du as q,
  lu as r,
  fu as s,
  uu as t,
  yd as u,
  Du as v,
  Iu as w,
  Mu as x,
  Tu as y,
  ju as z,
};
