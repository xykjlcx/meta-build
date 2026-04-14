import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { z } from 'zod';
import { NxDrawer } from './nx-drawer';
import { NxFormField } from './nx-form';
import { Input, Button } from '@mb/ui-primitives';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Patterns/NxDrawer',
  component: NxDrawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NxDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// 测试用 schema
// ---------------------------------------------------------------------------

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** 纯展示模式 — 无表单，只有标题和内容 */
export const Display: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    title: 'Detail',
    description: 'View item details',
    closeLabel: 'Close drawer',
    children: null,
  },
  render: function DisplayStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Display Drawer</Button>
        <NxDrawer
          open={open}
          onOpenChange={setOpen}
          title="Item Detail"
          description="Read-only information"
          closeLabel="Close drawer"
        >
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd>Alice</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd>alice@example.com</dd>
            </div>
          </dl>
        </NxDrawer>
      </>
    );
  },
};

/** 表单模式 — 有 schema + submit */
export const FormMode: Story = {
  args: {
    ...Display.args,
  },
  render: function FormModeStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Form Drawer</Button>
        <NxDrawer<FormValues>
          open={open}
          onOpenChange={setOpen}
          title="Add Item"
          closeLabel="Close drawer"
          schema={schema}
          defaultValues={{ name: '', email: '' }}
          onSubmit={(data) => {
            console.log('submit', data);
            setOpen(false);
          }}
          submitLabel="Save"
          cancelLabel="Cancel"
        >
          <NxFormField<FormValues> name="name" label="Name" required>
            <Input placeholder="Enter name" />
          </NxFormField>
          <NxFormField<FormValues> name="email" label="Email" required>
            <Input placeholder="Enter email" />
          </NxFormField>
        </NxDrawer>
      </>
    );
  },
};

/** 脏检查模式 — 修改表单后关闭会弹确认 */
export const WithDirtyCheck: Story = {
  args: {
    ...Display.args,
  },
  render: function DirtyCheckStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Dirty Check Drawer</Button>
        <NxDrawer<FormValues>
          open={open}
          onOpenChange={setOpen}
          title="Edit Item"
          closeLabel="Close drawer"
          schema={schema}
          defaultValues={{ name: 'Alice', email: 'alice@example.com' }}
          onSubmit={(data) => {
            console.log('submit', data);
            setOpen(false);
          }}
          submitLabel="Save"
          cancelLabel="Cancel"
          dirtyConfirmText="Discard unsaved changes?"
        >
          <NxFormField<FormValues> name="name" label="Name" required>
            <Input placeholder="Enter name" />
          </NxFormField>
          <NxFormField<FormValues> name="email" label="Email" required>
            <Input placeholder="Enter email" />
          </NxFormField>
        </NxDrawer>
      </>
    );
  },
};

/** 左侧打开 */
export const LeftSide: Story = {
  args: {
    ...Display.args,
  },
  render: function LeftSideStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Left Drawer</Button>
        <NxDrawer
          open={open}
          onOpenChange={setOpen}
          title="Left Drawer"
          description="Opens from the left side"
          closeLabel="Close drawer"
          side="left"
        >
          <p>Content on the left.</p>
        </NxDrawer>
      </>
    );
  },
};
