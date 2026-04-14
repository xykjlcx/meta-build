import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { NxDrawer } from './nx-drawer';
import { NxFormField } from './nx-form';
import { Input } from '@mb/ui-primitives';

// ---------------------------------------------------------------------------
// 测试用 schema
// ---------------------------------------------------------------------------

const schema = z.object({
  name: z.string().min(1, 'name required'),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// NxDrawer 测试
// ---------------------------------------------------------------------------

describe('NxDrawer', () => {
  it('open 受控 — open=false 时不渲染内容', () => {
    const onOpenChange = vi.fn();
    render(
      <NxDrawer
        open={false}
        onOpenChange={onOpenChange}
        title="Test"
        closeLabel="Close"
      >
        <p>Hidden content</p>
      </NxDrawer>,
    );
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('纯展示模式 — 渲染 title 和 children', () => {
    const onOpenChange = vi.fn();
    render(
      <NxDrawer
        open={true}
        onOpenChange={onOpenChange}
        title="Detail"
        description="Some description"
        closeLabel="Close"
      >
        <p>Display content</p>
      </NxDrawer>,
    );
    expect(screen.getByText('Detail')).toBeDefined();
    expect(screen.getByText('Some description')).toBeDefined();
    expect(screen.getByText('Display content')).toBeDefined();
  });

  it('表单模式提交 — onSubmit 触发并收到表单数据', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <NxDrawer<FormValues>
        open={true}
        onOpenChange={onOpenChange}
        title="Add"
        closeLabel="Close"
        schema={schema}
        defaultValues={{ name: '' }}
        onSubmit={onSubmit}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <NxFormField<FormValues> name="name" label="Name">
          <Input placeholder="Enter name" />
        </NxFormField>
      </NxDrawer>,
    );

    await user.type(screen.getByPlaceholderText('Enter name'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { name: 'Alice' },
        expect.anything(),
      );
    });
  });

  it('关闭回调 — 点击取消按钮触发 onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <NxDrawer<FormValues>
        open={true}
        onOpenChange={onOpenChange}
        title="Edit"
        closeLabel="Close"
        schema={schema}
        defaultValues={{ name: '' }}
        onSubmit={vi.fn()}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <NxFormField<FormValues> name="name" label="Name">
          <Input placeholder="Enter name" />
        </NxFormField>
      </NxDrawer>,
    );

    // 没有修改表单，直接点取消 → 直接关闭
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('脏检查 — 修改表单后尝试关闭，弹出确认对话框', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <NxDrawer<FormValues>
        open={true}
        onOpenChange={onOpenChange}
        title="Edit"
        closeLabel="Close"
        schema={schema}
        defaultValues={{ name: '' }}
        onSubmit={vi.fn()}
        submitLabel="Save"
        cancelLabel="Cancel"
        dirtyConfirmText="Discard unsaved changes?"
      >
        <NxFormField<FormValues> name="name" label="Name">
          <Input placeholder="Enter name" />
        </NxFormField>
      </NxDrawer>,
    );

    // 先让表单变脏
    await user.type(screen.getByPlaceholderText('Enter name'), 'dirty');

    // 点取消 → 应弹出确认框而非直接关闭
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).not.toHaveBeenCalled();

    // 确认框应该出现
    await waitFor(() => {
      expect(screen.getByText('Discard unsaved changes?')).toBeDefined();
    });

    // 点击确认放弃（按钮文案来自 closeLabel）→ 关闭抽屉
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('脏检查取消 — 确认框中点取消不关闭抽屉', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <NxDrawer<FormValues>
        open={true}
        onOpenChange={onOpenChange}
        title="Edit"
        closeLabel="Close"
        schema={schema}
        defaultValues={{ name: '' }}
        onSubmit={vi.fn()}
        submitLabel="Save"
        cancelLabel="Cancel"
        dirtyConfirmText="Discard unsaved changes?"
      >
        <NxFormField<FormValues> name="name" label="Name">
          <Input placeholder="Enter name" />
        </NxFormField>
      </NxDrawer>,
    );

    // 让表单变脏
    await user.type(screen.getByPlaceholderText('Enter name'), 'dirty');

    // 点取消 → 弹确认框
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByText('Discard unsaved changes?')).toBeDefined();
    });

    // 点确认框中的"Cancel"取消 → 不关闭抽屉
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    // 确认框中的 Cancel 按钮
    const dialogCancelBtn = cancelButtons.find(
      (btn) => btn.closest('[data-slot="alert-dialog-content"]'),
    );
    if (dialogCancelBtn) {
      await user.click(dialogCancelBtn);
    }

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
