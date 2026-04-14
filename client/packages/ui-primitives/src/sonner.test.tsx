import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toaster } from './sonner';

describe('Sonner Toaster', () => {
  it('应该渲染 Toaster 组件', () => {
    const { container } = render(<Toaster />);
    expect(container).toBeDefined();
  });

  it('应该支持 theme 属性', () => {
    const { container } = render(<Toaster theme="light" />);
    expect(container).toBeDefined();
  });

  it('应该支持 position 属性', () => {
    const { container } = render(<Toaster position="top-right" />);
    expect(container).toBeDefined();
  });

  it('应该渲染 toaster group 类', () => {
    const { container } = render(<Toaster data-testid="toaster" />);
    const toaster = container.querySelector('[data-sonner-toaster]');
    expect(toaster).toBeDefined();
  });
});
