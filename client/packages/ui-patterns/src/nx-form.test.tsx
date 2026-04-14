import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { NxForm, NxFormField } from './nx-form';
import { Input } from '@mb/ui-primitives';

const schema = z.object({
  username: z.string().min(2, '至少 2 个字符'),
  email: z.string().email('邮箱格式错误'),
});

type FormValues = z.infer<typeof schema>;

/** 渲染标准测试表单 */
function renderForm(overrides: Partial<React.ComponentProps<typeof NxForm<FormValues>>> = {}) {
  const onSubmit = vi.fn();
  const result = render(
    <NxForm<FormValues>
      schema={schema}
      defaultValues={{ username: '', email: '' }}
      onSubmit={onSubmit}
      submitLabel="提交"
      {...overrides}
    >
      <NxFormField<FormValues> name="username" label="用户名" required>
        <Input placeholder="请输入用户名" />
      </NxFormField>
      <NxFormField<FormValues> name="email" label="邮箱">
        <Input placeholder="请输入邮箱" />
      </NxFormField>
    </NxForm>,
  );
  return { ...result, onSubmit };
}

describe('NxForm', () => {
  it('正常提交 — 填写有效数据后 onSubmit 应被调用', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByPlaceholderText('请输入用户名'), 'alice');
    await user.type(screen.getByPlaceholderText('请输入邮箱'), 'alice@test.com');
    await user.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { username: 'alice', email: 'alice@test.com' },
        expect.anything(),
      );
    });
  });

  it('验证失败 — 提交空表单应显示 zod 错误信息', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(screen.getByText('至少 2 个字符')).toBeDefined();
      expect(screen.getByText('邮箱格式错误')).toBeDefined();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('loading 状态 — 提交按钮应被禁用', () => {
    renderForm({ loading: true });
    const btn = screen.getByRole('button', { name: '提交' });
    expect(btn).toHaveProperty('disabled', true);
  });

  it('onCancel — 点击取消按钮应触发回调', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm({ cancelLabel: '取消', onCancel });

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('required 星号 — 标记 required 的字段应显示红色星号', () => {
    renderForm();
    // "用户名" 字段标记了 required，应该有 * 号
    const asterisks = screen.getAllByText('*');
    expect(asterisks.length).toBeGreaterThanOrEqual(1);
    // 星号应该有 destructive 颜色类
    expect(asterisks[0]!.className).toContain('text-destructive');
  });

  it('不传 onCancel 时不渲染取消按钮', () => {
    renderForm();
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
  });
});
