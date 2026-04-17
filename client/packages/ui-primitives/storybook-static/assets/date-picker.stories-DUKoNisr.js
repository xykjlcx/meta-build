import { B as Gn, b as ht } from './button-BqedyRxs.js';
import { C as Qn } from './chevron-down-DwYvEpJJ.js';
import { C as Vn } from './chevron-right-BOrzOjK1.js';
import { c as $n } from './createLucideIcon-D27BUxB9.js';
import { r as T, R as m } from './index-B3e6rcmj.js';
import { C as Jn, P as Kn, T as Un, R as Xn } from './index-tTUmRSZg.js';
import { j } from './jsx-runtime-BjG_zV1W.js';
import { c as Y } from './utils-BQHNewu7.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-D1SQP9Z-.js';
import './index-DuVyFFjR.js';
import './index-DclwlaNk.js';
import './index-BAgrSUEs.js';
import './index-CnCkN4Kb.js';
import './index-Tk7B4GT7.js';
import './index-JG1J0hlI.js';
import './index-CLFlh7pk.js';
import './index-D8RfjXkI.js';
import './index-CXzmB-r4.js';
import './index-BVSSuIN4.js';
import './index-D61X6AnJ.js';
import './index-npCAFBsl.js';
import './index-BsSyydlo.js'; /**
 * @license lucide-react v1.8.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Zn = [['path', { d: 'm15 18-6-6 6-6', key: '1wnfg3' }]],
  Ln = $n('chevron-left', Zn);
function er(e, t, n = 'long') {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', timeZone: e, timeZoneName: n })
    .format(t)
    .split(/\s/g)
    .slice(2)
    .join(' ');
}
const Ge = {},
  De = {};
function ce(e, t) {
  try {
    const r = (
      Ge[e] ||
      (Ge[e] = new Intl.DateTimeFormat('en-US', { timeZone: e, timeZoneName: 'longOffset' }).format)
    )(t).split('GMT')[1];
    return r in De ? De[r] : mt(r, r.split(':'));
  } catch {
    if (e in De) return De[e];
    const n = e == null ? void 0 : e.match(tr);
    return n ? mt(e, n.slice(1)) : Number.NaN;
  }
}
const tr = /([+-]\d\d):?(\d\d)?/;
function mt(e, t) {
  const n = +(t[0] || 0),
    r = +(t[1] || 0),
    a = +(t[2] || 0) / 60;
  return (De[e] = n * 60 + r > 0 ? n * 60 + r + a : n * 60 - r - a);
}
class L extends Date {
  constructor(...t) {
    super(),
      t.length > 1 && typeof t[t.length - 1] == 'string' && (this.timeZone = t.pop()),
      (this.internal = new Date()),
      isNaN(ce(this.timeZone, this))
        ? this.setTime(Number.NaN)
        : t.length
          ? typeof t[0] == 'number' &&
            (t.length === 1 || (t.length === 2 && typeof t[1] != 'number'))
            ? this.setTime(t[0])
            : typeof t[0] == 'string'
              ? this.setTime(+new Date(t[0]))
              : t[0] instanceof Date
                ? this.setTime(+t[0])
                : (this.setTime(+new Date(...t)), qt(this), Ke(this))
          : this.setTime(Date.now());
  }
  static tz(t, ...n) {
    return n.length ? new L(...n, t) : new L(Date.now(), t);
  }
  withTimeZone(t) {
    return new L(+this, t);
  }
  getTimezoneOffset() {
    const t = -ce(this.timeZone, this);
    return t > 0 ? Math.floor(t) : Math.ceil(t);
  }
  setTime(t) {
    return Date.prototype.setTime.apply(this, arguments), Ke(this), +this;
  }
  [Symbol.for('constructDateFrom')](t) {
    return new L(+new Date(t), this.timeZone);
  }
}
const yt = /^(get|set)(?!UTC)/;
Object.getOwnPropertyNames(Date.prototype).forEach((e) => {
  if (!yt.test(e)) return;
  const t = e.replace(yt, '$1UTC');
  L.prototype[t] &&
    (e.startsWith('get')
      ? (L.prototype[e] = function () {
          return this.internal[t]();
        })
      : ((L.prototype[e] = function () {
          return Date.prototype[t].apply(this.internal, arguments), nr(this), +this;
        }),
        (L.prototype[t] = function () {
          return Date.prototype[t].apply(this, arguments), Ke(this), +this;
        })));
});
function Ke(e) {
  e.internal.setTime(+e),
    e.internal.setUTCSeconds(e.internal.getUTCSeconds() - Math.round(-ce(e.timeZone, e) * 60));
}
function nr(e) {
  Date.prototype.setFullYear.call(
    e,
    e.internal.getUTCFullYear(),
    e.internal.getUTCMonth(),
    e.internal.getUTCDate(),
  ),
    Date.prototype.setHours.call(
      e,
      e.internal.getUTCHours(),
      e.internal.getUTCMinutes(),
      e.internal.getUTCSeconds(),
      e.internal.getUTCMilliseconds(),
    ),
    qt(e);
}
function qt(e) {
  const t = ce(e.timeZone, e),
    n = t > 0 ? Math.floor(t) : Math.ceil(t),
    r = new Date(+e);
  r.setUTCHours(r.getUTCHours() - 1);
  const a = -new Date(+e).getTimezoneOffset(),
    o = -new Date(+r).getTimezoneOffset(),
    s = a - o,
    i = Date.prototype.getHours.apply(e) !== e.internal.getUTCHours();
  s && i && e.internal.setUTCMinutes(e.internal.getUTCMinutes() + s);
  const c = a - n;
  c && Date.prototype.setUTCMinutes.call(e, Date.prototype.getUTCMinutes.call(e) + c);
  const u = new Date(+e);
  u.setUTCSeconds(0);
  const d = a > 0 ? u.getSeconds() : (u.getSeconds() - 60) % 60,
    l = Math.round(-(ce(e.timeZone, e) * 60)) % 60;
  (l || d) &&
    (e.internal.setUTCSeconds(e.internal.getUTCSeconds() + l),
    Date.prototype.setUTCSeconds.call(e, Date.prototype.getUTCSeconds.call(e) + l + d));
  const h = ce(e.timeZone, e),
    y = h > 0 ? Math.floor(h) : Math.ceil(h),
    p = -new Date(+e).getTimezoneOffset() - y,
    M = y !== n,
    N = p - c;
  if (M && N) {
    Date.prototype.setUTCMinutes.call(e, Date.prototype.getUTCMinutes.call(e) + N);
    const w = ce(e.timeZone, e),
      g = w > 0 ? Math.floor(w) : Math.ceil(w),
      W = y - g;
    W &&
      (e.internal.setUTCMinutes(e.internal.getUTCMinutes() + W),
      Date.prototype.setUTCMinutes.call(e, Date.prototype.getUTCMinutes.call(e) + W));
  }
}
class A extends L {
  static tz(t, ...n) {
    return n.length ? new A(...n, t) : new A(Date.now(), t);
  }
  toISOString() {
    const [t, n, r] = this.tzComponents(),
      a = `${t}${n}:${r}`;
    return this.internal.toISOString().slice(0, -1) + a;
  }
  toString() {
    return `${this.toDateString()} ${this.toTimeString()}`;
  }
  toDateString() {
    const [t, n, r, a] = this.internal.toUTCString().split(' ');
    return `${t == null ? void 0 : t.slice(0, -1)} ${r} ${n} ${a}`;
  }
  toTimeString() {
    const t = this.internal.toUTCString().split(' ')[4],
      [n, r, a] = this.tzComponents();
    return `${t} GMT${n}${r}${a} (${er(this.timeZone, this)})`;
  }
  toLocaleString(t, n) {
    return Date.prototype.toLocaleString.call(this, t, {
      ...n,
      timeZone: (n == null ? void 0 : n.timeZone) || this.timeZone,
    });
  }
  toLocaleDateString(t, n) {
    return Date.prototype.toLocaleDateString.call(this, t, {
      ...n,
      timeZone: (n == null ? void 0 : n.timeZone) || this.timeZone,
    });
  }
  toLocaleTimeString(t, n) {
    return Date.prototype.toLocaleTimeString.call(this, t, {
      ...n,
      timeZone: (n == null ? void 0 : n.timeZone) || this.timeZone,
    });
  }
  tzComponents() {
    const t = this.getTimezoneOffset(),
      n = t > 0 ? '-' : '+',
      r = String(Math.floor(Math.abs(t) / 60)).padStart(2, '0'),
      a = String(Math.abs(t) % 60).padStart(2, '0');
    return [n, r, a];
  }
  withTimeZone(t) {
    return new A(+this, t);
  }
  [Symbol.for('constructDateFrom')](t) {
    return new A(+new Date(t), this.timeZone);
  }
}
const Ht = 6048e5,
  rr = 864e5,
  gt = Symbol.for('constructDateFrom');
function q(e, t) {
  return typeof e == 'function'
    ? e(t)
    : e && typeof e == 'object' && gt in e
      ? e[gt](t)
      : e instanceof Date
        ? new e.constructor(t)
        : new Date(t);
}
function E(e, t) {
  return q(t || e, e);
}
function At(e, t, n) {
  const r = E(e, n == null ? void 0 : n.in);
  return isNaN(t) ? q(e, Number.NaN) : (t && r.setDate(r.getDate() + t), r);
}
function zt(e, t, n) {
  const r = E(e, n == null ? void 0 : n.in);
  if (isNaN(t)) return q(e, Number.NaN);
  if (!t) return r;
  const a = r.getDate(),
    o = q(e, r.getTime());
  o.setMonth(r.getMonth() + t + 1, 0);
  const s = o.getDate();
  return a >= s ? o : (r.setFullYear(o.getFullYear(), o.getMonth(), a), r);
}
const ar = {};
function Oe() {
  return ar;
}
function he(e, t) {
  var i, c, u, d;
  const n = Oe(),
    r =
      (t == null ? void 0 : t.weekStartsOn) ??
      ((c = (i = t == null ? void 0 : t.locale) == null ? void 0 : i.options) == null
        ? void 0
        : c.weekStartsOn) ??
      n.weekStartsOn ??
      ((d = (u = n.locale) == null ? void 0 : u.options) == null ? void 0 : d.weekStartsOn) ??
      0,
    a = E(e, t == null ? void 0 : t.in),
    o = a.getDay(),
    s = (o < r ? 7 : 0) + o - r;
  return a.setDate(a.getDate() - s), a.setHours(0, 0, 0, 0), a;
}
function Me(e, t) {
  return he(e, { ...t, weekStartsOn: 1 });
}
function Rt(e, t) {
  const n = E(e, t == null ? void 0 : t.in),
    r = n.getFullYear(),
    a = q(n, 0);
  a.setFullYear(r + 1, 0, 4), a.setHours(0, 0, 0, 0);
  const o = Me(a),
    s = q(n, 0);
  s.setFullYear(r, 0, 4), s.setHours(0, 0, 0, 0);
  const i = Me(s);
  return n.getTime() >= o.getTime() ? r + 1 : n.getTime() >= i.getTime() ? r : r - 1;
}
function wt(e) {
  const t = E(e),
    n = new Date(
      Date.UTC(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        t.getHours(),
        t.getMinutes(),
        t.getSeconds(),
        t.getMilliseconds(),
      ),
    );
  return n.setUTCFullYear(t.getFullYear()), +e - +n;
}
function me(e, ...t) {
  const n = q.bind(
    null,
    t.find((r) => typeof r == 'object'),
  );
  return t.map(n);
}
function ve(e, t) {
  const n = E(e, t == null ? void 0 : t.in);
  return n.setHours(0, 0, 0, 0), n;
}
function Je(e, t, n) {
  const [r, a] = me(n == null ? void 0 : n.in, e, t),
    o = ve(r),
    s = ve(a),
    i = +o - wt(o),
    c = +s - wt(s);
  return Math.round((i - c) / rr);
}
function or(e, t) {
  const n = Rt(e, t),
    r = q(e, 0);
  return r.setFullYear(n, 0, 4), r.setHours(0, 0, 0, 0), Me(r);
}
function sr(e, t, n) {
  return At(e, t * 7, n);
}
function ir(e, t, n) {
  return zt(e, t * 12, n);
}
function cr(e, t) {
  let n,
    r = t == null ? void 0 : t.in;
  return (
    e.forEach((a) => {
      !r && typeof a == 'object' && (r = q.bind(null, a));
      const o = E(a, r);
      (!n || n < o || isNaN(+o)) && (n = o);
    }),
    q(r, n || Number.NaN)
  );
}
function ur(e, t) {
  let n,
    r = t == null ? void 0 : t.in;
  return (
    e.forEach((a) => {
      !r && typeof a == 'object' && (r = q.bind(null, a));
      const o = E(a, r);
      (!n || n > o || isNaN(+o)) && (n = o);
    }),
    q(r, n || Number.NaN)
  );
}
function dr(e, t, n) {
  const [r, a] = me(n == null ? void 0 : n.in, e, t);
  return +ve(r) == +ve(a);
}
function Gt(e) {
  return (
    e instanceof Date ||
    (typeof e == 'object' && Object.prototype.toString.call(e) === '[object Date]')
  );
}
function lr(e) {
  return !((!Gt(e) && typeof e != 'number') || isNaN(+E(e)));
}
function $t(e, t, n) {
  const [r, a] = me(n == null ? void 0 : n.in, e, t),
    o = r.getFullYear() - a.getFullYear(),
    s = r.getMonth() - a.getMonth();
  return o * 12 + s;
}
function fr(e, t) {
  const n = E(e, t == null ? void 0 : t.in),
    r = n.getMonth();
  return n.setFullYear(n.getFullYear(), r + 1, 0), n.setHours(23, 59, 59, 999), n;
}
function Vt(e, t) {
  const [n, r] = me(e, t.start, t.end);
  return { start: n, end: r };
}
function hr(e, t) {
  const { start: n, end: r } = Vt(t == null ? void 0 : t.in, e);
  const a = +n > +r;
  const o = a ? +n : +r,
    s = a ? r : n;
  s.setHours(0, 0, 0, 0), s.setDate(1);
  const i = 1;
  const c = [];
  while (+s <= o) c.push(q(n, s)), s.setMonth(s.getMonth() + i);
  return a ? c.reverse() : c;
}
function mr(e, t) {
  const n = E(e, t == null ? void 0 : t.in);
  return n.setDate(1), n.setHours(0, 0, 0, 0), n;
}
function yr(e, t) {
  const n = E(e, t == null ? void 0 : t.in),
    r = n.getFullYear();
  return n.setFullYear(r + 1, 0, 0), n.setHours(23, 59, 59, 999), n;
}
function Qt(e, t) {
  const n = E(e, t == null ? void 0 : t.in);
  return n.setFullYear(n.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n;
}
function gr(e, t) {
  const { start: n, end: r } = Vt(t == null ? void 0 : t.in, e);
  const a = +n > +r;
  const o = a ? +n : +r,
    s = a ? r : n;
  s.setHours(0, 0, 0, 0), s.setMonth(0, 1);
  const i = 1;
  const c = [];
  while (+s <= o) c.push(q(n, s)), s.setFullYear(s.getFullYear() + i);
  return a ? c.reverse() : c;
}
function Xt(e, t) {
  var i, c, u, d;
  const n = Oe(),
    r =
      (t == null ? void 0 : t.weekStartsOn) ??
      ((c = (i = t == null ? void 0 : t.locale) == null ? void 0 : i.options) == null
        ? void 0
        : c.weekStartsOn) ??
      n.weekStartsOn ??
      ((d = (u = n.locale) == null ? void 0 : u.options) == null ? void 0 : d.weekStartsOn) ??
      0,
    a = E(e, t == null ? void 0 : t.in),
    o = a.getDay(),
    s = (o < r ? -7 : 0) + 6 - (o - r);
  return a.setDate(a.getDate() + s), a.setHours(23, 59, 59, 999), a;
}
function wr(e, t) {
  return Xt(e, { ...t, weekStartsOn: 1 });
}
const br = {
    lessThanXSeconds: { one: 'less than a second', other: 'less than {{count}} seconds' },
    xSeconds: { one: '1 second', other: '{{count}} seconds' },
    halfAMinute: 'half a minute',
    lessThanXMinutes: { one: 'less than a minute', other: 'less than {{count}} minutes' },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'about 1 hour', other: 'about {{count}} hours' },
    xHours: { one: '1 hour', other: '{{count}} hours' },
    xDays: { one: '1 day', other: '{{count}} days' },
    aboutXWeeks: { one: 'about 1 week', other: 'about {{count}} weeks' },
    xWeeks: { one: '1 week', other: '{{count}} weeks' },
    aboutXMonths: { one: 'about 1 month', other: 'about {{count}} months' },
    xMonths: { one: '1 month', other: '{{count}} months' },
    aboutXYears: { one: 'about 1 year', other: 'about {{count}} years' },
    xYears: { one: '1 year', other: '{{count}} years' },
    overXYears: { one: 'over 1 year', other: 'over {{count}} years' },
    almostXYears: { one: 'almost 1 year', other: 'almost {{count}} years' },
  },
  Dr = (e, t, n) => {
    let r;
    const a = br[e];
    return (
      typeof a == 'string'
        ? (r = a)
        : t === 1
          ? (r = a.one)
          : (r = a.other.replace('{{count}}', t.toString())),
      n != null && n.addSuffix ? (n.comparison && n.comparison > 0 ? 'in ' + r : r + ' ago') : r
    );
  };
function $e(e) {
  return (t = {}) => {
    const n = t.width ? String(t.width) : e.defaultWidth;
    return e.formats[n] || e.formats[e.defaultWidth];
  };
}
const kr = {
    full: 'EEEE, MMMM do, y',
    long: 'MMMM do, y',
    medium: 'MMM d, y',
    short: 'MM/dd/yyyy',
  },
  Mr = { full: 'h:mm:ss a zzzz', long: 'h:mm:ss a z', medium: 'h:mm:ss a', short: 'h:mm a' },
  vr = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  Or = {
    date: $e({ formats: kr, defaultWidth: 'full' }),
    time: $e({ formats: Mr, defaultWidth: 'full' }),
    dateTime: $e({ formats: vr, defaultWidth: 'full' }),
  },
  pr = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P',
  },
  Wr = (e, t, n, r) => pr[e];
function we(e) {
  return (t, n) => {
    const r = n != null && n.context ? String(n.context) : 'standalone';
    let a;
    if (r === 'formatting' && e.formattingValues) {
      const s = e.defaultFormattingWidth || e.defaultWidth,
        i = n != null && n.width ? String(n.width) : s;
      a = e.formattingValues[i] || e.formattingValues[s];
    } else {
      const s = e.defaultWidth,
        i = n != null && n.width ? String(n.width) : e.defaultWidth;
      a = e.values[i] || e.values[s];
    }
    const o = e.argumentCallback ? e.argumentCallback(t) : t;
    return a[o];
  };
}
const Sr = {
    narrow: ['B', 'A'],
    abbreviated: ['BC', 'AD'],
    wide: ['Before Christ', 'Anno Domini'],
  },
  Nr = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  },
  xr = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    wide: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  Cr = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  Yr = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
  },
  Tr = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
  },
  _r = (e, t) => {
    const n = Number(e),
      r = n % 100;
    if (r > 20 || r < 10)
      switch (r % 10) {
        case 1:
          return n + 'st';
        case 2:
          return n + 'nd';
        case 3:
          return n + 'rd';
      }
    return n + 'th';
  },
  Pr = {
    ordinalNumber: _r,
    era: we({ values: Sr, defaultWidth: 'wide' }),
    quarter: we({ values: Nr, defaultWidth: 'wide', argumentCallback: (e) => e - 1 }),
    month: we({ values: xr, defaultWidth: 'wide' }),
    day: we({ values: Cr, defaultWidth: 'wide' }),
    dayPeriod: we({
      values: Yr,
      defaultWidth: 'wide',
      formattingValues: Tr,
      defaultFormattingWidth: 'wide',
    }),
  };
function be(e) {
  return (t, n = {}) => {
    const r = n.width,
      a = (r && e.matchPatterns[r]) || e.matchPatterns[e.defaultMatchWidth],
      o = t.match(a);
    if (!o) return null;
    const s = o[0],
      i = (r && e.parsePatterns[r]) || e.parsePatterns[e.defaultParseWidth],
      c = Array.isArray(i) ? Fr(i, (l) => l.test(s)) : Er(i, (l) => l.test(s));
    let u;
    (u = e.valueCallback ? e.valueCallback(c) : c), (u = n.valueCallback ? n.valueCallback(u) : u);
    const d = t.slice(s.length);
    return { value: u, rest: d };
  };
}
function Er(e, t) {
  for (const n in e) if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function Fr(e, t) {
  for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
function Br(e) {
  return (t, n = {}) => {
    const r = t.match(e.matchPattern);
    if (!r) return null;
    const a = r[0],
      o = t.match(e.parsePattern);
    if (!o) return null;
    let s = e.valueCallback ? e.valueCallback(o[0]) : o[0];
    s = n.valueCallback ? n.valueCallback(s) : s;
    const i = t.slice(a.length);
    return { value: s, rest: i };
  };
}
const Ir = /^(\d+)(th|st|nd|rd)?/i,
  jr = /\d+/i,
  qr = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  },
  Hr = { any: [/^b/i, /^(a|c)/i] },
  Ar = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](th|st|nd|rd)? quarter/i },
  zr = { any: [/1/i, /2/i, /3/i, /4/i] },
  Rr = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  },
  Gr = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  $r = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  },
  Vr = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  Qr = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  },
  Xr = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  },
  Ur = {
    ordinalNumber: Br({
      matchPattern: Ir,
      parsePattern: jr,
      valueCallback: (e) => Number.parseInt(e, 10),
    }),
    era: be({
      matchPatterns: qr,
      defaultMatchWidth: 'wide',
      parsePatterns: Hr,
      defaultParseWidth: 'any',
    }),
    quarter: be({
      matchPatterns: Ar,
      defaultMatchWidth: 'wide',
      parsePatterns: zr,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: be({
      matchPatterns: Rr,
      defaultMatchWidth: 'wide',
      parsePatterns: Gr,
      defaultParseWidth: 'any',
    }),
    day: be({
      matchPatterns: $r,
      defaultMatchWidth: 'wide',
      parsePatterns: Vr,
      defaultParseWidth: 'any',
    }),
    dayPeriod: be({
      matchPatterns: Qr,
      defaultMatchWidth: 'any',
      parsePatterns: Xr,
      defaultParseWidth: 'any',
    }),
  },
  fe = {
    code: 'en-US',
    formatDistance: Dr,
    formatLong: Or,
    formatRelative: Wr,
    localize: Pr,
    match: Ur,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  };
function Kr(e, t) {
  const n = E(e, t == null ? void 0 : t.in);
  return Je(n, Qt(n)) + 1;
}
function Ze(e, t) {
  const n = E(e, t == null ? void 0 : t.in),
    r = +Me(n) - +or(n);
  return Math.round(r / Ht) + 1;
}
function Ut(e, t) {
  var d, l, h, y;
  const n = E(e, t == null ? void 0 : t.in),
    r = n.getFullYear(),
    a = Oe(),
    o =
      (t == null ? void 0 : t.firstWeekContainsDate) ??
      ((l = (d = t == null ? void 0 : t.locale) == null ? void 0 : d.options) == null
        ? void 0
        : l.firstWeekContainsDate) ??
      a.firstWeekContainsDate ??
      ((y = (h = a.locale) == null ? void 0 : h.options) == null
        ? void 0
        : y.firstWeekContainsDate) ??
      1,
    s = q((t == null ? void 0 : t.in) || e, 0);
  s.setFullYear(r + 1, 0, o), s.setHours(0, 0, 0, 0);
  const i = he(s, t),
    c = q((t == null ? void 0 : t.in) || e, 0);
  c.setFullYear(r, 0, o), c.setHours(0, 0, 0, 0);
  const u = he(c, t);
  return +n >= +i ? r + 1 : +n >= +u ? r : r - 1;
}
function Jr(e, t) {
  var i, c, u, d;
  const n = Oe(),
    r =
      (t == null ? void 0 : t.firstWeekContainsDate) ??
      ((c = (i = t == null ? void 0 : t.locale) == null ? void 0 : i.options) == null
        ? void 0
        : c.firstWeekContainsDate) ??
      n.firstWeekContainsDate ??
      ((d = (u = n.locale) == null ? void 0 : u.options) == null
        ? void 0
        : d.firstWeekContainsDate) ??
      1,
    a = Ut(e, t),
    o = q((t == null ? void 0 : t.in) || e, 0);
  return o.setFullYear(a, 0, r), o.setHours(0, 0, 0, 0), he(o, t);
}
function Le(e, t) {
  const n = E(e, t == null ? void 0 : t.in),
    r = +he(n, t) - +Jr(n, t);
  return Math.round(r / Ht) + 1;
}
function P(e, t) {
  const n = e < 0 ? '-' : '',
    r = Math.abs(e).toString().padStart(t, '0');
  return n + r;
}
const se = {
    y(e, t) {
      const n = e.getFullYear(),
        r = n > 0 ? n : 1 - n;
      return P(t === 'yy' ? r % 100 : r, t.length);
    },
    M(e, t) {
      const n = e.getMonth();
      return t === 'M' ? String(n + 1) : P(n + 1, 2);
    },
    d(e, t) {
      return P(e.getDate(), t.length);
    },
    a(e, t) {
      const n = e.getHours() / 12 >= 1 ? 'pm' : 'am';
      switch (t) {
        case 'a':
        case 'aa':
          return n.toUpperCase();
        case 'aaa':
          return n;
        case 'aaaaa':
          return n[0];
        case 'aaaa':
        default:
          return n === 'am' ? 'a.m.' : 'p.m.';
      }
    },
    h(e, t) {
      return P(e.getHours() % 12 || 12, t.length);
    },
    H(e, t) {
      return P(e.getHours(), t.length);
    },
    m(e, t) {
      return P(e.getMinutes(), t.length);
    },
    s(e, t) {
      return P(e.getSeconds(), t.length);
    },
    S(e, t) {
      const n = t.length,
        r = e.getMilliseconds(),
        a = Math.trunc(r * Math.pow(10, n - 3));
      return P(a, t.length);
    },
  },
  de = {
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  },
  bt = {
    G: (e, t, n) => {
      const r = e.getFullYear() > 0 ? 1 : 0;
      switch (t) {
        case 'G':
        case 'GG':
        case 'GGG':
          return n.era(r, { width: 'abbreviated' });
        case 'GGGGG':
          return n.era(r, { width: 'narrow' });
        case 'GGGG':
        default:
          return n.era(r, { width: 'wide' });
      }
    },
    y: (e, t, n) => {
      if (t === 'yo') {
        const r = e.getFullYear(),
          a = r > 0 ? r : 1 - r;
        return n.ordinalNumber(a, { unit: 'year' });
      }
      return se.y(e, t);
    },
    Y: (e, t, n, r) => {
      const a = Ut(e, r),
        o = a > 0 ? a : 1 - a;
      if (t === 'YY') {
        const s = o % 100;
        return P(s, 2);
      }
      return t === 'Yo' ? n.ordinalNumber(o, { unit: 'year' }) : P(o, t.length);
    },
    R: (e, t) => {
      const n = Rt(e);
      return P(n, t.length);
    },
    u: (e, t) => {
      const n = e.getFullYear();
      return P(n, t.length);
    },
    Q: (e, t, n) => {
      const r = Math.ceil((e.getMonth() + 1) / 3);
      switch (t) {
        case 'Q':
          return String(r);
        case 'QQ':
          return P(r, 2);
        case 'Qo':
          return n.ordinalNumber(r, { unit: 'quarter' });
        case 'QQQ':
          return n.quarter(r, { width: 'abbreviated', context: 'formatting' });
        case 'QQQQQ':
          return n.quarter(r, { width: 'narrow', context: 'formatting' });
        case 'QQQQ':
        default:
          return n.quarter(r, { width: 'wide', context: 'formatting' });
      }
    },
    q: (e, t, n) => {
      const r = Math.ceil((e.getMonth() + 1) / 3);
      switch (t) {
        case 'q':
          return String(r);
        case 'qq':
          return P(r, 2);
        case 'qo':
          return n.ordinalNumber(r, { unit: 'quarter' });
        case 'qqq':
          return n.quarter(r, { width: 'abbreviated', context: 'standalone' });
        case 'qqqqq':
          return n.quarter(r, { width: 'narrow', context: 'standalone' });
        case 'qqqq':
        default:
          return n.quarter(r, { width: 'wide', context: 'standalone' });
      }
    },
    M: (e, t, n) => {
      const r = e.getMonth();
      switch (t) {
        case 'M':
        case 'MM':
          return se.M(e, t);
        case 'Mo':
          return n.ordinalNumber(r + 1, { unit: 'month' });
        case 'MMM':
          return n.month(r, { width: 'abbreviated', context: 'formatting' });
        case 'MMMMM':
          return n.month(r, { width: 'narrow', context: 'formatting' });
        case 'MMMM':
        default:
          return n.month(r, { width: 'wide', context: 'formatting' });
      }
    },
    L: (e, t, n) => {
      const r = e.getMonth();
      switch (t) {
        case 'L':
          return String(r + 1);
        case 'LL':
          return P(r + 1, 2);
        case 'Lo':
          return n.ordinalNumber(r + 1, { unit: 'month' });
        case 'LLL':
          return n.month(r, { width: 'abbreviated', context: 'standalone' });
        case 'LLLLL':
          return n.month(r, { width: 'narrow', context: 'standalone' });
        case 'LLLL':
        default:
          return n.month(r, { width: 'wide', context: 'standalone' });
      }
    },
    w: (e, t, n, r) => {
      const a = Le(e, r);
      return t === 'wo' ? n.ordinalNumber(a, { unit: 'week' }) : P(a, t.length);
    },
    I: (e, t, n) => {
      const r = Ze(e);
      return t === 'Io' ? n.ordinalNumber(r, { unit: 'week' }) : P(r, t.length);
    },
    d: (e, t, n) => (t === 'do' ? n.ordinalNumber(e.getDate(), { unit: 'date' }) : se.d(e, t)),
    D: (e, t, n) => {
      const r = Kr(e);
      return t === 'Do' ? n.ordinalNumber(r, { unit: 'dayOfYear' }) : P(r, t.length);
    },
    E: (e, t, n) => {
      const r = e.getDay();
      switch (t) {
        case 'E':
        case 'EE':
        case 'EEE':
          return n.day(r, { width: 'abbreviated', context: 'formatting' });
        case 'EEEEE':
          return n.day(r, { width: 'narrow', context: 'formatting' });
        case 'EEEEEE':
          return n.day(r, { width: 'short', context: 'formatting' });
        case 'EEEE':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' });
      }
    },
    e: (e, t, n, r) => {
      const a = e.getDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case 'e':
          return String(o);
        case 'ee':
          return P(o, 2);
        case 'eo':
          return n.ordinalNumber(o, { unit: 'day' });
        case 'eee':
          return n.day(a, { width: 'abbreviated', context: 'formatting' });
        case 'eeeee':
          return n.day(a, { width: 'narrow', context: 'formatting' });
        case 'eeeeee':
          return n.day(a, { width: 'short', context: 'formatting' });
        case 'eeee':
        default:
          return n.day(a, { width: 'wide', context: 'formatting' });
      }
    },
    c: (e, t, n, r) => {
      const a = e.getDay(),
        o = (a - r.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case 'c':
          return String(o);
        case 'cc':
          return P(o, t.length);
        case 'co':
          return n.ordinalNumber(o, { unit: 'day' });
        case 'ccc':
          return n.day(a, { width: 'abbreviated', context: 'standalone' });
        case 'ccccc':
          return n.day(a, { width: 'narrow', context: 'standalone' });
        case 'cccccc':
          return n.day(a, { width: 'short', context: 'standalone' });
        case 'cccc':
        default:
          return n.day(a, { width: 'wide', context: 'standalone' });
      }
    },
    i: (e, t, n) => {
      const r = e.getDay(),
        a = r === 0 ? 7 : r;
      switch (t) {
        case 'i':
          return String(a);
        case 'ii':
          return P(a, t.length);
        case 'io':
          return n.ordinalNumber(a, { unit: 'day' });
        case 'iii':
          return n.day(r, { width: 'abbreviated', context: 'formatting' });
        case 'iiiii':
          return n.day(r, { width: 'narrow', context: 'formatting' });
        case 'iiiiii':
          return n.day(r, { width: 'short', context: 'formatting' });
        case 'iiii':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' });
      }
    },
    a: (e, t, n) => {
      const a = e.getHours() / 12 >= 1 ? 'pm' : 'am';
      switch (t) {
        case 'a':
        case 'aa':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' });
        case 'aaa':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' }).toLowerCase();
        case 'aaaaa':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' });
        case 'aaaa':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' });
      }
    },
    b: (e, t, n) => {
      const r = e.getHours();
      let a;
      switch (
        (r === 12 ? (a = de.noon) : r === 0 ? (a = de.midnight) : (a = r / 12 >= 1 ? 'pm' : 'am'),
        t)
      ) {
        case 'b':
        case 'bb':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' });
        case 'bbb':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' }).toLowerCase();
        case 'bbbbb':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' });
        case 'bbbb':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' });
      }
    },
    B: (e, t, n) => {
      const r = e.getHours();
      let a;
      switch (
        (r >= 17
          ? (a = de.evening)
          : r >= 12
            ? (a = de.afternoon)
            : r >= 4
              ? (a = de.morning)
              : (a = de.night),
        t)
      ) {
        case 'B':
        case 'BB':
        case 'BBB':
          return n.dayPeriod(a, { width: 'abbreviated', context: 'formatting' });
        case 'BBBBB':
          return n.dayPeriod(a, { width: 'narrow', context: 'formatting' });
        case 'BBBB':
        default:
          return n.dayPeriod(a, { width: 'wide', context: 'formatting' });
      }
    },
    h: (e, t, n) => {
      if (t === 'ho') {
        let r = e.getHours() % 12;
        return r === 0 && (r = 12), n.ordinalNumber(r, { unit: 'hour' });
      }
      return se.h(e, t);
    },
    H: (e, t, n) => (t === 'Ho' ? n.ordinalNumber(e.getHours(), { unit: 'hour' }) : se.H(e, t)),
    K: (e, t, n) => {
      const r = e.getHours() % 12;
      return t === 'Ko' ? n.ordinalNumber(r, { unit: 'hour' }) : P(r, t.length);
    },
    k: (e, t, n) => {
      let r = e.getHours();
      return (
        r === 0 && (r = 24), t === 'ko' ? n.ordinalNumber(r, { unit: 'hour' }) : P(r, t.length)
      );
    },
    m: (e, t, n) => (t === 'mo' ? n.ordinalNumber(e.getMinutes(), { unit: 'minute' }) : se.m(e, t)),
    s: (e, t, n) => (t === 'so' ? n.ordinalNumber(e.getSeconds(), { unit: 'second' }) : se.s(e, t)),
    S: (e, t) => se.S(e, t),
    X: (e, t, n) => {
      const r = e.getTimezoneOffset();
      if (r === 0) return 'Z';
      switch (t) {
        case 'X':
          return kt(r);
        case 'XXXX':
        case 'XX':
          return ie(r);
        case 'XXXXX':
        case 'XXX':
        default:
          return ie(r, ':');
      }
    },
    x: (e, t, n) => {
      const r = e.getTimezoneOffset();
      switch (t) {
        case 'x':
          return kt(r);
        case 'xxxx':
        case 'xx':
          return ie(r);
        case 'xxxxx':
        case 'xxx':
        default:
          return ie(r, ':');
      }
    },
    O: (e, t, n) => {
      const r = e.getTimezoneOffset();
      switch (t) {
        case 'O':
        case 'OO':
        case 'OOO':
          return 'GMT' + Dt(r, ':');
        case 'OOOO':
        default:
          return 'GMT' + ie(r, ':');
      }
    },
    z: (e, t, n) => {
      const r = e.getTimezoneOffset();
      switch (t) {
        case 'z':
        case 'zz':
        case 'zzz':
          return 'GMT' + Dt(r, ':');
        case 'zzzz':
        default:
          return 'GMT' + ie(r, ':');
      }
    },
    t: (e, t, n) => {
      const r = Math.trunc(+e / 1e3);
      return P(r, t.length);
    },
    T: (e, t, n) => P(+e, t.length),
  };
function Dt(e, t = '') {
  const n = e > 0 ? '-' : '+',
    r = Math.abs(e),
    a = Math.trunc(r / 60),
    o = r % 60;
  return o === 0 ? n + String(a) : n + String(a) + t + P(o, 2);
}
function kt(e, t) {
  return e % 60 === 0 ? (e > 0 ? '-' : '+') + P(Math.abs(e) / 60, 2) : ie(e, t);
}
function ie(e, t = '') {
  const n = e > 0 ? '-' : '+',
    r = Math.abs(e),
    a = P(Math.trunc(r / 60), 2),
    o = P(r % 60, 2);
  return n + a + t + o;
}
const Mt = (e, t) => {
    switch (e) {
      case 'P':
        return t.date({ width: 'short' });
      case 'PP':
        return t.date({ width: 'medium' });
      case 'PPP':
        return t.date({ width: 'long' });
      case 'PPPP':
      default:
        return t.date({ width: 'full' });
    }
  },
  Kt = (e, t) => {
    switch (e) {
      case 'p':
        return t.time({ width: 'short' });
      case 'pp':
        return t.time({ width: 'medium' });
      case 'ppp':
        return t.time({ width: 'long' });
      case 'pppp':
      default:
        return t.time({ width: 'full' });
    }
  },
  Zr = (e, t) => {
    const n = e.match(/(P+)(p+)?/) || [],
      r = n[1],
      a = n[2];
    if (!a) return Mt(e, t);
    let o;
    switch (r) {
      case 'P':
        o = t.dateTime({ width: 'short' });
        break;
      case 'PP':
        o = t.dateTime({ width: 'medium' });
        break;
      case 'PPP':
        o = t.dateTime({ width: 'long' });
        break;
      case 'PPPP':
      default:
        o = t.dateTime({ width: 'full' });
        break;
    }
    return o.replace('{{date}}', Mt(r, t)).replace('{{time}}', Kt(a, t));
  },
  Lr = { p: Kt, P: Zr },
  ea = /^D+$/,
  ta = /^Y+$/,
  na = ['D', 'DD', 'YY', 'YYYY'];
function ra(e) {
  return ea.test(e);
}
function aa(e) {
  return ta.test(e);
}
function oa(e, t, n) {
  const r = sa(e, t, n);
  if ((console.warn(r), na.includes(e))) throw new RangeError(r);
}
function sa(e, t, n) {
  const r = e[0] === 'Y' ? 'years' : 'days of the month';
  return `Use \`${e.toLowerCase()}\` instead of \`${e}\` (in \`${t}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const ia = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  ca = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  ua = /^'([^]*?)'?$/,
  da = /''/g,
  la = /[a-zA-Z]/;
function ke(e, t, n) {
  var d, l, h, y, v, p, M, N;
  const r = Oe(),
    a = (n == null ? void 0 : n.locale) ?? r.locale ?? fe,
    o =
      (n == null ? void 0 : n.firstWeekContainsDate) ??
      ((l = (d = n == null ? void 0 : n.locale) == null ? void 0 : d.options) == null
        ? void 0
        : l.firstWeekContainsDate) ??
      r.firstWeekContainsDate ??
      ((y = (h = r.locale) == null ? void 0 : h.options) == null
        ? void 0
        : y.firstWeekContainsDate) ??
      1,
    s =
      (n == null ? void 0 : n.weekStartsOn) ??
      ((p = (v = n == null ? void 0 : n.locale) == null ? void 0 : v.options) == null
        ? void 0
        : p.weekStartsOn) ??
      r.weekStartsOn ??
      ((N = (M = r.locale) == null ? void 0 : M.options) == null ? void 0 : N.weekStartsOn) ??
      0,
    i = E(e, n == null ? void 0 : n.in);
  if (!lr(i)) throw new RangeError('Invalid time value');
  let c = t
    .match(ca)
    .map((w) => {
      const g = w[0];
      if (g === 'p' || g === 'P') {
        const W = Lr[g];
        return W(w, a.formatLong);
      }
      return w;
    })
    .join('')
    .match(ia)
    .map((w) => {
      if (w === "''") return { isToken: !1, value: "'" };
      const g = w[0];
      if (g === "'") return { isToken: !1, value: fa(w) };
      if (bt[g]) return { isToken: !0, value: w };
      if (g.match(la))
        throw new RangeError(
          'Format string contains an unescaped latin alphabet character `' + g + '`',
        );
      return { isToken: !1, value: w };
    });
  a.localize.preprocessor && (c = a.localize.preprocessor(i, c));
  const u = { firstWeekContainsDate: o, weekStartsOn: s, locale: a };
  return c
    .map((w) => {
      if (!w.isToken) return w.value;
      const g = w.value;
      ((!(n != null && n.useAdditionalWeekYearTokens) && aa(g)) ||
        (!(n != null && n.useAdditionalDayOfYearTokens) && ra(g))) &&
        oa(g, t, String(e));
      const W = bt[g[0]];
      return W(i, g, a.localize, u);
    })
    .join('');
}
function fa(e) {
  const t = e.match(ua);
  return t ? t[1].replace(da, "'") : e;
}
function ha(e, t) {
  const n = E(e, t == null ? void 0 : t.in),
    r = n.getFullYear(),
    a = n.getMonth(),
    o = q(n, 0);
  return o.setFullYear(r, a + 1, 0), o.setHours(0, 0, 0, 0), o.getDate();
}
function ma(e, t) {
  return E(e, t == null ? void 0 : t.in).getMonth();
}
function ya(e, t) {
  return E(e, t == null ? void 0 : t.in).getFullYear();
}
function ga(e, t) {
  return +E(e) > +E(t);
}
function wa(e, t) {
  return +E(e) < +E(t);
}
function ba(e, t, n) {
  const [r, a] = me(n == null ? void 0 : n.in, e, t);
  return r.getFullYear() === a.getFullYear() && r.getMonth() === a.getMonth();
}
function Da(e, t, n) {
  const [r, a] = me(n == null ? void 0 : n.in, e, t);
  return r.getFullYear() === a.getFullYear();
}
function ka(e, t, n) {
  const r = E(e, n == null ? void 0 : n.in),
    a = r.getFullYear(),
    o = r.getDate(),
    s = q(e, 0);
  s.setFullYear(a, t, 15), s.setHours(0, 0, 0, 0);
  const i = ha(s);
  return r.setMonth(t, Math.min(o, i)), r;
}
function Ma(e, t, n) {
  const r = E(e, n == null ? void 0 : n.in);
  return isNaN(+r) ? q(e, Number.NaN) : (r.setFullYear(t), r);
}
const vt = 5,
  va = 4;
function Oa(e, t) {
  const n = t.startOfMonth(e),
    r = n.getDay() > 0 ? n.getDay() : 7,
    a = t.addDays(e, -r + 1),
    o = t.addDays(a, vt * 7 - 1);
  return t.getMonth(e) === t.getMonth(o) ? vt : va;
}
function Jt(e, t) {
  const n = t.startOfMonth(e),
    r = n.getDay();
  return r === 1 ? n : r === 0 ? t.addDays(n, -1 * 6) : t.addDays(n, -1 * (r - 1));
}
function pa(e, t) {
  const n = Jt(e, t),
    r = Oa(e, t);
  return t.addDays(n, r * 7 - 1);
}
const Zt = {
  ...fe,
  labels: {
    labelDayButton: (e, t, n, r) => {
      let a;
      r && typeof r.format == 'function'
        ? (a = r.format.bind(r))
        : (a = (s, i) => ke(s, i, { locale: fe, ...n }));
      let o = a(e, 'PPPP');
      return t.today && (o = `Today, ${o}`), t.selected && (o = `${o}, selected`), o;
    },
    labelMonthDropdown: 'Choose the Month',
    labelNext: 'Go to the Next Month',
    labelPrevious: 'Go to the Previous Month',
    labelWeekNumber: (e) => `Week ${e}`,
    labelYearDropdown: 'Choose the Year',
    labelGrid: (e, t, n) => {
      let r;
      return (
        n && typeof n.format == 'function'
          ? (r = n.format.bind(n))
          : (r = (a, o) => ke(a, o, { locale: fe, ...t })),
        r(e, 'LLLL yyyy')
      );
    },
    labelGridcell: (e, t, n, r) => {
      let a;
      r && typeof r.format == 'function'
        ? (a = r.format.bind(r))
        : (a = (s, i) => ke(s, i, { locale: fe, ...n }));
      let o = a(e, 'PPPP');
      return t != null && t.today && (o = `Today, ${o}`), o;
    },
    labelNav: 'Navigation bar',
    labelWeekNumberHeader: 'Week Number',
    labelWeekday: (e, t, n) => {
      let r;
      return (
        n && typeof n.format == 'function'
          ? (r = n.format.bind(n))
          : (r = (a, o) => ke(a, o, { locale: fe, ...t })),
        r(e, 'cccc')
      );
    },
  },
};
class G {
  constructor(t, n) {
    (this.Date = Date),
      (this.today = () => {
        var r;
        return (r = this.overrides) != null && r.today
          ? this.overrides.today()
          : this.options.timeZone
            ? A.tz(this.options.timeZone)
            : new this.Date();
      }),
      (this.newDate = (r, a, o) => {
        var s;
        return (s = this.overrides) != null && s.newDate
          ? this.overrides.newDate(r, a, o)
          : this.options.timeZone
            ? new A(r, a, o, this.options.timeZone)
            : new Date(r, a, o);
      }),
      (this.addDays = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.addDays ? this.overrides.addDays(r, a) : At(r, a);
      }),
      (this.addMonths = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.addMonths
          ? this.overrides.addMonths(r, a)
          : zt(r, a);
      }),
      (this.addWeeks = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.addWeeks
          ? this.overrides.addWeeks(r, a)
          : sr(r, a);
      }),
      (this.addYears = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.addYears
          ? this.overrides.addYears(r, a)
          : ir(r, a);
      }),
      (this.differenceInCalendarDays = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.differenceInCalendarDays
          ? this.overrides.differenceInCalendarDays(r, a)
          : Je(r, a);
      }),
      (this.differenceInCalendarMonths = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.differenceInCalendarMonths
          ? this.overrides.differenceInCalendarMonths(r, a)
          : $t(r, a);
      }),
      (this.eachMonthOfInterval = (r) => {
        var a;
        return (a = this.overrides) != null && a.eachMonthOfInterval
          ? this.overrides.eachMonthOfInterval(r)
          : hr(r);
      }),
      (this.eachYearOfInterval = (r) => {
        var i;
        const a =
            (i = this.overrides) != null && i.eachYearOfInterval
              ? this.overrides.eachYearOfInterval(r)
              : gr(r),
          o = new Set(a.map((c) => this.getYear(c)));
        if (o.size === a.length) return a;
        const s = [];
        return (
          o.forEach((c) => {
            s.push(new Date(c, 0, 1));
          }),
          s
        );
      }),
      (this.endOfBroadcastWeek = (r) => {
        var a;
        return (a = this.overrides) != null && a.endOfBroadcastWeek
          ? this.overrides.endOfBroadcastWeek(r)
          : pa(r, this);
      }),
      (this.endOfISOWeek = (r) => {
        var a;
        return (a = this.overrides) != null && a.endOfISOWeek
          ? this.overrides.endOfISOWeek(r)
          : wr(r);
      }),
      (this.endOfMonth = (r) => {
        var a;
        return (a = this.overrides) != null && a.endOfMonth ? this.overrides.endOfMonth(r) : fr(r);
      }),
      (this.endOfWeek = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.endOfWeek
          ? this.overrides.endOfWeek(r, a)
          : Xt(r, this.options);
      }),
      (this.endOfYear = (r) => {
        var a;
        return (a = this.overrides) != null && a.endOfYear ? this.overrides.endOfYear(r) : yr(r);
      }),
      (this.format = (r, a, o) => {
        var i;
        const s =
          (i = this.overrides) != null && i.format
            ? this.overrides.format(r, a, this.options)
            : ke(r, a, this.options);
        return this.options.numerals && this.options.numerals !== 'latn'
          ? this.replaceDigits(s)
          : s;
      }),
      (this.getISOWeek = (r) => {
        var a;
        return (a = this.overrides) != null && a.getISOWeek ? this.overrides.getISOWeek(r) : Ze(r);
      }),
      (this.getMonth = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.getMonth
          ? this.overrides.getMonth(r, this.options)
          : ma(r, this.options);
      }),
      (this.getYear = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.getYear
          ? this.overrides.getYear(r, this.options)
          : ya(r, this.options);
      }),
      (this.getWeek = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.getWeek
          ? this.overrides.getWeek(r, this.options)
          : Le(r, this.options);
      }),
      (this.isAfter = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.isAfter ? this.overrides.isAfter(r, a) : ga(r, a);
      }),
      (this.isBefore = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.isBefore
          ? this.overrides.isBefore(r, a)
          : wa(r, a);
      }),
      (this.isDate = (r) => {
        var a;
        return (a = this.overrides) != null && a.isDate ? this.overrides.isDate(r) : Gt(r);
      }),
      (this.isSameDay = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.isSameDay
          ? this.overrides.isSameDay(r, a)
          : dr(r, a);
      }),
      (this.isSameMonth = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.isSameMonth
          ? this.overrides.isSameMonth(r, a)
          : ba(r, a);
      }),
      (this.isSameYear = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.isSameYear
          ? this.overrides.isSameYear(r, a)
          : Da(r, a);
      }),
      (this.max = (r) => {
        var a;
        return (a = this.overrides) != null && a.max ? this.overrides.max(r) : cr(r);
      }),
      (this.min = (r) => {
        var a;
        return (a = this.overrides) != null && a.min ? this.overrides.min(r) : ur(r);
      }),
      (this.setMonth = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.setMonth
          ? this.overrides.setMonth(r, a)
          : ka(r, a);
      }),
      (this.setYear = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.setYear ? this.overrides.setYear(r, a) : Ma(r, a);
      }),
      (this.startOfBroadcastWeek = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.startOfBroadcastWeek
          ? this.overrides.startOfBroadcastWeek(r, this)
          : Jt(r, this);
      }),
      (this.startOfDay = (r) => {
        var a;
        return (a = this.overrides) != null && a.startOfDay ? this.overrides.startOfDay(r) : ve(r);
      }),
      (this.startOfISOWeek = (r) => {
        var a;
        return (a = this.overrides) != null && a.startOfISOWeek
          ? this.overrides.startOfISOWeek(r)
          : Me(r);
      }),
      (this.startOfMonth = (r) => {
        var a;
        return (a = this.overrides) != null && a.startOfMonth
          ? this.overrides.startOfMonth(r)
          : mr(r);
      }),
      (this.startOfWeek = (r, a) => {
        var o;
        return (o = this.overrides) != null && o.startOfWeek
          ? this.overrides.startOfWeek(r, this.options)
          : he(r, this.options);
      }),
      (this.startOfYear = (r) => {
        var a;
        return (a = this.overrides) != null && a.startOfYear
          ? this.overrides.startOfYear(r)
          : Qt(r);
      }),
      (this.options = { locale: Zt, ...t }),
      (this.overrides = n);
  }
  getDigitMap() {
    const { numerals: t = 'latn' } = this.options,
      n = new Intl.NumberFormat('en-US', { numberingSystem: t }),
      r = {};
    for (let a = 0; a < 10; a++) r[a.toString()] = n.format(a);
    return r;
  }
  replaceDigits(t) {
    const n = this.getDigitMap();
    return t.replace(/\d/g, (r) => n[r] || r);
  }
  formatNumber(t) {
    return this.replaceDigits(t.toString());
  }
  getMonthYearOrder() {
    var n;
    const t = (n = this.options.locale) == null ? void 0 : n.code;
    return t && G.yearFirstLocales.has(t) ? 'year-first' : 'month-first';
  }
  formatMonthYear(t) {
    const { locale: n, timeZone: r, numerals: a } = this.options,
      o = n == null ? void 0 : n.code;
    if (o && G.yearFirstLocales.has(o))
      try {
        return new Intl.DateTimeFormat(o, {
          month: 'long',
          year: 'numeric',
          timeZone: r,
          numberingSystem: a,
        }).format(t);
      } catch {}
    const s = this.getMonthYearOrder() === 'year-first' ? 'y LLLL' : 'LLLL y';
    return this.format(t, s);
  }
}
G.yearFirstLocales = new Set([
  'eu',
  'hu',
  'ja',
  'ja-Hira',
  'ja-JP',
  'ko',
  'ko-KR',
  'lt',
  'lt-LT',
  'lv',
  'lv-LV',
  'mn',
  'mn-MN',
  'zh',
  'zh-CN',
  'zh-HK',
  'zh-TW',
]);
const ee = new G();
class Lt {
  constructor(t, n, r = ee) {
    (this.date = t),
      (this.displayMonth = n),
      (this.outside = !!(n && !r.isSameMonth(t, n))),
      (this.dateLib = r),
      (this.isoDate = r.format(t, 'yyyy-MM-dd')),
      (this.displayMonthId = r.format(n, 'yyyy-MM')),
      (this.dateMonthId = r.format(t, 'yyyy-MM'));
  }
  isEqualTo(t) {
    return (
      this.dateLib.isSameDay(t.date, this.date) &&
      this.dateLib.isSameMonth(t.displayMonth, this.displayMonth)
    );
  }
}
class Wa {
  constructor(t, n) {
    (this.date = t), (this.weeks = n);
  }
}
class Sa {
  constructor(t, n) {
    (this.days = n), (this.weekNumber = t);
  }
}
function Na(e) {
  return m.createElement('button', { ...e });
}
function xa(e) {
  return m.createElement('span', { ...e });
}
function Ca(e) {
  const { size: t = 24, orientation: n = 'left', className: r } = e;
  return m.createElement(
    'svg',
    { className: r, width: t, height: t, viewBox: '0 0 24 24' },
    n === 'up' &&
      m.createElement('polygon', { points: '6.77 17 12.5 11.43 18.24 17 20 15.28 12.5 8 5 15.28' }),
    n === 'down' &&
      m.createElement('polygon', { points: '6.77 8 12.5 13.57 18.24 8 20 9.72 12.5 17 5 9.72' }),
    n === 'left' &&
      m.createElement('polygon', {
        points: '16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20',
      }),
    n === 'right' &&
      m.createElement('polygon', {
        points: '8 18.112 14.18888889 12 8 5.87733333 9.91111111 4 18 12 9.91111111 20',
      }),
  );
}
function Ya(e) {
  const { day: t, modifiers: n, ...r } = e;
  return m.createElement('td', { ...r });
}
function Ta(e) {
  const { day: t, modifiers: n, ...r } = e,
    a = m.useRef(null);
  return (
    m.useEffect(() => {
      var o;
      n.focused && ((o = a.current) == null || o.focus());
    }, [n.focused]),
    m.createElement('button', { ref: a, ...r })
  );
}
var b;
((e) => {
  (e.Root = 'root'),
    (e.Chevron = 'chevron'),
    (e.Day = 'day'),
    (e.DayButton = 'day_button'),
    (e.CaptionLabel = 'caption_label'),
    (e.Dropdowns = 'dropdowns'),
    (e.Dropdown = 'dropdown'),
    (e.DropdownRoot = 'dropdown_root'),
    (e.Footer = 'footer'),
    (e.MonthGrid = 'month_grid'),
    (e.MonthCaption = 'month_caption'),
    (e.MonthsDropdown = 'months_dropdown'),
    (e.Month = 'month'),
    (e.Months = 'months'),
    (e.Nav = 'nav'),
    (e.NextMonthButton = 'button_next'),
    (e.PreviousMonthButton = 'button_previous'),
    (e.Week = 'week'),
    (e.Weeks = 'weeks'),
    (e.Weekday = 'weekday'),
    (e.Weekdays = 'weekdays'),
    (e.WeekNumber = 'week_number'),
    (e.WeekNumberHeader = 'week_number_header'),
    (e.YearsDropdown = 'years_dropdown');
})(b || (b = {}));
var B;
((e) => {
  (e.disabled = 'disabled'),
    (e.hidden = 'hidden'),
    (e.outside = 'outside'),
    (e.focused = 'focused'),
    (e.today = 'today');
})(B || (B = {}));
var J;
((e) => {
  (e.range_end = 'range_end'),
    (e.range_middle = 'range_middle'),
    (e.range_start = 'range_start'),
    (e.selected = 'selected');
})(J || (J = {}));
var R;
((e) => {
  (e.weeks_before_enter = 'weeks_before_enter'),
    (e.weeks_before_exit = 'weeks_before_exit'),
    (e.weeks_after_enter = 'weeks_after_enter'),
    (e.weeks_after_exit = 'weeks_after_exit'),
    (e.caption_after_enter = 'caption_after_enter'),
    (e.caption_after_exit = 'caption_after_exit'),
    (e.caption_before_enter = 'caption_before_enter'),
    (e.caption_before_exit = 'caption_before_exit');
})(R || (R = {}));
function _a(e) {
  const { options: t, className: n, components: r, classNames: a, ...o } = e,
    s = [a[b.Dropdown], n].join(' '),
    i = t == null ? void 0 : t.find(({ value: c }) => c === o.value);
  return m.createElement(
    'span',
    { 'data-disabled': o.disabled, className: a[b.DropdownRoot] },
    m.createElement(
      r.Select,
      { className: s, ...o },
      t == null
        ? void 0
        : t.map(({ value: c, label: u, disabled: d }) =>
            m.createElement(r.Option, { key: c, value: c, disabled: d }, u),
          ),
    ),
    m.createElement(
      'span',
      { className: a[b.CaptionLabel], 'aria-hidden': !0 },
      i == null ? void 0 : i.label,
      m.createElement(r.Chevron, { orientation: 'down', size: 18, className: a[b.Chevron] }),
    ),
  );
}
function Pa(e) {
  return m.createElement('div', { ...e });
}
function Ea(e) {
  return m.createElement('div', { ...e });
}
function Fa(e) {
  const { calendarMonth: t, displayIndex: n, ...r } = e;
  return m.createElement('div', { ...r }, e.children);
}
function Ba(e) {
  const { calendarMonth: t, displayIndex: n, ...r } = e;
  return m.createElement('div', { ...r });
}
function Ia(e) {
  return m.createElement('table', { ...e });
}
function ja(e) {
  return m.createElement('div', { ...e });
}
const en = T.createContext(void 0);
function pe() {
  const e = T.useContext(en);
  if (e === void 0) throw new Error('useDayPicker() must be used within a custom component.');
  return e;
}
function qa(e) {
  const { components: t } = pe();
  return m.createElement(t.Dropdown, { ...e });
}
function Ha(e) {
  const { onPreviousClick: t, onNextClick: n, previousMonth: r, nextMonth: a, ...o } = e,
    {
      components: s,
      classNames: i,
      labels: { labelPrevious: c, labelNext: u },
    } = pe(),
    d = T.useCallback(
      (h) => {
        a && (n == null || n(h));
      },
      [a, n],
    ),
    l = T.useCallback(
      (h) => {
        r && (t == null || t(h));
      },
      [r, t],
    );
  return m.createElement(
    'nav',
    { ...o },
    m.createElement(
      s.PreviousMonthButton,
      {
        type: 'button',
        className: i[b.PreviousMonthButton],
        tabIndex: r ? void 0 : -1,
        'aria-disabled': r ? void 0 : !0,
        'aria-label': c(r),
        onClick: l,
      },
      m.createElement(s.Chevron, {
        disabled: r ? void 0 : !0,
        className: i[b.Chevron],
        orientation: 'left',
      }),
    ),
    m.createElement(
      s.NextMonthButton,
      {
        type: 'button',
        className: i[b.NextMonthButton],
        tabIndex: a ? void 0 : -1,
        'aria-disabled': a ? void 0 : !0,
        'aria-label': u(a),
        onClick: d,
      },
      m.createElement(s.Chevron, {
        disabled: a ? void 0 : !0,
        orientation: 'right',
        className: i[b.Chevron],
      }),
    ),
  );
}
function Aa(e) {
  const { components: t } = pe();
  return m.createElement(t.Button, { ...e });
}
function za(e) {
  return m.createElement('option', { ...e });
}
function Ra(e) {
  const { components: t } = pe();
  return m.createElement(t.Button, { ...e });
}
function Ga(e) {
  const { rootRef: t, ...n } = e;
  return m.createElement('div', { ...n, ref: t });
}
function $a(e) {
  return m.createElement('select', { ...e });
}
function Va(e) {
  const { week: t, ...n } = e;
  return m.createElement('tr', { ...n });
}
function Qa(e) {
  return m.createElement('th', { ...e });
}
function Xa(e) {
  return m.createElement('thead', { 'aria-hidden': !0 }, m.createElement('tr', { ...e }));
}
function Ua(e) {
  const { week: t, ...n } = e;
  return m.createElement('th', { ...n });
}
function Ka(e) {
  return m.createElement('th', { ...e });
}
function Ja(e) {
  return m.createElement('tbody', { ...e });
}
function Za(e) {
  const { components: t } = pe();
  return m.createElement(t.Dropdown, { ...e });
}
const La = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      Button: Na,
      CaptionLabel: xa,
      Chevron: Ca,
      Day: Ya,
      DayButton: Ta,
      Dropdown: _a,
      DropdownNav: Pa,
      Footer: Ea,
      Month: Fa,
      MonthCaption: Ba,
      MonthGrid: Ia,
      Months: ja,
      MonthsDropdown: qa,
      Nav: Ha,
      NextMonthButton: Aa,
      Option: za,
      PreviousMonthButton: Ra,
      Root: Ga,
      Select: $a,
      Week: Va,
      WeekNumber: Ua,
      WeekNumberHeader: Ka,
      Weekday: Qa,
      Weekdays: Xa,
      Weeks: Ja,
      YearsDropdown: Za,
    },
    Symbol.toStringTag,
    { value: 'Module' },
  ),
);
function re(e, t, n = !1, r = ee) {
  let { from: a, to: o } = e;
  const { differenceInCalendarDays: s, isSameDay: i } = r;
  return a && o
    ? (s(o, a) < 0 && ([a, o] = [o, a]), s(t, a) >= (n ? 1 : 0) && s(o, t) >= (n ? 1 : 0))
    : !n && o
      ? i(o, t)
      : !n && a
        ? i(a, t)
        : !1;
}
function et(e) {
  return !!(e && typeof e == 'object' && 'before' in e && 'after' in e);
}
function Ee(e) {
  return !!(e && typeof e == 'object' && 'from' in e);
}
function tt(e) {
  return !!(e && typeof e == 'object' && 'after' in e);
}
function nt(e) {
  return !!(e && typeof e == 'object' && 'before' in e);
}
function tn(e) {
  return !!(e && typeof e == 'object' && 'dayOfWeek' in e);
}
function nn(e, t) {
  return Array.isArray(e) && e.every(t.isDate);
}
function ae(e, t, n = ee) {
  const r = Array.isArray(t) ? t : [t],
    { isSameDay: a, differenceInCalendarDays: o, isAfter: s } = n;
  return r.some((i) => {
    if (typeof i == 'boolean') return i;
    if (n.isDate(i)) return a(e, i);
    if (nn(i, n)) return i.some((c) => a(e, c));
    if (Ee(i)) return re(i, e, !1, n);
    if (tn(i))
      return Array.isArray(i.dayOfWeek)
        ? i.dayOfWeek.includes(e.getDay())
        : i.dayOfWeek === e.getDay();
    if (et(i)) {
      const c = o(i.before, e),
        u = o(i.after, e),
        d = c > 0,
        l = u < 0;
      return s(i.before, i.after) ? l && d : d || l;
    }
    return tt(i)
      ? o(e, i.after) > 0
      : nt(i)
        ? o(i.before, e) > 0
        : typeof i == 'function'
          ? i(e)
          : !1;
  });
}
function eo(e, t, n, r, a) {
  const {
      disabled: o,
      hidden: s,
      modifiers: i,
      showOutsideDays: c,
      broadcastCalendar: u,
      today: d = a.today(),
    } = t,
    { isSameDay: l, isSameMonth: h, startOfMonth: y, isBefore: v, endOfMonth: p, isAfter: M } = a,
    N = n && y(n),
    w = r && p(r),
    g = { [B.focused]: [], [B.outside]: [], [B.disabled]: [], [B.hidden]: [], [B.today]: [] },
    W = {};
  for (const k of e) {
    const { date: f, displayMonth: S } = k,
      F = !!(S && !h(f, S)),
      H = !!(N && v(f, N)),
      I = !!(w && M(f, w)),
      $ = !!(o && ae(f, o, a)),
      oe = !!(s && ae(f, s, a)) || H || I || (!u && !c && F) || (u && c === !1 && F),
      te = l(f, d);
    F && g.outside.push(k),
      $ && g.disabled.push(k),
      oe && g.hidden.push(k),
      te && g.today.push(k),
      i &&
        Object.keys(i).forEach((V) => {
          const ue = i == null ? void 0 : i[V];
          ue && ae(f, ue, a) && (W[V] ? W[V].push(k) : (W[V] = [k]));
        });
  }
  return (k) => {
    const f = { [B.focused]: !1, [B.disabled]: !1, [B.hidden]: !1, [B.outside]: !1, [B.today]: !1 },
      S = {};
    for (const F in g) {
      const H = g[F];
      f[F] = H.some((I) => I === k);
    }
    for (const F in W) S[F] = W[F].some((H) => H === k);
    return { ...f, ...S };
  };
}
function to(e, t, n = {}) {
  return Object.entries(e)
    .filter(([, a]) => a === !0)
    .reduce(
      (a, [o]) => (n[o] ? a.push(n[o]) : t[B[o]] ? a.push(t[B[o]]) : t[J[o]] && a.push(t[J[o]]), a),
      [t[b.Day]],
    );
}
function no(e) {
  return { ...La, ...e };
}
function ro(e) {
  const t = {
    'data-mode': e.mode ?? void 0,
    'data-required': 'required' in e ? e.required : void 0,
    'data-multiple-months': (e.numberOfMonths && e.numberOfMonths > 1) || void 0,
    'data-week-numbers': e.showWeekNumber || void 0,
    'data-broadcast-calendar': e.broadcastCalendar || void 0,
    'data-nav-layout': e.navLayout || void 0,
  };
  return (
    Object.entries(e).forEach(([n, r]) => {
      n.startsWith('data-') && (t[n] = r);
    }),
    t
  );
}
function rt() {
  const e = {};
  for (const t in b) e[b[t]] = `rdp-${b[t]}`;
  for (const t in B) e[B[t]] = `rdp-${B[t]}`;
  for (const t in J) e[J[t]] = `rdp-${J[t]}`;
  for (const t in R) e[R[t]] = `rdp-${R[t]}`;
  return e;
}
function rn(e, t, n) {
  return (n ?? new G(t)).formatMonthYear(e);
}
const ao = rn;
function oo(e, t, n) {
  return (n ?? new G(t)).format(e, 'd');
}
function so(e, t = ee) {
  return t.format(e, 'LLLL');
}
function io(e, t, n) {
  return (n ?? new G(t)).format(e, 'cccccc');
}
function co(e, t = ee) {
  return e < 10
    ? t.formatNumber(`0${e.toLocaleString()}`)
    : t.formatNumber(`${e.toLocaleString()}`);
}
function uo() {
  return '';
}
function an(e, t = ee) {
  return t.format(e, 'yyyy');
}
const lo = an,
  fo = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        formatCaption: rn,
        formatDay: oo,
        formatMonthCaption: ao,
        formatMonthDropdown: so,
        formatWeekNumber: co,
        formatWeekNumberHeader: uo,
        formatWeekdayName: io,
        formatYearCaption: lo,
        formatYearDropdown: an,
      },
      Symbol.toStringTag,
      { value: 'Module' },
    ),
  );
function ho(e) {
  return (
    e != null &&
      e.formatMonthCaption &&
      !e.formatCaption &&
      (e.formatCaption = e.formatMonthCaption),
    e != null &&
      e.formatYearCaption &&
      !e.formatYearDropdown &&
      (e.formatYearDropdown = e.formatYearCaption),
    { ...fo, ...e }
  );
}
function at(e, t, n, r) {
  let a = (r ?? new G(n)).format(e, 'PPPP');
  return t.today && (a = `Today, ${a}`), t.selected && (a = `${a}, selected`), a;
}
const mo = at;
function ot(e, t, n) {
  return (n ?? new G(t)).formatMonthYear(e);
}
const yo = ot;
function on(e, t, n, r) {
  let a = (r ?? new G(n)).format(e, 'PPPP');
  return t != null && t.today && (a = `Today, ${a}`), a;
}
function sn(e) {
  return 'Choose the Month';
}
function cn() {
  return '';
}
const go = 'Go to the Next Month';
function un(e, t) {
  return go;
}
function dn(e) {
  return 'Go to the Previous Month';
}
function ln(e, t, n) {
  return (n ?? new G(t)).format(e, 'cccc');
}
function fn(e, t) {
  return `Week ${e}`;
}
function hn(e) {
  return 'Week Number';
}
function mn(e) {
  return 'Choose the Year';
}
const wo = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        labelCaption: yo,
        labelDay: mo,
        labelDayButton: at,
        labelGrid: ot,
        labelGridcell: on,
        labelMonthDropdown: sn,
        labelNav: cn,
        labelNext: un,
        labelPrevious: dn,
        labelWeekNumber: fn,
        labelWeekNumberHeader: hn,
        labelWeekday: ln,
        labelYearDropdown: mn,
      },
      Symbol.toStringTag,
      { value: 'Module' },
    ),
  ),
  K = (e, t, n) => t || (n ? (typeof n == 'function' ? n : (...r) => n) : e);
function bo(e, t) {
  var r;
  const n = ((r = t.locale) == null ? void 0 : r.labels) ?? {};
  return {
    ...wo,
    ...(e ?? {}),
    labelDayButton: K(at, e == null ? void 0 : e.labelDayButton, n.labelDayButton),
    labelMonthDropdown: K(sn, e == null ? void 0 : e.labelMonthDropdown, n.labelMonthDropdown),
    labelNext: K(un, e == null ? void 0 : e.labelNext, n.labelNext),
    labelPrevious: K(dn, e == null ? void 0 : e.labelPrevious, n.labelPrevious),
    labelWeekNumber: K(fn, e == null ? void 0 : e.labelWeekNumber, n.labelWeekNumber),
    labelYearDropdown: K(mn, e == null ? void 0 : e.labelYearDropdown, n.labelYearDropdown),
    labelGrid: K(ot, e == null ? void 0 : e.labelGrid, n.labelGrid),
    labelGridcell: K(on, e == null ? void 0 : e.labelGridcell, n.labelGridcell),
    labelNav: K(cn, e == null ? void 0 : e.labelNav, n.labelNav),
    labelWeekNumberHeader: K(
      hn,
      e == null ? void 0 : e.labelWeekNumberHeader,
      n.labelWeekNumberHeader,
    ),
    labelWeekday: K(ln, e == null ? void 0 : e.labelWeekday, n.labelWeekday),
  };
}
function Do(e, t, n, r, a) {
  const { startOfMonth: o, startOfYear: s, endOfYear: i, eachMonthOfInterval: c, getMonth: u } = a;
  return c({ start: s(e), end: i(e) }).map((h) => {
    const y = r.formatMonthDropdown(h, a),
      v = u(h),
      p = (t && h < o(t)) || (n && h > o(n)) || !1;
    return { value: v, label: y, disabled: p };
  });
}
function ko(e, t = {}, n = {}) {
  let r = { ...(t == null ? void 0 : t[b.Day]) };
  return (
    Object.entries(e)
      .filter(([, a]) => a === !0)
      .forEach(([a]) => {
        r = { ...r, ...(n == null ? void 0 : n[a]) };
      }),
    r
  );
}
function Mo(e, t, n, r) {
  const a = r ?? e.today(),
    o = n ? e.startOfBroadcastWeek(a, e) : t ? e.startOfISOWeek(a) : e.startOfWeek(a),
    s = [];
  for (let i = 0; i < 7; i++) {
    const c = e.addDays(o, i);
    s.push(c);
  }
  return s;
}
function vo(e, t, n, r, a = !1) {
  if (!e || !t) return;
  const { startOfYear: o, endOfYear: s, eachYearOfInterval: i, getYear: c } = r,
    u = o(e),
    d = s(t),
    l = i({ start: u, end: d });
  return (
    a && l.reverse(),
    l.map((h) => {
      const y = n.formatYearDropdown(h, r);
      return { value: c(h), label: y, disabled: !1 };
    })
  );
}
function Oo(e, t = {}) {
  var i;
  const { weekStartsOn: n, locale: r } = t,
    a = n ?? ((i = r == null ? void 0 : r.options) == null ? void 0 : i.weekStartsOn) ?? 0,
    o = (c) => {
      const u = typeof c == 'number' || typeof c == 'string' ? new Date(c) : c;
      return new A(u.getFullYear(), u.getMonth(), u.getDate(), 12, 0, 0, e);
    },
    s = (c) => {
      const u = o(c);
      return new Date(u.getFullYear(), u.getMonth(), u.getDate(), 0, 0, 0, 0);
    };
  return {
    today: () => o(A.tz(e)),
    newDate: (c, u, d) => new A(c, u, d, 12, 0, 0, e),
    startOfDay: (c) => o(c),
    startOfWeek: (c, u) => {
      const d = o(c),
        l = (u == null ? void 0 : u.weekStartsOn) ?? a,
        h = (d.getDay() - l + 7) % 7;
      return d.setDate(d.getDate() - h), d;
    },
    startOfISOWeek: (c) => {
      const u = o(c),
        d = (u.getDay() - 1 + 7) % 7;
      return u.setDate(u.getDate() - d), u;
    },
    startOfMonth: (c) => {
      const u = o(c);
      return u.setDate(1), u;
    },
    startOfYear: (c) => {
      const u = o(c);
      return u.setMonth(0, 1), u;
    },
    endOfWeek: (c, u) => {
      const d = o(c),
        y = (((((u == null ? void 0 : u.weekStartsOn) ?? a) + 6) % 7) - d.getDay() + 7) % 7;
      return d.setDate(d.getDate() + y), d;
    },
    endOfISOWeek: (c) => {
      const u = o(c),
        d = (7 - u.getDay()) % 7;
      return u.setDate(u.getDate() + d), u;
    },
    endOfMonth: (c) => {
      const u = o(c);
      return u.setMonth(u.getMonth() + 1, 0), u;
    },
    endOfYear: (c) => {
      const u = o(c);
      return u.setMonth(11, 31), u;
    },
    eachMonthOfInterval: (c) => {
      const u = o(c.start),
        d = o(c.end),
        l = [],
        h = new A(u.getFullYear(), u.getMonth(), 1, 12, 0, 0, e),
        y = d.getFullYear() * 12 + d.getMonth();
      while (h.getFullYear() * 12 + h.getMonth() <= y)
        l.push(new A(h, e)), h.setMonth(h.getMonth() + 1, 1);
      return l;
    },
    addDays: (c, u) => {
      const d = o(c);
      return d.setDate(d.getDate() + u), d;
    },
    addWeeks: (c, u) => {
      const d = o(c);
      return d.setDate(d.getDate() + u * 7), d;
    },
    addMonths: (c, u) => {
      const d = o(c);
      return d.setMonth(d.getMonth() + u), d;
    },
    addYears: (c, u) => {
      const d = o(c);
      return d.setFullYear(d.getFullYear() + u), d;
    },
    eachYearOfInterval: (c) => {
      const u = o(c.start),
        d = o(c.end),
        l = [],
        h = new A(u.getFullYear(), 0, 1, 12, 0, 0, e);
      while (h.getFullYear() <= d.getFullYear())
        l.push(new A(h, e)), h.setFullYear(h.getFullYear() + 1, 0, 1);
      return l;
    },
    getWeek: (c, u) => {
      var l;
      const d = s(c);
      return Le(d, {
        weekStartsOn: (u == null ? void 0 : u.weekStartsOn) ?? a,
        firstWeekContainsDate:
          (u == null ? void 0 : u.firstWeekContainsDate) ??
          ((l = r == null ? void 0 : r.options) == null ? void 0 : l.firstWeekContainsDate) ??
          1,
      });
    },
    getISOWeek: (c) => {
      const u = s(c);
      return Ze(u);
    },
    differenceInCalendarDays: (c, u) => {
      const d = s(c),
        l = s(u);
      return Je(d, l);
    },
    differenceInCalendarMonths: (c, u) => {
      const d = s(c),
        l = s(u);
      return $t(d, l);
    },
  };
}
const We = (e) => (e instanceof HTMLElement ? e : null),
  Ve = (e) => [...(e.querySelectorAll('[data-animated-month]') ?? [])],
  po = (e) => We(e.querySelector('[data-animated-month]')),
  Qe = (e) => We(e.querySelector('[data-animated-caption]')),
  Xe = (e) => We(e.querySelector('[data-animated-weeks]')),
  Wo = (e) => We(e.querySelector('[data-animated-nav]')),
  So = (e) => We(e.querySelector('[data-animated-weekdays]'));
function No(e, t, { classNames: n, months: r, focused: a, dateLib: o }) {
  const s = T.useRef(null),
    i = T.useRef(r),
    c = T.useRef(!1);
  T.useLayoutEffect(() => {
    const u = i.current;
    if (
      ((i.current = r),
      !t ||
        !e.current ||
        !(e.current instanceof HTMLElement) ||
        r.length === 0 ||
        u.length === 0 ||
        r.length !== u.length)
    )
      return;
    const d = o.isSameMonth(r[0].date, u[0].date),
      l = o.isAfter(r[0].date, u[0].date),
      h = l ? n[R.caption_after_enter] : n[R.caption_before_enter],
      y = l ? n[R.weeks_after_enter] : n[R.weeks_before_enter],
      v = s.current,
      p = e.current.cloneNode(!0);
    if (
      (p instanceof HTMLElement
        ? (Ve(p).forEach((g) => {
            if (!(g instanceof HTMLElement)) return;
            const W = po(g);
            W && g.contains(W) && g.removeChild(W);
            const k = Qe(g);
            k && k.classList.remove(h);
            const f = Xe(g);
            f && f.classList.remove(y);
          }),
          (s.current = p))
        : (s.current = null),
      c.current || d || a)
    )
      return;
    const M = v instanceof HTMLElement ? Ve(v) : [],
      N = Ve(e.current);
    if (
      N != null &&
      N.every((w) => w instanceof HTMLElement) &&
      M &&
      M.every((w) => w instanceof HTMLElement)
    ) {
      (c.current = !0), (e.current.style.isolation = 'isolate');
      const w = Wo(e.current);
      w && (w.style.zIndex = '1'),
        N.forEach((g, W) => {
          const k = M[W];
          if (!k) return;
          (g.style.position = 'relative'), (g.style.overflow = 'hidden');
          const f = Qe(g);
          f && f.classList.add(h);
          const S = Xe(g);
          S && S.classList.add(y);
          const F = () => {
            (c.current = !1),
              e.current && (e.current.style.isolation = ''),
              w && (w.style.zIndex = ''),
              f && f.classList.remove(h),
              S && S.classList.remove(y),
              (g.style.position = ''),
              (g.style.overflow = ''),
              g.contains(k) && g.removeChild(k);
          };
          (k.style.pointerEvents = 'none'),
            (k.style.position = 'absolute'),
            (k.style.overflow = 'hidden'),
            k.setAttribute('aria-hidden', 'true');
          const H = So(k);
          H && (H.style.opacity = '0');
          const I = Qe(k);
          I &&
            (I.classList.add(l ? n[R.caption_before_exit] : n[R.caption_after_exit]),
            I.addEventListener('animationend', F));
          const $ = Xe(k);
          $ && $.classList.add(l ? n[R.weeks_before_exit] : n[R.weeks_after_exit]),
            g.insertBefore(k, g.firstChild);
        });
    }
  });
}
function xo(e, t, n, r) {
  const a = e[0],
    o = e[e.length - 1],
    { ISOWeek: s, fixedWeeks: i, broadcastCalendar: c } = n ?? {},
    {
      addDays: u,
      differenceInCalendarDays: d,
      differenceInCalendarMonths: l,
      endOfBroadcastWeek: h,
      endOfISOWeek: y,
      endOfMonth: v,
      endOfWeek: p,
      isAfter: M,
      startOfBroadcastWeek: N,
      startOfISOWeek: w,
      startOfWeek: g,
    } = r,
    W = c ? N(a, r) : s ? w(a) : g(a),
    k = c ? h(o) : s ? y(v(o)) : p(v(o)),
    f = t && (c ? h(t) : s ? y(t) : p(t)),
    S = f && M(k, f) ? f : k,
    F = d(S, W),
    H = l(o, a) + 1,
    I = [];
  for (let te = 0; te <= F; te++) {
    const V = u(W, te);
    I.push(V);
  }
  const oe = (c ? 35 : 42) * H;
  if (i && I.length < oe) {
    const te = oe - I.length;
    for (let V = 0; V < te; V++) {
      const ue = u(I[I.length - 1], 1);
      I.push(ue);
    }
  }
  return I;
}
function Co(e) {
  const t = [];
  return e.reduce((n, r) => {
    const a = r.weeks.reduce((o, s) => o.concat(s.days.slice()), t.slice());
    return n.concat(a.slice());
  }, t.slice());
}
function Yo(e, t, n, r) {
  const { numberOfMonths: a = 1 } = n,
    o = [];
  for (let s = 0; s < a; s++) {
    const i = r.addMonths(e, s);
    if (t && i > t) break;
    o.push(i);
  }
  return o;
}
function Ot(e, t, n, r) {
  const { month: a, defaultMonth: o, today: s = r.today(), numberOfMonths: i = 1 } = e;
  let c = a || o || s;
  const { differenceInCalendarMonths: u, addMonths: d, startOfMonth: l } = r;
  if (n && u(n, c) < i - 1) {
    const h = -1 * (i - 1);
    c = d(n, h);
  }
  return t && u(c, t) < 0 && (c = t), l(c);
}
function To(e, t, n, r) {
  const {
      addDays: a,
      endOfBroadcastWeek: o,
      endOfISOWeek: s,
      endOfMonth: i,
      endOfWeek: c,
      getISOWeek: u,
      getWeek: d,
      startOfBroadcastWeek: l,
      startOfISOWeek: h,
      startOfWeek: y,
    } = r,
    v = e.reduce((p, M) => {
      const N = n.broadcastCalendar ? l(M, r) : n.ISOWeek ? h(M) : y(M),
        w = n.broadcastCalendar ? o(M) : n.ISOWeek ? s(i(M)) : c(i(M)),
        g = t.filter((S) => S >= N && S <= w),
        W = n.broadcastCalendar ? 35 : 42;
      if (n.fixedWeeks && g.length < W) {
        const S = t.filter((F) => {
          const H = W - g.length;
          return F > w && F <= a(w, H);
        });
        g.push(...S);
      }
      const k = g.reduce((S, F) => {
          const H = n.ISOWeek ? u(F) : d(F),
            I = S.find((oe) => oe.weekNumber === H),
            $ = new Lt(F, M, r);
          return I ? I.days.push($) : S.push(new Sa(H, [$])), S;
        }, []),
        f = new Wa(M, k);
      return p.push(f), p;
    }, []);
  return n.reverseMonths ? v.reverse() : v;
}
function _o(e, t) {
  let { startMonth: n, endMonth: r } = e;
  const {
      startOfYear: a,
      startOfDay: o,
      startOfMonth: s,
      endOfMonth: i,
      addYears: c,
      endOfYear: u,
      newDate: d,
      today: l,
    } = t,
    { fromYear: h, toYear: y, fromMonth: v, toMonth: p } = e;
  !n && v && (n = v),
    !n && h && (n = t.newDate(h, 0, 1)),
    !r && p && (r = p),
    !r && y && (r = d(y, 11, 31));
  const M = e.captionLayout === 'dropdown' || e.captionLayout === 'dropdown-years';
  return (
    n ? (n = s(n)) : h ? (n = d(h, 0, 1)) : !n && M && (n = a(c(e.today ?? l(), -100))),
    r ? (r = i(r)) : y ? (r = d(y, 11, 31)) : !r && M && (r = u(e.today ?? l())),
    [n && o(n), r && o(r)]
  );
}
function Po(e, t, n, r) {
  if (n.disableNavigation) return;
  const { pagedNavigation: a, numberOfMonths: o = 1 } = n,
    { startOfMonth: s, addMonths: i, differenceInCalendarMonths: c } = r,
    u = a ? o : 1,
    d = s(e);
  if (!t) return i(d, u);
  if (!(c(t, e) < o)) return i(d, u);
}
function Eo(e, t, n, r) {
  if (n.disableNavigation) return;
  const { pagedNavigation: a, numberOfMonths: o } = n,
    { startOfMonth: s, addMonths: i, differenceInCalendarMonths: c } = r,
    u = a ? (o ?? 1) : 1,
    d = s(e);
  if (!t) return i(d, -u);
  if (!(c(d, t) <= 0)) return i(d, -u);
}
function Fo(e) {
  const t = [];
  return e.reduce((n, r) => n.concat(r.weeks.slice()), t.slice());
}
function Fe(e, t) {
  const [n, r] = T.useState(e);
  return [t === void 0 ? n : t, r];
}
function Bo(e, t) {
  var W;
  const [n, r] = _o(e, t),
    { startOfMonth: a, endOfMonth: o } = t,
    s = Ot(e, n, r, t),
    [i, c] = Fe(s, e.month ? s : void 0);
  T.useEffect(() => {
    const k = Ot(e, n, r, t);
    c(k);
  }, [e.timeZone]);
  const {
      months: u,
      weeks: d,
      days: l,
      previousMonth: h,
      nextMonth: y,
    } = T.useMemo(() => {
      const k = Yo(i, r, { numberOfMonths: e.numberOfMonths }, t),
        f = xo(
          k,
          e.endMonth ? o(e.endMonth) : void 0,
          { ISOWeek: e.ISOWeek, fixedWeeks: e.fixedWeeks, broadcastCalendar: e.broadcastCalendar },
          t,
        ),
        S = To(
          k,
          f,
          {
            broadcastCalendar: e.broadcastCalendar,
            fixedWeeks: e.fixedWeeks,
            ISOWeek: e.ISOWeek,
            reverseMonths: e.reverseMonths,
          },
          t,
        ),
        F = Fo(S),
        H = Co(S),
        I = Eo(i, n, e, t),
        $ = Po(i, r, e, t);
      return { months: S, weeks: F, days: H, previousMonth: I, nextMonth: $ };
    }, [
      t,
      i.getTime(),
      r == null ? void 0 : r.getTime(),
      n == null ? void 0 : n.getTime(),
      e.disableNavigation,
      e.broadcastCalendar,
      (W = e.endMonth) == null ? void 0 : W.getTime(),
      e.fixedWeeks,
      e.ISOWeek,
      e.numberOfMonths,
      e.pagedNavigation,
      e.reverseMonths,
    ]),
    { disableNavigation: v, onMonthChange: p } = e,
    M = (k) => d.some((f) => f.days.some((S) => S.isEqualTo(k))),
    N = (k) => {
      if (v) return;
      let f = a(k);
      n && f < a(n) && (f = a(n)), r && f > a(r) && (f = a(r)), c(f), p == null || p(f);
    };
  return {
    months: u,
    weeks: d,
    days: l,
    navStart: n,
    navEnd: r,
    previousMonth: h,
    nextMonth: y,
    goToMonth: N,
    goToDay: (k) => {
      M(k) || N(k.date);
    },
  };
}
var Z;
((e) => {
  (e[(e.Today = 0)] = 'Today'),
    (e[(e.Selected = 1)] = 'Selected'),
    (e[(e.LastFocused = 2)] = 'LastFocused'),
    (e[(e.FocusedModifier = 3)] = 'FocusedModifier');
})(Z || (Z = {}));
function pt(e) {
  return !e[B.disabled] && !e[B.hidden] && !e[B.outside];
}
function Io(e, t, n, r) {
  let a,
    o = -1;
  for (const s of e) {
    const i = t(s);
    pt(i) &&
      (i[B.focused] && o < Z.FocusedModifier
        ? ((a = s), (o = Z.FocusedModifier))
        : r != null && r.isEqualTo(s) && o < Z.LastFocused
          ? ((a = s), (o = Z.LastFocused))
          : n(s.date) && o < Z.Selected
            ? ((a = s), (o = Z.Selected))
            : i[B.today] && o < Z.Today && ((a = s), (o = Z.Today)));
  }
  return a || (a = e.find((s) => pt(t(s)))), a;
}
function jo(e, t, n, r, a, o, s) {
  const { ISOWeek: i, broadcastCalendar: c } = o,
    {
      addDays: u,
      addMonths: d,
      addWeeks: l,
      addYears: h,
      endOfBroadcastWeek: y,
      endOfISOWeek: v,
      endOfWeek: p,
      max: M,
      min: N,
      startOfBroadcastWeek: w,
      startOfISOWeek: g,
      startOfWeek: W,
    } = s;
  let f = {
    day: u,
    week: l,
    month: d,
    year: h,
    startOfWeek: (S) => (c ? w(S, s) : i ? g(S) : W(S)),
    endOfWeek: (S) => (c ? y(S) : i ? v(S) : p(S)),
  }[e](n, t === 'after' ? 1 : -1);
  return t === 'before' && r ? (f = M([r, f])) : t === 'after' && a && (f = N([a, f])), f;
}
function yn(e, t, n, r, a, o, s, i = 0) {
  if (i > 365) return;
  const c = jo(e, t, n.date, r, a, o, s),
    u = !!(o.disabled && ae(c, o.disabled, s)),
    d = !!(o.hidden && ae(c, o.hidden, s)),
    l = c,
    h = new Lt(c, l, s);
  return !u && !d ? h : yn(e, t, h, r, a, o, s, i + 1);
}
function qo(e, t, n, r, a) {
  const { autoFocus: o } = e,
    [s, i] = T.useState(),
    c = Io(t.days, n, r || (() => !1), s),
    [u, d] = T.useState(o ? c : void 0);
  return {
    isFocusTarget: (p) => !!(c != null && c.isEqualTo(p)),
    setFocused: d,
    focused: u,
    blur: () => {
      i(u), d(void 0);
    },
    moveFocus: (p, M) => {
      if (!u) return;
      const N = yn(p, M, u, t.navStart, t.navEnd, e, a);
      N && ((e.disableNavigation && !t.days.some((g) => g.isEqualTo(N))) || (t.goToDay(N), d(N)));
    },
  };
}
function Ho(e, t) {
  const { selected: n, required: r, onSelect: a } = e,
    [o, s] = Fe(n, a ? n : void 0),
    i = a ? n : o,
    { isSameDay: c } = t,
    u = (y) => (i == null ? void 0 : i.some((v) => c(v, y))) ?? !1,
    { min: d, max: l } = e;
  return {
    selected: i,
    select: (y, v, p) => {
      let M = [...(i ?? [])];
      if (u(y)) {
        if ((i == null ? void 0 : i.length) === d || (r && (i == null ? void 0 : i.length) === 1))
          return;
        M = i == null ? void 0 : i.filter((N) => !c(N, y));
      } else (i == null ? void 0 : i.length) === l ? (M = [y]) : (M = [...M, y]);
      return a || s(M), a == null || a(M, y, v, p), M;
    },
    isSelected: u,
  };
}
function Ao(e, t, n = 0, r = 0, a = !1, o = ee) {
  const { from: s, to: i } = t || {},
    { isSameDay: c, isAfter: u, isBefore: d } = o;
  let l;
  if (!s && !i) l = { from: e, to: n > 0 ? void 0 : e };
  else if (s && !i)
    c(s, e)
      ? n === 0
        ? (l = { from: s, to: e })
        : a
          ? (l = { from: s, to: void 0 })
          : (l = void 0)
      : d(e, s)
        ? (l = { from: e, to: s })
        : (l = { from: s, to: e });
  else if (s && i)
    if (c(s, e) && c(i, e)) a ? (l = { from: s, to: i }) : (l = void 0);
    else if (c(s, e)) l = { from: s, to: n > 0 ? void 0 : e };
    else if (c(i, e)) l = { from: e, to: n > 0 ? void 0 : e };
    else if (d(e, s)) l = { from: e, to: i };
    else if (u(e, s)) l = { from: s, to: e };
    else if (u(e, i)) l = { from: s, to: e };
    else throw new Error('Invalid range');
  if (l != null && l.from && l != null && l.to) {
    const h = o.differenceInCalendarDays(l.to, l.from);
    r > 0 && h > r
      ? (l = { from: e, to: void 0 })
      : n > 1 && h < n && (l = { from: e, to: void 0 });
  }
  return l;
}
function zo(e, t, n = ee) {
  const r = Array.isArray(t) ? t : [t];
  let a = e.from;
  const o = n.differenceInCalendarDays(e.to, e.from),
    s = Math.min(o, 6);
  for (let i = 0; i <= s; i++) {
    if (r.includes(a.getDay())) return !0;
    a = n.addDays(a, 1);
  }
  return !1;
}
function Wt(e, t, n = ee) {
  return re(e, t.from, !1, n) || re(e, t.to, !1, n) || re(t, e.from, !1, n) || re(t, e.to, !1, n);
}
function Ro(e, t, n = ee) {
  const r = Array.isArray(t) ? t : [t];
  if (
    r
      .filter((i) => typeof i != 'function')
      .some((i) =>
        typeof i == 'boolean'
          ? i
          : n.isDate(i)
            ? re(e, i, !1, n)
            : nn(i, n)
              ? i.some((c) => re(e, c, !1, n))
              : Ee(i)
                ? i.from && i.to
                  ? Wt(e, { from: i.from, to: i.to }, n)
                  : !1
                : tn(i)
                  ? zo(e, i.dayOfWeek, n)
                  : et(i)
                    ? n.isAfter(i.before, i.after)
                      ? Wt(e, { from: n.addDays(i.after, 1), to: n.addDays(i.before, -1) }, n)
                      : ae(e.from, i, n) || ae(e.to, i, n)
                    : tt(i) || nt(i)
                      ? ae(e.from, i, n) || ae(e.to, i, n)
                      : !1,
      )
  )
    return !0;
  const s = r.filter((i) => typeof i == 'function');
  if (s.length) {
    let i = e.from;
    const c = n.differenceInCalendarDays(e.to, e.from);
    for (let u = 0; u <= c; u++) {
      if (s.some((d) => d(i))) return !0;
      i = n.addDays(i, 1);
    }
  }
  return !1;
}
function Go(e, t) {
  const {
      disabled: n,
      excludeDisabled: r,
      resetOnSelect: a,
      selected: o,
      required: s,
      onSelect: i,
    } = e,
    [c, u] = Fe(o, i ? o : void 0),
    d = i ? o : c;
  return {
    selected: d,
    select: (y, v, p) => {
      const { min: M, max: N } = e;
      let w;
      if (y) {
        const g = d == null ? void 0 : d.from,
          W = d == null ? void 0 : d.to,
          k = !!g && !!W,
          f = !!g && !!W && t.isSameDay(g, W) && t.isSameDay(y, g);
        a && (k || !(d != null && d.from))
          ? !s && f
            ? (w = void 0)
            : (w = { from: y, to: void 0 })
          : (w = Ao(y, d, M, N, s, t));
      }
      return (
        r &&
          n &&
          w != null &&
          w.from &&
          w.to &&
          Ro({ from: w.from, to: w.to }, n, t) &&
          ((w.from = y), (w.to = void 0)),
        i || u(w),
        i == null || i(w, y, v, p),
        w
      );
    },
    isSelected: (y) => d && re(d, y, !1, t),
  };
}
function $o(e, t) {
  const { selected: n, required: r, onSelect: a } = e,
    [o, s] = Fe(n, a ? n : void 0),
    i = a ? n : o,
    { isSameDay: c } = t;
  return {
    selected: i,
    select: (l, h, y) => {
      let v = l;
      return !r && i && i && c(l, i) && (v = void 0), a || s(v), a == null || a(v, l, h, y), v;
    },
    isSelected: (l) => (i ? c(i, l) : !1),
  };
}
function Vo(e, t) {
  const n = $o(e, t),
    r = Ho(e, t),
    a = Go(e, t);
  switch (e.mode) {
    case 'single':
      return n;
    case 'multiple':
      return r;
    case 'range':
      return a;
    default:
      return;
  }
}
function Q(e, t) {
  return e instanceof A && e.timeZone === t ? e : new A(e, t);
}
function le(e, t, n) {
  return Q(e, t);
}
function St(e, t, n) {
  return typeof e == 'boolean' || typeof e == 'function'
    ? e
    : e instanceof Date
      ? le(e, t)
      : Array.isArray(e)
        ? e.map((r) => (r instanceof Date ? le(r, t) : r))
        : Ee(e)
          ? { ...e, from: e.from ? Q(e.from, t) : e.from, to: e.to ? Q(e.to, t) : e.to }
          : et(e)
            ? { before: le(e.before, t), after: le(e.after, t) }
            : tt(e)
              ? { after: le(e.after, t) }
              : nt(e)
                ? { before: le(e.before, t) }
                : e;
}
function Ue(e, t, n) {
  return e && (Array.isArray(e) ? e.map((r) => St(r, t)) : St(e, t));
}
function Qo(e) {
  var ft;
  let t = e;
  const n = t.timeZone;
  if (
    n &&
    ((t = { ...e, timeZone: n }),
    t.today && (t.today = Q(t.today, n)),
    t.month && (t.month = Q(t.month, n)),
    t.defaultMonth && (t.defaultMonth = Q(t.defaultMonth, n)),
    t.startMonth && (t.startMonth = Q(t.startMonth, n)),
    t.endMonth && (t.endMonth = Q(t.endMonth, n)),
    t.mode === 'single' && t.selected
      ? (t.selected = Q(t.selected, n))
      : t.mode === 'multiple' && t.selected
        ? (t.selected = (ft = t.selected) == null ? void 0 : ft.map((O) => Q(O, n)))
        : t.mode === 'range' &&
          t.selected &&
          (t.selected = {
            from: t.selected.from ? Q(t.selected.from, n) : t.selected.from,
            to: t.selected.to ? Q(t.selected.to, n) : t.selected.to,
          }),
    t.disabled !== void 0 && (t.disabled = Ue(t.disabled, n)),
    t.hidden !== void 0 && (t.hidden = Ue(t.hidden, n)),
    t.modifiers)
  ) {
    const O = {};
    Object.keys(t.modifiers).forEach((_) => {
      var D;
      O[_] = Ue((D = t.modifiers) == null ? void 0 : D[_], n);
    }),
      (t.modifiers = O);
  }
  const {
    components: r,
    formatters: a,
    labels: o,
    dateLib: s,
    locale: i,
    classNames: c,
  } = T.useMemo(() => {
    const O = { ...Zt, ...t.locale },
      _ = t.broadcastCalendar ? 1 : t.weekStartsOn,
      D = t.noonSafe && t.timeZone ? Oo(t.timeZone, { weekStartsOn: _, locale: O }) : void 0,
      C = t.dateLib && D ? { ...D, ...t.dateLib } : (t.dateLib ?? D),
      z = new G(
        {
          locale: O,
          weekStartsOn: _,
          firstWeekContainsDate: t.firstWeekContainsDate,
          useAdditionalWeekYearTokens: t.useAdditionalWeekYearTokens,
          useAdditionalDayOfYearTokens: t.useAdditionalDayOfYearTokens,
          timeZone: t.timeZone,
          numerals: t.numerals,
        },
        C,
      );
    return {
      dateLib: z,
      components: no(t.components),
      formatters: ho(t.formatters),
      labels: bo(t.labels, z.options),
      locale: O,
      classNames: { ...rt(), ...t.classNames },
    };
  }, [
    t.locale,
    t.broadcastCalendar,
    t.weekStartsOn,
    t.firstWeekContainsDate,
    t.useAdditionalWeekYearTokens,
    t.useAdditionalDayOfYearTokens,
    t.timeZone,
    t.numerals,
    t.dateLib,
    t.noonSafe,
    t.components,
    t.formatters,
    t.labels,
    t.classNames,
  ]);
  t.today || (t = { ...t, today: s.today() });
  const {
      captionLayout: u,
      mode: d,
      navLayout: l,
      numberOfMonths: h = 1,
      onDayBlur: y,
      onDayClick: v,
      onDayFocus: p,
      onDayKeyDown: M,
      onDayMouseEnter: N,
      onDayMouseLeave: w,
      onNextClick: g,
      onPrevClick: W,
      showWeekNumber: k,
      styles: f,
    } = t,
    {
      formatCaption: S,
      formatDay: F,
      formatMonthDropdown: H,
      formatWeekNumber: I,
      formatWeekNumberHeader: $,
      formatWeekdayName: oe,
      formatYearDropdown: te,
    } = a,
    V = Bo(t, s),
    {
      days: ue,
      months: Se,
      navStart: Ie,
      navEnd: je,
      previousMonth: X,
      nextMonth: U,
      goToMonth: ne,
    } = V,
    qe = eo(ue, t, Ie, je, s),
    { isSelected: ye, select: ge, selected: Ne } = Vo(t, s) ?? {},
    {
      blur: it,
      focused: xe,
      isFocusTarget: wn,
      moveFocus: ct,
      setFocused: Ce,
    } = qo(t, V, qe, ye ?? (() => !1), s),
    {
      labelDayButton: bn,
      labelGridcell: Dn,
      labelGrid: kn,
      labelMonthDropdown: Mn,
      labelNav: ut,
      labelPrevious: vn,
      labelNext: On,
      labelWeekday: pn,
      labelWeekNumber: Wn,
      labelWeekNumberHeader: Sn,
      labelYearDropdown: Nn,
    } = o,
    xn = T.useMemo(
      () => Mo(s, t.ISOWeek, t.broadcastCalendar, t.today),
      [s, t.ISOWeek, t.broadcastCalendar, t.today],
    ),
    dt = d !== void 0 || v !== void 0,
    He = T.useCallback(() => {
      X && (ne(X), W == null || W(X));
    }, [X, ne, W]),
    Ae = T.useCallback(() => {
      U && (ne(U), g == null || g(U));
    }, [ne, U, g]),
    Cn = T.useCallback(
      (O, _) => (D) => {
        D.preventDefault(),
          D.stopPropagation(),
          Ce(O),
          !_.disabled && (ge == null || ge(O.date, _, D), v == null || v(O.date, _, D));
      },
      [ge, v, Ce],
    ),
    Yn = T.useCallback(
      (O, _) => (D) => {
        Ce(O), p == null || p(O.date, _, D);
      },
      [p, Ce],
    ),
    Tn = T.useCallback(
      (O, _) => (D) => {
        it(), y == null || y(O.date, _, D);
      },
      [it, y],
    ),
    _n = T.useCallback(
      (O, _) => (D) => {
        const C = {
          ArrowLeft: [D.shiftKey ? 'month' : 'day', t.dir === 'rtl' ? 'after' : 'before'],
          ArrowRight: [D.shiftKey ? 'month' : 'day', t.dir === 'rtl' ? 'before' : 'after'],
          ArrowDown: [D.shiftKey ? 'year' : 'week', 'after'],
          ArrowUp: [D.shiftKey ? 'year' : 'week', 'before'],
          PageUp: [D.shiftKey ? 'year' : 'month', 'before'],
          PageDown: [D.shiftKey ? 'year' : 'month', 'after'],
          Home: ['startOfWeek', 'before'],
          End: ['endOfWeek', 'after'],
        };
        if (C[D.key]) {
          D.preventDefault(), D.stopPropagation();
          const [z, x] = C[D.key];
          ct(z, x);
        }
        M == null || M(O.date, _, D);
      },
      [ct, M, t.dir],
    ),
    Pn = T.useCallback(
      (O, _) => (D) => {
        N == null || N(O.date, _, D);
      },
      [N],
    ),
    En = T.useCallback(
      (O, _) => (D) => {
        w == null || w(O.date, _, D);
      },
      [w],
    ),
    Fn = T.useCallback(
      (O) => (_) => {
        const D = Number(_.target.value),
          C = s.setMonth(s.startOfMonth(O), D);
        ne(C);
      },
      [s, ne],
    ),
    Bn = T.useCallback(
      (O) => (_) => {
        const D = Number(_.target.value),
          C = s.setYear(s.startOfMonth(O), D);
        ne(C);
      },
      [s, ne],
    ),
    { className: In, style: jn } = T.useMemo(
      () => ({
        className: [c[b.Root], t.className].filter(Boolean).join(' '),
        style: { ...(f == null ? void 0 : f[b.Root]), ...t.style },
      }),
      [c, t.className, t.style, f],
    ),
    qn = ro(t),
    lt = T.useRef(null);
  No(lt, !!t.animate, { classNames: c, months: Se, focused: xe, dateLib: s });
  const Hn = {
    dayPickerProps: t,
    selected: Ne,
    select: ge,
    isSelected: ye,
    months: Se,
    nextMonth: U,
    previousMonth: X,
    goToMonth: ne,
    getModifiers: qe,
    components: r,
    classNames: c,
    styles: f,
    labels: o,
    formatters: a,
  };
  return m.createElement(
    en.Provider,
    { value: Hn },
    m.createElement(
      r.Root,
      {
        rootRef: t.animate ? lt : void 0,
        className: In,
        style: jn,
        dir: t.dir,
        id: t.id,
        lang: t.lang ?? i.code,
        nonce: t.nonce,
        title: t.title,
        role: t.role,
        'aria-label': t['aria-label'],
        'aria-labelledby': t['aria-labelledby'],
        ...qn,
      },
      m.createElement(
        r.Months,
        { className: c[b.Months], style: f == null ? void 0 : f[b.Months] },
        !t.hideNavigation &&
          !l &&
          m.createElement(r.Nav, {
            'data-animated-nav': t.animate ? 'true' : void 0,
            className: c[b.Nav],
            style: f == null ? void 0 : f[b.Nav],
            'aria-label': ut(),
            onPreviousClick: He,
            onNextClick: Ae,
            previousMonth: X,
            nextMonth: U,
          }),
        Se.map((O, _) =>
          m.createElement(
            r.Month,
            {
              'data-animated-month': t.animate ? 'true' : void 0,
              className: c[b.Month],
              style: f == null ? void 0 : f[b.Month],
              key: _,
              displayIndex: _,
              calendarMonth: O,
            },
            l === 'around' &&
              !t.hideNavigation &&
              _ === 0 &&
              m.createElement(
                r.PreviousMonthButton,
                {
                  type: 'button',
                  className: c[b.PreviousMonthButton],
                  tabIndex: X ? void 0 : -1,
                  'aria-disabled': X ? void 0 : !0,
                  'aria-label': vn(X),
                  onClick: He,
                  'data-animated-button': t.animate ? 'true' : void 0,
                },
                m.createElement(r.Chevron, {
                  disabled: X ? void 0 : !0,
                  className: c[b.Chevron],
                  orientation: t.dir === 'rtl' ? 'right' : 'left',
                }),
              ),
            m.createElement(
              r.MonthCaption,
              {
                'data-animated-caption': t.animate ? 'true' : void 0,
                className: c[b.MonthCaption],
                style: f == null ? void 0 : f[b.MonthCaption],
                calendarMonth: O,
                displayIndex: _,
              },
              u != null && u.startsWith('dropdown')
                ? m.createElement(
                    r.DropdownNav,
                    { className: c[b.Dropdowns], style: f == null ? void 0 : f[b.Dropdowns] },
                    (() => {
                      const D =
                          u === 'dropdown' || u === 'dropdown-months'
                            ? m.createElement(r.MonthsDropdown, {
                                key: 'month',
                                className: c[b.MonthsDropdown],
                                'aria-label': Mn(),
                                classNames: c,
                                components: r,
                                disabled: !!t.disableNavigation,
                                onChange: Fn(O.date),
                                options: Do(O.date, Ie, je, a, s),
                                style: f == null ? void 0 : f[b.Dropdown],
                                value: s.getMonth(O.date),
                              })
                            : m.createElement('span', { key: 'month' }, H(O.date, s)),
                        C =
                          u === 'dropdown' || u === 'dropdown-years'
                            ? m.createElement(r.YearsDropdown, {
                                key: 'year',
                                className: c[b.YearsDropdown],
                                'aria-label': Nn(s.options),
                                classNames: c,
                                components: r,
                                disabled: !!t.disableNavigation,
                                onChange: Bn(O.date),
                                options: vo(Ie, je, a, s, !!t.reverseYears),
                                style: f == null ? void 0 : f[b.Dropdown],
                                value: s.getYear(O.date),
                              })
                            : m.createElement('span', { key: 'year' }, te(O.date, s));
                      return s.getMonthYearOrder() === 'year-first' ? [C, D] : [D, C];
                    })(),
                    m.createElement(
                      'span',
                      {
                        role: 'status',
                        'aria-live': 'polite',
                        style: {
                          border: 0,
                          clip: 'rect(0 0 0 0)',
                          height: '1px',
                          margin: '-1px',
                          overflow: 'hidden',
                          padding: 0,
                          position: 'absolute',
                          width: '1px',
                          whiteSpace: 'nowrap',
                          wordWrap: 'normal',
                        },
                      },
                      S(O.date, s.options, s),
                    ),
                  )
                : m.createElement(
                    r.CaptionLabel,
                    { className: c[b.CaptionLabel], role: 'status', 'aria-live': 'polite' },
                    S(O.date, s.options, s),
                  ),
            ),
            l === 'around' &&
              !t.hideNavigation &&
              _ === h - 1 &&
              m.createElement(
                r.NextMonthButton,
                {
                  type: 'button',
                  className: c[b.NextMonthButton],
                  tabIndex: U ? void 0 : -1,
                  'aria-disabled': U ? void 0 : !0,
                  'aria-label': On(U),
                  onClick: Ae,
                  'data-animated-button': t.animate ? 'true' : void 0,
                },
                m.createElement(r.Chevron, {
                  disabled: U ? void 0 : !0,
                  className: c[b.Chevron],
                  orientation: t.dir === 'rtl' ? 'left' : 'right',
                }),
              ),
            _ === h - 1 &&
              l === 'after' &&
              !t.hideNavigation &&
              m.createElement(r.Nav, {
                'data-animated-nav': t.animate ? 'true' : void 0,
                className: c[b.Nav],
                style: f == null ? void 0 : f[b.Nav],
                'aria-label': ut(),
                onPreviousClick: He,
                onNextClick: Ae,
                previousMonth: X,
                nextMonth: U,
              }),
            m.createElement(
              r.MonthGrid,
              {
                role: 'grid',
                'aria-multiselectable': d === 'multiple' || d === 'range',
                'aria-label': kn(O.date, s.options, s) || void 0,
                className: c[b.MonthGrid],
                style: f == null ? void 0 : f[b.MonthGrid],
              },
              !t.hideWeekdays &&
                m.createElement(
                  r.Weekdays,
                  {
                    'data-animated-weekdays': t.animate ? 'true' : void 0,
                    className: c[b.Weekdays],
                    style: f == null ? void 0 : f[b.Weekdays],
                  },
                  k &&
                    m.createElement(
                      r.WeekNumberHeader,
                      {
                        'aria-label': Sn(s.options),
                        className: c[b.WeekNumberHeader],
                        style: f == null ? void 0 : f[b.WeekNumberHeader],
                        scope: 'col',
                      },
                      $(),
                    ),
                  xn.map((D) =>
                    m.createElement(
                      r.Weekday,
                      {
                        'aria-label': pn(D, s.options, s),
                        className: c[b.Weekday],
                        key: String(D),
                        style: f == null ? void 0 : f[b.Weekday],
                        scope: 'col',
                      },
                      oe(D, s.options, s),
                    ),
                  ),
                ),
              m.createElement(
                r.Weeks,
                {
                  'data-animated-weeks': t.animate ? 'true' : void 0,
                  className: c[b.Weeks],
                  style: f == null ? void 0 : f[b.Weeks],
                },
                O.weeks.map((D) =>
                  m.createElement(
                    r.Week,
                    {
                      className: c[b.Week],
                      key: D.weekNumber,
                      style: f == null ? void 0 : f[b.Week],
                      week: D,
                    },
                    k &&
                      m.createElement(
                        r.WeekNumber,
                        {
                          week: D,
                          style: f == null ? void 0 : f[b.WeekNumber],
                          'aria-label': Wn(D.weekNumber, { locale: i }),
                          className: c[b.WeekNumber],
                          scope: 'row',
                          role: 'rowheader',
                        },
                        I(D.weekNumber, s),
                      ),
                    D.days.map((C) => {
                      const { date: z } = C,
                        x = qe(C);
                      if (
                        ((x[B.focused] = !x.hidden && !!(xe != null && xe.isEqualTo(C))),
                        (x[J.selected] = (ye == null ? void 0 : ye(z)) || x.selected),
                        Ee(Ne))
                      ) {
                        const { from: ze, to: Re } = Ne;
                        (x[J.range_start] = !!(ze && Re && s.isSameDay(z, ze))),
                          (x[J.range_end] = !!(ze && Re && s.isSameDay(z, Re))),
                          (x[J.range_middle] = re(Ne, z, !0, s));
                      }
                      const An = ko(x, f, t.modifiersStyles),
                        zn = to(x, c, t.modifiersClassNames),
                        Rn = !dt && !x.hidden ? Dn(z, x, s.options, s) : void 0;
                      return m.createElement(
                        r.Day,
                        {
                          key: `${C.isoDate}_${C.displayMonthId}`,
                          day: C,
                          modifiers: x,
                          className: zn.join(' '),
                          style: An,
                          role: 'gridcell',
                          'aria-selected': x.selected || void 0,
                          'aria-label': Rn,
                          'data-day': C.isoDate,
                          'data-month': C.outside ? C.dateMonthId : void 0,
                          'data-selected': x.selected || void 0,
                          'data-disabled': x.disabled || void 0,
                          'data-hidden': x.hidden || void 0,
                          'data-outside': C.outside || void 0,
                          'data-focused': x.focused || void 0,
                          'data-today': x.today || void 0,
                        },
                        !x.hidden && dt
                          ? m.createElement(
                              r.DayButton,
                              {
                                className: c[b.DayButton],
                                style: f == null ? void 0 : f[b.DayButton],
                                type: 'button',
                                day: C,
                                modifiers: x,
                                disabled: (!x.focused && x.disabled) || void 0,
                                'aria-disabled': (x.focused && x.disabled) || void 0,
                                tabIndex: wn(C) ? 0 : -1,
                                'aria-label': bn(z, x, s.options, s),
                                onClick: Cn(C, x),
                                onBlur: Tn(C, x),
                                onFocus: Yn(C, x),
                                onKeyDown: _n(C, x),
                                onMouseEnter: Pn(C, x),
                                onMouseLeave: En(C, x),
                              },
                              F(z, s.options, s),
                            )
                          : !x.hidden && F(C.date, s.options, s),
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      t.footer &&
        m.createElement(
          r.Footer,
          {
            className: c[b.Footer],
            style: f == null ? void 0 : f[b.Footer],
            role: 'status',
            'aria-live': 'polite',
          },
          t.footer,
        ),
    ),
  );
}
function st({
  className: e,
  classNames: t,
  showOutsideDays: n = !0,
  captionLayout: r = 'label',
  buttonVariant: a = 'ghost',
  formatters: o,
  components: s,
  ...i
}) {
  const c = rt();
  return j.jsx(Qo, {
    showOutsideDays: n,
    className: Y(
      'group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
      String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
      String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
      e,
    ),
    captionLayout: r,
    formatters: {
      formatMonthDropdown: (u) => u.toLocaleString('default', { month: 'short' }),
      ...o,
    },
    classNames: {
      root: Y('w-fit', c.root),
      months: Y('relative flex flex-col gap-4 md:flex-row', c.months),
      month: Y('flex w-full flex-col gap-4', c.month),
      nav: Y('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', c.nav),
      button_previous: Y(
        ht({ variant: a }),
        'size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
        c.button_previous,
      ),
      button_next: Y(
        ht({ variant: a }),
        'size-(--cell-size) p-0 select-none aria-disabled:opacity-50',
        c.button_next,
      ),
      month_caption: Y(
        'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
        c.month_caption,
      ),
      dropdowns: Y(
        'flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium',
        c.dropdowns,
      ),
      dropdown_root: Y(
        'relative rounded-md border border-input shadow-xs has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50',
        c.dropdown_root,
      ),
      dropdown: Y('absolute inset-0 bg-popover opacity-0', c.dropdown),
      caption_label: Y(
        'font-medium select-none',
        r === 'label'
          ? 'text-sm'
          : 'flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground',
        c.caption_label,
      ),
      table: 'w-full border-collapse',
      weekdays: Y('flex', c.weekdays),
      weekday: Y(
        'flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none',
        c.weekday,
      ),
      week: Y('mt-2 flex w-full', c.week),
      week_number_header: Y('w-(--cell-size) select-none', c.week_number_header),
      week_number: Y('text-[0.8rem] text-muted-foreground select-none', c.week_number),
      day: Y(
        'group/day relative aspect-square h-full w-full p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md',
        i.showWeekNumber
          ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-md'
          : '[&:first-child[data-selected=true]_button]:rounded-l-md',
        c.day,
      ),
      range_start: Y('rounded-l-md bg-accent', c.range_start),
      range_middle: Y('rounded-none', c.range_middle),
      range_end: Y('rounded-r-md bg-accent', c.range_end),
      today: Y(
        'rounded-md bg-accent text-accent-foreground data-[selected=true]:rounded-none',
        c.today,
      ),
      outside: Y('text-muted-foreground aria-selected:text-muted-foreground', c.outside),
      disabled: Y('text-muted-foreground opacity-50', c.disabled),
      hidden: Y('invisible', c.hidden),
      ...t,
    },
    components: {
      Root: ({ className: u, rootRef: d, ...l }) =>
        j.jsx('div', { 'data-slot': 'calendar', ref: d, className: Y(u), ...l }),
      Chevron: ({ className: u, orientation: d, ...l }) =>
        d === 'left'
          ? j.jsx(Ln, { className: Y('size-4', u), ...l })
          : d === 'right'
            ? j.jsx(Vn, { className: Y('size-4', u), ...l })
            : j.jsx(Qn, { className: Y('size-4', u), ...l }),
      DayButton: gn,
      WeekNumber: ({ children: u, ...d }) =>
        j.jsx('td', {
          ...d,
          children: j.jsx('div', {
            className: 'flex size-(--cell-size) items-center justify-center text-center',
            children: u,
          }),
        }),
      ...s,
    },
    ...i,
  });
}
function gn({ className: e, day: t, modifiers: n, ...r }) {
  const a = rt(),
    o = T.useRef(null);
  return (
    T.useEffect(() => {
      var s;
      n.focused && ((s = o.current) == null || s.focus());
    }, [n.focused]),
    j.jsx(Gn, {
      ref: o,
      variant: 'ghost',
      size: 'icon',
      'data-day': t.date.toLocaleDateString(),
      'data-selected-single': n.selected && !n.range_start && !n.range_end && !n.range_middle,
      'data-range-start': n.range_start,
      'data-range-end': n.range_end,
      'data-range-middle': n.range_middle,
      className: Y(
        'flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70',
        a.day,
        e,
      ),
      ...r,
    })
  );
}
st.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'Calendar',
  props: {
    buttonVariant: {
      required: !1,
      tsType: {
        name: "ReactComponentProps['variant']",
        raw: "React.ComponentProps<typeof Button>['variant']",
      },
      description: '',
      defaultValue: { value: "'ghost'", computed: !1 },
    },
    showOutsideDays: { defaultValue: { value: 'true', computed: !1 }, required: !1 },
    captionLayout: { defaultValue: { value: "'label'", computed: !1 }, required: !1 },
  },
};
gn.__docgenInfo = { description: '', methods: [], displayName: 'CalendarDayButton' };
function Xo(e) {
  return e.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function Be({
  value: e,
  onValueChange: t,
  placeholder: n,
  formatDate: r = Xo,
  className: a,
  disabled: o,
}) {
  const [s, i] = T.useState(!1);
  return j.jsxs(Xn, {
    open: s,
    onOpenChange: i,
    children: [
      j.jsx(Un, {
        asChild: !0,
        disabled: o,
        children: j.jsxs('button', {
          type: 'button',
          className: Y(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !e && 'text-muted-foreground',
            a,
          ),
          children: [
            e ? r(e) : (n ?? ''),
            j.jsxs('svg', {
              'aria-hidden': 'true',
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              className: 'ml-2 h-4 w-4 opacity-50',
              children: [
                j.jsx('path', { d: 'M8 2v4' }),
                j.jsx('path', { d: 'M16 2v4' }),
                j.jsx('rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }),
                j.jsx('path', { d: 'M3 10h18' }),
              ],
            }),
          ],
        }),
      }),
      j.jsx(Kn, {
        children: j.jsx(Jn, {
          className:
            'z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          sideOffset: 4,
          align: 'start',
          children: j.jsx(st, {
            mode: 'single',
            selected: e,
            onSelect: (c) => {
              t == null || t(c), i(!1);
            },
            autoFocus: !0,
          }),
        }),
      }),
    ],
  });
}
Be.__docgenInfo = {
  description: '日期选择器组件（单日期选择）',
  methods: [],
  displayName: 'DatePicker',
  props: {
    value: { required: !1, tsType: { name: 'Date' }, description: '当前选中日期' },
    onValueChange: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(date: Date | undefined) => void',
        signature: {
          arguments: [
            {
              type: {
                name: 'union',
                raw: 'Date | undefined',
                elements: [{ name: 'Date' }, { name: 'undefined' }],
              },
              name: 'date',
            },
          ],
          return: { name: 'void' },
        },
      },
      description: '日期变更回调',
    },
    placeholder: { required: !1, tsType: { name: 'string' }, description: '占位提示文字' },
    formatDate: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '(date: Date) => string',
        signature: {
          arguments: [{ type: { name: 'Date' }, name: 'date' }],
          return: { name: 'string' },
        },
      },
      description: '日期格式化函数',
      defaultValue: {
        value: `function defaultFormatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}`,
        computed: !1,
      },
    },
    className: { required: !1, tsType: { name: 'string' }, description: '自定义 className' },
    disabled: { required: !1, tsType: { name: 'boolean' }, description: '是否禁用' },
  },
};
const bs = {
    title: 'Primitives/Calendar',
    component: st,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  Ye = { args: { mode: 'single' } },
  Te = {
    render: () => {
      const [e, t] = T.useState();
      return j.jsx(Be, {
        value: e,
        onValueChange: t,
        placeholder: '选择日期...',
        className: 'w-[240px]',
      });
    },
  },
  _e = {
    render: () =>
      j.jsx(Be, { value: new Date(), placeholder: '选择日期...', className: 'w-[240px]' }),
  },
  Pe = {
    render: () => j.jsx(Be, { disabled: !0, placeholder: '不可选择', className: 'w-[240px]' }),
  };
var Nt, xt, Ct;
Ye.parameters = {
  ...Ye.parameters,
  docs: {
    ...((Nt = Ye.parameters) == null ? void 0 : Nt.docs),
    source: {
      originalSource: `{
  args: {
    mode: 'single'
  }
}`,
      ...((Ct = (xt = Ye.parameters) == null ? void 0 : xt.docs) == null ? void 0 : Ct.source),
    },
  },
};
var Yt, Tt, _t;
Te.parameters = {
  ...Te.parameters,
  docs: {
    ...((Yt = Te.parameters) == null ? void 0 : Yt.docs),
    source: {
      originalSource: `{
  render: () => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePicker value={date} onValueChange={setDate} placeholder="选择日期..." className="w-[240px]" />;
  }
}`,
      ...((_t = (Tt = Te.parameters) == null ? void 0 : Tt.docs) == null ? void 0 : _t.source),
    },
  },
};
var Pt, Et, Ft;
_e.parameters = {
  ..._e.parameters,
  docs: {
    ...((Pt = _e.parameters) == null ? void 0 : Pt.docs),
    source: {
      originalSource: `{
  render: () => <DatePicker value={new Date()} placeholder="选择日期..." className="w-[240px]" />
}`,
      ...((Ft = (Et = _e.parameters) == null ? void 0 : Et.docs) == null ? void 0 : Ft.source),
    },
  },
};
var Bt, It, jt;
Pe.parameters = {
  ...Pe.parameters,
  docs: {
    ...((Bt = Pe.parameters) == null ? void 0 : Bt.docs),
    source: {
      originalSource: `{
  render: () => <DatePicker disabled placeholder="不可选择" className="w-[240px]" />
}`,
      ...((jt = (It = Pe.parameters) == null ? void 0 : It.docs) == null ? void 0 : jt.source),
    },
  },
};
const Ds = ['CalendarDefault', 'DatePickerDefault', 'DatePickerWithValue', 'DatePickerDisabled'];
export {
  Ye as CalendarDefault,
  Te as DatePickerDefault,
  Pe as DatePickerDisabled,
  _e as DatePickerWithValue,
  Ds as __namedExportsOrder,
  bs as default,
};
