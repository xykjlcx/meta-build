import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// Radix Tooltip 在 defaultOpen 时会同时渲染视觉 div 和一个 sr-only span（role=tooltip）
// 导致 getByText 匹配到多个元素，需要用 getAllByText 取第一个（视觉元素）

describe('Tooltip', () => {
  it('应该渲染触发元素', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>悬停我</TooltipTrigger>
          <TooltipContent>提示文本</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText('悬停我')).toBeDefined();
  });

  it('TooltipContent 应该包含语义化 token 样式', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>触发</TooltipTrigger>
          <TooltipContent>提示内容</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    // 取第一个匹配元素（视觉 div，带 className）
    const content = screen.getAllByText('提示内容')[0];
    expect(content.className).toContain('bg-popover');
    expect(content.className).toContain('text-popover-foreground');
  });

  it('应该合并自定义 className', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>触发</TooltipTrigger>
          <TooltipContent className="custom-tooltip">内容</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const content = screen.getAllByText('内容')[0];
    expect(content.className).toContain('custom-tooltip');
  });

  it('应该支持 sideOffset 属性', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>触发</TooltipTrigger>
          <TooltipContent sideOffset={10}>偏移提示</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getAllByText('偏移提示').length).toBeGreaterThan(0);
  });

  it('应该包含动画类', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>触发</TooltipTrigger>
          <TooltipContent>动画提示</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const content = screen.getAllByText('动画提示')[0];
    expect(content.className).toContain('animate-in');
  });
});
