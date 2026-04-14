import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

describe('Dialog', () => {
  it('应该渲染触发按钮', () => {
    render(
      <Dialog>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭">
          <DialogHeader>
            <DialogTitle>标题</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('打开')).toBeDefined();
  });

  it('点击触发按钮应该显示对话框内容', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭">
          <DialogHeader>
            <DialogTitle>标题</DialogTitle>
            <DialogDescription>描述文本</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('打开'));
    expect(screen.getByText('标题')).toBeDefined();
    expect(screen.getByText('描述文本')).toBeDefined();
  });

  it('应该渲染关闭按钮的 ARIA 标签', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭对话框">
          <DialogTitle>标题</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('打开'));
    expect(screen.getByText('关闭对话框')).toBeDefined();
  });

  it('DialogHeader 应该合并自定义 className', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭">
          <DialogHeader className="custom-header">
            <DialogTitle>标题</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('打开'));
    const header = screen.getByText('标题').closest('div');
    expect(header?.className).toContain('custom-header');
  });

  it('DialogFooter 应该渲染', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭">
          <DialogTitle>标题</DialogTitle>
          <DialogFooter>
            <button type="button">确认</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('打开'));
    expect(screen.getByText('确认')).toBeDefined();
  });

  it('defaultOpen 应该直接显示内容', () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>打开</DialogTrigger>
        <DialogContent closeLabel="关闭">
          <DialogTitle>默认打开</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('默认打开')).toBeDefined();
  });

  it('DialogTitle 应该包含正确样式', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent closeLabel="关闭">
          <DialogTitle>样式标题</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const title = screen.getByText('样式标题');
    expect(title.className).toContain('text-lg');
    expect(title.className).toContain('font-semibold');
  });
});
