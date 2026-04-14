import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

describe('Table', () => {
  it('应该渲染完整表格结构', () => {
    render(
      <Table>
        <TableCaption>表格标题</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>邮箱</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>张三</TableCell>
            <TableCell>zhang@example.com</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>合计</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(screen.getByText('表格标题')).toBeDefined();
    expect(screen.getByText('姓名')).toBeDefined();
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.getByText('合计')).toBeDefined();
  });

  it('TableHead 应该包含正确样式', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>列头</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const th = screen.getByText('列头');
    expect(th.className).toContain('font-medium');
    expect(th.className).toContain('text-foreground');
  });

  it('TableRow 应该包含 hover 样式', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>内容</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const row = screen.getByText('内容').closest('tr');
    expect(row?.className).toContain('hover:bg-muted/50');
  });

  it('应该合并自定义 className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className="custom-row">
            <TableCell className="custom-cell">内容</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('内容').className).toContain('custom-cell');
    expect(screen.getByText('内容').closest('tr')?.className).toContain('custom-row');
  });

  it('应该转发 ref', () => {
    const ref = { current: null as HTMLTableElement | null };
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>内容</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('TableCaption 应该包含 muted 样式', () => {
    render(
      <Table>
        <TableCaption>标题</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>内容</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('标题').className).toContain('text-muted-foreground');
  });

  it('外层应该有 overflow-auto 容器', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>内容</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('overflow-x-auto');
  });
});
