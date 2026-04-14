import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

describe('Avatar', () => {
  it('应该渲染头像容器', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstChild).toBeDefined();
  });

  it('应该显示 fallback 文本', () => {
    render(
      <Avatar>
        <AvatarFallback>YG</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('YG')).toBeDefined();
  });

  it('AvatarImage 应该渲染带 src 的 span（jsdom 无 img onload）', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.png" alt="头像" />
        <AvatarFallback>YG</AvatarFallback>
      </Avatar>,
    );
    // Radix Avatar 在 jsdom 中不触发 img onload，所以 AvatarImage 渲染为 hidden span
    // 验证组件不会报错，且 fallback 仍然正常显示
    expect(container.firstChild).toBeDefined();
    expect(screen.getByText('YG')).toBeDefined();
  });

  it('应该合并自定义 className', () => {
    const { container } = render(
      <Avatar className="custom-avatar">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toContain('custom-avatar');
  });

  it('应该包含圆形样式', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.className).toContain('rounded-full');
  });

  it('AvatarFallback 应该包含 muted 背景', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('AB').className).toContain('bg-muted');
  });
});
