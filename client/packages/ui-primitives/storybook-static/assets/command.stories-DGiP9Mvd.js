import {
  c as C,
  f as a,
  g as c,
  a as i,
  e as o,
  b as p,
  d as r,
  C as s,
} from './command-83YOuc5f.js';
import { j as m } from './jsx-runtime-BjG_zV1W.js';
import './index-H2JHQ55g.js';
import './index-B3e6rcmj.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './index-DclwlaNk.js';
import './index-BAgrSUEs.js';
import './index-DuVyFFjR.js';
import './index-CXzmB-r4.js';
import './index-CnCkN4Kb.js';
import './index-Tk7B4GT7.js';
import './index-JG1J0hlI.js';
import './index-CLFlh7pk.js';
import './index-D8RfjXkI.js';
import './index-npCAFBsl.js';
import './index-BsSyydlo.js';
import './dialog-D1j1OD2J.js';
import './button-BqedyRxs.js';
import './index-D1SQP9Z-.js';
import './utils-BQHNewu7.js';
import './x-0qQuNm2G.js';
import './createLucideIcon-D27BUxB9.js';
const R = {
    title: 'Primitives/Command',
    component: s,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  n = {
    render: () =>
      m.jsxs(s, {
        className: 'w-[350px] rounded-lg border shadow-md',
        children: [
          m.jsx(i, { placeholder: '输入命令...' }),
          m.jsxs(p, {
            children: [
              m.jsx(C, { children: '未找到结果' }),
              m.jsxs(r, {
                heading: '建议',
                children: [
                  m.jsxs(o, { children: ['日历', m.jsx(a, { children: 'Ctrl+C' })] }),
                  m.jsxs(o, { children: ['搜索', m.jsx(a, { children: 'Ctrl+F' })] }),
                  m.jsx(o, { children: '设置' }),
                ],
              }),
              m.jsx(c, {}),
              m.jsxs(r, {
                heading: '操作',
                children: [m.jsx(o, { children: '新建文件' }), m.jsx(o, { children: '导出数据' })],
              }),
            ],
          }),
        ],
      }),
  };
var t, d, e;
n.parameters = {
  ...n.parameters,
  docs: {
    ...((t = n.parameters) == null ? void 0 : t.docs),
    source: {
      originalSource: `{
  render: () => <Command className="w-[350px] rounded-lg border shadow-md">
      <CommandInput placeholder="输入命令..." />
      <CommandList>
        <CommandEmpty>未找到结果</CommandEmpty>
        <CommandGroup heading="建议">
          <CommandItem>
            日历
            <CommandShortcut>Ctrl+C</CommandShortcut>
          </CommandItem>
          <CommandItem>
            搜索
            <CommandShortcut>Ctrl+F</CommandShortcut>
          </CommandItem>
          <CommandItem>设置</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="操作">
          <CommandItem>新建文件</CommandItem>
          <CommandItem>导出数据</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
}`,
      ...((e = (d = n.parameters) == null ? void 0 : d.docs) == null ? void 0 : e.source),
    },
  },
};
const k = ['Default'];
export { n as Default, k as __namedExportsOrder, R as default };
