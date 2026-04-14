import type { Meta, StoryObj } from '@storybook/react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

const meta = {
  title: 'Primitives/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          右侧抽屉
        </button>
      </DrawerTrigger>
      <DrawerContent closeLabel="关闭">
        <DrawerHeader>
          <DrawerTitle>设置</DrawerTitle>
          <DrawerDescription>修改应用设置</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">设置内容区域</div>
        <DrawerFooter>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            保存
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Left: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          左侧抽屉
        </button>
      </DrawerTrigger>
      <DrawerContent side="left" closeLabel="关闭">
        <DrawerHeader>
          <DrawerTitle>导航</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">导航菜单区域</div>
      </DrawerContent>
    </Drawer>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          底部抽屉
        </button>
      </DrawerTrigger>
      <DrawerContent side="bottom" closeLabel="关闭">
        <DrawerHeader>
          <DrawerTitle>操作菜单</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">操作选项列表</div>
      </DrawerContent>
    </Drawer>
  ),
};
