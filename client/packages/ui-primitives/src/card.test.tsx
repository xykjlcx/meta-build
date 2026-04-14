import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

describe('Card', () => {
  it('应该渲染完整卡片结构', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>标题</CardTitle>
          <CardDescription>描述</CardDescription>
        </CardHeader>
        <CardContent>内容</CardContent>
        <CardFooter>底部</CardFooter>
      </Card>,
    );
    expect(screen.getByText('标题')).toBeDefined();
    expect(screen.getByText('描述')).toBeDefined();
    expect(screen.getByText('内容')).toBeDefined();
    expect(screen.getByText('底部')).toBeDefined();
  });

  it('Card 应该包含正确样式', () => {
    render(<Card>内容</Card>);
    const card = screen.getByText('内容');
    expect(card.className).toContain('rounded-lg');
    expect(card.className).toContain('border');
    expect(card.className).toContain('shadow-sm');
  });

  it('应该合并自定义 className', () => {
    render(<Card className="custom-card">内容</Card>);
    expect(screen.getByText('内容').className).toContain('custom-card');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Card ref={ref}>内容</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('CardTitle 应该包含正确样式', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>标题</CardTitle>
        </CardHeader>
      </Card>,
    );
    const title = screen.getByText('标题');
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('font-semibold');
  });

  it('CardDescription 应该包含 muted 样式', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>描述文本</CardDescription>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText('描述文本').className).toContain('text-muted-foreground');
  });

  it('CardFooter 应该包含 flex 样式', () => {
    render(
      <Card>
        <CardFooter>底部</CardFooter>
      </Card>,
    );
    expect(screen.getByText('底部').className).toContain('flex');
  });
});
