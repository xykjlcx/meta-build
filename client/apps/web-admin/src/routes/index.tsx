import { createFileRoute, redirect } from '@tanstack/react-router';

// 根路径重定向到仪表盘
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});
