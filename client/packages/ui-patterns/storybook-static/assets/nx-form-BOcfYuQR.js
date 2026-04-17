import { r as Ut, R as V } from './index-B3e6rcmj.js';
import { j as ce } from './jsx-runtime-BjG_zV1W.js';
import { c as Br, B as Bt, L as zr } from './table-BAJRp_jF.js';
var Z;
((r) => {
  r.assertEqual = (a) => {};
  function e(a) {}
  r.assertIs = e;
  function t(a) {
    throw new Error();
  }
  (r.assertNever = t),
    (r.arrayToEnum = (a) => {
      const i = {};
      for (const n of a) i[n] = n;
      return i;
    }),
    (r.getValidEnumValues = (a) => {
      const i = r.objectKeys(a).filter((u) => typeof a[a[u]] != 'number'),
        n = {};
      for (const u of i) n[u] = a[u];
      return r.objectValues(n);
    }),
    (r.objectValues = (a) => r.objectKeys(a).map((i) => a[i])),
    (r.objectKeys =
      typeof Object.keys == 'function'
        ? (a) => Object.keys(a)
        : (a) => {
            const i = [];
            for (const n in a) Object.prototype.hasOwnProperty.call(a, n) && i.push(n);
            return i;
          }),
    (r.find = (a, i) => {
      for (const n of a) if (i(n)) return n;
    }),
    (r.isInteger =
      typeof Number.isInteger == 'function'
        ? (a) => Number.isInteger(a)
        : (a) => typeof a == 'number' && Number.isFinite(a) && Math.floor(a) === a);
  function s(a, i = ' | ') {
    return a.map((n) => (typeof n == 'string' ? `'${n}'` : n)).join(i);
  }
  (r.joinValues = s),
    (r.jsonStringifyReplacer = (a, i) => (typeof i == 'bigint' ? i.toString() : i));
})(Z || (Z = {}));
var zt;
((r) => {
  r.mergeShapes = (e, t) => ({ ...e, ...t });
})(zt || (zt = {}));
const x = Z.arrayToEnum([
    'string',
    'nan',
    'number',
    'integer',
    'float',
    'boolean',
    'date',
    'bigint',
    'symbol',
    'function',
    'undefined',
    'null',
    'array',
    'object',
    'unknown',
    'promise',
    'void',
    'never',
    'map',
    'set',
  ]),
  xe = (r) => {
    switch (typeof r) {
      case 'undefined':
        return x.undefined;
      case 'string':
        return x.string;
      case 'number':
        return Number.isNaN(r) ? x.nan : x.number;
      case 'boolean':
        return x.boolean;
      case 'function':
        return x.function;
      case 'bigint':
        return x.bigint;
      case 'symbol':
        return x.symbol;
      case 'object':
        return Array.isArray(r)
          ? x.array
          : r === null
            ? x.null
            : r.then && typeof r.then == 'function' && r.catch && typeof r.catch == 'function'
              ? x.promise
              : typeof Map < 'u' && r instanceof Map
                ? x.map
                : typeof Set < 'u' && r instanceof Set
                  ? x.set
                  : typeof Date < 'u' && r instanceof Date
                    ? x.date
                    : x.object;
      default:
        return x.unknown;
    }
  },
  h = Z.arrayToEnum([
    'invalid_type',
    'invalid_literal',
    'custom',
    'invalid_union',
    'invalid_union_discriminator',
    'invalid_enum_value',
    'unrecognized_keys',
    'invalid_arguments',
    'invalid_return_type',
    'invalid_date',
    'invalid_string',
    'too_small',
    'too_big',
    'invalid_intersection_types',
    'not_multiple_of',
    'not_finite',
  ]);
class ve extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(),
      (this.issues = []),
      (this.addIssue = (s) => {
        this.issues = [...this.issues, s];
      }),
      (this.addIssues = (s = []) => {
        this.issues = [...this.issues, ...s];
      });
    const t = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, t) : (this.__proto__ = t),
      (this.name = 'ZodError'),
      (this.issues = e);
  }
  format(e) {
    const t = e || ((i) => i.message),
      s = { _errors: [] },
      a = (i) => {
        for (const n of i.issues)
          if (n.code === 'invalid_union') n.unionErrors.map(a);
          else if (n.code === 'invalid_return_type') a(n.returnTypeError);
          else if (n.code === 'invalid_arguments') a(n.argumentsError);
          else if (n.path.length === 0) s._errors.push(t(n));
          else {
            let u = s,
              c = 0;
            while (c < n.path.length) {
              const f = n.path[c];
              c === n.path.length - 1
                ? ((u[f] = u[f] || { _errors: [] }), u[f]._errors.push(t(n)))
                : (u[f] = u[f] || { _errors: [] }),
                (u = u[f]),
                c++;
            }
          }
      };
    return a(this), s;
  }
  static assert(e) {
    if (!(e instanceof ve)) throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, Z.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e = (t) => t.message) {
    const t = {},
      s = [];
    for (const a of this.issues)
      if (a.path.length > 0) {
        const i = a.path[0];
        (t[i] = t[i] || []), t[i].push(e(a));
      } else s.push(e(a));
    return { formErrors: s, fieldErrors: t };
  }
  get formErrors() {
    return this.flatten();
  }
}
ve.create = (r) => new ve(r);
const ft = (r, e) => {
  let t;
  switch (r.code) {
    case h.invalid_type:
      r.received === x.undefined
        ? (t = 'Required')
        : (t = `Expected ${r.expected}, received ${r.received}`);
      break;
    case h.invalid_literal:
      t = `Invalid literal value, expected ${JSON.stringify(r.expected, Z.jsonStringifyReplacer)}`;
      break;
    case h.unrecognized_keys:
      t = `Unrecognized key(s) in object: ${Z.joinValues(r.keys, ', ')}`;
      break;
    case h.invalid_union:
      t = 'Invalid input';
      break;
    case h.invalid_union_discriminator:
      t = `Invalid discriminator value. Expected ${Z.joinValues(r.options)}`;
      break;
    case h.invalid_enum_value:
      t = `Invalid enum value. Expected ${Z.joinValues(r.options)}, received '${r.received}'`;
      break;
    case h.invalid_arguments:
      t = 'Invalid function arguments';
      break;
    case h.invalid_return_type:
      t = 'Invalid function return type';
      break;
    case h.invalid_date:
      t = 'Invalid date';
      break;
    case h.invalid_string:
      typeof r.validation == 'object'
        ? 'includes' in r.validation
          ? ((t = `Invalid input: must include "${r.validation.includes}"`),
            typeof r.validation.position == 'number' &&
              (t = `${t} at one or more positions greater than or equal to ${r.validation.position}`))
          : 'startsWith' in r.validation
            ? (t = `Invalid input: must start with "${r.validation.startsWith}"`)
            : 'endsWith' in r.validation
              ? (t = `Invalid input: must end with "${r.validation.endsWith}"`)
              : Z.assertNever(r.validation)
        : r.validation !== 'regex'
          ? (t = `Invalid ${r.validation}`)
          : (t = 'Invalid');
      break;
    case h.too_small:
      r.type === 'array'
        ? (t = `Array must contain ${r.exact ? 'exactly' : r.inclusive ? 'at least' : 'more than'} ${r.minimum} element(s)`)
        : r.type === 'string'
          ? (t = `String must contain ${r.exact ? 'exactly' : r.inclusive ? 'at least' : 'over'} ${r.minimum} character(s)`)
          : r.type === 'number'
            ? (t = `Number must be ${r.exact ? 'exactly equal to ' : r.inclusive ? 'greater than or equal to ' : 'greater than '}${r.minimum}`)
            : r.type === 'bigint'
              ? (t = `Number must be ${r.exact ? 'exactly equal to ' : r.inclusive ? 'greater than or equal to ' : 'greater than '}${r.minimum}`)
              : r.type === 'date'
                ? (t = `Date must be ${r.exact ? 'exactly equal to ' : r.inclusive ? 'greater than or equal to ' : 'greater than '}${new Date(Number(r.minimum))}`)
                : (t = 'Invalid input');
      break;
    case h.too_big:
      r.type === 'array'
        ? (t = `Array must contain ${r.exact ? 'exactly' : r.inclusive ? 'at most' : 'less than'} ${r.maximum} element(s)`)
        : r.type === 'string'
          ? (t = `String must contain ${r.exact ? 'exactly' : r.inclusive ? 'at most' : 'under'} ${r.maximum} character(s)`)
          : r.type === 'number'
            ? (t = `Number must be ${r.exact ? 'exactly' : r.inclusive ? 'less than or equal to' : 'less than'} ${r.maximum}`)
            : r.type === 'bigint'
              ? (t = `BigInt must be ${r.exact ? 'exactly' : r.inclusive ? 'less than or equal to' : 'less than'} ${r.maximum}`)
              : r.type === 'date'
                ? (t = `Date must be ${r.exact ? 'exactly' : r.inclusive ? 'smaller than or equal to' : 'smaller than'} ${new Date(Number(r.maximum))}`)
                : (t = 'Invalid input');
      break;
    case h.custom:
      t = 'Invalid input';
      break;
    case h.invalid_intersection_types:
      t = 'Intersection results could not be merged';
      break;
    case h.not_multiple_of:
      t = `Number must be a multiple of ${r.multipleOf}`;
      break;
    case h.not_finite:
      t = 'Number must be finite';
      break;
    default:
      (t = e.defaultError), Z.assertNever(r);
  }
  return { message: t };
};
const qr = ft;
function Wr() {
  return qr;
}
const Hr = (r) => {
  const { data: e, path: t, errorMaps: s, issueData: a } = r,
    i = [...t, ...(a.path || [])],
    n = { ...a, path: i };
  if (a.message !== void 0) return { ...a, path: i, message: a.message };
  let u = '';
  const c = s
    .filter((f) => !!f)
    .slice()
    .reverse();
  for (const f of c) u = f(n, { data: e, defaultError: u }).message;
  return { ...a, path: i, message: u };
};
function v(r, e) {
  const t = Wr(),
    s = Hr({
      issueData: e,
      data: r.data,
      path: r.path,
      errorMaps: [r.common.contextualErrorMap, r.schemaErrorMap, t, t === ft ? void 0 : ft].filter(
        (a) => !!a,
      ),
    });
  r.common.issues.push(s);
}
class oe {
  constructor() {
    this.value = 'valid';
  }
  dirty() {
    this.value === 'valid' && (this.value = 'dirty');
  }
  abort() {
    this.value !== 'aborted' && (this.value = 'aborted');
  }
  static mergeArray(e, t) {
    const s = [];
    for (const a of t) {
      if (a.status === 'aborted') return A;
      a.status === 'dirty' && e.dirty(), s.push(a.value);
    }
    return { status: e.value, value: s };
  }
  static async mergeObjectAsync(e, t) {
    const s = [];
    for (const a of t) {
      const i = await a.key,
        n = await a.value;
      s.push({ key: i, value: n });
    }
    return oe.mergeObjectSync(e, s);
  }
  static mergeObjectSync(e, t) {
    const s = {};
    for (const a of t) {
      const { key: i, value: n } = a;
      if (i.status === 'aborted' || n.status === 'aborted') return A;
      i.status === 'dirty' && e.dirty(),
        n.status === 'dirty' && e.dirty(),
        i.value !== '__proto__' && (typeof n.value < 'u' || a.alwaysSet) && (s[i.value] = n.value);
    }
    return { status: e.value, value: s };
  }
}
const A = Object.freeze({ status: 'aborted' }),
  Me = (r) => ({ status: 'dirty', value: r }),
  ue = (r) => ({ status: 'valid', value: r }),
  qt = (r) => r.status === 'aborted',
  Wt = (r) => r.status === 'dirty',
  Ne = (r) => r.status === 'valid',
  Ye = (r) => typeof Promise < 'u' && r instanceof Promise;
