import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

describe('Drawer', () => {
  it('应该渲染触发按钮', () => {
    render(
      <Drawer>
        <DrawerTrigger>打开抽屉</DrawerTrigger>
        <DrawerContent closeLabel="关闭">
          <DrawerTitle>标题</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText('打开抽屉')).toBeDefined();
  });

  it('点击触发按钮应该显示抽屉内容', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent closeLabel="关闭">
          <DrawerHeader>
            <DrawerTitle>抽屉标题</DrawerTitle>
            <DrawerDescription>抽屉描述</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    expect(screen.getByText('抽屉标题')).toBeDefined();
    expect(screen.getByText('抽屉描述')).toBeDefined();
  });

  it('默认方向应为 right（包含 slide-in-from-right）', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent closeLabel="关闭">
          <DrawerTitle>右侧抽屉</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    const content = screen.getByRole('dialog');
    expect(content.className).toContain('slide-in-from-right');
  });

  it('side=left 应包含 slide-in-from-left', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent side="left" closeLabel="关闭">
          <DrawerTitle>左侧抽屉</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    const content = screen.getByRole('dialog');
    expect(content.className).toContain('slide-in-from-left');
  });

  it('side=top 应包含 slide-in-from-top', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent side="top" closeLabel="关闭">
          <DrawerTitle>顶部抽屉</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    const content = screen.getByRole('dialog');
    expect(content.className).toContain('slide-in-from-top');
  });

  it('side=bottom 应包含 slide-in-from-bottom', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent side="bottom" closeLabel="关闭">
          <DrawerTitle>底部抽屉</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    const content = screen.getByRole('dialog');
    expect(content.className).toContain('slide-in-from-bottom');
  });

  it('应该渲染关闭按钮 ARIA 标签', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent closeLabel="关闭抽屉">
          <DrawerTitle>标题</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    expect(screen.getByText('关闭抽屉')).toBeDefined();
  });

  it('DrawerFooter 应该渲染', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>打开</DrawerTrigger>
        <DrawerContent closeLabel="关闭">
          <DrawerTitle>标题</DrawerTitle>
          <DrawerFooter>
            <button type="button">保存</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByText('打开'));
    expect(screen.getByText('保存')).toBeDefined();
  });
});
