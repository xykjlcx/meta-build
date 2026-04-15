import type { ReactNode } from 'react';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';

interface SidebarLayoutProps {
  children: ReactNode;
  /** 通知插槽，由 L5 注入 NotificationBadge */
  notificationSlot?: ReactNode;
}

/**
 * 侧边栏布局：Sidebar + Header + main 内容区。
 */
export function SidebarLayout({ children, notificationSlot }: SidebarLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header notificationSlot={notificationSlot} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
