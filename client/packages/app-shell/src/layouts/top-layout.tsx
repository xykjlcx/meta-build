import type { ReactNode } from 'react';
import { TopNav } from '../components/top-nav';

/**
 * 顶部导航布局：TopNav + main 内容区。
 */
export function TopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
