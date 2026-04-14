import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">账户</TabsTrigger>
        <TabsTrigger value="password">密码</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground">在此修改账户信息。</p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground">在此修改密码。</p>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">概览</TabsTrigger>
        <TabsTrigger value="tab2">分析</TabsTrigger>
        <TabsTrigger value="tab3">报表</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">概览内容</TabsContent>
      <TabsContent value="tab2">分析内容</TabsContent>
      <TabsContent value="tab3">报表内容</TabsContent>
    </Tabs>
  ),
};
