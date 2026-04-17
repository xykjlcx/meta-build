import { r as L } from './index-B3e6rcmj.js';
import { j as R } from './jsx-runtime-BjG_zV1W.js';
import {
  u as Ce,
  w as W,
  x as at,
  c as b,
  S as dt,
  z as ee,
  y as gt,
  T as st,
  v as ut,
  B as we,
} from './table-BAJRp_jF.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-JG1J0hlI.js'; /**
 * table-core
 *
 * Copyright (c) TanStack
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function D(e, o) {
  return typeof e == 'function' ? e(o) : e;
}
function P(e, o) {
  return (t) => {
    o.setState((n) => ({ ...n, [e]: D(t, n[e]) }));
  };
}
function Q(e) {
  return e instanceof Function;
}
function ct(e) {
  return Array.isArray(e) && e.every((o) => typeof o == 'number');
}
function ft(e, o) {
  const t = [],
    n = (r) => {
      r.forEach((i) => {
        t.push(i);
        const l = o(i);
        l != null && l.length && n(l);
      });
    };
  return n(e), t;
}
function S(e, o, t) {
  let n = [],
    r;
  return (i) => {
    let l;
    t.key && t.debug && (l = Date.now());
    const s = e(i);
    if (!(s.length !== n.length || s.some((c, m) => n[m] !== c))) return r;
    n = s;
    let g;
    if (
      (t.key && t.debug && (g = Date.now()),
      (r = o(...s)),
      t == null || t.onChange == null || t.onChange(r),
      t.key && t.debug && t != null && t.debug())
    ) {
      const c = Math.round((Date.now() - l) * 100) / 100,
        m = Math.round((Date.now() - g) * 100) / 100,
        d = m / 16,
        a = (f, p) => {
          for (f = String(f); f.length < p; ) f = ' ' + f;
          return f;
        };
      console.info(
        `%c⏱ ${a(m, 5)} /${a(c, 5)} ms`,
        `
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(0, Math.min(120 - 120 * d, 120))}deg 100% 31%);`,
        t == null ? void 0 : t.key,
      );
    }
    return r;
  };
}
function C(e, o, t, n) {
  return {
    debug: () => {
      var r;
      return (r = e == null ? void 0 : e.debugAll) != null ? r : e[o];
    },
    key: !1,
    onChange: n,
  };
}
function pt(e, o, t, n) {
  const r = () => {
      var l;
      return (l = i.getValue()) != null ? l : e.options.renderFallbackValue;
    },
    i = {
      id: `${o.id}_${t.id}`,
      row: o,
      column: t,
      getValue: () => o.getValue(n),
      renderValue: r,
      getContext: S(
        () => [e, t, o, i],
        (l, s, u, g) => ({
          table: l,
          column: s,
          row: u,
          cell: g,
          getValue: g.getValue,
          renderValue: g.renderValue,
        }),
        C(e.options, 'debugCells'),
      ),
    };
  return (
    e._features.forEach((l) => {
      l.createCell == null || l.createCell(i, t, o, e);
    }, {}),
    i
  );
}
function mt(e, o, t, n) {
  var r, i;
  const s = { ...e._getDefaultColumnDef(), ...o },
    u = s.accessorKey;
  let g =
      (r =
        (i = s.id) != null
          ? i
          : u
            ? typeof String.prototype.replaceAll == 'function'
              ? u.replaceAll('.', '_')
              : u.replace(/\./g, '_')
            : void 0) != null
        ? r
        : typeof s.header == 'string'
          ? s.header
          : void 0,
    c;
  if (
    (s.accessorFn
      ? (c = s.accessorFn)
      : u &&
        (u.includes('.')
          ? (c = (d) => {
              let a = d;
              for (const p of u.split('.')) {
                var f;
                a = (f = a) == null ? void 0 : f[p];
              }
              return a;
            })
          : (c = (d) => d[s.accessorKey])),
    !g)
  )
    throw new Error();
  const m = {
    id: `${String(g)}`,
    accessorFn: c,
    parent: n,
    depth: t,
    columnDef: s,
    columns: [],
    getFlatColumns: S(
      () => [!0],
      () => {
        var d;
        return [m, ...((d = m.columns) == null ? void 0 : d.flatMap((a) => a.getFlatColumns()))];
      },
      C(e.options, 'debugColumns'),
    ),
    getLeafColumns: S(
      () => [e._getOrderColumnsFn()],
      (d) => {
        var a;
        if ((a = m.columns) != null && a.length) {
          const f = m.columns.flatMap((p) => p.getLeafColumns());
          return d(f);
        }
        return [m];
      },
      C(e.options, 'debugColumns'),
    ),
  };
  for (const d of e._features) d.createColumn == null || d.createColumn(m, e);
  return m;
}
const $ = 'debugHeaders';
function Re(e, o, t) {
  var n;
  const i = {
    id: (n = t.id) != null ? n : o.id,
    column: o,
    index: t.index,
    isPlaceholder: !!t.isPlaceholder,
    placeholderId: t.placeholderId,
    depth: t.depth,
    subHeaders: [],
    colSpan: 0,
    rowSpan: 0,
    headerGroup: null,
    getLeafHeaders: () => {
      const l = [],
        s = (u) => {
          u.subHeaders && u.subHeaders.length && u.subHeaders.map(s), l.push(u);
        };
      return s(i), l;
    },
    getContext: () => ({ table: e, header: i, column: o }),
  };
  return (
    e._features.forEach((l) => {
      l.createHeader == null || l.createHeader(i, e);
    }),
    i
  );
}
const St = {
  createTable: (e) => {
    (e.getHeaderGroups = S(
      () => [
        e.getAllColumns(),
        e.getVisibleLeafColumns(),
        e.getState().columnPinning.left,
        e.getState().columnPinning.right,
      ],
      (o, t, n, r) => {
        var i, l;
        const s =
            (i = n == null ? void 0 : n.map((m) => t.find((d) => d.id === m)).filter(Boolean)) !=
            null
              ? i
              : [],
          u =
            (l = r == null ? void 0 : r.map((m) => t.find((d) => d.id === m)).filter(Boolean)) !=
            null
              ? l
              : [],
          g = t.filter((m) => !(n != null && n.includes(m.id)) && !(r != null && r.includes(m.id)));
        return X(o, [...s, ...g, ...u], e);
      },
      C(e.options, $),
    )),
      (e.getCenterHeaderGroups = S(
        () => [
          e.getAllColumns(),
          e.getVisibleLeafColumns(),
          e.getState().columnPinning.left,
          e.getState().columnPinning.right,
        ],
        (o, t, n, r) => (
          (t = t.filter(
            (i) => !(n != null && n.includes(i.id)) && !(r != null && r.includes(i.id)),
          )),
          X(o, t, e, 'center')
        ),
        C(e.options, $),
      )),
      (e.getLeftHeaderGroups = S(
        () => [e.getAllColumns(), e.getVisibleLeafColumns(), e.getState().columnPinning.left],
        (o, t, n) => {
          var r;
          const i =
            (r = n == null ? void 0 : n.map((l) => t.find((s) => s.id === l)).filter(Boolean)) !=
            null
              ? r
              : [];
          return X(o, i, e, 'left');
        },
        C(e.options, $),
      )),
      (e.getRightHeaderGroups = S(
        () => [e.getAllColumns(), e.getVisibleLeafColumns(), e.getState().columnPinning.right],
        (o, t, n) => {
          var r;
          const i =
            (r = n == null ? void 0 : n.map((l) => t.find((s) => s.id === l)).filter(Boolean)) !=
            null
              ? r
              : [];
          return X(o, i, e, 'right');
        },
        C(e.options, $),
      )),
      (e.getFooterGroups = S(
        () => [e.getHeaderGroups()],
        (o) => [...o].reverse(),
        C(e.options, $),
      )),
      (e.getLeftFooterGroups = S(
        () => [e.getLeftHeaderGroups()],
        (o) => [...o].reverse(),
        C(e.options, $),
      )),
      (e.getCenterFooterGroups = S(
        () => [e.getCenterHeaderGroups()],
        (o) => [...o].reverse(),
        C(e.options, $),
      )),
      (e.getRightFooterGroups = S(
        () => [e.getRightHeaderGroups()],
        (o) => [...o].reverse(),
        C(e.options, $),
      )),
      (e.getFlatHeaders = S(
        () => [e.getHeaderGroups()],
        (o) => o.flatMap((t) => t.headers),
        C(e.options, $),
      )),
      (e.getLeftFlatHeaders = S(
        () => [e.getLeftHeaderGroups()],
        (o) => o.flatMap((t) => t.headers),
        C(e.options, $),
      )),
      (e.getCenterFlatHeaders = S(
        () => [e.getCenterHeaderGroups()],
        (o) => o.flatMap((t) => t.headers),
        C(e.options, $),
      )),
      (e.getRightFlatHeaders = S(
        () => [e.getRightHeaderGroups()],
        (o) => o.flatMap((t) => t.headers),
        C(e.options, $),
      )),
      (e.getCenterLeafHeaders = S(
        () => [e.getCenterFlatHeaders()],
        (o) =>
          o.filter((t) => {
            var n;
            return !((n = t.subHeaders) != null && n.length);
          }),
        C(e.options, $),
      )),
      (e.getLeftLeafHeaders = S(
        () => [e.getLeftFlatHeaders()],
        (o) =>
          o.filter((t) => {
            var n;
            return !((n = t.subHeaders) != null && n.length);
          }),
        C(e.options, $),
      )),
      (e.getRightLeafHeaders = S(
        () => [e.getRightFlatHeaders()],
        (o) =>
          o.filter((t) => {
            var n;
            return !((n = t.subHeaders) != null && n.length);
          }),
        C(e.options, $),
      )),
      (e.getLeafHeaders = S(
        () => [e.getLeftHeaderGroups(), e.getCenterHeaderGroups(), e.getRightHeaderGroups()],
        (o, t, n) => {
          var r, i, l, s, u, g;
          return [
            ...((r = (i = o[0]) == null ? void 0 : i.headers) != null ? r : []),
            ...((l = (s = t[0]) == null ? void 0 : s.headers) != null ? l : []),
            ...((u = (g = n[0]) == null ? void 0 : g.headers) != null ? u : []),
          ].flatMap((c) => c.getLeafHeaders());
        },
        C(e.options, $),
      ));
  },
};
function X(e, o, t, n) {
  var r, i;
  let l = 0;
  const s = (d, a) => {
    a === void 0 && (a = 1),
      (l = Math.max(l, a)),
      d
        .filter((f) => f.getIsVisible())
        .forEach((f) => {
          var p;
          (p = f.columns) != null && p.length && s(f.columns, a + 1);
        }, 0);
  };
  s(e);
  const u = [];
  const g = (d, a) => {
      const f = { depth: a, id: [n, `${a}`].filter(Boolean).join('_'), headers: [] },
        p = [];
      d.forEach((h) => {
        const w = [...p].reverse()[0],
          F = h.column.depth === f.depth;
        let x,
          y = !1;
        if (
          (F && h.column.parent ? (x = h.column.parent) : ((x = h.column), (y = !0)),
          w && (w == null ? void 0 : w.column) === x)
        )
          w.subHeaders.push(h);
        else {
          const V = Re(t, x, {
            id: [n, a, x.id, h == null ? void 0 : h.id].filter(Boolean).join('_'),
            isPlaceholder: y,
            placeholderId: y ? `${p.filter((T) => T.column === x).length}` : void 0,
            depth: a,
            index: p.length,
          });
          V.subHeaders.push(h), p.push(V);
        }
        f.headers.push(h), (h.headerGroup = f);
      }),
        u.push(f),
        a > 0 && g(p, a - 1);
    },
    c = o.map((d, a) => Re(t, d, { depth: l, index: a }));
  g(c, l - 1), u.reverse();
  const m = (d) =>
    d
      .filter((f) => f.column.getIsVisible())
      .map((f) => {
        let p = 0,
          h = 0,
          w = [0];
        f.subHeaders && f.subHeaders.length
          ? ((w = []),
            m(f.subHeaders).forEach((x) => {
              const { colSpan: y, rowSpan: V } = x;
              (p += y), w.push(V);
            }))
          : (p = 1);
        const F = Math.min(...w);
        return (h = h + F), (f.colSpan = p), (f.rowSpan = h), { colSpan: p, rowSpan: h };
      });
  return m((r = (i = u[0]) == null ? void 0 : i.headers) != null ? r : []), u;
}
const Ct = (e, o, t, n, r, i, l) => {
    const s = {
      id: o,
      index: n,
      original: t,
      depth: r,
      parentId: l,
      _valuesCache: {},
      _uniqueValuesCache: {},
      getValue: (u) => {
        if (s._valuesCache.hasOwnProperty(u)) return s._valuesCache[u];
        const g = e.getColumn(u);
        if (g != null && g.accessorFn)
          return (s._valuesCache[u] = g.accessorFn(s.original, n)), s._valuesCache[u];
      },
      getUniqueValues: (u) => {
        if (s._uniqueValuesCache.hasOwnProperty(u)) return s._uniqueValuesCache[u];
        const g = e.getColumn(u);
        if (g != null && g.accessorFn)
          return g.columnDef.getUniqueValues
            ? ((s._uniqueValuesCache[u] = g.columnDef.getUniqueValues(s.original, n)),
              s._uniqueValuesCache[u])
            : ((s._uniqueValuesCache[u] = [s.getValue(u)]), s._uniqueValuesCache[u]);
      },
      renderValue: (u) => {
        var g;
        return (g = s.getValue(u)) != null ? g : e.options.renderFallbackValue;
      },
      subRows: [],
      getLeafRows: () => ft(s.subRows, (u) => u.subRows),
      getParentRow: () => (s.parentId ? e.getRow(s.parentId, !0) : void 0),
      getParentRows: () => {
        let u = [],
          g = s;
        for (;;) {
          const c = g.getParentRow();
          if (!c) break;
          u.push(c), (g = c);
        }
        return u.reverse();
      },
      getAllCells: S(
        () => [e.getAllLeafColumns()],
        (u) => u.map((g) => pt(e, s, g, g.id)),
        C(e.options, 'debugRows'),
      ),
      _getAllCellsByColumnId: S(
        () => [s.getAllCells()],
        (u) => u.reduce((g, c) => ((g[c.column.id] = c), g), {}),
        C(e.options, 'debugRows'),
      ),
    };
    for (let u = 0; u < e._features.length; u++) {
      const g = e._features[u];
      g == null || g.createRow == null || g.createRow(s, e);
    }
    return s;
  },
  wt = {
    createColumn: (e, o) => {
      (e._getFacetedRowModel =
        o.options.getFacetedRowModel && o.options.getFacetedRowModel(o, e.id)),
        (e.getFacetedRowModel = () =>
          e._getFacetedRowModel ? e._getFacetedRowModel() : o.getPreFilteredRowModel()),
        (e._getFacetedUniqueValues =
          o.options.getFacetedUniqueValues && o.options.getFacetedUniqueValues(o, e.id)),
        (e.getFacetedUniqueValues = () =>
          e._getFacetedUniqueValues ? e._getFacetedUniqueValues() : new Map()),
        (e._getFacetedMinMaxValues =
          o.options.getFacetedMinMaxValues && o.options.getFacetedMinMaxValues(o, e.id)),
        (e.getFacetedMinMaxValues = () => {
          if (e._getFacetedMinMaxValues) return e._getFacetedMinMaxValues();
        });
    },
  },
  Ye = (e, o, t) => {
    var n, r;
    const i = t == null || (n = t.toString()) == null ? void 0 : n.toLowerCase();
    return !!(
      !(
        (r = e.getValue(o)) == null ||
        (r = r.toString()) == null ||
        (r = r.toLowerCase()) == null
      ) && r.includes(i)
    );
  };
Ye.autoRemove = (e) => M(e);
const be = (e, o, t) => {
  var n;
  return !!(!((n = e.getValue(o)) == null || (n = n.toString()) == null) && n.includes(t));
};
be.autoRemove = (e) => M(e);
const et = (e, o, t) => {
  var n;
  return (
    ((n = e.getValue(o)) == null || (n = n.toString()) == null ? void 0 : n.toLowerCase()) ===
    (t == null ? void 0 : t.toLowerCase())
  );
};
et.autoRemove = (e) => M(e);
const tt = (e, o, t) => {
  var n;
  return (n = e.getValue(o)) == null ? void 0 : n.includes(t);
};
tt.autoRemove = (e) => M(e);
const nt = (e, o, t) =>
  !t.some((n) => {
    var r;
    return !((r = e.getValue(o)) != null && r.includes(n));
  });
nt.autoRemove = (e) => M(e) || !(e != null && e.length);
const ot = (e, o, t) =>
  t.some((n) => {
    var r;
    return (r = e.getValue(o)) == null ? void 0 : r.includes(n);
  });
ot.autoRemove = (e) => M(e) || !(e != null && e.length);
const rt = (e, o, t) => e.getValue(o) === t;
rt.autoRemove = (e) => M(e);
const it = (e, o, t) => e.getValue(o) == t;
it.autoRemove = (e) => M(e);
const fe = (e, o, t) => {
  const [n, r] = t;
  const i = e.getValue(o);
  return i >= n && i <= r;
};
fe.resolveFilterValue = (e) => {
  let [o, t] = e,
    n = typeof o != 'number' ? Number.parseFloat(o) : o,
    r = typeof t != 'number' ? Number.parseFloat(t) : t,
    i = o === null || Number.isNaN(n) ? -1 / 0 : n,
    l = t === null || Number.isNaN(r) ? 1 / 0 : r;
  if (i > l) {
    const s = i;
    (i = l), (l = s);
  }
  return [i, l];
};
fe.autoRemove = (e) => M(e) || (M(e[0]) && M(e[1]));
const I = {
  includesString: Ye,
  includesStringSensitive: be,
  equalsString: et,
  arrIncludes: tt,
  arrIncludesAll: nt,
  arrIncludesSome: ot,
  equals: rt,
  weakEquals: it,
  inNumberRange: fe,
};
function M(e) {
  return e == null || e === '';
}
const Rt = {
  getDefaultColumnDef: () => ({ filterFn: 'auto' }),
  getInitialState: (e) => ({ columnFilters: [], ...e }),
  getDefaultOptions: (e) => ({
    onColumnFiltersChange: P('columnFilters', e),
    filterFromLeafRows: !1,
    maxLeafRowFilterDepth: 100,
  }),
  createColumn: (e, o) => {
    (e.getAutoFilterFn = () => {
      const t = o.getCoreRowModel().flatRows[0],
        n = t == null ? void 0 : t.getValue(e.id);
      return typeof n == 'string'
        ? I.includesString
        : typeof n == 'number'
          ? I.inNumberRange
          : typeof n == 'boolean' || (n !== null && typeof n == 'object')
            ? I.equals
            : Array.isArray(n)
              ? I.arrIncludes
              : I.weakEquals;
    }),
      (e.getFilterFn = () => {
        var t, n;
        return Q(e.columnDef.filterFn)
          ? e.columnDef.filterFn
          : e.columnDef.filterFn === 'auto'
            ? e.getAutoFilterFn()
            : (t = (n = o.options.filterFns) == null ? void 0 : n[e.columnDef.filterFn]) != null
              ? t
              : I[e.columnDef.filterFn];
      }),
      (e.getCanFilter = () => {
        var t, n, r;
        return (
          ((t = e.columnDef.enableColumnFilter) != null ? t : !0) &&
          ((n = o.options.enableColumnFilters) != null ? n : !0) &&
          ((r = o.options.enableFilters) != null ? r : !0) &&
          !!e.accessorFn
        );
      }),
      (e.getIsFiltered = () => e.getFilterIndex() > -1),
      (e.getFilterValue = () => {
        var t;
        return (t = o.getState().columnFilters) == null ||
          (t = t.find((n) => n.id === e.id)) == null
          ? void 0
          : t.value;
      }),
      (e.getFilterIndex = () => {
        var t, n;
        return (t =
          (n = o.getState().columnFilters) == null ? void 0 : n.findIndex((r) => r.id === e.id)) !=
          null
          ? t
          : -1;
      }),
      (e.setFilterValue = (t) => {
        o.setColumnFilters((n) => {
          const r = e.getFilterFn(),
            i = n == null ? void 0 : n.find((c) => c.id === e.id),
            l = D(t, i ? i.value : void 0);
          if (he(r, l, e)) {
            var s;
            return (s = n == null ? void 0 : n.filter((c) => c.id !== e.id)) != null ? s : [];
          }
          const u = { id: e.id, value: l };
          if (i) {
            var g;
            return (g = n == null ? void 0 : n.map((c) => (c.id === e.id ? u : c))) != null
              ? g
              : [];
          }
          return n != null && n.length ? [...n, u] : [u];
        });
      });
  },
  createRow: (e, o) => {
    (e.columnFilters = {}), (e.columnFiltersMeta = {});
  },
  createTable: (e) => {
    (e.setColumnFilters = (o) => {
      const t = e.getAllLeafColumns(),
        n = (r) => {
          var i;
          return (i = D(o, r)) == null
            ? void 0
            : i.filter((l) => {
                const s = t.find((u) => u.id === l.id);
                if (s) {
                  const u = s.getFilterFn();
                  if (he(u, l.value, s)) return !1;
                }
                return !0;
              });
        };
      e.options.onColumnFiltersChange == null || e.options.onColumnFiltersChange(n);
    }),
      (e.resetColumnFilters = (o) => {
        var t, n;
        e.setColumnFilters(
          o ? [] : (t = (n = e.initialState) == null ? void 0 : n.columnFilters) != null ? t : [],
        );
      }),
      (e.getPreFilteredRowModel = () => e.getCoreRowModel()),
      (e.getFilteredRowModel = () => (
        !e._getFilteredRowModel &&
          e.options.getFilteredRowModel &&
          (e._getFilteredRowModel = e.options.getFilteredRowModel(e)),
        e.options.manualFiltering || !e._getFilteredRowModel
          ? e.getPreFilteredRowModel()
          : e._getFilteredRowModel()
      ));
  },
};
function he(e, o, t) {
  return (
    (e && e.autoRemove ? e.autoRemove(o, t) : !1) || typeof o > 'u' || (typeof o == 'string' && !o)
  );
}
const ht = (e, o, t) =>
    t.reduce((n, r) => {
      const i = r.getValue(e);
      return n + (typeof i == 'number' ? i : 0);
    }, 0),
  vt = (e, o, t) => {
    let n;
    return (
      t.forEach((r) => {
        const i = r.getValue(e);
        i != null && (n > i || (n === void 0 && i >= i)) && (n = i);
      }),
      n
    );
  },
  _t = (e, o, t) => {
    let n;
    return (
      t.forEach((r) => {
        const i = r.getValue(e);
        i != null && (n < i || (n === void 0 && i >= i)) && (n = i);
      }),
      n
    );
  },
  xt = (e, o, t) => {
    let n, r;
    return (
      t.forEach((i) => {
        const l = i.getValue(e);
        l != null && (n === void 0 ? l >= l && (n = r = l) : (n > l && (n = l), r < l && (r = l)));
      }),
      [n, r]
    );
  },
  Ft = (e, o) => {
    let t = 0,
      n = 0;
    if (
      (o.forEach((r) => {
        let i = r.getValue(e);
        i != null && (i = +i) >= i && (++t, (n += i));
      }),
      t)
    )
      return n / t;
  },
  $t = (e, o) => {
    if (!o.length) return;
    const t = o.map((i) => i.getValue(e));
    if (!ct(t)) return;
    if (t.length === 1) return t[0];
    const n = Math.floor(t.length / 2),
      r = t.sort((i, l) => i - l);
    return t.length % 2 !== 0 ? r[n] : (r[n - 1] + r[n]) / 2;
  },
  Pt = (e, o) => Array.from(new Set(o.map((t) => t.getValue(e))).values()),
  yt = (e, o) => new Set(o.map((t) => t.getValue(e))).size,
  Mt = (e, o) => o.length,
  te = {
    sum: ht,
    min: vt,
    max: _t,
    extent: xt,
    mean: Ft,
    median: $t,
    unique: Pt,
    uniqueCount: yt,
    count: Mt,
  },
  Vt = {
    getDefaultColumnDef: () => ({
      aggregatedCell: (e) => {
        var o, t;
        return (o = (t = e.getValue()) == null || t.toString == null ? void 0 : t.toString()) !=
          null
          ? o
          : null;
      },
      aggregationFn: 'auto',
    }),
    getInitialState: (e) => ({ grouping: [], ...e }),
    getDefaultOptions: (e) => ({
      onGroupingChange: P('grouping', e),
      groupedColumnMode: 'reorder',
    }),
    createColumn: (e, o) => {
      (e.toggleGrouping = () => {
        o.setGrouping((t) =>
          t != null && t.includes(e.id) ? t.filter((n) => n !== e.id) : [...(t ?? []), e.id],
        );
      }),
        (e.getCanGroup = () => {
          var t, n;
          return (
            ((t = e.columnDef.enableGrouping) != null ? t : !0) &&
            ((n = o.options.enableGrouping) != null ? n : !0) &&
            (!!e.accessorFn || !!e.columnDef.getGroupingValue)
          );
        }),
        (e.getIsGrouped = () => {
          var t;
          return (t = o.getState().grouping) == null ? void 0 : t.includes(e.id);
        }),
        (e.getGroupedIndex = () => {
          var t;
          return (t = o.getState().grouping) == null ? void 0 : t.indexOf(e.id);
        }),
        (e.getToggleGroupingHandler = () => {
          const t = e.getCanGroup();
          return () => {
            t && e.toggleGrouping();
          };
        }),
        (e.getAutoAggregationFn = () => {
          const t = o.getCoreRowModel().flatRows[0],
            n = t == null ? void 0 : t.getValue(e.id);
          if (typeof n == 'number') return te.sum;
          if (Object.prototype.toString.call(n) === '[object Date]') return te.extent;
        }),
        (e.getAggregationFn = () => {
          var t, n;
          if (!e) throw new Error();
          return Q(e.columnDef.aggregationFn)
            ? e.columnDef.aggregationFn
            : e.columnDef.aggregationFn === 'auto'
              ? e.getAutoAggregationFn()
              : (t =
                    (n = o.options.aggregationFns) == null
                      ? void 0
                      : n[e.columnDef.aggregationFn]) != null
                ? t
                : te[e.columnDef.aggregationFn];
        });
    },
    createTable: (e) => {
      (e.setGrouping = (o) =>
        e.options.onGroupingChange == null ? void 0 : e.options.onGroupingChange(o)),
        (e.resetGrouping = (o) => {
          var t, n;
          e.setGrouping(
            o ? [] : (t = (n = e.initialState) == null ? void 0 : n.grouping) != null ? t : [],
          );
        }),
        (e.getPreGroupedRowModel = () => e.getFilteredRowModel()),
        (e.getGroupedRowModel = () => (
          !e._getGroupedRowModel &&
            e.options.getGroupedRowModel &&
            (e._getGroupedRowModel = e.options.getGroupedRowModel(e)),
          e.options.manualGrouping || !e._getGroupedRowModel
            ? e.getPreGroupedRowModel()
            : e._getGroupedRowModel()
        ));
    },
    createRow: (e, o) => {
      (e.getIsGrouped = () => !!e.groupingColumnId),
        (e.getGroupingValue = (t) => {
          if (e._groupingValuesCache.hasOwnProperty(t)) return e._groupingValuesCache[t];
          const n = o.getColumn(t);
          return n != null && n.columnDef.getGroupingValue
            ? ((e._groupingValuesCache[t] = n.columnDef.getGroupingValue(e.original)),
              e._groupingValuesCache[t])
            : e.getValue(t);
        }),
        (e._groupingValuesCache = {});
    },
    createCell: (e, o, t, n) => {
      (e.getIsGrouped = () => o.getIsGrouped() && o.id === t.groupingColumnId),
        (e.getIsPlaceholder = () => !e.getIsGrouped() && o.getIsGrouped()),
        (e.getIsAggregated = () => {
          var r;
          return (
            !e.getIsGrouped() && !e.getIsPlaceholder() && !!((r = t.subRows) != null && r.length)
          );
        });
    },
  };
function It(e, o, t) {
  if (!(o != null && o.length) || !t) return e;
  const n = e.filter((i) => !o.includes(i.id));
  return t === 'remove' ? n : [...o.map((i) => e.find((l) => l.id === i)).filter(Boolean), ...n];
}
const Dt = {
    getInitialState: (e) => ({ columnOrder: [], ...e }),
    getDefaultOptions: (e) => ({ onColumnOrderChange: P('columnOrder', e) }),
    createColumn: (e, o) => {
      (e.getIndex = S(
        (t) => [K(o, t)],
        (t) => t.findIndex((n) => n.id === e.id),
        C(o.options, 'debugColumns'),
      )),
        (e.getIsFirstColumn = (t) => {
          var n;
          return ((n = K(o, t)[0]) == null ? void 0 : n.id) === e.id;
        }),
        (e.getIsLastColumn = (t) => {
          var n;
          const r = K(o, t);
          return ((n = r[r.length - 1]) == null ? void 0 : n.id) === e.id;
        });
    },
    createTable: (e) => {
      (e.setColumnOrder = (o) =>
        e.options.onColumnOrderChange == null ? void 0 : e.options.onColumnOrderChange(o)),
        (e.resetColumnOrder = (o) => {
          var t;
          e.setColumnOrder(o ? [] : (t = e.initialState.columnOrder) != null ? t : []);
        }),
        (e._getOrderColumnsFn = S(
          () => [e.getState().columnOrder, e.getState().grouping, e.options.groupedColumnMode],
          (o, t, n) => (r) => {
            let i = [];
            if (!(o != null && o.length)) i = r;
            else {
              const l = [...o],
                s = [...r];
              while (s.length && l.length) {
                const u = l.shift(),
                  g = s.findIndex((c) => c.id === u);
                g > -1 && i.push(s.splice(g, 1)[0]);
              }
              i = [...i, ...s];
            }
            return It(i, t, n);
          },
          C(e.options, 'debugTable'),
        ));
    },
  },
  ne = () => ({ left: [], right: [] }),
  Et = {
    getInitialState: (e) => ({ columnPinning: ne(), ...e }),
    getDefaultOptions: (e) => ({ onColumnPinningChange: P('columnPinning', e) }),
    createColumn: (e, o) => {
      (e.pin = (t) => {
        const n = e
          .getLeafColumns()
          .map((r) => r.id)
          .filter(Boolean);
        o.setColumnPinning((r) => {
          var i, l;
          if (t === 'right') {
            var s, u;
            return {
              left: ((s = r == null ? void 0 : r.left) != null ? s : []).filter(
                (m) => !(n != null && n.includes(m)),
              ),
              right: [
                ...((u = r == null ? void 0 : r.right) != null ? u : []).filter(
                  (m) => !(n != null && n.includes(m)),
                ),
                ...n,
              ],
            };
          }
          if (t === 'left') {
            var g, c;
            return {
              left: [
                ...((g = r == null ? void 0 : r.left) != null ? g : []).filter(
                  (m) => !(n != null && n.includes(m)),
                ),
                ...n,
              ],
              right: ((c = r == null ? void 0 : r.right) != null ? c : []).filter(
                (m) => !(n != null && n.includes(m)),
              ),
            };
          }
          return {
            left: ((i = r == null ? void 0 : r.left) != null ? i : []).filter(
              (m) => !(n != null && n.includes(m)),
            ),
            right: ((l = r == null ? void 0 : r.right) != null ? l : []).filter(
              (m) => !(n != null && n.includes(m)),
            ),
          };
        });
      }),
        (e.getCanPin = () =>
          e.getLeafColumns().some((n) => {
            var r, i, l;
            return (
              ((r = n.columnDef.enablePinning) != null ? r : !0) &&
              ((i = (l = o.options.enableColumnPinning) != null ? l : o.options.enablePinning) !=
              null
                ? i
                : !0)
            );
          })),
        (e.getIsPinned = () => {
          const t = e.getLeafColumns().map((s) => s.id),
            { left: n, right: r } = o.getState().columnPinning,
            i = t.some((s) => (n == null ? void 0 : n.includes(s))),
            l = t.some((s) => (r == null ? void 0 : r.includes(s)));
          return i ? 'left' : l ? 'right' : !1;
        }),
        (e.getPinnedIndex = () => {
          var t, n;
          const r = e.getIsPinned();
          return r
            ? (t =
                (n = o.getState().columnPinning) == null || (n = n[r]) == null
                  ? void 0
                  : n.indexOf(e.id)) != null
              ? t
              : -1
            : 0;
        });
    },
    createRow: (e, o) => {
      (e.getCenterVisibleCells = S(
        () => [
          e._getAllVisibleCells(),
          o.getState().columnPinning.left,
          o.getState().columnPinning.right,
        ],
        (t, n, r) => {
          const i = [...(n ?? []), ...(r ?? [])];
          return t.filter((l) => !i.includes(l.column.id));
        },
        C(o.options, 'debugRows'),
      )),
        (e.getLeftVisibleCells = S(
          () => [e._getAllVisibleCells(), o.getState().columnPinning.left],
          (t, n) =>
            (n ?? [])
              .map((i) => t.find((l) => l.column.id === i))
              .filter(Boolean)
              .map((i) => ({ ...i, position: 'left' })),
          C(o.options, 'debugRows'),
        )),
        (e.getRightVisibleCells = S(
          () => [e._getAllVisibleCells(), o.getState().columnPinning.right],
          (t, n) =>
            (n ?? [])
              .map((i) => t.find((l) => l.column.id === i))
              .filter(Boolean)
              .map((i) => ({ ...i, position: 'right' })),
          C(o.options, 'debugRows'),
        ));
    },
    createTable: (e) => {
      (e.setColumnPinning = (o) =>
        e.options.onColumnPinningChange == null ? void 0 : e.options.onColumnPinningChange(o)),
        (e.resetColumnPinning = (o) => {
          var t, n;
          return e.setColumnPinning(
            o
              ? ne()
              : (t = (n = e.initialState) == null ? void 0 : n.columnPinning) != null
                ? t
                : ne(),
          );
        }),
        (e.getIsSomeColumnsPinned = (o) => {
          var t;
          const n = e.getState().columnPinning;
          if (!o) {
            var r, i;
            return !!(((r = n.left) != null && r.length) || ((i = n.right) != null && i.length));
          }
          return !!((t = n[o]) != null && t.length);
        }),
        (e.getLeftLeafColumns = S(
          () => [e.getAllLeafColumns(), e.getState().columnPinning.left],
          (o, t) => (t ?? []).map((n) => o.find((r) => r.id === n)).filter(Boolean),
          C(e.options, 'debugColumns'),
        )),
        (e.getRightLeafColumns = S(
          () => [e.getAllLeafColumns(), e.getState().columnPinning.right],
          (o, t) => (t ?? []).map((n) => o.find((r) => r.id === n)).filter(Boolean),
          C(e.options, 'debugColumns'),
        )),
        (e.getCenterLeafColumns = S(
          () => [
            e.getAllLeafColumns(),
            e.getState().columnPinning.left,
            e.getState().columnPinning.right,
          ],
          (o, t, n) => {
            const r = [...(t ?? []), ...(n ?? [])];
            return o.filter((i) => !r.includes(i.id));
          },
          C(e.options, 'debugColumns'),
        ));
    },
  };
function At(e) {
  return e || (typeof document < 'u' ? document : null);
}
const Z = { size: 150, minSize: 20, maxSize: Number.MAX_SAFE_INTEGER },
  oe = () => ({
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: !1,
    columnSizingStart: [],
  }),
  Ht = {
    getDefaultColumnDef: () => Z,
    getInitialState: (e) => ({ columnSizing: {}, columnSizingInfo: oe(), ...e }),
    getDefaultOptions: (e) => ({
      columnResizeMode: 'onEnd',
      columnResizeDirection: 'ltr',
      onColumnSizingChange: P('columnSizing', e),
      onColumnSizingInfoChange: P('columnSizingInfo', e),
    }),
    createColumn: (e, o) => {
      (e.getSize = () => {
        var t, n, r;
        const i = o.getState().columnSizing[e.id];
        return Math.min(
          Math.max(
            (t = e.columnDef.minSize) != null ? t : Z.minSize,
            (n = i ?? e.columnDef.size) != null ? n : Z.size,
          ),
          (r = e.columnDef.maxSize) != null ? r : Z.maxSize,
        );
      }),
        (e.getStart = S(
          (t) => [t, K(o, t), o.getState().columnSizing],
          (t, n) => n.slice(0, e.getIndex(t)).reduce((r, i) => r + i.getSize(), 0),
          C(o.options, 'debugColumns'),
        )),
        (e.getAfter = S(
          (t) => [t, K(o, t), o.getState().columnSizing],
          (t, n) => n.slice(e.getIndex(t) + 1).reduce((r, i) => r + i.getSize(), 0),
          C(o.options, 'debugColumns'),
        )),
        (e.resetSize = () => {
          o.setColumnSizing((t) => {
            const { [e.id]: n, ...r } = t;
            return r;
          });
        }),
        (e.getCanResize = () => {
          var t, n;
          return (
            ((t = e.columnDef.enableResizing) != null ? t : !0) &&
            ((n = o.options.enableColumnResizing) != null ? n : !0)
          );
        }),
        (e.getIsResizing = () => o.getState().columnSizingInfo.isResizingColumn === e.id);
    },
    createHeader: (e, o) => {
      (e.getSize = () => {
        let t = 0;
        const n = (r) => {
          if (r.subHeaders.length) r.subHeaders.forEach(n);
          else {
            var i;
            t += (i = r.column.getSize()) != null ? i : 0;
          }
        };
        return n(e), t;
      }),
        (e.getStart = () => {
          if (e.index > 0) {
            const t = e.headerGroup.headers[e.index - 1];
            return t.getStart() + t.getSize();
          }
          return 0;
        }),
        (e.getResizeHandler = (t) => {
          const n = o.getColumn(e.column.id),
            r = n == null ? void 0 : n.getCanResize();
          return (i) => {
            if (
              !n ||
              !r ||
              (i.persist == null || i.persist(), re(i) && i.touches && i.touches.length > 1)
            )
              return;
            const l = e.getSize(),
              s = e
                ? e.getLeafHeaders().map((w) => [w.column.id, w.column.getSize()])
                : [[n.id, n.getSize()]],
              u = re(i) ? Math.round(i.touches[0].clientX) : i.clientX,
              g = {},
              c = (w, F) => {
                typeof F == 'number' &&
                  (o.setColumnSizingInfo((x) => {
                    var y, V;
                    const T = o.options.columnResizeDirection === 'rtl' ? -1 : 1,
                      _ = (F - ((y = x == null ? void 0 : x.startOffset) != null ? y : 0)) * T,
                      v = Math.max(
                        _ / ((V = x == null ? void 0 : x.startSize) != null ? V : 0),
                        -0.999999,
                      );
                    return (
                      x.columnSizingStart.forEach((H) => {
                        const [G, Se] = H;
                        g[G] = Math.round(Math.max(Se + Se * v, 0) * 100) / 100;
                      }),
                      { ...x, deltaOffset: _, deltaPercentage: v }
                    );
                  }),
                  (o.options.columnResizeMode === 'onChange' || w === 'end') &&
                    o.setColumnSizing((x) => ({ ...x, ...g })));
              },
              m = (w) => c('move', w),
              d = (w) => {
                c('end', w),
                  o.setColumnSizingInfo((F) => ({
                    ...F,
                    isResizingColumn: !1,
                    startOffset: null,
                    startSize: null,
                    deltaOffset: null,
                    deltaPercentage: null,
                    columnSizingStart: [],
                  }));
              },
              a = At(t),
              f = {
                moveHandler: (w) => m(w.clientX),
                upHandler: (w) => {
                  a == null || a.removeEventListener('mousemove', f.moveHandler),
                    a == null || a.removeEventListener('mouseup', f.upHandler),
                    d(w.clientX);
                },
              },
              p = {
                moveHandler: (w) => (
                  w.cancelable && (w.preventDefault(), w.stopPropagation()),
                  m(w.touches[0].clientX),
                  !1
                ),
                upHandler: (w) => {
                  var F;
                  a == null || a.removeEventListener('touchmove', p.moveHandler),
                    a == null || a.removeEventListener('touchend', p.upHandler),
                    w.cancelable && (w.preventDefault(), w.stopPropagation()),
                    d((F = w.touches[0]) == null ? void 0 : F.clientX);
                },
              },
              h = Gt() ? { passive: !1 } : !1;
            re(i)
              ? (a == null || a.addEventListener('touchmove', p.moveHandler, h),
                a == null || a.addEventListener('touchend', p.upHandler, h))
              : (a == null || a.addEventListener('mousemove', f.moveHandler, h),
                a == null || a.addEventListener('mouseup', f.upHandler, h)),
              o.setColumnSizingInfo((w) => ({
                ...w,
                startOffset: u,
                startSize: l,
                deltaOffset: 0,
                deltaPercentage: 0,
                columnSizingStart: s,
                isResizingColumn: n.id,
              }));
          };
        });
    },
    createTable: (e) => {
      (e.setColumnSizing = (o) =>
        e.options.onColumnSizingChange == null ? void 0 : e.options.onColumnSizingChange(o)),
        (e.setColumnSizingInfo = (o) =>
          e.options.onColumnSizingInfoChange == null
            ? void 0
            : e.options.onColumnSizingInfoChange(o)),
        (e.resetColumnSizing = (o) => {
          var t;
          e.setColumnSizing(o ? {} : (t = e.initialState.columnSizing) != null ? t : {});
        }),
        (e.resetHeaderSizeInfo = (o) => {
          var t;
          e.setColumnSizingInfo(
            o ? oe() : (t = e.initialState.columnSizingInfo) != null ? t : oe(),
          );
        }),
        (e.getTotalSize = () => {
          var o, t;
          return (o =
            (t = e.getHeaderGroups()[0]) == null
              ? void 0
              : t.headers.reduce((n, r) => n + r.getSize(), 0)) != null
            ? o
            : 0;
        }),
        (e.getLeftTotalSize = () => {
          var o, t;
          return (o =
            (t = e.getLeftHeaderGroups()[0]) == null
              ? void 0
              : t.headers.reduce((n, r) => n + r.getSize(), 0)) != null
            ? o
            : 0;
        }),
        (e.getCenterTotalSize = () => {
          var o, t;
          return (o =
            (t = e.getCenterHeaderGroups()[0]) == null
              ? void 0
              : t.headers.reduce((n, r) => n + r.getSize(), 0)) != null
            ? o
            : 0;
        }),
        (e.getRightTotalSize = () => {
          var o, t;
          return (o =
            (t = e.getRightHeaderGroups()[0]) == null
              ? void 0
              : t.headers.reduce((n, r) => n + r.getSize(), 0)) != null
            ? o
            : 0;
        });
    },
  };
let J = null;
function Gt() {
  if (typeof J == 'boolean') return J;
  let e = !1;
  try {
    const o = {
        get passive() {
          return (e = !0), !1;
        },
      },
      t = () => {};
    window.addEventListener('test', t, o), window.removeEventListener('test', t);
  } catch {
    e = !1;
  }
  return (J = e), J;
}
function re(e) {
  return e.type === 'touchstart';
}
const Lt = {
  getInitialState: (e) => ({ columnVisibility: {}, ...e }),
  getDefaultOptions: (e) => ({ onColumnVisibilityChange: P('columnVisibility', e) }),
  createColumn: (e, o) => {
    (e.toggleVisibility = (t) => {
      e.getCanHide() && o.setColumnVisibility((n) => ({ ...n, [e.id]: t ?? !e.getIsVisible() }));
    }),
      (e.getIsVisible = () => {
        var t, n;
        const r = e.columns;
        return (t = r.length
          ? r.some((i) => i.getIsVisible())
          : (n = o.getState().columnVisibility) == null
            ? void 0
            : n[e.id]) != null
          ? t
          : !0;
      }),
      (e.getCanHide = () => {
        var t, n;
        return (
          ((t = e.columnDef.enableHiding) != null ? t : !0) &&
          ((n = o.options.enableHiding) != null ? n : !0)
        );
      }),
      (e.getToggleVisibilityHandler = () => (t) => {
        e.toggleVisibility == null || e.toggleVisibility(t.target.checked);
      });
  },
  createRow: (e, o) => {
    (e._getAllVisibleCells = S(
      () => [e.getAllCells(), o.getState().columnVisibility],
      (t) => t.filter((n) => n.column.getIsVisible()),
      C(o.options, 'debugRows'),
    )),
      (e.getVisibleCells = S(
        () => [e.getLeftVisibleCells(), e.getCenterVisibleCells(), e.getRightVisibleCells()],
        (t, n, r) => [...t, ...n, ...r],
        C(o.options, 'debugRows'),
      ));
  },
  createTable: (e) => {
    const o = (t, n) =>
      S(
        () => [
          n(),
          n()
            .filter((r) => r.getIsVisible())
            .map((r) => r.id)
            .join('_'),
        ],
        (r) => r.filter((i) => (i.getIsVisible == null ? void 0 : i.getIsVisible())),
        C(e.options, 'debugColumns'),
      );
    (e.getVisibleFlatColumns = o('getVisibleFlatColumns', () => e.getAllFlatColumns())),
      (e.getVisibleLeafColumns = o('getVisibleLeafColumns', () => e.getAllLeafColumns())),
      (e.getLeftVisibleLeafColumns = o('getLeftVisibleLeafColumns', () => e.getLeftLeafColumns())),
      (e.getRightVisibleLeafColumns = o('getRightVisibleLeafColumns', () =>
        e.getRightLeafColumns(),
      )),
      (e.getCenterVisibleLeafColumns = o('getCenterVisibleLeafColumns', () =>
        e.getCenterLeafColumns(),
      )),
      (e.setColumnVisibility = (t) =>
        e.options.onColumnVisibilityChange == null
          ? void 0
          : e.options.onColumnVisibilityChange(t)),
      (e.resetColumnVisibility = (t) => {
        var n;
        e.setColumnVisibility(t ? {} : (n = e.initialState.columnVisibility) != null ? n : {});
      }),
      (e.toggleAllColumnsVisible = (t) => {
        var n;
        (t = (n = t) != null ? n : !e.getIsAllColumnsVisible()),
          e.setColumnVisibility(
            e
              .getAllLeafColumns()
              .reduce(
                (r, i) => ({ ...r, [i.id]: t || !(i.getCanHide != null && i.getCanHide()) }),
                {},
              ),
          );
      }),
      (e.getIsAllColumnsVisible = () =>
        !e.getAllLeafColumns().some((t) => !(t.getIsVisible != null && t.getIsVisible()))),
      (e.getIsSomeColumnsVisible = () =>
        e.getAllLeafColumns().some((t) => (t.getIsVisible == null ? void 0 : t.getIsVisible()))),
      (e.getToggleAllColumnsVisibilityHandler = () => (t) => {
        var n;
        e.toggleAllColumnsVisible((n = t.target) == null ? void 0 : n.checked);
      });
  },
};
function K(e, o) {
  return o
    ? o === 'center'
      ? e.getCenterVisibleLeafColumns()
      : o === 'left'
        ? e.getLeftVisibleLeafColumns()
        : e.getRightVisibleLeafColumns()
    : e.getVisibleLeafColumns();
}
const zt = {
    createTable: (e) => {
      (e._getGlobalFacetedRowModel =
        e.options.getFacetedRowModel && e.options.getFacetedRowModel(e, '__global__')),
        (e.getGlobalFacetedRowModel = () =>
          e.options.manualFiltering || !e._getGlobalFacetedRowModel
            ? e.getPreFilteredRowModel()
            : e._getGlobalFacetedRowModel()),
        (e._getGlobalFacetedUniqueValues =
          e.options.getFacetedUniqueValues && e.options.getFacetedUniqueValues(e, '__global__')),
        (e.getGlobalFacetedUniqueValues = () =>
          e._getGlobalFacetedUniqueValues ? e._getGlobalFacetedUniqueValues() : new Map()),
        (e._getGlobalFacetedMinMaxValues =
          e.options.getFacetedMinMaxValues && e.options.getFacetedMinMaxValues(e, '__global__')),
        (e.getGlobalFacetedMinMaxValues = () => {
          if (e._getGlobalFacetedMinMaxValues) return e._getGlobalFacetedMinMaxValues();
        });
    },
  },
  Tt = {
    getInitialState: (e) => ({ globalFilter: void 0, ...e }),
    getDefaultOptions: (e) => ({
      onGlobalFilterChange: P('globalFilter', e),
      globalFilterFn: 'auto',
      getColumnCanGlobalFilter: (o) => {
        var t;
        const n =
          (t = e.getCoreRowModel().flatRows[0]) == null ||
          (t = t._getAllCellsByColumnId()[o.id]) == null
            ? void 0
            : t.getValue();
        return typeof n == 'string' || typeof n == 'number';
      },
    }),
    createColumn: (e, o) => {
      e.getCanGlobalFilter = () => {
        var t, n, r, i;
        return (
          ((t = e.columnDef.enableGlobalFilter) != null ? t : !0) &&
          ((n = o.options.enableGlobalFilter) != null ? n : !0) &&
          ((r = o.options.enableFilters) != null ? r : !0) &&
          ((i =
            o.options.getColumnCanGlobalFilter == null
              ? void 0
              : o.options.getColumnCanGlobalFilter(e)) != null
            ? i
            : !0) &&
          !!e.accessorFn
        );
      };
    },
    createTable: (e) => {
      (e.getGlobalAutoFilterFn = () => I.includesString),
        (e.getGlobalFilterFn = () => {
          var o, t;
          const { globalFilterFn: n } = e.options;
          return Q(n)
            ? n
            : n === 'auto'
              ? e.getGlobalAutoFilterFn()
              : (o = (t = e.options.filterFns) == null ? void 0 : t[n]) != null
                ? o
                : I[n];
        }),
        (e.setGlobalFilter = (o) => {
          e.options.onGlobalFilterChange == null || e.options.onGlobalFilterChange(o);
        }),
        (e.resetGlobalFilter = (o) => {
          e.setGlobalFilter(o ? void 0 : e.initialState.globalFilter);
        });
    },
  },
  Ot = {
    getInitialState: (e) => ({ expanded: {}, ...e }),
    getDefaultOptions: (e) => ({ onExpandedChange: P('expanded', e), paginateExpandedRows: !0 }),
    createTable: (e) => {
      let o = !1,
        t = !1;
      (e._autoResetExpanded = () => {
        var n, r;
        if (!o) {
          e._queue(() => {
            o = !0;
          });
          return;
        }
        if (
          (n = (r = e.options.autoResetAll) != null ? r : e.options.autoResetExpanded) != null
            ? n
            : !e.options.manualExpanding
        ) {
          if (t) return;
          (t = !0),
            e._queue(() => {
              e.resetExpanded(), (t = !1);
            });
        }
      }),
        (e.setExpanded = (n) =>
          e.options.onExpandedChange == null ? void 0 : e.options.onExpandedChange(n)),
        (e.toggleAllRowsExpanded = (n) => {
          (n ?? !e.getIsAllRowsExpanded()) ? e.setExpanded(!0) : e.setExpanded({});
        }),
        (e.resetExpanded = (n) => {
          var r, i;
          e.setExpanded(
            n ? {} : (r = (i = e.initialState) == null ? void 0 : i.expanded) != null ? r : {},
          );
        }),
        (e.getCanSomeRowsExpand = () =>
          e.getPrePaginationRowModel().flatRows.some((n) => n.getCanExpand())),
        (e.getToggleAllRowsExpandedHandler = () => (n) => {
          n.persist == null || n.persist(), e.toggleAllRowsExpanded();
        }),
        (e.getIsSomeRowsExpanded = () => {
          const n = e.getState().expanded;
          return n === !0 || Object.values(n).some(Boolean);
        }),
        (e.getIsAllRowsExpanded = () => {
          const n = e.getState().expanded;
          return typeof n == 'boolean'
            ? n === !0
            : !(!Object.keys(n).length || e.getRowModel().flatRows.some((r) => !r.getIsExpanded()));
        }),
        (e.getExpandedDepth = () => {
          let n = 0;
          return (
            (e.getState().expanded === !0
              ? Object.keys(e.getRowModel().rowsById)
              : Object.keys(e.getState().expanded)
            ).forEach((i) => {
              const l = i.split('.');
              n = Math.max(n, l.length);
            }),
            n
          );
        }),
        (e.getPreExpandedRowModel = () => e.getSortedRowModel()),
        (e.getExpandedRowModel = () => (
          !e._getExpandedRowModel &&
            e.options.getExpandedRowModel &&
            (e._getExpandedRowModel = e.options.getExpandedRowModel(e)),
          e.options.manualExpanding || !e._getExpandedRowModel
            ? e.getPreExpandedRowModel()
            : e._getExpandedRowModel()
        ));
    },
    createRow: (e, o) => {
      (e.toggleExpanded = (t) => {
        o.setExpanded((n) => {
          var r;
          const i = n === !0 ? !0 : !!(n != null && n[e.id]);
          let l = {};
          if (
            (n === !0
              ? Object.keys(o.getRowModel().rowsById).forEach((s) => {
                  l[s] = !0;
                })
              : (l = n),
            (t = (r = t) != null ? r : !i),
            !i && t)
          )
            return { ...l, [e.id]: !0 };
          if (i && !t) {
            const { [e.id]: s, ...u } = l;
            return u;
          }
          return n;
        });
      }),
        (e.getIsExpanded = () => {
          var t;
          const n = o.getState().expanded;
          return !!((t =
            o.options.getIsRowExpanded == null ? void 0 : o.options.getIsRowExpanded(e)) != null
            ? t
            : n === !0 || (n != null && n[e.id]));
        }),
        (e.getCanExpand = () => {
          var t, n, r;
          return (t = o.options.getRowCanExpand == null ? void 0 : o.options.getRowCanExpand(e)) !=
            null
            ? t
            : ((n = o.options.enableExpanding) != null ? n : !0) &&
                !!((r = e.subRows) != null && r.length);
        }),
        (e.getIsAllParentsExpanded = () => {
          let t = !0,
            n = e;
          while (t && n.parentId) (n = o.getRow(n.parentId, !0)), (t = n.getIsExpanded());
          return t;
        }),
        (e.getToggleExpandedHandler = () => {
          const t = e.getCanExpand();
          return () => {
            t && e.toggleExpanded();
          };
        });
    },
  },
  ue = 0,
  ae = 10,
  ie = () => ({ pageIndex: ue, pageSize: ae }),
  jt = {
    getInitialState: (e) => ({
      ...e,
      pagination: { ...ie(), ...(e == null ? void 0 : e.pagination) },
    }),
    getDefaultOptions: (e) => ({ onPaginationChange: P('pagination', e) }),
    createTable: (e) => {
      let o = !1,
        t = !1;
      (e._autoResetPageIndex = () => {
        var n, r;
        if (!o) {
          e._queue(() => {
            o = !0;
          });
          return;
        }
        if (
          (n = (r = e.options.autoResetAll) != null ? r : e.options.autoResetPageIndex) != null
            ? n
            : !e.options.manualPagination
        ) {
          if (t) return;
          (t = !0),
            e._queue(() => {
              e.resetPageIndex(), (t = !1);
            });
        }
      }),
        (e.setPagination = (n) => {
          const r = (i) => D(n, i);
          return e.options.onPaginationChange == null ? void 0 : e.options.onPaginationChange(r);
        }),
        (e.resetPagination = (n) => {
          var r;
          e.setPagination(n ? ie() : (r = e.initialState.pagination) != null ? r : ie());
        }),
        (e.setPageIndex = (n) => {
          e.setPagination((r) => {
            let i = D(n, r.pageIndex);
            const l =
              typeof e.options.pageCount > 'u' || e.options.pageCount === -1
                ? Number.MAX_SAFE_INTEGER
                : e.options.pageCount - 1;
            return (i = Math.max(0, Math.min(i, l))), { ...r, pageIndex: i };
          });
        }),
        (e.resetPageIndex = (n) => {
          var r, i;
          e.setPageIndex(
            n
              ? ue
              : (r =
                    (i = e.initialState) == null || (i = i.pagination) == null
                      ? void 0
                      : i.pageIndex) != null
                ? r
                : ue,
          );
        }),
        (e.resetPageSize = (n) => {
          var r, i;
          e.setPageSize(
            n
              ? ae
              : (r =
                    (i = e.initialState) == null || (i = i.pagination) == null
                      ? void 0
                      : i.pageSize) != null
                ? r
                : ae,
          );
        }),
        (e.setPageSize = (n) => {
          e.setPagination((r) => {
            const i = Math.max(1, D(n, r.pageSize)),
              l = r.pageSize * r.pageIndex,
              s = Math.floor(l / i);
            return { ...r, pageIndex: s, pageSize: i };
          });
        }),
        (e.setPageCount = (n) =>
          e.setPagination((r) => {
            var i;
            let l = D(n, (i = e.options.pageCount) != null ? i : -1);
            return typeof l == 'number' && (l = Math.max(-1, l)), { ...r, pageCount: l };
          })),
        (e.getPageOptions = S(
          () => [e.getPageCount()],
          (n) => {
            let r = [];
            return n && n > 0 && (r = [...new Array(n)].fill(null).map((i, l) => l)), r;
          },
          C(e.options, 'debugTable'),
        )),
        (e.getCanPreviousPage = () => e.getState().pagination.pageIndex > 0),
        (e.getCanNextPage = () => {
          const { pageIndex: n } = e.getState().pagination,
            r = e.getPageCount();
          return r === -1 ? !0 : r === 0 ? !1 : n < r - 1;
        }),
        (e.previousPage = () => e.setPageIndex((n) => n - 1)),
        (e.nextPage = () => e.setPageIndex((n) => n + 1)),
        (e.firstPage = () => e.setPageIndex(0)),
        (e.lastPage = () => e.setPageIndex(e.getPageCount() - 1)),
        (e.getPrePaginationRowModel = () => e.getExpandedRowModel()),
        (e.getPaginationRowModel = () => (
          !e._getPaginationRowModel &&
            e.options.getPaginationRowModel &&
            (e._getPaginationRowModel = e.options.getPaginationRowModel(e)),
          e.options.manualPagination || !e._getPaginationRowModel
            ? e.getPrePaginationRowModel()
            : e._getPaginationRowModel()
        )),
        (e.getPageCount = () => {
          var n;
          return (n = e.options.pageCount) != null
            ? n
            : Math.ceil(e.getRowCount() / e.getState().pagination.pageSize);
        }),
        (e.getRowCount = () => {
          var n;
          return (n = e.options.rowCount) != null ? n : e.getPrePaginationRowModel().rows.length;
        });
    },
  },
  le = () => ({ top: [], bottom: [] }),
  Nt = {
    getInitialState: (e) => ({ rowPinning: le(), ...e }),
    getDefaultOptions: (e) => ({ onRowPinningChange: P('rowPinning', e) }),
    createRow: (e, o) => {
      (e.pin = (t, n, r) => {
        const i = n
            ? e.getLeafRows().map((u) => {
                const { id: g } = u;
                return g;
              })
            : [],
          l = r
            ? e.getParentRows().map((u) => {
                const { id: g } = u;
                return g;
              })
            : [],
          s = new Set([...l, e.id, ...i]);
        o.setRowPinning((u) => {
          var g, c;
          if (t === 'bottom') {
            var m, d;
            return {
              top: ((m = u == null ? void 0 : u.top) != null ? m : []).filter(
                (p) => !(s != null && s.has(p)),
              ),
              bottom: [
                ...((d = u == null ? void 0 : u.bottom) != null ? d : []).filter(
                  (p) => !(s != null && s.has(p)),
                ),
                ...Array.from(s),
              ],
            };
          }
          if (t === 'top') {
            var a, f;
            return {
              top: [
                ...((a = u == null ? void 0 : u.top) != null ? a : []).filter(
                  (p) => !(s != null && s.has(p)),
                ),
                ...Array.from(s),
              ],
              bottom: ((f = u == null ? void 0 : u.bottom) != null ? f : []).filter(
                (p) => !(s != null && s.has(p)),
              ),
            };
          }
          return {
            top: ((g = u == null ? void 0 : u.top) != null ? g : []).filter(
              (p) => !(s != null && s.has(p)),
            ),
            bottom: ((c = u == null ? void 0 : u.bottom) != null ? c : []).filter(
              (p) => !(s != null && s.has(p)),
            ),
          };
        });
      }),
        (e.getCanPin = () => {
          var t;
          const { enableRowPinning: n, enablePinning: r } = o.options;
          return typeof n == 'function' ? n(e) : (t = n ?? r) != null ? t : !0;
        }),
        (e.getIsPinned = () => {
          const t = [e.id],
            { top: n, bottom: r } = o.getState().rowPinning,
            i = t.some((s) => (n == null ? void 0 : n.includes(s))),
            l = t.some((s) => (r == null ? void 0 : r.includes(s)));
          return i ? 'top' : l ? 'bottom' : !1;
        }),
        (e.getPinnedIndex = () => {
          var t, n;
          const r = e.getIsPinned();
          if (!r) return -1;
          const i =
            (t = r === 'top' ? o.getTopRows() : o.getBottomRows()) == null
              ? void 0
              : t.map((l) => {
                  const { id: s } = l;
                  return s;
                });
          return (n = i == null ? void 0 : i.indexOf(e.id)) != null ? n : -1;
        });
    },
    createTable: (e) => {
      (e.setRowPinning = (o) =>
        e.options.onRowPinningChange == null ? void 0 : e.options.onRowPinningChange(o)),
        (e.resetRowPinning = (o) => {
          var t, n;
          return e.setRowPinning(
            o
              ? le()
              : (t = (n = e.initialState) == null ? void 0 : n.rowPinning) != null
                ? t
                : le(),
          );
        }),
        (e.getIsSomeRowsPinned = (o) => {
          var t;
          const n = e.getState().rowPinning;
          if (!o) {
            var r, i;
            return !!(((r = n.top) != null && r.length) || ((i = n.bottom) != null && i.length));
          }
          return !!((t = n[o]) != null && t.length);
        }),
        (e._getPinnedRows = (o, t, n) => {
          var r;
          return (
            (r = e.options.keepPinnedRows) == null || r
              ? (t ?? []).map((l) => {
                  const s = e.getRow(l, !0);
                  return s.getIsAllParentsExpanded() ? s : null;
                })
              : (t ?? []).map((l) => o.find((s) => s.id === l))
          )
            .filter(Boolean)
            .map((l) => ({ ...l, position: n }));
        }),
        (e.getTopRows = S(
          () => [e.getRowModel().rows, e.getState().rowPinning.top],
          (o, t) => e._getPinnedRows(o, t, 'top'),
          C(e.options, 'debugRows'),
        )),
        (e.getBottomRows = S(
          () => [e.getRowModel().rows, e.getState().rowPinning.bottom],
          (o, t) => e._getPinnedRows(o, t, 'bottom'),
          C(e.options, 'debugRows'),
        )),
        (e.getCenterRows = S(
          () => [e.getRowModel().rows, e.getState().rowPinning.top, e.getState().rowPinning.bottom],
          (o, t, n) => {
            const r = new Set([...(t ?? []), ...(n ?? [])]);
            return o.filter((i) => !r.has(i.id));
          },
          C(e.options, 'debugRows'),
        ));
    },
  },
  kt = {
    getInitialState: (e) => ({ rowSelection: {}, ...e }),
    getDefaultOptions: (e) => ({
      onRowSelectionChange: P('rowSelection', e),
      enableRowSelection: !0,
      enableMultiRowSelection: !0,
      enableSubRowSelection: !0,
    }),
    createTable: (e) => {
      (e.setRowSelection = (o) =>
        e.options.onRowSelectionChange == null ? void 0 : e.options.onRowSelectionChange(o)),
        (e.resetRowSelection = (o) => {
          var t;
          return e.setRowSelection(o ? {} : (t = e.initialState.rowSelection) != null ? t : {});
        }),
        (e.toggleAllRowsSelected = (o) => {
          e.setRowSelection((t) => {
            o = typeof o < 'u' ? o : !e.getIsAllRowsSelected();
            const n = { ...t },
              r = e.getPreGroupedRowModel().flatRows;
            return (
              o
                ? r.forEach((i) => {
                    i.getCanSelect() && (n[i.id] = !0);
                  })
                : r.forEach((i) => {
                    delete n[i.id];
                  }),
              n
            );
          });
        }),
        (e.toggleAllPageRowsSelected = (o) =>
          e.setRowSelection((t) => {
            const n = typeof o < 'u' ? o : !e.getIsAllPageRowsSelected(),
              r = { ...t };
            return (
              e.getRowModel().rows.forEach((i) => {
                ge(r, i.id, n, !0, e);
              }),
              r
            );
          })),
        (e.getPreSelectedRowModel = () => e.getCoreRowModel()),
        (e.getSelectedRowModel = S(
          () => [e.getState().rowSelection, e.getCoreRowModel()],
          (o, t) => (Object.keys(o).length ? se(e, t) : { rows: [], flatRows: [], rowsById: {} }),
          C(e.options, 'debugTable'),
        )),
        (e.getFilteredSelectedRowModel = S(
          () => [e.getState().rowSelection, e.getFilteredRowModel()],
          (o, t) => (Object.keys(o).length ? se(e, t) : { rows: [], flatRows: [], rowsById: {} }),
          C(e.options, 'debugTable'),
        )),
        (e.getGroupedSelectedRowModel = S(
          () => [e.getState().rowSelection, e.getSortedRowModel()],
          (o, t) => (Object.keys(o).length ? se(e, t) : { rows: [], flatRows: [], rowsById: {} }),
          C(e.options, 'debugTable'),
        )),
        (e.getIsAllRowsSelected = () => {
          const o = e.getFilteredRowModel().flatRows,
            { rowSelection: t } = e.getState();
          let n = !!(o.length && Object.keys(t).length);
          return n && o.some((r) => r.getCanSelect() && !t[r.id]) && (n = !1), n;
        }),
        (e.getIsAllPageRowsSelected = () => {
          const o = e.getPaginationRowModel().flatRows.filter((r) => r.getCanSelect()),
            { rowSelection: t } = e.getState();
          let n = !!o.length;
          return n && o.some((r) => !t[r.id]) && (n = !1), n;
        }),
        (e.getIsSomeRowsSelected = () => {
          var o;
          const t = Object.keys((o = e.getState().rowSelection) != null ? o : {}).length;
          return t > 0 && t < e.getFilteredRowModel().flatRows.length;
        }),
        (e.getIsSomePageRowsSelected = () => {
          const o = e.getPaginationRowModel().flatRows;
          return e.getIsAllPageRowsSelected()
            ? !1
            : o
                .filter((t) => t.getCanSelect())
                .some((t) => t.getIsSelected() || t.getIsSomeSelected());
        }),
        (e.getToggleAllRowsSelectedHandler = () => (o) => {
          e.toggleAllRowsSelected(o.target.checked);
        }),
        (e.getToggleAllPageRowsSelectedHandler = () => (o) => {
          e.toggleAllPageRowsSelected(o.target.checked);
        });
    },
    createRow: (e, o) => {
      (e.toggleSelected = (t, n) => {
        const r = e.getIsSelected();
        o.setRowSelection((i) => {
          var l;
          if (((t = typeof t < 'u' ? t : !r), e.getCanSelect() && r === t)) return i;
          const s = { ...i };
          return ge(s, e.id, t, (l = n == null ? void 0 : n.selectChildren) != null ? l : !0, o), s;
        });
      }),
        (e.getIsSelected = () => {
          const { rowSelection: t } = o.getState();
          return pe(e, t);
        }),
        (e.getIsSomeSelected = () => {
          const { rowSelection: t } = o.getState();
          return de(e, t) === 'some';
        }),
        (e.getIsAllSubRowsSelected = () => {
          const { rowSelection: t } = o.getState();
          return de(e, t) === 'all';
        }),
        (e.getCanSelect = () => {
          var t;
          return typeof o.options.enableRowSelection == 'function'
            ? o.options.enableRowSelection(e)
            : (t = o.options.enableRowSelection) != null
              ? t
              : !0;
        }),
        (e.getCanSelectSubRows = () => {
          var t;
          return typeof o.options.enableSubRowSelection == 'function'
            ? o.options.enableSubRowSelection(e)
            : (t = o.options.enableSubRowSelection) != null
              ? t
              : !0;
        }),
        (e.getCanMultiSelect = () => {
          var t;
          return typeof o.options.enableMultiRowSelection == 'function'
            ? o.options.enableMultiRowSelection(e)
            : (t = o.options.enableMultiRowSelection) != null
              ? t
              : !0;
        }),
        (e.getToggleSelectedHandler = () => {
          const t = e.getCanSelect();
          return (n) => {
            var r;
            t && e.toggleSelected((r = n.target) == null ? void 0 : r.checked);
          };
        });
    },
  },
  ge = (e, o, t, n, r) => {
    var i;
    const l = r.getRow(o, !0);
    t
      ? (l.getCanMultiSelect() || Object.keys(e).forEach((s) => delete e[s]),
        l.getCanSelect() && (e[o] = !0))
      : delete e[o],
      n &&
        (i = l.subRows) != null &&
        i.length &&
        l.getCanSelectSubRows() &&
        l.subRows.forEach((s) => ge(e, s.id, t, n, r));
  };
function se(e, o) {
  const t = e.getState().rowSelection,
    n = [],
    r = {},
    i = (l, s) =>
      l
        .map((u) => {
          var g;
          const c = pe(u, t);
          if (
            (c && (n.push(u), (r[u.id] = u)),
            (g = u.subRows) != null && g.length && (u = { ...u, subRows: i(u.subRows) }),
            c)
          )
            return u;
        })
        .filter(Boolean);
  return { rows: i(o.rows), flatRows: n, rowsById: r };
}
function pe(e, o) {
  var t;
  return (t = o[e.id]) != null ? t : !1;
}
function de(e, o, t) {
  var n;
  if (!((n = e.subRows) != null && n.length)) return !1;
  let r = !0,
    i = !1;
  return (
    e.subRows.forEach((l) => {
      if (
        !(i && !r) &&
        (l.getCanSelect() && (pe(l, o) ? (i = !0) : (r = !1)), l.subRows && l.subRows.length)
      ) {
        const s = de(l, o);
        s === 'all' ? (i = !0) : (s === 'some' && (i = !0), (r = !1));
      }
    }),
    r ? 'all' : i ? 'some' : !1
  );
}
const ce = /([0-9]+)/gm,
  qt = (e, o, t) => lt(E(e.getValue(t)).toLowerCase(), E(o.getValue(t)).toLowerCase()),
  Bt = (e, o, t) => lt(E(e.getValue(t)), E(o.getValue(t))),
  Ut = (e, o, t) => me(E(e.getValue(t)).toLowerCase(), E(o.getValue(t)).toLowerCase()),
  Kt = (e, o, t) => me(E(e.getValue(t)), E(o.getValue(t))),
  Wt = (e, o, t) => {
    const n = e.getValue(t),
      r = o.getValue(t);
    return n > r ? 1 : n < r ? -1 : 0;
  },
  Xt = (e, o, t) => me(e.getValue(t), o.getValue(t));
function me(e, o) {
  return e === o ? 0 : e > o ? 1 : -1;
}
function E(e) {
  return typeof e == 'number'
    ? isNaN(e) || e === 1 / 0 || e === -1 / 0
      ? ''
      : String(e)
    : typeof e == 'string'
      ? e
      : '';
}
function lt(e, o) {
  const t = e.split(ce).filter(Boolean),
    n = o.split(ce).filter(Boolean);
  while (t.length && n.length) {
    const r = t.shift(),
      i = n.shift(),
      l = Number.parseInt(r, 10),
      s = Number.parseInt(i, 10),
      u = [l, s].sort();
    if (isNaN(u[0])) {
      if (r > i) return 1;
      if (i > r) return -1;
      continue;
    }
    if (isNaN(u[1])) return isNaN(l) ? -1 : 1;
    if (l > s) return 1;
    if (s > l) return -1;
  }
  return t.length - n.length;
}
const O = {
    alphanumeric: qt,
    alphanumericCaseSensitive: Bt,
    text: Ut,
    textCaseSensitive: Kt,
    datetime: Wt,
    basic: Xt,
  },
  Zt = {
    getInitialState: (e) => ({ sorting: [], ...e }),
    getDefaultColumnDef: () => ({ sortingFn: 'auto', sortUndefined: 1 }),
    getDefaultOptions: (e) => ({
      onSortingChange: P('sorting', e),
      isMultiSortEvent: (o) => o.shiftKey,
    }),
    createColumn: (e, o) => {
      (e.getAutoSortingFn = () => {
        const t = o.getFilteredRowModel().flatRows.slice(10);
        let n = !1;
        for (const r of t) {
          const i = r == null ? void 0 : r.getValue(e.id);
          if (Object.prototype.toString.call(i) === '[object Date]') return O.datetime;
          if (typeof i == 'string' && ((n = !0), i.split(ce).length > 1)) return O.alphanumeric;
        }
        return n ? O.text : O.basic;
      }),
        (e.getAutoSortDir = () => {
          const t = o.getFilteredRowModel().flatRows[0];
          return typeof (t == null ? void 0 : t.getValue(e.id)) == 'string' ? 'asc' : 'desc';
        }),
        (e.getSortingFn = () => {
          var t, n;
          if (!e) throw new Error();
          return Q(e.columnDef.sortingFn)
            ? e.columnDef.sortingFn
            : e.columnDef.sortingFn === 'auto'
              ? e.getAutoSortingFn()
              : (t = (n = o.options.sortingFns) == null ? void 0 : n[e.columnDef.sortingFn]) != null
                ? t
                : O[e.columnDef.sortingFn];
        }),
        (e.toggleSorting = (t, n) => {
          const r = e.getNextSortingOrder(),
            i = typeof t < 'u' && t !== null;
          o.setSorting((l) => {
            const s = l == null ? void 0 : l.find((a) => a.id === e.id),
              u = l == null ? void 0 : l.findIndex((a) => a.id === e.id);
            let g = [],
              c,
              m = i ? t : r === 'desc';
            if (
              (l != null && l.length && e.getCanMultiSort() && n
                ? s
                  ? (c = 'toggle')
                  : (c = 'add')
                : l != null && l.length && u !== l.length - 1
                  ? (c = 'replace')
                  : s
                    ? (c = 'toggle')
                    : (c = 'replace'),
              c === 'toggle' && (i || r || (c = 'remove')),
              c === 'add')
            ) {
              var d;
              (g = [...l, { id: e.id, desc: m }]),
                g.splice(
                  0,
                  g.length -
                    ((d = o.options.maxMultiSortColCount) != null ? d : Number.MAX_SAFE_INTEGER),
                );
            } else
              c === 'toggle'
                ? (g = l.map((a) => (a.id === e.id ? { ...a, desc: m } : a)))
                : c === 'remove'
                  ? (g = l.filter((a) => a.id !== e.id))
                  : (g = [{ id: e.id, desc: m }]);
            return g;
          });
        }),
        (e.getFirstSortDir = () => {
          var t, n;
          return (
            (t = (n = e.columnDef.sortDescFirst) != null ? n : o.options.sortDescFirst) != null
              ? t
              : e.getAutoSortDir() === 'desc'
          )
            ? 'desc'
            : 'asc';
        }),
        (e.getNextSortingOrder = (t) => {
          var n, r;
          const i = e.getFirstSortDir(),
            l = e.getIsSorted();
          return l
            ? l !== i &&
              ((n = o.options.enableSortingRemoval) == null || n) &&
              (!(t && (r = o.options.enableMultiRemove) != null) || r)
              ? !1
              : l === 'desc'
                ? 'asc'
                : 'desc'
            : i;
        }),
        (e.getCanSort = () => {
          var t, n;
          return (
            ((t = e.columnDef.enableSorting) != null ? t : !0) &&
            ((n = o.options.enableSorting) != null ? n : !0) &&
            !!e.accessorFn
          );
        }),
        (e.getCanMultiSort = () => {
          var t, n;
          return (t = (n = e.columnDef.enableMultiSort) != null ? n : o.options.enableMultiSort) !=
            null
            ? t
            : !!e.accessorFn;
        }),
        (e.getIsSorted = () => {
          var t;
          const n = (t = o.getState().sorting) == null ? void 0 : t.find((r) => r.id === e.id);
          return n ? (n.desc ? 'desc' : 'asc') : !1;
        }),
        (e.getSortIndex = () => {
          var t, n;
          return (t =
            (n = o.getState().sorting) == null ? void 0 : n.findIndex((r) => r.id === e.id)) != null
            ? t
            : -1;
        }),
        (e.clearSorting = () => {
          o.setSorting((t) => (t != null && t.length ? t.filter((n) => n.id !== e.id) : []));
        }),
        (e.getToggleSortingHandler = () => {
          const t = e.getCanSort();
          return (n) => {
            t &&
              (n.persist == null || n.persist(),
              e.toggleSorting == null ||
                e.toggleSorting(
                  void 0,
                  e.getCanMultiSort()
                    ? o.options.isMultiSortEvent == null
                      ? void 0
                      : o.options.isMultiSortEvent(n)
                    : !1,
                ));
          };
        });
    },
    createTable: (e) => {
      (e.setSorting = (o) =>
        e.options.onSortingChange == null ? void 0 : e.options.onSortingChange(o)),
        (e.resetSorting = (o) => {
          var t, n;
          e.setSorting(
            o ? [] : (t = (n = e.initialState) == null ? void 0 : n.sorting) != null ? t : [],
          );
        }),
        (e.getPreSortedRowModel = () => e.getGroupedRowModel()),
        (e.getSortedRowModel = () => (
          !e._getSortedRowModel &&
            e.options.getSortedRowModel &&
            (e._getSortedRowModel = e.options.getSortedRowModel(e)),
          e.options.manualSorting || !e._getSortedRowModel
            ? e.getPreSortedRowModel()
            : e._getSortedRowModel()
        ));
    },
  },
  Jt = [St, Lt, Dt, Et, wt, Rt, zt, Tt, Zt, Vt, Ot, jt, Nt, kt, Ht];
function Qt(e) {
  var o, t;
  const n = [...Jt, ...((o = e._features) != null ? o : [])];
  const r = { _features: n };
  const i = r._features.reduce(
      (d, a) => Object.assign(d, a.getDefaultOptions == null ? void 0 : a.getDefaultOptions(r)),
      {},
    ),
    l = (d) => (r.options.mergeOptions ? r.options.mergeOptions(i, d) : { ...i, ...d });
  let u = { ...{}, ...((t = e.initialState) != null ? t : {}) };
  r._features.forEach((d) => {
    var a;
    u = (a = d.getInitialState == null ? void 0 : d.getInitialState(u)) != null ? a : u;
  });
  const g = [];
  let c = !1;
  const m = {
    _features: n,
    options: { ...i, ...e },
    initialState: u,
    _queue: (d) => {
      g.push(d),
        c ||
          ((c = !0),
          Promise.resolve()
            .then(() => {
              while (g.length) g.shift()();
              c = !1;
            })
            .catch((a) =>
              setTimeout(() => {
                throw a;
              }),
            ));
    },
    reset: () => {
      r.setState(r.initialState);
    },
    setOptions: (d) => {
      const a = D(d, r.options);
      r.options = l(a);
    },
    getState: () => r.options.state,
    setState: (d) => {
      r.options.onStateChange == null || r.options.onStateChange(d);
    },
    _getRowId: (d, a, f) => {
      var p;
      return (p = r.options.getRowId == null ? void 0 : r.options.getRowId(d, a, f)) != null
        ? p
        : `${f ? [f.id, a].join('.') : a}`;
    },
    getCoreRowModel: () => (
      r._getCoreRowModel || (r._getCoreRowModel = r.options.getCoreRowModel(r)),
      r._getCoreRowModel()
    ),
    getRowModel: () => r.getPaginationRowModel(),
    getRow: (d, a) => {
      let f = (a ? r.getPrePaginationRowModel() : r.getRowModel()).rowsById[d];
      if (!f && ((f = r.getCoreRowModel().rowsById[d]), !f)) throw new Error();
      return f;
    },
    _getDefaultColumnDef: S(
      () => [r.options.defaultColumn],
      (d) => {
        var a;
        return (
          (d = (a = d) != null ? a : {}),
          {
            header: (f) => {
              const p = f.header.column.columnDef;
              return p.accessorKey ? p.accessorKey : p.accessorFn ? p.id : null;
            },
            cell: (f) => {
              var p, h;
              return (p =
                (h = f.renderValue()) == null || h.toString == null ? void 0 : h.toString()) != null
                ? p
                : null;
            },
            ...r._features.reduce(
              (f, p) =>
                Object.assign(f, p.getDefaultColumnDef == null ? void 0 : p.getDefaultColumnDef()),
              {},
            ),
            ...d,
          }
        );
      },
      C(e, 'debugColumns'),
    ),
    _getColumnDefs: () => r.options.columns,
    getAllColumns: S(
      () => [r._getColumnDefs()],
      (d) => {
        const a = (f, p, h) => (
          h === void 0 && (h = 0),
          f.map((w) => {
            const F = mt(r, w, h, p),
              x = w;
            return (F.columns = x.columns ? a(x.columns, F, h + 1) : []), F;
          })
        );
        return a(d);
      },
      C(e, 'debugColumns'),
    ),
    getAllFlatColumns: S(
      () => [r.getAllColumns()],
      (d) => d.flatMap((a) => a.getFlatColumns()),
      C(e, 'debugColumns'),
    ),
    _getAllFlatColumnsById: S(
      () => [r.getAllFlatColumns()],
      (d) => d.reduce((a, f) => ((a[f.id] = f), a), {}),
      C(e, 'debugColumns'),
    ),
    getAllLeafColumns: S(
      () => [r.getAllColumns(), r._getOrderColumnsFn()],
      (d, a) => {
        const f = d.flatMap((p) => p.getLeafColumns());
        return a(f);
      },
      C(e, 'debugColumns'),
    ),
    getColumn: (d) => r._getAllFlatColumnsById()[d],
  };
  Object.assign(r, m);
  for (let d = 0; d < r._features.length; d++) {
    const a = r._features[d];
    a == null || a.createTable == null || a.createTable(r);
  }
  return r;
}
function Yt() {
  return (e) =>
    S(
      () => [e.options.data],
      (o) => {
        const t = { rows: [], flatRows: [], rowsById: {} },
          n = (r, i, l) => {
            i === void 0 && (i = 0);
            const s = [];
            for (let g = 0; g < r.length; g++) {
              const c = Ct(
                e,
                e._getRowId(r[g], g, l),
                r[g],
                g,
                i,
                void 0,
                l == null ? void 0 : l.id,
              );
              if ((t.flatRows.push(c), (t.rowsById[c.id] = c), s.push(c), e.options.getSubRows)) {
                var u;
                (c.originalSubRows = e.options.getSubRows(r[g], g)),
                  (u = c.originalSubRows) != null &&
                    u.length &&
                    (c.subRows = n(c.originalSubRows, i + 1, c));
              }
            }
            return s;
          };
        return (t.rows = n(o)), t;
      },
      C(e.options, 'debugTable', 'getRowModel', () => e._autoResetPageIndex()),
    );
} /**
 * react-table
 *
 * Copyright (c) TanStack
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function ve(e, o) {
  return e ? (bt(e) ? L.createElement(e, o) : e) : null;
}
function bt(e) {
  return en(e) || typeof e == 'function' || tn(e);
}
function en(e) {
  return (
    typeof e == 'function' &&
    (() => {
      const o = Object.getPrototypeOf(e);
      return o.prototype && o.prototype.isReactComponent;
    })()
  );
}
function tn(e) {
  return (
    typeof e == 'object' &&
    typeof e.$$typeof == 'symbol' &&
    ['react.memo', 'react.forward_ref'].includes(e.$$typeof.description)
  );
}
function nn(e) {
  const o = { state: {}, onStateChange: () => {}, renderFallbackValue: null, ...e },
    [t] = L.useState(() => ({ current: Qt(o) })),
    [n, r] = L.useState(() => t.current.initialState);
  return (
    t.current.setOptions((i) => ({
      ...i,
      ...e,
      state: { ...n, ...e.state },
      onStateChange: (l) => {
        r(l), e.onStateChange == null || e.onStateChange(l);
      },
    })),
    t.current
  );
}
const on = 5;
function A({
  data: e,
  columns: o,
  getRowId: t,
  loading: n = !1,
  emptyText: r,
  onRowClick: i,
  pagination: l,
  onPaginationChange: s,
  paginationInfoTemplate: u,
  previousLabel: g,
  nextLabel: c,
  sorting: m,
  onSortingChange: d,
  rowSelection: a,
  onRowSelectionChange: f,
  batchActions: p,
  className: h,
}) {
  const w =
      a !== void 0
        ? [
            {
              id: '__select',
              header: ({ table: _ }) =>
                R.jsx(Ce, {
                  checked:
                    _.getIsAllPageRowsSelected() ||
                    (_.getIsSomePageRowsSelected() && 'indeterminate'),
                  onCheckedChange: (v) => _.toggleAllPageRowsSelected(!!v),
                  'aria-label': 'Select all',
                }),
              cell: ({ row: _ }) =>
                R.jsx(Ce, {
                  checked: _.getIsSelected(),
                  onCheckedChange: (v) => _.toggleSelected(!!v),
                  'aria-label': 'Select row',
                }),
              enableSorting: !1,
            },
            ...o,
          ]
        : o,
    F = nn({
      data: e,
      columns: w,
      getRowId: t,
      getCoreRowModel: Yt(),
      manualPagination: !0,
      pageCount: (l == null ? void 0 : l.totalPages) ?? -1,
      manualSorting: !0,
      state: { sorting: m ?? [], rowSelection: a ?? {} },
      onSortingChange: (_) => {
        if (!d) return;
        const v = typeof _ == 'function' ? _(m ?? []) : _;
        d(v);
      },
      onRowSelectionChange: (_) => {
        if (!f) return;
        const v = typeof _ == 'function' ? _(a ?? {}) : _;
        f(v);
      },
      enableRowSelection: a !== void 0,
    }),
    x = F.getHeaderGroups(),
    y = F.getRowModel().rows,
    V = w.length,
    T = Object.keys(a ?? {}).length;
  return R.jsxs('div', {
    className: b('space-y-4', h),
    children: [
      p && T > 0 && R.jsx('div', { className: 'flex items-center gap-2', children: p }),
      R.jsxs(st, {
        children: [
          R.jsx(ut, {
            children: x.map((_) =>
              R.jsx(
                W,
                {
                  children: _.headers.map((v) => {
                    const H = v.column.getCanSort(),
                      G = v.column.getIsSorted();
                    return R.jsxs(
                      at,
                      {
                        className: b(H && 'cursor-pointer select-none'),
                        onClick: H ? v.column.getToggleSortingHandler() : void 0,
                        children: [
                          v.isPlaceholder ? null : ve(v.column.columnDef.header, v.getContext()),
                          G === 'asc' && ' ↑',
                          G === 'desc' && ' ↓',
                        ],
                      },
                      v.id,
                    );
                  }),
                },
                _.id,
              ),
            ),
          }),
          R.jsxs(gt, {
            children: [
              n &&
                Array.from({ length: on }).map((_, v) =>
                  R.jsx(
                    W,
                    {
                      children: Array.from({ length: V }).map((H, G) =>
                        R.jsx(
                          ee,
                          { children: R.jsx(dt, { className: 'h-4 w-full' }) },
                          `skeleton-${v}-${G}`,
                        ),
                      ),
                    },
                    `skeleton-${v}`,
                  ),
                ),
              !n &&
                y.length === 0 &&
                R.jsx(W, {
                  children: R.jsx(ee, {
                    colSpan: V,
                    className: 'h-24 text-center text-muted-foreground',
                    children: r,
                  }),
                }),
              !n &&
                y.map((_) =>
                  R.jsx(
                    W,
                    {
                      'data-state': _.getIsSelected() ? 'selected' : void 0,
                      className: b(i && 'cursor-pointer'),
                      onClick: (v) => {
                        !i || v.target.closest('[data-slot="checkbox"]') || i(_.original);
                      },
                      children: _.getVisibleCells().map((v) =>
                        R.jsx(ee, { children: ve(v.column.columnDef.cell, v.getContext()) }, v.id),
                      ),
                    },
                    _.id,
                  ),
                ),
            ],
          }),
        ],
      }),
      l &&
        R.jsxs('div', {
          className: 'flex items-center justify-between px-2',
          children: [
            u
              ? R.jsx('span', {
                  className: 'text-sm text-muted-foreground',
                  children: u
                    .replace('{total}', String(l.totalElements))
                    .replace('{page}', String(l.page))
                    .replace('{pages}', String(l.totalPages)),
                })
              : R.jsx('span', {}),
            R.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                R.jsx(we, {
                  variant: 'outline',
                  size: 'sm',
                  ...(!g && { 'aria-label': 'previous page' }),
                  disabled: l.page <= 1,
                  onClick: () => (s == null ? void 0 : s({ ...l, page: l.page - 1 })),
                  children:
                    g ??
                    R.jsx('svg', {
                      xmlns: 'http://www.w3.org/2000/svg',
                      width: '16',
                      height: '16',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: '2',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      'aria-hidden': 'true',
                      children: R.jsx('polyline', { points: '15 18 9 12 15 6' }),
                    }),
                }),
                R.jsx(we, {
                  variant: 'outline',
                  size: 'sm',
                  ...(!c && { 'aria-label': 'next page' }),
                  disabled: l.page >= l.totalPages,
                  onClick: () => (s == null ? void 0 : s({ ...l, page: l.page + 1 })),
                  children:
                    c ??
                    R.jsx('svg', {
                      xmlns: 'http://www.w3.org/2000/svg',
                      width: '16',
                      height: '16',
                      viewBox: '0 0 24 24',
                      fill: 'none',
                      stroke: 'currentColor',
                      strokeWidth: '2',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      'aria-hidden': 'true',
                      children: R.jsx('polyline', { points: '9 18 15 12 9 6' }),
                    }),
                }),
              ],
            }),
          ],
        }),
    ],
  });
}
A.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxTable',
  props: {
    data: {
      required: !0,
      tsType: { name: 'Array', elements: [{ name: 'TData' }], raw: 'TData[]' },
      description: '',
    },
    columns: {
      required: !0,
      tsType: {
        name: 'Array',
        elements: [
          {
            name: 'ColumnDef',
            elements: [{ name: 'TData' }, { name: 'unknown' }],
            raw: 'ColumnDef<TData, unknown>',
          },
        ],
        raw: 'ColumnDef<TData, unknown>[]',
      },
      description: '',
    },
    getRowId: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(row: TData, index: number) => string',
        signature: {
          arguments: [
            { type: { name: 'TData' }, name: 'row' },
            { type: { name: 'number' }, name: 'index' },
          ],
          return: { name: 'string' },
        },
      },
      description: '',
    },
    loading: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '',
      defaultValue: { value: 'false', computed: !1 },
    },
    emptyText: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    onRowClick: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(row: TData) => void',
        signature: {
          arguments: [{ type: { name: 'TData' }, name: 'row' }],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    pagination: { required: !1, tsType: { name: 'NxTablePagination' }, description: '' },
    onPaginationChange: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(next: NxTablePagination) => void',
        signature: {
          arguments: [{ type: { name: 'NxTablePagination' }, name: 'next' }],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    paginationInfoTemplate: {
      required: !1,
      tsType: { name: 'string' },
      description: '分页信息模板，包含 {total}、{page}、{pages} 占位符。不传则不渲染分页信息文案',
    },
    previousLabel: {
      required: !1,
      tsType: { name: 'ReactNode' },
      description: '上一页按钮文案。不传则显示 SVG 箭头图标',
    },
    nextLabel: {
      required: !1,
      tsType: { name: 'ReactNode' },
      description: '下一页按钮文案。不传则显示 SVG 箭头图标',
    },
    sorting: { required: !1, tsType: { name: 'SortingState' }, description: '' },
    onSortingChange: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(next: SortingState) => void',
        signature: {
          arguments: [{ type: { name: 'SortingState' }, name: 'next' }],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    rowSelection: { required: !1, tsType: { name: 'RowSelectionState' }, description: '' },
    onRowSelectionChange: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(next: RowSelectionState) => void',
        signature: {
          arguments: [{ type: { name: 'RowSelectionState' }, name: 'next' }],
          return: { name: 'void' },
        },
      },
      description: '',
    },
    batchActions: {
      required: !1,
      tsType: { name: 'ReactNode' },
      description: '批量操作栏，选中行时显示',
    },
    className: { required: !1, tsType: { name: 'string' }, description: '' },
  },
};
const Y = [
    { id: '1', name: 'Alice Wang', email: 'alice@example.com', role: 'Admin', age: 30 },
    { id: '2', name: 'Bob Li', email: 'bob@example.com', role: 'Editor', age: 25 },
    { id: '3', name: 'Carol Zhang', email: 'carol@example.com', role: 'Viewer', age: 35 },
    { id: '4', name: 'Dave Chen', email: 'dave@example.com', role: 'Editor', age: 28 },
    { id: '5', name: 'Eve Liu', email: 'eve@example.com', role: 'Admin', age: 32 },
  ],
  z = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'age', header: 'Age' },
  ],
  gn = { title: 'L3/NxTable', component: A, parameters: { layout: 'padded' } },
  j = { render: () => R.jsx(A, { data: Y, columns: z, getRowId: (e) => e.id }) },
  N = { render: () => R.jsx(A, { data: [], columns: z, loading: !0 }) },
  k = { render: () => R.jsx(A, { data: [], columns: z, emptyText: 'No records found' }) },
  q = {
    render: () => {
      const [e, o] = L.useState([]);
      return R.jsx(A, {
        data: Y,
        columns: z,
        getRowId: (t) => t.id,
        sorting: e,
        onSortingChange: o,
      });
    },
  },
  B = {
    render: () => {
      const [e, o] = L.useState({});
      return R.jsx(A, {
        data: Y,
        columns: z,
        getRowId: (t) => t.id,
        rowSelection: e,
        onRowSelectionChange: o,
        batchActions: R.jsxs('span', {
          className: 'text-sm text-muted-foreground',
          children: [Object.keys(e).length, ' selected'],
        }),
      });
    },
  },
  U = {
    render: () => {
      const [e, o] = L.useState({ page: 1, size: 2, totalElements: 5, totalPages: 3 }),
        t = (e.page - 1) * e.size,
        n = Y.slice(t, t + e.size);
      return R.jsx(A, {
        data: n,
        columns: z,
        getRowId: (r) => r.id,
        pagination: e,
        onPaginationChange: o,
        paginationInfoTemplate: '共 {total} 条，第 {page} / {pages} 页',
        previousLabel: '上一页',
        nextLabel: '下一页',
      });
    },
  };
var _e, xe, Fe, $e, Pe;
j.parameters = {
  ...j.parameters,
  docs: {
    ...((_e = j.parameters) == null ? void 0 : _e.docs),
    source: {
      originalSource: `{
  render: () => <NxTable data={sampleData} columns={columns} getRowId={r => r.id} />
}`,
      ...((Fe = (xe = j.parameters) == null ? void 0 : xe.docs) == null ? void 0 : Fe.source),
    },
    description: {
      story: '基础用法：渲染列头和数据行',
      ...((Pe = ($e = j.parameters) == null ? void 0 : $e.docs) == null ? void 0 : Pe.description),
    },
  },
};
var ye, Me, Ve, Ie, De;
N.parameters = {
  ...N.parameters,
  docs: {
    ...((ye = N.parameters) == null ? void 0 : ye.docs),
    source: {
      originalSource: `{
  render: () => <NxTable data={[]} columns={columns} loading />
}`,
      ...((Ve = (Me = N.parameters) == null ? void 0 : Me.docs) == null ? void 0 : Ve.source),
    },
    description: {
      story: 'Loading 状态：显示 skeleton 占位',
      ...((De = (Ie = N.parameters) == null ? void 0 : Ie.docs) == null ? void 0 : De.description),
    },
  },
};
var Ee, Ae, He, Ge, Le;
k.parameters = {
  ...k.parameters,
  docs: {
    ...((Ee = k.parameters) == null ? void 0 : Ee.docs),
    source: {
      originalSource: `{
  render: () => <NxTable data={[]} columns={columns} emptyText="No records found" />
}`,
      ...((He = (Ae = k.parameters) == null ? void 0 : Ae.docs) == null ? void 0 : He.source),
    },
    description: {
      story: '空状态：无数据时显示提示',
      ...((Le = (Ge = k.parameters) == null ? void 0 : Ge.docs) == null ? void 0 : Le.description),
    },
  },
};
var ze, Te, Oe, je, Ne;
q.parameters = {
  ...q.parameters,
  docs: {
    ...((ze = q.parameters) == null ? void 0 : ze.docs),
    source: {
      originalSource: `{
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([]);
    return <NxTable data={sampleData} columns={columns} getRowId={r => r.id} sorting={sorting} onSortingChange={setSorting} />;
  }
}`,
      ...((Oe = (Te = q.parameters) == null ? void 0 : Te.docs) == null ? void 0 : Oe.source),
    },
    description: {
      story: '排序：点击列头切换排序方向',
      ...((Ne = (je = q.parameters) == null ? void 0 : je.docs) == null ? void 0 : Ne.description),
    },
  },
};
var ke, qe, Be, Ue, Ke;
B.parameters = {
  ...B.parameters,
  docs: {
    ...((ke = B.parameters) == null ? void 0 : ke.docs),
    source: {
      originalSource: `{
  render: () => {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    return <NxTable data={sampleData} columns={columns} getRowId={r => r.id} rowSelection={rowSelection} onRowSelectionChange={setRowSelection} batchActions={<span className="text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} selected
          </span>} />;
  }
}`,
      ...((Be = (qe = B.parameters) == null ? void 0 : qe.docs) == null ? void 0 : Be.source),
    },
    description: {
      story: '行选择：checkbox 选择行',
      ...((Ke = (Ue = B.parameters) == null ? void 0 : Ue.docs) == null ? void 0 : Ke.description),
    },
  },
};
var We, Xe, Ze, Je, Qe;
U.parameters = {
  ...U.parameters,
  docs: {
    ...((We = U.parameters) == null ? void 0 : We.docs),
    source: {
      originalSource: `{
  render: () => {
    const [pagination, setPagination] = useState<NxTablePagination>({
      page: 1,
      size: 2,
      totalElements: 5,
      totalPages: 3
    });

    // 简单模拟分页切片
    const start = (pagination.page - 1) * pagination.size;
    const pageData = sampleData.slice(start, start + pagination.size);
    return <NxTable data={pageData} columns={columns} getRowId={r => r.id} pagination={pagination} onPaginationChange={setPagination} paginationInfoTemplate="共 {total} 条，第 {page} / {pages} 页" previousLabel="上一页" nextLabel="下一页" />;
  }
}`,
      ...((Ze = (Xe = U.parameters) == null ? void 0 : Xe.docs) == null ? void 0 : Ze.source),
    },
    description: {
      story: '分页：底部分页控件',
      ...((Qe = (Je = U.parameters) == null ? void 0 : Je.docs) == null ? void 0 : Qe.description),
    },
  },
};
const dn = ['Default', 'Loading', 'Empty', 'WithSorting', 'WithSelection', 'WithPagination'];
export {
  j as Default,
  k as Empty,
  N as Loading,
  U as WithPagination,
  B as WithSelection,
  q as WithSorting,
  dn as __namedExportsOrder,
  gn as default,
};
