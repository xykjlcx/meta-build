import { j as e } from './jsx-runtime-BjG_zV1W.js';
import { I as r } from './table-BAJRp_jF.js';
import './index-B3e6rcmj.js';
import { fn as S } from './index-DgAF9SIF.js';
import { o as L, a as l, N as o, s as u } from './nx-form-BOcfYuQR.js';
import './index-JG1J0hlI.js';
import './_commonjsHelpers-Cpj98o6Y.js';
const m = L({ username: u().min(2, '至少 2 个字符'), email: u().email('邮箱格式错误') }),
  k = {
    title: 'Patterns/NxForm',
    component: o,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
  },
  s = {
    args: {
      schema: m,
      defaultValues: { username: '', email: '' },
      onSubmit: S(),
      submitLabel: '提交',
      children: null,
    },
    render: (a) =>
      e.jsxs(o, {
        schema: m,
        defaultValues: a.defaultValues,
        onSubmit: a.onSubmit,
        submitLabel: a.submitLabel,
        children: [
          e.jsx(l, {
            name: 'username',
            label: '用户名',
            required: !0,
            children: e.jsx(r, { placeholder: '请输入用户名' }),
          }),
          e.jsx(l, {
            name: 'email',
            label: '邮箱',
            children: e.jsx(r, { placeholder: '请输入邮箱' }),
          }),
        ],
      }),
  },
  n = {
    args: { ...s.args },
    render: (a) =>
      e.jsxs('div', {
        className: 'w-80',
        children: [
          e.jsx('p', {
            className: 'mb-4 text-sm text-muted-foreground',
            children: '直接点击提交按钮查看校验错误',
          }),
          e.jsxs(o, {
            schema: m,
            defaultValues: { username: '', email: '' },
            onSubmit: a.onSubmit,
            submitLabel: '提交',
            children: [
              e.jsx(l, {
                name: 'username',
                label: '用户名',
                required: !0,
                children: e.jsx(r, { placeholder: '请输入用户名' }),
              }),
              e.jsx(l, {
                name: 'email',
                label: '邮箱',
                required: !0,
                children: e.jsx(r, { placeholder: '请输入邮箱' }),
              }),
            ],
          }),
        ],
      }),
  },
  t = {
    args: { ...s.args, loading: !0 },
    render: (a) =>
      e.jsxs(o, {
        schema: m,
        defaultValues: { username: 'alice', email: 'alice@test.com' },
        onSubmit: a.onSubmit,
        submitLabel: '提交中...',
        loading: !0,
        children: [
          e.jsx(l, {
            name: 'username',
            label: '用户名',
            required: !0,
            children: e.jsx(r, { placeholder: '请输入用户名' }),
          }),
          e.jsx(l, {
            name: 'email',
            label: '邮箱',
            children: e.jsx(r, { placeholder: '请输入邮箱' }),
          }),
        ],
      }),
  },
  i = {
    args: { ...s.args, cancelLabel: '取消', onCancel: S() },
    render: (a) =>
      e.jsxs(o, {
        schema: m,
        defaultValues: { username: '', email: '' },
        onSubmit: a.onSubmit,
        submitLabel: '保存',
        cancelLabel: '取消',
        onCancel: a.onCancel,
        children: [
          e.jsx(l, {
            name: 'username',
            label: '用户名',
            required: !0,
            children: e.jsx(r, { placeholder: '请输入用户名' }),
          }),
          e.jsx(l, {
            name: 'email',
            label: '邮箱',
            children: e.jsx(r, { placeholder: '请输入邮箱' }),
          }),
        ],
      }),
  };
var d, c, b;
s.parameters = {
  ...s.parameters,
  docs: {
    ...((d = s.parameters) == null ? void 0 : d.docs),
    source: {
      originalSource: `{
  args: {
    schema,
    defaultValues: {
      username: '',
      email: ''
    },
    onSubmit: fn(),
    submitLabel: '提交',
    children: null
  },
  render: args => <NxForm<FormValues> schema={schema} defaultValues={args.defaultValues as FormValues} onSubmit={args.onSubmit} submitLabel={args.submitLabel}>
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>
}`,
      ...((b = (c = s.parameters) == null ? void 0 : c.docs) == null ? void 0 : b.source),
    },
  },
};
var p, x, F;
n.parameters = {
  ...n.parameters,
  docs: {
    ...((p = n.parameters) == null ? void 0 : p.docs),
    source: {
      originalSource: `{
  args: {
    ...Default.args
  },
  render: args => <div className="w-80">
      <p className="mb-4 text-sm text-muted-foreground">直接点击提交按钮查看校验错误</p>
      <NxForm<FormValues> schema={schema} defaultValues={{
      username: '',
      email: ''
    }}
    // biome-ignore lint/style/noNonNullAssertion: Storybook args 由框架保证
    onSubmit={args.onSubmit!} submitLabel="提交">
        <NxFormField<FormValues> name="username" label="用户名" required>
          <Input placeholder="请输入用户名" />
        </NxFormField>
        <NxFormField<FormValues> name="email" label="邮箱" required>
          <Input placeholder="请输入邮箱" />
        </NxFormField>
      </NxForm>
    </div>
}`,
      ...((F = (x = n.parameters) == null ? void 0 : x.docs) == null ? void 0 : F.source),
    },
  },
};
var h, g, N;
t.parameters = {
  ...t.parameters,
  docs: {
    ...((h = t.parameters) == null ? void 0 : h.docs),
    source: {
      originalSource: `{
  args: {
    ...Default.args,
    loading: true
  },
  render: args => <NxForm<FormValues> schema={schema} defaultValues={{
    username: 'alice',
    email: 'alice@test.com'
  }}
  // biome-ignore lint/style/noNonNullAssertion: Storybook args 由框架保证
  onSubmit={args.onSubmit!} submitLabel="提交中..." loading>
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>
}`,
      ...((N = (g = t.parameters) == null ? void 0 : g.docs) == null ? void 0 : N.source),
    },
  },
};
var f, V, j;
i.parameters = {
  ...i.parameters,
  docs: {
    ...((f = i.parameters) == null ? void 0 : f.docs),
    source: {
      originalSource: `{
  args: {
    ...Default.args,
    cancelLabel: '取消',
    onCancel: fn()
  },
  render: args => <NxForm<FormValues> schema={schema} defaultValues={{
    username: '',
    email: ''
  }}
  // biome-ignore lint/style/noNonNullAssertion: Storybook args 由框架保证
  onSubmit={args.onSubmit!} submitLabel="保存" cancelLabel="取消" onCancel={args.onCancel}>
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>
}`,
      ...((j = (V = i.parameters) == null ? void 0 : V.docs) == null ? void 0 : j.source),
    },
  },
};
const v = ['Default', 'WithValidationErrors', 'Loading', 'WithCancel'];
export {
  s as Default,
  t as Loading,
  i as WithCancel,
  n as WithValidationErrors,
  v as __namedExportsOrder,
  k as default,
};
