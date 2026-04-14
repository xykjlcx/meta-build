import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

describe('Tabs', () => {
  it('应该渲染标签页列表', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">标签一</TabsTrigger>
          <TabsTrigger value="tab2">标签二</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容一</TabsContent>
        <TabsContent value="tab2">内容二</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toBeDefined();
    expect(screen.getByRole('tab', { name: '标签一' })).toBeDefined();
    expect(screen.getByRole('tab', { name: '标签二' })).toBeDefined();
  });

  it('应该默认显示第一个标签内容', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">标签一</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容一</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText('内容一')).toBeDefined();
  });

  it('点击标签应该切换内容', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">标签一</TabsTrigger>
          <TabsTrigger value="tab2">标签二</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容一</TabsContent>
        <TabsContent value="tab2">内容二</TabsContent>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: '标签二' }));
    expect(screen.getByText('内容二')).toBeDefined();
  });

  it('TabsList 应该合并自定义 className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">标签一</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容一</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole('tablist').className).toContain('custom-list');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" ref={ref}>
            标签一
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容一</TabsContent>
      </Tabs>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
