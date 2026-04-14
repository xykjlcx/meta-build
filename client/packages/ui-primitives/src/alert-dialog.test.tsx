import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

describe('AlertDialog', () => {
  it('应该渲染触发按钮', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText('删除')).toBeDefined();
  });

  it('点击触发按钮应该显示警告内容', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByText('删除'));
    expect(screen.getByText('确认删除')).toBeDefined();
    expect(screen.getByText('此操作不可撤销')).toBeDefined();
  });

  it('应该渲染操作按钮', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>删除</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>确认</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByText('删除'));
    expect(screen.getByText('取消')).toBeDefined();
    expect(screen.getByText('确认删除')).toBeDefined();
  });

  it('AlertDialogAction 应该包含 primary 样式', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>触发</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>标题</AlertDialogTitle>
          <AlertDialogAction>确定</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByText('触发'));
    const action = screen.getByText('确定');
    expect(action.className).toContain('bg-primary');
  });

  it('AlertDialogCancel 应该包含 border 样式', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>触发</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>标题</AlertDialogTitle>
          <AlertDialogCancel>取消</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByText('触发'));
    const cancel = screen.getByText('取消');
    expect(cancel.className).toContain('border');
    expect(cancel.className).toContain('bg-background');
  });

  it('defaultOpen 应该直接显示内容', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>直接打开</AlertDialogTitle>
          <AlertDialogDescription>描述</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText('直接打开')).toBeDefined();
  });

  it('应该合并自定义 className', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>触发</AlertDialogTrigger>
        <AlertDialogContent className="custom-content">
          <AlertDialogTitle>标题</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByText('触发'));
    expect(screen.getByRole('alertdialog').className).toContain('custom-content');
  });
});
