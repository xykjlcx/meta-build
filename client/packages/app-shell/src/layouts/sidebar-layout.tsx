import type { ReactNode } from 'react';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';

/**
 * 侧边栏布局：Sidebar + Header + main 内容区。
 */
export function SidebarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
