import { D as a, f as d, e as l, c as m, a as n, d as p, b as s } from './dialog-D1j1OD2J.js';
import { j as t } from './jsx-runtime-BjG_zV1W.js';
import './button-BqedyRxs.js';
import './index-D1SQP9Z-.js';
import './utils-BQHNewu7.js';
import './index-DuVyFFjR.js';
import './index-B3e6rcmj.js';
import './_commonjsHelpers-Cpj98o6Y.js';
import './x-0qQuNm2G.js';
import './createLucideIcon-D27BUxB9.js';
import './index-H2JHQ55g.js';
import './index-DclwlaNk.js';
import './index-BAgrSUEs.js';
import './index-CXzmB-r4.js';
import './index-CnCkN4Kb.js';
import './index-Tk7B4GT7.js';
import './index-JG1J0hlI.js';
import './index-CLFlh7pk.js';
import './index-D8RfjXkI.js';
import './index-npCAFBsl.js';
import './index-BsSyydlo.js';
const S = {
    title: 'Primitives/Dialog',
    component: a,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  o = {
    render: () =>
      t.jsxs(a, {
        children: [
          t.jsx(n, {
            asChild: !0,
            children: t.jsx('button', {
              type: 'button',
              className: 'rounded-md border px-4 py-2 text-sm',
              children: '打开对话框',
            }),
          }),
          t.jsxs(s, {
            children: [
              t.jsxs(m, {
                children: [
                  t.jsx(p, { children: '编辑个人信息' }),
                  t.jsx(l, { children: '修改您的个人信息，完成后点击保存。' }),
                ],
              }),
              t.jsx('div', { className: 'py-4', children: '对话框内容区域' }),
              t.jsx(d, {
                children: t.jsx('button', {
                  type: 'button',
                  className: 'rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground',
                  children: '保存',
                }),
              }),
            ],
          }),
        ],
      }),
  };
var r, e, i;
o.parameters = {
  ...o.parameters,
  docs: {
    ...((r = o.parameters) == null ? void 0 : r.docs),
    source: {
      originalSource: `{
  render: () => <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          打开对话框
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑个人信息</DialogTitle>
          <DialogDescription>修改您的个人信息，完成后点击保存。</DialogDescription>
        </DialogHeader>
        <div className="py-4">对话框内容区域</div>
        <DialogFooter>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
}`,
      ...((i = (e = o.parameters) == null ? void 0 : e.docs) == null ? void 0 : i.source),
    },
  },
};
const k = ['Default'];
export { o as Default, k as __namedExportsOrder, S as default };
