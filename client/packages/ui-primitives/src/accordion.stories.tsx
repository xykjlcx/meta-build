import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

const meta = {
  title: 'Primitives/Accordion',
  component: Accordion,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>这是可以退款的吗？</AccordionTrigger>
        <AccordionContent>
          是的，可以在购买后 30 天内申请退款。
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>支持哪些支付方式？</AccordionTrigger>
        <AccordionContent>
          支持支付宝、微信支付和银行卡。
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>如何联系客服？</AccordionTrigger>
        <AccordionContent>
          您可以通过工单系统或在线聊天联系我们。
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>第一项</AccordionTrigger>
        <AccordionContent>可以同时展开多项。</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>第二项</AccordionTrigger>
        <AccordionContent>试试同时展开多个。</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
