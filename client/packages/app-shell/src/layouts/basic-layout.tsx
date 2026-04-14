import type { ReactNode } from 'react';

export function BasicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
