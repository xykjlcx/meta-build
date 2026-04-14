import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { Toaster, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, ToastViewport, ToastProvider } from './toast';
import { toast, useToast } from './use-toast';

describe('Toast 组件', () => {
  it('ToastProvider + ToastViewport 应该渲染', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>,
    );
    // Viewport 是一个 ol 元素
    const viewport = container.querySelector('ol');
    expect(viewport).not.toBeNull();
  });

  it('Toast 应该包含 default 变体样式', () => {
    const { container } = render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>标题</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const toastEl = screen.getByText('标题').closest('li');
    expect(toastEl?.className).toContain('bg-background');
  });

  it('Toast destructive 变体应包含 destructive 样式', () => {
    render(
      <ToastProvider>
        <Toast open variant="destructive">
          <ToastTitle>错误</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const toastEl = screen.getByText('错误').closest('li');
    expect(toastEl?.className).toContain('destructive');
  });

  it('ToastDescription 应该渲染描述文本', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastDescription>描述内容</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText('描述内容')).toBeDefined();
  });

  it('ToastAction 应该渲染操作按钮', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>标题</ToastTitle>
          <ToastAction altText="撤销操作">撤销</ToastAction>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(screen.getByText('撤销')).toBeDefined();
  });

  it('ToastClose 应该渲染关闭按钮', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>标题</ToastTitle>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    // Close 按钮通过 toast-close 属性标识
    const closeBtn = document.querySelector('[toast-close]');
    expect(closeBtn).not.toBeNull();
  });

  it('应该合并自定义 className', () => {
    render(
      <ToastProvider>
        <Toast open className="custom-toast">
          <ToastTitle>标题</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    const toastEl = screen.getByText('标题').closest('li');
    expect(toastEl?.className).toContain('custom-toast');
  });
});

describe('useToast hook', () => {
  it('toast() 应返回带 id 和 dismiss 的对象', () => {
    let result: ReturnType<typeof toast>;
    act(() => {
      result = toast({ title: '测试' });
    });
    expect(result!.id).toBeDefined();
    expect(typeof result!.dismiss).toBe('function');
  });
});

describe('Toaster', () => {
  it('应该渲染不报错', () => {
    const { container } = render(<Toaster />);
    // Toaster 渲染了 ToastViewport (ol)
    const viewport = container.querySelector('ol');
    expect(viewport).not.toBeNull();
  });
});
