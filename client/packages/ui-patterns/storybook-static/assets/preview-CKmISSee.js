const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      './DocsRenderer-CFRXHY34-DS4_0lRq.js',
      './iframe-CBZ55tyq.js',
      './index-B3e6rcmj.js',
      './_commonjsHelpers-Cpj98o6Y.js',
      './jsx-runtime-BjG_zV1W.js',
      './index-JG1J0hlI.js',
      './index-Bhelpi4i.js',
      './index-DrFu-skq.js',
      './client-DzDRB_2o.js',
    ]),
) => i.map((i) => d[i]);
import { _ as a } from './iframe-CBZ55tyq.js';
var i = Object.defineProperty,
  s = (e, r) => {
    for (var t in r) i(e, t, { get: r[t], enumerable: !0 });
  },
  _ = {};
s(_, { parameters: () => d });
var p = Object.entries(globalThis.TAGS_OPTIONS ?? {}).reduce((e, r) => {
    const [t, o] = r;
    return o.excludeFromDocsStories && (e[t] = !0), e;
  }, {}),
  d = {
    docs: {
      renderer: async () => {
        const { DocsRenderer: e } = await a(
          () => import('./DocsRenderer-CFRXHY34-DS4_0lRq.js').then((r) => r.D),
          __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8]),
          import.meta.url,
        );
        return new e();
      },
      stories: {
        filter: (e) => {
          var r;
          return (
            (e.tags || []).filter((t) => p[t]).length === 0 &&
            !((r = e.parameters.docs) != null && r.disable)
          );
        },
      },
    },
  };
export { d as parameters };
