import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { z } from 'zod';
import { NxForm, NxFormField } from './nx-form';
import { Input } from '@mb/ui-primitives';

const schema = z.object({
  username: z.string().min(2, '至少 2 个字符'),
  email: z.string().email('邮箱格式错误'),
});

type FormValues = z.infer<typeof schema>;

const meta = {
  title: 'Patterns/NxForm',
  component: NxForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NxForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    schema,
    defaultValues: { username: '', email: '' },
    onSubmit: fn(),
    submitLabel: '提交',
    children: null,
  },
  render: (args) => (
    <NxForm<FormValues>
      schema={schema}
      defaultValues={args.defaultValues as FormValues}
      onSubmit={args.onSubmit}
      submitLabel={args.submitLabel}
    >
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>
  ),
};

export const WithValidationErrors: Story = {
  args: {
    ...Default.args,
  },
  render: (args) => (
    <div className="w-80">
      <p className="mb-4 text-sm text-muted-foreground">
        直接点击提交按钮查看校验错误
      </p>
      <NxForm<FormValues>
        schema={schema}
        defaultValues={{ username: '', email: '' }}
        onSubmit={args.onSubmit!}
        submitLabel="提交"
      >
        <NxFormField<FormValues> name="username" label="用户名" required>
          <Input placeholder="请输入用户名" />
        </NxFormField>
        <NxFormField<FormValues> name="email" label="邮箱" required>
          <Input placeholder="请输入邮箱" />
        </NxFormField>
      </NxForm>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
  render: (args) => (
    <NxForm<FormValues>
      schema={schema}
      defaultValues={{ username: 'alice', email: 'alice@test.com' }}
      onSubmit={args.onSubmit!}
      submitLabel="提交中..."
      loading
    >
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>
  ),
};

export const WithCancel: Story = {
  args: {
    ...Default.args,
    cancelLabel: '取消',
    onCancel: fn(),
  },
  render: (args) => (
    <NxForm<FormValues>
      schema={schema}
      defaultValues={{ username: '', email: '' }}
      onSubmit={args.onSubmit!}
      submitLabel="保存"
      cancelLabel="取消"
      onCancel={args.onCancel}
    >
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>
  ),
};