var b;
((r) => {
  (r.errToObj = (e) => (typeof e == 'string' ? { message: e } : e || {})),
    (r.toString = (e) => (typeof e == 'string' ? e : e == null ? void 0 : e.message));
})(b || (b = {}));
class Ve {
  constructor(e, t, s, a) {
    (this._cachedPath = []), (this.parent = e), (this.data = t), (this._path = s), (this._key = a);
  }
  get path() {
    return (
      this._cachedPath.length ||
        (Array.isArray(this._key)
          ? this._cachedPath.push(...this._path, ...this._key)
          : this._cachedPath.push(...this._path, this._key)),
      this._cachedPath
    );
  }
}
const Ht = (r, e) => {
  if (Ne(e)) return { success: !0, data: e.value };
  if (!r.common.issues.length) throw new Error('Validation failed but no issues detected.');
  return {
    success: !1,
    get error() {
      if (this._error) return this._error;
      const t = new ve(r.common.issues);
      return (this._error = t), this._error;
    },
  };
};
function E(r) {
  if (!r) return {};
  const { errorMap: e, invalid_type_error: t, required_error: s, description: a } = r;
  if (e && (t || s))
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  return e
    ? { errorMap: e, description: a }
    : {
        errorMap: (n, u) => {
          const { message: c } = r;
          return n.code === 'invalid_enum_value'
            ? { message: c ?? u.defaultError }
            : typeof u.data > 'u'
              ? { message: c ?? s ?? u.defaultError }
              : n.code !== 'invalid_type'
                ? { message: u.defaultError }
                : { message: c ?? t ?? u.defaultError };
        },
        description: a,
      };
}
class D {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return xe(e.data);
  }
  _getOrReturnCtx(e, t) {
    return (
      t || {
        common: e.parent.common,
        data: e.data,
        parsedType: xe(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent,
      }
    );
  }
  _processInputParams(e) {
    return {
      status: new oe(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: xe(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent,
      },
    };
  }
  _parseSync(e) {
    const t = this._parse(e);
    if (Ye(t)) throw new Error('Synchronous parse encountered promise.');
    return t;
  }
  _parseAsync(e) {
    const t = this._parse(e);
    return Promise.resolve(t);
  }
  parse(e, t) {
    const s = this.safeParse(e, t);
    if (s.success) return s.data;
    throw s.error;
  }
  safeParse(e, t) {
    const s = {
        common: {
          issues: [],
          async: (t == null ? void 0 : t.async) ?? !1,
          contextualErrorMap: t == null ? void 0 : t.errorMap,
        },
        path: (t == null ? void 0 : t.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: e,
        parsedType: xe(e),
      },
      a = this._parseSync({ data: e, path: s.path, parent: s });
    return Ht(s, a);
  }
  '~validate'(e) {
    var s, a;
    const t = {
      common: { issues: [], async: !!this['~standard'].async },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: xe(e),
    };
    if (!this['~standard'].async)
      try {
        const i = this._parseSync({ data: e, path: [], parent: t });
        return Ne(i) ? { value: i.value } : { issues: t.common.issues };
      } catch (i) {
        (a = (s = i == null ? void 0 : i.message) == null ? void 0 : s.toLowerCase()) != null &&
          a.includes('encountered') &&
          (this['~standard'].async = !0),
          (t.common = { issues: [], async: !0 });
      }
    return this._parseAsync({ data: e, path: [], parent: t }).then((i) =>
      Ne(i) ? { value: i.value } : { issues: t.common.issues },
    );
  }
  async parseAsync(e, t) {
    const s = await this.safeParseAsync(e, t);
    if (s.success) return s.data;
    throw s.error;
  }
  async safeParseAsync(e, t) {
    const s = {
        common: { issues: [], contextualErrorMap: t == null ? void 0 : t.errorMap, async: !0 },
        path: (t == null ? void 0 : t.path) || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data: e,
        parsedType: xe(e),
      },
      a = this._parse({ data: e, path: s.path, parent: s }),
      i = await (Ye(a) ? a : Promise.resolve(a));
    return Ht(s, i);
  }
  refine(e, t) {
    const s = (a) =>
      typeof t == 'string' || typeof t > 'u' ? { message: t } : typeof t == 'function' ? t(a) : t;
    return this._refinement((a, i) => {
      const n = e(a),
        u = () => i.addIssue({ code: h.custom, ...s(a) });
      return typeof Promise < 'u' && n instanceof Promise
        ? n.then((c) => (c ? !0 : (u(), !1)))
        : n
          ? !0
          : (u(), !1);
    });
  }
  refinement(e, t) {
    return this._refinement((s, a) =>
      e(s) ? !0 : (a.addIssue(typeof t == 'function' ? t(s, a) : t), !1),
    );
  }
  _refinement(e) {
    return new Fe({
      schema: this,
      typeName: T.ZodEffects,
      effect: { type: 'refinement', refinement: e },
    });
  }
  superRefine(e) {
    return this._refinement(e);
  }
  constructor(e) {
    (this.spa = this.safeParseAsync),
      (this._def = e),
      (this.parse = this.parse.bind(this)),
      (this.safeParse = this.safeParse.bind(this)),
      (this.parseAsync = this.parseAsync.bind(this)),
      (this.safeParseAsync = this.safeParseAsync.bind(this)),
      (this.spa = this.spa.bind(this)),
      (this.refine = this.refine.bind(this)),
      (this.refinement = this.refinement.bind(this)),
      (this.superRefine = this.superRefine.bind(this)),
      (this.optional = this.optional.bind(this)),
      (this.nullable = this.nullable.bind(this)),
      (this.nullish = this.nullish.bind(this)),
      (this.array = this.array.bind(this)),
      (this.promise = this.promise.bind(this)),
      (this.or = this.or.bind(this)),
      (this.and = this.and.bind(this)),
      (this.transform = this.transform.bind(this)),
      (this.brand = this.brand.bind(this)),
      (this.default = this.default.bind(this)),
      (this.catch = this.catch.bind(this)),
      (this.describe = this.describe.bind(this)),
      (this.pipe = this.pipe.bind(this)),
      (this.readonly = this.readonly.bind(this)),
      (this.isNullable = this.isNullable.bind(this)),
      (this.isOptional = this.isOptional.bind(this)),
      (this['~standard'] = { version: 1, vendor: 'zod', validate: (t) => this['~validate'](t) });
  }
  optional() {
    return we.create(this, this._def);
  }
  nullable() {
    return Ie.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return pe.create(this);
  }
  promise() {
    return Ke.create(this, this._def);
  }
  or(e) {
    return Qe.create([this, e], this._def);
  }
  and(e) {
    return Xe.create(this, e, this._def);
  }
  transform(e) {
    return new Fe({
      ...E(this._def),
      schema: this,
      typeName: T.ZodEffects,
      effect: { type: 'transform', transform: e },
    });
  }
  default(e) {
    const t = typeof e == 'function' ? e : () => e;
    return new mt({ ...E(this._def), innerType: this, defaultValue: t, typeName: T.ZodDefault });
  }
  brand() {
    return new gs({ typeName: T.ZodBranded, type: this, ...E(this._def) });
  }
  catch(e) {
    const t = typeof e == 'function' ? e : () => e;
    return new yt({ ...E(this._def), innerType: this, catchValue: t, typeName: T.ZodCatch });
  }
  describe(e) {
    const t = this.constructor;
    return new t({ ...this._def, description: e });
  }
  pipe(e) {
    return xt.create(this, e);
  }
  readonly() {
    return gt.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const Gr = /^c[^\s-]{8,}$/i,
  Yr = /^[0-9a-z]+$/,
  Jr = /^[0-9A-HJKMNP-TV-Z]{26}$/i,
  Qr = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i,
  Xr = /^[a-z0-9_-]{21}$/i,
  Kr = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
  es =
    /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,
  ts = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i,
  rs = '^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$';
let dt;
const ss =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  as =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  is =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  ns =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  os = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  us = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  vr =
    '((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))',
  ds = new RegExp(`^${vr}$`);
function _r(r) {
  let e = '[0-5]\\d';
  r.precision ? (e = `${e}\\.\\d{${r.precision}}`) : r.precision == null && (e = `${e}(\\.\\d+)?`);
  const t = r.precision ? '+' : '?';
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${t}`;
}
function ls(r) {
  return new RegExp(`^${_r(r)}$`);
}
function cs(r) {
  let e = `${vr}T${_r(r)}`;
  const t = [];
  return (
    t.push(r.local ? 'Z?' : 'Z'),
    r.offset && t.push('([+-]\\d{2}:?\\d{2})'),
    (e = `${e}(${t.join('|')})`),
    new RegExp(`^${e}$`)
  );
}
function fs(r, e) {
  return !!(((e === 'v4' || !e) && ss.test(r)) || ((e === 'v6' || !e) && is.test(r)));
}
function hs(r, e) {
  if (!Kr.test(r)) return !1;
  try {
    const [t] = r.split('.');
    if (!t) return !1;
    const s = t
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(t.length + ((4 - (t.length % 4)) % 4), '='),
      a = JSON.parse(atob(s));
    return !(
      typeof a != 'object' ||
      a === null ||
      ('typ' in a && (a == null ? void 0 : a.typ) !== 'JWT') ||
      !a.alg ||
      (e && a.alg !== e)
    );
  } catch {
    return !1;
  }
}
function ms(r, e) {
  return !!(((e === 'v4' || !e) && as.test(r)) || ((e === 'v6' || !e) && ns.test(r)));
}
class ke extends D {
  _parse(e) {
    if ((this._def.coerce && (e.data = String(e.data)), this._getType(e) !== x.string)) {
      const i = this._getOrReturnCtx(e);
      return v(i, { code: h.invalid_type, expected: x.string, received: i.parsedType }), A;
    }
    const s = new oe();
    let a;
    for (const i of this._def.checks)
      if (i.kind === 'min')
        e.data.length < i.value &&
          ((a = this._getOrReturnCtx(e, a)),
          v(a, {
            code: h.too_small,
            minimum: i.value,
            type: 'string',
            inclusive: !0,
            exact: !1,
            message: i.message,
          }),
          s.dirty());
      else if (i.kind === 'max')
        e.data.length > i.value &&
          ((a = this._getOrReturnCtx(e, a)),
          v(a, {
            code: h.too_big,
            maximum: i.value,
            type: 'string',
            inclusive: !0,
            exact: !1,
            message: i.message,
          }),
          s.dirty());
      else if (i.kind === 'length') {
        const n = e.data.length > i.value,
          u = e.data.length < i.value;
        (n || u) &&
          ((a = this._getOrReturnCtx(e, a)),
          n
            ? v(a, {
                code: h.too_big,
                maximum: i.value,
                type: 'string',
                inclusive: !0,
                exact: !0,
                message: i.message,
              })
            : u &&
              v(a, {
                code: h.too_small,
                minimum: i.value,
                type: 'string',
                inclusive: !0,
                exact: !0,
                message: i.message,
              }),
          s.dirty());
      } else if (i.kind === 'email')
        ts.test(e.data) ||
          ((a = this._getOrReturnCtx(e, a)),
          v(a, { validation: 'email', code: h.invalid_string, message: i.message }),
          s.dirty());
      else if (i.kind === 'emoji')
        dt || (dt = new RegExp(rs, 'u')),
          dt.test(e.data) ||
            ((a = this._getOrReturnCtx(e, a)),
            v(a, { validation: 'emoji', code: h.invalid_string, message: i.message }),
            s.dirty());
      else if (i.kind === 'uuid')
        Qr.test(e.data) ||
          ((a = this._getOrReturnCtx(e, a)),
          v(a, { validation: 'uuid', code: h.invalid_string, message: i.message }),
          s.dirty());
      else if (i.kind === 'nanoid')
        Xr.test(e.data) ||
          ((a = this._getOrReturnCtx(e, a)),
          v(a, { validation: 'nanoid', code: h.invalid_string, message: i.message }),
          s.dirty());
      else if (i.kind === 'cuid')
        Gr.test(e.data) ||
          ((a = this._getOrReturnCtx(e, a)),
          v(a, { validation: 'cuid', code: h.invalid_string, message: i.message }),
          s.dirty());
      else if (i.kind === 'cuid2')
        Yr.test(e.data) ||
          ((a = this._getOrReturnCtx(e, a)),
          v(a, { validation: 'cuid2', code: h.invalid_string, message: i.message }),
          s.dirty());
      else if (i.kind === 'ulid')
        Jr.test(e.data) ||
          ((a = this._getOrReturnCtx(e, a)),
          v(a, { validation: 'ulid', code: h.invalid_string, message: i.message }),
          s.dirty());
      else if (i.kind === 'url')
        try {
          new URL(e.data);
        } catch {
          (a = this._getOrReturnCtx(e, a)),
            v(a, { validation: 'url', code: h.invalid_string, message: i.message }),
            s.dirty();
        }
      else
        i.kind === 'regex'
          ? ((i.regex.lastIndex = 0),
            i.regex.test(e.data) ||
              ((a = this._getOrReturnCtx(e, a)),
              v(a, { validation: 'regex', code: h.invalid_string, message: i.message }),
              s.dirty()))
          : i.kind === 'trim'
            ? (e.data = e.data.trim())
            : i.kind === 'includes'
              ? e.data.includes(i.value, i.position) ||
                ((a = this._getOrReturnCtx(e, a)),
                v(a, {
                  code: h.invalid_string,
                  validation: { includes: i.value, position: i.position },
                  message: i.message,
                }),
                s.dirty())
              : i.kind === 'toLowerCase'
                ? (e.data = e.data.toLowerCase())
                : i.kind === 'toUpperCase'
                  ? (e.data = e.data.toUpperCase())
                  : i.kind === 'startsWith'
                    ? e.data.startsWith(i.value) ||
                      ((a = this._getOrReturnCtx(e, a)),
                      v(a, {
                        code: h.invalid_string,
                        validation: { startsWith: i.value },
                        message: i.message,
                      }),
                      s.dirty())
                    : i.kind === 'endsWith'
                      ? e.data.endsWith(i.value) ||
                        ((a = this._getOrReturnCtx(e, a)),
                        v(a, {
                          code: h.invalid_string,
                          validation: { endsWith: i.value },
                          message: i.message,
                        }),
                        s.dirty())
                      : i.kind === 'datetime'
                        ? cs(i).test(e.data) ||
                          ((a = this._getOrReturnCtx(e, a)),
                          v(a, {
                            code: h.invalid_string,
                            validation: 'datetime',
                            message: i.message,
                          }),
                          s.dirty())
                        : i.kind === 'date'
                          ? ds.test(e.data) ||
                            ((a = this._getOrReturnCtx(e, a)),
                            v(a, {
                              code: h.invalid_string,
                              validation: 'date',
                              message: i.message,
                            }),
                            s.dirty())
                          : i.kind === 'time'
                            ? ls(i).test(e.data) ||
                              ((a = this._getOrReturnCtx(e, a)),
                              v(a, {
                                code: h.invalid_string,
                                validation: 'time',
                                message: i.message,
                              }),
                              s.dirty())
                            : i.kind === 'duration'
                              ? es.test(e.data) ||
                                ((a = this._getOrReturnCtx(e, a)),
                                v(a, {
                                  validation: 'duration',
                                  code: h.invalid_string,
                                  message: i.message,
                                }),
                                s.dirty())
                              : i.kind === 'ip'
                                ? fs(e.data, i.version) ||
                                  ((a = this._getOrReturnCtx(e, a)),
                                  v(a, {
                                    validation: 'ip',
                                    code: h.invalid_string,
                                    message: i.message,
                                  }),
                                  s.dirty())
                                : i.kind === 'jwt'
                                  ? hs(e.data, i.alg) ||
                                    ((a = this._getOrReturnCtx(e, a)),
                                    v(a, {
                                      validation: 'jwt',
                                      code: h.invalid_string,
                                      message: i.message,
                                    }),
                                    s.dirty())
                                  : i.kind === 'cidr'
                                    ? ms(e.data, i.version) ||
                                      ((a = this._getOrReturnCtx(e, a)),
                                      v(a, {
                                        validation: 'cidr',
                                        code: h.invalid_string,
                                        message: i.message,
                                      }),
                                      s.dirty())
                                    : i.kind === 'base64'
                                      ? os.test(e.data) ||
                                        ((a = this._getOrReturnCtx(e, a)),
                                        v(a, {
                                          validation: 'base64',
                                          code: h.invalid_string,
                                          message: i.message,
                                        }),
                                        s.dirty())
                                      : i.kind === 'base64url'
                                        ? us.test(e.data) ||
                                          ((a = this._getOrReturnCtx(e, a)),
                                          v(a, {
                                            validation: 'base64url',
                                            code: h.invalid_string,
                                            message: i.message,
                                          }),
                                          s.dirty())
                                        : Z.assertNever(i);
    return { status: s.value, value: e.data };
  }
  _regex(e, t, s) {
    return this.refinement((a) => e.test(a), {
      validation: t,
      code: h.invalid_string,
      ...b.errToObj(s),
    });
  }
  _addCheck(e) {
    return new ke({ ...this._def, checks: [...this._def.checks, e] });
  }
  email(e) {
    return this._addCheck({ kind: 'email', ...b.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: 'url', ...b.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: 'emoji', ...b.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: 'uuid', ...b.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: 'nanoid', ...b.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: 'cuid', ...b.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: 'cuid2', ...b.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: 'ulid', ...b.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: 'base64', ...b.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({ kind: 'base64url', ...b.errToObj(e) });
  }
  jwt(e) {
    return this._addCheck({ kind: 'jwt', ...b.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: 'ip', ...b.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: 'cidr', ...b.errToObj(e) });
  }
  datetime(e) {
    return typeof e == 'string'
      ? this._addCheck({ kind: 'datetime', precision: null, offset: !1, local: !1, message: e })
      : this._addCheck({
          kind: 'datetime',
          precision:
            typeof (e == null ? void 0 : e.precision) > 'u'
              ? null
              : e == null
                ? void 0
                : e.precision,
          offset: (e == null ? void 0 : e.offset) ?? !1,
          local: (e == null ? void 0 : e.local) ?? !1,
          ...b.errToObj(e == null ? void 0 : e.message),
        });
  }
  date(e) {
    return this._addCheck({ kind: 'date', message: e });
  }
  time(e) {
    return typeof e == 'string'
      ? this._addCheck({ kind: 'time', precision: null, message: e })
      : this._addCheck({
          kind: 'time',
          precision:
            typeof (e == null ? void 0 : e.precision) > 'u'
              ? null
              : e == null
                ? void 0
                : e.precision,
          ...b.errToObj(e == null ? void 0 : e.message),
        });
  }
  duration(e) {
    return this._addCheck({ kind: 'duration', ...b.errToObj(e) });
  }
  regex(e, t) {
    return this._addCheck({ kind: 'regex', regex: e, ...b.errToObj(t) });
  }
  includes(e, t) {
    return this._addCheck({
      kind: 'includes',
      value: e,
      position: t == null ? void 0 : t.position,
      ...b.errToObj(t == null ? void 0 : t.message),
    });
  }
  startsWith(e, t) {
    return this._addCheck({ kind: 'startsWith', value: e, ...b.errToObj(t) });
  }
  endsWith(e, t) {
    return this._addCheck({ kind: 'endsWith', value: e, ...b.errToObj(t) });
  }
  min(e, t) {
    return this._addCheck({ kind: 'min', value: e, ...b.errToObj(t) });
  }
  max(e, t) {
    return this._addCheck({ kind: 'max', value: e, ...b.errToObj(t) });
  }
  length(e, t) {
    return this._addCheck({ kind: 'length', value: e, ...b.errToObj(t) });
  }
  nonempty(e) {
    return this.min(1, b.errToObj(e));
  }
  trim() {
    return new ke({ ...this._def, checks: [...this._def.checks, { kind: 'trim' }] });
  }
  toLowerCase() {
    return new ke({ ...this._def, checks: [...this._def.checks, { kind: 'toLowerCase' }] });
  }
  toUpperCase() {
    return new ke({ ...this._def, checks: [...this._def.checks, { kind: 'toUpperCase' }] });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === 'datetime');
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === 'date');
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === 'time');
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === 'duration');
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === 'email');
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === 'url');
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === 'emoji');
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === 'uuid');
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === 'nanoid');
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === 'cuid');
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === 'cuid2');
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === 'ulid');
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === 'ip');
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === 'cidr');
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === 'base64');
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === 'base64url');
  }
  get minLength() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'min' && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'max' && (e === null || t.value < e) && (e = t.value);
    return e;
  }
}
ke.create = (r) =>
  new ke({
    checks: [],
    typeName: T.ZodString,
    coerce: (r == null ? void 0 : r.coerce) ?? !1,
    ...E(r),
  });
function ys(r, e) {
  const t = (r.toString().split('.')[1] || '').length,
    s = (e.toString().split('.')[1] || '').length,
    a = t > s ? t : s,
    i = Number.parseInt(r.toFixed(a).replace('.', '')),
    n = Number.parseInt(e.toFixed(a).replace('.', ''));
  return (i % n) / 10 ** a;
}
class Be extends D {
  constructor() {
    super(...arguments),
      (this.min = this.gte),
      (this.max = this.lte),
      (this.step = this.multipleOf);
  }
  _parse(e) {
    if ((this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== x.number)) {
      const i = this._getOrReturnCtx(e);
      return v(i, { code: h.invalid_type, expected: x.number, received: i.parsedType }), A;
    }
    let s;
    const a = new oe();
    for (const i of this._def.checks)
      i.kind === 'int'
        ? Z.isInteger(e.data) ||
          ((s = this._getOrReturnCtx(e, s)),
          v(s, {
            code: h.invalid_type,
            expected: 'integer',
            received: 'float',
            message: i.message,
          }),
          a.dirty())
        : i.kind === 'min'
          ? (i.inclusive ? e.data < i.value : e.data <= i.value) &&
            ((s = this._getOrReturnCtx(e, s)),
            v(s, {
              code: h.too_small,
              minimum: i.value,
              type: 'number',
              inclusive: i.inclusive,
              exact: !1,
              message: i.message,
            }),
            a.dirty())
          : i.kind === 'max'
            ? (i.inclusive ? e.data > i.value : e.data >= i.value) &&
              ((s = this._getOrReturnCtx(e, s)),
              v(s, {
                code: h.too_big,
                maximum: i.value,
                type: 'number',
                inclusive: i.inclusive,
                exact: !1,
                message: i.message,
              }),
              a.dirty())
            : i.kind === 'multipleOf'
              ? ys(e.data, i.value) !== 0 &&
                ((s = this._getOrReturnCtx(e, s)),
                v(s, { code: h.not_multiple_of, multipleOf: i.value, message: i.message }),
                a.dirty())
              : i.kind === 'finite'
                ? Number.isFinite(e.data) ||
                  ((s = this._getOrReturnCtx(e, s)),
                  v(s, { code: h.not_finite, message: i.message }),
                  a.dirty())
                : Z.assertNever(i);
    return { status: a.value, value: e.data };
  }
  gte(e, t) {
    return this.setLimit('min', e, !0, b.toString(t));
  }
  gt(e, t) {
    return this.setLimit('min', e, !1, b.toString(t));
  }
  lte(e, t) {
    return this.setLimit('max', e, !0, b.toString(t));
  }
  lt(e, t) {
    return this.setLimit('max', e, !1, b.toString(t));
  }
  setLimit(e, t, s, a) {
    return new Be({
      ...this._def,
      checks: [...this._def.checks, { kind: e, value: t, inclusive: s, message: b.toString(a) }],
    });
  }
  _addCheck(e) {
    return new Be({ ...this._def, checks: [...this._def.checks, e] });
  }
  int(e) {
    return this._addCheck({ kind: 'int', message: b.toString(e) });
  }
  positive(e) {
    return this._addCheck({ kind: 'min', value: 0, inclusive: !1, message: b.toString(e) });
  }
  negative(e) {
    return this._addCheck({ kind: 'max', value: 0, inclusive: !1, message: b.toString(e) });
  }
  nonpositive(e) {
    return this._addCheck({ kind: 'max', value: 0, inclusive: !0, message: b.toString(e) });
  }
  nonnegative(e) {
    return this._addCheck({ kind: 'min', value: 0, inclusive: !0, message: b.toString(e) });
  }
  multipleOf(e, t) {
    return this._addCheck({ kind: 'multipleOf', value: e, message: b.toString(t) });
  }
  finite(e) {
    return this._addCheck({ kind: 'finite', message: b.toString(e) });
  }
  safe(e) {
    return this._addCheck({
      kind: 'min',
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: b.toString(e),
    })._addCheck({
      kind: 'max',
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: b.toString(e),
    });
  }
  get minValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'min' && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'max' && (e === null || t.value < e) && (e = t.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find(
      (e) => e.kind === 'int' || (e.kind === 'multipleOf' && Z.isInteger(e.value)),
    );
  }
  get isFinite() {
    let e = null,
      t = null;
    for (const s of this._def.checks) {
      if (s.kind === 'finite' || s.kind === 'int' || s.kind === 'multipleOf') return !0;
      s.kind === 'min'
        ? (t === null || s.value > t) && (t = s.value)
        : s.kind === 'max' && (e === null || s.value < e) && (e = s.value);
    }
    return Number.isFinite(t) && Number.isFinite(e);
  }
}
Be.create = (r) =>
  new Be({
    checks: [],
    typeName: T.ZodNumber,
    coerce: (r == null ? void 0 : r.coerce) || !1,
    ...E(r),
  });
class ze extends D {
  constructor() {
    super(...arguments), (this.min = this.gte), (this.max = this.lte);
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== x.bigint) return this._getInvalidInput(e);
    let s;
    const a = new oe();
    for (const i of this._def.checks)
      i.kind === 'min'
        ? (i.inclusive ? e.data < i.value : e.data <= i.value) &&
          ((s = this._getOrReturnCtx(e, s)),
          v(s, {
            code: h.too_small,
            type: 'bigint',
            minimum: i.value,
            inclusive: i.inclusive,
            message: i.message,
          }),
          a.dirty())
        : i.kind === 'max'
          ? (i.inclusive ? e.data > i.value : e.data >= i.value) &&
            ((s = this._getOrReturnCtx(e, s)),
            v(s, {
              code: h.too_big,
              type: 'bigint',
              maximum: i.value,
              inclusive: i.inclusive,
              message: i.message,
            }),
            a.dirty())
          : i.kind === 'multipleOf'
            ? e.data % i.value !== BigInt(0) &&
              ((s = this._getOrReturnCtx(e, s)),
              v(s, { code: h.not_multiple_of, multipleOf: i.value, message: i.message }),
              a.dirty())
            : Z.assertNever(i);
    return { status: a.value, value: e.data };
  }
  _getInvalidInput(e) {
    const t = this._getOrReturnCtx(e);
    return v(t, { code: h.invalid_type, expected: x.bigint, received: t.parsedType }), A;
  }
  gte(e, t) {
    return this.setLimit('min', e, !0, b.toString(t));
  }
  gt(e, t) {
    return this.setLimit('min', e, !1, b.toString(t));
  }
  lte(e, t) {
    return this.setLimit('max', e, !0, b.toString(t));
  }
  lt(e, t) {
    return this.setLimit('max', e, !1, b.toString(t));
  }
  setLimit(e, t, s, a) {
    return new ze({
      ...this._def,
      checks: [...this._def.checks, { kind: e, value: t, inclusive: s, message: b.toString(a) }],
    });
  }
  _addCheck(e) {
    return new ze({ ...this._def, checks: [...this._def.checks, e] });
  }
  positive(e) {
    return this._addCheck({ kind: 'min', value: BigInt(0), inclusive: !1, message: b.toString(e) });
  }
  negative(e) {
    return this._addCheck({ kind: 'max', value: BigInt(0), inclusive: !1, message: b.toString(e) });
  }
  nonpositive(e) {
    return this._addCheck({ kind: 'max', value: BigInt(0), inclusive: !0, message: b.toString(e) });
  }
  nonnegative(e) {
    return this._addCheck({ kind: 'min', value: BigInt(0), inclusive: !0, message: b.toString(e) });
  }
  multipleOf(e, t) {
    return this._addCheck({ kind: 'multipleOf', value: e, message: b.toString(t) });
  }
  get minValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'min' && (e === null || t.value > e) && (e = t.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'max' && (e === null || t.value < e) && (e = t.value);
    return e;
  }
}
ze.create = (r) =>
  new ze({
    checks: [],
    typeName: T.ZodBigInt,
    coerce: (r == null ? void 0 : r.coerce) ?? !1,
    ...E(r),
  });
class Gt extends D {
  _parse(e) {
    if ((this._def.coerce && (e.data = !!e.data), this._getType(e) !== x.boolean)) {
      const s = this._getOrReturnCtx(e);
      return v(s, { code: h.invalid_type, expected: x.boolean, received: s.parsedType }), A;
    }
    return ue(e.data);
  }
}
Gt.create = (r) =>
  new Gt({ typeName: T.ZodBoolean, coerce: (r == null ? void 0 : r.coerce) || !1, ...E(r) });
class Je extends D {
  _parse(e) {
    if ((this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== x.date)) {
      const i = this._getOrReturnCtx(e);
      return v(i, { code: h.invalid_type, expected: x.date, received: i.parsedType }), A;
    }
    if (Number.isNaN(e.data.getTime())) {
      const i = this._getOrReturnCtx(e);
      return v(i, { code: h.invalid_date }), A;
    }
    const s = new oe();
    let a;
    for (const i of this._def.checks)
      i.kind === 'min'
        ? e.data.getTime() < i.value &&
          ((a = this._getOrReturnCtx(e, a)),
          v(a, {
            code: h.too_small,
            message: i.message,
            inclusive: !0,
            exact: !1,
            minimum: i.value,
            type: 'date',
          }),
          s.dirty())
        : i.kind === 'max'
          ? e.data.getTime() > i.value &&
            ((a = this._getOrReturnCtx(e, a)),
            v(a, {
              code: h.too_big,
              message: i.message,
              inclusive: !0,
              exact: !1,
              maximum: i.value,
              type: 'date',
            }),
            s.dirty())
          : Z.assertNever(i);
    return { status: s.value, value: new Date(e.data.getTime()) };
  }
  _addCheck(e) {
    return new Je({ ...this._def, checks: [...this._def.checks, e] });
  }
  min(e, t) {
    return this._addCheck({ kind: 'min', value: e.getTime(), message: b.toString(t) });
  }
  max(e, t) {
    return this._addCheck({ kind: 'max', value: e.getTime(), message: b.toString(t) });
  }
  get minDate() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'min' && (e === null || t.value > e) && (e = t.value);
    return e != null ? new Date(e) : null;
  }
  get maxDate() {
    let e = null;
    for (const t of this._def.checks)
      t.kind === 'max' && (e === null || t.value < e) && (e = t.value);
    return e != null ? new Date(e) : null;
  }
}
Je.create = (r) =>
  new Je({
    checks: [],
    coerce: (r == null ? void 0 : r.coerce) || !1,
    typeName: T.ZodDate,
    ...E(r),
  });
class Yt extends D {
  _parse(e) {
    if (this._getType(e) !== x.symbol) {
      const s = this._getOrReturnCtx(e);
      return v(s, { code: h.invalid_type, expected: x.symbol, received: s.parsedType }), A;
    }
    return ue(e.data);
  }
}
Yt.create = (r) => new Yt({ typeName: T.ZodSymbol, ...E(r) });
class Jt extends D {
  _parse(e) {
    if (this._getType(e) !== x.undefined) {
      const s = this._getOrReturnCtx(e);
      return v(s, { code: h.invalid_type, expected: x.undefined, received: s.parsedType }), A;
    }
    return ue(e.data);
  }
}
Jt.create = (r) => new Jt({ typeName: T.ZodUndefined, ...E(r) });
class Qt extends D {
  _parse(e) {
    if (this._getType(e) !== x.null) {
      const s = this._getOrReturnCtx(e);
      return v(s, { code: h.invalid_type, expected: x.null, received: s.parsedType }), A;
    }
    return ue(e.data);
  }
}
Qt.create = (r) => new Qt({ typeName: T.ZodNull, ...E(r) });
class Xt extends D {
  constructor() {
    super(...arguments), (this._any = !0);
  }
  _parse(e) {
    return ue(e.data);
  }
}
Xt.create = (r) => new Xt({ typeName: T.ZodAny, ...E(r) });
class Kt extends D {
  constructor() {
    super(...arguments), (this._unknown = !0);
  }
  _parse(e) {
    return ue(e.data);
  }
}
Kt.create = (r) => new Kt({ typeName: T.ZodUnknown, ...E(r) });
class Ce extends D {
  _parse(e) {
    const t = this._getOrReturnCtx(e);
    return v(t, { code: h.invalid_type, expected: x.never, received: t.parsedType }), A;
  }
}
Ce.create = (r) => new Ce({ typeName: T.ZodNever, ...E(r) });
class er extends D {
  _parse(e) {
    if (this._getType(e) !== x.undefined) {
      const s = this._getOrReturnCtx(e);
      return v(s, { code: h.invalid_type, expected: x.void, received: s.parsedType }), A;
    }
    return ue(e.data);
  }
}
er.create = (r) => new er({ typeName: T.ZodVoid, ...E(r) });
class pe extends D {
  _parse(e) {
    const { ctx: t, status: s } = this._processInputParams(e),
      a = this._def;
    if (t.parsedType !== x.array)
      return v(t, { code: h.invalid_type, expected: x.array, received: t.parsedType }), A;
    if (a.exactLength !== null) {
      const n = t.data.length > a.exactLength.value,
        u = t.data.length < a.exactLength.value;
      (n || u) &&
        (v(t, {
          code: n ? h.too_big : h.too_small,
          minimum: u ? a.exactLength.value : void 0,
          maximum: n ? a.exactLength.value : void 0,
          type: 'array',
          inclusive: !0,
          exact: !0,
          message: a.exactLength.message,
        }),
        s.dirty());
    }
    if (
      (a.minLength !== null &&
        t.data.length < a.minLength.value &&
        (v(t, {
          code: h.too_small,
          minimum: a.minLength.value,
          type: 'array',
          inclusive: !0,
          exact: !1,
          message: a.minLength.message,
        }),
        s.dirty()),
      a.maxLength !== null &&
        t.data.length > a.maxLength.value &&
        (v(t, {
          code: h.too_big,
          maximum: a.maxLength.value,
          type: 'array',
          inclusive: !0,
          exact: !1,
          message: a.maxLength.message,
        }),
        s.dirty()),
      t.common.async)
    )
      return Promise.all(
        [...t.data].map((n, u) => a.type._parseAsync(new Ve(t, n, t.path, u))),
      ).then((n) => oe.mergeArray(s, n));
    const i = [...t.data].map((n, u) => a.type._parseSync(new Ve(t, n, t.path, u)));
    return oe.mergeArray(s, i);
  }
  get element() {
    return this._def.type;
  }
  min(e, t) {
    return new pe({ ...this._def, minLength: { value: e, message: b.toString(t) } });
  }
  max(e, t) {
    return new pe({ ...this._def, maxLength: { value: e, message: b.toString(t) } });
  }
  length(e, t) {
    return new pe({ ...this._def, exactLength: { value: e, message: b.toString(t) } });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
pe.create = (r, e) =>
  new pe({
    type: r,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: T.ZodArray,
    ...E(e),
  });
function Ee(r) {
  if (r instanceof G) {
    const e = {};
    for (const t in r.shape) {
      const s = r.shape[t];
      e[t] = we.create(Ee(s));
    }
    return new G({ ...r._def, shape: () => e });
  } else
    return r instanceof pe
      ? new pe({ ...r._def, type: Ee(r.element) })
      : r instanceof we
        ? we.create(Ee(r.unwrap()))
        : r instanceof Ie
          ? Ie.create(Ee(r.unwrap()))
          : r instanceof Se
            ? Se.create(r.items.map((e) => Ee(e)))
            : r;
}
class G extends D {
  constructor() {
    super(...arguments),
      (this._cached = null),
      (this.nonstrict = this.passthrough),
      (this.augment = this.extend);
  }
  _getCached() {
    if (this._cached !== null) return this._cached;
    const e = this._def.shape(),
      t = Z.objectKeys(e);
    return (this._cached = { shape: e, keys: t }), this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== x.object) {
      const f = this._getOrReturnCtx(e);
      return v(f, { code: h.invalid_type, expected: x.object, received: f.parsedType }), A;
    }
    const { status: s, ctx: a } = this._processInputParams(e),
      { shape: i, keys: n } = this._getCached(),
      u = [];
    if (!(this._def.catchall instanceof Ce && this._def.unknownKeys === 'strip'))
      for (const f in a.data) n.includes(f) || u.push(f);
    const c = [];
    for (const f of n) {
      const k = i[f],
        w = a.data[f];
      c.push({
        key: { status: 'valid', value: f },
        value: k._parse(new Ve(a, w, a.path, f)),
        alwaysSet: f in a.data,
      });
    }
    if (this._def.catchall instanceof Ce) {
      const f = this._def.unknownKeys;
      if (f === 'passthrough')
        for (const k of u)
          c.push({
            key: { status: 'valid', value: k },
            value: { status: 'valid', value: a.data[k] },
          });
      else if (f === 'strict')
        u.length > 0 && (v(a, { code: h.unrecognized_keys, keys: u }), s.dirty());
      else if (f !== 'strip')
        throw new Error('Internal ZodObject error: invalid unknownKeys value.');
    } else {
      const f = this._def.catchall;
      for (const k of u) {
        const w = a.data[k];
        c.push({
          key: { status: 'valid', value: k },
          value: f._parse(new Ve(a, w, a.path, k)),
          alwaysSet: k in a.data,
        });
      }
    }
    return a.common.async
      ? Promise.resolve()
          .then(async () => {
            const f = [];
            for (const k of c) {
              const w = await k.key,
                F = await k.value;
              f.push({ key: w, value: F, alwaysSet: k.alwaysSet });
            }
            return f;
          })
          .then((f) => oe.mergeObjectSync(s, f))
      : oe.mergeObjectSync(s, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return (
      b.errToObj,
      new G({
        ...this._def,
        unknownKeys: 'strict',
        ...(e !== void 0
          ? {
              errorMap: (t, s) => {
                var i, n;
                const a =
                  ((n = (i = this._def).errorMap) == null ? void 0 : n.call(i, t, s).message) ??
                  s.defaultError;
                return t.code === 'unrecognized_keys'
                  ? { message: b.errToObj(e).message ?? a }
                  : { message: a };
              },
            }
          : {}),
      })
    );
  }
  strip() {
    return new G({ ...this._def, unknownKeys: 'strip' });
  }
  passthrough() {
    return new G({ ...this._def, unknownKeys: 'passthrough' });
  }
  extend(e) {
    return new G({ ...this._def, shape: () => ({ ...this._def.shape(), ...e }) });
  }
  merge(e) {
    return new G({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({ ...this._def.shape(), ...e._def.shape() }),
      typeName: T.ZodObject,
    });
  }
  setKey(e, t) {
    return this.augment({ [e]: t });
  }
  catchall(e) {
    return new G({ ...this._def, catchall: e });
  }
  pick(e) {
    const t = {};
    for (const s of Z.objectKeys(e)) e[s] && this.shape[s] && (t[s] = this.shape[s]);
    return new G({ ...this._def, shape: () => t });
  }
  omit(e) {
    const t = {};
    for (const s of Z.objectKeys(this.shape)) e[s] || (t[s] = this.shape[s]);
    return new G({ ...this._def, shape: () => t });
  }
  deepPartial() {
    return Ee(this);
  }
  partial(e) {
    const t = {};
    for (const s of Z.objectKeys(this.shape)) {
      const a = this.shape[s];
      e && !e[s] ? (t[s] = a) : (t[s] = a.optional());
    }
    return new G({ ...this._def, shape: () => t });
  }
  required(e) {
    const t = {};
    for (const s of Z.objectKeys(this.shape))
      if (e && !e[s]) t[s] = this.shape[s];
      else {
        let i = this.shape[s];
        while (i instanceof we) i = i._def.innerType;
        t[s] = i;
      }
    return new G({ ...this._def, shape: () => t });
  }
  keyof() {
    return xr(Z.objectKeys(this.shape));
  }
}
G.create = (r, e) =>
  new G({
    shape: () => r,
    unknownKeys: 'strip',
    catchall: Ce.create(),
    typeName: T.ZodObject,
    ...E(e),
  });
G.strictCreate = (r, e) =>
  new G({
    shape: () => r,
    unknownKeys: 'strict',
    catchall: Ce.create(),
    typeName: T.ZodObject,
    ...E(e),
  });
G.lazycreate = (r, e) =>
  new G({ shape: r, unknownKeys: 'strip', catchall: Ce.create(), typeName: T.ZodObject, ...E(e) });
class Qe extends D {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e),
      s = this._def.options;
    function a(i) {
      for (const u of i) if (u.result.status === 'valid') return u.result;
      for (const u of i)
        if (u.result.status === 'dirty')
          return t.common.issues.push(...u.ctx.common.issues), u.result;
      const n = i.map((u) => new ve(u.ctx.common.issues));
      return v(t, { code: h.invalid_union, unionErrors: n }), A;
    }
    if (t.common.async)
      return Promise.all(
        s.map(async (i) => {
          const n = { ...t, common: { ...t.common, issues: [] }, parent: null };
          return { result: await i._parseAsync({ data: t.data, path: t.path, parent: n }), ctx: n };
        }),
      ).then(a);
    {
      let i;
      const n = [];
      for (const c of s) {
        const f = { ...t, common: { ...t.common, issues: [] }, parent: null },
          k = c._parseSync({ data: t.data, path: t.path, parent: f });
        if (k.status === 'valid') return k;
        k.status === 'dirty' && !i && (i = { result: k, ctx: f }),
          f.common.issues.length && n.push(f.common.issues);
      }
      if (i) return t.common.issues.push(...i.ctx.common.issues), i.result;
      const u = n.map((c) => new ve(c));
      return v(t, { code: h.invalid_union, unionErrors: u }), A;
    }
  }
  get options() {
    return this._def.options;
  }
}
Qe.create = (r, e) => new Qe({ options: r, typeName: T.ZodUnion, ...E(e) });
function ht(r, e) {
  const t = xe(r),
    s = xe(e);
  if (r === e) return { valid: !0, data: r };
  if (t === x.object && s === x.object) {
    const a = Z.objectKeys(e),
      i = Z.objectKeys(r).filter((u) => a.indexOf(u) !== -1),
      n = { ...r, ...e };
    for (const u of i) {
      const c = ht(r[u], e[u]);
      if (!c.valid) return { valid: !1 };
      n[u] = c.data;
    }
    return { valid: !0, data: n };
  } else if (t === x.array && s === x.array) {
    if (r.length !== e.length) return { valid: !1 };
    const a = [];
    for (let i = 0; i < r.length; i++) {
      const n = r[i],
        u = e[i],
        c = ht(n, u);
      if (!c.valid) return { valid: !1 };
      a.push(c.data);
    }
    return { valid: !0, data: a };
  } else return t === x.date && s === x.date && +r == +e ? { valid: !0, data: r } : { valid: !1 };
}
class Xe extends D {
  _parse(e) {
    const { status: t, ctx: s } = this._processInputParams(e),
      a = (i, n) => {
        if (qt(i) || qt(n)) return A;
        const u = ht(i.value, n.value);
        return u.valid
          ? ((Wt(i) || Wt(n)) && t.dirty(), { status: t.value, value: u.data })
          : (v(s, { code: h.invalid_intersection_types }), A);
      };
    return s.common.async
      ? Promise.all([
          this._def.left._parseAsync({ data: s.data, path: s.path, parent: s }),
          this._def.right._parseAsync({ data: s.data, path: s.path, parent: s }),
        ]).then(([i, n]) => a(i, n))
      : a(
          this._def.left._parseSync({ data: s.data, path: s.path, parent: s }),
          this._def.right._parseSync({ data: s.data, path: s.path, parent: s }),
        );
  }
}
Xe.create = (r, e, t) => new Xe({ left: r, right: e, typeName: T.ZodIntersection, ...E(t) });
class Se extends D {
  _parse(e) {
    const { status: t, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== x.array)
      return v(s, { code: h.invalid_type, expected: x.array, received: s.parsedType }), A;
    if (s.data.length < this._def.items.length)
      return (
        v(s, {
          code: h.too_small,
          minimum: this._def.items.length,
          inclusive: !0,
          exact: !1,
          type: 'array',
        }),
        A
      );
    !this._def.rest &&
      s.data.length > this._def.items.length &&
      (v(s, {
        code: h.too_big,
        maximum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: 'array',
      }),
      t.dirty());
    const i = [...s.data]
      .map((n, u) => {
        const c = this._def.items[u] || this._def.rest;
        return c ? c._parse(new Ve(s, n, s.path, u)) : null;
      })
      .filter((n) => !!n);
    return s.common.async ? Promise.all(i).then((n) => oe.mergeArray(t, n)) : oe.mergeArray(t, i);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Se({ ...this._def, rest: e });
  }
}
Se.create = (r, e) => {
  if (!Array.isArray(r)) throw new Error('You must pass an array of schemas to z.tuple([ ... ])');
  return new Se({ items: r, typeName: T.ZodTuple, rest: null, ...E(e) });
};
class tr extends D {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: t, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== x.map)
      return v(s, { code: h.invalid_type, expected: x.map, received: s.parsedType }), A;
    const a = this._def.keyType,
      i = this._def.valueType,
      n = [...s.data.entries()].map(([u, c], f) => ({
        key: a._parse(new Ve(s, u, s.path, [f, 'key'])),
        value: i._parse(new Ve(s, c, s.path, [f, 'value'])),
      }));
    if (s.common.async) {
      const u = new Map();
      return Promise.resolve().then(async () => {
        for (const c of n) {
          const f = await c.key,
            k = await c.value;
          if (f.status === 'aborted' || k.status === 'aborted') return A;
          (f.status === 'dirty' || k.status === 'dirty') && t.dirty(), u.set(f.value, k.value);
        }
        return { status: t.value, value: u };
      });
    } else {
      const u = new Map();
      for (const c of n) {
        const f = c.key,
          k = c.value;
        if (f.status === 'aborted' || k.status === 'aborted') return A;
        (f.status === 'dirty' || k.status === 'dirty') && t.dirty(), u.set(f.value, k.value);
      }
      return { status: t.value, value: u };
    }
  }
}
tr.create = (r, e, t) => new tr({ valueType: e, keyType: r, typeName: T.ZodMap, ...E(t) });
class qe extends D {
  _parse(e) {
    const { status: t, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== x.set)
      return v(s, { code: h.invalid_type, expected: x.set, received: s.parsedType }), A;
    const a = this._def;
    a.minSize !== null &&
      s.data.size < a.minSize.value &&
      (v(s, {
        code: h.too_small,
        minimum: a.minSize.value,
        type: 'set',
        inclusive: !0,
        exact: !1,
        message: a.minSize.message,
      }),
      t.dirty()),
      a.maxSize !== null &&
        s.data.size > a.maxSize.value &&
        (v(s, {
          code: h.too_big,
          maximum: a.maxSize.value,
          type: 'set',
          inclusive: !0,
          exact: !1,
          message: a.maxSize.message,
        }),
        t.dirty());
    const i = this._def.valueType;
    function n(c) {
      const f = new Set();
      for (const k of c) {
        if (k.status === 'aborted') return A;
        k.status === 'dirty' && t.dirty(), f.add(k.value);
      }
      return { status: t.value, value: f };
    }
    const u = [...s.data.values()].map((c, f) => i._parse(new Ve(s, c, s.path, f)));
    return s.common.async ? Promise.all(u).then((c) => n(c)) : n(u);
  }
  min(e, t) {
    return new qe({ ...this._def, minSize: { value: e, message: b.toString(t) } });
  }
  max(e, t) {
    return new qe({ ...this._def, maxSize: { value: e, message: b.toString(t) } });
  }
  size(e, t) {
    return this.min(e, t).max(e, t);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
qe.create = (r, e) =>
  new qe({ valueType: r, minSize: null, maxSize: null, typeName: T.ZodSet, ...E(e) });
class rr extends D {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    return this._def.getter()._parse({ data: t.data, path: t.path, parent: t });
  }
}
rr.create = (r, e) => new rr({ getter: r, typeName: T.ZodLazy, ...E(e) });
class sr extends D {
  _parse(e) {
    if (e.data !== this._def.value) {
      const t = this._getOrReturnCtx(e);
      return v(t, { received: t.data, code: h.invalid_literal, expected: this._def.value }), A;
    }
    return { status: 'valid', value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
sr.create = (r, e) => new sr({ value: r, typeName: T.ZodLiteral, ...E(e) });
function xr(r, e) {
  return new Re({ values: r, typeName: T.ZodEnum, ...E(e) });
}
class Re extends D {
  _parse(e) {
    if (typeof e.data != 'string') {
      const t = this._getOrReturnCtx(e),
        s = this._def.values;
      return v(t, { expected: Z.joinValues(s), received: t.parsedType, code: h.invalid_type }), A;
    }
    if ((this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data))) {
      const t = this._getOrReturnCtx(e),
        s = this._def.values;
      return v(t, { received: t.data, code: h.invalid_enum_value, options: s }), A;
    }
    return ue(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e = {};
    for (const t of this._def.values) e[t] = t;
    return e;
  }
  get Values() {
    const e = {};
    for (const t of this._def.values) e[t] = t;
    return e;
  }
  get Enum() {
    const e = {};
    for (const t of this._def.values) e[t] = t;
    return e;
  }
  extract(e, t = this._def) {
    return Re.create(e, { ...this._def, ...t });
  }
  exclude(e, t = this._def) {
    return Re.create(
      this.options.filter((s) => !e.includes(s)),
      { ...this._def, ...t },
    );
  }
}
Re.create = xr;
class ar extends D {
  _parse(e) {
    const t = Z.getValidEnumValues(this._def.values),
      s = this._getOrReturnCtx(e);
    if (s.parsedType !== x.string && s.parsedType !== x.number) {
      const a = Z.objectValues(t);
      return v(s, { expected: Z.joinValues(a), received: s.parsedType, code: h.invalid_type }), A;
    }
    if (
      (this._cache || (this._cache = new Set(Z.getValidEnumValues(this._def.values))),
      !this._cache.has(e.data))
    ) {
      const a = Z.objectValues(t);
      return v(s, { received: s.data, code: h.invalid_enum_value, options: a }), A;
    }
    return ue(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
ar.create = (r, e) => new ar({ values: r, typeName: T.ZodNativeEnum, ...E(e) });
class Ke extends D {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    if (t.parsedType !== x.promise && t.common.async === !1)
      return v(t, { code: h.invalid_type, expected: x.promise, received: t.parsedType }), A;
    const s = t.parsedType === x.promise ? t.data : Promise.resolve(t.data);
    return ue(
      s.then((a) =>
        this._def.type.parseAsync(a, { path: t.path, errorMap: t.common.contextualErrorMap }),
      ),
    );
  }
}
Ke.create = (r, e) => new Ke({ type: r, typeName: T.ZodPromise, ...E(e) });
class Fe extends D {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === T.ZodEffects
      ? this._def.schema.sourceType()
      : this._def.schema;
  }
  _parse(e) {
    const { status: t, ctx: s } = this._processInputParams(e),
      a = this._def.effect || null,
      i = {
        addIssue: (n) => {
          v(s, n), n.fatal ? t.abort() : t.dirty();
        },
        get path() {
          return s.path;
        },
      };
    if (((i.addIssue = i.addIssue.bind(i)), a.type === 'preprocess')) {
      const n = a.transform(s.data, i);
      if (s.common.async)
        return Promise.resolve(n).then(async (u) => {
          if (t.value === 'aborted') return A;
          const c = await this._def.schema._parseAsync({ data: u, path: s.path, parent: s });
          return c.status === 'aborted'
            ? A
            : c.status === 'dirty' || t.value === 'dirty'
              ? Me(c.value)
              : c;
        });
      {
        if (t.value === 'aborted') return A;
        const u = this._def.schema._parseSync({ data: n, path: s.path, parent: s });
        return u.status === 'aborted'
          ? A
          : u.status === 'dirty' || t.value === 'dirty'
            ? Me(u.value)
            : u;
      }
    }
    if (a.type === 'refinement') {
      const n = (u) => {
        const c = a.refinement(u, i);
        if (s.common.async) return Promise.resolve(c);
        if (c instanceof Promise)
          throw new Error(
            'Async refinement encountered during synchronous parse operation. Use .parseAsync instead.',
          );
        return u;
      };
      if (s.common.async === !1) {
        const u = this._def.schema._parseSync({ data: s.data, path: s.path, parent: s });
        return u.status === 'aborted'
          ? A
          : (u.status === 'dirty' && t.dirty(), n(u.value), { status: t.value, value: u.value });
      } else
        return this._def.schema
          ._parseAsync({ data: s.data, path: s.path, parent: s })
          .then((u) =>
            u.status === 'aborted'
              ? A
              : (u.status === 'dirty' && t.dirty(),
                n(u.value).then(() => ({ status: t.value, value: u.value }))),
          );
    }
    if (a.type === 'transform')
      if (s.common.async === !1) {
        const n = this._def.schema._parseSync({ data: s.data, path: s.path, parent: s });
        if (!Ne(n)) return A;
        const u = a.transform(n.value, i);
        if (u instanceof Promise)
          throw new Error(
            'Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.',
          );
        return { status: t.value, value: u };
      } else
        return this._def.schema
          ._parseAsync({ data: s.data, path: s.path, parent: s })
          .then((n) =>
            Ne(n)
              ? Promise.resolve(a.transform(n.value, i)).then((u) => ({
                  status: t.value,
                  value: u,
                }))
              : A,
          );
    Z.assertNever(a);
  }
}
Fe.create = (r, e, t) => new Fe({ schema: r, typeName: T.ZodEffects, effect: e, ...E(t) });
Fe.createWithPreprocess = (r, e, t) =>
  new Fe({
    schema: e,
    effect: { type: 'preprocess', transform: r },
    typeName: T.ZodEffects,
    ...E(t),
  });
class we extends D {
  _parse(e) {
    return this._getType(e) === x.undefined ? ue(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
we.create = (r, e) => new we({ innerType: r, typeName: T.ZodOptional, ...E(e) });
class Ie extends D {
  _parse(e) {
    return this._getType(e) === x.null ? ue(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Ie.create = (r, e) => new Ie({ innerType: r, typeName: T.ZodNullable, ...E(e) });
class mt extends D {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e);
    let s = t.data;
    return (
      t.parsedType === x.undefined && (s = this._def.defaultValue()),
      this._def.innerType._parse({ data: s, path: t.path, parent: t })
    );
  }
  removeDefault() {
    return this._def.innerType;
  }
}
mt.create = (r, e) =>
  new mt({
    innerType: r,
    typeName: T.ZodDefault,
    defaultValue: typeof e.default == 'function' ? e.default : () => e.default,
    ...E(e),
  });
class yt extends D {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e),
      s = { ...t, common: { ...t.common, issues: [] } },
      a = this._def.innerType._parse({ data: s.data, path: s.path, parent: { ...s } });
    return Ye(a)
      ? a.then((i) => ({
          status: 'valid',
          value:
            i.status === 'valid'
              ? i.value
              : this._def.catchValue({
                  get error() {
                    return new ve(s.common.issues);
                  },
                  input: s.data,
                }),
        }))
      : {
          status: 'valid',
          value:
            a.status === 'valid'
              ? a.value
              : this._def.catchValue({
                  get error() {
                    return new ve(s.common.issues);
                  },
                  input: s.data,
                }),
        };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
yt.create = (r, e) =>
  new yt({
    innerType: r,
    typeName: T.ZodCatch,
    catchValue: typeof e.catch == 'function' ? e.catch : () => e.catch,
    ...E(e),
  });
class ir extends D {
  _parse(e) {
    if (this._getType(e) !== x.nan) {
      const s = this._getOrReturnCtx(e);
      return v(s, { code: h.invalid_type, expected: x.nan, received: s.parsedType }), A;
    }
    return { status: 'valid', value: e.data };
  }
}
ir.create = (r) => new ir({ typeName: T.ZodNaN, ...E(r) });
class gs extends D {
  _parse(e) {
    const { ctx: t } = this._processInputParams(e),
      s = t.data;
    return this._def.type._parse({ data: s, path: t.path, parent: t });
  }
  unwrap() {
    return this._def.type;
  }
}
class xt extends D {
  _parse(e) {
    const { status: t, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const i = await this._def.in._parseAsync({ data: s.data, path: s.path, parent: s });
        return i.status === 'aborted'
          ? A
          : i.status === 'dirty'
            ? (t.dirty(), Me(i.value))
            : this._def.out._parseAsync({ data: i.value, path: s.path, parent: s });
      })();
    {
      const a = this._def.in._parseSync({ data: s.data, path: s.path, parent: s });
      return a.status === 'aborted'
        ? A
        : a.status === 'dirty'
          ? (t.dirty(), { status: 'dirty', value: a.value })
          : this._def.out._parseSync({ data: a.value, path: s.path, parent: s });
    }
  }
  static create(e, t) {
    return new xt({ in: e, out: t, typeName: T.ZodPipeline });
  }
}
class gt extends D {
  _parse(e) {
    const t = this._def.innerType._parse(e),
      s = (a) => (Ne(a) && (a.value = Object.freeze(a.value)), a);
    return Ye(t) ? t.then((a) => s(a)) : s(t);
  }
  unwrap() {
    return this._def.innerType;
  }
}
gt.create = (r, e) => new gt({ innerType: r, typeName: T.ZodReadonly, ...E(e) });
var T;
((r) => {
  (r.ZodString = 'ZodString'),
    (r.ZodNumber = 'ZodNumber'),
    (r.ZodNaN = 'ZodNaN'),
    (r.ZodBigInt = 'ZodBigInt'),
    (r.ZodBoolean = 'ZodBoolean'),
    (r.ZodDate = 'ZodDate'),
    (r.ZodSymbol = 'ZodSymbol'),
    (r.ZodUndefined = 'ZodUndefined'),
    (r.ZodNull = 'ZodNull'),
    (r.ZodAny = 'ZodAny'),
    (r.ZodUnknown = 'ZodUnknown'),
    (r.ZodNever = 'ZodNever'),
    (r.ZodVoid = 'ZodVoid'),
    (r.ZodArray = 'ZodArray'),
    (r.ZodObject = 'ZodObject'),
    (r.ZodUnion = 'ZodUnion'),
    (r.ZodDiscriminatedUnion = 'ZodDiscriminatedUnion'),
    (r.ZodIntersection = 'ZodIntersection'),
    (r.ZodTuple = 'ZodTuple'),
    (r.ZodRecord = 'ZodRecord'),
    (r.ZodMap = 'ZodMap'),
    (r.ZodSet = 'ZodSet'),
    (r.ZodFunction = 'ZodFunction'),
    (r.ZodLazy = 'ZodLazy'),
    (r.ZodLiteral = 'ZodLiteral'),
    (r.ZodEnum = 'ZodEnum'),
    (r.ZodEffects = 'ZodEffects'),
    (r.ZodNativeEnum = 'ZodNativeEnum'),
    (r.ZodOptional = 'ZodOptional'),
    (r.ZodNullable = 'ZodNullable'),
    (r.ZodDefault = 'ZodDefault'),
    (r.ZodCatch = 'ZodCatch'),
    (r.ZodPromise = 'ZodPromise'),
    (r.ZodBranded = 'ZodBranded'),
    (r.ZodPipeline = 'ZodPipeline'),
    (r.ZodReadonly = 'ZodReadonly');
})(T || (T = {}));
const Ys = ke.create;
Ce.create;
pe.create;
const Js = G.create;
Qe.create;
Xe.create;
Se.create;
Re.create;
Ke.create;
we.create;
Ie.create;
var We = (r) => r.type === 'checkbox',
  Te = (r) => r instanceof Date,
  ie = (r) => r == null;
const br = (r) => typeof r == 'object';
var z = (r) => !ie(r) && !Array.isArray(r) && br(r) && !Te(r),
  kr = (r) => (z(r) && r.target ? (We(r.target) ? r.target.checked : r.target.value) : r),
  wr = (r, e) =>
    e.split('.').some((t, s, a) => !isNaN(Number(t)) && r.has(a.slice(0, s).join('.'))),
  ps = (r) => {
    const e = r.constructor && r.constructor.prototype;
    return z(e) && e.hasOwnProperty('isPrototypeOf');
  },
  bt = typeof window < 'u' && typeof window.HTMLElement < 'u' && typeof document < 'u';
function W(r) {
  if (r instanceof Date) return new Date(r);
  const e = typeof FileList < 'u' && r instanceof FileList;
  if (bt && (r instanceof Blob || e)) return r;
  const t = Array.isArray(r);
  if (!t && !(z(r) && ps(r))) return r;
  const s = t ? [] : Object.create(Object.getPrototypeOf(r));
  for (const a in r) Object.prototype.hasOwnProperty.call(r, a) && (s[a] = W(r[a]));
  return s;
}
var rt = (r) => /^\w*$/.test(r),
  $ = (r) => r === void 0,
  kt = (r) => (Array.isArray(r) ? r.filter(Boolean) : []),
  wt = (r) => kt(r.replace(/["|']|\]/g, '').split(/\.|\[/)),
  y = (r, e, t) => {
    if (!e || !z(r)) return t;
    const s = (rt(e) ? [e] : wt(e)).reduce((a, i) => (ie(a) ? a : a[i]), r);
    return $(s) || s === r ? ($(r[e]) ? t : r[e]) : s;
  },
  ne = (r) => typeof r == 'boolean',
  ee = (r) => typeof r == 'function',
  L = (r, e, t) => {
    let s = -1;
    const a = rt(e) ? [e] : wt(e),
      i = a.length,
      n = i - 1;
    while (++s < i) {
      const u = a[s];
      let c = t;
      if (s !== n) {
        const f = r[u];
        c = z(f) || Array.isArray(f) ? f : isNaN(+a[s + 1]) ? {} : [];
      }
      if (u === '__proto__' || u === 'constructor' || u === 'prototype') return;
      (r[u] = c), (r = r[u]);
    }
  };
const be = {
    BLUR: 'blur',
    FOCUS_OUT: 'focusout',
    CHANGE: 'change',
    SUBMIT: 'submit',
    TRIGGER: 'trigger',
    VALID: 'valid',
  },
  fe = {
    onBlur: 'onBlur',
    onChange: 'onChange',
    onSubmit: 'onSubmit',
    onTouched: 'onTouched',
    all: 'all',
  },
  le = {
    max: 'max',
    min: 'min',
    maxLength: 'maxLength',
    minLength: 'minLength',
    pattern: 'pattern',
    required: 'required',
    validate: 'validate',
  },
  lt = 'form',
  Vr = 'root',
  Vt = V.createContext(null);
Vt.displayName = 'HookFormControlContext';
const Ct = () => V.useContext(Vt);
var Cr = (r, e, t, s = !0) => {
  const a = { defaultValues: e._defaultValues };
  for (const i in r)
    Object.defineProperty(a, i, {
      get: () => {
        const n = i;
        return (
          e._proxyFormState[n] !== fe.all && (e._proxyFormState[n] = !s || fe.all),
          t && (t[n] = !0),
          r[n]
        );
      },
    });
  return a;
};
const At = typeof window < 'u' ? V.useLayoutEffect : V.useEffect;
function vs(r) {
  const e = Ct(),
    { control: t = e, disabled: s, name: a, exact: i } = r || {},
    [n, u] = V.useState(t._formState),
    c = V.useRef({
      isDirty: !1,
      isLoading: !1,
      dirtyFields: !1,
      touchedFields: !1,
      validatingFields: !1,
      isValidating: !1,
      isValid: !1,
      errors: !1,
    });
  return (
    At(
      () =>
        t._subscribe({
          name: a,
          formState: c.current,
          exact: i,
          callback: (f) => {
            !s && u({ ...t._formState, ...f });
          },
        }),
      [a, s, i],
    ),
    V.useEffect(() => {
      c.current.isValid && t._setValid(!0);
    }, [t]),
    V.useMemo(() => Cr(n, t, c.current, !1), [n, t])
  );
}
var te = (r) => typeof r == 'string',
  pt = (r, e, t, s, a) =>
    te(r)
      ? (s && e.watch.add(r), y(t, r, a))
      : Array.isArray(r)
        ? r.map((i) => (s && e.watch.add(i), y(t, i)))
        : (s && (e.watchAll = !0), t),
  vt = (r) => ie(r) || !br(r);
function he(r, e, t = new WeakSet()) {
  if (vt(r) || vt(e)) return Object.is(r, e);
  if (Te(r) && Te(e)) return Object.is(r.getTime(), e.getTime());
  const s = Object.keys(r),
    a = Object.keys(e);
  if (s.length !== a.length) return !1;
  if (t.has(r) || t.has(e)) return !0;
  t.add(r), t.add(e);
  for (const i of s) {
    const n = r[i];
    if (!a.includes(i)) return !1;
    if (i !== 'ref') {
      const u = e[i];
      if (
        (Te(n) && Te(u)) || ((z(n) || Array.isArray(n)) && (z(u) || Array.isArray(u)))
          ? !he(n, u, t)
          : !Object.is(n, u)
      )
        return !1;
    }
  }
  return !0;
}
function _s(r) {
  const e = Ct(),
    { control: t = e, name: s, defaultValue: a, disabled: i, exact: n, compute: u } = r || {},
    c = V.useRef(a),
    f = V.useRef(u),
    k = V.useRef(void 0),
    w = V.useRef(t),
    F = V.useRef(s);
  f.current = u;
  const [C, Y] = V.useState(() => {
      const N = t._getWatch(s, c.current);
      return f.current ? f.current(N) : N;
    }),
    U = V.useCallback(
      (N) => {
        const I = pt(s, t._names, N || t._formValues, !1, c.current);
        return f.current ? f.current(I) : I;
      },
      [t._formValues, t._names, s],
    ),
    q = V.useCallback(
      (N) => {
        if (!i) {
          const I = pt(s, t._names, N || t._formValues, !1, c.current);
          if (f.current) {
            const re = f.current(I);
            he(re, k.current) || (Y(re), (k.current = re));
          } else Y(I);
        }
      },
      [t._formValues, t._names, i, s],
    );
  At(
    () => (
      (w.current !== t || !he(F.current, s)) && ((w.current = t), (F.current = s), q()),
      t._subscribe({
        name: s,
        formState: { values: !0 },
        exact: n,
        callback: (N) => {
          q(N.values);
        },
      })
    ),
    [t, n, s, q],
  ),
    V.useEffect(() => t._removeUnmounted());
  const B = w.current !== t,
    S = F.current,
    Q = V.useMemo(() => {
      if (i) return null;
      const N = !B && !he(S, s);
      return B || N ? U() : null;
    }, [i, B, s, S, U]);
  return Q !== null ? Q : C;
}
function xs(r) {
  const e = Ct(),
    {
      name: t,
      disabled: s,
      control: a = e,
      shouldUnregister: i,
      defaultValue: n,
      exact: u = !0,
    } = r,
    c = wr(a._names.array, t),
    f = V.useMemo(() => y(a._formValues, t, y(a._defaultValues, t, n)), [a, t, n]),
    k = _s({ control: a, name: t, defaultValue: f, exact: u }),
    w = vs({ control: a, name: t, exact: u }),
    F = V.useRef(r),
    C = V.useRef(void 0),
    Y = V.useRef(
      a.register(t, { ...r.rules, value: k, ...(ne(r.disabled) ? { disabled: r.disabled } : {}) }),
    );
  F.current = r;
  const U = V.useMemo(
      () =>
        Object.defineProperties(
          {},
          {
            invalid: { enumerable: !0, get: () => !!y(w.errors, t) },
            isDirty: { enumerable: !0, get: () => !!y(w.dirtyFields, t) },
            isTouched: { enumerable: !0, get: () => !!y(w.touchedFields, t) },
            isValidating: { enumerable: !0, get: () => !!y(w.validatingFields, t) },
            error: { enumerable: !0, get: () => y(w.errors, t) },
          },
        ),
      [w, t],
    ),
    q = V.useCallback(
      (N) => Y.current.onChange({ target: { value: kr(N), name: t }, type: be.CHANGE }),
      [t],
    ),
    B = V.useCallback(
      () => Y.current.onBlur({ target: { value: y(a._formValues, t), name: t }, type: be.BLUR }),
      [t, a._formValues],
    ),
    S = V.useCallback(
      (N) => {
        const I = y(a._fields, t);
        I &&
          I._f &&
          N &&
          (I._f.ref = {
            focus: () => ee(N.focus) && N.focus(),
            select: () => ee(N.select) && N.select(),
            setCustomValidity: (re) => ee(N.setCustomValidity) && N.setCustomValidity(re),
            reportValidity: () => ee(N.reportValidity) && N.reportValidity(),
          });
      },
      [a._fields, t],
    ),
    Q = V.useMemo(
      () => ({
        name: t,
        value: k,
        ...(ne(s) || w.disabled ? { disabled: w.disabled || s } : {}),
        onChange: q,
        onBlur: B,
        ref: S,
      }),
      [t, s, w.disabled, q, B, S, k],
    );
  return (
    V.useEffect(() => {
      const N = a._options.shouldUnregister || i,
        I = C.current;
      I && I !== t && !c && a.unregister(I),
        a.register(t, {
          ...F.current.rules,
          ...(ne(F.current.disabled) ? { disabled: F.current.disabled } : {}),
        });
      const re = (me, De) => {
        const se = y(a._fields, me);
        se && se._f && (se._f.mount = De);
      };
      if ((re(t, !0), N)) {
        const me = W(y(a._options.defaultValues, t, F.current.defaultValue));
        L(a._defaultValues, t, me), $(y(a._formValues, t)) && L(a._formValues, t, me);
      }
      return (
        !c && a.register(t),
        (C.current = t),
        () => {
          (c ? N && !a._state.action : N) ? a.unregister(t) : re(t, !1);
        }
      );
    }, [t, a, c, i]),
    V.useEffect(() => {
      a._setDisabledField({ disabled: s, name: t });
    }, [s, t, a]),
    V.useMemo(() => ({ field: Q, formState: w, fieldState: U }), [Q, w, U])
  );
}
const Tt = V.createContext(null);
Tt.displayName = 'HookFormContext';
const bs = () => V.useContext(Tt),
  ks = (r) => {
    const {
        children: e,
        watch: t,
        getValues: s,
        getFieldState: a,
        setError: i,
        clearErrors: n,
        setValue: u,
        trigger: c,
        formState: f,
        resetField: k,
        reset: w,
        handleSubmit: F,
        unregister: C,
        control: Y,
        register: U,
        setFocus: q,
        subscribe: B,
      } = r,
      S = V.useMemo(
        () => ({
          watch: t,
          getValues: s,
          getFieldState: a,
          setError: i,
          clearErrors: n,
          setValue: u,
          trigger: c,
          formState: f,
          resetField: k,
          reset: w,
          handleSubmit: F,
          unregister: C,
          control: Y,
          register: U,
          setFocus: q,
          subscribe: B,
        }),
        [n, Y, f, a, s, F, U, w, k, i, q, u, B, c, C, t],
      );
    return V.createElement(
      Tt.Provider,
      { value: S },
      V.createElement(Vt.Provider, { value: S.control }, e),
    );
  };
var Ar = (r, e, t, s, a) =>
    e ? { ...t[r], types: { ...(t[r] && t[r].types ? t[r].types : {}), [s]: a || !0 } } : {},
  $e = (r) => (Array.isArray(r) ? r : [r]),
  nr = () => {
    let r = [];
    return {
      get observers() {
        return r;
      },
      next: (a) => {
        for (const i of r) i.next && i.next(a);
      },
      subscribe: (a) => (
        r.push(a),
        {
          unsubscribe: () => {
            r = r.filter((i) => i !== a);
          },
        }
      ),
      unsubscribe: () => {
        r = [];
      },
    };
  };
function Tr(r, e) {
  const t = {};
  for (const s in r)
    if (r.hasOwnProperty(s)) {
      const a = r[s],
        i = e[s];
      if (a && z(a) && i) {
        const n = Tr(a, i);
        z(n) && (t[s] = n);
      } else r[s] && (t[s] = i);
    }
  return t;
}
var K = (r) => z(r) && !Object.keys(r).length,
  St = (r) => r.type === 'file',
  et = (r) => {
    if (!bt) return !1;
    const e = r ? r.ownerDocument : 0;
    return r instanceof (e && e.defaultView ? e.defaultView.HTMLElement : HTMLElement);
  },
  Sr = (r) => r.type === 'select-multiple',
  Ot = (r) => r.type === 'radio',
  ws = (r) => Ot(r) || We(r),
  ct = (r) => et(r) && r.isConnected;
function Vs(r, e) {
  const t = e.slice(0, -1).length;
  let s = 0;
  while (s < t) r = $(r) ? s++ : r[e[s++]];
  return r;
}
function Cs(r) {
  for (const e in r) if (r.hasOwnProperty(e) && !$(r[e])) return !1;
  return !0;
}
function H(r, e) {
  const t = Array.isArray(e) ? e : rt(e) ? [e] : wt(e),
    s = t.length === 1 ? r : Vs(r, t),
    a = t.length - 1,
    i = t[a];
  return (
    s && delete s[i],
    a !== 0 && ((z(s) && K(s)) || (Array.isArray(s) && Cs(s))) && H(r, t.slice(0, -1)),
    r
  );
}
var As = (r) => {
  for (const e in r) if (ee(r[e])) return !0;
  return !1;
};
function Or(r) {
  return Array.isArray(r) || (z(r) && !As(r));
}
function _t(r, e = {}) {
  for (const t in r) {
    const s = r[t];
    Or(s) ? ((e[t] = Array.isArray(s) ? [] : {}), _t(s, e[t])) : $(s) || (e[t] = !0);
  }
  return e;
}
function Pe(r, e, t) {
  t || (t = _t(e));
  for (const s in r) {
    const a = r[s];
    if (Or(a))
      $(e) || vt(t[s])
        ? (t[s] = _t(a, Array.isArray(a) ? [] : {}))
        : Pe(a, ie(e) ? {} : e[s], t[s]);
    else {
      const i = e[s];
      t[s] = !he(a, i);
    }
  }
  return t;
}
const or = { value: !1, isValid: !1 },
  ur = { value: !0, isValid: !0 };
var Er = (r) => {
    if (Array.isArray(r)) {
      if (r.length > 1) {
        const e = r.filter((t) => t && t.checked && !t.disabled).map((t) => t.value);
        return { value: e, isValid: !!e.length };
      }
      return r[0].checked && !r[0].disabled
        ? r[0].attributes && !$(r[0].attributes.value)
          ? $(r[0].value) || r[0].value === ''
            ? ur
            : { value: r[0].value, isValid: !0 }
          : ur
        : or;
    }
    return or;
  },
  Nr = (r, { valueAsNumber: e, valueAsDate: t, setValueAs: s }) =>
    $(r) ? r : e ? (r === '' ? Number.NaN : r && +r) : t && te(r) ? new Date(r) : s ? s(r) : r;
const dr = { isValid: !1, value: null };
var Rr = (r) =>
  Array.isArray(r)
    ? r.reduce((e, t) => (t && t.checked && !t.disabled ? { isValid: !0, value: t.value } : e), dr)
    : dr;
function lr(r) {
  const e = r.ref;
  return St(e)
    ? e.files
    : Ot(e)
      ? Rr(r.refs).value
      : Sr(e)
        ? [...e.selectedOptions].map(({ value: t }) => t)
        : We(e)
          ? Er(r.refs).value
          : Nr($(e.value) ? r.ref.value : e.value, r);
}
var Ts = (r) => r.substring(0, r.search(/\.\d+(\.|$)/)) || r,
  Ss = (r, e, t, s) => {
    const a = {};
    for (const i of r) {
      const n = y(e, i);
      n && L(a, i, n._f);
    }
    return { criteriaMode: t, names: [...r], fields: a, shouldUseNativeValidation: s };
  },
  tt = (r) => r instanceof RegExp,
  Le = (r) => ($(r) ? r : tt(r) ? r.source : z(r) ? (tt(r.value) ? r.value.source : r.value) : r),
  cr = (r) => ({
    isOnSubmit: !r || r === fe.onSubmit,
    isOnBlur: r === fe.onBlur,
    isOnChange: r === fe.onChange,
    isOnAll: r === fe.all,
    isOnTouch: r === fe.onTouched,
  });
const fr = 'AsyncFunction';
var Os = (r) =>
    !!r &&
    !!r.validate &&
    !!(
      (ee(r.validate) && r.validate.constructor.name === fr) ||
      (z(r.validate) && Object.values(r.validate).find((e) => e.constructor.name === fr))
    ),
  Es = (r) =>
    r.mount &&
    (r.required || r.min || r.max || r.maxLength || r.minLength || r.pattern || r.validate),
  hr = (r, e, t) =>
    !t &&
    (e.watchAll ||
      e.watch.has(r) ||
      [...e.watch].some((s) => r.startsWith(s) && /^\.\w+/.test(r.slice(s.length))));
const Ue = (r, e, t, s) => {
  for (const a of t || Object.keys(r)) {
    const i = y(r, a);
    if (i) {
      const { _f: n, ...u } = i;
      if (n) {
        if (n.refs && n.refs[0] && e(n.refs[0], a) && !s) return !0;
        if (n.ref && e(n.ref, n.name) && !s) return !0;
        if (Ue(u, e)) break;
      } else if (z(u) && Ue(u, e)) break;
    }
  }
};
function mr(r, e, t) {
  const s = y(r, t);
  if (s || rt(t)) return { error: s, name: t };
  const a = t.split('.');
  while (a.length) {
    const i = a.join('.'),
      n = y(e, i),
      u = y(r, i);
    if (n && !Array.isArray(n) && t !== i) return { name: t };
    if (u && u.type) return { name: i, error: u };
    if (u && u.root && u.root.type) return { name: `${i}.root`, error: u.root };
    a.pop();
  }
  return { name: t };
}
var Ns = (r, e, t, s) => {
    t(r);
    const { name: a, ...i } = r;
    return (
      K(i) ||
      Object.keys(i).length >= Object.keys(e).length ||
      Object.keys(i).find((n) => e[n] === (!s || fe.all))
    );
  },
  Rs = (r, e, t) =>
    !r ||
    !e ||
    r === e ||
    $e(r).some((s) => s && (t ? s === e : s.startsWith(e) || e.startsWith(s))),
  Fs = (r, e, t, s, a) =>
    a.isOnAll
      ? !1
      : !t && a.isOnTouch
        ? !(e || r)
        : (t ? s.isOnBlur : a.isOnBlur)
          ? !r
          : (t ? s.isOnChange : a.isOnChange)
            ? r
            : !0,
  Is = (r, e) => !kt(y(r, e)).length && H(r, e),
  Ds = (r, e, t) => {
    const s = $e(y(r, t));
    return L(s, Vr, e[t]), L(r, t, s), r;
  };
function yr(r, e, t = 'validate') {
  if (te(r) || (Array.isArray(r) && r.every(te)) || (ne(r) && !r))
    return { type: t, message: te(r) ? r : '', ref: e };
}
var Oe = (r) => (z(r) && !tt(r) ? r : { value: r, message: '' }),
  gr = async (r, e, t, s, a, i) => {
    const {
        ref: n,
        refs: u,
        required: c,
        maxLength: f,
        minLength: k,
        min: w,
        max: F,
        pattern: C,
        validate: Y,
        name: U,
        valueAsNumber: q,
        mount: B,
      } = r._f,
      S = y(t, U);
    if (!B || e.has(U)) return {};
    const Q = u ? u[0] : n,
      N = (R) => {
        a && Q.reportValidity && (Q.setCustomValidity(ne(R) ? '' : R || ''), Q.reportValidity());
      },
      I = {},
      re = Ot(n),
      me = We(n),
      De = re || me,
      se =
        ((q || St(n)) && $(n.value) && $(S)) ||
        (et(n) && n.value === '') ||
        S === '' ||
        (Array.isArray(S) && !S.length),
      Ae = Ar.bind(null, U, s, I),
      Ze = (R, M, P, J = le.maxLength, ye = le.minLength) => {
        const de = R ? M : P;
        I[U] = { type: R ? J : ye, message: de, ref: n, ...Ae(R ? J : ye, de) };
      };
    if (
      i
        ? !Array.isArray(S) || !S.length
        : c &&
          ((!De && (se || ie(S))) ||
            (ne(S) && !S) ||
            (me && !Er(u).isValid) ||
            (re && !Rr(u).isValid))
    ) {
      const { value: R, message: M } = te(c) ? { value: !!c, message: c } : Oe(c);
      if (R && ((I[U] = { type: le.required, message: M, ref: Q, ...Ae(le.required, M) }), !s))
        return N(M), I;
    }
    if (!se && (!ie(w) || !ie(F))) {
      let R, M;
      const P = Oe(F),
        J = Oe(w);
      if (!ie(S) && !isNaN(S)) {
        const ye = n.valueAsNumber || (S && +S);
        ie(P.value) || (R = ye > P.value), ie(J.value) || (M = ye < J.value);
      } else {
        const ye = n.valueAsDate || new Date(S),
          de = (He) => new Date(new Date().toDateString() + ' ' + He),
          je = n.type == 'time',
          _e = n.type == 'week';
        te(P.value) &&
          S &&
          (R = je ? de(S) > de(P.value) : _e ? S > P.value : ye > new Date(P.value)),
          te(J.value) &&
            S &&
            (M = je ? de(S) < de(J.value) : _e ? S < J.value : ye < new Date(J.value));
      }
      if ((R || M) && (Ze(!!R, P.message, J.message, le.max, le.min), !s))
        return N(I[U].message), I;
    }
    if ((f || k) && !se && (te(S) || (i && Array.isArray(S)))) {
      const R = Oe(f),
        M = Oe(k),
        P = !ie(R.value) && S.length > +R.value,
        J = !ie(M.value) && S.length < +M.value;
      if ((P || J) && (Ze(P, R.message, M.message), !s)) return N(I[U].message), I;
    }
    if (C && !se && te(S)) {
      const { value: R, message: M } = Oe(C);
      if (
        tt(R) &&
        !S.match(R) &&
        ((I[U] = { type: le.pattern, message: M, ref: n, ...Ae(le.pattern, M) }), !s)
      )
        return N(M), I;
    }
    if (Y) {
      if (ee(Y)) {
        const R = await Y(S, t),
          M = yr(R, Q);
        if (M && ((I[U] = { ...M, ...Ae(le.validate, M.message) }), !s)) return N(M.message), I;
      } else if (z(Y)) {
        let R = {};
        for (const M in Y) {
          if (!K(R) && !s) break;
          const P = yr(await Y[M](S, t), Q, M);
          P && ((R = { ...P, ...Ae(M, P.message) }), N(P.message), s && (I[U] = R));
        }
        if (!K(R) && ((I[U] = { ref: Q, ...R }), !s)) return I;
      }
    }
    return N(!0), I;
  };
const Zs = { mode: fe.onSubmit, reValidateMode: fe.onChange, shouldFocusError: !0 };
function js(r = {}) {
  let e = { ...Zs, ...r },
    t = {
      submitCount: 0,
      isDirty: !1,
      isReady: !1,
      isLoading: ee(e.defaultValues),
      isValidating: !1,
      isSubmitted: !1,
      isSubmitting: !1,
      isSubmitSuccessful: !1,
      isValid: !1,
      touchedFields: {},
      dirtyFields: {},
      validatingFields: {},
      errors: e.errors || {},
      disabled: e.disabled || !1,
    },
    s = {},
    a = z(e.defaultValues) || z(e.values) ? W(e.defaultValues || e.values) || {} : {},
    i = e.shouldUnregister ? {} : W(a),
    n = { action: !1, mount: !1, watch: !1, keepIsValid: !1 },
    u = {
      mount: new Set(),
      disabled: new Set(),
      unMount: new Set(),
      array: new Set(),
      watch: new Set(),
      registerName: new Set(),
    },
    c,
    f = 0;
  const k = {
      isDirty: !1,
      dirtyFields: !1,
      validatingFields: !1,
      touchedFields: !1,
      isValidating: !1,
      isValid: !1,
      errors: !1,
    },
    w = { ...k };
  let F = { ...w };
  const C = { array: nr(), state: nr() },
    Y = e.criteriaMode === fe.all,
    U = (o) => (d) => {
      clearTimeout(f), (f = setTimeout(o, d));
    },
    q = async (o) => {
      if (!n.keepIsValid && !e.disabled && (w.isValid || F.isValid || o)) {
        let d;
        e.resolver
          ? ((d = K((await se()).errors)), B())
          : (d = await R({ fields: s, onlyCheckValid: !0, eventType: be.VALID })),
          d !== t.isValid && C.state.next({ isValid: d });
      }
    },
    B = (o, d) => {
      !e.disabled &&
        (w.isValidating || w.validatingFields || F.isValidating || F.validatingFields) &&
        ((o || Array.from(u.mount)).forEach((l) => {
          l && (d ? L(t.validatingFields, l, d) : H(t.validatingFields, l));
        }),
        C.state.next({
          validatingFields: t.validatingFields,
          isValidating: !K(t.validatingFields),
        }));
    },
    S = (o) => {
      const d = Pe(a, i),
        l = Ts(o);
      L(t.dirtyFields, l, y(d, l));
    },
    Q = (o, d = [], l, p, g = !0, m = !0) => {
      if (p && l && !e.disabled) {
        if (((n.action = !0), m && Array.isArray(y(s, o)))) {
          const _ = l(y(s, o), p.argA, p.argB);
          g && L(s, o, _);
        }
        if (m && Array.isArray(y(t.errors, o))) {
          const _ = l(y(t.errors, o), p.argA, p.argB);
          g && L(t.errors, o, _), Is(t.errors, o);
        }
        if ((w.touchedFields || F.touchedFields) && m && Array.isArray(y(t.touchedFields, o))) {
          const _ = l(y(t.touchedFields, o), p.argA, p.argB);
          g && L(t.touchedFields, o, _);
        }
        (w.dirtyFields || F.dirtyFields) && S(o),
          C.state.next({
            name: o,
            isDirty: P(o, d),
            dirtyFields: t.dirtyFields,
            errors: t.errors,
            isValid: t.isValid,
          });
      } else L(i, o, d);
    },
    N = (o, d) => {
      L(t.errors, o, d), C.state.next({ errors: t.errors });
    },
    I = (o) => {
      (t.errors = o), C.state.next({ errors: t.errors, isValid: !1 });
    },
    re = (o, d, l, p) => {
      const g = y(s, o);
      if (g) {
        const m = y(i, o, $(l) ? y(a, o) : l);
        $(m) || (p && p.defaultChecked) || d ? L(i, o, d ? m : lr(g._f)) : de(o, m),
          n.mount && !n.action && q();
      }
    },
    me = (o, d, l, p, g) => {
      let m = !1,
        _ = !1;
      const O = { name: o };
      if (!e.disabled) {
        if (!l || p) {
          (w.isDirty || F.isDirty) &&
            ((_ = t.isDirty), (t.isDirty = O.isDirty = P()), (m = _ !== O.isDirty));
          const j = he(y(a, o), d);
          (_ = !!y(t.dirtyFields, o)),
            j ? H(t.dirtyFields, o) : L(t.dirtyFields, o, !0),
            (O.dirtyFields = t.dirtyFields),
            (m = m || ((w.dirtyFields || F.dirtyFields) && _ !== !j));
        }
        if (l) {
          const j = y(t.touchedFields, o);
          j ||
            (L(t.touchedFields, o, l),
            (O.touchedFields = t.touchedFields),
            (m = m || ((w.touchedFields || F.touchedFields) && j !== l)));
        }
        m && g && C.state.next(O);
      }
      return m ? O : {};
    },
    De = (o, d, l, p) => {
      const g = y(t.errors, o),
        m = (w.isValid || F.isValid) && ne(d) && t.isValid !== d;
      if (
        (e.delayError && l
          ? ((c = U(() => N(o, l))), c(e.delayError))
          : (clearTimeout(f), (c = null), l ? L(t.errors, o, l) : H(t.errors, o)),
        (l ? !he(g, l) : g) || !K(p) || m)
      ) {
        const _ = { ...p, ...(m && ne(d) ? { isValid: d } : {}), errors: t.errors, name: o };
        (t = { ...t, ..._ }), C.state.next(_);
      }
    },
    se = async (o) => (
      B(o, !0),
      await e.resolver(
        i,
        e.context,
        Ss(o || u.mount, s, e.criteriaMode, e.shouldUseNativeValidation),
      )
    ),
    Ae = async (o) => {
      const { errors: d } = await se(o);
      if ((B(o), o))
        for (const l of o) {
          const p = y(d, l);
          p ? L(t.errors, l, p) : H(t.errors, l);
        }
      else t.errors = d;
      return d;
    },
    Ze = async ({ name: o, eventType: d }) => {
      if (r.validate) {
        const l = await r.validate({ formValues: i, formState: t, name: o, eventType: d });
        if (z(l))
          for (const p in l)
            l[p] &&
              Ge(`${lt}.${p}`, { message: te(l.message) ? l.message : '', type: le.validate });
        else te(l) || !l ? Ge(lt, { message: l || '', type: le.validate }) : Ft(lt);
        return l;
      }
      return !0;
    },
    R = async ({
      fields: o,
      onlyCheckValid: d,
      name: l,
      eventType: p,
      context: g = { valid: !0, runRootValidation: !1 },
    }) => {
      if (
        r.validate &&
        ((g.runRootValidation = !0), !(await Ze({ name: l, eventType: p })) && ((g.valid = !1), d))
      )
        return g.valid;
      for (const m in o) {
        const _ = o[m];
        if (_) {
          const { _f: O, ...j } = _;
          if (O) {
            const X = u.array.has(O.name),
              ge = _._f && Os(_._f);
            ge && w.validatingFields && B([O.name], !0);
            const ae = await gr(_, u.disabled, i, Y, e.shouldUseNativeValidation && !d, X);
            if (
              (ge && w.validatingFields && B([O.name]),
              (ae[O.name] && ((g.valid = !1), d)) ||
                (!d &&
                  (y(ae, O.name)
                    ? X
                      ? Ds(t.errors, ae, O.name)
                      : L(t.errors, O.name, ae[O.name])
                    : H(t.errors, O.name)),
                r.shouldUseNativeValidation && ae[O.name]))
            )
              break;
          }
          !K(j) && (await R({ context: g, onlyCheckValid: d, fields: j, name: m, eventType: p }));
        }
      }
      return g.valid;
    },
    M = () => {
      for (const o of u.unMount) {
        const d = y(s, o);
        d && (d._f.refs ? d._f.refs.every((l) => !ct(l)) : !ct(d._f.ref)) && at(o);
      }
      u.unMount = new Set();
    },
    P = (o, d) => !e.disabled && (o && d && L(i, o, d), !he(Nt(), a)),
    J = (o, d, l) => pt(o, u, { ...(n.mount ? i : $(d) ? a : te(o) ? { [o]: d } : d) }, l, d),
    ye = (o) => kt(y(n.mount ? i : a, o, e.shouldUnregister ? y(a, o, []) : [])),
    de = (o, d, l = {}) => {
      const p = y(s, o);
      let g = d;
      if (p) {
        const m = p._f;
        m &&
          (!m.disabled && L(i, o, Nr(d, m)),
          (g = et(m.ref) && ie(d) ? '' : d),
          Sr(m.ref)
            ? [...m.ref.options].forEach((_) => (_.selected = g.includes(_.value)))
            : m.refs
              ? We(m.ref)
                ? m.refs.forEach((_) => {
                    (!_.defaultChecked || !_.disabled) &&
                      (Array.isArray(g)
                        ? (_.checked = !!g.find((O) => O === _.value))
                        : (_.checked = g === _.value || !!g));
                  })
                : m.refs.forEach((_) => (_.checked = _.value === g))
              : St(m.ref)
                ? (m.ref.value = '')
                : ((m.ref.value = g), m.ref.type || C.state.next({ name: o, values: W(i) })));
      }
      (l.shouldDirty || l.shouldTouch) && me(o, g, l.shouldTouch, l.shouldDirty, !0),
        l.shouldValidate && st(o);
    },
    je = (o, d, l) => {
      for (const p in d) {
        if (!d.hasOwnProperty(p)) return;
        const g = d[p],
          m = o + '.' + p,
          _ = y(s, m);
        (u.array.has(o) || z(g) || (_ && !_._f)) && !Te(g) ? je(m, g, l) : de(m, g, l);
      }
    },
    _e = (o, d, l = {}) => {
      const p = y(s, o),
        g = u.array.has(o),
        m = W(d);
      L(i, o, m),
        g
          ? (C.array.next({ name: o, values: W(i) }),
            (w.isDirty || w.dirtyFields || F.isDirty || F.dirtyFields) &&
              l.shouldDirty &&
              (S(o), C.state.next({ name: o, dirtyFields: t.dirtyFields, isDirty: P(o, m) })))
          : p && !p._f && !ie(m)
            ? je(o, m, l)
            : de(o, m, l),
        hr(o, u)
          ? C.state.next({ ...t, name: o, values: W(i) })
          : C.state.next({ name: n.mount ? o : void 0, values: W(i) });
    },
    He = async (o) => {
      n.mount = !0;
      const d = o.target;
      let l = d.name,
        p = !0;
      const g = y(s, l),
        m = (j) => {
          p = Number.isNaN(j) || (Te(j) && isNaN(j.getTime())) || he(j, y(i, l, j));
        },
        _ = cr(e.mode),
        O = cr(e.reValidateMode);
      if (g) {
        let j, X;
        const ge = d.type ? lr(g._f) : kr(o),
          ae = o.type === be.BLUR || o.type === be.FOCUS_OUT,
          Pr =
            (!Es(g._f) && !r.validate && !e.resolver && !y(t.errors, l) && !g._f.deps) ||
            Fs(ae, y(t.touchedFields, l), t.isSubmitted, O, _),
          ot = hr(l, u, ae);
        L(i, l, ge),
          ae
            ? (!d || !d.readOnly) && (g._f.onBlur && g._f.onBlur(o), c && c(0))
            : g._f.onChange && g._f.onChange(o);
        const ut = me(l, ge, ae),
          $r = !K(ut) || ot;
        if ((!ae && C.state.next({ name: l, type: o.type, values: W(i) }), Pr))
          return (
            (w.isValid || F.isValid) && (e.mode === 'onBlur' ? ae && q() : ae || q()),
            $r && C.state.next({ name: l, ...(ot ? {} : ut) })
          );
        if (
          (!e.resolver && r.validate && (await Ze({ name: l, eventType: o.type })),
          !ae && ot && C.state.next({ ...t }),
          e.resolver)
        ) {
          const { errors: Pt } = await se([l]);
          if ((B([l]), m(ge), p)) {
            const Ur = mr(t.errors, s, l),
              $t = mr(Pt, s, Ur.name || l);
            (j = $t.error), (l = $t.name), (X = K(Pt));
          }
        } else
          B([l], !0),
            (j = (await gr(g, u.disabled, i, Y, e.shouldUseNativeValidation))[l]),
            B([l]),
            m(ge),
            p &&
              (j
                ? (X = !1)
                : (w.isValid || F.isValid) &&
                  (X = await R({ fields: s, onlyCheckValid: !0, name: l, eventType: o.type })));
        p &&
          (g._f.deps && (!Array.isArray(g._f.deps) || g._f.deps.length > 0) && st(g._f.deps),
          De(l, X, j, ut));
      }
    },
    Et = (o, d) => {
      if (y(t.errors, d) && o.focus) return o.focus(), 1;
    },
    st = async (o, d = {}) => {
      let l, p;
      const g = $e(o);
      if (e.resolver) {
        const m = await Ae($(o) ? o : g);
        (l = K(m)), (p = o ? !g.some((_) => y(m, _)) : l);
      } else
        o
          ? ((p = (
              await Promise.all(
                g.map(async (m) => {
                  const _ = y(s, m);
                  return await R({ fields: _ && _._f ? { [m]: _ } : _, eventType: be.TRIGGER });
                }),
              )
            ).every(Boolean)),
            !(!p && !t.isValid) && q())
          : (p = l = await R({ fields: s, name: o, eventType: be.TRIGGER }));
      return (
        C.state.next({
          ...(!te(o) || ((w.isValid || F.isValid) && l !== t.isValid) ? {} : { name: o }),
          ...(e.resolver || !o ? { isValid: l } : {}),
          errors: t.errors,
        }),
        d.shouldFocus && !p && Ue(s, Et, o ? g : u.mount),
        p
      );
    },
    Nt = (o, d) => {
      let l = { ...(n.mount ? i : a) };
      return (
        d && (l = Tr(d.dirtyFields ? t.dirtyFields : t.touchedFields, l)),
        $(o) ? l : te(o) ? y(l, o) : o.map((p) => y(l, p))
      );
    },
    Rt = (o, d) => ({
      invalid: !!y((d || t).errors, o),
      isDirty: !!y((d || t).dirtyFields, o),
      error: y((d || t).errors, o),
      isValidating: !!y(t.validatingFields, o),
      isTouched: !!y((d || t).touchedFields, o),
    }),
    Ft = (o) => {
      const d = o ? $e(o) : void 0;
      d == null || d.forEach((l) => H(t.errors, l)),
        d
          ? d.forEach((l) => {
              C.state.next({ name: l, errors: t.errors });
            })
          : C.state.next({ errors: {} });
    },
    Ge = (o, d, l) => {
      const p = (y(s, o, { _f: {} })._f || {}).ref,
        g = y(t.errors, o) || {},
        { ref: m, message: _, type: O, ...j } = g;
      L(t.errors, o, { ...j, ...d, ref: p }),
        C.state.next({ name: o, errors: t.errors, isValid: !1 }),
        l && l.shouldFocus && p && p.focus && p.focus();
    },
    Ir = (o, d) =>
      ee(o) ? C.state.subscribe({ next: (l) => 'values' in l && o(J(void 0, d), l) }) : J(o, d, !0),
    It = (o) =>
      C.state.subscribe({
        next: (d) => {
          Rs(o.name, d.name, o.exact) &&
            Ns(d, o.formState || w, Mr, o.reRenderRoot) &&
            o.callback({ values: { ...i }, ...t, ...d, defaultValues: a });
        },
      }).unsubscribe,
    Dr = (o) => (
      (n.mount = !0),
      (F = { ...F, ...o.formState }),
      It({ ...o, formState: { ...k, ...o.formState } })
    ),
    at = (o, d = {}) => {
      for (const l of o ? $e(o) : u.mount)
        u.mount.delete(l),
          u.array.delete(l),
          d.keepValue || (H(s, l), H(i, l)),
          !d.keepError && H(t.errors, l),
          !d.keepDirty && H(t.dirtyFields, l),
          !d.keepTouched && H(t.touchedFields, l),
          !d.keepIsValidating && H(t.validatingFields, l),
          !e.shouldUnregister && !d.keepDefaultValue && H(a, l);
      C.state.next({ values: W(i) }),
        C.state.next({ ...t, ...(d.keepDirty ? { isDirty: P() } : {}) }),
        !d.keepIsValid && q();
    },
    Dt = ({ disabled: o, name: d }) => {
      if ((ne(o) && n.mount) || o || u.disabled.has(d)) {
        const g = u.disabled.has(d) !== !!o;
        o ? u.disabled.add(d) : u.disabled.delete(d), g && n.mount && !n.action && q();
      }
    },
    it = (o, d = {}) => {
      let l = y(s, o);
      const p = ne(d.disabled) || ne(e.disabled),
        g = !u.registerName.has(o) && l && !l._f.mount;
      return (
        L(s, o, {
          ...(l || {}),
          _f: { ...(l && l._f ? l._f : { ref: { name: o } }), name: o, mount: !0, ...d },
        }),
        u.mount.add(o),
        l && !g
          ? Dt({ disabled: ne(d.disabled) ? d.disabled : e.disabled, name: o })
          : re(o, !0, d.value),
        {
          ...(p ? { disabled: d.disabled || e.disabled } : {}),
          ...(e.progressive
            ? {
                required: !!d.required,
                min: Le(d.min),
                max: Le(d.max),
                minLength: Le(d.minLength),
                maxLength: Le(d.maxLength),
                pattern: Le(d.pattern),
              }
            : {}),
          name: o,
          onChange: He,
          onBlur: He,
          ref: (m) => {
            if (m) {
              u.registerName.add(o), it(o, d), u.registerName.delete(o), (l = y(s, o));
              const _ =
                  ($(m.value) &&
                    m.querySelectorAll &&
                    m.querySelectorAll('input,select,textarea')[0]) ||
                  m,
                O = ws(_),
                j = l._f.refs || [];
              if (O ? j.find((X) => X === _) : _ === l._f.ref) return;
              L(s, o, {
                _f: {
                  ...l._f,
                  ...(O
                    ? {
                        refs: [...j.filter(ct), _, ...(Array.isArray(y(a, o)) ? [{}] : [])],
                        ref: { type: _.type, name: o },
                      }
                    : { ref: _ }),
                },
              }),
                re(o, !1, void 0, _);
            } else
              (l = y(s, o, {})),
                l._f && (l._f.mount = !1),
                (e.shouldUnregister || d.shouldUnregister) &&
                  !(wr(u.array, o) && n.action) &&
                  u.unMount.add(o);
          },
        }
      );
    },
    nt = () => e.shouldFocusError && Ue(s, Et, u.mount),
    Zr = (o) => {
      ne(o) &&
        (C.state.next({ disabled: o }),
        Ue(
          s,
          (d, l) => {
            const p = y(s, l);
            p &&
              ((d.disabled = p._f.disabled || o),
              Array.isArray(p._f.refs) &&
                p._f.refs.forEach((g) => {
                  g.disabled = p._f.disabled || o;
                }));
          },
          0,
          !1,
        ));
    },
    Zt = (o, d) => async (l) => {
      let p;
      l && (l.preventDefault && l.preventDefault(), l.persist && l.persist());
      let g = W(i);
      if ((C.state.next({ isSubmitting: !0 }), e.resolver)) {
        const { errors: m, values: _ } = await se();
        B(), (t.errors = m), (g = W(_));
      } else await R({ fields: s, eventType: be.SUBMIT });
      if (u.disabled.size) for (const m of u.disabled) H(g, m);
      if ((H(t.errors, Vr), K(t.errors))) {
        C.state.next({ errors: {} });
        try {
          await o(g, l);
        } catch (m) {
          p = m;
        }
      } else d && (await d({ ...t.errors }, l)), nt(), setTimeout(nt);
      if (
        (C.state.next({
          isSubmitted: !0,
          isSubmitting: !1,
          isSubmitSuccessful: K(t.errors) && !p,
          submitCount: t.submitCount + 1,
          errors: t.errors,
        }),
        p)
      )
        throw p;
    },
    jr = (o, d = {}) => {
      y(s, o) &&
        ($(d.defaultValue)
          ? _e(o, W(y(a, o)))
          : (_e(o, d.defaultValue), L(a, o, W(d.defaultValue))),
        d.keepTouched || H(t.touchedFields, o),
        d.keepDirty || (H(t.dirtyFields, o), (t.isDirty = d.defaultValue ? P(o, W(y(a, o))) : P())),
        d.keepError || (H(t.errors, o), w.isValid && q()),
        C.state.next({ ...t }));
    },
    jt = (o, d = {}) => {
      const l = o ? W(o) : a,
        p = W(l),
        g = K(o),
        m = g ? a : p;
      if ((d.keepDefaultValues || (a = l), !d.keepValues)) {
        if (d.keepDirtyValues) {
          const _ = new Set([...u.mount, ...Object.keys(Pe(a, i))]);
          for (const O of Array.from(_)) {
            const j = y(t.dirtyFields, O),
              X = y(i, O),
              ge = y(m, O);
            j && !$(X) ? L(m, O, X) : !j && !$(ge) && _e(O, ge);
          }
        } else {
          if (bt && $(o))
            for (const _ of u.mount) {
              const O = y(s, _);
              if (O && O._f) {
                const j = Array.isArray(O._f.refs) ? O._f.refs[0] : O._f.ref;
                if (et(j)) {
                  const X = j.closest('form');
                  if (X) {
                    X.reset();
                    break;
                  }
                }
              }
            }
          if (d.keepFieldsRef) for (const _ of u.mount) _e(_, y(m, _));
          else s = {};
        }
        (i = e.shouldUnregister ? (d.keepDefaultValues ? W(a) : {}) : W(m)),
          C.array.next({ values: { ...m } }),
          C.state.next({ values: { ...m } });
      }
      (u = {
        mount: d.keepDirtyValues ? u.mount : new Set(),
        unMount: new Set(),
        array: new Set(),
        registerName: new Set(),
        disabled: new Set(),
        watch: new Set(),
        watchAll: !1,
        focus: '',
      }),
        (n.mount =
          !w.isValid || !!d.keepIsValid || !!d.keepDirtyValues || (!e.shouldUnregister && !K(m))),
        (n.watch = !!e.shouldUnregister),
        (n.keepIsValid = !!d.keepIsValid),
        (n.action = !1),
        d.keepErrors || (t.errors = {}),
        C.state.next({
          submitCount: d.keepSubmitCount ? t.submitCount : 0,
          isDirty: g ? !1 : d.keepDirty ? t.isDirty : !!(d.keepDefaultValues && !he(o, a)),
          isSubmitted: d.keepIsSubmitted ? t.isSubmitted : !1,
          dirtyFields: g
            ? {}
            : d.keepDirtyValues
              ? d.keepDefaultValues && i
                ? Pe(a, i)
                : t.dirtyFields
              : d.keepDefaultValues && o
                ? Pe(a, o)
                : d.keepDirty
                  ? t.dirtyFields
                  : {},
          touchedFields: d.keepTouched ? t.touchedFields : {},
          errors: d.keepErrors ? t.errors : {},
          isSubmitSuccessful: d.keepIsSubmitSuccessful ? t.isSubmitSuccessful : !1,
          isSubmitting: !1,
          defaultValues: a,
        });
    },
    Lt = (o, d) => jt(ee(o) ? o(i) : o, { ...e.resetOptions, ...d }),
    Lr = (o, d = {}) => {
      const l = y(s, o),
        p = l && l._f;
      if (p) {
        const g = p.refs ? p.refs[0] : p.ref;
        g.focus &&
          setTimeout(() => {
            g.focus(), d.shouldSelect && ee(g.select) && g.select();
          });
      }
    },
    Mr = (o) => {
      t = { ...t, ...o };
    },
    Mt = {
      control: {
        register: it,
        unregister: at,
        getFieldState: Rt,
        handleSubmit: Zt,
        setError: Ge,
        _subscribe: It,
        _runSchema: se,
        _updateIsValidating: B,
        _focusError: nt,
        _getWatch: J,
        _getDirty: P,
        _setValid: q,
        _setFieldArray: Q,
        _setDisabledField: Dt,
        _setErrors: I,
        _getFieldArray: ye,
        _reset: jt,
        _resetDefaultValues: () =>
          ee(e.defaultValues) &&
          e.defaultValues().then((o) => {
            Lt(o, e.resetOptions), C.state.next({ isLoading: !1 });
          }),
        _removeUnmounted: M,
        _disableForm: Zr,
        _subjects: C,
        _proxyFormState: w,
        get _fields() {
          return s;
        },
        get _formValues() {
          return i;
        },
        get _state() {
          return n;
        },
        set _state(o) {
          n = o;
        },
        get _defaultValues() {
          return a;
        },
        get _names() {
          return u;
        },
        set _names(o) {
          u = o;
        },
        get _formState() {
          return t;
        },
        get _options() {
          return e;
        },
        set _options(o) {
          e = { ...e, ...o };
        },
      },
      subscribe: Dr,
      trigger: st,
      register: it,
      handleSubmit: Zt,
      watch: Ir,
      setValue: _e,
      getValues: Nt,
      reset: Lt,
      resetField: jr,
      clearErrors: Ft,
      unregister: at,
      setError: Ge,
      setFocus: Lr,
      getFieldState: Rt,
    };
  return { ...Mt, formControl: Mt };
}
function Ls(r = {}) {
  const e = V.useRef(void 0),
    t = V.useRef(void 0),
    [s, a] = V.useState({
      isDirty: !1,
      isValidating: !1,
      isLoading: ee(r.defaultValues),
      isSubmitted: !1,
      isSubmitting: !1,
      isSubmitSuccessful: !1,
      isValid: !1,
      submitCount: 0,
      dirtyFields: {},
      touchedFields: {},
      validatingFields: {},
      errors: r.errors || {},
      disabled: r.disabled || !1,
      isReady: !1,
      defaultValues: ee(r.defaultValues) ? void 0 : r.defaultValues,
    });
  if (!e.current)
    if (r.formControl)
      (e.current = { ...r.formControl, formState: s }),
        r.defaultValues &&
          !ee(r.defaultValues) &&
          r.formControl.reset(r.defaultValues, r.resetOptions);
    else {
      const { formControl: n, ...u } = js(r);
      e.current = { ...u, formState: s };
    }
  const i = e.current.control;
  return (
    (i._options = r),
    At(() => {
      const n = i._subscribe({
        formState: i._proxyFormState,
        callback: () => a({ ...i._formState }),
        reRenderRoot: !0,
      });
      return a((u) => ({ ...u, isReady: !0 })), (i._formState.isReady = !0), n;
    }, [i]),
    V.useEffect(() => i._disableForm(r.disabled), [i, r.disabled]),
    V.useEffect(() => {
      r.mode && (i._options.mode = r.mode),
        r.reValidateMode && (i._options.reValidateMode = r.reValidateMode);
    }, [i, r.mode, r.reValidateMode]),
    V.useEffect(() => {
      r.errors && (i._setErrors(r.errors), i._focusError());
    }, [i, r.errors]),
    V.useEffect(() => {
      r.shouldUnregister && i._subjects.state.next({ values: i._getWatch() });
    }, [i, r.shouldUnregister]),
    V.useEffect(() => {
      if (i._proxyFormState.isDirty) {
        const n = i._getDirty();
        n !== s.isDirty && i._subjects.state.next({ isDirty: n });
      }
    }, [i, s.isDirty]),
    V.useEffect(() => {
      var n;
      r.values && !he(r.values, t.current)
        ? (i._reset(r.values, { keepFieldsRef: !0, ...i._options.resetOptions }),
          (!((n = i._options.resetOptions) === null || n === void 0) && n.keepIsValid) ||
            i._setValid(),
          (t.current = r.values),
          a((u) => ({ ...u })))
        : i._resetDefaultValues();
    }, [i, r.values]),
    V.useEffect(() => {
      i._state.mount || (i._setValid(), (i._state.mount = !0)),
        i._state.watch && ((i._state.watch = !1), i._subjects.state.next({ ...i._formState })),
        i._removeUnmounted();
    }),
    (e.current.formState = V.useMemo(() => Cr(s, i), [i, s])),
    e.current
  );
}
const pr = (r, e, t) => {
    if (r && 'reportValidity' in r) {
      const s = y(t, e);
      r.setCustomValidity((s && s.message) || ''), r.reportValidity();
    }
  },
  Fr = (r, e) => {
    for (const t in e.fields) {
      const s = e.fields[t];
      s && s.ref && 'reportValidity' in s.ref
        ? pr(s.ref, t, r)
        : s.refs && s.refs.forEach((a) => pr(a, t, r));
    }
  },
  Ms = (r, e) => {
    e.shouldUseNativeValidation && Fr(r, e);
    const t = {};
    for (const s in r) {
      const a = y(e.fields, s),
        i = Object.assign(r[s] || {}, { ref: a && a.ref });
      if (Ps(e.names || Object.keys(r), s)) {
        const n = Object.assign({}, y(t, s));
        L(n, 'root', i), L(t, s, n);
      } else L(t, s, i);
    }
    return t;
  },
  Ps = (r, e) => r.some((t) => t.startsWith(e + '.'));
var $s = (r, e) => {
    for (var t = {}; r.length; ) {
      var s = r[0],
        a = s.code,
        i = s.message,
        n = s.path.join('.');
      if (!t[n])
        if ('unionErrors' in s) {
          var u = s.unionErrors[0].errors[0];
          t[n] = { message: u.message, type: u.code };
        } else t[n] = { message: i, type: a };
      if (
        ('unionErrors' in s && s.unionErrors.forEach((k) => k.errors.forEach((w) => r.push(w))), e)
      ) {
        var c = t[n].types,
          f = c && c[s.code];
        t[n] = Ar(n, e, t, a, f ? [].concat(f, s.message) : s.message);
      }
      r.shift();
    }
    return t;
  },
  Us = (r, e, t) => (
    t === void 0 && (t = {}),
    (s, a, i) => {
      try {
        return Promise.resolve(
          ((n, u) => {
            try {
              var c = Promise.resolve(r[t.mode === 'sync' ? 'parse' : 'parseAsync'](s, e)).then(
                (f) => (
                  i.shouldUseNativeValidation && Fr({}, i), { errors: {}, values: t.raw ? s : f }
                ),
              );
            } catch (f) {
              return u(f);
            }
            return c && c.then ? c.then(void 0, u) : c;
          })(0, (n) => {
            if (((u) => Array.isArray(u == null ? void 0 : u.errors))(n))
              return {
                values: {},
                errors: Ms(
                  $s(n.errors, !i.shouldUseNativeValidation && i.criteriaMode === 'all'),
                  i,
                ),
              };
            throw n;
          }),
        );
      } catch (n) {
        return Promise.reject(n);
      }
    }
  );
function Bs({
  schema: r,
  defaultValues: e,
  onSubmit: t,
  children: s,
  submitLabel: a,
  cancelLabel: i,
  onCancel: n,
  loading: u = !1,
  className: c,
}) {
  const f = Ls({ resolver: Us(r), defaultValues: e });
  return ce.jsx(ks, {
    ...f,
    children: ce.jsxs('form', {
      onSubmit: f.handleSubmit(t),
      className: Br('space-y-6', c),
      noValidate: !0,
      children: [
        ce.jsx('div', { className: 'space-y-4', children: s }),
        ce.jsxs('div', {
          className: 'flex items-center gap-3 pt-2',
          children: [
            ce.jsx(Bt, { type: 'submit', disabled: u, children: a }),
            n &&
              i &&
              ce.jsx(Bt, {
                type: 'button',
                variant: 'outline',
                onClick: n,
                disabled: u,
                children: i,
              }),
          ],
        }),
      ],
    }),
  });
}
function zs({ name: r, label: e, description: t, children: s, required: a = !1 }) {
  const { control: i } = bs(),
    {
      field: { value: n, onChange: u, onBlur: c, ref: f },
      fieldState: { error: k },
    } = xs({ name: r, control: i }),
    w = Ut.isValidElement(s)
      ? Ut.cloneElement(s, {
          ...s.props,
          value: n ?? '',
          onChange: u,
          onBlur: c,
          ref: f,
          'aria-invalid': !!k,
        })
      : s;
  return ce.jsxs('div', {
    className: 'space-y-2',
    'data-slot': 'form-field',
    children: [
      ce.jsxs(zr, {
        children: [e, a && ce.jsx('span', { className: 'text-destructive ml-0.5', children: '*' })],
      }),
      t && ce.jsx('p', { className: 'text-sm text-muted-foreground', children: t }),
      w,
      (k == null ? void 0 : k.message) &&
        ce.jsx('p', { className: 'text-sm text-destructive', role: 'alert', children: k.message }),
    ],
  });
}
Bs.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxForm',
  props: {
    schema: {
      required: !0,
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
      required: !0,
      tsType: {
        name: 'SubmitHandler',
        elements: [{ name: 'TFormValues' }],
        raw: 'SubmitHandler<TFormValues>',
      },
      description: '',
    },
    children: { required: !0, tsType: { name: 'ReactNode' }, description: '' },
    submitLabel: {
      required: !0,
      tsType: { name: 'ReactNode' },
      description: '提交按钮文案 — 必传，零默认文案',
    },
    cancelLabel: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    onCancel: {
      required: !1,
      tsType: {
        name: 'signature',
        type: 'function',
        raw: '() => void',
        signature: { arguments: [], return: { name: 'void' } },
      },
      description: '',
    },
    loading: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '提交中禁用按钮',
      defaultValue: { value: 'false', computed: !1 },
    },
    className: { required: !1, tsType: { name: 'string' }, description: '' },
  },
};
zs.__docgenInfo = {
  description: '',
  methods: [],
  displayName: 'NxFormField',
  props: {
    name: {
      required: !0,
      tsType: {
        name: 'FieldPath',
        elements: [{ name: 'TFormValues' }],
        raw: 'FieldPath<TFormValues>',
      },
      description: '',
    },
    label: { required: !0, tsType: { name: 'ReactNode' }, description: '' },
    description: { required: !1, tsType: { name: 'ReactNode' }, description: '' },
    children: {
      required: !0,
      tsType: { name: 'ReactElement' },
      description: '接受 L2 Input / Select / Checkbox 等',
    },
    required: {
      required: !1,
      tsType: { name: 'boolean' },
      description: '仅视觉星号，验证由 schema 决定',
      defaultValue: { value: 'false', computed: !1 },
    },
  },
};
export { ks as F, Bs as N, zs as a, Js as o, Ys as s, Us as t, Ls as u };
