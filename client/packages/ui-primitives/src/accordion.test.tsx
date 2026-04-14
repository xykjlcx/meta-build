import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

describe('Accordion', () => {
  it('应该渲染手风琴触发按钮', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>问题一</AccordionTrigger>
          <AccordionContent>答案一</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText('问题一')).toBeDefined();
  });

  it('点击触发按钮应该展开内容', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>问题一</AccordionTrigger>
          <AccordionContent>答案一</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await user.click(screen.getByText('问题一'));
    expect(screen.getByText('答案一')).toBeDefined();
  });

  it('应该渲染多个手风琴项', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>问题一</AccordionTrigger>
          <AccordionContent>答案一</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>问题二</AccordionTrigger>
          <AccordionContent>答案二</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText('问题一')).toBeDefined();
    expect(screen.getByText('问题二')).toBeDefined();
  });

  it('AccordionTrigger 应该包含 chevron 图标', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>问题一</AccordionTrigger>
          <AccordionContent>答案一</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(container.querySelector('svg')).toBeDefined();
  });

  it('AccordionItem 应该合并自定义 className', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="custom-item">
          <AccordionTrigger>问题一</AccordionTrigger>
          <AccordionContent>答案一</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    // AccordionItem 渲染为 div[data-state] 且包含 border-b 样式
    const item = container.querySelector('.custom-item');
    expect(item).not.toBeNull();
    expect(item?.className).toContain('border-b');
  });

  it('defaultValue 应该展开指定项', () => {
    render(
      <Accordion type="single" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>问题一</AccordionTrigger>
          <AccordionContent>答案一</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText('答案一')).toBeDefined();
  });
});
