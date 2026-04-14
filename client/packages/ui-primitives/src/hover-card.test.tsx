import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

describe('HoverCard', () => {
  it('应该渲染触发元素', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>悬停触发</HoverCardTrigger>
        <HoverCardContent>卡片内容</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('悬停触发')).toBeDefined();
  });

  it('open 状态应该显示内容', () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>触发</HoverCardTrigger>
        <HoverCardContent>悬停卡片内容</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('悬停卡片内容')).toBeDefined();
  });

  it('HoverCardContent 应该包含语义化 token 样式', () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>触发</HoverCardTrigger>
        <HoverCardContent>样式测试</HoverCardContent>
      </HoverCard>,
    );
    const content = screen.getByText('样式测试');
    expect(content.className).toContain('bg-popover');
    expect(content.className).toContain('text-popover-foreground');
  });

  it('应该合并自定义 className', () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>触发</HoverCardTrigger>
        <HoverCardContent className="custom-hover-card">内容</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('内容').className).toContain('custom-hover-card');
  });

  it('应该包含动画类', () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>触发</HoverCardTrigger>
        <HoverCardContent>动画卡片</HoverCardContent>
      </HoverCard>,
    );
    const content = screen.getByText('动画卡片');
    expect(content.className).toContain('data-[state=open]:animate-in');
  });

  it('应该支持自定义 sideOffset', () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>触发</HoverCardTrigger>
        <HoverCardContent sideOffset={8}>偏移卡片</HoverCardContent>
      </HoverCard>,
    );
    expect(screen.getByText('偏移卡片')).toBeDefined();
  });
});
