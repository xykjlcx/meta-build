import { r as c } from './index-B3e6rcmj.js';
import { u as h, c as q } from './index-BAgrSUEs.js';
import { u as D } from './index-CLFlh7pk.js';
import { P as E } from './index-Tk7B4GT7.js';
import { j as o } from './jsx-runtime-BjG_zV1W.js';
import { c as x } from './utils-BQHNewu7.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js';
import './index-DuVyFFjR.js';
var R = { exports: {} },
  M = {}; /**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l = c;
function H(e, a) {
  return (e === a && (e !== 0 || 1 / e === 1 / a)) || (e !== e && a !== a);
}
var Y = typeof Object.is == 'function' ? Object.is : H,
  K = l.useState,
  U = l.useEffect,
  J = l.useLayoutEffect,
  Q = l.useDebugValue;
function X(e, a) {
  var r = a(),
    s = K({ inst: { value: r, getSnapshot: a } }),
    n = s[0].inst,
    t = s[1];
  return (
    J(() => {
      (n.value = r), (n.getSnapshot = a), A(n) && t({ inst: n });
    }, [e, r, a]),
    U(
      () => (
        A(n) && t({ inst: n }),
        e(() => {
          A(n) && t({ inst: n });
        })
      ),
      [e],
    ),
    Q(r),
    r
  );
}
function A(e) {
  var a = e.getSnapshot;
  e = e.value;
  try {
    var r = a();
    return !Y(e, r);
  } catch {
    return !0;
  }
}
function Z(e, a) {
  return a();
}
var ee =
  typeof window > 'u' || typeof window.document > 'u' || typeof window.document.createElement > 'u'
    ? Z
    : X;
M.useSyncExternalStore = l.useSyncExternalStore !== void 0 ? l.useSyncExternalStore : ee;
R.exports = M;
var ae = R.exports;
function te() {
  return ae.useSyncExternalStore(
    re,
    () => !0,
    () => !1,
  );
}
function re() {
  return () => {};
}
var y = 'Avatar',
  [ne] = q(y),
  [se, P] = ne(y),
  $ = c.forwardRef((e, a) => {
    const { __scopeAvatar: r, ...s } = e,
      [n, t] = c.useState('idle');
    return o.jsx(se, {
      scope: r,
      imageLoadingStatus: n,
      onImageLoadingStatusChange: t,
      children: o.jsx(E.span, { ...s, ref: a }),
    });
  });
$.displayName = y;
var G = 'AvatarImage',
  O = c.forwardRef((e, a) => {
    const { __scopeAvatar: r, src: s, onLoadingStatusChange: n = () => {}, ...t } = e,
      d = P(G, r),
      u = oe(s, t),
      i = D((m) => {
        n(m), d.onImageLoadingStatusChange(m);
      });
    return (
      h(() => {
        u !== 'idle' && i(u);
      }, [u, i]),
      u === 'loaded' ? o.jsx(E.img, { ...t, ref: a, src: s }) : null
    );
  });
O.displayName = G;
var T = 'AvatarFallback',
  V = c.forwardRef((e, a) => {
    const { __scopeAvatar: r, delayMs: s, ...n } = e,
      t = P(T, r),
      [d, u] = c.useState(s === void 0);
    return (
      c.useEffect(() => {
        if (s !== void 0) {
          const i = window.setTimeout(() => u(!0), s);
          return () => window.clearTimeout(i);
        }
      }, [s]),
      d && t.imageLoadingStatus !== 'loaded' ? o.jsx(E.span, { ...n, ref: a }) : null
    );
  });
V.displayName = T;
function I(e, a) {
  return e
    ? a
      ? (e.src !== a && (e.src = a), e.complete && e.naturalWidth > 0 ? 'loaded' : 'loading')
      : 'error'
    : 'idle';
}
function oe(e, { referrerPolicy: a, crossOrigin: r }) {
  const s = te(),
    n = c.useRef(null),
    t = s ? (n.current || (n.current = new window.Image()), n.current) : null,
    [d, u] = c.useState(() => I(t, e));
  return (
    h(() => {
      u(I(t, e));
    }, [t, e]),
    h(() => {
      const i = (W) => () => {
        u(W);
      };
      if (!t) return;
      const m = i('loaded'),
        b = i('error');
      return (
        t.addEventListener('load', m),
        t.addEventListener('error', b),
        a && (t.referrerPolicy = a),
        typeof r == 'string' && (t.crossOrigin = r),
        () => {
          t.removeEventListener('load', m), t.removeEventListener('error', b);
        }
      );
    }, [t, r, a]),
    d
  );
}
var ue = $,
  ce = O,
  ie = V;
function f({ className: e, size: a = 'default', ...r }) {
  return o.jsx(ue, {
    'data-slot': 'avatar',
    'data-size': a,
    className: x(
      'group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6',
      e,
    ),
    ...r,
  });
}
function B({ className: e, ...a }) {
  return o.jsx(ce, {
    'data-slot': 'avatar-image',
    className: x('aspect-square size-full', e),
    ...a,
  });
}
function S({ className: e, ...a }) {
  return o.jsx(ie, {
    'data-slot': 'avatar-fallback',
    className: x(
      'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs',
      e,
    ),
    ...a,
  });
}
f.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'Avatar',
  props: {
    size: {
      required: !1,
      tsType: {
        name: 'union',
        raw: "'default' | 'sm' | 'lg'",
        elements: [
          { name: 'literal', value: "'default'" },
          { name: 'literal', value: "'sm'" },
          { name: 'literal', value: "'lg'" },
        ],
      },
      description: '',
      defaultValue: { value: "'default'", computed: !1 },
    },
  },
};
B.__docgenInfo = { description: '', methods: [], displayName: 'AvatarImage' };
S.__docgenInfo = { description: '', methods: [], displayName: 'AvatarFallback' };
const he = {
    title: 'Primitives/Avatar',
    component: f,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  v = {
    render: () =>
      o.jsxs(f, {
        children: [
          o.jsx(B, { src: 'https://github.com/shadcn.png', alt: '头像' }),
          o.jsx(S, { children: 'CN' }),
        ],
      }),
  },
  p = { render: () => o.jsx(f, { children: o.jsx(S, { children: 'YG' }) }) },
  g = {
    render: () =>
      o.jsx(f, {
        className: 'h-16 w-16',
        children: o.jsx(S, { className: 'text-lg', children: 'MB' }),
      }),
  };
var L, j, w;
v.parameters = {
  ...v.parameters,
  docs: {
    ...((L = v.parameters) == null ? void 0 : L.docs),
    source: {
      originalSource: `{
  render: () => <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="头像" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
}`,
      ...((w = (j = v.parameters) == null ? void 0 : j.docs) == null ? void 0 : w.source),
    },
  },
};
var _, k, N;
p.parameters = {
  ...p.parameters,
  docs: {
    ...((_ = p.parameters) == null ? void 0 : _.docs),
    source: {
      originalSource: `{
  render: () => <Avatar>
      <AvatarFallback>YG</AvatarFallback>
    </Avatar>
}`,
      ...((N = (k = p.parameters) == null ? void 0 : k.docs) == null ? void 0 : N.source),
    },
  },
};
var C, F, z;
g.parameters = {
  ...g.parameters,
  docs: {
    ...((C = g.parameters) == null ? void 0 : C.docs),
    source: {
      originalSource: `{
  render: () => <Avatar className="h-16 w-16">
      <AvatarFallback className="text-lg">MB</AvatarFallback>
    </Avatar>
}`,
      ...((z = (F = g.parameters) == null ? void 0 : F.docs) == null ? void 0 : z.source),
    },
  },
};
const xe = ['WithImage', 'FallbackOnly', 'CustomSize'];
export {
  g as CustomSize,
  p as FallbackOnly,
  v as WithImage,
  xe as __namedExportsOrder,
  he as default,
};
