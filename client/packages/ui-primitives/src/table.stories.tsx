import type { Meta, StoryObj } from '@storybook/react';
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

const meta = {
  title: 'Primitives/Table',
  component: Table,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const invoices = [
  { id: 'INV001', status: '已支付', method: '信用卡', amount: 250.0 },
  { id: 'INV002', status: '待处理', method: '支付宝', amount: 150.0 },
  { id: 'INV003', status: '未支付', method: '银行卡', amount: 350.0 },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>近期发票列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">发票号</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>支付方式</TableHead>
          <TableHead className="text-right">金额</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.status}</TableCell>
            <TableCell>{inv.method}</TableCell>
            <TableCell className="text-right">
              ¥{inv.amount.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>合计</TableCell>
          <TableCell className="text-right">
            ¥{invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
